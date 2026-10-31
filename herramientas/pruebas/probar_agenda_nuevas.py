#!/usr/bin/env python3
"""Prueba (27-oct-2026) de las hojas nuevas de la Agenda para tejedoras: portada, mis ideas (con dictado por voz simulado), diseña tu patrón y mi año tejiendo.
Uso: con un servidor local en el puerto 8765:  /usr/bin/python3 herramientas/pruebas/probar_agenda_nuevas.py [carpeta_capturas]"""
import sys, json, os, tempfile
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from agenda_util import *
T = Prueba(); CAP = sys.argv[1] if len(sys.argv) > 1 else None
def cap(pg, n):
    if CAP: os.makedirs(CAP, exist_ok=True); pg.screenshot(path=os.path.join(CAP, n))
def guardado(pg): return json.loads(pg.evaluate("localStorage.getItem('rosinaAgenda') || '{}'"))
VOZ_FALSA = """
window.__voz = { n: 0, ultimo: null };
class SRFalsa { constructor() { window.__voz.ultimo = this; window.__voz.n++; } start() { window.__voz.activo = true; } stop() { window.__voz.activo = false; if (this.onend) this.onend(); } }
Object.defineProperty(window, 'SpeechRecognition', { value: SRFalsa, configurable: true }); Object.defineProperty(window, 'webkitSpeechRecognition', { value: SRFalsa, configurable: true });
window.__decir = function (texto, final) { var r = window.__voz.ultimo; var res = [{ transcript: texto, isFinal: !!final }]; res[0] = Object.assign([{ transcript: texto }], { isFinal: !!final }); r.onresult({ resultIndex: 0, results: [res[0]] }); };
localStorage.setItem('lrVozAviso', '1');
"""
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM, args=['--no-sandbox'])
    # menú, índice y número de hojas
    ctx = contexto(b, 1280); pg = abrir(ctx, 'indice-agenda')
    T.v('el menú tiene Portada, Mis ideas y Diseña tu patrón', all(pg.locator('#menu-hojas-lista a[data-hoja="%s"]' % h).count() == 1 for h in ['portada-agenda', 'mis-ideas', 'disena-patron']))
    T.v('el índice las ofrece y el contador dice cuántas hojas hay', pg.locator('#indice-agenda [data-ir="portada-agenda"]').count() == 1 and str(pg.locator('#agenda .hoja-agenda').count()) in pg.inner_text('.mh-pildora'), pg.inner_text('.mh-pildora'))
    T.v('el nombre es «Agenda para tejedoras»', 'Agenda para tejedoras' in pg.inner_text('.intro-agenda h1') and 'de Rosina' not in pg.inner_text('.intro-agenda h1'))
    T.v('sin errores de JavaScript', not pg.errs, pg.errs[:2]); ctx.close()
    # portada
    ctx = contexto(b, 390, datos={'ag-duena': 'Sara'}); pg = abrir(ctx, 'portada-agenda')
    T.v('portada: sale el nombre escrito en «Esta agenda es de»', pg.inner_text('#portada-nombre-vista') == 'Sara' and pg.input_value('#portada-nombre') == 'Sara')
    fondos = pg.evaluate("[...document.querySelectorAll('#portada-fondos button')].map(b => b.textContent)")
    T.v('hay fondos de flores, hojas, madejas y liso (sin Rosina y amigos ni ovejitas)', fondos == ['Flores', 'Hojas', 'Madejas', 'Liso'], fondos)
    pg.click('#portada-fondos button:has-text("Hojas")'); pg.wait_for_timeout(200)
    BORDE = "getComputedStyle(document.querySelector('#indice-agenda'), '::before').borderImageSource"
    ANCHO = "parseFloat(getComputedStyle(document.querySelector('#indice-agenda'), '::before').borderTopWidth)"
    for etiqueta, clave in (('Flores', 'flores'), ('Hojas', 'hojas'), ('Madejas', 'madejas')):
        pg.click('#portada-fondos button:has-text("%s")' % etiqueta); pg.wait_for_timeout(250)
        T.v('con «%s» la portada lo usa, se guarda y las hojas NO llevan cinta' % etiqueta, pg.evaluate("document.getElementById('portada-hoja').dataset.fondo") == clave and guardado(pg).get('ag-portada-fondo') == clave and ('fondo-%s.webp' % clave) in pg.evaluate("document.querySelector('.portada-fondo').style.backgroundImage") and pg.evaluate("document.querySelector('#agenda').dataset.fondoHojas") == clave and pg.evaluate("getComputedStyle(document.querySelector('#indice-agenda'), '::before').display") == 'none')
    pg.click('#portada-fondos button:has-text("Liso")'); pg.wait_for_timeout(200)
    T.v('con «Liso» no hay fondo de pantalla', pg.evaluate("getComputedStyle(document.body, '::before').content") == 'none')
    T.v('con «Liso» las hojas quedan blancas, sin cinta, y la portada sin imagen', pg.evaluate("document.querySelector('#agenda').dataset.fondoHojas") is None and pg.evaluate("document.querySelector('.portada-fondo').style.backgroundImage") == '' and pg.evaluate(BORDE) in ('none', ''))
    pg.click('#portada-fondos button:has-text("Hojas")'); pg.wait_for_timeout(200)
    pg.click('#portada-fondos button:has-text("Madejas")'); pg.wait_for_timeout(200)
    T.v('el estilo elegido queda de fondo de pantalla de la agenda', 'madejas' in pg.evaluate("getComputedStyle(document.body, '::before').backgroundImage"))
    T.v('las imágenes de los fondos existen (portada, miniatura y cinta)', all(os.path.exists(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'img', 'agenda', 'fondo-%s%s.webp' % (f, suf))) for f in ('flores', 'hojas', 'madejas') for suf in ('', '-mini', '-borde')) and all(os.path.exists(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'img', 'agenda', 'pantalla-%s.webp' % f)) for f in ('flores', 'hojas', 'madejas')))
    pg.click('#portada-colores button[aria-label="Lila"]'); pg.wait_for_timeout(200)
    T.v('el color también se guarda', guardado(pg).get('ag-portada-color') == 'lila' and pg.evaluate("document.getElementById('portada-hoja').dataset.color") == 'lila')
    pg.fill('#portada-nombre', 'Sara Muñoz'); pg.fill('#ag-portada-frase', 'Un punto a la vez'); pg.wait_for_timeout(300)
    T.v('cambiar el nombre aquí lo cambia en toda la agenda', pg.input_value('#ag-duena') == 'Sara Muñoz' and guardado(pg).get('ag-duena') == 'Sara Muñoz' and 'Sara Muñoz' in pg.inner_text('#portada-nombre-vista') and 'Sara Muñoz' in pg.inner_text('.intro-agenda h1'))
    T.v('la frase sale en la portada', pg.inner_text('#portada-frase-vista') == 'Un punto a la vez')
    cap(pg, 'nuevas-portada-390.png')
    pg.reload(); pg.wait_for_timeout(1500)
    T.v('al volver a entrar la portada sigue como se dejó', pg.evaluate("document.getElementById('portada-hoja').dataset.fondo") == 'madejas' and pg.evaluate("document.getElementById('portada-hoja').dataset.color") == 'lila')
    pg.emulate_media(media='print'); cap(pg, 'nuevas-portada-impresion.png')
    ancho = pg.evaluate("document.querySelector('#portada-hoja').getBoundingClientRect().width"); T.v('al imprimir la portada ocupa todo el ancho', ancho > 300, ancho)
    pg.emulate_media(media='screen')
    T.v('sin desplazamiento horizontal', pg.evaluate("document.documentElement.scrollWidth <= innerWidth + 1"))
    T.v('sin errores de JavaScript', not pg.errs, pg.errs[:2]); ctx.close()
    # ideas y voz
    ctx = contexto(b, 390); ctx.add_init_script(VOZ_FALSA); pg = abrir(ctx, 'mis-ideas')
    T.v('mis ideas: empieza con una sola ficha abierta', pg.evaluate("[...document.querySelectorAll('#tabla-ideas tr.ficha')].filter(x => !x.hidden).length") == 1)
    pg.click('#mis-ideas [data-voz="dictar"]'); pg.wait_for_timeout(300)
    T.v('«Hablar para escribir» empieza a escuchar', pg.evaluate("window.__voz.n") == 1 and 'Escuchando' in pg.inner_text('#mis-ideas .voz-estado'), pg.inner_text('#mis-ideas .voz-estado'))
    pg.evaluate("window.__decir('un gorro con orejas de oso', true)"); pg.evaluate("window.__decir('para mi sobrino nueva línea pb en anillo mágico', false)"); pg.wait_for_timeout(200)
    t = pg.input_value('#ag-id1-nota')
    T.v('lo que se dice queda escrito en la ficha (con mayúscula inicial y lo parcial al final)', t.startswith('Un gorro con orejas de oso') and 'sobrino' in t, t)
    pg.evaluate("window.__decir('para mi sobrino nueva línea pb en anillo mágico', true)"); pg.wait_for_timeout(200)
    t = pg.input_value('#ag-id1-nota')
    T.v('«nueva línea» baja de renglón y «punto bajo» no se cambia por un punto', '\n' in t and 'pb en anillo mágico' in t, repr(t))
    T.v('se guarda solo con los nombres de siempre', guardado(pg).get('ag-id1-nota') == t)
    pg.click('#mis-ideas [data-voz="dictar"]'); pg.wait_for_timeout(200)
    T.v('al tocar otra vez deja de escuchar', pg.evaluate("window.__voz.activo") is False and 'Listo' in pg.inner_text('#mis-ideas .voz-estado'))
    pg.click('#mis-ideas .agregar-renglon'); pg.wait_for_timeout(300); pg.click('#mis-ideas [data-voz="dictar"]'); pg.wait_for_timeout(200)
    pg.evaluate("window.__decir('otra idea', true)"); pg.wait_for_timeout(200)
    T.v('con una ficha nueva abierta, dicta en ella', pg.input_value('#ag-id2-nota') == 'Otra idea' and pg.input_value('#ag-id1-nota') == t, pg.input_value('#ag-id2-nota'))
    T.v('sin errores de JavaScript', not pg.errs, pg.errs[:2]); ctx.close()
    ctx = contexto(b, 390); ctx.add_init_script("Object.defineProperty(window, 'SpeechRecognition', { value: undefined, configurable: true }); Object.defineProperty(window, 'webkitSpeechRecognition', { value: undefined, configurable: true });"); pg = abrir(ctx, 'mis-ideas')   # sin reconocimiento de voz del navegador
    pg.evaluate("localStorage.setItem('lrVozAviso','1')"); pg.click('#mis-ideas [data-voz="dictar"]'); pg.wait_for_timeout(200)
    T.v('si el navegador no puede dictar lo explica', 'micrófono del teclado' in pg.inner_text('#mis-ideas .voz-estado'), pg.inner_text('#mis-ideas .voz-estado')); ctx.close()
    # diseña tu patrón
    ctx = contexto(b, 390, datos={'ag-duena': 'Sara'}); pg = abrir(ctx, 'disena-patron')
    T.v('patrón: se ve un paso a la vez, empezando por «La idea»', pg.evaluate("[...document.querySelectorAll('.dp-paso')].filter(x => getComputedStyle(x).display !== 'none').length") == 1 and 'Paso 1 de 7' in pg.inner_text('#dp-cuenta'))
    pg.fill('#ag-dp-nombre', 'Ovejita Rosa'); pg.fill('#ag-dp-tipo', 'Amigurumi'); pg.select_option('#ag-dp-nivel', 'Principiante'); pg.fill('#ag-dp-medida', '15 cm')
    pg.click('#dp-sig'); pg.fill('#ag-dp-lana', 'Algodón rosa'); pg.fill('#ag-dp-aguja', '2,5')
    pg.click('#dp-sig'); pg.click('.dp-chip:has-text("pb = punto bajo")'); pg.click('.dp-chip:has-text("am = anillo mágico")'); pg.click('.dp-chip:has-text("pb = punto bajo")')
    T.v('las abreviaturas se agregan con un toque y sin repetirse', pg.input_value('#ag-dp-abrev') == 'pb = punto bajo\nam = anillo mágico', repr(pg.input_value('#ag-dp-abrev')))
    pg.click('#dp-sig'); pg.fill('#ag-dp-p1-nombre', 'Cabeza'); pg.fill('#ag-dp-p1-vueltas', 'V1: 6 pb en am (6)\nV2: aum en cada pto (12)')
    pg.click('#dp-sig'); pg.fill('#ag-dp-armado', 'Coser la cabeza al cuerpo'); pg.click('#dp-sig'); pg.fill('#ag-dp-notas', 'Probar con algodón'); pg.click('#dp-sig'); pg.wait_for_timeout(300)
    vista = pg.text_content('#dp-vista')
    T.v('la vista previa arma el patrón con título, materiales, abreviaturas y partes', 'Ovejita Rosa' in vista and 'Algodón rosa' in vista and 'pb = punto bajo' in vista and 'Cabeza' in vista and 'V2: aum en cada pto (12)' in vista and 'Patrón de Sara' in vista, vista[:300])
    T.v('«Imprimir» y «Descargar como texto» están disponibles', pg.is_visible('#dp-imprimir') and pg.is_visible('#dp-txt'))
    with pg.expect_download() as d: pg.click('#dp-txt')
    ruta = os.path.join(tempfile.mkdtemp(), 'p.txt'); d.value.save_as(ruta); txt = open(ruta, encoding='utf-8').read()
    T.v('el texto bajado trae el patrón completo', txt.startswith('OVEJITA ROSA') and 'CABEZA' in txt and 'ARMADO' in txt, txt[:120])
    T.v('el patrón queda guardado como ficha con su nombre', pg.evaluate("document.querySelector('#disena-patron .vers-item.abierta .ficha-titulo').textContent") == 'Ovejita Rosa')
    cap(pg, 'nuevas-patron-390.png')
    pg.click('#disena-patron .vers-nueva'); pg.wait_for_timeout(300)
    T.v('«Diseñar otro patrón» abre uno en blanco', pg.input_value('#ag-dp-nombre') == '' and pg.evaluate("document.querySelectorAll('#disena-patron .vers-item').length") == 2)
    T.v('sin desplazamiento horizontal', pg.evaluate("document.documentElement.scrollWidth <= innerWidth + 1"))
    T.v('sin errores de JavaScript', not pg.errs, pg.errs[:2]); ctx.close()
    # año tejiendo
    ctx = contexto(b, 390, datos={'ag-mes-3': 'Bufanda\nGorro\nMantita\nOso grande', 'ag-mes-4': 'Llaveros'}); pg = abrir(ctx, 'anio-tejiendo')
    vista3 = pg.inner_text('.meses .mes:nth-child(3) .mes-vista')
    T.v('año: cada mes muestra lo último que se escribió', 'Oso grande' in vista3 and 'Mantita' in vista3 and 'Bufanda' not in vista3, vista3)
    T.v('un mes vacío invita a escribir', 'Toca para escribir' in pg.inner_text('.meses .mes:nth-child(1) .mes-vista'))
    pg.click('.meses .mes:nth-child(3)'); pg.wait_for_timeout(300)
    T.v('al tocar un mes se abre a página entera (los demás se esconden)', pg.evaluate("[...document.querySelectorAll('.meses .mes')].filter(x => getComputedStyle(x).display !== 'none').length") == 1 and pg.is_visible('#ag-mes-3'))
    pg.fill('#ag-mes-3', 'Bufanda\nGorro\nMantita\nOso grande\nGuantes'); pg.click('.mes-volver'); pg.wait_for_timeout(300)
    T.v('al volver al año se ve lo último escrito y queda guardado', 'Guantes' in pg.inner_text('.meses .mes:nth-child(3) .mes-vista') and 'Guantes' in guardado(pg).get('ag-mes-3', ''))
    cap(pg, 'nuevas-anio-390.png')
    T.v('sin errores de JavaScript', not pg.errs, pg.errs[:2]); ctx.close(); b.close()
T.fin()
