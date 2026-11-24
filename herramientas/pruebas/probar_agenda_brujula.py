#!/usr/bin/env python3
"""Mi brújula, entrega 1 (23-nov-2026). Uso: con servidor local en 8765:  /usr/bin/python3 herramientas/pruebas/probar_agenda_brujula.py [carpeta_capturas]"""
import sys, json, os, datetime
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from agenda_util import *
T = Prueba(); CAP = sys.argv[1] if len(sys.argv) > 1 else None
def guardado(pg): return json.loads(pg.evaluate("localStorage.getItem('rosinaAgenda') || '{}'"))
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM, args=['--no-sandbox'])
    pg = abrir(contexto(b, 390, 900, datos={'ag-duena': 'Sara'}, config_abierta=False), 'mi-brujula', 2200, config=False)
    T.v('está en el menú de «Fechas y bienestar»', pg.evaluate("[...document.querySelectorAll('#menu-hojas-lista a')].some(a => a.dataset.hoja === 'mi-brujula')"))
    T.v('la hoja muestra la rueda y las metas', pg.locator('#mi-brujula .bj-svg').count() == 1 and pg.locator('#mi-brujula .bj-area').count() == 8)
    for i in range(8):
        pg.locator('.bj-area input[type=range]').nth(i).fill(str(3 + i)); pg.wait_for_timeout(120)
    g = guardado(pg)['_brujula']
    T.v('los 8 valores se guardan', len(g['rueda']) == 8 and g['rueda']['salud'] == 3 and g['rueda']['descanso'] == 10, g)
    T.v('con las 8 llenas señala el área que más cariño necesita (Salud)', 'Salud' in pg.inner_text('.bj-lectura'), pg.inner_text('.bj-lectura'))
    pg.fill('#bj-q', 'Vender 20 amigurumis'); pg.fill('#bj-m', 'Pedidos entregados'); pg.fill('#bj-h', 'Publicar 3 veces'); pg.fill('#bj-f', '2020-01-01'); pg.click('.bj-form button[type=submit]'); pg.wait_for_timeout(200)
    g = guardado(pg)['_brujula']
    T.v('una meta SMART se guarda', len(g['metas']) == 1 and g['metas'][0]['q'] == 'Vender 20 amigurumis' and g['metas'][0]['f'] == '2020-01-01', g)
    T.v('una meta con fecha pasada avisa', pg.locator('.bj-meta-l.vencida').count() == 1)
    pg.check('.bj-meta-cab input'); pg.wait_for_timeout(200)
    T.v('se marca cumplida y ya no avisa', guardado(pg)['_brujula']['metas'][0]['ok'] is True and pg.locator('.bj-meta-l.vencida').count() == 0)
    if CAP: os.makedirs(CAP, exist_ok=True); pg.screenshot(path=os.path.join(CAP, 'brujula-390.png'), full_page=False)
    pg.click('.bj-quitar'); pg.wait_for_timeout(200)
    T.v('quitar la meta la borra', guardado(pg)['_brujula']['metas'] == [])
    T.v('sin desplazamiento horizontal (390)', pg.evaluate('document.documentElement.scrollWidth <= innerWidth'))
    T.v('sin errores de JavaScript', not pg.errs, pg.errs)
    pg2 = abrir(contexto(b, 1280, 800, datos={'ag-duena': 'Sara'}, config_abierta=False), 'mi-brujula', 2200, config=False)
    if CAP: pg2.screenshot(path=os.path.join(CAP, 'brujula-1280.png'))
    T.v('sin desplazamiento horizontal (1280)', pg2.evaluate('document.documentElement.scrollWidth <= innerWidth'))
    b.close()
T.fin()
