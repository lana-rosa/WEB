#!/usr/bin/env python3
"""Pruebas de «Personaliza el tuyo» con las dos formas de pedir (Etapa 2 del universo de Rosina):
«Rosina te ayuda a crear» (asistente guiado) y «Diligencia el formulario» (directo), en la misma página.

Usa el catálogo real guardado en fixtures/, levanta un servidor local y simula Supabase con page.route: no toca producción ni
escribe datos. Comprueba que no se pregunte nada dos veces, lo que recibe crear_solicitud_personalizada en cada modo, los enlaces
que ya existían (tienda, ideas del inicio), el interruptor, el respaldo si el asistente no carga y la privacidad.

Uso:  python3 herramientas/pruebas/probar_crear.py [carpeta_capturas]
"""
import json, os, re, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import probar_regalar as pr  # reutiliza servidor, hermetismo de red y ayudantes
from playwright.sync_api import sync_playwright

verificar = pr.verificar
CAPTURAS = sys.argv[1] if len(sys.argv) > 1 else None
CATALOGO = pr.REVISADO
BASES = [p for p in pr.CATALOGO if p['personalizable_base']]
ESPERA = '#form-personalizado'
RUTA = '/personaliza.html'
PERSONALIZA = open(os.path.join(pr.RAIZ, 'personaliza.html'), encoding='utf-8').read()
CONFIG_JS = open(os.path.join(pr.RAIZ, 'js', 'universo', 'config.js'), encoding='utf-8').read()
COMPARTIDAS = {'fotos de referencia', 'tu nombre', 'teléfono / whatsapp', 'correo', 'ciudad de envío'}


def rutas_personaliza(capturado, extra=()):
    def tienda(route):
        route.fulfill(status=200, content_type='application/json', body=json.dumps([{'id': p['id'], 'nombre': p['nombre'], 'precio': p['precio'], 'foto_url': p['foto_url'], 'categoria_web': 'Amigurumis'} for p in BASES]))

    def solicitud(route):
        capturado.append(route.request.post_data_json)
        route.fulfill(status=200, content_type='application/json', body='"OPP-PRUEBA-1"')
    return [('**/rest/v1/rpc/obtener_tienda_web', tienda), ('**/rest/v1/rpc/crear_solicitud_personalizada', solicitud)] + list(extra)


def abrir(ctx, base, ruta=RUTA, guia=True, **kw):
    capturado = []
    page, err = pr.abrir(ctx, base, CATALOGO, ruta=ruta, espera=ESPERA, rutas=rutas_personaliza(capturado, kw.pop('extra', ())), **kw)
    if guia:
        page.wait_for_selector('#guia-raiz .uc-marco', state='attached', timeout=8000)
    return page, err, capturado


def elegir(page, id_, valor):
    page.select_option('#' + id_, valor)


def llenar_guia(page):
    elegir(page, 'uc-idea', 'mascota'); elegir(page, 'uc-tamano', '15 cm')
    page.check('.uc-detalle input[value="gafas"]'); page.fill('.uc-detalle:has(input[value="gafas"]) .uc-detalle-texto', 'redondas y negras')
    page.check('.uc-detalle input[value="accesorios"]'); page.fill('.uc-detalle:has(input[value="accesorios"]) .uc-detalle-texto', 'un collar rojo')
    page.fill('#uc-texto', 'Mi perrita Luna con las orejas caídas.'); page.fill('#uc-colores', 'pelaje café con blanco')
    elegir(page, 'uc-ocasion', 'cumpleanos'); page.fill('#uc-fecha', '2099-11-20'); page.fill('#uc-tarjeta', 'Feliz cumpleaños, mamá')


def llenar_contacto(page):
    page.fill('#nombre', 'Clienta de prueba'); page.fill('#telefono', '3001234567'); page.check('#acepto-datos')


