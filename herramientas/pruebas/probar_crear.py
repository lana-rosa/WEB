#!/usr/bin/env python3
"""Pruebas de «Rosina te ayuda a crear» (configurador de personalizados, Etapa 2 del universo de Rosina).

Usa el catálogo real guardado en fixtures/ (respuesta de obtener_regalos_web), levanta un servidor local y simula Supabase con
page.route: no toca producción ni escribe datos. Comprueba el configurador, el paso de la ficha a Personaliza, lo que recibe
la función crear_solicitud_personalizada y la privacidad (nada de datos personales ni de red extra).

Uso:  python3 herramientas/pruebas/probar_crear.py [carpeta_capturas]
"""
import json, os, re, sys, time
from urllib.parse import parse_qs, urlparse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import probar_regalar as pr  # reutiliza servidor, hermetismo de red y ayudantes
from playwright.sync_api import sync_playwright

verificar = pr.verificar
CAPTURAS = sys.argv[1] if len(sys.argv) > 1 else None
CATALOGO = pr.REVISADO
BASES = [p for p in pr.CATALOGO if p['personalizable_base']]
ESPERA_HUB = '#crear-raiz .uc-marco'
ESPERA_PERS = '#form-personalizado'


def tienda_web():
    """Lo que devuelve obtener_tienda_web para Personaliza: solo los tres productos base (id, nombre, precio, foto)."""
    return [{'id': p['id'], 'nombre': p['nombre'], 'precio': p['precio'], 'foto_url': p['foto_url'], 'categoria_web': 'Amigurumis'} for p in BASES]


def rutas_personaliza(capturado):
    def tienda(route):
        route.fulfill(status=200, content_type='application/json', body=json.dumps(tienda_web()))

    def solicitud(route):
        capturado.append(route.request.post_data_json)
        route.fulfill(status=200, content_type='application/json', body='"OPP-PRUEBA-1"')
    return [('**/rest/v1/rpc/obtener_tienda_web', tienda), ('**/rest/v1/rpc/crear_solicitud_personalizada', solicitud)]


def hub(ctx, base, **kw):
    return pr.abrir(ctx, base, kw.pop('catalogo', CATALOGO), ruta='/universo-rosina.html', espera=ESPERA_HUB, **kw)


def elegir(page, id_, valor):
    page.select_option('#' + id_, valor)


def llenar_completo(page):
    elegir(page, 'uc-idea', 'mascota'); elegir(page, 'uc-tamano', '15 cm')
    page.check('.uc-detalle input[value="gafas"]'); page.fill('.uc-detalle:has(input[value="gafas"]) .uc-detalle-texto', 'redondas y negras')
    page.check('.uc-detalle input[value="accesorios"]'); page.fill('.uc-detalle:has(input[value="accesorios"]) .uc-detalle-texto', 'un collar rojo')
    page.fill('#uc-texto', 'Mi perrita Luna con las orejas caídas.'); page.fill('#uc-colores', 'pelaje café con blanco')
    elegir(page, 'uc-ocasion', 'cumpleanos'); page.fill('#uc-fecha', '2099-11-20')


