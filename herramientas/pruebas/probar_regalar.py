#!/usr/bin/env python3
"""Pruebas de «Rosina te ayuda a regalar» (Etapa 1 del universo de Rosina).

Usa los datos reales del catálogo guardados en fixtures/regalos.json (respuesta de la función obtener_regalos_web),
levanta un servidor local y simula la respuesta de Supabase con page.route (no toca producción ni escribe datos).

Uso:  python3 herramientas/pruebas/probar_regalar.py [carpeta_capturas]
Requiere: pip install playwright y un Chromium (en la nube: /opt/pw-browsers/chromium).
"""
import copy, functools, http.server, json, os, re, sys, threading

from playwright.sync_api import sync_playwright

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
FIXTURE = os.path.join(os.path.dirname(__file__), 'fixtures', 'regalos.json')
CAPTURAS = sys.argv[1] if len(sys.argv) > 1 else None
CHROMIUM = '/opt/pw-browsers/chromium' if os.path.exists('/opt/pw-browsers/chromium') else None

CATALOGO = json.load(open(FIXTURE, encoding='utf-8'))
fallos, pasaron = [], 0


def verificar(nombre, condicion, detalle=''):
    global pasaron
    if condicion:
        pasaron += 1
        print('  ok   ' + nombre)
    else:
        fallos.append(nombre)
        print('  FALLA ' + nombre + (' → ' + str(detalle) if detalle else ''))


