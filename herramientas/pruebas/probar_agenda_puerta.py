#!/usr/bin/env python3
"""Prueba (28-oct-2026) de la puerta «En construcción» de la Agenda para tejedoras.
Uso: con un servidor local en el puerto 8765:  /usr/bin/python3 herramientas/pruebas/probar_agenda_puerta.py"""
import sys, os, json, tempfile
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from agenda_util import *
T = Prueba()
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM, args=['--no-sandbox'])
    for ancho in (390, 1280):
        ctx = b.new_context(viewport={'width': ancho, 'height': 900}); ctx.route('**/googletagmanager.com/**', lambda r: r.abort()); ctx.route('**/rest/v1/**', lambda r: r.fulfill(status=200, content_type='application/json', body='[]'))
        pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(BASE + '/agenda-rosina.html'); pg.wait_for_timeout(1200)
        T.v('%d px: el público ve «En construcción»' % ancho, 'En construcción' in pg.inner_text('#agenda-en-construccion') and pg.is_visible('#agenda-en-construccion'))
        T.v('%d px: no se ve la agenda por dentro ni su portada de estrenar' % ancho, not pg.is_visible('#agenda') and not pg.is_visible('.intro-agenda:not(.en-construccion)'))
        T.v('%d px: hay un solo título principal' % ancho, pg.evaluate("[...document.querySelectorAll('h1')].filter(h => h.offsetParent !== null).length") == 1)
        T.v('%d px: ofrece avisar por WhatsApp' % ancho, pg.locator('#agenda-en-construccion a[href^="https://wa.me/573205072801"]').count() == 1)
        T.v('%d px: sin datos guardados no ofrece copia' % ancho, not pg.is_visible('#construccion-copia'))
        T.v('%d px: sin desplazamiento horizontal' % ancho, pg.evaluate("document.documentElement.scrollWidth <= innerWidth + 1"))
        if ancho == 390: pg.screenshot(path='/tmp/claude-0/-home-user-WEB/e30344ec-58b1-5323-9c0b-85d6933c6ac1/scratchpad/caps/construccion-390.png')
        T.v('%d px: sin errores de JavaScript' % ancho, not errs, errs[:2]); ctx.close()
    # con datos de antes: copia
    ctx = b.new_context(viewport={'width': 390, 'height': 900}); ctx.route('**/googletagmanager.com/**', lambda r: r.abort()); ctx.route('**/rest/v1/**', lambda r: r.fulfill(status=200, content_type='application/json', body='[]'))
    ctx.add_init_script("localStorage.setItem('rosinaAgenda', JSON.stringify({'ag-nombre': 'Bufanda'}))")
    pg = ctx.new_page(); pg.goto(BASE + '/agenda-rosina.html'); pg.wait_for_timeout(1200)
    T.v('quien ya tenía datos puede descargar su copia', pg.is_visible('#construccion-copia'))
    with pg.expect_download() as d: pg.click('#construccion-descargar')
    ruta = os.path.join(tempfile.mkdtemp(), 'c.json'); d.value.save_as(ruta); j = json.load(open(ruta))
    T.v('la copia trae sus datos en el formato de siempre', j.get('agendaRosina') == 1 and j['datos'].get('ag-nombre') == 'Bufanda')
    pg.goto(BASE + '/agenda-rosina.html?avance=1'); pg.wait_for_timeout(1500)
    T.v('con ?avance=1 se ve la agenda por dentro', pg.is_visible('#agenda') and not pg.is_visible('#agenda-en-construccion'))
    pg.goto(BASE + '/agenda-rosina.html'); pg.wait_for_timeout(1200)
    T.v('queda activado en ese navegador', pg.is_visible('#agenda'))
    pg.goto(BASE + '/agenda-rosina.html?avance=0'); pg.wait_for_timeout(1200)
    T.v('con ?avance=0 vuelve a «En construcción»', pg.is_visible('#agenda-en-construccion') and not pg.is_visible('#agenda'))
    ctx.close(); b.close()
T.fin()
