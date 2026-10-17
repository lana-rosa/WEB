#!/usr/bin/env python3
"""Prueba que las fotos de Personaliza y de la ficha de la tienda se amplían al tocarlas (js/ampliar.js).
Uso: con un servidor local en el puerto 8765: python3 herramientas/pruebas/probar_ampliar.py"""
import os, sys
from playwright.sync_api import sync_playwright
CHROMIUM = os.environ.get('CHROMIUM', '/opt/pw-browsers/chromium')
BASE = 'http://localhost:8765'
bien = mal = 0
def v(n, ok):
    global bien, mal
    print(('  ok   ' if ok else '  FALLA ') + n); bien += ok; mal += (not ok)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM)
    for w in (390, 1280):
        pg = b.new_page(viewport={'width': w, 'height': 900}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(BASE + '/personaliza.html'); pg.wait_for_timeout(1500)
        for sel, nombre in (('#carrusel-foto img', 'De la foto al amigurumi'), ('#carrusel-otros img', 'Otros personalizados')):
            pg.locator(sel).first.scroll_into_view_if_needed(); pg.locator(sel).first.click(); pg.wait_for_timeout(300)
            v(f'{w}px {nombre}: al tocar la foto se agranda', pg.locator('.amp-fondo img').is_visible())
            primera = pg.get_attribute('.amp-fondo img', 'src')
            pg.keyboard.press('ArrowRight'); pg.wait_for_timeout(150)
            v(f'{w}px {nombre}: la flecha pasa a la siguiente foto', pg.get_attribute('.amp-fondo img', 'src') != primera)
            pg.keyboard.press('Escape'); pg.wait_for_timeout(150)
            v(f'{w}px {nombre}: Escape la cierra', pg.locator('.amp-fondo').count() == 0)
        pg.locator('.det-tamanos summary').click(); pg.locator('.galeria-tamanos-personalizado img').first.click(); pg.wait_for_timeout(300)
        v(f'{w}px tamaños de referencia: se agranda', pg.locator('.amp-fondo img').is_visible())
        pg.locator('.amp-cerrar').click(); pg.wait_for_timeout(150)
        v(f'{w}px el botón Cerrar funciona', pg.locator('.amp-fondo').count() == 0)
        v(f'{w}px sin desplazamiento horizontal', pg.evaluate('document.documentElement.scrollWidth') <= w)
        v(f'{w}px sin errores de JavaScript', not errs)
        # ficha de la tienda: se arma una ficha de prueba (el catálogo viene de la base de datos)
        pt = b.new_page(viewport={'width': w, 'height': 900}); pt.goto(BASE + '/tienda.html'); pt.wait_for_timeout(1500)
        pt.evaluate("""() => { document.getElementById('overlay-modal-producto').classList.add('abierto');
          document.getElementById('modal-foto-principal').src = '/img/personalizado-13cm.webp';
          const m = document.getElementById('modal-miniaturas'); ['/img/personalizado-13cm.webp','/img/personalizado-15cm.webp'].forEach(s => { const i = document.createElement('img'); i.src = s; i.alt = 'Foto de prueba'; m.appendChild(i); }); }""")
        pt.wait_for_timeout(300)
        pt.locator('#modal-foto-principal').click(); pt.wait_for_timeout(300)
        v(f'{w}px tienda: la foto de la ficha se agranda', pt.locator('.amp-fondo img').is_visible())
        v(f'{w}px tienda: se puede pasar a las otras fotos del producto', pt.locator('.amp-sig').count() == 1)
        pt.keyboard.press('Escape')
        pg.close(); pt.close()
    b.close()
print(f'\n{bien} comprobaciones correctas, {mal} con falla.')
sys.exit(1 if mal else 0)
