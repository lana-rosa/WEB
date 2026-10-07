#!/usr/bin/env python3
"""Pruebas en navegador (sesión limpia por escenario) del aviso de cookies y del consentimiento.
Uso: python3 -m http.server 8765 (desde la raíz) y luego  python3 herramientas/prueba_consentimiento.py
Verifica el estado del Modo de consentimiento de Google en dataLayer y que la tienda siga funcionando.
No puede comprobar lo que Google hace dentro de GTM (sin internet en el entorno de pruebas)."""
import json, sys
from playwright.sync_api import sync_playwright
BASE = 'http://localhost:8765'
AMI = {'id': 'a1', 'nombre': 'Mickey Mouse 15cm', 'precio': 75000, 'categoria_web': 'Amigurumis', 'disponible_web': True,
       'tiempo_elaboracion': '5 días hábiles', 'descripcion_web': 'Ratón.', 'especificaciones_web': ['Altura: 15 cm'],
       'cuidados_web': None, 'foto_url': '7709575095048.jpg', 'orden_web': 1}
res = []
def r(nombre, esperado, obtenido, ok): res.append((nombre, esperado, obtenido, 'OK' if ok else 'FALLA')); print(('OK    ' if ok else 'FALLA ') + nombre + ' → ' + str(obtenido))

def consent(pg):  # lista de estados de consentimiento enviados a dataLayer
    return pg.evaluate("dataLayer.filter(x=>x && x[0]==='consent').map(x=>x[1]+':'+(x[2]&&x[2].analytics_storage))")
def nuevo(b):
    ctx = b.new_context(viewport={'width': 390, 'height': 800})
    pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)[:90]) if 'esm.sh' not in str(e) and 'supabase' not in str(e).lower() else None)
    pg.route('**/rpc/obtener_tienda_web*', lambda x: x.fulfill(status=200, content_type='application/json', headers={'access-control-allow-origin': '*'}, body=json.dumps([AMI])))
    return ctx, pg, errs

