"""Lector único del dinero (js/agenda/dinero.js, 4-nov-2026): cada peso se cuenta una vez aunque esté en «Mis ventas», «Gastos del negocio» e «Ingresos y gastos»."""
from agenda_util import *
from datetime import date
T = Prueba()
hoy = date.today(); mes = hoy.strftime('%Y-%m'); f1 = mes + '-03'; f2 = mes + '-10'
def fmt(f): return f[8:10] + '/' + f[5:7] + '/' + f[:4]   # como se escribe en las fichas
def movs(*l): return {'_fin': {'movs': [dict(id='m%d' % i, f=x[0], t=x[1], c=x[2], d=x[3], v=x[4], m='') for i, x in enumerate(l)]}}
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM, args=['--no-sandbox'])
    def correr(datos, js):
        ctx = contexto(b, 1280, 900, datos=datos, config_abierta=False); pg = abrir(ctx, '', 1800, config=False)
        r = pg.evaluate(js); e = pg.errs; ctx.close(); return r, e
    TOT = "(()=>{const t=window.lrDinero.totalesMes(%d,%d);return [t.entradas,t.gastos,t.utilidad,t.ventasN]})()" % (hoy.year, hoy.month)
    # 1. solo «Mis ventas» y «Gastos del negocio»
    d = {'ag-vt1-fecha': fmt(f1), 'ag-vt1-producto': 'Osito', 'ag-vt1-cliente': 'Ana', 'ag-vt1-precio': '85.000', 'ag-vt1-costo': '20.000', 'ag-gs1-fecha': fmt(f2), 'ag-gs1-categoria': 'Materiales', 'ag-gs1-detalle': 'Lana', 'ag-gs1-valor': '30.000'}
    r, e = correr(d, TOT); T.v('solo fichas: entra 85.000, sale 30.000, queda 55.000, 1 venta', r == [85000, 30000, 55000, 1], r)
    # 2. solo «Ingresos y gastos»
    r, e = correr(movs((f1, 'i', 'Ventas', 'Osito', 85000), (f2, 'g', 'Materiales', 'Lana', 30000), (f2, 'a', '', 'Ahorro', 10000)), TOT)
    T.v('solo movimientos: 85.000 / 30.000 / 55.000 y el ahorro no cuenta como gasto', r == [85000, 30000, 55000, 0], r)
    # 3. lo mismo anotado en dos sitios: cuenta una sola vez
    d3 = dict(d); d3.update(movs((f1, 'i', 'Ventas', 'Osito', 85000), (f2, 'g', 'Materiales', 'Lana', 30000)))
    r, e = correr(d3, TOT); T.v('anotado en dos hojas: cada peso cuenta una sola vez', r == [85000, 30000, 55000, 1], r)
    # 4. el total del día anotado como «Ventas» y las ventas una por una son el mismo dinero; un ingreso de otra categoría sí suma
    d4 = dict(d); d4.update(movs((f1, 'i', 'Ventas', 'Total del día', 60000), (f1, 'i', 'Clases', 'Clase de tejido', 50000)))
    r, e = correr(d4, TOT); T.v('el total del día «Ventas» (menor) no se suma otra vez, pero un ingreso de otra categoría sí (85.000 + 50.000)', r[0] == 135000, r)
    d4b = dict(d); d4b.update(movs((f1, 'i', 'Ventas', 'Total del mes', 900000)))
    r, e = correr(d4b, TOT); T.v('si el total anotado en movimientos es mayor que las fichas, se queda ese (900.000) y no se suman los dos', r[0] == 900000, r)
    # 5. fijos y compras de lana nunca se descartan
    dd = movs((f2, 'g', 'Servicios', 'Internet', 30000)); dd['_fin']['movs'][0]['fijo'] = 1; dd.update({k: v for k, v in d.items() if k.startswith('ag-gs')})
    r, e = correr(dd, TOT); T.v('un pago fijo con el mismo valor que un gasto no se descarta', r[1] == 60000, r)
    # 6. el panel, el planeador, el informe y las metas dan lo mismo
    d6 = dict(d3)
    ctx = contexto(b, 1280, 900, datos=d6, config_abierta=False); pg = abrir(ctx, '', 2200, config=False)
    inf = pg.evaluate("(()=>{const x=window.lrInforme.datos(%d,%d);return [x.ingresos,x.gastos,x.nVentas,x.vTotal]})()" % (hoy.year, hoy.month))
    T.v('el informe del mes coincide (entró 85.000, salió 30.000, 1 venta)', inf == [85000, 30000, 1, 85000], inf)
    mv = pg.evaluate("(()=>{const x=window.lrMetasVentas.calcular(%d,%d);return [x.ventas!==undefined?x.ventas:x.vendido]})()" % (hoy.year, hoy.month))
    T.v('las metas leen 85.000 vendidos', mv[0] == 85000, mv)
    pn = pg.evaluate("(()=>{window.lrIrAHoja('panel-agenda');return new Promise(r=>setTimeout(()=>r(document.getElementById('panel-agenda').innerText),600))})()")
    T.v('el panel muestra 85.000 en ventas y 30.000 en gastos', '85.000' in pn and '30.000' in pn, pn[:200])
    gr = pg.evaluate("window.lrDinero.porMes(6).slice(-1)[0]")
    T.v('el último mes de las gráficas trae 85.000 / 30.000', gr['entradas'] == 85000 and gr['gastos'] == 30000, gr)
    T.v('sin errores de JavaScript', not pg.errs, pg.errs[:2]); ctx.close(); b.close()
T.fin()
