"""Prueba «Conexiones e integraciones» (etapa 1, js/agenda/centro-conexiones.js): el resumen de servicios, los permisos explicados y que NO conecta ni cambia nada por sí solo.
Uso: /usr/bin/python3 herramientas/pruebas/probar_agenda_centro_conexiones.py   (con un servidor local en el puerto 8765)"""
import json, sys
sys.path.insert(0, __file__.rsplit('/', 1)[0])
from agenda_util import *

t = Prueba()


class Funcion:
    def __init__(s, configurada=True, conectada=False, vencido=False):
        s.configurada, s.conectada, s.vencido, s.llamadas = configurada, conectada, vencido, []
    def __call__(s, route):
        c = route.request.post_data_json or {}; a = c.get('accion'); s.llamadas.append(a)
        def ok(o, st=200): route.fulfill(status=st, content_type='application/json', body=json.dumps(o))
        if not s.configurada: return ok({'configurado': False})
        if a == 'estado': return ok({'configurado': True, 'conectado': s.conectada, 'correo': 'sara@gmail.com' if s.conectada else None, 'ultima': '2026-11-03T15:00:00Z' if s.conectada else None})
        if a == 'sincronizar':
            if s.vencido: return ok({'error': 'El permiso venció. Vuelve a conectar tu Google Calendar.', 'reconectar': True}, 401)
            return ok({'ok': True, 'creados': 0, 'actualizados': 0, 'borrados': 0, 'sinCambio': 0, 'fallos': 0, 'retenidos': 0})
        ok({'error': 'Acción no válida'}, 400)


def pagina(b, cal, drv, ancho=1280, idioma=None, espera=2200, datos=None):
    ctx = contexto(b, ancho, 900, datos=datos if datos is not None else {'ag-p1-cliente': 'Ana', 'ag-p1-pedido': 'Oso', 'ag-p1-entrega': '15/12/2026'})
    if idioma: ctx.add_init_script("localStorage.setItem('lrAgendaIdioma', '%s')" % idioma)
    ctx.route('**/functions/v1/google-calendar', cal); ctx.route('**/functions/v1/google-drive', drv)
    pg = abrir(ctx, '', espera); pg.wait_for_timeout(1200); return ctx, pg


def fila(pg, nombre): return pg.locator('#cx-resumen li[data-cx="%s"]' % nombre)


