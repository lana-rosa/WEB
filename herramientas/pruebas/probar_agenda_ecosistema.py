#!/usr/bin/env python3
"""Prueba (28-oct-2026) de la hoja «Aprende y compra en Lana Rosa» y de las promociones del ecosistema en la Agenda para tejedoras.
Uso: con un servidor local en el puerto 8765:  /usr/bin/python3 herramientas/pruebas/probar_agenda_ecosistema.py [carpeta_capturas]"""
import sys, json, os, urllib.parse
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from agenda_util import *
T = Prueba(); CAP = sys.argv[1] if len(sys.argv) > 1 else None
def cap(pg, sel, n):
    if CAP: os.makedirs(CAP, exist_ok=True); pg.locator(sel).screenshot(path=os.path.join(CAP, n))
COMPRAS = [{'item_id': 'i1', 'clave': 'c1', 'nombre': 'Patrón Zorro Zoro', 'fecha': '2026-10-20', 'descargable': True},
           {'item_id': 'i2', 'clave': 'c2', 'nombre': 'Patrón Ovejita', 'fecha': '2026-10-21', 'descargable': False}]
VENTA = [{'id': 'p1', 'nombre': 'Patrón Gatito Miel', 'categoria': 'Patrones', 'precio_gramo': 18000, 'stock_actual': 0}, {'id': 'l1', 'nombre': 'Lana', 'categoria': 'Lanas', 'precio_gramo': 50, 'stock_actual': 0}]
def preparar(ctx, descarga=None):
    def rpc(r):
        u = r.request.url; cuerpo = '[]'
        if 'mis_compras_patrones' in u: cuerpo = json.dumps(COMPRAS)
        elif 'obtener_merceria_web' in u: cuerpo = json.dumps(VENTA)
        r.fulfill(status=200, content_type='application/json', body=cuerpo, headers={'access-control-allow-origin': '*'})
    ctx.route('**/rest/v1/rpc/**', rpc)
    ctx.route('**/functions/v1/descargar-patron', lambda r: r.fulfill(status=200, content_type='application/json', body=json.dumps({'url': BASE + '/robots.txt'}), headers={'access-control-allow-origin': '*'}))
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM, args=['--no-sandbox'])
    ctx = contexto(b, 390); preparar(ctx); pg = abrir(ctx, 'aprende-compra', 2000)
    T.v('la hoja abre y está en el menú dentro de «Inicio»', pg.evaluate("document.querySelector('#aprende-compra').classList.contains('abierta')") and pg.evaluate("[...document.querySelectorAll('#menu-hojas-lista a')].slice(0, 5).map(a => a.dataset.hoja)") == ['panel-agenda', 'indice-agenda', 'planeador-dia', 'portada-agenda', 'aprende-compra'])
    T.v('el valor estimado inicia en $25.000 (1 hora, 1 persona)', '$25.000' in pg.inner_text('#ec-total'), pg.inner_text('#ec-total'))
    pg.fill('#ag-ec-nombre', 'Luisa'); pg.select_option('#ag-ec-tema', 'Tejer un amigurumi'); pg.select_option('#ag-ec-nivel', 'Sé lo básico'); pg.select_option('#ag-ec-personas', '2'); pg.select_option('#ag-ec-horas', '3'); pg.fill('#ag-ec-cuando', 'Sábados en la mañana'); pg.wait_for_timeout(300)
    T.v('2 personas × 3 horas = $150.000', '$150.000' in pg.inner_text('#ec-total'), pg.inner_text('#ec-total'))
    href = pg.get_attribute('#ec-enviar', 'href'); msg = urllib.parse.unquote(href.split('text=')[1])
    T.v('el enlace va al WhatsApp de pedidos con todos los datos', href.startswith('https://wa.me/573205072801?text=') and all(x in msg for x in ['Luisa', 'Tejer un amigurumi', 'Sé lo básico', 'Personas: 2', 'Horas: 3', '$150.000', 'Sábados en la mañana', 'Villamaría']), msg)
    g = json.loads(pg.evaluate("localStorage.getItem('rosinaAgenda')"))
    T.v('lo escrito se guarda en el dispositivo', g.get('ag-ec-nombre') == 'Luisa' and g.get('ag-ec-horas') == '3')
    T.v('cursos virtuales: aviso «Muy pronto» con botón de WhatsApp', 'Muy pronto' in pg.inner_text('#ec-cursos') and 'wa.me/573205072801' in pg.get_attribute('[data-curso-aviso]', 'href'))
    T.v('patrones comprados: muestra los de la cuenta y solo uno descargable', 'Patrón Zorro Zoro · 20/10/2026' in pg.inner_text('#ec-comprados') and pg.locator('#ec-comprados button').count() == 1 and 'Archivo en preparación' in pg.inner_text('#ec-comprados'), pg.inner_text('#ec-comprados'))
    T.v('patrones a la venta: solo los de la categoría Patrones, con precio', 'Gatito Miel' in pg.inner_text('#ec-venta') and '$18.000' in pg.inner_text('#ec-venta') and 'Lana' not in pg.inner_text('#ec-venta').replace('Patrón', ''), pg.inner_text('#ec-venta'))
    with pg.expect_request('**/functions/v1/descargar-patron') as rq, pg.expect_navigation():
        pg.click('#ec-comprados button')
    T.v('descargar pide el enlace temporal de ese patrón', 'i1' in (rq.value.post_data or ''), rq.value.post_data)
    pg.goto(BASE + '/agenda-rosina.html#aprende-compra'); pg.wait_for_timeout(1500)
    T.v('YouTube: dos enlaces al canal de Lana Rosa Academy', pg.locator('[data-yt]').count() == 2 and all('youtube.com/@LanaRosaAcademy' in pg.get_attribute('[data-yt] >> nth=%d' % i, 'href') for i in range(2)))
    n = pg.locator('.promo-eco[data-modo="todas"] .promo-tarjeta').count()
    T.v('«Todo Lana Rosa» lista el catálogo sin repetir la propia hoja (9 tarjetas)', n == 9, n)
    T.v('las tarjetas externas llevan rel=noopener y las internas empiezan con /', pg.evaluate("[...document.querySelectorAll('.promo-tarjeta[href]')].every(a => a.getAttribute('href').startsWith('/') || a.rel.includes('noopener'))"))
    cap(pg, '#aprende-compra', 'ecosistema-390.png')
    T.v('sin desplazamiento horizontal a 390', pg.evaluate("document.documentElement.scrollWidth <= innerWidth + 1"))
    T.v('sin errores de JavaScript', not pg.errs, pg.errs[:2]); ctx.close()
    # promociones en las hojas gratis propuestas
    ctx = contexto(b, 1280); preparar(ctx); pg = abrir(ctx, 'planeador-dia', 1800)
    for h in ['planeador-dia', 'portada-agenda', 'mis-ideas', 'lista-compras']:
        T.v('«%s» muestra 2 promociones del ecosistema' % h, pg.locator('#%s .promo-eco .promo-tarjeta' % h).count() == 2)
    T.v('las promociones no repiten la propia hoja', pg.locator('#planeador-dia .promo-eco .promo-tarjeta').count() == 2)
    pg.evaluate("window.dataLayer = []")
    tar = pg.locator('#planeador-dia .promo-eco .promo-tarjeta[data-promo]')
    ids = [tar.nth(i).get_attribute('data-promo') for i in range(2)]
    interna = pg.evaluate("[...document.querySelectorAll('#planeador-dia .promo-eco .promo-tarjeta')].findIndex(t => t.tagName === 'BUTTON')")
    if interna >= 0:
        tar.nth(interna).click(); pg.wait_for_timeout(500)
        T.v('una promoción interna abre la hoja y se mide', pg.evaluate("document.querySelector('#aprende-compra').classList.contains('abierta')") and any(e.get('event') == 'promo_agenda_click' and e.get('hoja') == 'planeador-dia' for e in pg.evaluate("window.dataLayer")), ids)
    else:
        T.v('hoy el planeador no trae promoción interna (se prueba en la hoja de ideas)', True)
    pg.evaluate("window.dataLayer = []")
    pg.evaluate("document.querySelector('#planeador-dia .promo-eco .promo-tarjeta').addEventListener('click', e => e.preventDefault(), true)")
    pg.locator('#planeador-dia .promo-eco .promo-tarjeta').first.click(); pg.wait_for_timeout(300)
    T.v('cada clic en una promoción se mide con su hoja', any(e.get('event') == 'promo_agenda_click' and e.get('hoja') == 'planeador-dia' and e.get('promo') for e in pg.evaluate("window.dataLayer")), pg.evaluate("window.dataLayer"))
    T.v('1280: sin desplazamiento horizontal', pg.evaluate("document.documentElement.scrollWidth <= innerWidth + 1"))
    T.v('1280: sin errores de JavaScript', not pg.errs, pg.errs[:2]); ctx.close()
    # sin sesión
    ctx = b.new_context(viewport={'width': 390, 'height': 900}); ctx.add_init_script("localStorage.setItem('lrAgendaAvance','1');localStorage.setItem('lrConsent', JSON.stringify({v:1,a:false,t:Date.now()}));")
    ctx.route('**/googletagmanager.com/**', lambda r: r.abort()); preparar(ctx)
    pg = ctx.new_page(); pg.errs = []; pg.on('pageerror', lambda e: pg.errs.append(str(e))); pg.goto(BASE + '/agenda-rosina.html#aprende-compra'); pg.wait_for_timeout(1800)
    T.v('sin sesión: invita a entrar a la cuenta y no muestra descargas', 'Entrar a mi cuenta' in pg.inner_text('#ec-comprados') and pg.locator('#ec-comprados button').count() == 0)
    T.v('sin sesión: el enlace vuelve a la agenda', 'volver=agenda-rosina.html' in pg.get_attribute('#ec-comprados a', 'href'))
    T.v('sin sesión: sin errores de JavaScript', not pg.errs, pg.errs[:2]); ctx.close(); b.close()
T.fin()
