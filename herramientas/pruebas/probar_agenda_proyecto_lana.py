"""Plus: lana por proyecto (2-nov-2026). Uso: /usr/bin/python3 probar_agenda_proyecto_lana.py"""
import json
from agenda_util import *
DATOS = {'ag-l1-marca': 'Alize', 'ag-l1-color': 'Rosa', 'ag-l1-ovillos': '4', 'ag-l2-marca': 'Gamitex', 'ag-l2-color': 'Rojo', 'ag-l2-ovillos': '1',
         'ag-f1-proyecto': 'Chaleco de María', 'ag-f1-estado': 'Tejiendo', 'ag-duena': 'Sara'}
T = Prueba()
def guardado(pg): return json.loads(pg.evaluate("localStorage.getItem('rosinaAgenda')") or '{}')
def abrir_fichas(pg): pg.evaluate("document.querySelectorAll('#tabla-fila tr.ficha .ficha-cab').forEach(b => { if (b.getAttribute('aria-expanded') !== 'true') b.click(); })"); pg.wait_for_timeout(500)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM)
    pg = abrir(contexto(b, 1280, 1000, datos=DATOS, config_abierta=False), 'proyectos-fila', 2200, config=False)
    abrir_fichas(pg)
    f = '#tabla-fila tr.ficha[data-fila="1"] td.pl-lana'
    T.v('el proyecto con nombre tiene «Lana de este proyecto» con las lanas del inventario', pg.locator(f).count() == 1 and pg.locator(f + ' select option').count() == 2)
    pg.select_option(f + ' select', 'Alize · Rosa'); pg.fill(f + ' .pl-n', '3'); pg.click(f + ' button:has-text("Agregar a la lista")'); pg.wait_for_timeout(500)
    pl = guardado(pg).get('_proyLana', {})
    T.v('agrega 3 ovillos de Alize · Rosa a la lista del proyecto', pl.get('chaleco de maria', [{}])[0].get('n') == 3, pl)
    T.v('mientras no esté terminado no ofrece descontar', pg.locator(f + ' button:has-text("Descontar")').count() == 0 and 'Terminado' in pg.inner_text(f))
    pg.select_option('#ag-f1-estado', 'Terminado'); pg.wait_for_timeout(700)
    T.v('al terminar el proyecto aparece «Descontar del inventario»', pg.locator(f + ' button:has-text("Descontar")').count() == 1)
    pg.click(f + ' button:has-text("Descontar")'); pg.wait_for_timeout(700)
    g = guardado(pg)
    T.v('descuenta: Alize · Rosa pasa de 4 a 1 ovillos y queda como «Usé» con el proyecto', g.get('ag-l1-ovillos') == '1' and g['_lanaMovs'][-1]['t'] == 'u' and 'Chaleco' in g['_lanaMovs'][-1]['para'], g.get('ag-l1-ovillos'))
    T.v('la lista marca lo descontado', g['_proyLana']['chaleco de maria'][0]['hecho'] is True and 'descontada' in pg.inner_text(f))
    # no alcanza
    pg.select_option(f + ' select', 'Gamitex · Rojo'); pg.fill(f + ' .pl-n', '5'); pg.click(f + ' button:has-text("Agregar a la lista")'); pg.wait_for_timeout(500)
    pg.click(f + ' button:has-text("Descontar")'); pg.wait_for_timeout(500)
    T.v('si no alcanzan los ovillos avisa y no descuenta', pg.locator(f + ' .iv-aviso.mal').is_visible() and guardado(pg).get('ag-l2-ovillos') == '1')
    pg.click(f + ' li:not(.hecho) button'); pg.wait_for_timeout(500)
    T.v('se puede quitar una lana de la lista antes de descontarla', len(guardado(pg)['_proyLana']['chaleco de maria']) == 1)
    T.v('sin errores de JavaScript', not pg.errs, pg.errs)
    b.close()
T.fin()
