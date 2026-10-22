#!/usr/bin/env python3
"""Pruebas funcionales de páginas de servicio y herramientas (auditoría 360; datos simulados; sin producción ni cobros).

    python3 herramientas/auditoria-360/scripts/probar_flujos_servicio.py
Cubre: gracias (estados del pedido), baja de recordatorios, 404, sin conexión, cuenta, agenda (puerta), descargas de recursos, glosario,
calculadora de lana, Revista (filtros), preguntas frecuentes (teclado) y contacto (enlaces).
"""
import json, re, sys
from urllib.parse import urlsplit, unquote
from playwright.sync_api import sync_playwright
BASE = 'http://localhost:8765'
CORS = {'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*'}
res = []
def r(nombre, ok, dato=''):
    res.append((nombre, ok)); print(('OK    ' if ok else 'FALLA ') + nombre + ('' if ok and not dato else '  → ' + str(dato)[:220]))

class Ctx:
    def __init__(s, b, ancho=390, estado=None, baja=None):
        s.estado = estado; s.baja = baja; s.llamadas = []
        s.c = b.new_context(viewport={'width': ancho, 'height': 850}); s.c.route('**/*', s.stub); s.pg = s.c.new_page(); s.errs = []
        s.pg.on('pageerror', lambda e: s.errs.append(str(e)[:120]))
    def stub(s, route):
        req = route.request; u = req.url; h = urlsplit(u)
        if h.hostname in ('localhost', '127.0.0.1'): return route.continue_()
        if req.method == 'OPTIONS': return route.fulfill(status=204, headers=CORS)
        s.llamadas.append((req.method, u.split('?')[0].replace('https://', '')[:90]))
        if h.hostname and h.hostname.endswith('supabase.co'):
            if 'estado_pedido_web' in u: return route.fulfill(status=200, content_type='application/json', headers=CORS, body=json.dumps([s.estado] if s.estado else []))
            if 'pedido_web_es_' in u: return route.fulfill(status=200, content_type='application/json', headers=CORS, body='false')
            if 'carrito-baja' in u: return route.fulfill(status=200, content_type='application/json', headers=CORS, body=json.dumps({'ok': s.baja is not False}))
            if '/auth/v1/otp' in u or '/auth/' in u: return route.fulfill(status=200, content_type='application/json', headers=CORS, body='{}')
            return route.fulfill(status=200, content_type='application/json', headers=CORS, body='[]')
        return route.abort()
    def ir(s, ruta, espera=1200):
        s.pg.goto(BASE + ruta, wait_until='domcontentloaded'); s.pg.wait_for_timeout(espera)
        try: s.pg.get_by_role('button', name='Rechazar').click(timeout=800)
        except Exception: pass
        return s.pg
    def cerrar(s): s.c.close()

