"""Simplificación de la agenda (6-nov-2026): dibujo del diseño cerrado, tiras de Rosina y compra de materiales plegadas, «Del mundo Lana Rosa» en una línea,
partes sin número fijo y fotos en «Diseña tu patrón», y «Patrones que diseñé» en Mis patrones. Uso: python3 probar_agenda_simplificar.py"""
from agenda_util import *
import base64, struct, zlib
def png(w=60, h=40, rgb=(231, 78, 150)):
    raw = b''.join(b'\x00' + bytes(rgb) * w for _ in range(h)); ch = lambda t, d: struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    return b'\x89PNG\r\n\x1a\n' + ch(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0)) + ch(b'IDAT', zlib.compress(raw)) + ch(b'IEND', b'')
DP1 = {'ag-dp-nombre': 'Ovejita Rosa', 'ag-dp-nivel': 'Principiante', 'ag-dp-p1-nombre': 'Cabeza', 'ag-dp-p1-vueltas': 'V1: 6 pb en am (6)'}
DP2 = {'ag-dp-nombre': 'Gorro de invierno', 'ag-dp-nivel': 'Intermedio'}
DATOS = {'ag-duena': 'Sara', 'ag-nombre': 'Chal', '_dib': {'ficha-proyecto:k1': {'s': [[1, 1, 120, 520, 260, 300, 400, 520]], 'img': ''}}, **DP1,
         '_ver': {'disena-patron': {'orden': ['k1', 'k2'], 'actual': 'k1', 'v': {'k1': DP1, 'k2': DP2}, 'sig': 3}}}
