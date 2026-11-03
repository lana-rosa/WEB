"""Prueba los interruptores «Qué fechas enviar a Google Calendar» (etapa 2 de Conexiones e integraciones, js/agenda/google-calendar.js).
Uso: /usr/bin/python3 herramientas/pruebas/probar_agenda_gcal_tipos.py   (con un servidor local en el puerto 8765)"""
import json, sys
sys.path.insert(0, __file__.rsplit('/', 1)[0])
from agenda_util import *

DATOS = {'ag-p1-cliente': 'Ana', 'ag-p1-pedido': 'Oso', 'ag-p1-entrega': '15/12/2026', 'ag-p1-envio': '16/12/2026',
         'ag-f1-proyecto': 'Manta', 'ag-f1-fecha': '20/12/2026', 'ag-fe1-ocasion': 'Cumpleaños', 'ag-fe1-fecha': '05/01/2027',
         'ag-cl1-nombre': 'Luisa', 'ag-cl1-cumpleanos': '03/03/2027'}
t = Prueba()


class Funcion:
    def __init__(s, conectada=True): s.conectada, s.envios = conectada, []
    def __call__(s, route):
        c = route.request.post_data_json or {}; a = c.get('accion')
        def ok(o): route.fulfill(status=200, content_type='application/json', body=json.dumps(o))
        if a == 'estado': return ok({'configurado': True, 'conectado': s.conectada, 'correo': 'sara@gmail.com' if s.conectada else None, 'ultima': None})
        if a == 'sincronizar': s.envios.append(sorted({e['clave'].split(':')[0] for e in c.get('eventos', [])})); return ok({'ok': True, 'creados': 0, 'actualizados': 0, 'borrados': 0, 'sinCambio': 0, 'fallos': 0, 'retenidos': 0})
        ok({'error': 'Acción no válida'})


def pagina(b, fn, ancho=1280, idioma=None, datos=DATOS):
    ctx = contexto(b, ancho, 900, datos=datos)
    if idioma: ctx.add_init_script("localStorage.setItem('lrAgendaIdioma', '%s')" % idioma)
    ctx.route('**/functions/v1/google-calendar', fn)
    ctx.route('**/functions/v1/google-drive', lambda r: r.fulfill(status=200, content_type='application/json', body=json.dumps({'configurado': False})))
    pg = abrir(ctx, '', 2200); pg.wait_for_timeout(800); return ctx, pg


def guardado(pg): return pg.evaluate("() => (JSON.parse(localStorage.getItem('rosinaAgenda') || '{}'))._gcalTipos || null")


with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM, args=['--no-sandbox'])

    fn = Funcion(conectada=False); ctx, pg = pagina(b, fn)
    t.v('sin conectar: los interruptores no aparecen', pg.locator('#cs-tipos').is_hidden()); ctx.close()

    fn = Funcion(); ctx, pg = pagina(b, fn)
    t.v('conectado: aparecen 6 interruptores, todos marcados', pg.locator('#cs-tipos').is_visible() and pg.locator('#cs-tipos input[data-tipo]').count() == 6 and pg.locator('#cs-tipos input:checked').count() == 6)
    pg.locator('#cs-sincronizar').click(); pg.wait_for_timeout(900)
    t.v('por defecto se envía todo (entrega, envío, proyecto, fecha especial y cumpleaños)', fn.envios and all(k in fn.envios[-1] for k in ('pedido', 'pedidoEnvio', 'proyecto', 'fecha', 'clienta')), fn.envios)
    pg.locator('#cs-tipos label', has_text='Envíos de pedidos').locator('input').uncheck(); pg.wait_for_timeout(5000)
    t.v('al apagar «Envíos de pedidos» se guarda en los datos de la agenda (no en el aparato)', guardado(pg) == {'envios': False}, guardado(pg))
    t.v('4 s después sincroniza sola SIN los envíos y con lo demás', 'pedidoEnvio' not in fn.envios[-1] and all(k in fn.envios[-1] for k in ('pedido', 'proyecto', 'fecha', 'clienta')), fn.envios[-1])
    t.v('el resumen de Conexiones dice qué envía', 'Envía:' in pg.locator('#cx-resumen li[data-cx="Google Calendar"]').inner_text() and 'Envíos de pedidos' not in pg.locator('#cx-resumen li[data-cx="Google Calendar"]').inner_text(), pg.locator('#cx-resumen li[data-cx="Google Calendar"]').inner_text())
    pg.reload(); pg.wait_for_timeout(2500)
    t.v('al recargar, el interruptor sigue apagado', pg.locator('#cs-tipos input[data-tipo="envios"]').is_checked() is False and pg.locator('#cs-tipos input:checked').count() == 5)
    pg.locator('#cs-tipos label', has_text='Envíos de pedidos').locator('input').check(); pg.wait_for_timeout(600)
    t.v('al volver a marcar todo, la clave desaparece de los datos', guardado(pg) is None, guardado(pg))
    t.v('sin errores de JavaScript', not pg.errs, pg.errs); ctx.close()

    fn = Funcion(); ctx, pg = pagina(b, fn)
    for c in pg.locator('#cs-tipos input[data-tipo]').all(): c.uncheck()
    pg.wait_for_timeout(600)
    t.v('con todo apagado lo explica y no sincroniza sola (agenda sin fechas a enviar)', 'no se enviará nada' in pg.locator('#cs-aviso').inner_text() and not fn.envios, (pg.locator('#cs-aviso').inner_text(), fn.envios))
    pg.locator('#cs-sincronizar').click(); pg.wait_for_timeout(900)
    t.v('a mano manda la lista vacía (para quitar lo que ya estaba)', fn.envios and fn.envios[-1] == [], fn.envios); ctx.close()

    fn = Funcion(); ctx, pg = pagina(b, fn, idioma='en')
    t.v('en inglés se traducen el título y los interruptores', 'Which dates to send' in pg.locator('#cs-tipos legend').inner_text() and 'Order shipments' in pg.locator('#cs-tipos').inner_text() and 'Envíos' not in pg.locator('#cs-tipos').inner_text(), pg.locator('#cs-tipos').inner_text())
    t.v('en inglés, sin errores de JavaScript', not pg.errs, pg.errs); ctx.close()

    fn = Funcion(); ctx, pg = pagina(b, fn, ancho=390)
    t.v('celular: sin desplazamiento horizontal y los interruptores caben', pg.evaluate("document.documentElement.scrollWidth") <= 390 and pg.locator('#cs-tipos').bounding_box()['width'] <= 390)
    t.v('celular: cada interruptor mide al menos 28 px de alto', all(l.bounding_box()['height'] >= 28 for l in pg.locator('#cs-tipos label').all()))
    t.v('celular: sin errores de JavaScript', not pg.errs, pg.errs); ctx.close()
t.fin()
