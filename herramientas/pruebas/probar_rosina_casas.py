#!/usr/bin/env python3
"""Prueba el hub «El universo de Rosina» de cada casa y la barra «Rosina» de las páginas del Rincón.
Uso: con un servidor local en el puerto 8765 (python3 -m http.server 8765): python3 herramientas/pruebas/probar_rosina_casas.py"""
import os, sys
from playwright.sync_api import sync_playwright
CHROMIUM = os.environ.get('CHROMIUM', '/opt/pw-browsers/chromium')
BASE = 'http://localhost:8765'
bien = mal = 0
def v(nombre, ok):
    global bien, mal
    print(('  ok   ' if ok else '  FALLA ') + nombre)
    if ok: bien += 1
    else: mal += 1
HUBS = {'/universo-rosina.html': 'crochet', '/merceria/rosina/': 'merceria', '/academy/rosina/': 'academy'}
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM)
    for w in (1280, 390):
        pg = b.new_page(viewport={'width': w, 'height': 900}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        for ruta, casa in HUBS.items():
            pg.goto(BASE + ruta); pg.wait_for_timeout(700)
            n = f'{casa} {w}px'
            v(f'{n}: la página tiene los colores de su casa', pg.evaluate("document.documentElement.getAttribute('data-casa')") == casa)
            v(f'{n}: el menú resalta «El universo de Rosina» y enlaza al hub de su casa', pg.locator('.nav-principal li.g-universo a').count() == 1)
            v(f'{n}: muestra el material gratis de Rosina', pg.locator('.recursos .recurso').count() >= 5)
            v(f'{n}: sin desplazamiento horizontal', pg.evaluate('document.documentElement.scrollWidth') <= w)
            v(f'{n}: un solo h1', pg.locator('h1').count() == 1)
            if casa != 'crochet': v(f'{n}: no trae el buscador de regalos', pg.locator('#regalar').count() == 0)
        for u in ('glosario-rosina.html', 'paletas-rosina.html', 'calculadoras-rosina.html', 'agenda-rosina.html', 'recursos-rosina.html', 'rosina.html'):
            pg.goto(BASE + '/' + u); pg.wait_for_timeout(500)
            v(f'{u} {w}px: tiene la barra «Rosina» con enlace al hub de su casa y sin desborde',
              pg.locator('.barra-rosina a.br-hub[href="/academy/rosina/"]').count() == 1 and pg.evaluate('document.documentElement.scrollWidth') <= w)
        v(f'sin errores de JavaScript ({w}px)', not errs)
        pg.close()
    pg = b.new_page()
    for casa, destino in (('merceria', '/merceria/rosina/'), ('academy', '/academy/rosina/')):
        pg.goto(BASE + '/universo-rosina.html?casa=' + casa); pg.wait_for_timeout(800)
        v(f'?casa={casa} lleva al hub de esa casa', pg.url.endswith(destino))
    b.close()
print(f'\n{bien} comprobaciones correctas, {mal} con falla.')
sys.exit(1 if mal else 0)
