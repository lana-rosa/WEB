"""Excel de las finanzas del negocio (3-nov-2026): presupuesto, metas, planes, gastos fijos, deudas, tarjetas y pagos a tarjetas salen en el libro, con importes como pesos
y fechas reales, y con la membresía vencida NO salen (candado). Uso: /usr/bin/python3 herramientas/pruebas/probar_agenda_excel_finanzas.py (servidor local 8765)"""
import sys, json, shutil, datetime; sys.path.insert(0, __file__.rsplit('/', 1)[0])
from agenda_util import *
import openpyxl
T = Prueba()
FIN = {'movs': [{'f': '2026-10-05', 't': 'i', 'c': 'Ventas', 'd': 'Osito', 'v': 170000, 'm': 'Nequi'}],
       'pres': {'Materiales (lanas)': 300000, 'Empaques': 50000, 'Publicidad': 0},
       'metas': [{'n': 'Máquina de coser', 'meta': 1200000, 'ahorrado': 300000, 'fecha': '2027-03-01'}, {'n': '', 'meta': '', 'ahorrado': '', 'fecha': ''}],
       'planes': [{'n': 'Feria de diciembre', 'mes': '12', 'costo': 250000, 'listo': False}],
       'fijos': [{'id': 'a', 'n': 'Internet', 'v': 80000, 'dia': 5, 't': 'g', 's': False, 'c': 'Servicios', 'm': 'Nequi', 'activo': True}, {'id': 'b', 'n': 'Canva', 'v': 45000, 'dia': 12, 't': 'g', 's': True, 'c': 'Software', 'm': '', 'activo': False}],
       'deudas': [{'id': 'd', 'n': 'Máquina overlock', 'cuota': 150000, 'cuotas': 10, 'pagadas': 4, 'dia': 15}],
       'tarjetas': [{'id': 't1', 'n': 'Visa negocio', 'cupo': 2000000, 'saldo0': 300000, 'corte': 20, 'pago': 5}],
       'pagosT': [{'id': 'p', 't': 't1', 'f': '2026-10-28', 'v': 100000}]}
def estado(activa):
    f = lambda d: (datetime.datetime.utcnow() + datetime.timedelta(days=d)).strftime('%Y-%m-%dT%H:%M:%SZ')
    return {'activa': True, 'plan': 'anual', 'vence': f(200), 'prueba_hasta': f(-30), 'en_prueba': False} if activa else {'activa': False, 'en_prueba': False, 'dias_prueba': 7, 'prueba_hasta': f(-1)}
def correr(b, activa):
    ctx = contexto(b, 1280, 900, datos={'ag-duena': 'Sara', '_fin': FIN})
    ctx.route('**/rest/v1/rpc/mi_membresia', lambda r: r.fulfill(status=200, content_type='application/json', body=json.dumps(estado(activa))))
    pg = abrir(ctx, '', 2200)
    with pg.expect_download(timeout=15000) as dl: pg.click('#agenda-excel')
    ruta = '/tmp/agenda-fin-%s.xlsx' % activa; shutil.copy(dl.value.path(), ruta); wb = openpyxl.load_workbook(ruta)
    errs = pg.errs; ctx.close(); return wb, errs
NUEVAS = ['Presupuesto mensual', 'Metas de ahorro del negocio', 'Planes del negocio', 'Gastos fijos del negocio', 'Deudas del negocio', 'Tarjetas del negocio', 'Pagos a tarjetas']
def filas(wb, n): return [[c.value for c in r] for r in wb[n].iter_rows()]
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM, args=['--no-sandbox'])
    wb, errs = correr(b, True)
    T.v('con membresía salen todas las hojas de finanzas', all(n in wb.sheetnames for n in NUEVAS + ['Ingresos y gastos del negocio']), wb.sheetnames)
    pr = filas(wb, 'Presupuesto mensual'); T.v('presupuesto: solo categorías con valor, en pesos', pr[1:] == [['Materiales (lanas)', 300000], ['Empaques', 50000]] and '$' in wb['Presupuesto mensual']['B2'].number_format, pr)
    me = filas(wb, 'Metas de ahorro del negocio'); T.v('metas: una fila (la vacía no sale), con lo que falta y fecha real', len(me) == 2 and me[1][0] == 'Máquina de coser' and me[1][3] == 900000 and isinstance(me[1][4], datetime.datetime), me)
    pl = filas(wb, 'Planes del negocio'); T.v('planes: mes en palabras y cumplido Sí/No', pl[1] == ['Feria de diciembre', 'Diciembre', 250000, 'No'], pl)
    fj = filas(wb, 'Gastos fijos del negocio'); T.v('gastos fijos: tipo y estado en palabras, día como número simple', fj[1][3] == 'Gasto fijo' and fj[2][3] == 'Suscripción' and fj[2][6] == 'En pausa' and fj[1][2] == 5 and wb['Gastos fijos del negocio']['C2'].number_format == 'General', fj)
    de = filas(wb, 'Deudas del negocio'); T.v('deudas: pagos hechos, faltan y saldo por pagar', de[1][2:5] == [10, 4, 6] and de[1][6] == 900000, de)
    ta = filas(wb, 'Tarjetas del negocio'); T.v('tarjetas: cupo y saldo inicial en pesos, día de corte y límite', ta[1] == ['Visa negocio', 2000000, 300000, 20, 5], ta)
    pt = filas(wb, 'Pagos a tarjetas'); T.v('pagos a tarjetas: fecha real, nombre de la tarjeta y valor', isinstance(pt[1][0], datetime.datetime) and pt[1][1] == 'Visa negocio' and pt[1][2] == 100000, pt)
    T.v('sin errores de JavaScript', not errs, errs)
    wb, errs = correr(b, False)
    T.v('con la membresía vencida NO sale ninguna hoja de finanzas (candado)', not any(n in wb.sheetnames for n in NUEVAS + ['Ingresos y gastos del negocio']), wb.sheetnames)
T.fin()
