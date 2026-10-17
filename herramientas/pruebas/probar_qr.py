#!/usr/bin/env python3
"""Pruebas de la Etapa 3 del universo de Rosina: página pública de cuidados e historia por pieza (/p/) y códigos QR.

Simula Supabase con page.route (no toca producción ni escribe datos). Comprueba la página en sus casos (sin historia, con historia y
cuidados validados, pieza que no existe, id inválido, error, interruptor apagado, texto malicioso), la privacidad y que los QR que
genera herramientas/qr/generar_qr.py se leen de verdad (se decodifican con OpenCV, también tal como quedan en la hoja impresa).
Las reglas de la base de datos (Q1 id estable, Q2 aprobación, Q3 solo datos públicos) se probaron en Supabase con transacciones
revertidas y están en herramientas/innovacion/07-ETAPA-3-QR.md.

Uso:  python3 herramientas/pruebas/probar_qr.py [carpeta_capturas]     (requiere segno y opencv-python-headless)
"""
import json, os, re, subprocess, sys, tempfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import probar_regalar as pr
from playwright.sync_api import sync_playwright

verificar = pr.verificar
CAPTURAS = sys.argv[1] if len(sys.argv) > 1 else None
ESPERA = '#pieza-raiz .pz-marco'
CATALOGO = pr.REVISADO
PIEZAS = [p for p in CATALOGO if not p['personalizable_base'] and p['categoria_web'] != 'Complementos']
ZORO = next(p for p in CATALOGO if p['nombre'].startswith('Roronoa Zoro'))
ZARIA = next(p for p in CATALOGO if p['nombre'] == 'Bolso ZARIA')
CONFIG_JS = open(os.path.join(pr.RAIZ, 'js', 'universo', 'config.js'), encoding='utf-8').read()
GENERADOR = os.path.join(pr.RAIZ, 'herramientas', 'qr', 'generar_qr.py')


def pieza(p, **kw):
    base = {'id': p['id'], 'nombre': p['nombre'], 'categoria_web': p['categoria_web'], 'foto_url': p['foto_url'], 'descripcion_web': 'Descripción',
            'especificaciones_web': ['Medidas: 15 cm de alto x 8 cm de ancho'], 'cuidados': ['No usar secadora'], 'cuidados_validados': False, 'historia': None, 'material_notas': None}
    base.update(kw)
    return base


def abrir(ctx, base, ruta, respuesta=None, estado=200, **kw):
    """Abre /p/ con el RPC simulado; devuelve (page, errores_js, llamadas)."""
    llamadas = []

    def rpc(route):
        llamadas.append(route.request.post_data_json)
        if estado != 200:
            route.fulfill(status=estado, content_type='application/json', body='{"message":"error simulado"}')
        else:
            route.fulfill(status=200, content_type='application/json', body=json.dumps([respuesta] if respuesta else []))
    page, err = pr.abrir(ctx, base, CATALOGO, ruta=ruta, espera=ESPERA, rutas=[('**/rest/v1/rpc/obtener_producto_publico', rpc)] + kw.pop('extra', []), **kw)
    return page, err, llamadas


def textos(page, selector):
    return page.eval_on_selector_all(selector, 'els => els.map(e => e.textContent.trim())')


def leer_recorte(img):
    """Lee un QR de una imagen con los detectores de OpenCV (el clásico y el de Aruco, que es más robusto) y, si hace falta, ampliada."""
    import cv2
    for im in (img, cv2.resize(img, None, fx=2, fy=2, interpolation=cv2.INTER_NEAREST), cv2.resize(img, None, fx=0.5, fy=0.5, interpolation=cv2.INTER_AREA)):
        for det in (cv2.QRCodeDetector(), cv2.QRCodeDetectorAruco()):
            try:
                txt, _, _ = det.detectAndDecode(im)
            except cv2.error:
                txt = ''
            if txt:
                return txt
    return ''


def decodificar_png(ruta):
    import cv2
    img = cv2.imread(ruta)
    txt, _, _ = cv2.QRCodeDetector().detectAndDecode(img)
    return txt


