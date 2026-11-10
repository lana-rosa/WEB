"""Prueba «Guardar informes y copias en tu Drive» (etapa 4, js/agenda/drive-archivos.js) con la función `google-drive-archivos` y la API de Drive SIMULADAS.
Uso: /usr/bin/python3 herramientas/pruebas/probar_agenda_drive_archivos.py   (con un servidor local en el puerto 8765)"""
import json, re, sys
sys.path.insert(0, __file__.rsplit('/', 1)[0])
from agenda_util import *
t = Prueba()
DATOS = {'ag-p1-cliente': 'Ana', 'ag-p1-pedido': 'Oso', 'ag-p1-entrega': '15/12/2026'}


class Nube:
    def __init__(s, configurada=True, conectada=False, vencido=False):
        s.configurada, s.conectada, s.vencido, s.llamadas, s.archivos, s.carpetas, s.n = configurada, conectada, vencido, [], {}, {}, 0
    def funcion(s, route):
        c = route.request.post_data_json or {}; a = c.get('accion'); s.llamadas.append(a)
        def ok(o, st=200): route.fulfill(status=st, content_type='application/json', body=json.dumps(o))
        if not s.configurada: return ok({'configurado': False})
        if a == 'estado': return ok({'configurado': True, 'conectado': s.conectada, 'correo': 'sara@gmail.com' if s.conectada else None, 'ultimo': None})
        if a == 'conectar': return ok({'url': 'https://accounts.google.com/o/oauth2/v2/auth?client_id=prueba'})
        if a == 'token':
            if s.vencido: return ok({'error': 'El permiso venció. Vuelve a conectar tu Google Drive.', 'reconectar': True}, 401)
            return ok({'access_token': 'tok', 'expires_in': 3300})
        if a == 'guardado': return ok({'ok': True})
        if a == 'desconectar': s.conectada = False; return ok({'ok': True})
        ok({'error': 'Acción no válida'}, 400)
    def api(s, route):
        r = route.request; url = r.url; H = {'Access-Control-Allow-Origin': '*', 'Access-Control-Expose-Headers': 'Location'}
        js = lambda o, st=200: route.fulfill(status=st, content_type='application/json', headers=H, body=json.dumps(o))
        if r.method == 'OPTIONS': return route.fulfill(status=204, headers={'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': '*', 'Access-Control-Expose-Headers': 'Location'})
        if '/upload/' in url and 'uploadType=multipart' in url:
            cuerpo = r.post_data_buffer or b''; txt = cuerpo.decode('latin1')
            meta = json.loads(re.search(r'\r\n\r\n(\{.*?\})\r\n--', txt, re.S).group(1))
            s.n += 1; fid = 'a%d' % s.n; s.archivos[fid] = {'id': fid, 'name': meta['name'], 'parents': meta.get('parents'), 'bytes': len(cuerpo), 'via': 'multipart'}
            return js({'id': fid, 'name': meta['name']})
        if '/upload/' in url and 'uploadType=resumable' in url:
            if r.method == 'POST':
                meta = json.loads(r.post_data); s.n += 1; fid = 'a%d' % s.n; s.archivos[fid] = {'id': fid, 'name': meta['name'], 'parents': meta.get('parents'), 'via': 'resumable'}
                return route.fulfill(status=200, content_type='application/json', headers=dict(H, Location='https://www.googleapis.com/upload/sesion/' + fid), body='{}')
        if '/upload/sesion/' in url and r.method == 'PUT':
            fid = url.rsplit('/', 1)[1]; s.archivos[fid]['bytes'] = len(r.post_data_buffer or b''); return js({'id': fid, 'name': s.archivos[fid]['name']})
        if url.split('?')[0].endswith('/drive/v3/files') and r.method == 'POST':
            meta = json.loads(r.post_data); s.n += 1; fid = 'c%d' % s.n; s.carpetas[fid] = {'id': fid, 'webViewLink': 'https://drive.google.com/drive/folders/' + fid, 'name': meta['name']}
            return js(s.carpetas[fid])
        q = re.search(r'[?&]q=([^&]+)', url); q = __import__('urllib.parse').parse.unquote(q.group(1)) if q else ''
        if 'mimeType' in q: return js({'files': list(s.carpetas.values())})
        return js({'files': []})


