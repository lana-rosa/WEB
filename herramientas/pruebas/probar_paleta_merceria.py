#!/usr/bin/env python3
"""Prueba (28-oct-2026) de la página «Paleta de colores» de la Mercería, con la función de la base simulada.
Uso: con un servidor local en el puerto 8765:  /usr/bin/python3 herramientas/pruebas/probar_paleta_merceria.py [carpeta_capturas]"""
import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from agenda_util import *
T = Prueba(); CAP = sys.argv[1] if len(sys.argv) > 1 else None
DATOS = [
 {'id': 'a1', 'linea': 'Lana Chelin', 'marca': 'Kusi Kusi', 'color': 'Almendra', 'codigo_color': '2110', 'composicion': '100% poliéster', 'peso_gramos': '160.00', 'metraje_m': '125', 'foto_url': 'no-existe.jpg', 'categoria': 'Lanas', 'stock_actual': '0.00', 'precio_ovillo': '17600'},
 {'id': 'a2', 'linea': 'Lana Ecological Cotton', 'marca': 'Papatya', 'color': 'Lila 505', 'codigo_color': '505', 'composicion': '100% algodón', 'peso_gramos': '100.00', 'metraje_m': '300', 'foto_url': 'no-existe2.jpg', 'categoria': 'Lanas', 'stock_actual': '4.00', 'precio_ovillo': '12000'},
 {'id': 'a3', 'linea': 'Lana Happy Chenille', 'marca': 'DMC', 'color': 'Azul Claro', 'codigo_color': '18', 'composicion': 'Chenille', 'peso_gramos': '15.00', 'metraje_m': '38', 'foto_url': 'x.jpg', 'categoria': 'Lanas', 'stock_actual': '0.00', 'precio_ovillo': '4500'}]
def pagina(b, ancho, datos=DATOS, falla=False):
    ctx = b.new_context(viewport={'width': ancho, 'height': 900}); ctx.route('**/googletagmanager.com/**', lambda r: r.abort())
    ctx.route('**/rpc/obtener_paleta_merceria', (lambda r: r.abort()) if falla else (lambda r: r.fulfill(status=200, content_type='application/json', body=json.dumps(datos))))
    ctx.route('**/rest/v1/rpc/obtener_merceria_web**', lambda r: r.fulfill(status=200, content_type='application/json', body='[]'))
    pg = ctx.new_page(); pg.errs = []; pg.on('pageerror', lambda e: pg.errs.append(str(e)))
    pg.goto(BASE + '/merceria/paleta-de-colores/'); pg.wait_for_timeout(1200); return ctx, pg
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM, args=['--no-sandbox'])
    for ancho in (390, 1280):
        ctx, pg = pagina(b, ancho)
        T.v('%d px: una tarjeta por ovillo (3)' % ancho, pg.locator('.pal-tarjeta').count() == 3)
        t = pg.inner_text('.pal-tarjeta:first-child')
        T.v('%d px: cada tarjeta trae marca, gramos, metraje, composición y código' % ancho, all(x in t for x in ['Kusi Kusi', '160 g', '125 m', '100% poliéster', '2110']), t)
        T.v('%d px: muestra el precio del ovillo' % ancho, '$17.600 el ovillo' in t)
        T.v('%d px: sin foto sale un color aproximado y «Foto pronto»' % ancho, 'Foto pronto' in t)
        T.v('%d px: lo que tiene existencias dice «Disponible» y lleva a comprarlo' % ancho, pg.locator('.pal-tarjeta:nth-child(2) .pal-estado.si').count() == 1 and pg.get_attribute('.pal-tarjeta:nth-child(2) .pal-comprar', 'href') == '/merceria/catalogo/#a2')
        T.v('%d px: el menú de la Mercería ofrece la paleta' % ancho, pg.locator('a[href="/merceria/paleta-de-colores/"]').count() >= 2)
        pg.fill('#pal-buscar', '2110'); pg.wait_for_timeout(200); T.v('%d px: buscar por código' % ancho, pg.locator('.pal-tarjeta').count() == 1)
        pg.fill('#pal-buscar', ''); pg.select_option('#pal-marca', 'DMC'); pg.wait_for_timeout(200); T.v('%d px: filtrar por marca' % ancho, pg.locator('.pal-tarjeta').count() == 1)
        pg.select_option('#pal-marca', ''); pg.check('#pal-disp'); pg.wait_for_timeout(200); T.v('%d px: solo lo disponible' % ancho, pg.locator('.pal-tarjeta').count() == 1 and '1 color' in pg.inner_text('#pal-cuenta'))
        pg.uncheck('#pal-disp'); pg.fill('#pal-buscar', 'zzz'); pg.wait_for_timeout(200); T.v('%d px: sin resultados lo explica' % ancho, 'No encontramos' in pg.inner_text('#pal-lista'))
        pg.fill('#pal-buscar', '')
        T.v('%d px: sin desplazamiento horizontal' % ancho, pg.evaluate("document.documentElement.scrollWidth <= innerWidth + 1"))
        if CAP: os.makedirs(CAP, exist_ok=True); pg.screenshot(path=os.path.join(CAP, 'paleta-%d.png' % ancho))
        T.v('%d px: sin errores de JavaScript' % ancho, not pg.errs, pg.errs[:2]); ctx.close()
    ctx, pg = pagina(b, 390, falla=True)
    T.v('si no carga la paleta lo dice y lleva al catálogo', 'No pudimos cargar' in pg.inner_text('#pal-lista') and pg.locator('#pal-lista a[href="/merceria/catalogo/"]').count() == 1); ctx.close(); b.close()
T.fin()
