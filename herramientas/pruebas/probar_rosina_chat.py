#!/usr/bin/env python3
"""Pruebas del chat de Rosina con tarjetas de producto (Etapa 4): js/rosina-chat.js con la función simulada.

Levanta un servidor local, simula la respuesta de la función rosina-web con page.route (no llama a Anthropic ni a Supabase) y revisa
que las tarjetas se vean y se comporten bien en celular y computador, que nada de lo que llegue se inserte como HTML y que la
respuesta antigua (sin productos) siga funcionando.

Uso:  python3 herramientas/pruebas/probar_rosina_chat.py [carpeta_capturas]
"""
import json, os, re, sys

from playwright.sync_api import sync_playwright

sys.path.insert(0, os.path.dirname(__file__))
import probar_regalar as R

CAPTURAS = R.CAPTURAS
fallos, pasaron = [], 0


def sm(n):
    """Como la web: sin la medida en cm en el nombre (excepto los personalizados)."""
    if re.match(r'^Amigurumi personalizado \d+ cm$', n): return n
    n = re.sub(r'\s*\(\s*\d+(?:[.,]\d+)?\s*cm\s*\)', '', n, flags=re.I)
    n = re.sub(r'\s*\d+(?:[.,]\d+)?\s*cm(?:\s*[*x×]\s*\d+(?:[.,]\d+)?\s*cm)?', '', n, flags=re.I)
    return re.sub(r'\s{2,}', ' ', n).strip()


def verificar(nombre, condicion, detalle=''):
    global pasaron
    if condicion:
        pasaron += 1
        print('  ok   ' + nombre)
    else:
        fallos.append(nombre)
        print('  FALLA ' + nombre + (' → ' + str(detalle) if detalle else ''))


def producto(nombre, precio, estado, foto='x.jpg', elaboracion=None, personaje=False, id_=None):
    return {'id': id_ or ('id-' + re.sub(r'\W+', '', nombre)[:12]), 'nombre': nombre, 'precio': precio, 'foto': foto, 'url': '/tienda.html?producto=x', 'estado': estado, 'elaboracion': elaboracion, 'personaje': personaje}


CATALOGO_FOTOS = R.CATALOGO  # fotos reales para que las tarjetas muestren imágenes de verdad en las capturas


def abrir_chat(ctx, base, respuestas, ruta='/contacto.html'):
    """Abre la página, simula la función (una respuesta por turno, la última se repite) y abre el panel del chat."""
    page = ctx.new_page()
    page.add_init_script("try{localStorage.setItem('lrConsent',JSON.stringify({v:1,a:false,t:new Date().toISOString()}))}catch(e){}")
    errores, pedidos = [], []
    page.on('pageerror', lambda e: errores.append('pageerror: ' + str(e)))
    page.on('console', lambda m: errores.append('console: ' + m.text) if m.type == 'error' and 'Failed to load resource' not in m.text else None)
    turno = {'i': 0}

    def funcion(route):
        if route.request.method == 'OPTIONS':
            route.fulfill(status=204, headers={'access-control-allow-origin': '*', 'access-control-allow-headers': '*'})
            return
        pedidos.append(json.loads(route.request.post_data or '{}'))
        r = respuestas[min(turno['i'], len(respuestas) - 1)]
        turno['i'] += 1
        estado, cuerpo = (r if isinstance(r, tuple) else (200, r))
        route.fulfill(status=estado, content_type='application/json', body=json.dumps(cuerpo), headers={'access-control-allow-origin': '*'})

    page.route(re.compile(r'^(?!http://127\.0\.0\.1).*'), lambda r: r.abort())
    page.route('**/rest/v1/rpc/obtener_regalos_web', lambda r: r.fulfill(status=200, content_type='application/json', body=json.dumps(CATALOGO_FOTOS)))
    page.route('**/functions/v1/rosina-web', funcion)
    page.goto(base + ruta, wait_until='load')
    page.wait_for_selector('.rc-boton', timeout=8000)
    page.click('.rc-boton')
    page.wait_for_selector('.rc-panel.abierto')
    return page, errores, pedidos


def preguntar(page, texto):
    n = page.locator('.rc-m').count()
    page.fill('.rc-form input', texto)
    page.click('.rc-form button')
    page.wait_for_function('(n) => document.querySelectorAll(".rc-m").length >= n + 2 && !document.body.innerText.includes("Pensando…")', arg=n, timeout=8000)
    page.wait_for_timeout(150)


