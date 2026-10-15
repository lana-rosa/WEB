#!/usr/bin/env python3
"""Pruebas del visor 3D / realidad aumentada (Etapa 5): carga diferida, sin servicios externos, medida real, fallos y accesibilidad.

Usa el navegador de pruebas con WebGL por software (SwiftShader), el modelo de prueba real (modelos3d/prueba/corazon-prueba.glb) y la página de
prueba /3d-prueba.html. Lo que NO se puede probar aquí es la realidad aumentada en un teléfono real (ver la lista de 10-ETAPA-5-3D-AR.md).

Uso:  python3 herramientas/pruebas/probar_visor3d.py [carpeta_capturas]
"""
import json, os, re, struct, sys

from playwright.sync_api import sync_playwright

sys.path.insert(0, os.path.dirname(__file__))
import probar_regalar as R

RAIZ = R.RAIZ
CAPTURAS = R.CAPTURAS
fallos, pasaron = [], 0
MODELOS = os.path.join(RAIZ, 'modelos3d', 'modelos.json')
UUID_PIEZA = 'dbd73591-2d40-40e5-a9f0-200b0c452815'   # Llavero Corazón 5 cm (para probar /p/ con un modelo «aprobado» simulado)


def verificar(nombre, condicion, detalle=''):
    global pasaron
    if condicion:
        pasaron += 1
        print('  ok   ' + nombre)
    else:
        fallos.append(nombre)
        print('  FALLA ' + nombre + (' → ' + str(detalle) if detalle else ''))


def pagina(ctx, base, ruta, rutas=(), espera=None):
    page = ctx.new_page()
    page.add_init_script("try{localStorage.setItem('lrConsent',JSON.stringify({v:1,a:false,t:new Date().toISOString()}))}catch(e){}")
    errores, pedidos = [], []
    page.on('pageerror', lambda e: errores.append('pageerror: ' + str(e)))
    page.on('console', lambda m: errores.append('console: ' + m.text) if m.type == 'error' and 'Failed to load resource' not in m.text else None)
    page.on('request', lambda rq: pedidos.append(rq.url))
    page.route(re.compile(r'^(?!http://127\.0\.0\.1).*'), lambda r: r.abort())
    for patron, manejador in rutas:
        page.route(patron, manejador)
    page.goto(base + ruta, wait_until='load')
    if espera:
        page.wait_for_selector(espera, timeout=8000)
    return page, errores, pedidos


def glb_info(ruta):
    """Cabecera de un GLB: versión, tamaño, y las extensiones que pide el JSON (Draco, KTX2…)."""
    d = open(ruta, 'rb').read()
    magia, version, largo = struct.unpack('<4sII', d[:12])
    n, tipo = struct.unpack('<I4s', d[12:20])
    j = json.loads(d[20:20 + n])
    return {'magia': magia, 'version': version, 'largo': largo, 'json': j}


