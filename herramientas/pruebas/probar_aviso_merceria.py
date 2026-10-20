#!/usr/bin/env python3
"""Prueba el «Avísame cuando abra» de la Mercería (js/aviso-merceria.js) en /merceria/catalogo/.
Uso: con un servidor local en el puerto 8765: python3 herramientas/pruebas/probar_aviso_merceria.py [carpeta_capturas]
Todo Supabase va simulado: no se guarda ningún dato real."""
import json, os, sys
from playwright.sync_api import sync_playwright
CHROMIUM = os.environ.get('CHROMIUM', '/opt/pw-browsers/chromium')
BASE = 'http://localhost:8765'
CAP = sys.argv[1] if len(sys.argv) > 1 else None
bien = mal = 0
def v(n, ok, extra=''):
    global bien, mal
    print(('  ok   ' if ok else '  FALLA ') + n, '' if ok else extra); bien += bool(ok); mal += (not ok)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM)
    for ancho in (390, 1280):
        print('\n[%d px]' % ancho)
        ctx = b.new_context(viewport={'width': ancho, 'height': 900}); pg = ctx.new_page(); errs = []; envios = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        def rpc(r):
            envios.append(json.loads(r.request.post_data or '{}')); r.fulfill(status=204, body='')
        ctx.route('**/rest/v1/rpc/avisarme_apertura_merceria*', rpc)
        ctx.route('**/rest/v1/rpc/obtener_merceria_web*', lambda r: r.fulfill(status=200, content_type='application/json', body='[]'))
        pg.add_init_script("try{localStorage.setItem('lrConsent',JSON.stringify({v:1,a:false,t:'2026-10-20'}))}catch(e){}")
        pg.goto(BASE + '/merceria/catalogo/'); pg.wait_for_timeout(1500)
        boton = pg.locator('#aviso-proximamente [data-aviso-merceria]')
        v('el aviso «Muy pronto» tiene el botón «Avísame cuando abra»', boton.count() == 1 and boton.is_visible() and 'Avísame cuando abra' in boton.inner_text())
        if CAP: boton.scroll_into_view_if_needed(); pg.evaluate('window.scrollBy(0,-330)'); pg.screenshot(path=os.path.join(CAP, 'aviso_merceria_boton_%d.png' % ancho))
        boton.click(); pg.wait_for_timeout(400)
        v('se abre la ventana', pg.locator('.am-caja').is_visible())
        if CAP: pg.screenshot(path=os.path.join(CAP, 'aviso_merceria_ventana_%d.png' % ancho))
        v('sin desplazamiento horizontal', pg.evaluate('document.documentElement.scrollWidth<=window.innerWidth'))
        enviar = pg.locator('.am-caja button[type=submit]')
        enviar.click(); pg.wait_for_timeout(200)
        v('sin datos no envía y avisa', not envios and pg.locator('.am-aviso').is_visible())
        pg.fill('#am-nombre', 'Ana Pérez'); enviar.click(); pg.wait_for_timeout(200)
        v('sin WhatsApp ni correo no envía', not envios and 'WhatsApp o tu correo' in pg.inner_text('.am-aviso'))
        pg.fill('#am-tel', '123'); enviar.click(); pg.wait_for_timeout(200)
        v('un WhatsApp corto no envía', not envios)
        pg.fill('#am-tel', ''); pg.fill('#am-correo', 'no-es-correo'); enviar.click(); pg.wait_for_timeout(200)
        v('un correo mal escrito no envía', not envios)
        pg.fill('#am-correo', 'ana@correo.com'); enviar.click(); pg.wait_for_timeout(200)
        v('sin aceptar los datos no envía', not envios and 'tratamiento de datos' in pg.inner_text('.am-aviso'))
        pg.fill('#am-web', 'robot'); pg.check('#am-acepto'); enviar.click(); pg.wait_for_timeout(300)
        v('el campo trampa bloquea el envío', not envios)
        pg.fill('#am-web', ''); enviar.click(); pg.wait_for_timeout(800)
        e = envios[0] if envios else {}
        v('envía nombre, correo (sin WhatsApp) y la autorización', len(envios) == 1 and e.get('p_nombre') == 'Ana Pérez' and e.get('p_correo') == 'ana@correo.com' and e.get('p_whatsapp') is None and e.get('p_acepta_datos') is True, e)
        v('muestra la confirmación', 'te avisamos' in pg.inner_text('.am-caja'))
        pg.keyboard.press('Escape'); pg.wait_for_timeout(200)
        v('la ventana se cierra con Escape', pg.locator('.am-caja').count() == 0)
        envios.clear(); boton.click(); pg.wait_for_timeout(300)
        pg.fill('#am-nombre', 'Luisa'); pg.fill('#am-tel', '310 987 6543'); pg.check('#am-acepto'); pg.locator('.am-caja button[type=submit]').click(); pg.wait_for_timeout(700)
        v('solo con WhatsApp también se envía', len(envios) == 1 and envios[0].get('p_whatsapp') == '310 987 6543' and envios[0].get('p_correo') is None)
        v('sin errores de JavaScript', not errs, errs[:2])
        ctx.close()
    # con existencias el aviso (y su botón) desaparecen
    ctx = b.new_context(); pg = ctx.new_page()
    pg.add_init_script("try{localStorage.setItem('lrConsent',JSON.stringify({v:1,a:false,t:'2026-10-20'}))}catch(e){}")
    pg.goto(BASE + '/merceria/catalogo/'); pg.wait_for_timeout(1200)
    hay = pg.evaluate("(function(){var a=document.getElementById('aviso-proximamente');a.hidden=true;return getComputedStyle(a).display})()")
    v('cuando abre la tienda el aviso se oculta con su botón (atributo hidden)', hay == 'none')
    ctx.close(); b.close()
print('\n%d comprobaciones correctas, %d con falla.' % (bien, mal))
sys.exit(1 if mal else 0)
