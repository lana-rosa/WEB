#!/usr/bin/env python3
"""Prueba (29-oct-2026) de las finanzas de la agenda como finanzas del NEGOCIO (nombres, categorías, escritura natural, sin filtro personal)
y de la barra de abajo de las fichas (Agregar · Añadir a Google Calendar · Borrar).
Uso: con un servidor local en el puerto 8765:  /usr/bin/python3 herramientas/pruebas/probar_agenda_finanzas_negocio.py"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from agenda_util import *
T = Prueba()
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM, args=['--no-sandbox'])
    ctx = contexto(b, 1280, 900, datos={'ag-duena': 'Sara'}); pg = abrir(ctx, 'fin-movimientos', 1500)
    T.v('la pestaña se llama «Finanzas» y el grupo «Finanzas del negocio»', 'Finanzas' in pg.evaluate("[...document.querySelectorAll('#pestanas-agenda .pestana')].map(b => b.textContent)") and 'Finanzas del negocio' in pg.evaluate("[...document.querySelectorAll('#menu-hojas-lista .menu-grupo')].map(b => b.textContent)"))
    nombres = pg.evaluate("['fin-resumen','fin-movimientos','fin-presupuesto','fin-fijos','fin-tcredito','fin-analisis'].map(i => document.querySelector('#' + i + ' h3').textContent)")
    T.v('todas las hojas de finanzas dicen que son del negocio', nombres == ['Mi negocio en números', 'Ingresos y gastos del negocio', 'Presupuesto y metas del negocio', 'Gastos fijos y deudas del negocio', 'Tarjetas del negocio', 'Análisis del negocio'], nombres)
    T.v('ya no hay casilla «Es del negocio» ni filtro personal a la vista', not pg.locator('#fin-neg').is_visible() and not pg.locator('#fin-fil-neg').is_visible())
    T.v('el ejemplo ya no habla de «mercado»', 'mercado' not in pg.get_attribute('#fin-texto', 'placeholder').lower() and 'lana' in pg.get_attribute('#fin-texto', 'placeholder'))
    pg.fill('#fin-texto', 'gasté 50 mil en lana'); pg.press('#fin-texto', 'Enter'); pg.wait_for_timeout(300)
    pg.fill('#fin-texto', 'vendí 120000 un amigurumi'); pg.press('#fin-texto', 'Enter'); pg.wait_for_timeout(300)
    pg.fill('#fin-texto', 'gasté 18 mil en envío servientrega'); pg.press('#fin-texto', 'Enter'); pg.wait_for_timeout(300)
    fin = pg.evaluate("JSON.parse(localStorage.getItem('rosinaAgenda'))._fin.movs.map(m => [m.t, m.c, m.v])")
    T.v('la escritura natural reconoce lana, venta y envío como categorías del negocio', fin == [['g', 'Materiales (lanas)', 50000], ['i', 'Ventas', 120000], ['g', 'Transporte y envíos', 18000]], fin)
    pg.evaluate("document.querySelector('#menu-hojas-lista a[data-hoja=\"fin-negocio\"]').click()"); pg.wait_for_timeout(500)
    t = pg.inner_text('#fn-tarjetas')
    T.v('Resultados del negocio cuenta todo lo anotado (utilidad $52.000)', '52.000' in t, t)
    cats = pg.evaluate("[...document.querySelectorAll('#fin-c option')].map(o => o.value)")
    T.v('la lista de categorías de gasto es del negocio', 'Empaques' in cats and 'Vivienda' not in cats and 'Mercado' not in cats, cats)
    T.v('sin errores de JavaScript', not pg.errs, pg.errs[:2]); ctx.close()
    # barra de las fichas
    ctx = contexto(b, 390, 844, datos={'ag-cl1-nombre': 'Sara', 'ag-cl1-whatsapp': '3205072801', 'ag-cl1-cumpleanos': '13/01/2007'}); pg = abrir(ctx, 'mis-clientas', 1500)
    pg.evaluate("window.__a = []; window.open = (u) => { window.__a.push(u); return null; }")
    T.v('con la ficha cerrada Añadir a Google Calendar y Borrar esperan (desactivados)', pg.locator('#mis-clientas .barra-cal').is_disabled() and pg.locator('#mis-clientas .barra-borrar').is_disabled())
    pg.click('#tabla-clientas tr[data-fila="1"] .ficha-cab'); pg.wait_for_timeout(300)
    T.v('al abrir la ficha se activan', pg.locator('#mis-clientas .barra-cal').is_enabled() and pg.locator('#mis-clientas .barra-borrar').is_enabled())
    pg.click('#mis-clientas .barra-cal'); pg.wait_for_timeout(300)
    T.v('«Añadir a Google Calendar» de la barra abre Google Calendar con el cumpleaños', 'calendar.google.com' in str(pg.evaluate("window.__a[window.__a.length - 1]")), pg.evaluate("window.__a"))
    T.v('celular: sin desplazamiento horizontal y errores', pg.evaluate("document.documentElement.scrollWidth <= innerWidth + 1") and not pg.errs, pg.errs[:2]); ctx.close()
    b.close()
T.fin()
