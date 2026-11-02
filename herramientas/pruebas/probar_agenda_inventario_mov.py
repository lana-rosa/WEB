"""Plus etapa 8: movimientos del inventario de lanas (2-nov-2026). Uso: /usr/bin/python3 probar_agenda_inventario_mov.py"""
import json
from agenda_util import *
DATOS = {'ag-l1-marca': 'Alize', 'ag-l1-color': 'Rosa', 'ag-l1-ovillos': '4', 'ag-l1-costo': '$ 8.000',
         'ag-l2-marca': 'Gamitex', 'ag-l2-color': 'Rojo', 'ag-l2-ovillos': '2',
         'ag-f1-proyecto': 'Chaleco de María', 'ag-f1-estado': 'Terminado', 'ag-duena': 'Sara'}
T = Prueba()
def mov(pg): return json.loads(pg.evaluate("localStorage.getItem('rosinaAgenda')") or '{}').get('_lanaMovs', [])
def val(pg, i): return pg.evaluate("document.getElementById('%s').value" % i)
def fichas(pg): pg.evaluate("document.querySelectorAll('#tabla-lanas tr.ficha .ficha-cab').forEach(b => { if (b.getAttribute('aria-expanded') !== 'true') b.click(); })"); pg.wait_for_timeout(500)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM)
    pg = abrir(contexto(b, 1280, 1000, datos=DATOS, config_abierta=False), 'inventario-lanas', 2200, config=False)
    fichas(pg)
    T.v('cada lana con nombre tiene su bloque «Compré o usé ovillos»', pg.locator('#tabla-lanas td.iv-mov').count() == 2)
    f1 = '#tabla-lanas tr.ficha[data-fila="1"] td.iv-mov'
    pg.fill(f1 + ' .iv-mov-n', '2'); pg.fill(f1 + ' .iv-mov-para', 'Manta'); pg.click(f1 + ' button:has-text("Usé")'); pg.wait_for_timeout(500)
    T.v('«Usé 2» deja 2 ovillos y anota el movimiento', val(pg, 'ag-l1-ovillos') == '2' and len(mov(pg)) == 1 and mov(pg)[0]['t'] == 'u' and mov(pg)[0]['para'] == 'Manta', mov(pg))
    pg.fill(f1 + ' .iv-mov-n', '3'); pg.click(f1 + ' button:has-text("Compré")'); pg.wait_for_timeout(500)
    T.v('«Compré 3» sube a 5 y guarda el costo del ovillo', val(pg, 'ag-l1-ovillos') == '5' and mov(pg)[-1]['t'] == 'c' and mov(pg)[-1]['costo'] == 8000, mov(pg))
    pg.fill(f1 + ' .iv-mov-n', '9'); pg.click(f1 + ' button:has-text("Usé")'); pg.wait_for_timeout(300)
    T.v('no deja usar más ovillos de los que hay', val(pg, 'ag-l1-ovillos') == '5' and len(mov(pg)) == 2 and pg.locator(f1 + ' .iv-aviso.mal').is_visible())
    t = pg.inner_text('#inv-resumen')
    T.v('el resumen dice lo del mes: compraste 3 (≈ $ 24.000) y usaste 2', 'compraste 3 ovillo(s) (≈ $ 24.000) y usaste 2 ovillo(s)' in t, t)
    T.v('el historial de la ficha muestra los movimientos', 'usé · Manta' in pg.inner_text(f1) and 'compré' in pg.inner_text(f1), pg.inner_text(f1))
    pg.click(f1 + ' button:has-text("Deshacer")'); pg.wait_for_timeout(500)
    T.v('«Deshacer» revierte la compra (vuelve a 2) y la quita del historial', val(pg, 'ag-l1-ovillos') == '2' and len(mov(pg)) == 1, mov(pg))
    pg.evaluate("window.lrIrAHoja('proyectos-fila')"); pg.wait_for_timeout(600)
    pg.evaluate("document.querySelectorAll('#tabla-fila tr.ficha .ficha-cab').forEach(b => { if (b.getAttribute('aria-expanded') !== 'true') b.click(); })"); pg.wait_for_timeout(500)
    T.v('un proyecto terminado ofrece «¿Gastaste lana en este proyecto?»', pg.locator('#tabla-fila .iv-proy').count() == 1)
    pg.click('#tabla-fila .iv-proy'); pg.wait_for_timeout(900)
    T.v('abre el inventario con el nombre del proyecto en «¿Para qué?»', pg.evaluate("document.querySelector('.hoja-agenda.abierta').id") == 'inventario-lanas' and pg.evaluate("document.querySelector('#tabla-lanas tr.ficha .iv-mov-para').value") == 'Chaleco de María')
    T.v('sin errores de JavaScript', not pg.errs, pg.errs)
    b.close()
T.fin()