def etiquetas_visibles(page):
    """Texto de cada etiqueta de campo que se ve en pantalla (sin asteriscos ni «(opcional)»), para detectar preguntas repetidas."""
    return page.evaluate("""() => [...document.querySelectorAll('#form-personalizado label')].filter(l => l.offsetParent !== null && !l.classList.contains('modo') && !l.classList.contains('uc-check') && !l.classList.contains('acepto-p') && !l.classList.contains('zona-foto'))
      .map(l => l.textContent.replace(/\\*|\\(opcional\\)/g, '').replace(/\\s+/g, ' ').trim().toLowerCase())""")


def repetidas(lista):
    return sorted({e for e in lista if lista.count(e) > 1})


def main():
    srv, base = pr.servidor()
    with sync_playwright() as p:
        nav = p.chromium.launch(executable_path=pr.CHROMIUM) if pr.CHROMIUM else p.chromium.launch()
        movil = nav.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, locale='es-CO')
        pc = nav.new_context(viewport={'width': 1280, 'height': 900}, locale='es-CO')

        print('\n[Reglas puras: armarFicha() y el vocabulario]')
        page, err, _ = abrir(pc, base)
        r = page.evaluate("""async () => {
          const m = await import('/js/universo/crear.js'); const c = await import('/js/universo/config.js');
          const precios = {'13 cm': 85000, '15 cm': 95000, '20 cm': 115000};
          const completo = m.armarFicha({idea:'mascota', tamano:'15 cm', detalles:{gafas:'redondas', accesorios:''}, texto:'Mi perrita Luna', colores:'café', ocasion:'cumpleanos', fecha:'2099-11-20', tarjeta:'Feliz cumpleaños'}, precios);
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
        verificar('la ficha conserva todo: idea, tamaño, detalles, colores, ocasión, fecha dd/mm/aaaa y mensaje de la tarjeta', all(t in c['descripcion'] for t in ('una mascota', 'Gafas (redondas)', 'Accesorios', 'Colores importantes: café', 'Mi idea: Mi perrita Luna')) and 'Ocasión: Cumpleaños.' in c['mensaje'] and '20/11/2099' in c['mensaje'] and 'Mensaje para la tarjeta: «Feliz cumpleaños»' in c['mensaje'] and c['tamano'] == '15 cm' and c['base'] == 95000, c)
        verificar('sin ocasión no se escribe la línea de ocasión', 'Ocasión' not in r['sinOcasion'])
        verificar('el texto de WhatsApp lleva tipo, tamaño, idea y tarjeta, sin la marca interna', '[Amigurumi — 15 cm]' in r['wa'] and 'Mi perrita Luna' in r['wa'] and 'Feliz cumpleaños' in r['wa'] and 'Ficha armada' not in r['wa'])
        verificar('las ocasiones respetan los valores de la marca (sin Navidad, Halloween ni santos)', not re.search(r'navidad|halloween|valent|santo|santa', r['ocasiones'], re.I), r['ocasiones'])
        tam = {k: re.findall(r"'(\d+ cm)'", v) for k, v in re.findall(r"'(Amigurumi|Llavero)': \[([^\]]*)\]", PERSONALIZA)}
        verificar('los tamaños del asistente son los mismos del formulario (tamanosPorTipo)', r['tamanos'] == tam, (r['tamanos'], tam))
        ideas_pers = dict(re.findall(r"(\w+): \['(Amigurumi|Llavero)'", PERSONALIZA))
        verificar('las ideas del asistente existen en el formulario con el mismo tipo de producto', all(ideas_pers.get(i) == t for i, t in r['ideas']), (r['ideas'], ideas_pers))
        page.close()

        for nombre, ctx in (('celular 390 px', movil), ('computador 1280 px', pc)):
            print('\n[Una sola página, dos formas de pedir — %s]' % nombre)
            tag = 'm' if ctx is movil else 'd'
            page, err, cap = abrir(ctx, base)
            opciones = page.eval_on_selector_all('#elige-modo .modo strong', 'els => els.map(e => e.textContent)')
            verificar('primero «Rosina te ayuda a crear» (marcada) y luego «Diligencia el formulario»', opciones == ['🐑 Rosina te ayuda a crear', '📝 Diligencia el formulario'] and page.is_checked('#elige-modo input[value="guiado"]'), opciones)
            verificar('en modo guiado se ven los 5 pasos y NO los campos del formulario directo (tipo, tamaño, qué quieres, mensaje)', page.locator('#guia-raiz .uc-paso').count() == 5 and not page.is_visible('#tipo-producto') and not page.is_visible('#tamano') and not page.is_visible('#descripcion') and not page.is_visible('#mensaje') and page.eval_on_selector('#modo-formulario', 'e => e.disabled'))
            guiado = etiquetas_visibles(page)
            verificar('modo guiado: ninguna pregunta aparece dos veces (%d campos)' % len(guiado), not repetidas(guiado) and len(guiado) > 10, repetidas(guiado))
            verificar('modo guiado: las fotos y los datos de contacto se piden una sola vez, abajo', COMPARTIDAS <= set(guiado) and all(guiado.count(e) == 1 for e in COMPARTIDAS), [e for e in COMPARTIDAS if e not in guiado])
            page.click('#elige-modo input[value="formulario"]')
            directo = etiquetas_visibles(page)
            verificar('modo formulario: se ven tipo, tamaño, qué quieres y mensaje, y NO los pasos del asistente', all(page.is_visible('#' + i) for i in ('tipo-producto', 'tamano', 'descripcion', 'mensaje')) and not page.is_visible('#guia-raiz') and not page.eval_on_selector('#modo-formulario', 'e => e.disabled'))
            verificar('modo formulario: ninguna pregunta aparece dos veces (%d campos)' % len(directo), not repetidas(directo) and len(directo) > 8, repetidas(directo))
            verificar('lo único que comparten los dos modos son las fotos y los datos de contacto (que se piden una vez)', set(directo) & set(guiado) <= COMPARTIDAS, sorted((set(directo) & set(guiado)) - COMPARTIDAS))
            page.click('#elige-modo input[value="guiado"]')
            # pasar del guiado al directo lleva lo ya elegido
            elegir(page, 'uc-idea', 'mascota'); elegir(page, 'uc-tamano', '15 cm'); page.fill('#uc-texto', 'Mi perrita Luna'); page.fill('#uc-tarjeta', 'Feliz cumpleaños')
            page.click('#elige-modo input[value="formulario"]')
            verificar('al pasar al formulario directo se lleva lo ya elegido (tipo, tamaño, descripción y tarjeta)', page.input_value('#tipo-producto') == 'Amigurumi' and page.input_value('#tamano') == '15 cm' and 'Mi idea: Mi perrita Luna' in page.input_value('#descripcion') and 'Feliz cumpleaños' in page.input_value('#mensaje') and 'Ficha armada' not in page.input_value('#mensaje'))
            page.click('#elige-modo input[value="guiado"]')
            verificar('y al volver al asistente, lo elegido sigue ahí', page.input_value('#uc-idea') == 'mascota' and page.input_value('#uc-tamano') == '15 cm' and page.input_value('#uc-texto') == 'Mi perrita Luna')
            page.click('#guia-raiz .ur-reiniciar')
            elegir(page, 'uc-idea', 'mascota')
            texto_tam = page.eval_on_selector_all('#uc-tamano option', 'os => os.map(o => o.textContent)')
            verificar('mascota: 10, 13, 15 y 20 cm; los precios base (85.000, 95.000, 115.000) son los del catálogo y 10 cm no lleva precio', texto_tam == ['Elige un tamaño', '10 cm', '13 cm · precio base $85.000', '15 cm · precio base $95.000', '20 cm · precio base $115.000'], texto_tam)
            elegir(page, 'uc-idea', 'detalle')
            verificar('recuerdo pequeño: llavero de 4, 5 y 6 cm, sin precios', page.eval_on_selector_all('#uc-tamano option', 'os => os.map(o => o.textContent)') == ['Elige un tamaño', '4 cm', '5 cm', '6 cm'])
            elegir(page, 'uc-idea', 'mascota'); elegir(page, 'uc-tamano', '15 cm')
            page.wait_for_function("document.getElementById('banner-personalizado') && !document.getElementById('banner-personalizado').hidden")
            verificar('al elegir 15 cm aparece el aviso del producto real ($95.000) con el pago en línea de siempre', '$95.000' in page.inner_text('#banner-personalizado') and 'Amigurumi personalizado 15 cm' in page.inner_text('#banner-personalizado'))
            page.check('.uc-detalle input[value="gafas"]')
            verificar('al marcar un detalle aparece su casilla de texto, enfocada', page.locator('.uc-detalle:has(input[value="gafas"]) .uc-detalle-texto').is_visible() and page.evaluate("document.activeElement.classList.contains('uc-detalle-texto')"))
            page.fill('.uc-detalle:has(input[value="gafas"]) .uc-detalle-texto', 'redondas')
            resumen = page.inner_text('.uc-lista')
            verificar('el resumen «Tu ficha» se actualiza en vivo', 'Una mascota' in resumen and '15 cm · precio base $95.000' in resumen and 'Gafas (redondas)' in resumen, resumen)
            page.uncheck('.uc-detalle input[value="gafas"]')
            verificar('al desmarcar el detalle se quita del resumen', 'Gafas' not in page.inner_text('.uc-lista'))
            page.click('#guia-raiz .ur-reiniciar')
            verificar('«Empezar de nuevo» limpia todo y vuelve a bloquear el tamaño', page.input_value('#uc-idea') == '' and page.locator('#uc-tamano').is_disabled() and 'Aún sin elegir' in page.inner_text('.uc-lista'))
            page.click('#boton-enviar')
            verificar('enviar sin lo obligatorio: avisa qué falta (rol alert), marca el campo, lleva el foco a la idea y no envía nada', page.is_visible('.uc-error') and page.get_attribute('.uc-error', 'role') == 'alert' and page.evaluate("document.activeElement.id") == 'uc-idea' and page.get_attribute('#uc-idea', 'aria-invalid') == 'true' and not cap)
            elegir(page, 'uc-idea', 'mascota')
            verificar('al corregir se quita la marca de error y el aviso', page.get_attribute('#uc-idea', 'aria-invalid') is None and not page.is_visible('.uc-error'))
            page.fill('#uc-colores', 'azul'); page.press('#uc-colores', 'Enter')
            verificar('Enter dentro del asistente no envía el formulario', not cap and not page.is_visible('#mensaje-estado.exito'))
            verificar('accesibilidad: los modos son botones de opción nativos agrupados (fieldset/legend), cada campo tiene etiqueta y el resumen es región en vivo', page.locator('fieldset#elige-modo legend').count() == 1 and page.eval_on_selector_all('#guia-raiz select, #guia-raiz textarea, #guia-raiz input[type=date], #uc-colores, #uc-tarjeta', 'els => els.every(e => document.querySelector("label[for=" + e.id + "]"))') and page.get_attribute('.uc-lista', 'aria-live') == 'polite')
            verificar('listas, botones y modos miden al menos 44 px de alto', page.eval_on_selector_all('#guia-raiz select, #guia-raiz button, #elige-modo .modo, #boton-enviar', 'els => els.every(e => e.getBoundingClientRect().height >= 43.5)'))
            verificar('sin scroll horizontal ni errores de JavaScript', pr.sin_scroll_horizontal(page) and not err, err)
            if CAPTURAS:
                page.click('#guia-raiz .ur-reiniciar'); llenar_guia(page)
                page.evaluate("document.querySelector('#pide-el-tuyo').scrollIntoView()")
                page.wait_for_timeout(600)
                page.screenshot(path=os.path.join(CAPTURAS, 'crear-%s-1-modos.png' % tag), full_page=False)
                page.evaluate("document.querySelector('.uc-ficha').scrollIntoView({block: 'center'})")
                page.wait_for_timeout(300)
                page.screenshot(path=os.path.join(CAPTURAS, 'crear-%s-2-ficha.png' % tag), full_page=False)
                page.evaluate("document.querySelector('.titulo-bloque').scrollIntoView()")
                page.wait_for_timeout(300)
                page.screenshot(path=os.path.join(CAPTURAS, 'crear-%s-3-datos.png' % tag), full_page=False)
            page.close()

        print('\n[Envío en modo guiado: lo que recibe la solicitud]')
        page, err, cap = abrir(pc, base)
        red = []
        page.on('request', lambda rq: red.append(rq.url) if 'rest/v1' in rq.url and 'obtener_tienda_web' not in rq.url and 'crear_solicitud_personalizada' not in rq.url else None)
        llenar_guia(page); llenar_contacto(page)
        verificar('el asistente no guarda nada en el dispositivo mientras se arma (sin ficha en localStorage)', page.evaluate("Object.keys(localStorage).filter(k => /ficha|crear/i.test(k)).length") == 0)
        page.click('#boton-enviar')
        page.wait_for_selector('#mensaje-estado.exito', timeout=8000)
        cuerpo = cap[0] if cap else {}
        d, m = cuerpo.get('p_descripcion', ''), cuerpo.get('p_mensaje', '')
        verificar('crear_solicitud_personalizada recibe la ficha completa: tipo y tamaño, detalles, colores e idea', d.startswith('[Amigurumi — 15 cm] Quiero tejer: una mascota.') and 'Gafas (redondas y negras)' in d and 'Accesorios (un collar rojo)' in d and 'Colores importantes: pelaje café con blanco.' in d and 'Mi idea: Mi perrita Luna con las orejas caídas.' in d, cuerpo)
        verificar('… y en el mensaje: ocasión, fecha, mensaje de la tarjeta y las autorizaciones', 'Ocasión: Cumpleaños.' in m and 'Fecha en la que lo necesito: 20/11/2099' in m and 'Mensaje para la tarjeta: «Feliz cumpleaños, mamá»' in m and 'tratamiento de datos para el pedido: SÍ' in m, m)
        verificar('los textos enviados caben en los límites de la función (3.000 caracteres)', len(d) < 3000 and len(m) < 3000)
        verificar('el radicado queda en pantalla y se ofrece el pago del producto de 15 cm', 'OPP-PRUEBA-1' in page.inner_text('#mensaje-estado') and page.is_visible('#pago-personalizado') and '$95.000' in page.inner_text('#pago-personalizado'))
        dl = page.evaluate("JSON.parse(JSON.stringify(window.dataLayer || []))")
        ev = [x for x in dl if x.get('event') == 'crear_solicitud']
        verificar('se registra crear_solicitud (modo guiado, tipo, tamaño, n.º de detalles) sin textos escritos por la persona', len(ev) == 1 and ev[0].get('modo') == 'guiado' and ev[0].get('n_detalles') == 2 and not re.search(r'Luna|collar|redondas|pelaje|Feliz', json.dumps(dl)), json.dumps(dl)[:300])
        verificar('después de enviar el asistente queda limpio y en modo guiado, listo para otro pedido', page.input_value('#uc-idea') == '' and page.is_checked('#elige-modo input[value="guiado"]') and page.is_visible('#guia-raiz'))
        verificar('mientras se arma la ficha no se envía nada a ningún servidor (solo el catálogo público y la solicitud al enviar)', not red, red)
        verificar('sin errores de JavaScript en todo el recorrido', not err, err)
        page.close()

        print('\n[Envío en modo formulario: sigue igual que antes]')
        page, err, cap = abrir(pc, base, ruta=RUTA + '?modo=formulario')
        verificar('con ?modo=formulario se ve el formulario directo y el asistente queda oculto', page.is_visible('#descripcion') and not page.is_visible('#guia-raiz') and page.is_checked('#elige-modo input[value="formulario"]'))
        page.select_option('#tipo-producto', 'Amigurumi'); page.select_option('#tamano', '13 cm')
        page.fill('#descripcion', 'Un amigurumi de mi perrita con su collar rojo.'); page.fill('#mensaje', 'Para el cumpleaños de mi mamá.')
        llenar_contacto(page); page.click('#boton-enviar')
        page.wait_for_selector('#mensaje-estado.exito', timeout=8000)
        cuerpo = cap[0] if cap else {}
        verificar('la solicitud llega como siempre: «[Amigurumi — 13 cm] descripción» y el mensaje escrito', cuerpo.get('p_descripcion') == '[Amigurumi — 13 cm] Un amigurumi de mi perrita con su collar rojo.' and cuerpo.get('p_mensaje', '').startswith('Para el cumpleaños de mi mamá.') and 'Ficha armada' not in cuerpo.get('p_mensaje', ''), cuerpo)
        verificar('se ofrece el pago del producto de 13 cm ($85.000)', page.is_visible('#pago-personalizado') and '$85.000' in page.inner_text('#pago-personalizado'))
        verificar('sin errores de JavaScript', not err, err)
        page.close()

        print('\n[Enlaces que ya existían y el universo]')
        pid = BASES[1]['id']
        page, err, _ = abrir(pc, base, ruta=RUTA + '?producto=%s&tipo=Amigurumi&tamano=15%%20cm' % pid, guia=False)
        page.wait_for_function("document.getElementById('banner-personalizado') && !document.getElementById('banner-personalizado').hidden", timeout=8000)
        verificar('desde la tienda («Personalizar»): modo formulario con el tipo y el tamaño ya elegidos y el aviso del producto', page.is_checked('#elige-modo input[value="formulario"]') and page.input_value('#tipo-producto') == 'Amigurumi' and page.input_value('#tamano') == '15 cm' and 'Amigurumi personalizado 15 cm' in page.inner_text('#banner-personalizado'))
        page.close()
        page, err, _ = abrir(pc, base, ruta=RUTA + '?inspiracion=Rapunzel%2015cm&tipo=Amigurumi', guia=False)
        verificar('desde una ficha de la tienda («Personalízalo»): modo formulario con la inspiración en la descripción', page.is_checked('#elige-modo input[value="formulario"]') and 'Rapunzel' in page.input_value('#descripcion'))
        page.close()
        page, err, _ = abrir(pc, base, ruta=RUTA + '?idea=mascota')
        verificar('desde «¿Qué podemos tejer para ti?» del inicio (?idea=mascota): asistente con «Una mascota» ya elegida y los tamaños disponibles', page.is_checked('#elige-modo input[value="guiado"]') and page.input_value('#uc-idea') == 'mascota' and not page.locator('#uc-tamano').is_disabled())
        page.close()
        page, err, _ = abrir(pc, base, ruta=RUTA + '?idea=inventada')
        verificar('una idea inventada en la dirección se ignora', page.input_value('#uc-idea') == '' and not err, err)
        page.close()
        page, err, _ = abrir(pc, base, ruta=RUTA + '?modo=guiado')
        verificar('?modo=guiado (la tarjeta del universo) abre el asistente', page.is_checked('#elige-modo input[value="guiado"]') and page.is_visible('#guia-raiz'))
        page.close()
        inicio = open(os.path.join(pr.RAIZ, 'index.html'), encoding='utf-8').read()
        ideas_inicio = set(re.findall(r'/personaliza\.html\?idea=(\w+)', inicio))
        ideas_guia = set(re.findall(r"\['(\w+)', '[^']+', '(?:Amigurumi|Llavero)', 'Ej:", CONFIG_JS))
        verificar('todas las ideas de los enlaces del inicio existen en el asistente (%s)' % ', '.join(sorted(ideas_inicio)), bool(ideas_inicio) and ideas_inicio <= ideas_guia, (ideas_inicio, ideas_guia))
        page, err = pr.abrir(pc, base, CATALOGO, ruta='/universo-rosina.html')
        verificar('en el universo, la tarjeta «Rosina te ayuda a crear» lleva a Personaliza (modo guiado) y ya no hay un segundo configurador', page.get_attribute('.recorrido[data-recorrido="crear"]', 'href') == '/personaliza.html?modo=guiado#pide-el-tuyo' and page.locator('#crear').count() == 0 and page.locator('.uc-marco').count() == 0 and not err, err)
        page.close()

        print('\n[WhatsApp, interruptor y respaldo]')
        page, err, _ = abrir(pc, base)
        llenar_guia(page)
        page.evaluate("window.open = (u) => { window.__ultimo = u; return null; }")
        page.click('.uc-whatsapp')
        url = page.evaluate("window.__ultimo || ''")
        verificar('WhatsApp abre wa.me/573205072801 con la ficha (tipo, tamaño, idea y tarjeta)', url.startswith('https://wa.me/573205072801?text=') and 'Mi%20perrita%20Luna' in url and '15%20cm' in url and 'Feliz' in url, url)
        nombres = [x.get('event') for x in page.evaluate("JSON.parse(JSON.stringify(window.dataLayer || []))")]
        verificar('se registran crear_inicio, crear_paso y crear_whatsapp', {'crear_inicio', 'crear_paso', 'crear_whatsapp'} <= set(nombres), nombres)
        page.close()
        page, err, cap = abrir(pc, base)
        page.click('#elige-modo input[value="formulario"]')
        verificar('al elegir un modo se registra crear_modo', any(x.get('event') == 'crear_modo' and x.get('modo') == 'formulario' for x in page.evaluate("JSON.parse(JSON.stringify(window.dataLayer || []))")))
        page.close()
        page, err, cap = abrir(pc, base, estado=500)
        elegir(page, 'uc-idea', 'mascota')
        tams = page.eval_on_selector_all('#uc-tamano option', 'os => os.map(o => o.textContent)')
        verificar('Personaliza no depende del catálogo de regalos: el asistente muestra los precios base de la tienda aunque ese servicio falle', '13 cm · precio base $85.000' in tams and not err, (tams, err))
        page.close()
        cfg = CONFIG_JS.replace('CREAR_ACTIVO: true', 'CREAR_ACTIVO: false')
        page, err, cap = abrir(pc, base, guia=False, config=cfg)
        page.wait_for_timeout(600)
        verificar('con CREAR_ACTIVO=false desaparece la elección de modos y la página queda solo con el formulario de siempre', not page.is_visible('#elige-modo') and page.is_visible('#descripcion') and not page.is_visible('#guia-raiz') and not err, err)
        page.select_option('#tipo-producto', 'Llavero'); page.select_option('#tamano', '5 cm'); page.fill('#descripcion', 'Mi gato'); llenar_contacto(page); page.click('#boton-enviar')
        page.wait_for_selector('#mensaje-estado.exito', timeout=8000)
        verificar('… y el envío funciona igual', (cap[0] if cap else {}).get('p_descripcion') == '[Llavero — 5 cm] Mi gato')
        page.close()
        page, err, cap = abrir(pc, base, guia=False, extra=[('**/js/universo/crear.js', lambda r: r.abort())])
        page.wait_for_timeout(800)
        verificar('si el asistente no carga, la página se queda con el formulario directo (sin elección de modos)', not page.is_visible('#elige-modo') and page.is_visible('#descripcion') and not page.eval_on_selector('#modo-formulario', 'e => e.disabled'), err)
        page.select_option('#tipo-producto', 'Amigurumi'); page.select_option('#tamano', '10 cm'); page.fill('#descripcion', 'Mi mamá'); llenar_contacto(page); page.click('#boton-enviar')
        page.wait_for_selector('#mensaje-estado.exito', timeout=8000)
        verificar('… y se puede enviar la solicitud', (cap[0] if cap else {}).get('p_descripcion') == '[Amigurumi — 10 cm] Mi mamá')
        page.close()
        nav.close()
    srv.shutdown()
    print('\n%d comprobaciones correctas, %d con falla.' % (pr.pasaron, len(pr.fallos)))
    if pr.fallos:
        print('FALLAS:\n - ' + '\n - '.join(pr.fallos))
        sys.exit(1)


if __name__ == '__main__':
    main()
