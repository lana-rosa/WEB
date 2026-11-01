"""Idiomas de la Agenda (etapa 1, 31-oct-2026): selector ES/EN/PT, traducción del menú, panel, secciones y Configuración, sin tocar lo escrito por la persona.
Uso: /usr/bin/python3 probar_agenda_idiomas.py"""
from agenda_util import *
import datetime
hoy = datetime.date.today(); f = lambda d: d.strftime('%d/%m/%Y')
DATOS = {'ag-duena': 'Sara Pérez', 'ag-vt1-fecha': f(hoy), 'ag-vt1-producto': 'Osito', 'ag-vt1-cliente': 'María', 'ag-vt1-precio': '$ 85.000',
         'ag-f1-proyecto': 'Chaleco de María', 'ag-f1-estado': 'Tejiendo'}
T = Prueba()
def abrir_en(b, idioma, ancho=1280):
    ctx = contexto(b, ancho, 900 if ancho > 500 else 844, datos=DATOS, config_abierta=False)
    if idioma: ctx.add_init_script("localStorage.setItem('lrAgendaIdioma', '%s')" % idioma)
    return abrir(ctx, '', 2300, config=False)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM)
    es = abrir_en(b, None)
    T.v('por defecto la agenda está en español', es.evaluate("document.documentElement.lang") == 'es-CO' and 'Mi panel' in es.inner_text('#pestanas-agenda'))
    T.v('hay selector de idioma con ES, EN y PT', es.locator('#agenda-idioma option').count() == 3 and es.evaluate("document.getElementById('agenda-idioma').value") == 'es')
    T.v('el selector se ve y mide al menos 40 px', es.is_visible('#agenda-idioma') and es.evaluate("document.getElementById('agenda-idioma').getBoundingClientRect().height") >= 40)
    T.v('en español el saludo y los textos no cambian', 'Buenos días' in es.inner_text('.pn-hero') or 'Buenas' in es.inner_text('.pn-hero'))
    T.v('sin errores en español', not es.errs, es.errs)
    # cambiar a inglés con el selector (guarda y recarga)
    es.select_option('#agenda-idioma', 'en'); es.wait_for_timeout(2500)
    T.v('al elegir EN se guarda y la página queda en inglés', es.evaluate("localStorage.getItem('lrAgendaIdioma')") == 'en' and es.evaluate("document.documentElement.lang") == 'en')
    for idioma, menu, saludo, config, pie in (('en', 'My dashboard', 'Good', 'Planner settings', 'Policies'), ('pt', 'Meu painel', 'Bom dia|Boa', 'Configurações da agenda', 'Políticas')):
        pg = abrir_en(b, idioma)
        T.v('[%s] html lang correcto' % idioma, pg.evaluate("document.documentElement.lang") == ('en' if idioma == 'en' else 'pt-BR'))
        T.v('[%s] el menú de secciones está traducido' % idioma, menu in pg.inner_text('#pestanas-agenda'), pg.inner_text('#pestanas-agenda'))
        h = pg.inner_text('.pn-hero')
        T.v('[%s] el saludo está traducido y conserva el nombre' % idioma, any(s in h for s in saludo.split('|')) and 'Sara' in h and 'Buenos' not in h, h)
        T.v('[%s] el buscador y los botones están traducidos' % idioma, 'Buscar' not in pg.get_attribute('#busqueda-agenda', 'placeholder') if pg.locator('#busqueda-agenda').count() else True)
        T.v('[%s] lo que escribió la persona NO se traduce (proyecto y cliente)' % idioma, 'Chaleco de María' in pg.inner_text('#panel-contenido') or 'Chaleco' in pg.inner_text('body'))
        T.v('[%s] los valores guardados siguen intactos' % idioma, pg.evaluate("JSON.parse(localStorage.getItem('rosinaAgenda'))['ag-f1-proyecto']") == 'Chaleco de María')
        T.v('[%s] el selector muestra el idioma elegido' % idioma, pg.evaluate("document.getElementById('agenda-idioma').value") == idioma)
        # todas las secciones, sin errores y con las tarjetas traducidas
        for i in range(1, 7):
            pg.locator('.pestana').nth(i).click(); pg.wait_for_timeout(350)
        t = pg.inner_text('#vista-seccion') if pg.locator('#vista-seccion').count() else ''
        T.v('[%s] la vista de sección está traducida' % idioma, 'páginas' in t.lower() if idioma == 'pt' else 'pages' in t.lower(), t[:120])
        pg.evaluate("window.lrAgendaConfig && window.lrAgendaConfig.abrir(true)"); pg.wait_for_timeout(400)
        T.v('[%s] Configuración traducida' % idioma, config in pg.inner_text('#agenda-config') or config in (pg.get_attribute('#agenda-config', 'aria-label') or ''), pg.inner_text('#agenda-config')[:100])
        T.v('[%s] el pie está traducido' % idioma, pie in pg.inner_text('footer'), pg.inner_text('footer')[:100])
        T.v('[%s] sin errores de JavaScript' % idioma, not pg.errs, pg.errs)
        pg.context.close()
    # --- etapa 2: el cuerpo de las hojas y que lo guardado no cambie con el idioma
    for idioma in ('en', 'pt'):
        pg = abrir_en(b, idioma)
        ids = pg.evaluate("[...document.querySelectorAll('#menu-hojas-lista a[data-hoja]')].map(a => a.dataset.hoja)")
        T.v('[%s] se pueden recorrer las %d hojas sin errores' % (idioma, len(ids)), len(ids) >= 39 and not pg.errs, pg.errs)
        sin = []
        for h in ids:
            pg.evaluate("window.lrIrAHoja && window.lrIrAHoja('%s')" % h); pg.wait_for_timeout(120)
            sin += [t for t, _ in pg.evaluate("window.lrI18n.faltan(document.getElementById('%s'), true)" % h) if len(t) > 3 and t not in ('Chaleco de María', 'Manta bebé', 'Sara Pérez', 'osito', 'Osito', 'María Gómez · Osito', 'Nov', 'nov') and not t.startswith('Q') ]
        T.v('[%s] las hojas no dejan textos en español sin traducir' % idioma, len(sin) <= 6, sin[:12])
        # elegir un estado y un medio de pago con la lista: lo guardado queda en español
        pg.evaluate("window.lrIrAHoja('control-pedidos')"); pg.wait_for_timeout(300)
        etiqueta = 'Delivered' if idioma == 'en' else 'Entregue'
        pg.evaluate("document.querySelector('#control-pedidos tr.ficha')?.classList.add('abierta')")
        pg.select_option('#ag-p2-estado', label=etiqueta, force=True); pg.wait_for_timeout(600)
        guardado = pg.evaluate("JSON.parse(localStorage.getItem('rosinaAgenda'))['ag-p2-estado']")
        T.v('[%s] el estado elegido se guarda en español (%s → Entregado)' % (idioma, etiqueta), guardado == 'Entregado', guardado)
        pg.context.close()
    # --- etapa 3: tutorial, ventanas del navegador, chat de Rosina y dictado
    for idioma, bien, borrar_txt, chat_ph, voz in (('en', 'Welcome to your planner', 'Delete everything you wrote', 'Write your question', 'en-US'), ('pt', 'Bem-vinda à sua agenda', 'Apagar tudo o que você escreveu', 'Escreva a sua pergunta', 'pt-BR')):
        ctx = contexto(b, 1280, 900, datos=DATOS, config_abierta=False); ctx.add_init_script("localStorage.setItem('lrAgendaIdioma', '%s')" % idioma)
        cuerpos = []
        ctx.route('**/functions/v1/rosina-web', lambda r: (cuerpos.append(r.request.post_data), r.fulfill(status=200, content_type='application/json', headers={'access-control-allow-origin': '*'}, body='{"respuesta":"ok","productos":[]}'))[1])
        pg = ctx.new_page(); pg.errs = []; pg.on('pageerror', lambda e: pg.errs.append(str(e))); dialogos = []
        pg.on('dialog', lambda d: (dialogos.append(d.message), d.dismiss())); pg.goto(BASE + '/agenda-rosina.html?tour=1'); pg.wait_for_timeout(2500)
        T.v('[%s] el tutorial de bienvenida está traducido' % idioma, bien in pg.inner_text('.tour-tarjeta'), pg.inner_text('.tour-tarjeta')[:80])
        pg.keyboard.press('Escape'); pg.evaluate("document.querySelector('.tour-saltar') && document.querySelector('.tour-saltar').click()"); pg.wait_for_timeout(300)
        pg.evaluate("window.lrAgendaConfig.abrir(true)"); pg.wait_for_timeout(300); pg.click('#agenda-borrar'); pg.wait_for_timeout(400)
        T.v('[%s] la ventana de confirmación del navegador sale traducida' % idioma, any(borrar_txt in d for d in dialogos), dialogos)
        pg.evaluate("window.lrAgendaConfig.cerrar()"); pg.click('#af-boton'); pg.click('#af-menu [data-af=rosina]'); pg.wait_for_timeout(600)
        T.v('[%s] el chat de Rosina está traducido' % idioma, chat_ph in (pg.get_attribute('.rc-form input', 'placeholder') or ''), pg.get_attribute('.rc-form input', 'placeholder'))
        pg.fill('.rc-form input', 'hola'); pg.click('.rc-form button'); pg.wait_for_timeout(700)
        T.v('[%s] el chat le dice a la función en qué idioma contestar' % idioma, bool(cuerpos) and ('"idioma":"%s"' % idioma) in cuerpos[0], cuerpos[:1])
        T.v('[%s] el dictado usa el idioma elegido' % idioma, pg.evaluate("window.lrI18n.voz") == voz)
        T.v('[%s] la ventana de pago de la membresía y la autorización de la nube quedan en español (texto legal)' % idioma, pg.evaluate("document.getElementById('modal-nube').hasAttribute('data-no-traducir')"))
        T.v('[%s] sin errores en el tutorial ni el chat' % idioma, not pg.errs, pg.errs)
        ctx.close()
    # ?idioma=pt fija el idioma
    ctx = contexto(b, 1280, 900, datos=DATOS, config_abierta=False); pg = ctx.new_page(); pg.goto(BASE + '/agenda-rosina.html?idioma=pt'); pg.wait_for_timeout(2200)
    T.v('?idioma=pt la deja en portugués y la recuerda', pg.evaluate("document.documentElement.lang") == 'pt-BR' and pg.evaluate("localStorage.getItem('lrAgendaIdioma')") == 'pt')
    # celular: la barra de arriba no se desborda con el selector
    cel = abrir_en(b, 'en', 390)
    T.v('celular: sin desplazamiento horizontal con el selector', cel.evaluate("document.documentElement.scrollWidth <= window.innerWidth + 1"))
    T.v('celular: el selector queda dentro de la pantalla', cel.evaluate("(() => { const r = document.getElementById('agenda-idioma').getBoundingClientRect(); return r.left >= 0 && r.right <= window.innerWidth; })()"))
    cel.screenshot(path='/tmp/claude-0/idioma-cel.png')
    b.close()
T.fin()
