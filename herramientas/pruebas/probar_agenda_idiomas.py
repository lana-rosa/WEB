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
        pg.evaluate("window.lrAgendaConfig && window.lrAgendaConfig.abrir()"); pg.wait_for_timeout(400)
        T.v('[%s] Configuración traducida' % idioma, config in pg.inner_text('#agenda-config') or config in (pg.get_attribute('#agenda-config', 'aria-label') or ''), pg.inner_text('#agenda-config')[:100])
        T.v('[%s] el pie está traducido' % idioma, pie in pg.inner_text('footer'), pg.inner_text('footer')[:100])
        T.v('[%s] sin errores de JavaScript' % idioma, not pg.errs, pg.errs)
        pg.context.close()
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
