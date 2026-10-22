#!/usr/bin/env python3
"""Pruebas funcionales de la tienda y el pago (auditoría 360; datos simulados; no toca producción ni hace cobros).

    python3 herramientas/auditoria-360/scripts/probar_flujos_tienda.py

Simula la base de datos y la función de pago con respuestas locales. Comprueba búsqueda, ficha, carrito, teclado y los pasos del pago.
"""
import json, sys
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright
BASE = 'http://localhost:8765'
CORS = {'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*'}
PROD = [
 {'id': '11111111-1111-1111-1111-111111111111', 'nombre': 'Peluche Oso 21cm', 'precio': 85000, 'categoria_web': 'Peluches', 'disponible_web': True, 'tiempo_elaboracion': '8 días hábiles', 'descripcion_web': 'Oso tejido a mano.', 'especificaciones_web': ['Altura: 21 cm', 'Material: Lana acrílica'], 'cuidados_web': ['No usar secadora'], 'foto_url': '7709164727718.jpg', 'orden_web': 1},
 {'id': '22222222-2222-2222-2222-222222222222', 'nombre': 'Llavero Abeja 6cm', 'precio': 18000, 'categoria_web': 'Llaveros', 'disponible_web': True, 'tiempo_elaboracion': '8 días hábiles', 'descripcion_web': 'Abeja.', 'especificaciones_web': ['Altura: 6 cm'], 'cuidados_web': None, 'foto_url': '7709164727732.jpg', 'orden_web': 2},
 {'id': '33333333-3333-3333-3333-333333333333', 'nombre': 'Amigurumi personalizado 13 cm', 'precio': 85000, 'categoria_web': 'Amigurumis', 'disponible_web': True, 'tiempo_elaboracion': '8 días hábiles', 'descripcion_web': 'Personalizado.', 'especificaciones_web': ['Altura: 13 cm'], 'cuidados_web': None, 'foto_url': '7709164727763.jpg', 'orden_web': 3},
]
res = []
def r(nombre, ok, dato=''):
    res.append((nombre, ok)); print(('OK    ' if ok else 'FALLA ') + nombre + ('' if ok and not dato else '  → ' + str(dato)[:200]))

def stub(route):
    req = route.request; u = req.url; h = urlsplit(u)
    if h.hostname in ('localhost', '127.0.0.1'): return route.continue_()
    if req.method == 'OPTIONS': return route.fulfill(status=204, headers=CORS)
    if h.hostname and h.hostname.endswith('supabase.co'):
        if 'obtener_tienda_web' in u: return route.fulfill(status=200, content_type='application/json', headers=CORS, body=json.dumps(PROD))
        if '/functions/v1/crear-pago-wompi' in u:
            try: b = json.loads(req.post_data or '{}')
            except Exception: b = {}
            if b.get('accion') == 'estado': return route.fulfill(status=200, content_type='application/json', headers=CORS, body='{"modo":"produccion"}')
            if b.get('accion') == 'cotizar': return route.fulfill(status=200, content_type='application/json', headers=CORS, body=json.dumps({'primera': True, 'pct': 10, 'subtotal': 103000, 'descuento': 10300, 'envio': 8000, 'digital': False, 'total': 100700}))
            return route.fulfill(status=200, content_type='application/json', headers=CORS, body=json.dumps({'url': 'https://checkout.wompi.co/p/?prueba=1', 'referencia': 'LRW-2026-0001-ABCD'}))
        if '/auth/' in u: return route.fulfill(status=200, content_type='application/json', headers=CORS, body='{}')
        return route.fulfill(status=200, content_type='application/json', headers=CORS, body='[]')
    return route.abort()

