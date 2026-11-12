"""«Dar por terminado» y pestaña «Patrones que diseñé» (12-nov-2026). Uso: /usr/bin/python3 probar_agenda_patrones_terminados.py"""
import json
from agenda_util import *
VER = {'disena-patron': {'orden': ['k1', 'k2', 'k3'], 'actual': 'k1', 'sig': 4, 'v': {
    'k1': {'ag-dp-nombre': 'Gorro de rayas', 'ag-dp-nivel': 'Fácil'}, 'k2': {'ag-dp-nombre': 'Messi 15cm', 'ag-dp-nivel': 'Intermedio', 'ag-dp-probado': True}, 'k3': {'ag-dp-nombre': 'Pollito peluche', 'ag-dp-nivel': 'Principiante', 'ag-dp-probado': True}}}}
DATOS = {'ag-duena': 'Sara', 'ag-dp-nombre': 'Gorro de rayas', 'ag-dp-nivel': 'Fácil', '_ver': VER}
T = Prueba()
def g(pg): return json.loads(pg.evaluate("localStorage.getItem('rosinaAgenda')") or '{}')
def items(pg): return pg.evaluate("[...document.querySelectorAll('#disena-patron .vers-item .ficha-titulo')].map(e => e.textContent)")
def lista(pg): return pg.evaluate("[...document.querySelectorAll('#patrones-propios .pp-nombre')].map(e => e.textContent)")
def terminar(pg):
    pg.click('#disena-patron .dp-paso-btn[data-i="7"]'); pg.wait_for_timeout(400); pg.click('#ag-dp-terminado'); pg.wait_for_timeout(900)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM)
    pg = abrir(contexto(b, 1280, 1000, datos=DATOS, config_abierta=False), 'disena-patron', 2600, config=False)
    T.v('«Diseña tu patrón» muestra sus 3 patrones y 3 pestañas arriba', items(pg) == ['Gorro de rayas', 'Messi 15cm', 'Pollito peluche'] and pg.locator('#disena-patron .sub-pestana').count() == 3, items(pg))
    T.v('la pestaña nueva se llama «Patrones que diseñé»', 'Patrones que diseñé' in pg.inner_text('#disena-patron .sub-pestana[data-hoja="patrones-disenados"]'))
    T.v('«Mis patrones» ya no trae la lista de patrones diseñados', pg.locator('#coleccion-patrones #patrones-propios').count() == 0 and pg.locator('#patrones-disenados #patrones-propios').count() == 1)
    terminar(pg)
    d = g(pg)
    T.v('«Dar por terminado» guarda la marca en el patrón 1 y nada se borra (3 patrones)', d['_ver']['disena-patron']['v']['k1'].get('ag-dp-terminado') is True and len(d['_ver']['disena-patron']['orden']) == 3, d['_ver']['disena-patron']['v']['k1'])
    T.v('el patrón terminado sale de «Diseña tu patrón»: quedan Messi y Pollito', items(pg) == ['Messi 15cm', 'Pollito peluche'], items(pg))
    T.v('pasa solo al siguiente patrón sin terminar (Messi) y empieza en el paso 1', pg.input_value('#ag-dp-nombre') == 'Messi 15cm' and pg.evaluate("window.lrVersiones.actual('disena-patron')") == 'k2' and pg.locator('#disena-patron .dp-paso.activo[data-paso="1"]').count() == 1)
    T.v('sale el aviso «Gorro de rayas ya está en Patrones que diseñé» con «Verlo»', pg.locator('#pt-aviso').is_visible() and 'Gorro de rayas' in pg.inner_text('#pt-aviso') and pg.locator('#pt-aviso button:has-text("Verlo")').count() == 1, pg.inner_text('#pt-aviso'))
    pg.click('#pt-aviso button:has-text("Verlo")'); pg.wait_for_timeout(700)
    T.v('«Verlo» abre la pestaña «Patrones que diseñé» con ese patrón', pg.evaluate("document.getElementById('patrones-disenados').classList.contains('abierta')") and lista(pg) == ['Gorro de rayas'] and not pg.locator('#patrones-propios .pp-vacio').is_visible(), lista(pg))
    pg.click('#patrones-propios .pp-item'); pg.wait_for_timeout(900)
    T.v('«Abrir» lo abre en «Diseña tu patrón» con sus datos y el aviso «Seguir editando»', pg.evaluate("document.getElementById('disena-patron').classList.contains('abierta')") and pg.input_value('#ag-dp-nombre') == 'Gorro de rayas' and pg.locator('#pt-aviso button:has-text("Seguir editando")').is_visible(), pg.input_value('#ag-dp-nombre'))
    T.v('mientras está abierto se ve junto a los que están sin terminar', items(pg) == ['Gorro de rayas', 'Messi 15cm', 'Pollito peluche'], items(pg))
    pg.click('#pt-aviso button:has-text("Seguir editando")'); pg.wait_for_timeout(900)
    T.v('«Seguir editando» quita la marca y lo devuelve a «Diseña tu patrón»', not pg.is_checked('#ag-dp-terminado') and not pg.locator('#pt-aviso').is_visible() and 'ag-dp-terminado' not in g(pg)['_ver']['disena-patron']['v']['k1'])
    pg.evaluate("window.lrIrAHoja('patrones-disenados')"); pg.wait_for_timeout(600)
    T.v('y la pestaña vuelve a estar vacía, con su explicación', lista(pg) == [] and pg.locator('#patrones-propios .pp-vacio').is_visible())
    # terminar los tres: el último crea un patrón nuevo vacío
    pg.evaluate("window.lrIrAHoja('disena-patron')"); pg.wait_for_timeout(500)
    for _ in range(3): terminar(pg)
    d = g(pg)['_ver']['disena-patron']
    T.v('al terminar los 3, se crea un patrón nuevo vacío para seguir (4 en total) y los 3 están en la pestaña', len(d['orden']) == 4 and items(pg) == ['Patrón sin nombre'] and sorted(lista(pg)) == ['Gorro de rayas', 'Messi 15cm', 'Pollito peluche'], (d['orden'], items(pg), lista(pg)))
    pg.reload(); pg.wait_for_timeout(2800)
    T.v('al recargar siguen los 3 terminados y «Diseña tu patrón» solo muestra el vacío', sorted(lista(pg)) == ['Gorro de rayas', 'Messi 15cm', 'Pollito peluche'] and items(pg) == ['Patrón sin nombre'], (lista(pg), items(pg)))
    pg.evaluate("window.lrIrAHoja('patrones-disenados')"); pg.wait_for_timeout(500); pg.click('#patrones-propios .pp-nuevo'); pg.wait_for_timeout(800)
    T.v('«Diseñar un patrón nuevo» abre el patrón vacío en «Diseña tu patrón»', pg.evaluate("document.getElementById('disena-patron').classList.contains('abierta')") and pg.input_value('#ag-dp-nombre') == '' and len(g(pg)['_ver']['disena-patron']['orden']) == 4)
    T.v('sin errores de JavaScript (computador)', not pg.errs, pg.errs)
    # celular
    pc = abrir(contexto(b, 390, 844, datos=DATOS, config_abierta=False), 'disena-patron', 2600, config=False); terminar(pc)
    pc.evaluate("window.lrIrAHoja('patrones-disenados')"); pc.wait_for_timeout(700)
    T.v('en el celular la pestaña nueva se ve completa y sin desplazamiento horizontal', lista(pc) == ['Gorro de rayas'] and pc.evaluate("document.documentElement.scrollWidth <= window.innerWidth + 1"))
    T.v('sin errores de JavaScript (celular)', not pc.errs, pc.errs)
    b.close()
T.fin()
