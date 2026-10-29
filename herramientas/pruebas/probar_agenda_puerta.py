#!/usr/bin/env python3
"""Prueba (28-oct-2026) de la puerta de la Agenda para tejedoras. Desde el 29-oct está abierta para todos; aquí se prueba abierta y también el modo «hojas gratis» (puerta cerrada) por si se vuelve a cerrar.
Uso: con un servidor local en el puerto 8765:  /usr/bin/python3 herramientas/pruebas/probar_agenda_puerta.py [carpeta_capturas]"""
import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from agenda_util import *
T = Prueba(); CAP = sys.argv[1] if len(sys.argv) > 1 else None
GRATIS = ['indice-agenda', 'planeador-dia', 'portada-agenda', 'aprende-compra', 'mis-ideas', 'lista-compras']
def cerrar(ctx):
    """Sirve la página con la puerta cerrada (AGENDA_EN_VENTA = false), que es el modo que se usa si algún día se vuelve a cerrar la agenda."""
    def r(ruta):
        resp = ruta.fetch(); ruta.fulfill(response=resp, body=resp.text().replace('var AGENDA_EN_VENTA = true', 'var AGENDA_EN_VENTA = false'))
    ctx.route('**/agenda-rosina.html*', r)
def publico(b, ancho, datos=None, cerrada=True):
    ctx = b.new_context(viewport={'width': ancho, 'height': 900}); ctx.add_init_script("window.addEventListener('load', () => setTimeout(() => window.lrAgendaConfig && window.lrAgendaConfig.abrir(), 30));"); (cerrar(ctx) if cerrada else None); ctx.route('**/googletagmanager.com/**', lambda r: r.abort()); ctx.route('**/rest/v1/**', lambda r: r.fulfill(status=200, content_type='application/json', body='[]'))
    if datos is not None: ctx.add_init_script("if (!sessionStorage.getItem('i')) { localStorage.setItem('rosinaAgenda', %s); sessionStorage.setItem('i', '1'); }" % json.dumps(json.dumps(datos)))
    pg = ctx.new_page(); pg.errs = []; pg.on('pageerror', lambda e: pg.errs.append(str(e))); pg.on('dialog', lambda d: d.accept()); return ctx, pg
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM, args=['--no-sandbox'])
    # abierta para todos (lo que hay publicado)
    ctx, pg = publico(b, 1280, cerrada=False); pg.goto(BASE + '/agenda-rosina.html'); pg.wait_for_timeout(1800)
    T.v('abierta para todos: 38 hojas y ningún aviso de construcción', pg.evaluate("document.querySelectorAll('#menu-hojas-lista a').length") == 38 and pg.locator('#agenda-aviso-completa').count() == 0 and 'en construcción' not in pg.inner_text('#indice-agenda').lower())
    T.v('abierta para todos: no hay clase de modo gratis ni hojas bloqueadas', 'agenda-gratis' not in pg.evaluate("document.documentElement.className") and pg.locator('.hoja-bloqueada').count() == 0)
    pg.goto(BASE + '/agenda-rosina.html?gratis=1'); pg.wait_for_timeout(1500)
    T.v('con ?gratis=1 se puede revisar el modo de hojas gratis (solo esa visita)', pg.evaluate("document.querySelectorAll('#menu-hojas-lista a').length") == 6)
    pg.goto(BASE + '/agenda-rosina.html'); pg.wait_for_timeout(1500)
    T.v('y al volver a entrar sin ese parámetro queda otra vez abierta', pg.evaluate("document.querySelectorAll('#menu-hojas-lista a').length") == 38)
    T.v('sin errores de JavaScript', not pg.errs, pg.errs[:2]); ctx.close()
    for ancho in (390, 1280):
        ctx, pg = publico(b, ancho); pg.goto(BASE + '/agenda-rosina.html'); pg.wait_for_timeout(1500)
        T.v('%d px: el público ve la agenda con sus hojas gratis' % ancho, pg.is_visible('#agenda') and pg.is_visible('#indice-agenda'))
        T.v('%d px: el índice avisa que la agenda completa está en construcción' % ancho, 'en construcción' in pg.inner_text('#indice-agenda').lower() and pg.locator('.menu-aviso').count() == 1)
        T.v('%d px: solo hay 6 hojas (las gratis) en el menú' % ancho, sorted(pg.evaluate("[...document.querySelectorAll('#menu-hojas-lista a')].map(a => a.dataset.hoja)")) == sorted(GRATIS))
        T.v('%d px: el contador dice 6 hojas' % ancho, 'de 6' in pg.inner_text('#menu-hojas-cuenta') and '6 hojas' in pg.inner_text('.mh-pildora'), pg.inner_text('#menu-hojas-cuenta'))
        T.v('%d px: el índice solo ofrece las hojas gratis' % ancho, sorted(pg.evaluate("[...document.querySelectorAll('#indice-agenda [data-ir]')].map(b => b.dataset.ir)")) == sorted(GRATIS[1:]))
        T.v('%d px: ninguna hoja de pago se puede ver' % ancho, pg.evaluate("[...document.querySelectorAll('.hoja-bloqueada')].every(h => getComputedStyle(h).display === 'none')") and pg.locator('.hoja-bloqueada').count() == 32)
        pg.evaluate("document.querySelector('#menu-hojas-lista a[data-hoja=planeador-dia]').click()"); pg.wait_for_timeout(300)
        T.v('%d px: planeador sin «Este mes en números»' % ancho, pg.locator('#planeador-dia .pl-numeros').is_hidden() and pg.locator('#pl-tareas').count() == 1)
        T.v('%d px: hay promociones del ecosistema en la hoja' % ancho, pg.locator('#planeador-dia .promo-tarjeta').count() == 2)
        T.v('%d px: sin desplazamiento horizontal' % ancho, pg.evaluate("document.documentElement.scrollWidth <= innerWidth + 1"))
        if CAP:
            os.makedirs(CAP, exist_ok=True); pg.evaluate("document.querySelector('#menu-hojas-lista a[data-hoja=indice-agenda]').click()"); pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(CAP, 'gratis-%d.png' % ancho), full_page=False)
        T.v('%d px: sin errores de JavaScript' % ancho, not pg.errs, pg.errs[:2]); ctx.close()
    # una hoja de pago pedida por la dirección o guardada de antes no se abre
    ctx, pg = publico(b, 390, {'ag-p1-cliente': 'Ana', 'ag-p1-pedido': 'Oso'}); pg.add_init_script("localStorage.setItem('rosinaAgendaHoja', 'control-pedidos')")
    pg.goto(BASE + '/agenda-rosina.html#control-pedidos'); pg.wait_for_timeout(1500)
    abierta = pg.evaluate("(document.querySelector('.hoja-agenda.abierta') || {}).id")
    T.v('una hoja de pago pedida por la dirección no se abre: queda el índice', abierta == 'indice-agenda' and not pg.is_visible('#control-pedidos'), abierta)
    pg.fill('#buscar-agenda', 'Oso'); pg.wait_for_timeout(600)
    T.v('la búsqueda no entra a hojas bloqueadas', 'Sin resultados' in pg.inner_text('#resultado-busqueda') or pg.inner_text('#resultado-busqueda') == '', pg.inner_text('#resultado-busqueda'))
    with pg.expect_download() as d: pg.click('#agenda-excel')
    T.v('exportar a Excel no falla con datos de hojas bloqueadas', d.value.suggested_filename.endswith('.xlsx'))
    T.v('sin errores de JavaScript con datos de hojas bloqueadas', not pg.errs, pg.errs[:2]); ctx.close()
    # imprimir: las hojas de pago no salen
    ctx, pg = publico(b, 1280); pg.goto(BASE + '/agenda-rosina.html'); pg.wait_for_timeout(1500); pg.emulate_media(media='print')
    T.v('al imprimir, las hojas bloqueadas siguen ocultas', pg.evaluate("[...document.querySelectorAll('.hoja-bloqueada')].every(h => getComputedStyle(h).display === 'none')"))
    ctx.close()
    # con ?avance=1 se ve todo
    ctx, pg = publico(b, 1280); pg.goto(BASE + '/agenda-rosina.html?avance=1'); pg.wait_for_timeout(1800)
    T.v('con ?avance=1 se ve la agenda completa (38 hojas) y sin aviso', pg.evaluate("document.querySelectorAll('#menu-hojas-lista a').length") == 38 and not pg.is_visible('#agenda-aviso-completa') and pg.locator('.hoja-bloqueada').count() == 0)
    pg.goto(BASE + '/agenda-rosina.html'); pg.wait_for_timeout(1500)
    T.v('queda activado en ese navegador', pg.evaluate("document.querySelectorAll('#menu-hojas-lista a').length") == 38)
    pg.goto(BASE + '/agenda-rosina.html?avance=0'); pg.wait_for_timeout(1500)
    T.v('con ?avance=0 vuelve a las hojas gratis', pg.evaluate("document.querySelectorAll('#menu-hojas-lista a').length") == 6 and pg.locator('.indice-construccion').count() == 1)
    T.v('sin errores de JavaScript', not pg.errs, pg.errs[:2]); ctx.close(); b.close()
T.fin()
