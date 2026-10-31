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
    # cerrar el panel: botón de arriba, botón de abajo y Esc
    for ancho in (1280, 390):
        ctx = contexto(b, ancho, 900); pg = abrir(ctx, '', 1500); n = '%d px: ' % ancho
        T.v(n + 'el panel tiene «✕ Cerrar» arriba y «Cerrar configuración» abajo', pg.locator('.agenda-config-cerrar').is_visible() and 'Cerrar' in pg.inner_text('.agenda-config-cerrar') and pg.locator('.agenda-config-pie button').count() == 1)
        pg.click('.agenda-config-cerrar'); pg.wait_for_timeout(300)
        T.v(n + '«✕ Cerrar» cierra el panel y el engranaje queda en «cerrado»', pg.locator('#agenda-config').is_hidden() and pg.get_attribute('#agenda-config-btn', 'aria-expanded') == 'false')
        pg.click('#agenda-config-btn'); pg.wait_for_timeout(200); pg.locator('.agenda-config-pie button').scroll_into_view_if_needed(); pg.click('.agenda-config-pie button'); pg.wait_for_timeout(300)
        T.v(n + '«Cerrar configuración» de abajo también cierra', pg.locator('#agenda-config').is_hidden())
        pg.click('#agenda-config-btn'); pg.wait_for_timeout(200); pg.keyboard.press('Escape'); pg.wait_for_timeout(200)
        T.v(n + 'la tecla Esc cierra', pg.locator('#agenda-config').is_hidden())
        ctx.close()
    # rueda de colores
    ctx = contexto(b, 1280, 900); pg = abrir(ctx, '', 1500)
    T.v('ya no hay colores separados en «Verdes» y «Otros colores»: solo la rueda', pg.locator('#ac-opciones .ac-op').count() == 0 and pg.locator('#ac-rueda').is_visible() and pg.locator('#ac-claridad').is_visible())
    T.v('el rosa de siempre sigue sin cambios', pg.evaluate("!document.documentElement.hasAttribute('data-tema')"))
    boton0 = pg.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--rosa-boton').trim()")
    pg.locator('#ac-rueda').scroll_into_view_if_needed(); pg.wait_for_timeout(200)
    caja = pg.locator('#ac-rueda').bounding_box(); cx, cy, r = caja['x'] + caja['width'] / 2, caja['y'] + caja['height'] / 2, caja['width'] / 2
    pg.mouse.click(cx + r * 0.8, cy)   # a la derecha: tono azul-violeta
    pg.wait_for_timeout(200)
    c1 = pg.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--rosa-boton').trim()")
    T.v('tocar la rueda cambia el color de los botones y marca el tema «libre»', c1 and c1.lower() != boton0.lower() and pg.get_attribute('html', 'data-tema') == 'libre', (boton0, c1))
    pg.mouse.click(cx, cy - r * 0.8); pg.wait_for_timeout(200)
    c2 = pg.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--rosa-boton').trim()")
    T.v('otro punto de la rueda da otro color', c2 and c2 != c1, (c1, c2))
    pg.mouse.click(cx - r * 0.8, cy + r * 0.1); pg.wait_for_timeout(200)
    def lumi(hexa):
        h = hexa.lstrip('#'); v = [int(h[i:i+2], 16) / 255 for i in (0, 2, 4)]; v = [x / 12.92 if x <= 0.03928 else ((x + 0.055) / 1.055) ** 2.4 for x in v]
        return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]
    # los botones deben seguir legibles con texto blanco, elija lo que elija
    malos = []
    for dx, dy in [(0.9, 0), (0, -0.9), (-0.9, 0), (0, 0.9), (0.6, 0.6), (-0.6, -0.6), (0.3, -0.3), (0, 0)]:
        for claridad in (100, 60, 35):
            pg.evaluate("(v) => { const e = document.getElementById('ac-claridad'); e.value = v; e.dispatchEvent(new Event('input', {bubbles: true})); }", claridad)
            pg.mouse.click(cx + r * dx, cy + r * dy); pg.wait_for_timeout(60)
            bot = pg.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--rosa-boton').trim()")
            if 1.05 / (lumi(bot) + 0.05) < 4.4: malos.append((dx, dy, claridad, bot))
    T.v('el color de los botones siempre es lo bastante oscuro para leer el texto blanco', not malos, malos[:3])
    pg.mouse.click(cx + r * 0.8, cy); pg.wait_for_timeout(200)
    elegido = pg.evaluate("localStorage.getItem('lrAgendaColor')")
    pg.reload(); pg.wait_for_timeout(1500)
    T.v('el color elegido se recuerda al volver (en este dispositivo)', pg.get_attribute('html', 'data-tema') == 'libre' and pg.evaluate("localStorage.getItem('lrAgendaColor')") == elegido and pg.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--rosa-principal').trim().toUpperCase()") == elegido, elegido)
    pg.evaluate("window.lrAgendaConfig.abrir()"); pg.click('#ac-reset'); pg.wait_for_timeout(200)
    T.v('«Volver al rosa» quita el color elegido', pg.evaluate("!document.documentElement.hasAttribute('data-tema') && !document.documentElement.getAttribute('style') && localStorage.getItem('lrAgendaTema') === null"))
    pg.focus('#ac-rueda'); pg.keyboard.press('ArrowRight'); pg.wait_for_timeout(100)
    T.v('con el teclado también se puede elegir (flechas)', pg.get_attribute('html', 'data-tema') == 'libre')
    T.v('sin errores de JavaScript', not pg.errs, pg.errs[:2]); ctx.close()
    # quien ya tenía un tema fijo de antes lo conserva
    ctx = contexto(b, 1280, 900); ctx.add_init_script("localStorage.setItem('lrAgendaTema','bosque')"); pg = abrir(ctx, '', 1500)
    T.v('un tema fijo de antes (bosque) sigue funcionando', pg.get_attribute('html', 'data-tema') == 'bosque' and pg.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--rosa-boton').trim()") != boton0); ctx.close()
    # celular: la rueda cabe
    ctx = contexto(b, 390, 844); pg = abrir(ctx, '', 1500)
    T.v('390 px: la rueda cabe y no hay desplazamiento horizontal', pg.locator('#ac-rueda').bounding_box()['width'] <= 390 and pg.evaluate("document.documentElement.scrollWidth <= innerWidth + 1") and not pg.errs, pg.errs[:2]); ctx.close()
    # la vuelta de Google abre sola el panel
    ctx = contexto(b, 1280, 900, config_abierta=False); ctx.route('**/functions/v1/google-calendar', lambda r: r.fulfill(status=200, content_type='application/json', body='{"configurado":true,"conectado":false}'))
    pg = abrir(ctx, '', 300, config=False); pg.goto(BASE + '/agenda-rosina.html?calendario=cancelado'); pg.wait_for_timeout(2000)
    T.v('si se vuelve de Google, el panel se abre solo y muestra el mensaje', pg.locator('#agenda-config').is_visible() and 'cancelaste' in pg.locator('#cs-aviso').inner_text(), pg.locator('#cs-aviso').inner_text()); ctx.close()
T.fin()