class Silencioso(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


class Servidor(http.server.ThreadingHTTPServer):
    def handle_error(self, request, client_address):
        pass  # el navegador corta pedidos (imágenes, GTM) y eso no es un error de la prueba


def servidor():
    h = functools.partial(Silencioso, directory=RAIZ)
    s = Servidor(('127.0.0.1', 0), h)
    threading.Thread(target=s.serve_forever, daemon=True).start()
    return s, 'http://127.0.0.1:%d' % s.server_address[1]


def con_etiquetas_revisadas(catalogo, nombres):
    """Copia del catálogo donde los productos indicados tienen las etiquetas revisadas (como si Sara las hubiera aprobado)."""
    c = copy.deepcopy(catalogo)
    for p in c:
        if p['nombre'] in nombres:
            p['etiquetas_revisadas'] = True
    return c


def abrir(ctx, base, catalogo, ruta='/universo-rosina.html', estado=200, config=None):
    """Abre la página con el RPC simulado. Devuelve (page, errores_js)."""
    page = ctx.new_page()
    # El aviso de cookies tapa las capturas: se simula una decisión ya tomada («Rechazar»).
    page.add_init_script("try{localStorage.setItem('lrConsent',JSON.stringify({v:1,a:false,t:new Date().toISOString()}))}catch(e){}")
    errores = []
    page.on('pageerror', lambda e: errores.append('pageerror: ' + str(e)))
    page.on('console', lambda m: errores.append('console: ' + m.text) if m.type == 'error' and 'Failed to load resource' not in m.text else None)

    def rpc(route):
        if estado != 200:
            route.fulfill(status=estado, content_type='application/json', body='{"message":"error simulado"}')
        else:
            route.fulfill(status=200, content_type='application/json', body=json.dumps(catalogo))

    # Playwright usa primero la ruta registrada al final: primero se corta todo lo externo y luego se simula el RPC.
    page.route(re.compile(r'^(?!http://127\.0\.0\.1).*'), lambda r: r.abort())
    page.route('**/rest/v1/rpc/obtener_regalos_web', rpc)
    if config is not None:
        page.route('**/js/universo/config.js', lambda r: r.fulfill(status=200, content_type='text/javascript', body=config))
    page.goto(base + ruta, wait_until='domcontentloaded')
    page.wait_for_selector('#regalar-raiz .ur-marco, #regalar-raiz .ur-vacio, #regalar-raiz .ur-aviso', timeout=8000)
    return page, errores


def lista(page, clave):
    return page.locator('select.ur-select[data-clave="%s"]' % clave)


def elegir(page, clave, id_):
    lista(page, clave).select_option(id_)


def tarjetas(page, seccion):
    return page.locator('.ur-seccion[aria-label="%s"] .ur-card' % seccion)


def precios_de(page):
    return page.eval_on_selector_all('.ur-card', 'els => els.map(e => [e.querySelector(".ur-nombre").textContent, e.querySelector(".ur-precio").textContent])')


def captura(page, nombre, destino):
    """Foto de lo que se ve; espera a que carguen las imágenes que están en pantalla."""
    page.wait_for_function('''() => [...document.querySelectorAll('.ur-card img')].filter(i => { const r = i.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; }).every(i => i.complete && i.naturalWidth > 0)''', timeout=8000)
    page.evaluate('''() => Promise.race([new Promise(r => setTimeout(r, 2500)), Promise.all([...document.querySelectorAll(".ur-card img")].filter(i => { const b = i.getBoundingClientRect(); return b.top < innerHeight && b.bottom > 0 && i.complete && i.naturalWidth > 0; }).map(i => i.decode().catch(() => null)))])''')
    page.wait_for_timeout(500)  # deja pintar las imágenes decodificadas
    page.screenshot(path=os.path.join(destino, nombre), full_page=False)


def sin_scroll_horizontal(page):
    return page.evaluate('document.documentElement.scrollWidth <= window.innerWidth + 1')


def main():
    srv, base = servidor()
    with sync_playwright() as p:
        nav = p.chromium.launch(executable_path=CHROMIUM) if CHROMIUM else p.chromium.launch()
        movil = nav.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, locale='es-CO')
        pc = nav.new_context(viewport={'width': 1280, 'height': 900}, locale='es-CO')

        print('\n[Reglas puras de recomendar()]')
        page, err = abrir(pc, base, CATALOGO)
        res = page.evaluate('''async (cat) => {
          const m = await import('/js/universo/regalar.js');
          const r = (sel, o) => m.recomendar(cat, sel, o);
          const nom = (l) => l.map(p => p.nombre);
          const todo = r({}, {});
          return {
            sinBase: [...todo.disponibles, ...todo.encargo].some(p => p.personalizable_base || p.categoria_web === 'Complementos'),
            nIdeas: todo.ideas.length,
            conTamano: [...r({tamano:'pequeno'}, {}).disponibles].every(p => p.tamano_cm != null && p.tamano_cm <= 12),
            nTotalSinFiltro: todo.disponibles.length + todo.encargo.length,
            ya: r({disponibilidad:'ya'}, {}),
            llavero: nom(r({tipo:'llavero'}, {}).disponibles).length,
            etiquetasSinRevisar: r({ocasion:'dia_madre'}, {usarEtiquetas:true}).disponibles.length,
            etiquetasPropuestas: r({ocasion:'dia_madre'}, {usarEtiquetas:true, modoPropuestas:true}).disponibles.length,
            puede: m.puedeUsarEtiquetas(cat),
          };
        }''', CATALOGO)
        con_precio = [x for x in CATALOGO if not x['personalizable_base'] and x['categoria_web'] != 'Complementos']
        verificar('nunca recomienda los productos base ni «Complementos»', res['sinBase'] is False)
        verificar('el total sin filtros es el catálogo menos 3 bases y 1 complemento (%d)' % len(con_precio), res['nTotalSinFiltro'] == len(con_precio), res['nTotalSinFiltro'])
        verificar('las 3 ideas para personalizar son las 3 reales', res['nIdeas'] == 3, res['nIdeas'])
        verificar('con tamaño «pequeño» solo salen productos con medida ≤ 12 cm', res['conTamano'] is True)
        verificar('«solo lo que está en existencia» quita el encargo y las ideas', res['ya']['encargo'] == [] and res['ya']['ideas'] == [])
        verificar('con etiquetas sin revisar, el filtro de ocasión no devuelve nada', res['etiquetasSinRevisar'] == 0, res['etiquetasSinRevisar'])
        verificar('en vista previa de propuestas sí se usan', res['etiquetasPropuestas'] > 0, res['etiquetasPropuestas'])
        verificar('con 0 etiquetas revisadas no se ofrecen los filtros de ocasión ni «para quién»', res['puede'] is False)
        page.close()

        for nombre, ctx in (('celular 390 px', movil), ('computador 1280 px', pc)):
            print('\n[Página real con los 72 productos del catálogo — %s]' % nombre)
            tag = 'm' if ctx is movil else 'd'
            page, err = abrir(ctx, base, CATALOGO)
            verificar('muestra solo los 4 filtros sin etiquetas (tipo, presupuesto, tamaño, disponibilidad)', page.locator('.ur-grupo').count() == 4, page.locator('.ur-grupo').count())
            verificar('no hay filtros de ocasión ni «para quién» hasta que haya etiquetas revisadas', lista(page, 'ocasion').count() == 0 and lista(page, 'destinatario').count() == 0)
            verificar('sin filtros se ven los productos y las ideas', tarjetas(page, 'Disponibles ya').count() > 0 and tarjetas(page, 'Ideas para personalizar').count() == 3)
            verificar('sin scroll horizontal', sin_scroll_horizontal(page))
            if CAPTURAS:
                os.makedirs(CAPTURAS, exist_ok=True)
                page.evaluate("window.scrollTo(0, 0)")
                page.screenshot(path=os.path.join(CAPTURAS, 'universo-%s-0-arriba.png' % tag), full_page=False)
                page.evaluate("document.querySelector('#regalar').scrollIntoView()")
                captura(page, 'universo-%s-1-inicio.png' % tag, CAPTURAS)

            # R1: sin resultados → mensaje claro y WhatsApp
            elegir(page, 'tipo', 'llavero'); elegir(page, 'presupuesto', 'p5')
            verificar('R1 sin resultados: explica y ofrece WhatsApp', page.locator('.ur-vacio').count() == 1 and 'No encontré productos' in page.inner_text('.ur-vacio') and page.locator('.ur-cierre a[href^="https://wa.me/573205072801"]').count() == 1)
            verificar('R1 el resumen en vivo dice «Sin resultados»', 'Sin resultados' in page.inner_text('.ur-resumen'))
            # R2: sin existencia solo en «Por encargo»
            page.click('.ur-reiniciar')
            elegir(page, 'tipo', 'otro'); elegir(page, 'presupuesto', 'p5')
            verificar('R2 el Bolso ZARIA (sin existencia) aparece solo en «Por encargo»', tarjetas(page, 'Por encargo').filter(has_text='Bolso ZARIA').count() == 1 and tarjetas(page, 'Disponibles ya').count() == 0)
            verificar('R2 la tarjeta dice «Por encargo» con el tiempo real del ERP', 'Por encargo · 10 días hábiles' in tarjetas(page, 'Por encargo').first.inner_text())
            elegir(page, 'disponibilidad', 'ya')
            verificar('R2 con «lo necesito ya» el Bolso desaparece', page.locator('.ur-card').count() == 0)
            # ideas
            page.click('.ur-reiniciar')
            elegir(page, 'tipo', 'amigurumi'); elegir(page, 'presupuesto', 'p3'); elegir(page, 'tamano', 'mediano')
            ideas = tarjetas(page, 'Ideas para personalizar')
            nombres_ideas = [ideas.nth(i).inner_text() for i in range(ideas.count())]
            verificar('ideas: con $50.000–$100.000 y mediano salen las de 13 y 15 cm (85.000 y 95.000), no la de 20 cm ($115.000)', ideas.count() == 2 and any('13 cm' in n for n in nombres_ideas) and any('15 cm' in n for n in nombres_ideas), nombres_ideas)
            verificar('ideas: la tarjeta aclara que las fotos son de referencia y el precio es «Desde»', 'las fotos son de referencia' in ideas.first.inner_text() and 'Desde $' in ideas.first.inner_text())
            hrefs = page.eval_on_selector_all('.ur-card', 'els => els.map(e => e.getAttribute("href"))')
            verificar('todas las tarjetas llevan a la ficha de la tienda con la ruta absoluta', all(h.startswith('/tienda.html?producto=') for h in hrefs), hrefs[:3])
            # R4: precios idénticos al catálogo
            page.click('.ur-reiniciar')
            elegir(page, 'tipo', 'amigurumi')
            while page.locator('.ur-mas').count():
                page.locator('.ur-mas').first.click()
            catalogo_por_nombre = {x['nombre']: x for x in CATALOGO}
            malos = []
            for nombre_p, precio_txt in precios_de(page):
                real = catalogo_por_nombre[nombre_p]['precio']
                if int(re.sub(r'\D', '', precio_txt.split('COP')[0])) != int(real):
                    malos.append((nombre_p, precio_txt, real))
            verificar('R4 los precios en pantalla son exactamente los del catálogo (%d tarjetas de amigurumis)' % page.locator('.ur-card').count(), not malos, malos[:3])
            nota = page.locator('.ur-pj').count()
            verificar('las piezas inspiradas en personajes llevan el aviso «no es un producto oficial»', nota == sum(1 for x in CATALOGO if x['es_personaje'] and x['categoria_web'] == 'Amigurumis' and x['en_existencia'] and not x['personalizable_base']), nota)
            verificar('sin scroll horizontal tras filtrar', sin_scroll_horizontal(page))
            if CAPTURAS:
                page.evaluate("document.querySelector('.ur-resumen').scrollIntoView()")
                captura(page, 'universo-%s-2-amigurumis.png' % tag, CAPTURAS)
            verificar('sin errores de JavaScript', not err, err)
            page.close()

        print('\n[Teclado y lectores de pantalla]')
        page, err = abrir(pc, base, CATALOGO)
        sel_tipo = lista(page, 'tipo')
        verificar('R5 los filtros son listas desplegables (select), una por pregunta', page.locator('select.ur-select').count() == 4 and page.locator('.ur-chip').count() == 0)
        verificar('R5 cada lista tiene su etiqueta asociada (label for)', page.eval_on_selector_all('select.ur-select', 'els => els.every(s => { const l = document.querySelector("label[for=" + s.id + "]"); return l && l.textContent.length > 5; })'))
        verificar('R5 la primera opción de cada lista es «sin filtro»', page.eval_on_selector_all('select.ur-select', 'els => els.every(s => s.options[0].value === "" && s.value === "")'))
        sel_tipo.focus(); page.keyboard.press('ArrowDown')
        verificar('R5 con el teclado (flecha abajo) se elige una opción y se filtra', sel_tipo.input_value() == 'amigurumi' and page.locator('.ur-select.ur-elegido').count() == 1 and tarjetas(page, 'Disponibles ya').count() > 0)
        page.keyboard.press('ArrowUp')
        verificar('R5 flecha arriba vuelve a «sin filtro»', sel_tipo.input_value() == '' and page.locator('.ur-select.ur-elegido').count() == 0)
        verificar('R5 el resumen es una región en vivo y educada', page.get_attribute('.ur-resumen', 'aria-live') == 'polite' and page.get_attribute('.ur-resumen', 'role') == 'status')
        elegir(page, 'tipo', 'llavero'); elegir(page, 'presupuesto', 'p5')
        page.click('.ur-reiniciar')
        verificar('R5 «Empezar de nuevo» devuelve todas las listas a «sin filtro»', page.eval_on_selector_all('select.ur-select', 'els => els.every(s => s.value === "")') and page.locator('.ur-select.ur-elegido').count() == 0 and page.locator('.ur-vacio').count() == 0)
        verificar('R5 todas las listas miden al menos 44 px de alto', page.eval_on_selector_all('select.ur-select', 'els => els.every(e => e.getBoundingClientRect().height >= 44)'))
        verificar('R5 las imágenes de producto tienen texto alternativo', page.eval_on_selector_all('.ur-card img', 'els => els.every(i => i.alt && i.alt.length > 2)'))
        page.close()

        print('\n[Etiquetas revisadas por el taller]')
        revisados = [x['nombre'] for x in CATALOGO if x['categoria_web'] in ('Llaveros', 'Peluches', 'Macetas') and x['en_existencia']][:24]
        cat_rev = con_etiquetas_revisadas(CATALOGO, revisados)
        page, err = abrir(pc, base, cat_rev)
        verificar('con 24 productos revisados aparecen los filtros de ocasión y «para quién» (%d grupos)' % page.locator('.ur-grupo').count(), page.locator('.ur-grupo').count() == 6)
        elegir(page, 'ocasion', 'dia_madre')
        nombres = [n for n, _ in precios_de(page)]
        esperados = [x['nombre'] for x in cat_rev if x['etiquetas_revisadas'] and 'dia_madre' in x['ocasiones'] and not x['personalizable_base']]
        # Los 3 «Amigurumi personalizado» (ideas) siempre se ofrecen: se quitan de la comparación
        solo_productos = [n for n in nombres if not n.startswith('Amigurumi personalizado')]
        verificar('R3 con «Día de la madre» solo salen productos con esa etiqueta revisada', sorted(solo_productos) == sorted(esperados) and len(esperados) > 0, (sorted(solo_productos)[:4], sorted(esperados)[:4]))
        sin_revisar_con_etiqueta = [x['nombre'] for x in cat_rev if not x['etiquetas_revisadas'] and 'dia_madre' in x['ocasiones'] and not x['personalizable_base']]
        verificar('R3 los productos con etiqueta propuesta pero sin revisar (p. ej. «Oveja con Vestido 23cm») no aparecen', len(sin_revisar_con_etiqueta) > 0 and not set(sin_revisar_con_etiqueta) & set(solo_productos), set(sin_revisar_con_etiqueta) & set(solo_productos))
        page.close()

        print('\n[Vista previa de etiquetas propuestas — solo para Sara]')
        page, err = abrir(pc, base, CATALOGO, ruta='/universo-rosina.html?etiquetas=propuestas')
        verificar('muestra los 6 grupos y un aviso de que es una vista previa', page.locator('.ur-grupo').count() == 6 and 'Vista previa' in page.inner_text('.ur-aviso'))
        elegir(page, 'destinatario', 'mama')
        verificar('la vista previa filtra con las etiquetas propuestas', page.locator('.ur-card').count() > 0)
        if CAPTURAS:
            page.evaluate("document.querySelector('#regalar').scrollIntoView()")
            captura(page, 'universo-d-3-vista-previa-etiquetas.png', CAPTURAS)
        verificar('sin errores de JavaScript', not err, err)
        page.close()

        print('\n[Fallos y interruptor]')
        for etiqueta, kw in (('Supabase responde 500', dict(estado=500)), ('el catálogo llega vacío', dict(catalogo=[]))):
            cat = kw.pop('catalogo', CATALOGO)
            page, err = abrir(movil, base, cat, **kw)
            txt = page.inner_text('#regalar-raiz')
            verificar('%s: mensaje claro, enlace a WhatsApp y a la tienda' % etiqueta, 'No pude cargar los productos' in txt and page.locator('#regalar-raiz a[href^="https://wa.me/573205072801"]').count() == 1 and page.locator('#regalar-raiz a[href="/tienda.html"]').count() == 1)
            verificar('%s: sin scroll horizontal' % etiqueta, sin_scroll_horizontal(page))
            if CAPTURAS and estado_500(kw):
                page.evaluate("document.querySelector('#regalar').scrollIntoView()")
                page.screenshot(path=os.path.join(CAPTURAS, 'universo-m-4-error.png'), full_page=False)
            page.close()
        config_apagada = open(os.path.join(RAIZ, 'js', 'universo', 'config.js'), encoding='utf-8').read().replace('REGALAR_ACTIVO: true', 'REGALAR_ACTIVO: false')
        page, err = abrir(pc, base, CATALOGO, config=config_apagada)
        verificar('con REGALAR_ACTIVO=false la función se apaga y la página sigue entera', 'Muy pronto' in page.inner_text('#regalar-raiz') and page.locator('.ur-select').count() == 0 and page.locator('.recorrido').count() == 4)
        page.close()

        print('\n[Página en general]')
        page, err = abrir(pc, base, CATALOGO)
        verificar('está publicada: sin noindex, con canonical propio', page.locator('meta[name="robots"]').count() == 0 and page.get_attribute('link[rel="canonical"]', 'href') == 'https://lanarosacrochet.com/universo-rosina.html')
        verificar('está en el sitemap', 'https://lanarosacrochet.com/universo-rosina.html' in open(os.path.join(RAIZ, 'sitemap.xml'), encoding='utf-8').read())
        verificar('el pie de la página enlaza al universo con ruta absoluta', page.locator('footer a[href="/universo-rosina.html"]').count() == 1)
        verificar('usa las fuentes propias (ningún pedido a Google Fonts)', page.evaluate('!document.documentElement.outerHTML.includes("fonts.googleapis")'))
        verificar('los 4 recorridos están y llevan a rutas absolutas', page.eval_on_selector_all('.recorrido', 'els => els.map(e => e.getAttribute("href"))') == ['#regalar', '/personaliza.html', '/revista.html', '/academy/'])
        verificar('un solo h1', page.locator('h1').count() == 1)
        page.close()
        nav.close()
    srv.shutdown()
    print('\n%d comprobaciones correctas, %d con falla.' % (pasaron, len(fallos)))
    if fallos:
        print('FALLAS:\n - ' + '\n - '.join(fallos))
        sys.exit(1)


def estado_500(kw):
    return kw.get('estado') == 500


if __name__ == '__main__':
    main()
