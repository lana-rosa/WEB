"""Lista de compras → inventario de lanas (E34, 12-nov-2026). Uso: /usr/bin/python3 probar_agenda_compras_inventario.py"""
import json
from agenda_util import *
DATOS = {'ag-duena': 'Sara', 'ag-l1-marca': 'Alize', 'ag-l1-color': 'Rosa', 'ag-l1-ovillos': '4', 'ag-l1-costo': '$ 8.000', 'ag-l2-marca': 'Gamitex', 'ag-l2-color': 'Rojo', 'ag-l2-ovillos': '1',
         'ag-c1-material': 'Lana Alize grueso', 'ag-c1-color': 'Rosa', 'ag-c1-cantidad': '2 ovillos', 'ag-c2-material': 'Ojos de seguridad', 'ag-c2-cantidad': '10',
         'ag-c3-material': 'Lana Paraíso', 'ag-c3-color': 'Verde', 'ag-c3-cantidad': '3 ovillos', 'ag-c4-material': 'Lana Alize', 'ag-c4-color': 'Azul', 'ag-c4-cantidad': '1 ovillo', 'ag-c5-material': 'Relleno'}
T = Prueba()
def g(pg): return json.loads(pg.evaluate("localStorage.getItem('rosinaAgenda')") or '{}')
def marcar(pg, k): pg.evaluate("document.getElementById('ag-c%d-comprado').click()" % k); pg.wait_for_timeout(900)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM)
    pg = abrir(contexto(b, 1280, 1000, datos=DATOS, config_abierta=False), 'lista-compras', 2300, config=False)
    pg.evaluate("document.querySelectorAll('#tabla-compras tr.ficha .ficha-cab').forEach(b => { if (b.getAttribute('aria-expanded') !== 'true') b.click(); })"); pg.wait_for_timeout(600)
    C = lambda k: '#tabla-compras tr.ficha[data-fila="%d"] td.cp-inv' % k
    T.v('sin marcar «Comprado» no hay nada del inventario en la ficha', pg.locator(C(1)).count() == 0)
    marcar(pg, 1); d = g(pg)
    T.v('«Comprado» de una lana que coincide suma 2 ovillos: 4 → 6', d['ag-l1-ovillos'] == '6', d.get('ag-l1-ovillos'))
    mv = d['_lanaMovs'][-1]
    T.v('queda como «Compré» con «Lista de compras» y sin gasto', mv['t'] == 'c' and mv['n'] == 2 and mv['para'] == 'Lista de compras' and not mv.get('gasto') and not d.get('_fin', {}).get('movs'), mv)
    T.v('avisa arriba y en la ficha dice «Ya entró» con «Deshacer»', 'Sumé 2 ovillo(s) a Alize · Rosa' in pg.inner_text('.compras-inv-ok') and 'Ya entró al inventario' in pg.inner_text(C(1)) and pg.locator(C(1) + ' button:has-text("Deshacer")').count() == 1)
    marcar(pg, 1); marcar(pg, 1)
    T.v('desmarcar y volver a marcar no suma otra vez', g(pg)['ag-l1-ovillos'] == '6')
    pg.click(C(1) + ' button:has-text("Deshacer")'); pg.wait_for_timeout(900); d = g(pg)
    T.v('«Deshacer» devuelve los ovillos (6 → 4) y borra el movimiento', d['ag-l1-ovillos'] == '4' and 'c1' not in d.get('_compraInv', {}) and not any(m.get('para') == 'Lista de compras' for m in d.get('_lanaMovs', [])), d)
    # sin coincidencia / no es lana
    marcar(pg, 2)
    T.v('un material que no es lana (ojos) no toca el inventario y ofrece «Pasar al inventario»', g(pg)['ag-l1-ovillos'] == '4' and 'ag-l3-marca' not in g(pg) and pg.locator(C(2) + ' button:has-text("Pasar al inventario")').count() == 1)
    marcar(pg, 3)
    T.v('una lana que no está en el inventario tampoco se mueve sola', not g(pg).get('ag-l3-marca') and pg.locator(C(3) + ' button:has-text("Pasar al inventario")').count() == 1 and 'lana nueva' in pg.inner_text(C(3)))
    pg.click(C(3) + ' button:has-text("Pasar al inventario")'); pg.wait_for_timeout(1000); d = g(pg)
    T.v('«Pasar al inventario» crea la lana nueva (Paraíso · Verde) con 3 ovillos y anota el movimiento', d.get('ag-l3-marca') == 'Paraíso' and d.get('ag-l3-color') == 'Verde' and d.get('ag-l3-ovillos') in ('3', '3,0') and d['_lanaMovs'][-1]['n'] == 3, {k: v for k, v in d.items() if k.startswith('ag-l3')})
    T.v('después dice «Ya entró» con «Deshacer»', 'Ya entró' in pg.inner_text(C(3)))
    # parecida con color distinto: no se confunde con Alize · Rosa
    marcar(pg, 4)
    T.v('Alize Azul no se confunde con Alize Rosa (sin coincidencia clara no suma)', g(pg)['ag-l1-ovillos'] == '4' and pg.locator(C(4) + ' button:has-text("Pasar al inventario")').count() == 1)
    marcar(pg, 5)
    T.v('sin cantidad no ofrece nada', pg.locator(C(5)).count() == 0)
    # deshacer lo de una lana nueva deja la fila pero con 0 ovillos
    pg.click(C(3) + ' button:has-text("Deshacer")'); pg.wait_for_timeout(900)
    T.v('deshacer la lana nueva devuelve sus ovillos a 0 y se puede volver a pasar', g(pg).get('ag-l3-ovillos') in ('0', '0,0', '') and pg.locator(C(3) + ' button:has-text("Pasar al inventario")').count() == 1, g(pg).get('ag-l3-ovillos'))
    T.v('sin errores de JavaScript', not pg.errs, pg.errs)
    b.close()
T.fin()
