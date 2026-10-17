#!/usr/bin/env python3
"""Prueba la puerta de descargas de los recursos de Rosina (js/suscripcion.js) y la casilla opcional de novedades de /cuenta.html.
Uso: con un servidor local en el puerto 8765: python3 herramientas/pruebas/probar_suscripcion.py"""
import json, os, sys, time
from playwright.sync_api import sync_playwright
CHROMIUM = os.environ.get('CHROMIUM', '/opt/pw-browsers/chromium')
BASE = 'http://localhost:8765'
bien = mal = 0
def v(n, ok):
    global bien, mal
    print(('  ok   ' if ok else '  FALLA ') + n); bien += ok; mal += (not ok)
SESION = json.dumps({'access_token': 'x', 'refresh_token': 'x', 'expires_at': int(time.time()) + 36000, 'expires_in': 36000, 'token_type': 'bearer',
                     'user': {'id': '00000000-0000-0000-0000-000000000001', 'email': 'a@b.co', 'aud': 'authenticated'}})
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM)
    # 1) sin cuenta: se abre la ventana y no se descarga nada
    ctx = b.new_context(accept_downloads=True); pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(BASE + '/recursos-rosina.html'); pg.wait_for_timeout(1200)
    v('muestra el aviso de que las descargas son gratis con cuenta', pg.locator('#aviso-suscripcion').is_visible())
    bajadas = []; pg.on('download', lambda d: bajadas.append(d))
    pg.evaluate("window.dataLayer = window.dataLayer || []")
    pg.locator('a[download]').first.dispatch_event('click'); pg.wait_for_timeout(700)
    v('sin cuenta: se abre la ventana «Descarga gratis con tu cuenta»', pg.locator('.sus-caja').is_visible())
    v('sin cuenta: no se descarga el archivo', len(bajadas) == 0)
    v('la ventana lleva a crear la cuenta y volver a los recursos', pg.locator('.sus-caja a.sus-boton').first.get_attribute('href') == '/cuenta.html?volver=recursos-rosina.html')
    v('no se cuenta como descarga en la medición', not pg.evaluate("window.dataLayer.some(e => e.event === 'resource_download')"))
    pg.keyboard.press('Escape'); pg.wait_for_timeout(200)
    v('Escape cierra la ventana', pg.locator('.sus-caja').count() == 0)
    v('sin errores de JavaScript', not errs)
    ctx.close()
    # 2) con cuenta (simulada): la descarga empieza
    ctx = b.new_context(accept_downloads=True)
    ctx.add_init_script("localStorage.setItem('sb-ngjoognzvehwjtpqwrqe-auth-token', %s)" % json.dumps(SESION))
    ctx.route('**/rest/v1/rpc/mi_cuenta*', lambda r: r.fulfill(status=200, content_type='application/json', body=json.dumps({'nombre': 'Ana', 'email': 'a@b.co', 'telefono': '3001234567', 'ciudad': 'Manizales', 'puntos': 0})))
    pg = ctx.new_page(); pg.goto(BASE + '/recursos-rosina.html'); pg.wait_for_timeout(1200)
    v('con cuenta: se oculta el aviso de suscripción', not pg.locator('#aviso-suscripcion').is_visible())
    try:
        with pg.expect_download(timeout=5000) as d:
            pg.locator('a[download]').first.dispatch_event('click')
        v('con cuenta: la descarga empieza', bool(d.value.suggested_filename))
    except Exception as e:
        v('con cuenta: la descarga empieza (%s)' % str(e)[:60], False)
    v('con cuenta: no sale la ventana', pg.locator('.sus-caja').count() == 0)
    ctx.close()
    # 3) cuenta.html: casillas opcionales de novedades, separadas de la aceptación de datos
    ctx = b.new_context(); pg = ctx.new_page(); pg.goto(BASE + '/cuenta.html?volver=recursos-rosina.html'); pg.wait_for_timeout(1200)
    v('cuenta: la casilla de novedades existe y NO es obligatoria', pg.locator('#c-novedades').count() == 1 and pg.get_attribute('#c-novedades', 'required') is None and not pg.is_checked('#c-novedades'))
    v('cuenta: la aceptación de datos sigue aparte', pg.locator('#c-acepto').count() == 1 and pg.locator('#c-acepto').evaluate('e => e !== document.getElementById("c-novedades")'))
    v('cuenta: invita a crear la cuenta para descargar los recursos', 'recursos de Rosina' in pg.inner_text('#sub-cuenta'))
    ctx.close(); b.close()
print(f'\n{bien} comprobaciones correctas, {mal} con falla.')
sys.exit(1 if mal else 0)
