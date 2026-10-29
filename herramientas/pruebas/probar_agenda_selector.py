#!/usr/bin/env python3
"""Prueba (29-oct-2026) de la lista desplegable de hojas de cada pestaña de la Agenda para tejedoras (antes eran muchos botones con ícono).
Uso: con un servidor local en el puerto 8765:  /usr/bin/python3 herramientas/pruebas/probar_agenda_selector.py [carpeta_capturas]"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from agenda_util import *
T = Prueba(); CAP = sys.argv[1] if len(sys.argv) > 1 else None
OPC = "[...document.querySelectorAll('#selector-hoja-lista option')].map(o => o.value)"
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM, args=['--no-sandbox'])
    for ancho in (390, 1280):
        ctx = contexto(b, ancho); pg = abrir(ctx, 'prioridades-mes', 1800); n = '%d px: ' % ancho
        T.v(n + 'los botones con ícono ya no existen', pg.locator('#chips-hojas').count() == 0 and pg.locator('.selector-hoja button').count() == 0)
        T.v(n + 'la pestaña Proyectos muestra una lista desplegable con sus 12 hojas', pg.is_visible('#selector-hoja') and pg.locator('#selector-hoja-lista option').count() == 12 and pg.evaluate("document.getElementById('selector-hoja-lista').tagName") == 'SELECT')
        T.v(n + 'la lista dice en qué hoja va y marca la actual', pg.inner_text('#selector-hoja-etq').lower() == 'hojas de proyectos · 2 de 12' and pg.input_value('#selector-hoja-lista') == 'prioridades-mes', pg.inner_text('#selector-hoja-etq'))
        T.v(n + 'todas las opciones son hojas que existen', pg.evaluate("(" + OPC + ").every(id => { const h = document.getElementById(id); return h && h.classList.contains('hoja-agenda'); })"))
        T.v(n + 'es cómoda de tocar: texto de 16 px o más y 44 px de alto', pg.evaluate("parseFloat(getComputedStyle(document.getElementById('selector-hoja-lista')).fontSize) >= 16") and pg.evaluate("document.getElementById('selector-hoja-lista').getBoundingClientRect().height >= 44"))
        pg.focus('#selector-hoja-lista'); pg.select_option('#selector-hoja-lista', 'ficha-proyecto'); pg.wait_for_timeout(400)
        T.v(n + 'al elegir una hoja se abre, queda en la dirección y sigue en la pestaña Proyectos', pg.evaluate("document.querySelector('.hoja-agenda.abierta').id") == 'ficha-proyecto' and pg.evaluate('location.hash') == '#ficha-proyecto' and pg.evaluate("document.querySelector('.pestana[aria-selected=true]').textContent") == 'Proyectos')
        T.v(n + 'la lista se queda con el foco y actualiza «3 de 12»', pg.evaluate('document.activeElement.id') == 'selector-hoja-lista' and pg.inner_text('#selector-hoja-etq').lower().endswith('3 de 12'))
        pg.click('#ficha-proyecto .paso-sig'); pg.wait_for_timeout(400)
        T.v(n + 'con «Siguiente hoja» la lista cambia sola a la hoja nueva', pg.input_value('#selector-hoja-lista') == 'semana-tejiendo' and pg.inner_text('#selector-hoja-etq').lower().endswith('4 de 12'), pg.input_value('#selector-hoja-lista'))
        pg.click('.pestana:has-text("Tablero")'); pg.wait_for_timeout(300)
        T.v(n + 'una pestaña con una sola hoja (Tablero) no muestra la lista', pg.is_hidden('#selector-hoja'))
        pg.click('.pestana:has-text("Inicio")'); pg.wait_for_timeout(300)
        T.v(n + 'la pestaña Inicio muestra las suyas: Índice, Planeador, Portada y Aprende y compra', pg.evaluate(OPC) == ['indice-agenda', 'planeador-dia', 'portada-agenda', 'aprende-compra'] and pg.inner_text('#selector-hoja-etq').lower() == 'hojas de inicio · 1 de 4', pg.evaluate(OPC))
        pg.select_option('#selector-hoja-lista', 'aprende-compra'); pg.wait_for_timeout(300)
        T.v(n + 'se puede ir a otra hoja de la misma pestaña', pg.evaluate("document.querySelector('.hoja-agenda.abierta').id") == 'aprende-compra')
        pg.go_back(); pg.wait_for_timeout(400)
        T.v(n + 'el botón «atrás» del navegador vuelve a la hoja anterior y la lista la sigue', pg.input_value('#selector-hoja-lista') == pg.evaluate("document.querySelector('.hoja-agenda.abierta').id"), pg.input_value('#selector-hoja-lista'))
        if CAP:
            os.makedirs(CAP, exist_ok=True); pg.click('.pestana:has-text("Proyectos")'); pg.wait_for_timeout(300); pg.evaluate("document.querySelector('.agenda-layout').scrollIntoView()"); pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(CAP, 'lista-%d.png' % ancho))
        pg.emulate_media(media='print')
        T.v(n + 'al imprimir la lista no sale', pg.evaluate("getComputedStyle(document.getElementById('selector-hoja')).display") == 'none')
        T.v(n + 'sin desplazamiento horizontal', pg.evaluate("document.documentElement.scrollWidth <= innerWidth + 1"))
        T.v(n + 'sin errores de JavaScript', not pg.errs, pg.errs[:2]); ctx.close()
    # modo «hojas gratis»: una sola pestaña con sus 6 hojas
    ctx = contexto(b, 390); pg = abrir(ctx, '', 0); pg.goto(BASE + '/agenda-rosina.html?gratis=1'); pg.wait_for_timeout(1800)
    T.v('modo hojas gratis: la lista tiene las 6 hojas gratis', pg.evaluate("document.querySelectorAll('#selector-hoja-lista option').length") == 6 and 'hojas gratis' in pg.inner_text('#selector-hoja-etq').lower(), pg.inner_text('#selector-hoja-etq'))
    T.v('modo hojas gratis: sin errores de JavaScript', not pg.errs, pg.errs[:2]); ctx.close(); b.close()
T.fin()