def main():
    srv, base = pr.servidor()
    with sync_playwright() as p:
        nav = p.chromium.launch(executable_path=pr.CHROMIUM) if pr.CHROMIUM else p.chromium.launch()
        movil = nav.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, locale='es-CO')
        pc = nav.new_context(viewport={'width': 1280, 'height': 900}, locale='es-CO')

        print('\n[Página /p/ — pieza con los cuidados de siempre]')
        page, err, llamadas = abrir(pc, base, '/p/?i=%s&o=etiqueta' % ZORO['id'], pieza(ZORO))
        verificar('pide a la base solo la pieza del código (p_id) y una sola vez', llamadas == [{'p_id': ZORO['id']}], llamadas)
        verificar('muestra el nombre de la pieza como título, su foto y la categoría', page.inner_text('h1') == ZORO['nombre'] and page.locator('.pz-prod img[src$="%s"]' % ZORO['foto_url']).count() == 1 and page.inner_text('.pz-cat') == 'Amigurumis')
        cu = textos(page, '.pz-lista li')
        verificar('cuidados: el de la pieza («No usar secadora») sin repetirse, más los generales publicados en las guías (sombra, humedad, hilito)', cu[0] == 'No usar secadora' and len(cu) == 4 and sum('secadora' in c.lower() for c in cu) == 1 and any('sombra' in c for c in cu) and any('humedad' in c for c in cu) and any('hilito' in c for c in cu), cu)
        verificar('no se muestra «Revisados por el taller» ni «Su historia» mientras el taller no los apruebe', page.locator('.pz-sello').count() == 0 and page.locator('#pz-historia').count() == 0)
        verificar('enlaza la guía completa de cuidados y las reseñas con enlaces que ya usa el sitio', page.get_attribute('.pz-enlace', 'href') == '/revista/cuidar-lavar-tejidos/' and page.locator('a[href="https://g.page/r/Cae2iIji5j_XEAE/review"]').count() == 1)
        wa = page.get_attribute('.pz-wa', 'href')
        verificar('WhatsApp 573205072801 con el nombre de la pieza en el mensaje', wa.startswith('https://wa.me/573205072801?text=') and 'Roronoa%20Zoro' in wa, wa)
        verificar('también ofrece regalar otra pieza y personalizar (rutas absolutas)', page.locator('.pz-secundarios a[href="/universo-rosina.html#regalar"]').count() == 1 and page.locator('.pz-secundarios a[href="/personaliza.html"]').count() == 1)
        verificar('lista las especificaciones públicas de la tienda (medidas)', 'Medidas: 15 cm' in page.inner_text('.pz-specs'))
        dl = page.evaluate("JSON.parse(JSON.stringify(window.dataLayer || []))")
        ev = [x for x in dl if x.get('event') == 'qr_visita']
        verificar('mide qr_visita con el id de la pieza y el origen «etiqueta», sin datos personales', len(ev) == 1 and ev[0].get('item_id') == ZORO['id'] and ev[0].get('origen') == 'etiqueta' and set(ev[0]) == {'event', 'item_id', 'origen'}, ev)
        verificar('es una página de apoyo: noindex, canonical propio y sin errores de JavaScript', page.locator('meta[name="robots"][content*="noindex"]').count() == 1 and page.get_attribute('link[rel="canonical"]', 'href') == 'https://lanarosacrochet.com/p/' and not err, err)
        page.close()

        print('\n[Página /p/ — con historia y cuidados validados por el taller]')
        validada = pieza(ZARIA, cuidados=['Lavar a mano con agua fría y jabón neutro', 'Secar a la sombra, sobre una superficie plana', 'No usar secadora'], cuidados_validados=True,
                         historia='Este bolso nació en nuestro taller de Villamaría.\nCada puntada es a mano.', material_notas='Lana suave de prueba')
        page, err, _ = abrir(pc, base, '/p/?i=%s&o=tarjeta' % ZARIA['id'], validada)
        cu = textos(page, '.pz-lista li')
        verificar('con cuidados validados aparece «✔ Revisados por el taller para esta pieza»', 'Revisados por el taller' in page.inner_text('.pz-sello'))
        verificar('los cuidados validados van primero y los generales no repiten lo que ya dicen (secadora y sombra) — solo se suma la humedad y el hilito', cu[:3] == validada['cuidados'] and len(cu) == 5 and not any(c == 'No uses secadora.' for c in cu) and sum('sombra' in c.lower() for c in cu) == 1, cu)
        verificar('muestra «Su historia» con sus saltos de línea y el material aprobado', 'nació en nuestro taller' in page.inner_text('.pz-historia') and page.evaluate("getComputedStyle(document.querySelector('.pz-historia')).whiteSpace") == 'pre-line' and 'Material: Lana suave de prueba' in page.inner_text('.pz-specs'))
        ev = [x for x in page.evaluate("JSON.parse(JSON.stringify(window.dataLayer || []))") if x.get('event') == 'qr_visita']
        verificar('el origen «tarjeta» se registra', ev and ev[0].get('origen') == 'tarjeta', ev)
        page.close()

        print('\n[Página /p/ — sin código, código inválido, pieza que no existe, fallos e interruptor]')
        page, err, llamadas = abrir(pc, base, '/p/?o=tarjeta')
        verificar('sin código: página general «Cuida tu pieza de Lana Rosa» con los 4 cuidados generales, sin llamar a la base', page.inner_text('h1') == 'Cuida tu pieza de Lana Rosa' and len(textos(page, '.pz-lista li')) == 4 and llamadas == [] and page.locator('.pz-prod').count() == 0 and not err, (llamadas, err))
        ev = [x for x in page.evaluate("JSON.parse(JSON.stringify(window.dataLayer || []))") if x.get('event') == 'qr_visita']
        verificar('la visita general se mide con item_id «generico»', ev and ev[0].get('item_id') == 'generico' and ev[0].get('origen') == 'tarjeta', ev)
        page.close()
        for malo in ('zzz', '%3Cscript%3Ealert(1)%3C/script%3E', '437e3985-f31b-4303-8890-f0d0a3139adc%27%20or%201=1', '../../etc/passwd'):
            page, err, llamadas = abrir(pc, base, '/p/?i=%s&o=cualquiera' % malo)
            verificar('código inválido «%s»: se ignora, página general y la base no recibe nada' % malo[:30], llamadas == [] and page.inner_text('h1') == 'Cuida tu pieza de Lana Rosa' and not err, (llamadas, err))
            page.close()
        page, err, llamadas = abrir(pc, base, '/p/?i=%s' % ZORO['id'], None)
        verificar('un código válido de una pieza que no está en el catálogo: avisa con cariño y muestra los cuidados generales', 'No encontramos esa pieza' in page.inner_text('.pz-aviso') and page.locator('.pz-prod').count() == 0 and len(textos(page, '.pz-lista li')) == 4 and not err, err)
        page.close()
        page, err, llamadas = abrir(pc, base, '/p/?i=%s' % ZORO['id'], estado=500)
        verificar('si la base falla, la página general igual sirve (sin errores de JavaScript)', page.inner_text('h1') == 'Cuida tu pieza de Lana Rosa' and 'No encontramos' not in page.inner_text('.pz-marco') and not err, err)
        page.close()
        page, err, llamadas = abrir(pc, base, '/p/?i=%s' % ZORO['id'], pieza(ZORO), config=CONFIG_JS.replace('QR_ACTIVO: true', 'QR_ACTIVO: false'))
        verificar('con QR_ACTIVO=false no se consulta la base: queda la página general', llamadas == [] and page.inner_text('h1') == 'Cuida tu pieza de Lana Rosa' and not err, (llamadas, err))
        page.close()
        page, err, llamadas = abrir(pc, base, '/p/?i=%s' % ZORO['id'], pieza(ZORO, nombre='<img src=x onerror="window.__xss=1">Zoro', historia='<script>window.__xss=1</script><b>negrita</b>', cuidados=['<b>x</b>']))
        verificar('texto con HTML (nombre, historia, cuidados) se muestra como texto y no se ejecuta ni se interpreta', page.evaluate('window.__xss') is None and page.locator('.pz-marco img[onerror], .pz-marco script, .pz-marco b').count() == 0 and '<b>negrita</b>' in page.inner_text('.pz-historia') and not err, err)
        page.close()

        print('\n[Página /p/ — celular y computador]')
        for nombre, ctx in (('celular 390 px', movil), ('computador 1280 px', pc)):
            tag = 'm' if ctx is movil else 'd'
            for caso, resp, ruta in (('cuidados de siempre', pieza(ZORO), '/p/?i=%s&o=etiqueta' % ZORO['id']), ('con historia (ejemplo)', validada, '/p/?i=%s&o=tarjeta' % ZARIA['id']), ('general', None, '/p/?o=tarjeta')):
                page, err, _ = abrir(ctx, base, ruta, resp)
                page.wait_for_function("[...document.querySelectorAll('.pz-prod img')].every(i => i.complete)", timeout=8000) if resp else None
                verificar('%s, %s: sin scroll horizontal ni errores de JavaScript; botones y enlaces de al menos 44 px' % (nombre, caso), pr.sin_scroll_horizontal(page) and not err and page.eval_on_selector_all('.pz-boton, .pz-enlace-sec', 'els => els.every(e => e.getBoundingClientRect().height >= 43.5)'), err)
                if CAPTURAS:
                    page.wait_for_timeout(400)
                    page.screenshot(path=os.path.join(CAPTURAS, 'qr-pagina-%s-%s.png' % (tag, {'cuidados de siempre': 'zoro', 'con historia (ejemplo)': 'historia', 'general': 'general'}[caso])), full_page=True)
                page.close()
        nav.close()

        print('\n[Códigos QR: generador y lectura real]')
        import segno
        pag = None
        with tempfile.TemporaryDirectory() as tmp:
            datos = os.path.join(tmp, 'piezas.json')
            json.dump([{'id': x['id'], 'nombre': x['nombre']} for x in PIEZAS], open(datos, 'w', encoding='utf-8'), ensure_ascii=False)
            salida = os.path.join(tmp, 'salida')
            r = subprocess.run([sys.executable, GENERADOR, '--datos', datos, '--salida', salida, '--tamano', '30'], capture_output=True, text=True)
            verificar('el generador crea los SVG, la hoja PDF y urls.csv (%d piezas)' % len(PIEZAS), r.returncode == 0 and len([f for f in os.listdir(salida) if f.endswith('.svg')]) >= len(PIEZAS) - 3 and os.path.getsize(os.path.join(salida, 'hoja-etiquetas.pdf')) > 20000 and os.path.exists(os.path.join(salida, 'urls.csv')), r.stderr[-300:])
            r2 = subprocess.run([sys.executable, GENERADOR, '--generico', '--salida', salida], capture_output=True, text=True)
            verificar('el generador crea la tarjeta general', r2.returncode == 0 and os.path.getsize(os.path.join(salida, 'tarjeta-general.pdf')) > 5000, r2.stderr[-300:])
            malos = subprocess.run([sys.executable, GENERADOR, '--datos', datos, '--salida', salida, '--tamano', '15'], capture_output=True, text=True)
            verificar('rechaza QR de menos de 20 mm (no escanearían bien)', malos.returncode != 0)
            invalido = os.path.join(tmp, 'malo.json'); json.dump([{'id': 'no-es-uuid', 'nombre': 'x'}], open(invalido, 'w'))
            r3 = subprocess.run([sys.executable, GENERADOR, '--datos', invalido, '--salida', os.path.join(tmp, 's2')], capture_output=True, text=True)
            verificar('rechaza ids que no son uuid de producto', r3.returncode != 0)
            # lectura real: cada QR se codifica a PNG y se decodifica con OpenCV
            sys.path.insert(0, os.path.join(pr.RAIZ, 'herramientas', 'qr'))
            import generar_qr as gq
            fallos_lectura, versiones = [], set()
            for x in PIEZAS:
                url = gq.url_pieza('https://lanarosacrochet.com', x['id'], 'etiqueta')
                q = segno.make(url, error='m')
                versiones.add(q.version)
                png = os.path.join(tmp, 'q.png'); q.save(png, scale=6, border=4)
                if decodificar_png(png) != url:
                    fallos_lectura.append(x['nombre'])
            verificar('los %d QR de las piezas se leen de verdad y devuelven su dirección exacta' % len(PIEZAS), not fallos_lectura, fallos_lectura[:3])
            svgs = [f for f in os.listdir(salida) if f.endswith('.svg')]
            ilegibles_svg = []
            n_svg = 0
            for nombre_svg in svgs[:12]:
                contenido = open(os.path.join(salida, nombre_svg), encoding='utf-8').read()
                n_svg += 1 if ('viewBox' in contenido and 'width="30mm"' in contenido) else 0
            verificar('cada SVG suelto trae viewBox y su medida real en mm (30 mm), para imprimirlo a escala', n_svg == min(12, len(svgs)) and len(svgs) >= len(PIEZAS) - 3)
            verificar('los QR son livianos (versión %s: pocos módulos, escanean aunque la etiqueta sea pequeña)' % sorted(versiones), max(versiones) <= 6, sorted(versiones))
            png = os.path.join(tmp, 'g.png'); segno.make(gq.url_general('https://lanarosacrochet.com'), error='m').save(png, scale=6, border=4)
            verificar('el QR general devuelve https://lanarosacrochet.com/p/?o=tarjeta', decodificar_png(png) == 'https://lanarosacrochet.com/p/?o=tarjeta')
            # lectura de la hoja tal como se imprime (se dibuja el mismo HTML y se leen los QR de la imagen)
            html_hoja = gq.hoja_etiquetas([{'id': x['id'], 'nombre': x['nombre']} for x in PIEZAS[:12]], 'https://lanarosacrochet.com', 'etiqueta', 30)
            ruta_html = os.path.join(tmp, 'hoja.html'); open(ruta_html, 'w', encoding='utf-8').write(html_hoja)
            n2 = p.chromium.launch(executable_path=pr.CHROMIUM) if pr.CHROMIUM else p.chromium.launch()
            c2 = n2.new_context(viewport={'width': 794, 'height': 1123}, device_scale_factor=3)
            pg2 = c2.new_page(); pg2.goto('file://' + ruta_html); pg2.wait_for_timeout(500)
            img_hoja = os.path.join(tmp, 'hoja.png'); pg2.screenshot(path=img_hoja, full_page=True)
            cajas = pg2.eval_on_selector_all('.eti svg', 'els => els.map(e => { const b = e.getBoundingClientRect(); return [b.left, b.top + scrollY, b.width, b.height]; })')
            n2.close()
            import cv2
            img = cv2.imread(img_hoja)
            esperados = [gq.url_pieza('https://lanarosacrochet.com', x['id'], 'etiqueta') for x in PIEZAS[:12]]
            ilegibles = []
            for (x0, y0, w, h), url in zip(cajas, esperados):
                m = 12   # margen en px de pantalla: la zona de silencio ya viene en el SVG
                recorte = img[max(0, int((y0 - m) * 3)): int((y0 + h + m) * 3), max(0, int((x0 - m) * 3)): int((x0 + w + m) * 3)]
                txt = leer_recorte(recorte)
                if txt != url:
                    ilegibles.append(url[-40:])
            verificar('en la hoja tal como se imprime (30 mm) se lee cada uno de los %d QR de la muestra, con su dirección exacta' % len(esperados), len(cajas) == len(esperados) and not ilegibles, ilegibles[:2])
            ancho_mm = cajas[0][2] / (96 / 25.4)
            verificar('cada QR impreso mide 30 mm de lado (medido en la hoja: %.1f mm)' % ancho_mm, abs(ancho_mm - 30) < 0.6, ancho_mm)
            if CAPTURAS:
                cv2.imwrite(os.path.join(CAPTURAS, 'qr-hoja-muestra.png'), img[:1400])
        # las direcciones que genera el generador son las que entiende la página
        n3 = p.chromium.launch(executable_path=pr.CHROMIUM) if pr.CHROMIUM else p.chromium.launch()
        c3 = n3.new_context(); pg3 = c3.new_page()
        pg3.route(re.compile(r'^(?!http://127\.0\.0\.1).*'), lambda r: r.abort())
        pg3.goto(base + '/p/?o=tarjeta'); pg3.wait_for_selector(ESPERA)
        urls = [gq.url_pieza(base, x['id'], 'etiqueta') for x in PIEZAS]
        leidos = pg3.evaluate("""async (urls) => { const m = await import('/js/universo/pieza.js'); return urls.map(u => m.leerParametros(new URL(u).search)); }""", urls)
        verificar('la página entiende las %d direcciones que genera el generador (id y origen)' % len(urls), all(l['id'] == x['id'] and l['origen'] == 'etiqueta' for l, x in zip(leidos, PIEZAS)))
        n3.close()
    srv.shutdown()
    print('\n%d comprobaciones correctas, %d con falla.' % (pr.pasaron, len(pr.fallos)))
    if pr.fallos:
        print('FALLAS:\n - ' + '\n - '.join(pr.fallos))
        sys.exit(1)


if __name__ == '__main__':
    main()
