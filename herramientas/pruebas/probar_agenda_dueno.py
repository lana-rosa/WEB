"""Prueba el aviso de «agenda de otra cuenta en este navegador» (js/agenda/dueno.js, 30-oct-2026)."""
import sys, json; sys.path.insert(0, __file__.rsplit('/', 1)[0])
from agenda_util import *
T = Prueba(); UID = '00000000-0000-0000-0000-000000000001'; OTRA = '99999999-9999-9999-9999-999999999999'
DATOS = {'ag-p1-cliente': 'Clienta de prueba'}
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM, args=['--no-sandbox'])
    for ancho in (1280, 390):
        n = '%d px: ' % ancho
        ctx = contexto(b, ancho, 800, datos=DATOS, config_abierta=False); pg = abrir(ctx, '', 1200, config=False)
        T.v(n + 'primera vez con hojas escritas y sin dueña conocida: no pregunta y recuerda a la cuenta', pg.locator('.dueno-fondo').count() == 0 and pg.evaluate("localStorage.getItem('lrAgendaDueno')") == UID, pg.evaluate("localStorage.getItem('lrAgendaDueno')"))
        pg.reload(); pg.wait_for_timeout(900)
        T.v(n + 'la misma cuenta de nuevo: no pregunta', pg.locator('.dueno-fondo').count() == 0)
        pg.evaluate("localStorage.setItem('lrAgendaDueno', %s)" % json.dumps(OTRA)); pg.reload(); pg.wait_for_timeout(900)
        T.v(n + 'otra cuenta con hojas escritas: aparece el aviso con las dos opciones', pg.locator('.dueno-fondo').is_visible() and pg.locator('#dueno-nueva').is_visible() and pg.locator('#dueno-mia').is_visible())
        T.v(n + 'el aviso cabe en la pantalla y no hay desplazamiento horizontal', pg.evaluate("document.documentElement.scrollWidth <= innerWidth + 1") and pg.locator('#dueno-nueva').bounding_box()['x'] >= 0)
        pg.locator('.dueno-fondo').screenshot(path='/tmp/claude-0/-home-user-WEB/e30344ec-58b1-5323-9c0b-85d6933c6ac1/scratchpad/dueno-%d.png' % ancho) if ancho == 390 else None
        pg.click('#dueno-mia'); pg.wait_for_timeout(300)
        T.v(n + '«Es mi agenda»: se cierra, conserva las hojas y recuerda a esta cuenta', pg.locator('.dueno-fondo').count() == 0 and pg.evaluate("localStorage.getItem('lrAgendaDueno')") == UID and 'Clienta de prueba' in (pg.evaluate("localStorage.getItem('rosinaAgenda')") or ''))
        pg.evaluate("localStorage.setItem('lrAgendaDueno', %s)" % json.dumps(OTRA)); pg.reload(); pg.wait_for_timeout(900)
        with pg.expect_download(timeout=5000) as dl: pg.click('#dueno-nueva')
        T.v(n + '«Guardar una copia y empezar nueva»: baja un archivo con lo que había', 'Clienta de prueba' in open(dl.value.path()).read())
        pg.wait_for_timeout(2200)
        T.v(n + 'y después la agenda queda vacía, sin aviso y a nombre de esta cuenta', pg.locator('.dueno-fondo').count() == 0 and 'Clienta de prueba' not in (pg.evaluate("localStorage.getItem('rosinaAgenda')") or '') and pg.evaluate("localStorage.getItem('lrAgendaDueno')") == UID)
        pg.evaluate("localStorage.setItem('lrAgendaDueno', %s)" % json.dumps(OTRA)); pg.reload(); pg.wait_for_timeout(900)
        T.v(n + 'otra cuenta pero sin nada escrito: no pregunta', pg.locator('.dueno-fondo').count() == 0)
        T.v(n + 'sin errores', not pg.errs, pg.errs[:2]); ctx.close()
    b.close()
T.fin()
