"""Prueba el apartado «¿Dónde se guardan mis datos?» de Configuración (30-oct-2026)."""
import sys; sys.path.insert(0, __file__.rsplit('/', 1)[0])
from agenda_util import *
T = Prueba()
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM, args=['--no-sandbox'])
    for ancho in (1280, 390):
        n = '%d px: ' % ancho
        ctx = contexto(b, ancho, 900); pg = abrir(ctx, '', 1500)
        T.v(n + 'el apartado está en Configuración y empieza cerrado', pg.locator('#donde-datos').is_visible() and not pg.evaluate("document.getElementById('donde-datos').open"))
        pg.click('#donde-datos summary'); pg.wait_for_timeout(300)
        t = pg.inner_text('#donde-datos')
        T.v(n + 'explica dispositivo, cuenta, otro dispositivo, cerrar sesión, borrar historial, perder el dispositivo y quién ve los datos', all(x in t for x in ('En tu dispositivo', 'En tu cuenta', 'otro celular', 'cierras sesión', 'historial', 'pierdes el dispositivo', 'Quién lo ve')))
        T.v(n + 'dice dónde se guarda hoy', 'Hoy:' in pg.inner_text('#dd-estado'), pg.inner_text('#dd-estado'))
        T.v(n + 'enlaza a la política de datos', pg.locator('#donde-datos a[href="/politicas.html#datos"]').count() == 1)
        T.v(n + 'sin desplazamiento horizontal ni errores', pg.evaluate("document.documentElement.scrollWidth <= innerWidth + 1") and not pg.errs, pg.errs[:2])
        pg.locator('#donde-datos').scroll_into_view_if_needed(); pg.screenshot(path='/tmp/claude-0/-home-user-WEB/e30344ec-58b1-5323-9c0b-85d6933c6ac1/scratchpad/donde-datos-%d.png' % ancho)
        ctx.close()
    b.close()
T.fin()