def pagina(b, nube, ancho=1280, idioma=None, ruta=''):
    ctx = contexto(b, ancho, 900, datos=DATOS)
    if idioma: ctx.add_init_script("localStorage.setItem('lrAgendaIdioma', '%s')" % idioma)
    ctx.route('**/functions/v1/google-drive-archivos', nube.funcion); ctx.route('**/functions/v1/google-drive', lambda r: r.fulfill(status=200, content_type='application/json', body='{"configurado":false}'))
    ctx.route('**/functions/v1/google-calendar', lambda r: r.fulfill(status=200, content_type='application/json', body='{"configurado":false}'))
    ctx.route('https://www.googleapis.com/**', nube.api)
    ctx.route('https://accounts.google.com/**', lambda r: r.fulfill(status=200, content_type='text/html', body='<html>Google</html>'))
    pg = abrir(ctx, '', 300)
    if ruta: pg.goto(BASE + '/agenda-rosina.html' + ruta)
    pg.wait_for_timeout(2300); return ctx, pg


with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM, args=['--no-sandbox'])

    n = Nube(configurada=False); ctx, pg = pagina(b, n)
    t.v('función sin desplegar o sin configurar: la tarjeta no aparece (y nada se rompe)', pg.locator('#drive-archivos').is_hidden() and not pg.errs, pg.errs); ctx.close()

    n = Nube(); ctx, pg = pagina(b, n)
    t.v('sin conectar: aparece con «Conectar» y nada más', pg.locator('#drive-archivos').is_visible() and pg.locator('#da-conectar').is_visible() and pg.locator('#da-excel').is_hidden() and pg.locator('#da-copia').is_hidden() and pg.locator('#da-desconectar').is_hidden())
    t.v('explica el permiso y lo que NO puede hacer, y no se imprime', 'NO puede' in pg.locator('#drive-archivos .cx-permiso').inner_text() and 'no-imprimir' in pg.locator('#drive-archivos').get_attribute('class'))
    pg.click('#da-conectar'); pg.wait_for_timeout(500)
    t.v('«Conectar» muestra primero el aviso (servicio «archivos») y todavía no llama a Google', pg.locator('#modal-conexion').is_visible() and 'guardar informes y copias' in pg.inner_text('#modal-conexion') and 'conectar' not in n.llamadas and pg.locator('#mc-conectar').is_disabled(), n.llamadas)
    t.v('el aviso dice que solo guarda cuando la persona lo pide y que no se reemplaza nada', 'olo cuando tú lo pides' in pg.inner_text('#modal-conexion') and 'Nunca se borra ni se reemplaza' in pg.inner_text('#modal-conexion'))
    pg.click('#mc-cancelar'); pg.wait_for_timeout(300)
    t.v('«Cancelar» no conecta nada', 'conectar' not in n.llamadas and pg.url.startswith('http://localhost'))
    pg.click('#da-conectar'); pg.wait_for_timeout(300); pg.check('#mc-acepto'); pg.click('#mc-conectar'); pg.wait_for_timeout(1500)
    t.v('al aceptar, va a Google', 'conectar' in n.llamadas and pg.url.startswith('https://accounts.google.com/'), pg.url); ctx.close()

    n = Nube(conectada=True); ctx, pg = pagina(b, n)
    t.v('conectada: muestra el correo y los botones de guardar, sin «Conectar»', 'sara@gmail.com' in pg.inner_text('#da-texto') and pg.locator('#da-excel').is_visible() and pg.locator('#da-copia').is_visible() and pg.locator('#da-conectar').is_hidden() and pg.locator('#da-abrir').is_hidden())
    t.v('no sube nada por sí sola', not n.archivos and not n.carpetas)
    pg.click('#da-excel'); pg.wait_for_timeout(2500)
    xs = [a for a in n.archivos.values() if a['name'].endswith('.xlsx')]
    t.v('«Guardar el Excel»: crea la carpeta «Agenda para tejedoras» y sube un .xlsx con fecha y hora en el nombre', len(n.carpetas) == 1 and len(xs) == 1 and re.match(r'^agenda-para-tejedoras-\d{4}-\d{2}-\d{2}-\d{4}\.xlsx$', xs[0]['name']) and xs[0]['parents'] == list(n.carpetas), [list(n.carpetas), [a['name'] for a in n.archivos.values()]])
    t.v('el archivo tiene el contenido del libro (un .xlsx es un zip: empieza con PK)', xs[0]['bytes'] > 1000)
    t.v('lo dice y aparece «Abrir mi carpeta»', 'Listo' in pg.inner_text('#da-aviso') and pg.locator('#da-abrir').is_visible(), pg.inner_text('#da-aviso'))
    pg.click('#da-copia'); pg.wait_for_timeout(2500)
    js_ = [a for a in n.archivos.values() if a['name'].endswith('.json')]
    t.v('«Guardar una copia»: sube el .json a la misma carpeta (no crea otra)', len(js_) == 1 and len(n.carpetas) == 1 and js_[0]['parents'] == list(n.carpetas) and re.match(r'^agenda-rosina-\d{4}-\d{2}-\d{2}-\d{4}\.json$', js_[0]['name']), [list(n.carpetas), [a['name'] for a in n.archivos.values()]])
    t.v('la función anota el último guardado y la fila de Conexiones lo muestra', 'guardado' in n.llamadas and 'Último guardado' in pg.inner_text('#cx-resumen'), pg.inner_text('#cx-resumen'))
    t.v('«Desconectar» avisa a la función y vuelve a «Conectar» (lo guardado se queda en su Drive)', (pg.click('#da-desconectar'), pg.wait_for_timeout(800))[1] is None and 'desconectar' in n.llamadas and pg.locator('#da-conectar').is_visible() and len(n.archivos) == 2)
    t.v('sin errores de JavaScript', not pg.errs, pg.errs); ctx.close()

    # una copia grande va por partes
    n = Nube(conectada=True); ctx, pg = pagina(b, n)
    pg.evaluate("() => { const d = window.lrAgendaNucleo.datos(); d._dib = { 'puntos:1': { s: [], img: 'data:image/jpeg;base64,' + 'A'.repeat(5000000) } }; }")
    pg.click('#da-copia'); pg.wait_for_timeout(4000)
    t.v('una copia de más de 4 MB se sube por partes (subida resumible) y completa', any(a['via'] == 'resumable' and a['bytes'] > 4900000 for a in n.archivos.values()), [(a['via'], a.get('bytes')) for a in n.archivos.values()]); ctx.close()

    # permiso vencido
    n = Nube(conectada=True, vencido=True); ctx, pg = pagina(b, n)
    pg.click('#da-excel'); pg.wait_for_timeout(1500)
    t.v('permiso vencido: lo explica y no sube nada', 'venció' in pg.inner_text('#da-aviso') and not n.archivos, pg.inner_text('#da-aviso')); ctx.close()

    # vuelta de Google y resumen
    n = Nube(conectada=True); ctx, pg = pagina(b, n, ruta='?driveArchivos=conectado')
    t.v('al volver de Google lo dice y limpia la dirección', 'Conectado' in pg.inner_text('#da-aviso') and 'driveArchivos' not in pg.url, (pg.url, pg.inner_text('#da-aviso')))
    t.v('el resumen de Conexiones tiene su fila (4 en total)', pg.locator('#cx-resumen li[data-cx="Informes y copias en tu Drive"]').count() == 1 and 'Conectado' in pg.locator('#cx-resumen li[data-cx="Informes y copias en tu Drive"]').inner_text() and pg.locator('#cx-resumen li').count() == 4, pg.locator('#cx-resumen li').count()); ctx.close()

    # inglés y celular
    n = Nube(conectada=True); ctx, pg = pagina(b, n, idioma='en')
    t.v('en inglés se traduce la tarjeta', 'Save reports and backups in your Drive' in pg.inner_text('#drive-archivos') and 'Save a backup in my Drive' in pg.inner_text('#drive-archivos') and 'Guardar' not in pg.inner_text('#drive-archivos'), pg.inner_text('#drive-archivos')[:200]); ctx.close()
    n = Nube(conectada=True); ctx, pg = pagina(b, n, ancho=390)
    t.v('celular: sin desplazamiento horizontal y la tarjeta cabe', pg.evaluate("document.documentElement.scrollWidth") <= 390 and pg.locator('#drive-archivos').bounding_box()['width'] <= 390)
    t.v('celular: sin errores de JavaScript', not pg.errs, pg.errs); ctx.close()
t.fin()
