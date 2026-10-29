"""Prueba el panel de Configuración (engranaje) y los colores de la Agenda para tejedoras (29-oct-2026)."""
import sys; sys.path.insert(0, __file__.rsplit('/', 1)[0])
from agenda_util import *
T = Prueba()
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM, args=['--no-sandbox'])
    for ancho in (1280, 390):
        ctx = contexto(b, ancho, 900, config_abierta=False); pg = abrir(ctx, '', 1500, config=False)
        T.v('%d px: arriba solo se ve el título y el engranaje (el panel empieza cerrado)' % ancho, pg.locator('#agenda-config-btn').is_visible() and pg.locator('#agenda-config').is_hidden() and pg.locator('#agenda-descargar').is_hidden() and pg.locator('#ag-duena').is_hidden() and pg.locator('[data-imprimir="agenda"]').is_hidden())
        T.v('%d px: el botón dice que está cerrado (aria-expanded)' % ancho, pg.get_attribute('#agenda-config-btn', 'aria-expanded') == 'false')
        pg.click('#agenda-config-btn'); pg.wait_for_timeout(300)
        T.v('%d px: el engranaje abre nombre, imprimir, borrar, copias, Google Calendar y colores' % ancho, all(pg.locator(s).first.is_visible() for s in ('#ag-duena', '[data-imprimir="agenda"]', '#agenda-borrar', '#agenda-descargar', '#agenda-cargar', '#agenda-ics', '#agenda-excel', '#ac-opciones')) and pg.get_attribute('#agenda-config-btn', 'aria-expanded') == 'true')
        pg.click('#agenda-config-btn'); pg.wait_for_timeout(200)
        T.v('%d px: y lo vuelve a cerrar' % ancho, pg.locator('#agenda-config').is_hidden())
        T.v('%d px: sin desplazamiento horizontal ni errores' % ancho, pg.evaluate("document.documentElement.scrollWidth") <= ancho and not pg.errs, pg.errs[:2]); ctx.close()
    ctx = contexto(b, 1280, 900); pg = abrir(ctx, '', 1500)
    ops = pg.evaluate("[...document.querySelectorAll('#ac-opciones .ac-op')].map(b => b.textContent)")
    T.v('hay 16 colores: 7 verdes y 9 más', len(ops) == 16 and sum('Verde' in o for o in ops) == 7, ops)
    T.v('el menta (de siempre) viene elegido', pg.get_attribute('#ac-opciones [data-t="menta"]', 'aria-pressed') == 'true' and pg.evaluate("!document.documentElement.hasAttribute('data-tema')"))
    boton0 = pg.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--rosa-boton').trim()")
    for tema in ('esmeralda', 'bosque', 'oliva', 'pistacho', 'salvia', 'azulado', 'rosa', 'lila', 'azul', 'cielo', 'mostaza', 'durazno', 'coral', 'vino', 'grafito'):
        pg.click('#ac-opciones [data-t="%s"]' % tema); pg.wait_for_timeout(100)
        c = pg.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--rosa-boton').trim()")
        T.v('«%s» cambia el color de los botones' % tema, c and c.lower() != boton0.lower() and pg.get_attribute('html', 'data-tema') == tema, (boton0, c))
    pg.click('#ac-opciones [data-t="bosque"]'); pg.reload(); pg.wait_for_timeout(1500)
    T.v('el color elegido se recuerda al volver (en este dispositivo)', pg.get_attribute('html', 'data-tema') == 'bosque' and pg.evaluate("localStorage.getItem('lrAgendaTema')") == 'bosque')
    pg.evaluate("window.lrAgendaConfig.abrir()"); pg.click('#ac-opciones [data-t="menta"]'); pg.wait_for_timeout(100)
    T.v('volver al menta quita el color extra', pg.evaluate("!document.documentElement.hasAttribute('data-tema')"))
    T.v('sin errores de JavaScript', not pg.errs, pg.errs[:2]); ctx.close()
    # la vuelta de Google abre sola el panel
    ctx = contexto(b, 1280, 900, config_abierta=False); ctx.route('**/functions/v1/google-calendar', lambda r: r.fulfill(status=200, content_type='application/json', body='{"configurado":true,"conectado":false}'))
    pg = abrir(ctx, '', 300, config=False); pg.goto(BASE + '/agenda-rosina.html?calendario=cancelado'); pg.wait_for_timeout(2000)
    T.v('si se vuelve de Google, el panel se abre solo y muestra el mensaje', pg.locator('#agenda-config').is_visible() and 'cancelaste' in pg.locator('#cs-aviso').inner_text(), pg.locator('#cs-aviso').inner_text()); ctx.close()
T.fin()