def main():
    srv, base = pr.servidor()
    with sync_playwright() as p:
        nav = p.chromium.launch(executable_path=pr.CHROMIUM) if pr.CHROMIUM else p.chromium.launch()
        movil = nav.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, locale='es-CO')
        pc = nav.new_context(viewport={'width': 1280, 'height': 900}, locale='es-CO')

        print('\n[Reglas puras: armarFicha() y el vocabulario]')
        page, err = hub(pc, base)
        r = page.evaluate("""async () => {
          const m = await import('/js/universo/crear.js'); const c = await import('/js/universo/config.js');
          const precios = {'13 cm': 85000, '15 cm': 95000, '20 cm': 115000};
          const completo = m.armarFicha({idea:'mascota', tamano:'15 cm', detalles:{gafas:'redondas', accesorios:''}, texto:'Mi perrita Luna', colores:'café', ocasion:'cumpleanos', fecha:'2099-11-20'}, precios);
          return {
            vacio: m.armarFicha({}, precios).falta,
            tamanoMalo: m.armarFicha({idea:'mascota', tamano:'12 cm', texto:'x'}, precios).falta,
            llavero: m.armarFicha({idea:'detalle', tamano:'5 cm', texto:'mi gato'}, precios),
            diez: m.armarFicha({idea:'persona', tamano:'10 cm', texto:'x'}, precios).filas[1][1],
            completo, sinOcasion: m.armarFicha({idea:'persona', tamano:'13 cm', texto:'x', ocasion:'sin_ocasion'}, precios).mensaje,
            wa: m.textoWhatsApp(completo),
            ocasiones: c.OCASIONES_CREAR.map(x => x[1]).join('|'), ideas: c.IDEAS_CREAR.map(x => [x[0], x[2]]), tamanos: c.TAMANOS_CREAR,
          };
        }""")
        verificar('sin nada elegido faltan la idea, el tamaño y el texto', r['vacio'] == ['idea', 'tamano', 'texto'], r['vacio'])
        verificar('un tamaño que no existe para ese tipo (12 cm de amigurumi) se rechaza', r['tamanoMalo'] == ['tamano'], r['tamanoMalo'])
        verificar('el llavero es válido con 5 cm y no muestra precio inventado', r['llavero']['falta'] == [] and r['llavero']['tipo'] == 'Llavero' and r['llavero']['base'] is None and 'te lo cotizamos' in r['llavero']['filas'][1][1], r['llavero'])
        verificar('10 cm no tiene precio base: «te lo cotizamos»', 'te lo cotizamos' in r['diez'], r['diez'])
        c = r['completo']
        verificar('la ficha conserva todas las opciones (idea, tamaño, detalles, colores, idea, ocasión y fecha dd/mm/aaaa)', all(t in c['descripcion'] for t in ('una mascota', 'Gafas (redondas)', 'Accesorios', 'Colores importantes: café', 'Mi idea: Mi perrita Luna')) and 'Ocasión: Cumpleaños.' in c['mensaje'] and '20/11/2099' in c['mensaje'] and c['tamano'] == '15 cm' and c['base'] == 95000, c)
        verificar('sin ocasión no se escribe la línea de ocasión', 'Ocasión' not in r['sinOcasion'])
        verificar('el texto de WhatsApp lleva tipo, tamaño y la idea, sin la marca interna', '[Amigurumi — 15 cm]' in r['wa'] and 'Mi perrita Luna' in r['wa'] and 'Ficha armada' not in r['wa'])
        verificar('las ocasiones del configurador respetan los valores de la marca (sin Navidad, Halloween ni santos)', not re.search(r'navidad|halloween|valent|santo|santa', r['ocasiones'], re.I), r['ocasiones'])
        personaliza = open(os.path.join(pr.RAIZ, 'personaliza.html'), encoding='utf-8').read()
        tam = {k: re.findall(r"'(\d+ cm)'", v) for k, v in re.findall(r"'(Amigurumi|Llavero)': \[([^\]]*)\]", personaliza)}
        verificar('los tamaños del configurador son los mismos de Personaliza (tamanosPorTipo)', r['tamanos'] == tam, (r['tamanos'], tam))
        ideas_pers = dict(re.findall(r"(\w+): \['(Amigurumi|Llavero)'", personaliza))
        verificar('las ideas del configurador existen en Personaliza con el mismo tipo de producto', all(ideas_pers.get(i) == t for i, t in r['ideas']), (r['ideas'], ideas_pers))
        page.close()

        for nombre, ctx in (('celular 390 px', movil), ('computador 1280 px', pc)):
            print('\n[Configurador en el universo — %s]' % nombre)
            tag = 'm' if ctx is movil else 'd'
            page, err = hub(ctx, base)
            verificar('hay 5 pasos, un resumen «Tu ficha» y los botones Continuar y WhatsApp', page.locator('.uc-paso').count() == 5 and page.locator('.uc-ficha').count() == 1 and page.locator('.uc-continuar').count() == 1 and page.locator('.uc-whatsapp').count() == 1)
            verificar('el tamaño está bloqueado hasta elegir qué tejer', page.locator('#uc-tamano').is_disabled())
            elegir(page, 'uc-idea', 'mascota')
            texto_tam = page.eval_on_selector_all('#uc-tamano option', 'os => os.map(o => o.textContent)')
            verificar('mascota: 10, 13, 15 y 20 cm; los precios base (85.000, 95.000, 115.000) son los del catálogo y 10 cm no lleva precio', texto_tam == ['Elige un tamaño', '10 cm', '13 cm · precio base $85.000', '15 cm · precio base $95.000', '20 cm · precio base $115.000'], texto_tam)
            elegir(page, 'uc-idea', 'detalle')
            verificar('recuerdo pequeño: llavero de 4, 5 y 6 cm, sin precios', page.eval_on_selector_all('#uc-tamano option', 'os => os.map(o => o.textContent)') == ['Elige un tamaño', '4 cm', '5 cm', '6 cm'])
            elegir(page, 'uc-idea', 'mascota'); elegir(page, 'uc-tamano', '15 cm')
            page.check('.uc-detalle input[value="gafas"]')
            verificar('al marcar un detalle aparece su casilla de texto, enfocada y con su pregunta', page.locator('.uc-detalle:has(input[value="gafas"]) .uc-detalle-texto').is_visible() and page.evaluate("document.activeElement.classList.contains('uc-detalle-texto')"))
            page.fill('.uc-detalle:has(input[value="gafas"]) .uc-detalle-texto', 'redondas')
            resumen = page.inner_text('.uc-lista')
            verificar('el resumen se actualiza en vivo (qué, tamaño con precio, detalles)', 'Una mascota' in resumen and '15 cm · precio base $95.000' in resumen and 'Gafas (redondas)' in resumen, resumen)
            page.uncheck('.uc-detalle input[value="gafas"]')
            verificar('al desmarcar el detalle se quita del resumen y de la casilla', 'Gafas' not in page.inner_text('.uc-lista') and not page.locator('.uc-detalle:has(input[value="gafas"]) .uc-detalle-texto').is_visible())
            page.click('.uc-ficha .ur-reiniciar')
            verificar('el botón Continuar tiene el color de la marca (rosa), no el gris del navegador', page.eval_on_selector('.uc-continuar', 'e => getComputedStyle(e).backgroundColor') == 'rgb(224, 30, 121)')
            verificar('«Empezar de nuevo» limpia todo y vuelve a bloquear el tamaño', page.input_value('#uc-idea') == '' and page.locator('#uc-tamano').is_disabled() and 'Aún sin elegir' in page.inner_text('.uc-lista'))
            page.click('.uc-continuar')
            verificar('sin lo obligatorio, Continuar avisa qué falta (rol alert), marca el campo y lleva el foco a la idea', page.is_visible('.uc-error') and 'Elige qué quieres que tejamos' in page.inner_text('.uc-error') and page.get_attribute('.uc-error', 'role') == 'alert' and page.evaluate("document.activeElement.id") == 'uc-idea' and page.get_attribute('#uc-idea', 'aria-invalid') == 'true' and '/personaliza.html' not in page.url)
            elegir(page, 'uc-idea', 'mascota')
            verificar('al corregir el campo se quita la marca de error (aria-invalid) y el aviso', page.get_attribute('#uc-idea', 'aria-invalid') is None and not page.is_visible('.uc-error'))
            page.click('.uc-ficha .ur-reiniciar')
            verificar('accesibilidad: cada campo tiene su etiqueta, los detalles van en fieldset con legend y el resumen es una región en vivo', page.eval_on_selector_all('#crear-raiz select, #crear-raiz textarea, #crear-raiz input[type=date], #uc-colores', 'els => els.every(e => document.querySelector("label[for=" + e.id + "]"))') and page.locator('fieldset.uc-detalles legend').count() == 1 and page.get_attribute('.uc-lista', 'aria-live') == 'polite')
            verificar('todas las listas y botones miden al menos 44 px de alto', page.eval_on_selector_all('#crear-raiz select, #crear-raiz button', 'els => els.every(e => e.getBoundingClientRect().height >= 43.5)'))
            verificar('sin scroll horizontal ni errores de JavaScript', pr.sin_scroll_horizontal(page) and not err, err)
            if CAPTURAS:
                llenar_completo(page)
                page.evaluate("document.querySelector('#crear').scrollIntoView()")
                page.wait_for_timeout(500)
                page.screenshot(path=os.path.join(CAPTURAS, 'crear-%s-1-ficha.png' % tag), full_page=False)
                page.evaluate("window.scrollBy(0, 560)")
                page.wait_for_timeout(300)
                page.screenshot(path=os.path.join(CAPTURAS, 'crear-%s-2-resumen.png' % tag), full_page=False)
            page.close()

        print('\n[Recorrido completo: configurador → Personaliza → solicitud]')
        capturado = []
        page, err = hub(pc, base, rutas=rutas_personaliza(capturado))
        eventos_red = []
        page.on('request', lambda rq: eventos_red.append(rq.url) if 'rest/v1' in rq.url else None)
        llenar_completo(page)
        solo_catalogo = [u for u in eventos_red if 'obtener_regalos_web' not in u]
        with page.expect_navigation():
            page.click('.uc-continuar')
        page.wait_for_selector(ESPERA_PERS, timeout=8000)
        q = urlparse(page.url)
        verificar('Continuar lleva a /personaliza.html?desde=crear#pide-el-tuyo', q.path == '/personaliza.html' and parse_qs(q.query) == {'desde': ['crear']} and q.fragment == 'pide-el-tuyo', page.url)
        page.wait_for_function("document.getElementById('banner-personalizado') && !document.getElementById('banner-personalizado').hidden", timeout=8000)
        verificar('Personaliza llega con el tipo y el tamaño elegidos', page.input_value('#tipo-producto') == 'Amigurumi' and page.input_value('#tamano') == '15 cm')
        desc = page.input_value('#descripcion'); msj = page.input_value('#mensaje')
        verificar('la descripción llega con la idea, los detalles y los colores', all(t in desc for t in ('Quiero tejer: una mascota.', 'Gafas (redondas y negras)', 'Accesorios (un collar rojo)', 'Colores importantes: pelaje café con blanco.', 'Mi idea: Mi perrita Luna con las orejas caídas.')), desc)
        verificar('el mensaje llega con la ocasión y la fecha', 'Ocasión: Cumpleaños.' in msj and 'Fecha en la que lo necesito: 20/11/2099' in msj, msj)
        verificar('el aviso de la ficha se ve, resume y ofrece «Cambiar mi ficha» y «Descartar la ficha»', page.is_visible('#banner-ficha') and 'Una mascota' in page.inner_text('#banner-ficha') and page.locator('#banner-ficha a[href="/universo-rosina.html#crear"]').count() == 1 and page.locator('#banner-ficha button').count() == 1)
        verificar('con 15 cm aparece el precio base del producto real ($95.000) y el pago en línea sigue siendo el de siempre', '$95.000' in page.inner_text('#banner-personalizado') and 'Amigurumi personalizado 15 cm' in page.inner_text('#banner-personalizado'))
        if CAPTURAS:
            page.evaluate("document.querySelector('#pide-el-tuyo').scrollIntoView()")
            page.wait_for_timeout(500)
            page.screenshot(path=os.path.join(CAPTURAS, 'crear-d-3-personaliza.png'), full_page=False)
        page.fill('#nombre', 'Clienta de prueba'); page.fill('#telefono', '3001234567'); page.check('#acepto-datos')
        page.click('#boton-enviar')
        page.wait_for_selector('#mensaje-estado.exito', timeout=8000)
        cuerpo = capturado[0] if capturado else {}
        verificar('la función crear_solicitud_personalizada recibe la ficha completa (tipo y tamaño, detalles, colores, idea, ocasión y fecha)', cuerpo.get('p_descripcion', '').startswith('[Amigurumi — 15 cm] Quiero tejer: una mascota.') and 'Gafas (redondas y negras)' in cuerpo.get('p_descripcion', '') and 'Mi idea: Mi perrita Luna' in cuerpo.get('p_descripcion', '') and 'Ocasión: Cumpleaños.' in cuerpo.get('p_mensaje', '') and '20/11/2099' in cuerpo.get('p_mensaje', ''), cuerpo)
        verificar('los textos enviados caben en los límites de la función (3.000 caracteres)', len(cuerpo.get('p_descripcion', '')) < 3000 and len(cuerpo.get('p_mensaje', '')) < 3000)
        verificar('tras enviar, la ficha se borra del dispositivo y el aviso desaparece', page.evaluate("localStorage.getItem('lrFichaCrear')") is None and not page.is_visible('#banner-ficha'))
        verificar('el radicado queda en pantalla y se ofrece el pago del producto de 15 cm', 'OPP-PRUEBA-1' in page.inner_text('#mensaje-estado') and page.is_visible('#pago-personalizado'))
        verificar('sin errores de JavaScript en todo el recorrido', not err, err)
        verificar('mientras se arma la ficha, el configurador no envía nada a ningún servidor (solo pide el catálogo público)', not solo_catalogo, solo_catalogo)
        page.close()

        print('\n[Ficha recordada: volver, vencer, manipular]')
        capturado = []
        page, err = hub(pc, base, rutas=rutas_personaliza(capturado))
        llenar_completo(page)
        with page.expect_navigation():
            page.click('.uc-continuar')
        page.wait_for_selector(ESPERA_PERS)
        guardado = page.evaluate("JSON.parse(localStorage.getItem('lrFichaCrear'))")
        verificar('la ficha guardada no tiene datos personales (nombre, teléfono, correo, ciudad, fotos)', not (set(guardado) | set(guardado['estado'])) & {'nombre', 'telefono', 'correo', 'ciudad', 'fotos'} and 'Clienta' not in json.dumps(guardado), list(guardado))
        with page.expect_navigation():
            page.click('#banner-ficha a')
        page.wait_for_selector(ESPERA_HUB)
        verificar('«Cambiar mi ficha» vuelve al configurador con todo lo elegido ya puesto', page.input_value('#uc-idea') == 'mascota' and page.input_value('#uc-tamano') == '15 cm' and page.input_value('.uc-detalle:has(input[value="gafas"]) .uc-detalle-texto') == 'redondas y negras' and page.input_value('#uc-texto').startswith('Mi perrita Luna') and page.input_value('#uc-ocasion') == 'cumpleanos' and page.input_value('#uc-fecha') == '2099-11-20')
        page.close()
        ahora = int(time.time() * 1000)
        for caso, crudo in (
            ('vencida (más de 24 h)', json.dumps({'tipo': 'Amigurumi', 'tamano': '15 cm', 'descripcion': 'x', 'mensaje': 'y', 'resumen': [], 't': 1})),
            ('con un tipo inventado', json.dumps({'tipo': '<img src=x onerror=alert(1)>', 'tamano': '15 cm', 'descripcion': 'x', 'mensaje': 'y', 'resumen': [], 't': ahora})),
            ('con JSON dañado', '{roto'),
        ):
            page, err = pr.abrir(pc, base, CATALOGO, ruta='/personaliza.html', espera=ESPERA_PERS, rutas=rutas_personaliza([]))
            page.evaluate("(v) => localStorage.setItem('lrFichaCrear', v)", crudo)
            page.goto(base + '/personaliza.html?desde=crear'); page.wait_for_selector(ESPERA_PERS)
            verificar('ficha %s: Personaliza la ignora (sin aviso, sin textos precargados, sin errores)' % caso, not page.is_visible('#banner-ficha') and page.input_value('#descripcion') == '' and not err, err)
            page.close()
        page, err = pr.abrir(pc, base, CATALOGO, ruta='/personaliza.html?desde=crear', espera=ESPERA_PERS, rutas=rutas_personaliza([]))
        enorme = 'A' * 20000
        page.evaluate("(t) => localStorage.setItem('lrFichaCrear', JSON.stringify({tipo:'Amigurumi', tamano:'13 cm', descripcion:t, mensaje:t, resumen:['<b>x</b>'], t:Date.now()}))", enorme)
        page.goto(base + '/personaliza.html?desde=crear'); page.wait_for_selector(ESPERA_PERS)
        verificar('una ficha manipulada con textos enormes se recorta (máx. 2.800) y el HTML se muestra como texto, no se ejecuta', len(page.input_value('#descripcion')) <= 2800 and page.locator('#banner-ficha b').count() == 0 and '<b>x</b>' in page.inner_text('#banner-ficha'))
        page.click('#banner-ficha button')
        verificar('«Descartar la ficha» la borra, oculta el aviso y vacía los campos', page.evaluate("localStorage.getItem('lrFichaCrear')") is None and not page.is_visible('#banner-ficha') and page.input_value('#descripcion') == '')
        page.close()

        print('\n[WhatsApp, medición, fallos e interruptor]')
        page, err = hub(pc, base)
        llenar_completo(page)
        page.evaluate("window.open = (u) => { window.__ultimo = u; return null; }")
        page.click('.uc-whatsapp')
        popup_url = page.evaluate("window.__ultimo || ''")
        verificar('WhatsApp abre wa.me/573205072801 con la ficha en el texto', popup_url.startswith('https://wa.me/573205072801?text=') and 'Mi%20perrita%20Luna' in popup_url and '15%20cm' in popup_url, popup_url)
        dl = page.evaluate("JSON.parse(JSON.stringify(window.dataLayer || []))")
        nombres = [x.get('event') for x in dl]
        verificar('se registran crear_inicio, crear_paso y crear_whatsapp', 'crear_inicio' in nombres and 'crear_paso' in nombres and 'crear_whatsapp' in nombres, nombres)
        verificar('los eventos de medición no llevan textos escritos por la persona (idea, colores, detalles)', not re.search(r'Luna|collar|redondas|pelaje', json.dumps(dl)), json.dumps(dl)[:300])
        page.close()
        page, err = hub(pc, base, estado=500)
        elegir(page, 'uc-idea', 'mascota')
        tams = page.eval_on_selector_all('#uc-tamano option', 'os => os.map(o => o.textContent)')
        verificar('si el catálogo falla, el configurador funciona igual y los tamaños dicen «te lo cotizamos» sin precio', tams == ['Elige un tamaño', '10 cm', '13 cm', '15 cm', '20 cm'] and not err, (tams, err))
        page.close()
        cfg = open(os.path.join(pr.RAIZ, 'js', 'universo', 'config.js'), encoding='utf-8').read().replace('CREAR_ACTIVO: true', 'CREAR_ACTIVO: false')
        page, err = pr.abrir(pc, base, CATALOGO, ruta='/universo-rosina.html', config=cfg)
        page.wait_for_timeout(500)
        verificar('con CREAR_ACTIVO=false la sección se oculta y la tarjeta «crear» vuelve a llevar a /personaliza.html', not page.is_visible('#crear') and page.get_attribute('.recorrido[data-recorrido="crear"]', 'href') == '/personaliza.html' and page.locator('.ur-marco').count() == 1 and not err, err)
        page.close()
        page, err = hub(pc, base)
        verificar('la tarjeta «Rosina te ayuda a crear» del universo lleva al configurador (#crear)', page.get_attribute('.recorrido[data-recorrido="crear"]', 'href') == '#crear')
        page.close()
        nav.close()
    srv.shutdown()
    print('\n%d comprobaciones correctas, %d con falla.' % (pr.pasaron, len(pr.fallos)))
    if pr.fallos:
        print('FALLAS:\n - ' + '\n - '.join(pr.fallos))
        sys.exit(1)


if __name__ == '__main__':
    main()