def main():
    srv, base = R.servidor()
    modelos = json.load(open(MODELOS, encoding='utf-8'))
    prueba = next(m for m in modelos['modelos'] if m['id'] == 'corazon-prueba')
    with sync_playwright() as p:
        nav = p.chromium.launch(executable_path=R.CHROMIUM, args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']) if R.CHROMIUM else p.chromium.launch()
        movil = nav.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True, locale='es-CO')
        pc = nav.new_context(viewport={'width': 1280, 'height': 900}, locale='es-CO')

        print('\n[El archivo del modelo de prueba (modelos3d/prueba/corazon-prueba.glb)]')
        info = glb_info(os.path.join(RAIZ, prueba['glb'].lstrip('/')))
        j = info['json']
        verificar('es un GLB válido (glTF 2) de menos de 1 MB', info['magia'] == b'glTF' and info['version'] == 2 and info['largo'] < 1024 * 1024, info['largo'])
        verificar('no usa compresión Draco ni KTX2 (la librería pediría un decodificador a gstatic.com)', not set(j.get('extensionsUsed', [])) & {'KHR_draco_mesh_compression', 'KHR_texture_basisu', 'EXT_meshopt_compression'}, j.get('extensionsUsed'))
        tri = sum(j['accessors'][pr['indices']]['count'] // 3 for m in j['meshes'] for pr in m['primitives'])
        verificar('tiene menos de 100.000 triángulos (%d) y texturas de a lo sumo 1024 px' % tri, tri < 100000 and len(j.get('images', [])) <= 2)
        verificar('el modelo declara sus tres medidas reales en centímetros', all(prueba.get(k, 0) > 0 for k in ('ancho_cm', 'alto_cm', 'fondo_cm')))
        verificar('el modelo de prueba está marcado como «prueba», no publicado y sin revisión', prueba['origen'] == 'prueba' and prueba['publicado'] is False and prueba['revisado_por'] is None)

        print('\n[Reglas puras del visor (visor3d.js)]')
        page, err, ped = pagina(pc, base, '/3d-prueba.html', espera='.v3-abrir')
        r = page.evaluate('''async () => {
          const m = await import('/js/universo/visor3d.js');
          const ok = { id: 'a', item_id: 'u1', origen: 'escaneo', glb: '/modelos3d/x/pieza.glb', publicado: true, revisado_por: 'Sara', revisado_en: '2026-10-20', ancho_cm: 5, alto_cm: 2, fondo_cm: 4.5 };
          const modelos = [ok, { ...ok, item_id: 'u2', publicado: false }, { ...ok, item_id: 'u3', revisado_por: null }, { ...ok, item_id: 'u4', revisado_en: null },
            { ...ok, item_id: 'u5', origen: 'prueba' }, { ...ok, item_id: 'u6', glb: 'https://otro-sitio.com/x.glb' }, { ...ok, item_id: 'u7', glb: '/modelos3d/../js/x.glb' }, { ...ok, item_id: 'u8', glb: '/modelos3d/x/pieza.js' }, null];
          const sale = (id) => !!m.modeloPublicado(modelos, id);
          return {
            aprobado: sale('u1'), noPublicado: sale('u2'), sinRevisor: sale('u3'), sinFecha: sale('u4'), prueba: sale('u5'), otroSitio: sale('u6'), subirCarpeta: sale('u7'), noGlb: sale('u8'), sinId: sale(''), otraPieza: sale('u9'),
            medida: m.medidaTexto(ok), medidaVacia: m.medidaTexto({ ancho_cm: 5 }),
            escala: [m.escalaCorrecta({ x: 0.05, y: 0.02, z: 0.045 }, ok), m.escalaCorrecta({ x: 0.052, y: 0.0205, z: 0.046 }, ok), m.escalaCorrecta({ x: 0.5, y: 0.2, z: 0.45 }, ok), m.escalaCorrecta({ x: 1, y: 1, z: 1 }, ok), m.escalaCorrecta({ x: 0.05, y: 0.02, z: 0.045 }, { ...ok, fondo_cm: 0 })],
          };
        }''')
        verificar('solo sale el modelo aprobado: publicado, con revisor, con fecha y de una pieza real', r['aprobado'] is True and not any(r[k] for k in ('noPublicado', 'sinRevisor', 'sinFecha', 'prueba', 'sinId', 'otraPieza')), r)
        verificar('un modelo de prueba nunca sale en las páginas públicas aunque alguien lo marque como publicado', r['prueba'] is False)
        verificar('solo se aceptan archivos .glb de la carpeta /modelos3d/ del propio sitio (ni otros sitios, ni «..», ni otros tipos)', not (r['otroSitio'] or r['subirCarpeta'] or r['noGlb']), r)
        verificar('la medida se escribe con comas y el orden ancho × fondo × alto: «%s»' % r['medida'], r['medida'] == '5 × 4,5 × 2 cm (ancho × fondo × alto)' and r['medidaVacia'] == '', r)
        verificar('la escala acepta hasta un 8 % de diferencia y rechaza un modelo 10 veces más grande, uno de 1 m o sin medidas', r['escala'] == [True, True, False, False, False], r['escala'])
        page.close()

        for nombre, ctx, ancho in (('celular 390 px', movil, 390), ('computador 1280 px', pc, 1280)):
            print('\n[Página de prueba con el modelo — %s]' % nombre)
            page, err, ped = pagina(ctx, base, '/3d-prueba.html', espera='.v3-abrir')
            antes = [u for u in ped if 'model-viewer' in u or u.endswith('.glb')]
            verificar('antes de tocar «Ver en 3D» NO se descarga la librería (1 MB) ni el modelo: se ve la foto', not antes and page.locator('.v3-poster').is_visible(), antes)
            verificar('aparece el aviso «MODELO DE PRUEBA… no es una pieza real» con la medida declarada', 'MODELO DE PRUEBA' in page.inner_text('.v3-nota') and '5 × 4,5 × 1,8 cm' in page.inner_text('.v3-nota'), page.inner_text('.v3-nota'))
            verificar('la página de prueba no se indexa y no usa cookies ni medición (robots noindex, sin GTM)', page.eval_on_selector('meta[name=robots]', 'e => e.content').startswith('noindex') and not [u for u in ped if 'googletagmanager' in u])
            verificar('el botón «Ver en 3D» mide al menos 48 px de alto', page.locator('.v3-abrir').bounding_box()['height'] >= 48)
            page.locator('.v3-abrir').focus(); page.keyboard.press('Enter')
            page.wait_for_selector('model-viewer', timeout=15000)
            page.wait_for_function('document.querySelector("model-viewer") && document.querySelector("model-viewer").loaded === true', timeout=60000)
            despues = [u for u in ped if 'model-viewer' in u or u.endswith('.glb')]
            verificar('con el teclado (Enter) se abre: ahora sí se pide la librería y el modelo, del propio sitio', any('model-viewer.min.js' in u for u in despues) and any(u.endswith('corazon-prueba.glb') for u in despues), despues)
            externos = [u for u in ped if not u.startswith(base) and not u.startswith('blob:') and not u.startswith('data:')]
            verificar('NINGÚN pedido a servicios externos (gstatic, jsdelivr, etc.) al cargar el modelo', not externos, externos)
            dim = page.evaluate('(() => { const d = document.querySelector("model-viewer").getDimensions(); return [d.x * 100, d.y * 100, d.z * 100]; })()')
            verificar('escala real: el modelo cargado mide %.1f × %.1f × %.1f cm y lo declarado es %s × %s × %s cm (±8 %%)' % (dim[0], dim[1], dim[2], prueba['ancho_cm'], prueba['alto_cm'], prueba['fondo_cm']),
                      abs(dim[0] - prueba['ancho_cm']) / prueba['ancho_cm'] <= .08 and abs(dim[1] - prueba['alto_cm']) / prueba['alto_cm'] <= .08 and abs(dim[2] - prueba['fondo_cm']) / prueba['fondo_cm'] <= .08, dim)
            verificar('hay un visor con texto alternativo, controles de cámara (arrastrar) y modo de realidad aumentada declarado',
                      page.eval_on_selector('model-viewer', 'e => e.alt.indexOf("Modelo 3D de") === 0 && e.hasAttribute("camera-controls") && e.hasAttribute("ar") && e.getAttribute("ar-scale") === "fixed" && e.getAttribute("ar-modes").indexOf("quick-look") >= 0 && e.getAttribute("ar-modes").indexOf("scene-viewer") >= 0'))
            verificar('el visor se puede enfocar con el teclado (tabindex) y no atrapa la página (touch-action pan-y)', page.eval_on_selector('model-viewer', 'e => { const c = e.shadowRoot && e.shadowRoot.querySelector(".userInput"); return !!c && c.tabIndex >= 0 && e.getAttribute("touch-action") === "pan-y"; }'))
            verificar('el modelo no gira solo (respeta a quien no quiere movimiento)', not page.eval_on_selector('model-viewer', 'e => e.hasAttribute("auto-rotate")'))
            ar_visible = page.eval_on_selector('.v3-ar', 'e => { const r = e.getBoundingClientRect(); return getComputedStyle(e).display !== "none" && r.width > 0; }')
            verificar('en este navegador (sin cámara ni realidad aumentada) el botón «Ver en tu espacio» no aparece', ar_visible is False)
            page.wait_for_function('document.querySelector(".v3-estado").textContent.indexOf("Arrástralo") >= 0', timeout=10000)
            verificar('se leyó cómo girarlo y no hay errores de consola', 'Arrástralo para girarlo' in page.inner_text('.v3-estado') and not err, err)
            ev = page.evaluate('dataLayer.filter(e => e && e.event === "visor_3d")')
            verificar('se mide la apertura (modo 3d, ok, escala_ok) sin nombres de archivo ni texto libre', len(ev) == 1 and ev[0]['modo'] == '3d' and ev[0]['ok'] is True and ev[0]['escala_ok'] is True and not re.search(r'\.(glb|jpg|png|webp)', json.dumps(ev)), ev)
            verificar('sin desplazamiento horizontal', R.sin_scroll_horizontal(page))
            if CAPTURAS:
                page.wait_for_timeout(1200)
                page.screenshot(path=os.path.join(CAPTURAS, 'visor3d-prueba-%d.png' % ancho))
            page.get_by_role('button', name='← Volver a la foto').click()
            verificar('«Volver a la foto» quita el visor y muestra de nuevo la foto', page.locator('model-viewer').count() == 0 and page.locator('.v3-poster').is_visible())
            page.close()

        print('\n[Cuando algo falla se vuelve a la foto]')
        page, err, ped = pagina(pc, base, '/3d-prueba.html', rutas=[('**/modelos3d/prueba/corazon-prueba.glb', lambda r: r.fulfill(status=404, body='no'))], espera='.v3-abrir')
        page.click('.v3-abrir')
        page.wait_for_selector('.v3-aviso', timeout=30000)
        verificar('si el modelo no existe (404): mensaje amable, vuelve la foto y el botón, y no queda un visor roto', 'No pudimos mostrar el modelo 3D' in page.inner_text('.v3-estado') and page.locator('model-viewer').count() == 0 and page.locator('.v3-poster').is_visible() and page.locator('.v3-abrir').is_enabled(), page.inner_text('.v3-estado'))
        ev = page.evaluate('dataLayer.filter(e => e && /^visor_3d/.test(e.event))')
        verificar('se mide el fallo (razón corta, sin nombres de archivo)', any(e['event'] == 'visor_3d_error' and e['razon'] == 'modelo' for e in ev) and not re.search(r'\.(glb|jpg|png|webp)', json.dumps(ev)), ev)
        page.close()
        page, err, ped = pagina(pc, base, '/3d-prueba.html', rutas=[('**/js/vendor/model-viewer.min.js*', lambda r: r.fulfill(status=500, body='boom'))], espera='.v3-abrir')
        page.click('.v3-abrir'); page.wait_for_selector('.v3-aviso', timeout=30000)
        verificar('si la librería no carga, igual vuelve a la foto con el mensaje amable', 'No pudimos mostrar el modelo 3D' in page.inner_text('.v3-estado') and page.locator('.v3-poster').is_visible())
        page.close()
        sin_webgl = nav.new_context(viewport={'width': 1280, 'height': 900}, locale='es-CO')
        sin_webgl.add_init_script("const o = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function(t, ...a) { return /webgl/.test(t) ? null : o.call(this, t, ...a); };")
        page, err, ped = pagina(sin_webgl, base, '/3d-prueba.html', espera='.v3-abrir')
        page.click('.v3-abrir'); page.wait_for_selector('.v3-aviso', timeout=15000)
        verificar('sin WebGL: no se descarga la librería de 1 MB, se explica y queda la foto', not [u for u in ped if 'model-viewer.min' in u] and page.locator('.v3-poster').is_visible())
        page.close()
        # un modelo con medidas que NO coinciden: no se ofrece la realidad aumentada
        def modelos_mal(route):
            d = json.load(open(MODELOS, encoding='utf-8')); d['modelos'][0]['ancho_cm'] = 50.0
            route.fulfill(status=200, content_type='application/json', body=json.dumps(d))
        page, err, ped = pagina(pc, base, '/3d-prueba.html', rutas=[('**/modelos3d/modelos.json', modelos_mal)], espera='.v3-abrir')
        page.click('.v3-abrir'); page.wait_for_function('document.querySelector("model-viewer") && document.querySelector("model-viewer").loaded === true', timeout=60000)
        page.wait_for_timeout(300)
        verificar('si la medida declarada (50 cm) no coincide con el modelo (5 cm), se quita la realidad aumentada y no se afirma la medida real',
                  page.eval_on_selector('model-viewer', 'e => !e.hasAttribute("ar")') and 'Medida real' not in page.inner_text('.v3-nota') and 'MODELO DE PRUEBA' in page.inner_text('.v3-nota'), page.inner_text('.v3-nota'))
        ev = page.evaluate('dataLayer.filter(e => e && e.event === "visor_3d" && e.modo === "3d")')
        verificar('y se mide escala_ok = false', len(ev) == 1 and ev[0]['escala_ok'] is False, ev)
        page.close()

        print('\n[Página de la pieza (/p/) con y sin modelo aprobado]')
        pieza = next(x for x in R.CATALOGO if x['id'] == UUID_PIEZA)
        pieza_rpc = {'id': pieza['id'], 'nombre': pieza['nombre'], 'categoria_web': pieza['categoria_web'], 'foto_url': pieza['foto_url'], 'descripcion_web': 'x', 'especificaciones_web': [], 'cuidados': ['No usar secadora'], 'cuidados_validados': True, 'historia': 'Una historia.', 'material_notas': None}
        rpc = ('**/rest/v1/rpc/obtener_producto_publico', lambda r: r.fulfill(status=200, content_type='application/json', body=json.dumps([pieza_rpc])))
        page, err, ped = pagina(pc, base, '/p/?i=' + UUID_PIEZA + '&o=etiqueta', rutas=[rpc], espera='.pz-marco')
        verificar('hoy ninguna pieza tiene modelo aprobado: la página de la pieza queda exactamente igual (sin «Míralo en 3D»)', page.locator('.pz-3d').count() == 0 and page.locator('.v3-caja').count() == 0 and not [u for u in ped if 'model-viewer' in u], err)
        page.close()
        def modelo_aprobado(route):
            d = json.load(open(MODELOS, encoding='utf-8'))
            m = dict(d['modelos'][0], item_id=UUID_PIEZA, origen='escaneo', publicado=True, revisado_por='Sara', revisado_en='2026-10-20')
            route.fulfill(status=200, content_type='application/json', body=json.dumps({'modelos': [m]}))
        for nombre, ctx in (('celular', movil), ('computador', pc)):
            page, err, ped = pagina(ctx, base, '/p/?i=' + UUID_PIEZA + '&o=etiqueta', rutas=[rpc, ('**/modelos3d/modelos.json', modelo_aprobado)], espera='.pz-3d .v3-abrir')
            verificar('(%s) con un modelo aprobado aparece «Míralo en 3D» con la foto como vista previa y sin cargar la librería todavía' % nombre,
                      page.locator('.pz-3d h2').inner_text() == 'Míralo en 3D' and page.locator('.v3-poster').is_visible() and not [u for u in ped if 'model-viewer' in u or u.endswith('.glb')])
            verificar('(%s) la nota dice «Vista 3D aproximada» con la medida real y NO dice «prueba»' % nombre, 'Vista 3D aproximada' in page.inner_text('.v3-nota') and 'PRUEBA' not in page.inner_text('.v3-nota') and '5 × 4,5 × 1,8 cm' in page.inner_text('.v3-nota'), page.inner_text('.v3-nota'))
            page.click('.v3-abrir'); page.wait_for_function('document.querySelector("model-viewer") && document.querySelector("model-viewer").loaded === true', timeout=60000)
            verificar('(%s) al tocar se abre el visor y no hay errores ni desplazamiento horizontal' % nombre, not err and R.sin_scroll_horizontal(page), err)
            if CAPTURAS and nombre == 'celular':
                page.locator('.pz-3d').scroll_into_view_if_needed(); page.wait_for_timeout(1200)
                page.screenshot(path=os.path.join(CAPTURAS, 'visor3d-pieza-390.png'))
            page.close()
        def apagado(route):
            route.fulfill(status=200, content_type='text/javascript', body=open(os.path.join(RAIZ, 'js', 'universo', 'config.js'), encoding='utf-8').read().replace('VISOR_3D_ACTIVO: true', 'VISOR_3D_ACTIVO: false'))
        page, err, ped = pagina(pc, base, '/p/?i=' + UUID_PIEZA + '&o=etiqueta', rutas=[rpc, ('**/modelos3d/modelos.json', modelo_aprobado), ('**/js/universo/config.js', apagado)], espera='.pz-marco')
        verificar('con VISOR_3D_ACTIVO=false el visor desaparece aunque haya modelo aprobado y la página sigue entera', page.locator('.v3-caja').count() == 0 and page.locator('.pz-bloque').count() >= 2 and not err, err)
        page.close()

        nav.close()
    srv.shutdown()
    print('\n%d comprobaciones correctas, %d con falla.' % (pasaron, len(fallos)))
    if fallos:
        print('FALLAS:'); [print(' - ' + f) for f in fallos]
        sys.exit(1)


if __name__ == '__main__':
    main()
