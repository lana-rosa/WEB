#!/usr/bin/env python3
"""Personaliza: autorización expresa para recibir y guardar las fotos de referencia (17-oct-2026).

Uso: con un servidor local en el puerto 8765 (python3 -m http.server 8765 desde la raíz del repositorio):
    python3 herramientas/pruebas/probar_fotos_autorizacion.py [carpeta_capturas]
Todo Supabase va simulado: no se sube nada ni se crea ninguna solicitud real.
"""
import base64, json, os, sys, tempfile
from playwright.sync_api import sync_playwright

BASE = os.environ.get('BASE', 'http://localhost:8765')
CHROMIUM = os.environ.get('CHROMIUM', '/opt/pw-browsers/chromium')
CAPTURAS = sys.argv[1] if len(sys.argv) > 1 else None
PNG = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==')
ok = fallos = 0


def v(nombre, cond, extra=''):
    global ok, fallos
    if cond: ok += 1; print('  ok  ', nombre)
    else: fallos += 1; print('  FALLA', nombre, extra)


def abrir(b, ancho):
    ctx = b.new_context(viewport={'width': ancho, 'height': 900})
    pg = ctx.new_page()
    pg.errores, pg.subidas, pg.rpc = [], [], []
    pg.on('pageerror', lambda e: pg.errores.append(str(e)))

    def storage(r):
        pg.subidas.append(r.request.url); r.fulfill(status=200, content_type='application/json', body='{"Key":"x"}')

    def rpc(r):
        pg.rpc.append(json.loads(r.request.post_data or '{}')); r.fulfill(status=200, content_type='application/json', body='"OPP-PRUEBA-1"')
    pg.route(lambda u: 'supabase.co' in u, lambda r: r.fulfill(status=200, content_type='application/json', body='[]'))
    pg.route(lambda u: 'supabase.co/storage/' in u, storage)
    pg.route(lambda u: 'rpc/crear_solicitud_personalizada_v2' in u, rpc)
    pg.add_init_script("try{localStorage.setItem('lrConsent',JSON.stringify({v:1,a:false,t:'2026-10-17'}))}catch(e){}")
    pg.goto(BASE + '/personaliza.html?modo=formulario', wait_until='load')
    pg.wait_for_timeout(1200)
    return ctx, pg


def llenar(pg):
    pg.select_option('#tipo-producto', 'Llavero'); pg.select_option('#tamano', '5 cm'); pg.select_option('#ciudad', 'Villamaría')
    pg.fill('#nombre', 'Clienta de prueba'); pg.fill('#telefono', '3001234567')
    pg.fill('#descripcion', 'Un amigurumi de mi perrito'); pg.check('#acepto-datos')


with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM)
    carpeta = tempfile.mkdtemp()
    foto = os.path.join(carpeta, 'ref.png'); open(foto, 'wb').write(PNG)

    for ancho in (390, 1280):
        print('\n[%d px]' % ancho)
        ctx, pg = abrir(b, ancho)
        v('la casilla de fotos está oculta y no es obligatoria mientras no hay fotos', pg.locator('#acepto-fotos-caja').is_hidden() and not pg.evaluate("document.getElementById('acepto-fotos').required"))
        v('la casilla de datos ya no habla de fotos', 'fotos' not in pg.locator('#acepto-datos + span').inner_text().lower())
        v('la casilla de publicar sigue siendo opcional y separada', not pg.evaluate("document.getElementById('acepto-publicar').required") and pg.evaluate("document.getElementById('acepto-publicar') !== document.getElementById('acepto-fotos')"))

        pg.set_input_files('#foto', foto)
        v('al adjuntar una foto aparece la casilla y es obligatoria', pg.locator('#acepto-fotos-caja').is_visible() and pg.evaluate("document.getElementById('acepto-fotos').required"))
        v('el texto dice que se guardan en almacenamiento privado, que no se publican y cómo pedir el borrado', all(t in pg.locator('#acepto-fotos-caja').inner_text().lower() for t in ('almacenamiento privado', 'no se publican', 'contacto@lanarosacrochet.com')))
        v('sin desplazamiento horizontal', pg.evaluate('document.documentElement.scrollWidth <= window.innerWidth'))
        if CAPTURAS and ancho == 390:
            pg.locator('#acepto-fotos-caja').scroll_into_view_if_needed(); pg.screenshot(path=os.path.join(CAPTURAS, 'fotos_autorizacion_390.png'))

        llenar(pg)
        pg.click('#boton-enviar'); pg.wait_for_timeout(800)
        v('con foto y sin marcar la autorización no se sube nada ni se crea la solicitud', not pg.subidas and not pg.rpc)
        v('el navegador señala la casilla pendiente', pg.evaluate("[...document.querySelectorAll('input:invalid, select:invalid, textarea:invalid')].map(e => e.id)") == ['acepto-fotos'])

        pg.check('#acepto-fotos'); pg.click('#boton-enviar'); pg.wait_for_timeout(1500)
        v('con la autorización se sube la foto', len(pg.subidas) == 1, pg.subidas)
        c = pg.rpc[0] if pg.rpc else {}
        v('al servidor viajan las autorizaciones: datos, guardar fotos y la versión del texto', c.get('p_acepta_datos') is True and c.get('p_acepta_fotos') is True and c.get('p_version_texto') == '2026-10-17', c)
        v('publicar la foto del pedido terminado viaja como NO por defecto', c.get('p_acepta_publicar') is False, c)
        v('el mensaje ya no lleva la constancia escrita por la página (la escribe el servidor)', 'Autorizaciones' not in (c.get('p_mensaje') or ''), c.get('p_mensaje'))
        v('tras enviar, la casilla vuelve a esconderse', pg.locator('#acepto-fotos-caja').is_hidden())
        v('sin errores de JavaScript', not pg.errores, pg.errores)
        ctx.close()

        ctx, pg = abrir(b, ancho)
        llenar(pg); pg.click('#boton-enviar'); pg.wait_for_timeout(1500)
        c = pg.rpc[0] if pg.rpc else {}
        v('sin fotos se puede enviar sin la casilla; viaja p_acepta_fotos = false y sin fotos', len(pg.rpc) == 1 and not pg.subidas and c.get('p_acepta_fotos') is False and c.get('p_fotos_urls') is None, c)
        pg.set_input_files('#foto', foto); pg.check('#acepto-fotos')
        pg.set_input_files('#foto', [])
        v('si se quitan las fotos la casilla se esconde y se desmarca', pg.locator('#acepto-fotos-caja').is_hidden() and not pg.evaluate("document.getElementById('acepto-fotos').checked"))
        ctx.close()

    print('\n[Política de datos]')
    ctx = b.new_context(); pg = ctx.new_page(); pg.route(lambda u: 'supabase.co' in u or 'google' in u, lambda r: r.abort())
    pg.goto(BASE + '/politicas.html#datos', wait_until='load')
    t = pg.locator('#datos').inner_text().lower()
    v('el apartado 4 explica la autorización de las fotos, el almacenamiento privado y cómo pedir el borrado', 'autorización expresa' in t and 'almacenamiento privado' in t and 'se borren las fotografías' in t)
    ctx.close(); b.close()

print('\n%d comprobaciones correctas, %d con falla.' % (ok, fallos))
sys.exit(1 if fallos else 0)
