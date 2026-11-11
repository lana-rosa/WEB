"""Abonos de cada pedido (E34, 11-nov-2026). Uso: /usr/bin/python3 probar_agenda_abonos.py"""
import json
from agenda_util import *
DATOS = {'ag-p1-cliente': 'Ana', 'ag-p1-pedido': 'Osito', 'ag-p1-totalcompra': '$ 80.000', 'ag-p1-abono': '$ 30.000', 'ag-p1-estado': 'En proceso', 'ag-p2-cliente': 'Beto', 'ag-duena': 'Sara'}
T = Prueba()
def guardado(pg):
    g = json.loads(pg.evaluate("localStorage.getItem('rosinaAgenda')") or '{}')
    for k in ('ag-p1-abono', 'ag-p1-saldo'):
        if k in g: g[k] = g[k].replace(' ', '')
    return g
def abrir_fichas(pg): pg.evaluate("document.querySelectorAll('#tabla-pedidos tr.ficha .ficha-cab').forEach(b => { if (b.getAttribute('aria-expanded') !== 'true') b.click(); })"); pg.wait_for_timeout(500)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM)
    pg = abrir(contexto(b, 1280, 1000, datos=DATOS, config_abierta=False), 'control-pedidos', 2200, config=False)
    abrir_fichas(pg)
    f1 = '#tabla-pedidos tr.ficha[data-fila="1"] td.pd-abonos'; f2 = '#tabla-pedidos tr.ficha[data-fila="2"] td.pd-abonos'; f3 = '#tabla-pedidos tr.ficha[data-fila="3"] td.pd-abonos'
    T.v('los pedidos con datos tienen «Pagos de este pedido»; el vacío no', pg.locator(f1).count() == 1 and pg.locator(f2).count() == 1 and pg.locator(f3).count() == 0)
    t = pg.inner_text(f1)
    T.v('muestra abonado, total y lo que falta, y el anticipo ya escrito', 'Abonado $30.000 de $80.000' in t and 'Falta $50.000' in t and 'Anticipo anotado: $30.000' in t, t)
    T.v('sin total, el pedido 2 pide escribir el total', 'total de la compra' in pg.inner_text(f2) and pg.locator(f2 + ' button:has-text("Registrar")').count() == 1)
    pg.fill(f1 + ' .pd-valor', '20.000'); pg.click(f1 + ' button:has-text("Registrar abono")'); pg.wait_for_timeout(700)
    g = guardado(pg)
    T.v('registrar 20.000 → el campo Abono queda en $50.000 y el saldo en $30.000', g['ag-p1-abono'] == '$50.000' and g['ag-p1-saldo'] == '$30.000', (g.get('ag-p1-abono'), g.get('ag-p1-saldo')))
    T.v('el abono queda en la lista con su fecha', len(g['_abonos']['p1']) == 1 and g['_abonos']['p1'][0]['v'] == 20000 and g['_abonos']['p1'][0]['f'], g.get('_abonos'))
    t = pg.inner_text(f1)
    T.v('la ficha muestra «Falta $30.000»', 'Falta $30.000' in t and 'Anticipo anotado: $30.000' in t, t)
    # tope
    pg.fill(f1 + ' .pd-valor', '40.000'); pg.click(f1 + ' button:has-text("Registrar abono")'); pg.wait_for_timeout(500)
    T.v('no deja abonar más de lo que falta y avisa', pg.locator(f1 + ' .iv-aviso.mal').is_visible() and guardado(pg)['ag-p1-abono'] == '$50.000', pg.inner_text(f1))
    pg.fill(f1 + ' .pd-valor', ''); pg.click(f1 + ' button:has-text("Registrar abono")'); pg.wait_for_timeout(400)
    T.v('un valor vacío tampoco se registra', len(guardado(pg)['_abonos']['p1']) == 1)
    # poner lo que falta → pagado completo
    pg.click(f1 + ' button:has-text("Poner lo que falta")'); pg.click(f1 + ' button:has-text("Registrar abono")'); pg.wait_for_timeout(700)
    g = guardado(pg); t = pg.inner_text(f1)
    T.v('«Poner lo que falta» deja el pedido pagado completo', g['ag-p1-abono'] == '$80.000' and g['ag-p1-saldo'] == '$0' and 'Pagado completo' in t and pg.locator(f1 + ' .pd-valor').count() == 0, (g.get('ag-p1-abono'), t))
    T.v('el chip de la ficha dice «Pagado»', 'Pagado' in pg.inner_text('#tabla-pedidos tr.ficha[data-fila="1"] .ficha-meta'))
    # quitar un abono
    pg.click(f1 + ' .pd-lista li:nth-of-type(3) button'); pg.wait_for_timeout(700)
    g = guardado(pg)
    T.v('quitar el último abono (30.000) lo resta del total: queda $50.000 y vuelve a faltar', g['ag-p1-abono'] == '$50.000' and len(g['_abonos']['p1']) == 1 and pg.locator(f1 + ' .pd-valor').count() == 1, (g.get('ag-p1-abono'), g.get('_abonos')))
    # Mi panel lee el abono
    pg.evaluate("window.lrIrAHoja('panel-agenda')"); pg.wait_for_timeout(1200)
    T.v('Mi panel sigue calculando lo que falta por cobrar (80.000 − 50.000)', '30.000' in pg.inner_text('.pn-kpis'), pg.inner_text('.pn-kpis'))
    # abono escrito a mano mayor que el total
    pg.evaluate("window.lrIrAHoja('control-pedidos')"); pg.wait_for_timeout(600); abrir_fichas(pg)
    pg.fill('#ag-p1-abono', '$ 90.000'); pg.wait_for_timeout(900)
    T.v('si escriben a mano un abono mayor que el total, avisa', 'mayor que el total' in pg.inner_text(f1), pg.inner_text(f1))
    # vaciar el pedido borra su lista
    pg.fill('#ag-p2-cliente', ''); pg.wait_for_timeout(800)
    T.v('un pedido vacío no deja lista guardada', 'p2' not in guardado(pg).get('_abonos', {}))
    T.v('sin errores de JavaScript', not pg.errs, pg.errs)
    b.close()
T.fin()