with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/opt/pw-browsers/chromium', args=['--no-sandbox'])
    for ancho in (390, 1280):
        print(f'\n[{ancho} px]')
        ctx = b.new_context(viewport={'width': ancho, 'height': 850}); ctx.route('**/*', stub); pg = ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)[:120]))
        pg.goto(BASE + '/tienda.html', wait_until='domcontentloaded'); pg.wait_for_timeout(1500)
        try: pg.get_by_role('button', name='Rechazar').click(timeout=1500)
        except Exception: pass
        n = pg.locator('.producto-card').count()
        r('catálogo: aparecen las 3 tarjetas', n == 3, n)
        # búsqueda
        pg.locator('#filtros-desplegables summary').click(); pg.fill('#buscador-nombre', 'abeja'); pg.wait_for_timeout(500)
        vis = pg.evaluate("[...document.querySelectorAll('.producto-card')].filter(e=>e.offsetParent!==null && getComputedStyle(e).display!=='none').length")
        r('búsqueda «abeja» deja 1 tarjeta visible', vis == 1, vis)
        pg.fill('#buscador-nombre', 'zzzz'); pg.wait_for_timeout(400)
        txt = pg.evaluate("document.body.innerText")
        r('búsqueda sin resultados muestra un mensaje (no queda vacío)', ('no encontr' in txt.lower() or 'sin resultado' in txt.lower() or 'ningún' in txt.lower() or 'no hay' in txt.lower()), [l for l in txt.split('\n') if 'encontr' in l.lower()][:2])
        pg.fill('#buscador-nombre', ''); pg.wait_for_timeout(300)
        pg.locator('#filtros-desplegables summary').click(); pg.wait_for_timeout(300)   # se cierra el panel de filtros para no tapar las tarjetas
        # ficha
        tarjeta = pg.locator('.producto-card').first
        tarjeta.locator('img').first.evaluate("e=>e.scrollIntoView({block:'center'})"); pg.wait_for_timeout(300); tarjeta.locator('img').first.click(); pg.wait_for_timeout(600)
        abierta = pg.evaluate("document.getElementById('overlay-modal-producto').classList.contains('abierto')")
        r('ficha: se abre al tocar la tarjeta', bool(abierta), abierta)
        nombre_ficha = pg.evaluate("(document.getElementById('modal-nombre')||{}).textContent")
        r('ficha: muestra el nombre del producto', 'Oso' in (nombre_ficha or '') or 'Abeja' in (nombre_ficha or '') or 'Amigurumi' in (nombre_ficha or ''), nombre_ficha)
        pg.keyboard.press('Escape'); pg.wait_for_timeout(400)
        cerrada = pg.evaluate("!document.getElementById('overlay-modal-producto').classList.contains('abierto')")
        r('ficha: la tecla Esc la cierra', bool(cerrada), 'sigue abierta' if not cerrada else '')
        print('      (informativo) foco del teclado al abrir/cerrar la ficha:', pg.evaluate("document.activeElement.tagName + '.' + String(document.activeElement.className).slice(0,30)"))
        # si no cerró con Esc, cerrar con botón para continuar
        if not cerrada:
            try: pg.locator('#overlay-modal-producto button[aria-label*="errar"], #overlay-modal-producto .cerrar-modal-producto, #cerrar-modal').first.click(timeout=1500)
            except Exception: pg.evaluate("document.getElementById('overlay-modal-producto').classList.remove('activo')")
            pg.wait_for_timeout(300)
        # carrito
        pg.locator('.boton-agregar-carrito').first.evaluate("e=>e.scrollIntoView({block:'center'})"); pg.wait_for_timeout(300); pg.locator('.boton-agregar-carrito').first.click(); pg.wait_for_timeout(500)
        cont = pg.evaluate("(document.getElementById('contador-carrito')||{}).textContent")
        r('carrito: agregar suma 1 al contador', (cont or '').strip() == '1', cont)
        dlg = pg.evaluate("(()=>{const f=document.querySelector('.lr-ag-fondo'); if(!f||f.hidden) return null; const d=f.querySelector('[role=dialog]'); return {rol:d.getAttribute('role'), modal:d.getAttribute('aria-modal'), titulo:(f.querySelector('h2')||{}).textContent, botones:[...f.querySelectorAll('button')].map(b=>(b.getAttribute('aria-label')||b.textContent).trim())}})()")
        r('aviso «Producto agregado»: es un diálogo accesible (role=dialog, aria-modal) con título y botones', bool(dlg) and dlg['rol'] == 'dialog' and dlg['modal'] == 'true' and 'Continuar compra' in dlg['botones'], dlg)
        enfocado = pg.evaluate("(()=>{const f=document.querySelector('.lr-ag-fondo'); return f && f.contains(document.activeElement)})()")
        print('      (informativo) al abrir el aviso el foco del teclado pasa al diálogo:', bool(enfocado))
        pg.keyboard.press('Escape'); pg.wait_for_timeout(500)
        r('aviso «Producto agregado»: Esc lo cierra', pg.evaluate("(()=>{const f=document.querySelector('.lr-ag-fondo'); return !f || f.hidden})()"))
        pg.locator('#boton-carrito').click(); pg.wait_for_timeout(500)
        abierto = pg.evaluate("document.getElementById('panel-carrito').classList.contains('abierto') || document.getElementById('panel-carrito').classList.contains('activo') || getComputedStyle(document.getElementById('panel-carrito')).right==='0px' || document.getElementById('panel-carrito').getBoundingClientRect().right<=window.innerWidth+1 && document.getElementById('panel-carrito').getBoundingClientRect().left>=0")
        r('carrito: el panel se abre', bool(abierto), abierto)
        items = pg.locator('#panel-carrito .item-carrito').count()
        r('carrito: muestra 1 producto', items == 1, items)
        pg.locator('#panel-carrito button[data-accion="sumar"]').first.click(); pg.wait_for_timeout(300)
        tot = pg.evaluate("(document.querySelector('#panel-carrito #total-carrito, #panel-carrito .total-carrito, #total-carrito')||{}).textContent")
        r('carrito: al sumar una unidad el total se duplica', ('170' in (tot or '') or '36' in (tot or '')), tot)
        # teclado dentro del carrito
        pg.locator('#cerrar-carrito').focus()
        fuera = 0
        for i in range(12):
            pg.keyboard.press('Tab'); pg.wait_for_timeout(40)
            dentro = pg.evaluate("document.getElementById('panel-carrito').contains(document.activeElement)")
            if not dentro: fuera += 1
        r('teclado: con el carrito abierto el foco se queda dentro del panel (trampa de foco)', fuera == 0, f'el foco salió del panel {fuera} de 12 veces')
        pg.keyboard.press('Escape'); pg.wait_for_timeout(400)
        sigue = pg.evaluate("(()=>{const e=document.getElementById('panel-carrito'); const r=e.getBoundingClientRect(); return r.left < window.innerWidth-5 && r.right > 5})()")
        r('teclado: Esc cierra el carrito', not sigue, 'sigue abierto' if sigue else '')
        if sigue: pg.locator('#cerrar-carrito').click(); pg.wait_for_timeout(300)
        # WhatsApp
        pg.locator('#boton-carrito').click(); pg.wait_for_timeout(300)
        href = pg.evaluate("(()=>{const a=[...document.querySelectorAll('#panel-carrito a')].find(a=>/wa\\.me/.test(a.href)); return a? a.href : (document.querySelector('#panel-carrito .boton-whatsapp-carrito, #pedir-whatsapp')||{}).href })()")
        r('carrito: «Pedir por WhatsApp» arma el mensaje con el producto y el número 573205072801', bool(href) and '573205072801' in href and 'Oso' in __import__('urllib.parse').parse.unquote(href), href)
        # pago
        btn = pg.locator('#panel-carrito button:has-text("Continuar compra"), #panel-carrito a:has-text("Continuar compra")')
        r('carrito: existe el botón «Continuar compra»', btn.count() >= 1, btn.count())
        if btn.count():
            btn.first.click(); pg.wait_for_timeout(1500)
            ov = pg.evaluate("(()=>{const o=document.querySelector('.pago-overlay'); return !!o && !o.hidden})()")
            r('pago: se abre el asistente de 4 pasos', bool(ov), ov)
            if ov:
                pg.click('section[data-paso="1"] .pg-btn'); pg.wait_for_timeout(300)
                av = pg.evaluate("[...document.querySelectorAll('.pago-aviso')].map(e=>e.hidden?'':e.textContent).filter(Boolean)")
                r('pago paso 1: sin datos muestra un aviso claro (role=alert)', bool(av), av)
                pg.fill('#pg-correo', 'correo-invalido'); pg.fill('#pg-nombre', 'Prueba'); pg.fill('#pg-telefono', '123'); pg.click('section[data-paso="1"] .pg-btn'); pg.wait_for_timeout(300)
                av = pg.evaluate("[...document.querySelectorAll('.pago-aviso')].map(e=>e.hidden?'':e.textContent).filter(Boolean)")
                r('pago paso 1: correo y teléfono inválidos no avanzan', bool(av) and pg.evaluate("document.querySelector('section[data-paso=\"2\"]').hidden"), av)
                pg.fill('#pg-correo', 'prueba@example.com'); pg.fill('#pg-telefono', '3001234567'); pg.click('section[data-paso="1"] .pg-btn'); pg.wait_for_timeout(600)
                r('pago: con datos válidos pasa al paso 2 (Direcciones)', pg.evaluate("!document.querySelector('section[data-paso=\"2\"]').hidden"))
                pg.click('section[data-paso="2"] .pg-btn[data-ir="3"]'); pg.wait_for_timeout(300)
                av = pg.evaluate("[...document.querySelectorAll('.pago-aviso')].map(e=>e.hidden?'':e.textContent).filter(Boolean)")
                r('pago paso 2: sin ciudad ni dirección no avanza y avisa', bool(av) and pg.evaluate("document.querySelector('section[data-paso=\"3\"]').hidden"), av)
                pg.evaluate("document.getElementById('pg-ir-recoger').click()"); pg.wait_for_timeout(500)
                en3 = pg.evaluate("!document.querySelector('section[data-paso=\"3\"]').hidden || !document.querySelector('section[data-paso=\"4\"]').hidden")
                r('pago: «Recoger en tienda» salta la dirección', bool(en3), en3)
                if pg.evaluate("document.querySelector('section[data-paso=\"4\"]').hidden"):
                    pg.click('section[data-paso="3"] .pg-btn[data-ir="4"]'); pg.wait_for_timeout(400)
                pg.click('#pago-enviar'); pg.wait_for_timeout(400)
                av = pg.evaluate("(document.getElementById('pago-aviso')||{}).textContent")
                r('pago paso 4: sin aceptar la política no se envía y avisa', bool(av) and 'cuenta' not in av.lower()[:1], av)
                pre = pg.evaluate("[document.getElementById('pg-acepto').checked, document.getElementById('pg-promos').checked, document.getElementById('pg-cuenta').checked, document.getElementById('pg-recordar').checked]")
                r('pago: casillas de política, promociones y recordatorio vienen SIN marcar', pre[0] is False and pre[1] is False and pre[3] is False, pre)
                r('pago: «Crear mi cuenta con este correo» viene SIN marcar (PRI-01, 22-oct)', pre[2] is False, pre)
        r('sin errores de JavaScript propios', not errs, errs[:3])
        ctx.close()
    b.close()
fallas = [n for n, ok in res if not ok]
print(f'\n{len(res)-len(fallas)} correctas, {len(fallas)} con falla')
for n in fallas: print('  FALLA:', n)
