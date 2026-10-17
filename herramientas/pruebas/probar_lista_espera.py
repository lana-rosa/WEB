#!/usr/bin/env python3
"""Prueba la lista de espera de los talleres (js/lista-espera.js) en las tres páginas que la tienen.
Uso: con un servidor local en el puerto 8765: python3 herramientas/pruebas/probar_lista_espera.py"""
import json, os, sys
from playwright.sync_api import sync_playwright
CHROMIUM = os.environ.get('CHROMIUM', '/opt/pw-browsers/chromium')
BASE = 'http://localhost:8765'
bien = mal = 0
def v(n, ok):
    global bien, mal
    print(('  ok   ' if ok else '  FALLA ') + n); bien += ok; mal += (not ok)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM)
    for u in ('/aprende.html', '/academy/', '/academy/talleres/'):
        ctx = b.new_context(); pg = ctx.new_page(); errs = []; envios = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        def rpc(r):
            envios.append(json.loads(r.request.post_data or '{}')); r.fulfill(status=204, body='')
        ctx.route('**/rest/v1/rpc/unirme_lista_espera_taller*', rpc)
        pg.goto(BASE + u); pg.wait_for_timeout(1200)
        boton = pg.locator('a[data-lista-espera]').first
        v(f'{u}: el botón dice «Unirme a la lista de espera»', boton.inner_text().strip() == 'Unirme a la lista de espera')
        v(f'{u}: sin JavaScript el botón sigue yendo a WhatsApp', 'wa.me' in (boton.get_attribute('href') or ''))
        boton.click(); pg.wait_for_timeout(500)
        v(f'{u}: se abre la ventana', pg.locator('.le-caja').is_visible())
        pg.locator('.le-caja button[type=submit]').click(); pg.wait_for_timeout(300)
        v(f'{u}: sin datos no envía y avisa', len(envios) == 0 and pg.locator('.le-aviso').is_visible())
        pg.fill('#le-nombre', 'Ana Pérez'); pg.fill('#le-tel', '3001234567'); pg.fill('#le-personas', '2')
        pg.locator('.le-caja button[type=submit]').click(); pg.wait_for_timeout(300)
        v(f'{u}: sin aceptar los datos no envía', len(envios) == 0)
        pg.check('#le-acepto'); pg.locator('.le-caja button[type=submit]').click(); pg.wait_for_timeout(800)
        v(f'{u}: envía los datos con la autorización', len(envios) == 1 and envios[0].get('p_acepta_datos') is True and envios[0].get('p_telefono') == '3001234567' and envios[0].get('p_personas') == 2)
        v(f'{u}: muestra la confirmación', 'estás en la lista' in pg.inner_text('.le-caja'))
        v(f'{u}: sin errores de JavaScript', not errs)
        ctx.close()
    b.close()
print(f'\n{bien} comprobaciones correctas, {mal} con falla.')
sys.exit(1 if mal else 0)
