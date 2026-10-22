#!/usr/bin/env python3
"""Prueba local (auditoría 360): ¿la tienda escapa el HTML que venga en los datos del catálogo?

    python3 herramientas/auditoria-360/scripts/probar_xss_catalogo.py

Simula la respuesta de `obtener_tienda_web` con un producto cuyo nombre, tiempo de elaboración, descripción, especificaciones y cuidados traen HTML inofensivo
(un <img onerror> que solo marca una variable en la página, no envía nada). Todo ocurre en un servidor local con datos inventados: no toca
producción ni la base. Resultado esperado de una página segura: ninguna marca se activa.
"""
import json
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright
BASE = 'http://localhost:8765'
CORS = {'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*'}
mk = lambda n: '<img src=x onerror="window.__m_%s=1">' % n
PROD = [{'id': '11111111-1111-1111-1111-111111111111', 'nombre': 'Oso' + mk('nombre'), 'precio': 85000, 'categoria_web': 'Peluches',
         'disponible_web': True, 'tiempo_elaboracion': '8 días hábiles' + mk('tiempo'), 'descripcion_web': 'Descripción' + mk('descripcion'),
         'especificaciones_web': ['Altura: 21 cm' + mk('especificacion')], 'cuidados_web': ['No usar secadora' + mk('cuidado')], 'foto_url': '7709164727718.jpg', 'orden_web': 1}]

def stub(route):
    req = route.request; u = req.url; h = urlsplit(u)
    if h.hostname in ('localhost', '127.0.0.1'): return route.continue_()
    if req.method == 'OPTIONS': return route.fulfill(status=204, headers=CORS)
    if h.hostname and h.hostname.endswith('supabase.co'):
        if 'obtener_tienda_web' in u: return route.fulfill(status=200, content_type='application/json', headers=CORS, body=json.dumps(PROD))
        return route.fulfill(status=200, content_type='application/json', headers=CORS, body='[]')
    return route.abort()

with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/opt/pw-browsers/chromium', args=['--no-sandbox'])
    c = b.new_context(viewport={'width': 1280, 'height': 850}); c.route('**/*', stub); pg = c.new_page()
    pg.goto(BASE + '/tienda.html', wait_until='domcontentloaded'); pg.wait_for_timeout(1500)
    try: pg.get_by_role('button', name='Rechazar').click(timeout=1500)
    except Exception: pass
    tras_tarjetas = pg.evaluate("Object.keys(window).filter(k=>k.startsWith('__m_'))")
    pg.locator('.producto-card img').first.evaluate("e=>e.scrollIntoView({block:'center'})"); pg.wait_for_timeout(300)
    pg.locator('.producto-card img').first.click(); pg.wait_for_timeout(800)
    tras_ficha = pg.evaluate("Object.keys(window).filter(k=>k.startsWith('__m_'))")
    texto_ficha = pg.evaluate("(document.getElementById('modal-nombre')||document.querySelector('.modal-producto h2, #modal-producto h2')||{}).textContent||''")
    print('Tienda · marcas activadas al pintar las tarjetas:', tras_tarjetas)
    print('Tienda · marcas activadas al abrir la ficha:', tras_ficha)
    print('Tienda · el nombre se ve como texto (no como HTML):', '<img' in pg.evaluate("document.querySelector('.producto-card h3').textContent"))
    # carritos: un producto con HTML en el nombre guardado en el carrito (localStorage) y se abre el panel en cada página con carrito
    mal = []
    CARRITO = json.dumps([{'id': '11111111-1111-1111-1111-111111111111', 'nombre': 'Oso' + mk('carrito'), 'precio': 85000, 'cantidad': 1}])
    paginas = ['/', '/tienda.html', '/personaliza.html', '/merceria/', '/cuenta.html', '/contacto.html', '/politicas.html', '/academy/', '/revista.html', '/revista/anillo-magico/', '/universo-rosina.html', '/recursos-rosina.html']
    for ruta in paginas:
        c2 = b.new_context(viewport={'width': 1280, 'height': 850}); c2.route('**/*', stub); q = c2.new_page()
        q.add_init_script("try{localStorage.setItem('carritoLanaRosa', %s)}catch(e){}" % json.dumps(CARRITO))
        q.goto(BASE + ruta, wait_until='domcontentloaded'); q.wait_for_timeout(900)
        try: q.get_by_role('button', name='Rechazar').click(timeout=800)
        except Exception: pass
        try: q.locator('#boton-carrito').click(timeout=3000); q.wait_for_timeout(500)
        except Exception as e: mal.append((ruta, 'no abrió el carrito'))
        if q.evaluate("Object.keys(window).filter(k=>k.startsWith('__m_carrito'))"): mal.append((ruta, 'EJECUTÓ el HTML del nombre'))
        c2.close()
    print('Carritos · páginas revisadas:', len(paginas), '· con problema:', mal)
    ok = not tras_ficha and not mal
    print('RESULTADO:', 'sin ejecución de HTML en los datos' if ok else 'VULNERABLE (el HTML de los datos se ejecuta)')
    b.close()