with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/opt/pw-browsers/chromium', args=['--no-sandbox'])
    # ---------- gracias.html
    print('\n[gracias.html: estados del pedido]')
    for estado, esperado in ((dict(estado='pagado', total=100700, nombre='Ana'), 'Gracias'), (dict(estado='rechazado', total=100700, nombre='Ana'), 'No se completó'),):
        x = Ctx(b, 390, estado); pg = x.ir('/gracias.html?ref=LRW-2026-0001-ABCD', 2500)
        t = pg.evaluate("document.getElementById('gr-titulo').textContent")
        r(f"gracias con pedido «{estado['estado']}» muestra «{esperado}…»", esperado in t, t)
        if estado['estado'] == 'pagado':
            dl = pg.evaluate("(window.dataLayer||[]).filter(e=>e&&e.event==='purchase').length")
            r('gracias pagado: envía el evento de compra una sola vez', dl == 1, dl)
            ctr = pg.evaluate("localStorage.getItem('carritoLanaRosa')")
            r('gracias pagado: vacía el carrito guardado', ctr in ('[]', None), ctr)
        x.cerrar()
    x = Ctx(b, 390, None); pg = x.ir('/gracias.html?ref=NO-ES-UN-PEDIDO', 1500)
    t = pg.evaluate("document.getElementById('gr-titulo').textContent")
    r('gracias con referencia inválida no consulta la base y ofrece ayuda', 'No encontramos' in t and not any('estado_pedido_web' in u for _, u in x.llamadas), (t, x.llamadas[:2]))
    x.cerrar()
    x = Ctx(b, 390, dict(estado='pendiente', total=1000, nombre='')); pg = x.ir('/gracias.html?ref=LRW-2026-0001-ABCD', 2000)
    t = pg.evaluate("document.getElementById('gr-titulo').textContent"); r('gracias con pago pendiente muestra un estado de espera (no «pagado»)', 'Gracias' not in t, t); x.cerrar()
    # ---------- baja de recordatorios
    print('\n[baja-recordatorios.html]')
    x = Ctx(b, 390, None, True); pg = x.ir('/baja-recordatorios.html?t=11111111-2222-3333-4444-555555555555', 1500)
    t = pg.evaluate("document.getElementById('titulo').textContent"); r('baja con token válido confirma la baja', 'Listo' in t, t); x.cerrar()
    x = Ctx(b, 390, None, True); pg = x.ir('/baja-recordatorios.html?t=malo', 1000)
    t = pg.evaluate("document.getElementById('titulo').textContent"); tx = pg.evaluate("document.getElementById('texto').textContent")
    r('baja con token inválido explica qué hacer (escribir al correo)', 'No pudimos' in t and 'contacto@' in tx, (t, tx[:80])); x.cerrar()
    x = Ctx(b, 390, None, False); pg = x.ir('/baja-recordatorios.html?t=11111111-2222-3333-4444-555555555555', 1500)
    t = pg.evaluate("document.getElementById('titulo').textContent"); r('baja cuando el servidor falla muestra el mensaje de ayuda', 'No pudimos' in t, t); x.cerrar()
    # ---------- 404 / offline
    print('\n[404 y sin conexión]')
    x = Ctx(b, 390); pg = x.ir('/404.html', 800)
    r('404: título, botón «Ir al inicio» y «Ver la tienda»', pg.locator('h1').count() == 1 and pg.get_by_role('link', name='Ir al inicio').count() == 1 and pg.get_by_role('link', name='Ver la tienda').count() == 1)
    r('404: lleva el pie con redes y datos de contacto', pg.locator('.pie-redes a').count() == 5 and 'contacto@lanarosacrochet.com' in pg.evaluate("document.body.innerText"))
    x.cerrar()
    x = Ctx(b, 390); pg = x.ir('/offline.html', 800)
    r('sin conexión: la página tiene un mensaje y un botón/enlace para reintentar', pg.locator('h1').count() >= 1 and (pg.get_by_role('link').count() + pg.get_by_role('button').count()) >= 1, pg.evaluate("document.body.innerText.slice(0,160)")); x.cerrar()
    # ---------- cuenta
    print('\n[cuenta.html]')
    x = Ctx(b, 390); pg = x.ir('/cuenta.html', 1500)
    tx = pg.evaluate("document.body.innerText"); botones = pg.evaluate("[...document.querySelectorAll('button,a.boton-primario,a.boton-secundario')].map(e=>e.textContent.trim()).filter(Boolean).slice(0,14)")
    r('cuenta: ofrece ingresar con Google y con enlace al correo', 'Google' in tx and ('correo' in tx.lower()), botones)
    pg.locator('#c-nombre').fill('Prueba'); pg.locator('#c-telefono').fill('3001234567'); pg.locator('#c-correo').fill('correo-malo')
    pg.get_by_role('button', name='Crear mi cuenta').last.click(); pg.wait_for_timeout(500)
    msg = pg.evaluate("[...document.querySelectorAll('[role=alert], .mensaje-cuenta, .error, #mensaje-cuenta')].map(e=>e.textContent.trim()).filter(Boolean).join(' | ')")
    inval = pg.evaluate("document.getElementById('c-correo').validity.valid === false")
    r('cuenta: un correo inválido no avanza (aviso o validación del navegador)', bool(msg) or inval, (msg, inval))
    pg.locator('#c-correo').fill('prueba@example.com'); pg.get_by_role('button', name='Crear mi cuenta').last.click(); pg.wait_for_timeout(500)
    msg = pg.evaluate("[...document.querySelectorAll('[role=alert], .mensaje-cuenta, .error, #mensaje-cuenta')].map(e=>e.textContent.trim()).filter(Boolean).join(' | ')")
    sin_acepto = pg.evaluate("document.getElementById('c-acepto').validity.valid === false")
    r('cuenta: sin aceptar el tratamiento de datos no se crea la cuenta', bool(msg) or sin_acepto, (msg, sin_acepto))
    r('cuenta: la casilla de novedades viene sin marcar y la de datos también', pg.evaluate("[document.getElementById('c-acepto').checked, document.getElementById('c-novedades').checked]") == [False, False])
    r('cuenta: no pide contraseña', pg.locator('input[type=password]').count() == 0)
    x.cerrar()
    # ---------- agenda: puerta
    print('\n[agenda-rosina.html como visitante]')
    x = Ctx(b, 390); pg = x.ir('/agenda-rosina.html', 2000)
    t = pg.evaluate("document.body.innerText")
    r('agenda: sin cuenta aparece la puerta «gratis con tu cuenta» con Google y correo', 'gratis con tu cuenta' in t and pg.locator('.candado-agenda a').count() >= 3)
    bloq = pg.evaluate("(()=>{const z=document.querySelector('.zona-agenda'); return z && z.classList.contains('bloqueada')})()")
    r('agenda: el contenido queda bloqueado para quien no tiene sesión', bool(bloq))
    prom = 'llena tus hojas aquí mismo' in t
    r('COHERENCIA: el texto de arriba no promete llenar las hojas sin cuenta si la puerta las bloquea', not (prom and bloq), 'La cabecera dice «llena tus hojas aquí mismo (se guardan en tu dispositivo)» pero, sin cuenta, las hojas están bloqueadas')
    x.cerrar()
    # ---------- recursos: descargas con puerta
    print('\n[recursos-rosina.html: descargas]')
    x = Ctx(b, 390); pg = x.ir('/recursos-rosina.html', 2000)
    n_desc = pg.locator('a[download]').count()
    ocultas_al_cargar = pg.locator('a[download]:visible').count()
    boton = pg.get_by_role('button', name=re.compile('Ver los stickers')).element_handle(); exp0 = boton.get_attribute('aria-expanded'); boton.click(); pg.wait_for_timeout(400)
    r('recursos: «Ver los stickers» es un botón plegable con aria-expanded (false → true)', exp0 == 'false' and boton.get_attribute('aria-expanded') == 'true', (exp0, boton.get_attribute('aria-expanded')))
    descargas = []; pg.on('download', lambda d: descargas.append(d.suggested_filename))
    a = pg.locator('a[download]:visible').first
    a.evaluate("e=>e.scrollIntoView({block:'center'})"); pg.wait_for_timeout(300); a.click(); pg.wait_for_timeout(800)
    dlg = pg.evaluate("(()=>{const c=document.querySelector('.sus-caja'); return c ? {rol:c.getAttribute('role'), modal:c.getAttribute('aria-modal'), texto:c.innerText.slice(0,120)} : null})()")
    r(f'recursos: sin cuenta, tocar una de las {n_desc} descargas (todas con puerta) abre la ventana de cuenta gratis (diálogo accesible) y no baja el archivo', bool(dlg) and dlg['rol'] == 'dialog' and not descargas, (dlg, descargas))
    if dlg:
        enlaces = pg.evaluate("[...document.querySelectorAll('.sus-caja a')].map(a=>a.getAttribute('href'))")
        r('recursos: la ventana lleva a /cuenta.html con ?volver=…', any(l and l.startswith('/cuenta.html') and 'volver=' in l for l in enlaces), enlaces)
        pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
        r('recursos: Esc cierra la ventana', pg.locator('.sus-caja').count() == 0 or not pg.locator('.sus-caja').first.is_visible())
    x.cerrar()
    # ---------- glosario y calculadora
    print('\n[glosario y calculadora]')
    x = Ctx(b, 390); pg = x.ir('/glosario-rosina.html', 1200)
    total = pg.evaluate("document.querySelectorAll('.termino, article.termino, .tarjeta-termino, [data-termino]').length")
    pg.fill('#buscar-termino', 'anillo'); pg.wait_for_timeout(500)
    vis = pg.evaluate("[...document.querySelectorAll('.termino, article.termino, .tarjeta-termino, [data-termino]')].filter(e=>e.offsetParent!==null).length")
    r('glosario: buscar «anillo» reduce la lista y deja al menos un resultado', 0 < vis < max(total, 2), (total, vis))
    pg.fill('#buscar-termino', 'xyzxyz'); pg.wait_for_timeout(400)
    t = pg.evaluate("document.body.innerText.toLowerCase()")
    r('glosario: una búsqueda sin resultados lo dice', any(k in t for k in ('no encontr', 'sin resultado', 'ningún término', 'no hay')), '')
    x.cerrar()
    x = Ctx(b, 390); pg = x.ir('/calculadoras-rosina.html#lana', 1500)
    pg.fill('#la-mancho', '10'); pg.fill('#la-malto', '10'); pg.fill('#la-mpeso', '5'); pg.fill('#la-ancho', '100'); pg.fill('#la-alto', '100'); pg.fill('#la-ovillo', '100')
    pg.evaluate("document.getElementById('form-lana').dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}))"); pg.wait_for_timeout(500)
    texto = pg.evaluate("(document.getElementById('res-lana')||{}).innerText||''")
    # muestra 10x10 cm pesa 5 g → 100x100 cm = 100 muestras = 500 g → 5 ovillos de 100 g
    r('calculadora de lana: 100×100 cm con muestra 10×10 cm de 5 g da 500 g (5 ovillos de 100 g)', '500' in texto.replace('.', '').replace(' ', '') and ('5 ovillo' in texto or '5 ovillos' in texto or 'ovillos' in texto), texto[:200])
    pg.fill('#la-mpeso', '0'); pg.evaluate("document.getElementById('form-lana').dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}))"); pg.wait_for_timeout(400)
    t2 = pg.evaluate("(document.getElementById('res-lana')||{}).innerText||''")
    r('calculadora de lana: con peso 0 no muestra números absurdos (NaN/Infinity)', 'NaN' not in t2 and 'Infinity' not in t2, t2[:120])
    x.cerrar()
    # ---------- Revista
    print('\n[Revista]')
    x = Ctx(b, 390); pg = x.ir('/revista.html', 1200)
    cuenta = "[...document.querySelectorAll('.tarjeta-revista')].filter(e=>e.offsetParent!==null).length"
    total = pg.evaluate("document.querySelectorAll('.tarjeta-revista').length"); inicial = pg.evaluate(cuenta)
    r('Revista: la portada de una casa muestra solo los artículos de esa casa (Tienda: parte de los artículos)', 0 < inicial < total, (inicial, total))
    pg.locator('[data-filtro="regalos"]').first.click(); pg.wait_for_timeout(400)
    vis = pg.evaluate(cuenta); r('Revista: el filtro «Regalos» reduce la lista', 0 < vis < inicial, (inicial, vis))
    pg.locator('[data-filtro="todas"]').first.click(); pg.wait_for_timeout(300)
    r('Revista: «Todo» vuelve a la lista inicial de la casa', pg.evaluate(cuenta) == inicial, (inicial, pg.evaluate(cuenta)))
    pg.locator('[data-filtro="rosina"]').first.click(); pg.wait_for_timeout(300)
    r('Revista: el botón activo cambia su estado aria-pressed', pg.evaluate("document.querySelector('[data-filtro=rosina]').getAttribute('aria-pressed')") == 'true' and pg.evaluate("document.querySelector('[data-filtro=todas]').getAttribute('aria-pressed')") == 'false')
    for casa in ('merceria', 'academy'):
        pg.goto(BASE + '/revista.html?casa=' + casa, wait_until='domcontentloaded'); pg.wait_for_timeout(700)
        n = pg.evaluate(cuenta); r(f'Revista con ?casa={casa}: muestra artículos de esa casa', 0 < n <= total, (n, total))
    x.cerrar()
    # ---------- preguntas frecuentes y contacto
    print('\n[preguntas frecuentes y contacto]')
    x = Ctx(b, 390); pg = x.ir('/preguntas-frecuentes.html', 1000)
    ini = pg.evaluate("document.querySelector('details').open")
    pg.locator('details').first.locator('summary').focus(); pg.keyboard.press('Enter'); pg.wait_for_timeout(250)
    a1 = pg.evaluate("document.querySelector('details').open"); pg.keyboard.press('Enter'); pg.wait_for_timeout(250); a2 = pg.evaluate("document.querySelector('details').open")
    r('preguntas frecuentes: Enter alterna la pregunta (la primera viene abierta por diseño)', (ini, a1, a2) == (True, False, True), (ini, a1, a2))
    pg.locator('details').nth(2).locator('summary').focus(); pg.keyboard.press('Space'); pg.wait_for_timeout(250)
    r('preguntas frecuentes: Espacio abre otra pregunta', pg.evaluate("document.querySelectorAll('details')[2].open") is True)
    x.cerrar()
    x = Ctx(b, 390); pg = x.ir('/contacto.html', 800)
    hs = pg.evaluate("[...document.querySelectorAll('a[href]')].map(a=>a.getAttribute('href'))")
    r('contacto: WhatsApp 573205072801 y correo contacto@lanarosacrochet.com (el teléfono es el de WhatsApp: no lleva tel:)', any('wa.me/573205072801' in h for h in hs) and any(h == 'mailto:contacto@lanarosacrochet.com' for h in hs), [h for h in hs if h.startswith(('tel:', 'mailto:')) or 'wa.me' in h][:6]); x.cerrar()
    b.close()
fallas = [n for n, ok in res if not ok]
print(f'\n{len(res)-len(fallas)} correctas, {len(fallas)} con falla')
for n in fallas: print('  FALLA:', n)
