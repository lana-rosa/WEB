"""Prueba el aviso ANTES de conectar Google Calendar y Drive (E30, js/agenda/aviso-conexion.js).
Uso: /usr/bin/python3 herramientas/pruebas/probar_agenda_aviso_conexion.py   (con un servidor local en el puerto 8765)"""
import json, sys
sys.path.insert(0, __file__.rsplit('/', 1)[0])
from agenda_util import *
t = Prueba()


class Funcion:
    def __init__(s): s.llamadas = []
    def __call__(s, route):
        a = (route.request.post_data_json or {}).get('accion'); s.llamadas.append(a)
        def ok(o): route.fulfill(status=200, content_type='application/json', body=json.dumps(o))
        if a == 'estado': return ok({'configurado': True, 'conectado': False, 'correo': None, 'ultima': None})
        if a == 'conectar': return ok({'url': 'https://accounts.google.com/o/oauth2/v2/auth?client_id=prueba'})
        ok({'ok': True})


def pagina(b, cal, drv, ancho=1280):
    ctx = contexto(b, ancho, 900, datos={'ag-duena': 'Sara'})
    ctx.route('**/functions/v1/google-calendar', cal); ctx.route('**/functions/v1/google-drive', drv)
    ctx.route('https://accounts.google.com/**', lambda r: r.fulfill(status=200, content_type='text/html', body='<html>Google</html>'))
    pg = abrir(ctx, '', 2200); pg.wait_for_timeout(800); return ctx, pg


ACCESO = 'El acceso del equipo de Lana Rosa Crochet a la información sincronizada con Google está restringido.'
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM, args=['--no-sandbox'])
    for nombre, boton, extra in (('Calendar', '#cs-conectar', 'calendario'), ('Drive', '#ds-conectar', 'carpeta oculta')):
        cal, drv = Funcion(), Funcion(); ctx, pg = pagina(b, cal, drv); fn = cal if nombre == 'Calendar' else drv
        pg.click(boton); pg.wait_for_timeout(500)
        txt = pg.inner_text('#modal-conexion')
        t.v(nombre + ': al tocar «Conectar» sale el aviso y todavía no se llama a Google', pg.locator('#modal-conexion').is_visible() and 'conectar' not in fn.llamadas and 'Antes de conectar' in txt, fn.llamadas)
        t.v(nombre + ': dice qué se consulta, qué se guarda, para qué, permiso, cómo desconectar y qué pasa después', all(x in txt for x in ('Qué datos se consultan', 'Qué se crea o se guarda', 'Para qué', 'Qué permiso pide', 'Cómo desconectar', 'Qué pasa después')) and extra in txt, txt[:200])
        t.v(nombre + ': trae el texto del acceso del equipo (punto 8 de la abogada)', ACCESO in txt)
        t.v(nombre + ': el botón «Conectar» está apagado hasta marcar la casilla', pg.locator('#mc-conectar').is_disabled() and not pg.locator('#mc-acepto').is_checked())
        pg.click('#mc-cancelar'); pg.wait_for_timeout(500)
        t.v(nombre + ': «Cancelar» cierra y no conecta nada', not pg.locator('#modal-conexion').is_visible() and 'conectar' not in fn.llamadas and pg.url.startswith('http://localhost'), (fn.llamadas, pg.url))
        pg.click(boton); pg.wait_for_timeout(400); pg.keyboard.press('Escape'); pg.wait_for_timeout(400)
        t.v(nombre + ': Esc también cierra sin conectar', not pg.locator('#modal-conexion').is_visible() and 'conectar' not in fn.llamadas)
        pg.click(boton); pg.wait_for_timeout(400); pg.check('#mc-acepto'); pg.wait_for_timeout(200)
        t.v(nombre + ': al marcar la casilla se activa «Conectar ' + 'Google ' + nombre + '»', pg.locator('#mc-conectar').is_enabled() and ('Conectar Google ' + nombre) in pg.inner_text('#mc-conectar'))
        pg.click('#mc-conectar'); pg.wait_for_timeout(1500)
        t.v(nombre + ': solo después de aceptar se va a Google', 'conectar' in fn.llamadas and pg.url.startswith('https://accounts.google.com/'), (fn.llamadas, pg.url))
        t.v(nombre + ': sin errores de JavaScript', not pg.errs, pg.errs); ctx.close()
    cal, drv = Funcion(), Funcion(); ctx, pg = pagina(b, cal, drv, ancho=390)
    pg.click('#cs-conectar'); pg.wait_for_timeout(500)
    bb = pg.locator('#modal-conexion').bounding_box()
    t.v('celular: el aviso cabe en la pantalla y sin desplazamiento horizontal', bb['width'] <= 390 and pg.evaluate("document.documentElement.scrollWidth") <= 390, bb)
    t.v('celular: el texto se puede recorrer hasta el botón (la ventana se desplaza)', pg.evaluate("() => { const d = document.getElementById('modal-conexion'); return d.scrollHeight > d.clientHeight; }") and pg.locator('#mc-conectar').count() == 1)
    ctx.close()
t.fin()
