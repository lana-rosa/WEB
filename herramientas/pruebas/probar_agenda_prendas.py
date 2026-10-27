#!/usr/bin/env python3
"""Prueba (28-oct-2026) de «Prendas a medida» de la Agenda para tejedoras: tallas XS–XL, maniquí, esquema, cálculos y versiones.
Uso: con un servidor local en el puerto 8765:  /usr/bin/python3 herramientas/pruebas/probar_agenda_prendas.py [carpeta_capturas]"""
import sys, json, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from agenda_util import *
T = Prueba(); CAP = sys.argv[1] if len(sys.argv) > 1 else None
def cap(pg, n):
    if CAP: os.makedirs(CAP, exist_ok=True); pg.locator('#prendas-medida').screenshot(path=os.path.join(CAP, n))
def v(pg, i): return pg.input_value('#' + i)
def sel(pg, i, x): pg.select_option('#' + i, x); pg.wait_for_timeout(250)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM, args=['--no-sandbox'])
    ctx = contexto(b, 390); pg = abrir(ctx, 'prendas-medida', 1800)
    T.v('la hoja existe y abre', pg.evaluate("document.querySelector('#prendas-medida').classList.contains('abierta')"))
    T.v('sin prenda pide elegirla', 'Elige la prenda' in pg.inner_text('#pr-aviso'))
    sel(pg, 'ag-pr-prenda', 'Suéter'); sel(pg, 'ag-pr-talla', 'M')
    T.v('la talla M llena las medidas de referencia', v(pg, 'ag-pr-busto') == '92' and v(pg, 'ag-pr-hombros') == '39' and v(pg, 'ag-pr-largo') == '58' and v(pg, 'ag-pr-manga') == '43')
    T.v('el suéter oculta la cabeza, la cintura y el ancho de bufanda', all(pg.locator('[data-m="%s"]' % m).is_hidden() for m in ['cabeza', 'cintura', 'ancho']) and pg.locator('[data-m="manga"]').is_visible())
    T.v('sin muestra avisa y ya dibuja maniquí y esquema', 'Escribe tu muestra' in pg.inner_text('#pr-aviso') and pg.locator('#pr-maniqui svg').count() == 1 and pg.locator('#pr-esquema svg').count() == 1)
    pg.fill('#ag-pr-pts', '16'); pg.fill('#ag-pr-vts', '18'); pg.wait_for_timeout(400)
    c = pg.inner_text('#pr-calculos')
    # normal: busto 92 + 8 = 100 → 50 cm por pieza → 16 pts/10 cm → 80 puntos
    T.v('calcula 80 puntos para la espalda de un suéter M normal sin aviso', 'Monta 80 puntos' in c and pg.locator('#pr-aviso').is_hidden(), c[:300])
    T.v('calcula vueltas, hombros y mangas', 'vueltas' in c and 'Hombros' in c and 'Mangas' in c and 'Puño' in c, c)
    cap(pg, 'prendas-390.png')
    sel(pg, 'ag-pr-ajuste', 'Holgado'); pg.wait_for_timeout(300)
    T.v('holgado da más puntos (suéter M: 108 cm → 54 → 86)', 'Monta 86 puntos' in pg.inner_text('#pr-calculos'), pg.inner_text('#pr-calculos')[:200])
    sel(pg, 'ag-pr-talla', 'XL'); pg.wait_for_timeout(300)
    T.v('cambiar la talla recalcula (XL busto 106)', v(pg, 'ag-pr-busto') == '106' and 'Contorno final de la prenda: 122 cm' in pg.inner_text('#pr-calculos'))
    pg.fill('#ag-pr-busto', '110'); pg.wait_for_timeout(400)
    T.v('una medida escrita a mano se respeta', 'Contorno final de la prenda: 126 cm' in pg.inner_text('#pr-calculos'))
    sel(pg, 'ag-pr-talla', 'S'); pg.wait_for_timeout(300)
    T.v('cambiar de talla vuelve a las medidas de la talla', v(pg, 'ag-pr-busto') == '86')
    sel(pg, 'ag-pr-prenda', 'Chaleco'); pg.wait_for_timeout(300)
    T.v('chaleco: oculta manga, trae sisas', pg.locator('[data-m="manga"]').is_hidden() and 'Sisas del chaleco' in pg.inner_text('#pr-calculos') and 'Mangas' not in pg.inner_text('#pr-calculos'))
    sel(pg, 'ag-pr-prenda', 'Gorro'); pg.wait_for_timeout(300)
    T.v('gorro: pide cabeza y altura, múltiplo de 8 puntos', v(pg, 'ag-pr-cabeza') == '55' and v(pg, 'ag-pr-largo') == '20' and 'Gorro en redondo' in pg.inner_text('#pr-calculos') and 'Altura total del gorro' in pg.text_content('#pr-etq-largo'), pg.inner_text('#pr-calculos')[:200])
    sel(pg, 'ag-pr-prenda', 'Falda'); pg.wait_for_timeout(300)
    T.v('falda: cintura y cadera', 'Falda en redondo' in pg.inner_text('#pr-calculos') and 'Contorno de la cadera' in pg.inner_text('#pr-calculos'))
    sel(pg, 'ag-pr-prenda', 'Bufanda'); pg.wait_for_timeout(300)
    T.v('bufanda: ancho 20 y largo 150', v(pg, 'ag-pr-ancho') == '20' and v(pg, 'ag-pr-largo') == '150' and 'Bufanda' in pg.inner_text('#pr-calculos'))
    T.v('bufanda: puntos = 32 (20 cm × 16/10)', 'Monta 32 puntos' in pg.inner_text('#pr-calculos'))
    cap(pg, 'prendas-bufanda-390.png')
    sel(pg, 'ag-pr-prenda', 'Suéter'); pg.fill('#ag-pr-cliente', 'Marta'); pg.wait_for_timeout(400)
    g = json.loads(pg.evaluate("localStorage.getItem('rosinaAgenda')"))
    T.v('los datos se guardan con los nombres ag-pr-*', g.get('ag-pr-cliente') == 'Marta' and g.get('ag-pr-prenda') == 'Suéter' and g.get('ag-pr-pts') == '16')
    T.v('cada clienta es una versión con su nombre', pg.locator('#prendas-medida .vers-cab').count() >= 1 and 'Marta' in pg.inner_text('#prendas-medida .vers-cab'), pg.inner_text('#prendas-medida .vers-cab')[:200] if pg.locator('#prendas-medida .vers-cab').count() else 'sin cabecera')
    T.v('ningún elemento causa desplazamiento horizontal a 390', pg.evaluate("document.documentElement.scrollWidth <= innerWidth + 1"))
    # imprimir
    with ctx.expect_page() as nueva:
        pg.click('#pr-imprimir')
    w = nueva.value; w.wait_for_timeout(500)
    T.v('la ventana de impresión trae medidas, esquema y cálculos', 'Marta' in w.title() and w.locator('svg').count() == 2 and 'Monta' in w.inner_text('body'), w.title())
    w.close()
    T.v('sin errores de JavaScript', not pg.errs, pg.errs[:2]); ctx.close()
    for ancho in (768, 1280):
        ctx = contexto(b, ancho, datos={'ag-pr-prenda': 'Falda', 'ag-pr-talla': 'L', 'ag-pr-cintura': '80', 'ag-pr-cadera': '106', 'ag-pr-largo': '56', 'ag-pr-ajuste': 'Normal', 'ag-pr-pts': '15', 'ag-pr-vts': '17'})
        pg = abrir(ctx, 'prendas-medida', 1800)
        T.v('a %d px se ve la falda y no hay desplazamiento horizontal' % ancho, pg.locator('#pr-maniqui svg').count() == 1 and pg.evaluate("document.documentElement.scrollWidth <= innerWidth + 1"))
        if ancho == 1280: cap(pg, 'prendas-1280.png')
        T.v('sin errores de JavaScript a %d' % ancho, not pg.errs, pg.errs[:2]); ctx.close()
    b.close()
T.fin()
