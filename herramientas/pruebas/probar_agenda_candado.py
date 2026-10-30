"""Prueba el candado firme de la membresía: con la membresía vencida, las hojas bloqueadas no salen en Excel ni en los eventos de calendario (30-oct-2026, decisión de Sara)."""
import sys, json, shutil; sys.path.insert(0, __file__.rsplit('/', 1)[0])
from agenda_util import *
import openpyxl
T = Prueba()
D = {'ag-p1-cliente': 'Ana', 'ag-p1-pedido': 'Osito', 'ag-p1-entrega': '20/11/2026', 'ag-p1-valorunidad': '85000', 'ag-vt1-fecha': '10/10/2026', 'ag-vt1-producto': 'Osito', 'ag-vt1-precio': '$ 170.000',
     'ag-f1-proyecto': 'Bufanda', 'ag-f1-para': 'Mamá', 'ag-f1-fecha': '15/12/2026', 'ag-f1-estado': 'Tejiendo',
     '_fin': {'movs': [{'f': '2026-10-05', 't': 'i', 'c': 'Ventas', 'd': 'Osito', 'v': 170000, 'm': 'Nequi'}]}}
def estado(activa, en_prueba):
    import datetime
    f = lambda d: (datetime.datetime.utcnow() + datetime.timedelta(days=d)).strftime('%Y-%m-%dT%H:%M:%SZ')
    if activa: return {'activa': True, 'plan': 'anual', 'vence': f(200), 'prueba_hasta': f(-30), 'en_prueba': False}
    return {'activa': False, 'en_prueba': en_prueba, 'dias_prueba': 7, 'prueba_hasta': f(4.5) if en_prueba else f(-1)}
def correr(b, est, esperar):
    ctx = contexto(b, 1280, 900, datos=D)
    ctx.route('**/rest/v1/rpc/mi_membresia', lambda r: r.fulfill(status=200, content_type='application/json', body=json.dumps(est)))
    pg = abrir(ctx, '', 2200)
    ev = pg.evaluate("window.lrAgenda.eventos().map(e => e.titulo || e.title || JSON.stringify(e)).join(' | ')")
    bloq = pg.evaluate("document.getElementById('control-pedidos').classList.contains('sin-membresia')")
    with pg.expect_download(timeout=15000) as dl: pg.click('#agenda-excel')
    ruta = '/tmp/agenda-candado.xlsx'; shutil.copy(dl.value.path(), ruta); hojas = openpyxl.load_workbook(ruta).sheetnames
    ctx.close(); return bloq, ev, hojas
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM, args=['--no-sandbox'])
    bloq, ev, hojas = correr(b, estado(False, False), False)
    T.v('membresía vencida: la hoja de pedidos está bloqueada', bloq)
    T.v('Excel NO incluye pedidos, ventas ni finanzas (hojas bloqueadas)', not any(h in hojas for h in ('Control de pedidos', 'Mis ventas del mes', 'Ingresos y gastos del negocio')), hojas)
    T.v('Excel SÍ incluye las hojas gratis con datos (Proyectos por tejer)', 'Proyectos por tejer' in hojas, hojas)
    T.v('los eventos de calendario no traen la entrega del pedido pero sí el proyecto', 'Osito' not in ev and 'Bufanda' in ev, ev)
    bloq, ev, hojas = correr(b, estado(True, False), True)
    T.v('con membresía activa todo se exporta: pedidos, ventas, finanzas y proyectos', not bloq and all(h in hojas for h in ('Control de pedidos', 'Mis ventas del mes', 'Ingresos y gastos del negocio', 'Proyectos por tejer')), hojas)
    T.v('con membresía activa el calendario trae la entrega del pedido', 'Osito' in ev and 'Bufanda' in ev, ev)
    bloq, ev, hojas = correr(b, estado(False, True), True)
    T.v('durante la prueba gratis tampoco se limita nada', not bloq and 'Control de pedidos' in hojas and 'Osito' in ev)
    b.close()
T.fin()