with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/opt/pw-browsers/chromium')
    # 1 primera visita
    ctx, pg, errs = nuevo(b); pg.goto(BASE + '/'); pg.wait_for_timeout(1000)
    c = consent(pg); orden = pg.evaluate("dataLayer.findIndex(x=>x&&x[0]==='consent')") < pg.evaluate("dataLayer.findIndex(x=>x&&x.event==='gtm.js')") if pg.evaluate("dataLayer.some(x=>x&&x.event==='gtm.js')") else True
    r('1. Primera visita: consentimiento por defecto', 'analytics_storage=denied antes de GTM', c, c[:1] == ['default:denied'] and orden)
    r('1. Primera visita: aviso visible con 3 botones', 'Aceptar/Rechazar/Configurar', pg.evaluate("[...document.querySelectorAll('.lr-ck button')].map(b=>b.textContent)"), pg.evaluate("document.querySelectorAll('.lr-ck button').length") == 3)
    r('1. Primera visita: nada guardado', 'sin lrConsent', pg.evaluate("localStorage.getItem('lrConsent')"), pg.evaluate("localStorage.getItem('lrConsent')") is None)
    ctx.close()
    # 2 aceptar
    ctx, pg, errs = nuevo(b); pg.goto(BASE + '/'); pg.wait_for_timeout(800); pg.click('button[data-ck=si]'); pg.wait_for_timeout(300)
    c = consent(pg); r('2. Aceptar', 'update:granted y aviso cerrado', c, 'update:granted' in c and pg.query_selector('.lr-ck') is None)
    pg.goto(BASE + '/personaliza.html'); pg.wait_for_timeout(800)
    r('2. Aceptar: se recuerda en otra página', 'sin aviso, update:granted', consent(pg), pg.query_selector('.lr-ck') is None and 'update:granted' in consent(pg))
    ctx.close()
    # 3 rechazar + tienda funciona
    ctx, pg, errs = nuevo(b); pg.goto(BASE + '/tienda.html'); pg.wait_for_timeout(1500); pg.click('button[data-ck=no]'); pg.wait_for_timeout(300)
    c = consent(pg); r('3. Rechazar', 'sin update:granted; guardado a=false', c, 'update:granted' not in c and json.loads(pg.evaluate("localStorage.getItem('lrConsent')"))['a'] is False)
    pg.click('#grid-amigurumis .boton-agregar-carrito'); pg.wait_for_timeout(500)
    cart = pg.evaluate("localStorage.getItem('carritoLanaRosa')")
    r('3. Rechazar: el carrito funciona', 'producto en carritoLanaRosa', (cart or '')[:60], bool(cart) and 'Mickey' in cart)
    ctx.close()
    # 4 configurar parcialmente (analítica apagada) y guardar
    ctx, pg, errs = nuevo(b); pg.goto(BASE + '/'); pg.wait_for_timeout(800); pg.click('button[data-ck=cfg]'); pg.wait_for_timeout(300)
    r('4. Configurar: panel con Necesarias (fija) y Analítica', 'necesarias deshabilitada, analítica sin marcar', pg.evaluate("[...document.querySelectorAll('.lr-ck-op input')].map(i=>i.disabled+'/'+i.checked)"), pg.evaluate("[...document.querySelectorAll('.lr-ck-op input')].map(i=>i.disabled+'/'+i.checked)") == ['true/true', 'false/false'])
    pg.click('button[data-ck=guardar]'); pg.wait_for_timeout(300)
    c = consent(pg); r('4. Configurar sin analítica: guardar', 'a=false, sin granted', json.loads(pg.evaluate("localStorage.getItem('lrConsent')")), json.loads(pg.evaluate("localStorage.getItem('lrConsent')"))['a'] is False and 'update:granted' not in c)
    # 5 cambiar después desde el pie
    pg.click('[data-abrir-cookies]'); pg.wait_for_timeout(300); pg.check('#lr-ck-an'); pg.click('button[data-ck=guardar]'); pg.wait_for_timeout(300)
    r('5. Cambiar la decisión desde el pie', 'a=true y update:granted', consent(pg), json.loads(pg.evaluate("localStorage.getItem('lrConsent')"))['a'] is True and 'update:granted' in consent(pg))
    pg.click('[data-abrir-cookies]'); pg.wait_for_timeout(300); pg.uncheck('#lr-ck-an'); pg.click('button[data-ck=guardar]'); pg.wait_for_timeout(300)
    c = consent(pg); r('5. Retirar el consentimiento', 'último estado denied', c[-1:], c[-1:] == ['update:denied'])
    ctx.close()
    # 6 navegación, Personaliza, cuenta y pago
    ctx, pg, errs = nuevo(b); pg.goto(BASE + '/personaliza.html'); pg.wait_for_timeout(800); pg.click('button[data-ck=no]')
    r('6. Personaliza: casilla obligatoria de datos y casilla opcional separada', 'required / opcional', pg.evaluate("[document.getElementById('acepto-datos').required, document.getElementById('acepto-publicar').required, document.getElementById('acepto-publicar').checked]"), pg.evaluate("[document.getElementById('acepto-datos').required, document.getElementById('acepto-publicar').required, document.getElementById('acepto-publicar').checked]") == [True, False, False])
    pg.goto(BASE + '/cuenta.html'); pg.wait_for_timeout(1000)
    r('6. Inicio de sesión: la página carga y respeta la decisión', 'sin aviso, sin errores', errs, pg.query_selector('.lr-ck') is None and not errs)
    pg.goto(BASE + '/politicas.html#cookies'); pg.wait_for_timeout(600)
    r('6. Enlace a la política de cookies', 'sección cookies existe', pg.evaluate("!!document.getElementById('cookies')"), pg.evaluate("!!document.getElementById('cookies')"))
    r('6. Política sin Meta Pixel', '0 menciones', pg.evaluate("document.body.innerText.includes('Meta Pixel')"), not pg.evaluate("document.body.innerText.includes('Meta Pixel')"))
    ctx.close()
    b.close()
print(); print('| Escenario | Esperado | Obtenido | Resultado |'); print('|---|---|---|---|')
for a in res: print('| ' + ' | '.join(str(x).replace('|', '/') for x in a) + ' |')
sys.exit(0 if all(x[3] == 'OK' for x in res) else 1)