with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM, args=['--no-sandbox'])

    # 1. nada configurado
    ctx, pg = pagina(b, Funcion(configurada=False), Funcion(configurada=False))
    t.v('el apartado se llama «Conexiones e integraciones»', pg.locator('#centro-conexiones h3').inner_text().strip() == 'Conexiones e integraciones')
    t.v('hay una fila por servicio (Calendar, Drive y copia en la cuenta)', pg.locator('#cx-resumen li').count() == 3, pg.locator('#cx-resumen li').count())
    t.v('Calendar y Drive sin configurar: «No disponible» y sin botón', 'No disponible' in fila(pg, 'Google Calendar').inner_text() and 'No disponible' in fila(pg, 'Google Drive').inner_text() and fila(pg, 'Google Calendar').locator('button').count() == 0)
    t.v('no se imprime', 'no-imprimir' in pg.locator('.cx-centro').get_attribute('class'))
    t.v('sin errores de JavaScript', not pg.errs, pg.errs); ctx.close()

    # 2. configurados, sin conectar
    cal, drv = Funcion(), Funcion(); ctx, pg = pagina(b, cal, drv)
    t.v('sin conectar: «No conectado» en Calendar y Drive', 'No conectado' in fila(pg, 'Google Calendar').inner_text() and 'No conectado' in fila(pg, 'Google Drive').inner_text())
    t.v('cada fila ofrece «Ver y administrar»', fila(pg, 'Google Calendar').locator('button').count() == 1 and fila(pg, 'Google Drive').locator('button').count() == 1)
    t.v('las dos tarjetas explican permiso y lo que NO pueden hacer', pg.locator('#calendario-sync .cx-permiso').count() == 1 and pg.locator('#drive-sync .cx-permiso').count() == 1 and 'NO puede' in pg.locator('#calendario-sync .cx-permiso').inner_text() + pg.locator('#drive-sync .cx-permiso').inner_text(), '')
    t.v('el enlace a la cuenta de Google abre en otra pestaña y con rel seguro', pg.locator('.cx-permiso a[href="https://myaccount.google.com/permissions"][target="_blank"][rel~="noopener"]').count() == 2)
    pg.locator('#centro-conexiones button', has_text='Ver y administrar').first.click(); pg.wait_for_timeout(300)
    t.v('«Ver y administrar» lleva a la tarjeta y no conecta nada', not any(a in ('conectar', 'desconectar', 'sincronizar') for a in cal.llamadas + drv.llamadas), cal.llamadas + drv.llamadas)
    t.v('sin errores de JavaScript', not pg.errs, pg.errs); ctx.close()

    # 3. Calendar conectado
    cal, drv = Funcion(conectada=True), Funcion(); ctx, pg = pagina(b, cal, drv)
    f = fila(pg, 'Google Calendar').inner_text()
    t.v('conectado: muestra «Conectado», el correo y la última sincronización', 'Conectado' in f and 'No conectado' not in f and 'sara@gmail.com' in f and 'Última sincronización' in f, f)
    pg.locator('#cs-desconectar').click(); pg.wait_for_timeout(1200)
    t.v('al desconectar desde la tarjeta, el resumen pasa a «No conectado»', 'No conectado' in fila(pg, 'Google Calendar').inner_text(), fila(pg, 'Google Calendar').inner_text()); ctx.close()

    # 4. error visible en el resumen
    cal = Funcion(conectada=True, vencido=True); ctx, pg = pagina(b, cal, Funcion())
    pg.locator('#cs-sincronizar').click(); pg.wait_for_timeout(1200)
    f = fila(pg, 'Google Calendar').inner_text()
    t.v('permiso vencido: el resumen muestra el último aviso y vuelve a «No conectado»', 'Último aviso' in f and 'venció' in f and 'No conectado' in f, f); ctx.close()

    # 5. copia en la cuenta
    ctx, pg = pagina(b, Funcion(), Funcion())
    t.v('copia en la cuenta: muestra su estado (activada o no)', any(x in fila(pg, 'Copia en tu cuenta de Lana Rosa').inner_text() for x in ('No activada', 'Activada', 'No disponible')), fila(pg, 'Copia en tu cuenta de Lana Rosa').inner_text())
    ctx.close()

    # 6. inglés
    ctx, pg = pagina(b, Funcion(conectada=True), Funcion(), idioma='en')
    t.v('en inglés se traduce el título, el estado y los permisos', pg.locator('#centro-conexiones h3').inner_text().strip() == 'Connections and integrations' and 'Connected' in fila(pg, 'Google Calendar').inner_text() and 'What it can NOT do' in pg.locator('#calendario-sync .cx-permiso').inner_text() + pg.locator('#calendario-sync .cx-permiso').evaluate("e => { e.open = true; return e.innerText }"), fila(pg, 'Google Calendar').inner_text())
    t.v('en inglés no queda texto en español en el resumen', 'Conectado' not in fila(pg, 'Google Calendar').inner_text() and 'Ver y administrar' not in pg.locator('#cx-resumen').inner_text(), pg.locator('#cx-resumen').inner_text())
    t.v('en inglés, sin errores de JavaScript', not pg.errs, pg.errs); ctx.close()

    # 7. celular
    ctx, pg = pagina(b, Funcion(conectada=True), Funcion(), ancho=390)
    t.v('celular: sin desplazamiento horizontal y el resumen cabe', pg.evaluate("document.documentElement.scrollWidth") <= 390 and pg.locator('#cx-resumen').bounding_box()['width'] <= 390, pg.evaluate("document.documentElement.scrollWidth"))
    t.v('celular: sin errores de JavaScript', not pg.errs, pg.errs); ctx.close()

t.fin()