T = Prueba()
vis = lambda pg, sel: pg.evaluate("(s => { const e = document.querySelector(s); if (!e) return false; const r = e.getBoundingClientRect(); return r.height > 4 && getComputedStyle(e).visibility !== 'hidden'; })('%s')" % sel)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM, args=['--no-sandbox'])
    ctx = contexto(b, 1280, 900, datos=DATOS, config_abierta=False); pg = abrir(ctx, 'ficha-proyecto', 2200, config=False)
    # ---- dibujo cerrado
    T.v('el dibujo del diseño empieza cerrado, con miniatura y botón «Abrir dibujo»', not vis(pg, '#dibujo-proyecto') and vis(pg, '.dib-mini') and 'Abrir dibujo' in pg.inner_text('.dib-abrir'), pg.inner_text('.dib-resumen'))
    pg.click('.dib-abrir'); pg.wait_for_timeout(500)
    T.v('«Abrir dibujo» muestra el lienzo con sus herramientas', vis(pg, '#dibujo-proyecto .dib-caja') and vis(pg, '#dibujo-proyecto .dib-barra') and 'Cerrar dibujo' in pg.inner_text('.dib-abrir'))
    pg.click('.dib-abrir'); pg.wait_for_timeout(300)
    T.v('«Cerrar dibujo» lo vuelve a plegar y deja la miniatura', not vis(pg, '#dibujo-proyecto') and vis(pg, '.dib-mini'))
    pg.emulate_media(media='print'); pg.wait_for_timeout(200)
    T.v('al imprimir, el dibujo sale completo aunque esté cerrado', vis(pg, '#dibujo-proyecto .dib-caja') and not vis(pg, '.dib-resumen')); pg.emulate_media(media='screen')
    # ---- tiras y compra de materiales
    plegables = pg.locator('.herr-plegable').count()
    T.v('las tiras de Rosina están plegadas (una línea) en todas las hojas', plegables >= 10 and pg.evaluate("[...document.querySelectorAll('.herr-plegable')].every(d => !d.open)"), plegables)
    T.v('con los mismos enlaces: al abrir una se ven', (pg.evaluate("(() => { const d = document.querySelector('#ficha-proyecto .herr-plegable'); d.open = true; return d.querySelectorAll('a').length; })()") or 0) >= 2)
    T.v('«comprar materiales» está plegado y el selector de la Mercería sigue ahí', pg.locator('#ficha-proyecto .tienda-plegable').count() == 1 and not pg.evaluate("document.querySelector('#ficha-proyecto .tienda-plegable').open") and pg.locator('#ficha-proyecto .merc-sel').count() == 1)
    T.v('«Del mundo Lana Rosa» es una sola línea con un enlace', pg.locator('.promo-eco:not([data-modo="todas"]) .promo-linea').count() >= 2 and pg.locator('.promo-eco:not([data-modo="todas"]) .promo-tarjeta').count() == 0)
    # ---- Mis patrones
    pg.evaluate("window.lrIrAHoja('coleccion-patrones')"); pg.wait_for_timeout(600)
    nombres = pg.eval_on_selector_all('#patrones-propios .pp-nombre', 'els => els.map(e => e.textContent)')
    T.v('«Mis patrones» lista los patrones diseñados, con su nombre', nombres == ['Ovejita Rosa', 'Gorro de invierno'], nombres)
    pg.click('#patrones-propios .pp-item >> nth=1'); pg.wait_for_timeout(600)
    T.v('tocar uno lo abre en «Diseña tu patrón»', pg.evaluate("document.getElementById('ag-dp-nombre').value") == 'Gorro de invierno' and vis(pg, '#disena-patron'), pg.evaluate("document.getElementById('ag-dp-nombre').value"))
    # ---- partes sin número fijo
    pg.evaluate("window.lrVersiones.abrir('disena-patron','k1')"); pg.wait_for_timeout(400); pg.evaluate("document.querySelector('#dp-pasos .dp-paso-btn[data-i=\"4\"]').click()"); pg.wait_for_timeout(300)
    nv = lambda: pg.evaluate("[...document.querySelectorAll('#dp-partes .dp-parte')].filter(d => !d.hidden).length")
    T.v('las partes empiezan en 3 (o las que ya tengan algo)', nv() == 3, nv())
    for _ in range(3): pg.click('#dp-parte-mas'); pg.wait_for_timeout(150)
    T.v('«Añadir parte» suma una por una', nv() == 6, nv())
    pg.click('#dp-parte-mas'); pg.wait_for_timeout(200); pg.keyboard.type('Cola')
    pg.fill('#ag-dp-p7-vueltas', 'V1: 6 pb en am (6)'); pg.wait_for_timeout(300)
    T.v('sin tope: aparece la parte 7 y se puede escribir', nv() == 7 and pg.evaluate("document.getElementById('ag-dp-p7-nombre').value") == 'Cola', nv())
    pg.evaluate("window.lrVersiones.abrir('disena-patron','k2')"); pg.wait_for_timeout(500)
    T.v('otro patrón vuelve a mostrar solo 3 partes', nv() == 3 and pg.evaluate("document.getElementById('ag-dp-p7-nombre').value") == '', nv())
    pg.evaluate("window.lrVersiones.abrir('disena-patron','k1')"); pg.wait_for_timeout(500)
    T.v('y al volver al primero sus 7 partes siguen ahí con lo escrito', nv() == 7 and pg.evaluate("document.getElementById('ag-dp-p7-vueltas').value") == 'V1: 6 pb en am (6)', nv())
    pg.reload(); pg.wait_for_timeout(2200)
    T.v('al abrir la agenda otra vez, las 7 partes siguen', pg.evaluate("document.getElementById('ag-dp-p7-nombre') && document.getElementById('ag-dp-p7-nombre').value") == 'Cola')
    # ---- fotos
    pg.evaluate("window.lrIrAHoja('disena-patron')"); pg.evaluate("document.querySelector('#dp-pasos .dp-paso-btn[data-i=\"6\"]').click()"); pg.wait_for_timeout(300)
    pg.set_input_files('#dp-fotos input[type=file]', [{'name': 'a.png', 'mimeType': 'image/png', 'buffer': png()}, {'name': 'b.png', 'mimeType': 'image/png', 'buffer': png(rgb=(158, 162, 249))}]); pg.wait_for_timeout(1200)
    T.v('se pueden subir fotos del resultado y de los pasos', pg.locator('#dp-fotos .dp-foto').count() == 2, pg.locator('#dp-fotos .dp-foto').count())
    pg.fill('#dp-fotos .dp-foto >> nth=0 >> input', 'Paso 3: la cabeza'); pg.keyboard.press('Tab'); pg.wait_for_timeout(300)
    dib = dib_idb(pg, 900)
    claves = sorted(k for k in dib if k.startswith('disena-patron:k1:f'))
    T.v('se guardan como los dibujos (IndexedDB), con su descripción', len(claves) == 2 and dib[claves[0]].get('t') == 'Paso 3: la cabeza' and dib[claves[0]].get('img', '').startswith('data:image/jpeg'), claves)
    pg.evaluate("window.lrVersiones.abrir('disena-patron','k2')"); pg.wait_for_timeout(400); pg.evaluate("document.querySelector('#dp-pasos .dp-paso-btn[data-i=\"6\"]').click()"); pg.wait_for_timeout(200)
    T.v('cada patrón tiene sus propias fotos', pg.locator('#dp-fotos .dp-foto').count() == 0)
    pg.reload(); pg.wait_for_timeout(2400); pg.evaluate("window.lrIrAHoja('disena-patron')"); pg.evaluate("window.lrVersiones.abrir('disena-patron','k1')"); pg.wait_for_timeout(500); pg.evaluate("document.querySelector('#dp-pasos .dp-paso-btn[data-i=\"6\"]').click()"); pg.wait_for_timeout(300)
    T.v('al abrir la agenda otra vez las fotos siguen', pg.locator('#dp-fotos .dp-foto').count() == 2, pg.locator('#dp-fotos .dp-foto').count())
    pg.evaluate("document.querySelector('#dp-pasos .dp-paso-btn[data-i=\"7\"]').click()"); pg.wait_for_timeout(300)
    T.v('la vista previa del patrón lleva las fotos y la parte 7', pg.locator('#dp-vista .dp-fotos-vista img').count() == 2 and 'cola' in pg.inner_text('#dp-vista').lower(), (pg.locator('#dp-vista .dp-fotos-vista img').count(), pg.inner_text('#dp-vista')[:200]))
    s = pg.evaluate("window.lrDibStore.completos(JSON.parse(localStorage.getItem('rosinaAgenda'))).then(d => JSON.stringify(Object.keys(d._dib || {})))")
    T.v('las fotos viajan en las copias (datos completos con dibujos)', 'disena-patron:k1:f1' in s, s[:200])
    pg.evaluate("window.lrIrAHoja('disena-patron')"); pg.evaluate("window.lrVersiones.abrir('disena-patron','k1')"); pg.wait_for_timeout(300)
    pg.evaluate("[...document.querySelectorAll('#disena-patron .vers-borrar, #disena-patron [data-borrar]')].forEach(x => x.click())"); pg.wait_for_timeout(300)
    dib2 = dib_idb(pg, 900)
    T.v('al borrar el patrón, sus fotos también se borran', not [k for k in dib2 if k.startswith('disena-patron:k1:')], [k for k in dib2 if k.startswith('disena-patron:k1:')])
    T.v('sin errores de JavaScript', not pg.errs, pg.errs)
    ctx.close(); b.close()
T.fin()
