#!/usr/bin/env python3
"""Prueba (29-oct-2026) de los enlaces a las herramientas y consultas del Rincón de Rosina dentro de las hojas de la Agenda para tejedoras.
Uso: con un servidor local en el puerto 8765:  /usr/bin/python3 herramientas/pruebas/probar_agenda_herramientas.py"""
import sys, os, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from agenda_util import *
T = Prueba(); RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
def destino_ok(href):
    ruta, _, ancla = href.partition('#')
    f = os.path.join(RAIZ, ruta.lstrip('/')); f = os.path.join(f, 'index.html') if os.path.isdir(f) else f
    if not os.path.exists(f): return False
    t = open(f, encoding='utf-8').read()
    return not ancla or ('id="%s"' % ancla in t or 'data-ancla="%s"' % ancla in t)
ESPERADO = {
    'fin-resumen': ['/calculadoras-rosina.html#costos'], 'fin-movimientos': ['/calculadoras-rosina.html#costos'], 'fin-presupuesto': ['/calculadoras-rosina.html#costos'], 'fin-negocio': ['/calculadoras-rosina.html#costos'],
    'ficha-proyecto': ['/glosario-rosina.html', '/recursos-rosina.html#abreviaturas'], 'proyectos-fila': ['/glosario-rosina.html', '/recursos-rosina.html#abreviaturas'],
    'coleccion-patrones': ['/glosario-rosina.html', '/recursos-rosina.html#abreviaturas'], 'lo-que-aprendi': ['/glosario-rosina.html', '/recursos-rosina.html#abreviaturas'],
    'registro-pausas': ['/revista/pausas-activas/'],
}
PASOS = {'1': ['/recursos-rosina.html#checklist', '/paletas-rosina.html'],
         '2': ['/calculadoras-rosina.html#agujas', '/calculadoras-rosina.html#lana', '/calculadoras-rosina.html#muestra', '/paletas-rosina.html', '/recursos-rosina.html#checklist'],
         '3': ['/glosario-rosina.html', '/recursos-rosina.html#abreviaturas'], '4': ['/calculadoras-rosina.html#aumentos', '/calculadoras-rosina.html#esferas', '/glosario-rosina.html']}
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM, args=['--no-sandbox'])
    for ancho in (1280, 390):
        ctx = contexto(b, ancho, 900); pg = abrir(ctx, 'fin-resumen', 1500); n = '%d px: ' % ancho
        for hoja, hrefs in ESPERADO.items():
            hs = pg.evaluate("(i) => [...document.querySelectorAll('#' + i + ' > .herr-rosina a')].map(a => a.getAttribute('href'))", hoja)
            T.v(n + hoja + ': tiene los enlaces pedidos', hs == hrefs, hs)
            T.v(n + hoja + ': los enlaces llegan a una página y a una sección que existen', all(destino_ok(h) for h in hs), [h for h in hs if not destino_ok(h)])
        for paso, hrefs in PASOS.items():
            hs = pg.evaluate("(k) => [...document.querySelectorAll('#disena-patron fieldset[data-paso=\"' + k + '\"] .herr-rosina a')].map(a => a.getAttribute('href'))", paso)
            T.v(n + 'Diseña tu patrón, paso ' + paso + ': enlaces en el paso que corresponde', hs == hrefs, hs)
            T.v(n + 'Diseña tu patrón, paso ' + paso + ': los destinos existen', all(destino_ok(h) for h in hs))
        T.v(n + 'todos abren en otra pestaña (no se pierde la agenda) y no se imprimen', pg.evaluate("[...document.querySelectorAll('.herr-rosina a')].every(a => a.target === '_blank' && a.rel.includes('noopener') && a.closest('.herr-rosina').classList.contains('no-imprimir'))"))
        pg.evaluate("document.querySelector('#menu-hojas-lista a[data-hoja=\"disena-patron\"]').click()"); pg.wait_for_timeout(400)
        pg.evaluate("document.querySelector('#dp-pasos button:nth-child(2)') && document.querySelector('#dp-pasos button:nth-child(2)').click()"); pg.wait_for_timeout(300)
        T.v(n + 'en el paso 2 se ven los enlaces de materiales', pg.locator('#disena-patron fieldset[data-paso="2"] .herr-rosina').is_visible() and pg.locator('#disena-patron fieldset[data-paso="1"] .herr-rosina').is_hidden())
        T.v(n + 'sin desplazamiento horizontal ni errores', pg.evaluate("document.documentElement.scrollWidth <= innerWidth + 1") and not pg.errs, pg.errs[:2]); ctx.close()
    b.close()
T.fin()
