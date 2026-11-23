#!/usr/bin/env python3
"""Mis hábitos y agua (23-nov-2026). Uso: con servidor local en 8765:  /usr/bin/python3 herramientas/pruebas/probar_agenda_habitos.py [carpeta_capturas]"""
import sys, json, os, datetime
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from agenda_util import *
T = Prueba(); CAP = sys.argv[1] if len(sys.argv) > 1 else None
def guardado(pg): return json.loads(pg.evaluate("localStorage.getItem('rosinaAgenda') || '{}'"))
hoy = datetime.date.today()
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM, args=['--no-sandbox'])
    pg = abrir(contexto(b, 390, 900, datos={'ag-duena': 'Sara'}, config_abierta=False), 'registro-pausas', 2200, config=False)
    T.v('la hoja trae «Mis hábitos y agua»', pg.locator('#registro-pausas .hb-raiz .hb-tarjeta').count() == 2)
    pg.click('.hb-vaso >> nth=2'); pg.wait_for_timeout(200)
    T.v('tocar el 3.er vaso marca 3 y guarda', pg.locator('.hb-vaso.lleno').count() == 3 and guardado(pg)['_habitos']['agua'][hoy.isoformat()] == 3, guardado(pg).get('_habitos'))
    pg.click('.hb-vaso >> nth=2'); pg.wait_for_timeout(200)
    T.v('tocar el último vaso marcado lo quita (2)', pg.locator('.hb-vaso.lleno').count() == 2)
    pg.fill('.hb-meta input', '10'); pg.press('.hb-meta input', 'Tab'); pg.wait_for_timeout(200)
    T.v('la meta cambia a 10 vasos', pg.locator('.hb-vaso').count() == 10 and guardado(pg)['_habitos']['meta'] == 10)
    pg.click('.hb-chip >> nth=0'); pg.wait_for_timeout(200)
    T.v('un hábito sugerido se agrega', pg.locator('.hb-fila').count() == 1 and len(guardado(pg)['_habitos']['lista']) == 1)
    pg.fill('.hb-nuevo input', 'Beber té'); pg.press('.hb-nuevo input', 'Enter'); pg.wait_for_timeout(200)
    T.v('se escribe otro hábito', pg.locator('.hb-fila').count() == 2)
    dia = '.hb-fila >> nth=0 >> .hb-dia.hoy'
    pg.click(dia); pg.wait_for_timeout(200)
    g = guardado(pg)['_habitos']
    T.v('marcar hoy guarda la marca', len(g['marcas'].get(hoy.isoformat(), [])) == 1, g)
    T.v('los días futuros están desactivados', hoy.day == 31 or pg.locator('.hb-fila >> nth=0 >> .hb-dia[disabled]').count() == (__import__('calendar').monthrange(hoy.year, hoy.month)[1] - hoy.day))
    if CAP: os.makedirs(CAP, exist_ok=True); pg.locator('.hb-raiz').screenshot(path=os.path.join(CAP, 'habitos-390.png'))
    pg.click('.hb-quitar >> nth=0'); pg.wait_for_timeout(200)
    g = guardado(pg)['_habitos']
    T.v('quitar un hábito borra también sus marcas', len(g['lista']) == 1 and not g['marcas'], g)
    pg.click('.hb-flecha >> nth=0'); pg.wait_for_timeout(200)
    T.v('el mes anterior se puede ver', pg.locator('.hb-fila .hb-dia[disabled]').count() == 0)
    T.v('sin desplazamiento horizontal', pg.evaluate('document.documentElement.scrollWidth <= innerWidth'))
    T.v('sin errores de JavaScript', not pg.errs, pg.errs)
    pg2 = abrir(contexto(b, 1280, 800, datos={'ag-duena': 'Sara'}, config_abierta=False), 'registro-pausas', 2200, config=False)
    T.v('en 1280 px sin desplazamiento horizontal', pg2.evaluate('document.documentElement.scrollWidth <= innerWidth'))
    b.close()
T.fin()
