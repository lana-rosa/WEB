"""Prueba el registro de copias y exportaciones de «Conexiones e integraciones» (etapa 3, js/agenda/centro-conexiones.js).
Uso: /usr/bin/python3 herramientas/pruebas/probar_agenda_copias_registro.py   (con un servidor local en el puerto 8765)"""
import json, sys
sys.path.insert(0, __file__.rsplit('/', 1)[0])
from agenda_util import *
DATOS = {'ag-p1-cliente': 'Ana', 'ag-p1-pedido': 'Oso', 'ag-p1-entrega': '15/12/2026'}
t = Prueba()
SIN = lambda r: r.fulfill(status=200, content_type='application/json', body=json.dumps({'configurado': False}))


def pagina(b, ancho=1280, idioma=None, init='', nube=False):
    ctx = contexto(b, ancho, 900, datos=DATOS)
    if idioma: ctx.add_init_script("localStorage.setItem('lrAgendaIdioma', '%s')" % idioma)
    if init: ctx.add_init_script(init)
    if not nube: ctx.route('**/rest/v1/rpc/agenda_nube_leer', lambda r: r.fulfill(status=200, content_type='application/json', body=json.dumps({'error': 'sin_consentimiento'})))
    ctx.route('**/functions/v1/google-calendar', SIN); ctx.route('**/functions/v1/google-drive', SIN)
    pg = abrir(ctx, '', 2200); pg.wait_for_timeout(800); return ctx, pg


def fila(pg): return pg.locator('#cx-resumen li[data-cx="Copias y exportaciones"]')


with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM, args=['--no-sandbox'])
    ctx, pg = pagina(b)
    f = fila(pg).inner_text()
    t.v('hay una fila «Copias y exportaciones» (4 filas en total)', fila(pg).count() == 1 and pg.locator('#cx-resumen li').count() == 4)
    t.v('sin copias: lo dice y avisa «Conviene guardar una copia»', 'Todavía no has descargado una copia' in f and 'Conviene guardar una copia' in f and 'Estas fechas son de este aparato' in f, f)
    with pg.expect_download() as d: fila(pg).locator('button').click()
    pg.wait_for_timeout(1200)
    t.v('«Guardar una copia ahora» baja la copia y el registro cambia a «Al día» con la fecha de hoy', d.value.suggested_filename.startswith('agenda-rosina-') and 'Al día' in fila(pg).inner_text() and 'Última copia descargada' in fila(pg).inner_text(), fila(pg).inner_text())
    with pg.expect_download():
        pg.click('#agenda-excel')
    pg.wait_for_timeout(1000)
    t.v('al exportar a Excel queda anotado', 'Última exportación a Excel' in fila(pg).inner_text(), fila(pg).inner_text())
    with pg.expect_download():
        pg.click('#agenda-ics')
    pg.wait_for_timeout(1000)
    t.v('al llevar las fechas al calendario también queda anotado', 'Últimas fechas al calendario' in fila(pg).inner_text(), fila(pg).inner_text())
    pg.reload(); pg.wait_for_timeout(2500)
    t.v('al recargar, el registro sigue ahí (es de este aparato)', 'Última exportación a Excel' in fila(pg).inner_text() and 'Última copia descargada' in fila(pg).inner_text())
    t.v('sin errores de JavaScript', not pg.errs, pg.errs); ctx.close()

    ctx, pg = pagina(b, init="localStorage.setItem('rosinaAgendaCopia', '2026-01-02');")
    t.v('una copia de hace más de 14 días y sin cuenta ni Drive: «Conviene guardar una copia»', 'Conviene guardar una copia' in fila(pg).inner_text(), fila(pg).inner_text()); ctx.close()

    ctx, pg = pagina(b, init="localStorage.setItem('rosinaAgendaCopia', '2026-01-02');", nube=True)
    t.v('con la copia en la cuenta activa: «Al día» aunque la copia descargada sea vieja, y muestra la copia de la cuenta', 'Al día' in fila(pg).inner_text() and 'Última copia en tu cuenta' in fila(pg).inner_text(), fila(pg).inner_text()); ctx.close()

    ctx, pg = pagina(b, idioma='en')
    t.v('en inglés se traduce la fila', 'Backups and exports' in fila(pg).inner_text() and 'Save a backup now' in fila(pg).inner_text() and 'Todavía' not in fila(pg).inner_text(), fila(pg).inner_text()); ctx.close()

    ctx, pg = pagina(b, ancho=390)
    t.v('celular: sin desplazamiento horizontal y la fila cabe', pg.evaluate("document.documentElement.scrollWidth") <= 390 and fila(pg).bounding_box()['width'] <= 390)
    t.v('celular: sin errores de JavaScript', not pg.errs, pg.errs); ctx.close()
t.fin()