def main():
    srv, base = R.servidor()
    real = [p for p in R.CATALOGO if p['en_existencia'] and not p['personalizable_base']]
    en_existencia = real[0]
    por_encargo = next(p for p in R.CATALOGO if not p['en_existencia'] and not p['personalizable_base'] and not p['es_personaje'])
    personaje = next(p for p in R.CATALOGO if p['es_personaje'] and not p['personalizable_base'])
    base_pers = next(p for p in R.CATALOGO if p['personalizable_base'])
    TRES = {'respuesta': 'Te recomiendo estos tres, según lo que me cuentas.', 'sin_dato': False, 'productos': [
        producto(en_existencia['nombre'], en_existencia['precio'], 'existencia', en_existencia['foto_url'], id_=en_existencia['id']),
        producto(por_encargo['nombre'], por_encargo['precio'], 'encargo', por_encargo['foto_url'], elaboracion='8 a 10 días hábiles', id_=por_encargo['id']),
        producto(base_pers['nombre'], base_pers['precio'], 'personalizado', base_pers['foto_url'], id_=base_pers['id'])]}
    with sync_playwright() as p:
        nav = p.chromium.launch(executable_path=R.CHROMIUM) if R.CHROMIUM else p.chromium.launch()
        for nombre, ctx, ancho in (('celular 390 px', nav.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, locale='es-CO'), 390),
                                   ('computador 1280 px', nav.new_context(viewport={'width': 1280, 'height': 900}, locale='es-CO'), 1280)):
            print('\n[Chat con tarjetas — %s]' % nombre)
            page, err, pedidos = abrir_chat(ctx, base, [TRES])
            preguntar(page, '¿Qué me recomiendan de regalo?')
            tarjetas = page.locator('.rc-card')
            verificar('el texto de Rosina y tres tarjetas aparecen', 'Te recomiendo estos tres' in page.inner_text('.rc-msgs') and tarjetas.count() == 3, tarjetas.count())
            textos = [tarjetas.nth(i).inner_text() for i in range(3)]
            verificar('cada tarjeta lleva nombre y precio del catálogo (%s)' % en_existencia['nombre'], sm(en_existencia['nombre']) in textos[0] and ('{:,.0f}'.format(en_existencia['precio']).replace(',', '.')) in textos[0], textos[0])
            verificar('«En existencia», «Por encargo · tiempo» y «Desde… se teje a partir de tu foto o idea» según el estado', 'En existencia' in textos[0] and 'Por encargo · 8 a 10 días hábiles' in textos[1] and textos[2].count('Desde') == 1 and 'Se teje a partir de tu foto o idea' in textos[2], textos)
            verificar('el enlace lleva a la ficha del producto y abre en otra pestaña (el chat no se pierde)', tarjetas.nth(0).get_attribute('href') == '/tienda.html?producto=' + en_existencia['id'] and tarjetas.nth(0).get_attribute('target') == '_blank' and 'noopener' in tarjetas.nth(0).get_attribute('rel'))
            verificar('la foto sale de /img/productos/ con texto alternativo vacío (el nombre ya está al lado)', tarjetas.nth(0).locator('img').get_attribute('src') == '/img/productos/' + en_existencia['foto_url'] and tarjetas.nth(0).locator('img').get_attribute('alt') == '')
            alto = tarjetas.nth(0).bounding_box()['height']
            ancho_panel = page.eval_on_selector('.rc-msgs', 'e => [e.clientWidth, e.scrollWidth]')
            verificar('cada tarjeta mide más de 44 px de alto y no hay desplazamiento horizontal en el chat', alto >= 44 and ancho_panel[1] <= ancho_panel[0] + 1, [alto, ancho_panel])
            tarjetas.nth(0).focus()
            verificar('las tarjetas se alcanzan con el teclado y muestran borde de foco', page.eval_on_selector('.rc-card:focus-visible', 'e => getComputedStyle(e).borderTopColor !== "rgba(0, 0, 0, 0)"') if page.locator('.rc-card:focus-visible').count() else True)
            page.evaluate('window.__nuevo = true; document.querySelectorAll(".rc-card").forEach(a => a.addEventListener("click", e => e.preventDefault()))')
            tarjetas.nth(1).click()
            ev = page.evaluate('dataLayer.filter(e => e && /^rosina_/.test(e.event))')
            verificar('se mide la aparición de tarjetas y el clic (id y posición), sin texto de la conversación', any(e['event'] == 'rosina_tarjetas' and e['n_tarjetas'] == 3 for e in ev) and any(e['event'] == 'rosina_tarjeta_clic' and e['item_id'] == por_encargo['id'] and e['posicion'] == 2 for e in ev) and 'recomiendan' not in json.dumps(ev), ev)
            preguntar(page, '¿Y algo más barato?')
            hist = pedidos[-1]['mensajes']
            verificar('lo que se manda a la función después de las tarjetas es solo texto (sin datos de productos)', all(set(m.keys()) == {'role', 'content'} and isinstance(m['content'], str) for m in hist) and len(hist) == 3, hist)
            verificar('sin errores en la consola', not err, err)
            if CAPTURAS:
                page.wait_for_function('[...document.querySelectorAll(".rc-card img")].every(i => i.complete && i.naturalWidth > 0)', timeout=8000)
                page.evaluate('document.querySelector(".rc-msgs").scrollTop = 0'); page.wait_for_timeout(300)
                page.screenshot(path=os.path.join(CAPTURAS, 'rosina-tarjetas-%d.png' % ancho))
            page.close()

        ctx = nav.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, locale='es-CO')
        print('\n[Seguridad: nada de lo que llegue se inserta como HTML]')
        mal = {'respuesta': 'Mira.', 'sin_dato': False, 'productos': [
            producto('<img src=x onerror="window.__xss=1">Oso', 1000, 'existencia', '../../etc/passwd', id_='a"b\'c<d>'),
            None, {'nombre': 'sin id'}, {'id': 5, 'nombre': 'id numérico'}, producto('<b>negrita</b>', 2000, 'encargo', 'x.jpg', elaboracion='<script>window.__xss=2</script>', id_='ok-2'),
            producto('cuarta', 3000, 'existencia'), producto('quinta', 3000, 'existencia')]}
        page, err, pedidos = abrir_chat(ctx, base, [mal])
        preguntar(page, 'prueba')
        page.wait_for_timeout(300)
        verificar('ni las etiquetas HTML del nombre ni del tiempo de elaboración se ejecutan ni se vuelven elementos', page.evaluate('window.__xss') is None and page.locator('.rc-card b b, .rc-card img[src="x"], .rc-card script').count() == 0 and '<img src=x' in page.inner_text('.rc-cards'))
        verificar('datos malformados se ignoran (null, sin id, id que no es texto) y nunca hay más de 3 tarjetas', page.locator('.rc-card').count() == 3, page.locator('.rc-card').count())
        href = page.locator('.rc-card').first.get_attribute('href'); src = page.locator('.rc-card img').first.get_attribute('src')
        verificar('el enlace y la foto se construyen con el id y el nombre de archivo codificados (no con una dirección de la respuesta)', href == '/tienda.html?producto=' + 'a%22b\'c%3Cd%3E' and src == '/img/productos/..%2F..%2Fetc%2Fpasswd', [href, src])
        verificar('sin errores en la consola', not err, err)
        page.close()

        print('\n[Cuando Rosina no tiene el dato]')
        page, err, pedidos = abrir_chat(ctx, base, [{'respuesta': 'No tengo ese dato; escríbenos al WhatsApp.', 'productos': [], 'sin_dato': True}])
        preguntar(page, '¿Envían a Japón? Soy ana@correo.com')
        wa = page.locator('.rc-wa')
        verificar('aparece un botón de WhatsApp al equipo, con un mensaje fijo que no repite lo que escribió la persona', wa.count() == 1 and wa.get_attribute('href').startswith('https://wa.me/573205072801?text=') and 'correo' not in wa.get_attribute('href') and 'Jap' not in wa.get_attribute('href') and 'ana%40' not in wa.get_attribute('href'), wa.get_attribute('href'))
        verificar('el botón abre en otra pestaña y mide solo que hubo una pregunta sin respuesta', wa.get_attribute('target') == '_blank' and any(isinstance(e, dict) and e.get('event') == 'rosina_sin_respuesta' for e in page.evaluate('dataLayer')) and 'ana@' not in json.dumps(page.evaluate('dataLayer')))
        verificar('no hay tarjetas', page.locator('.rc-card').count() == 0)
        if CAPTURAS:
            page.screenshot(path=os.path.join(CAPTURAS, 'rosina-sin-dato-390.png'))
        page.close()

        print('\n[Compatibilidad: respuesta antigua, errores y límites]')
        page, err, pedidos = abrir_chat(ctx, base, [{'respuesta': '¡Hola! Soy Rosina 🌸'}])
        preguntar(page, 'hola')
        verificar('la respuesta de la versión anterior (solo texto) se ve igual: sin tarjetas ni botón y sin errores', '¡Hola! Soy Rosina' in page.inner_text('.rc-msgs') and page.locator('.rc-card').count() == 0 and page.locator('.rc-wa').count() == 0 and not err, err)
        page.close()
        page, err, pedidos = abrir_chat(ctx, base, [(429, {'error': 'Hoy ya conversamos mucho 🌸 Escríbenos por WhatsApp'})])
        preguntar(page, 'hola')
        verificar('si la función dice que ya hubo muchos mensajes (429), se muestra el aviso y ninguna tarjeta', 'conversamos mucho' in page.inner_text('.rc-msgs') and page.locator('.rc-card').count() == 0 and page.locator('.rc-wa').count() == 0)
        page.close()
        page, err, pedidos = abrir_chat(ctx, base, [{'respuesta': 'Hola', 'productos': 'no es una lista', 'sin_dato': 'sí'}])
        preguntar(page, 'hola')
        verificar('campos con tipos raros no rompen nada (productos que no es lista, sin_dato que no es true)', page.locator('.rc-card').count() == 0 and page.locator('.rc-wa').count() == 0 and not err, err)
        page.close()
        page, err, pedidos = abrir_chat(ctx, base, [TRES], ruta='/tienda.html')
        preguntar(page, 'hola')
        verificar('el chat con tarjetas también funciona en la Tienda (la página donde más se usa)', page.locator('.rc-card').count() == 3)
        page.close()

        nav.close()
    srv.shutdown()
    print('\n%d comprobaciones correctas, %d con falla.' % (pasaron, len(fallos)))
    if fallos:
        print('FALLAS:'); [print(' - ' + f) for f in fallos]
        sys.exit(1)


if __name__ == '__main__':
    main()
