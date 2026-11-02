#!/usr/bin/env python3
"""Prueba (2-nov-2026): metas de ahorro y planes del negocio con un solo formulario + «Agregar» + lista.
Uso: servidor local en el puerto 8765:  /usr/bin/python3 herramientas/pruebas/probar_agenda_metas_planes.py"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from agenda_util import *
T = Prueba()
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM, args=['--no-sandbox'])
    ctx = contexto(b, 390, 844, datos={'ag-duena': 'Sara'}); pg = abrir(ctx, 'fin-presupuesto', 1500)
    T.v('sin metas ni planes no hay renglones en blanco', pg.locator('.fin-meta').count() == 0 and pg.locator('.fin-plan').count() == 0)
    pg.click('#fm-agregar'); T.v('sin nombre ni valor pide los datos', 'nombre' in pg.inner_text('#fm-msg') and pg.locator('.fin-meta').count() == 0)
    pg.fill('#fm-n', 'Máquina de coser'); pg.fill('#fm-meta', '1200000'); pg.fill('#fm-ah', '300000'); pg.click('#fm-agregar'); pg.wait_for_timeout(200)
    T.v('agrega una meta y limpia el formulario', pg.locator('.fin-meta').count() == 1 and pg.input_value('#fm-n') == '')
    T.v('la meta muestra lo que falta', '900.000' in pg.inner_text('.fin-meta'), pg.inner_text('.fin-meta'))
    pg.fill('.fin-meta input', '600000'); pg.press('.fin-meta input', 'Tab'); pg.wait_for_timeout(200)
    T.v('cambiar lo ahorrado actualiza la meta', '600.000' in pg.inner_text('.fin-meta') and pg.evaluate("JSON.parse(localStorage.rosinaAgenda)._fin.metas[0].ahorrado") == 600000)
    pg.fill('#fp-n', 'Viaje'); pg.select_option('#fp-mes', '12'); pg.fill('#fp-c', '500000'); pg.click('#fp-agregar'); pg.wait_for_timeout(200)
    T.v('agrega un plan y calcula lo que hay que apartar', pg.locator('.fin-plan').count() == 1 and 'al mes' in pg.inner_text('#fin-planes-info'), pg.inner_text('#fin-planes-info'))
    pg.check('.fin-plan input[type=checkbox]'); pg.wait_for_timeout(200)
    T.v('al marcar «Listo» ya no cuenta', pg.inner_text('#fin-planes-info') == '')
    pg.click('.fin-meta .quitar'); pg.click('.fin-plan .quitar'); pg.wait_for_timeout(200)
    T.v('borrar quita la meta y el plan', pg.locator('.fin-meta').count() == 0 and pg.locator('.fin-plan').count() == 0)
    T.v('celular: sin desplazamiento horizontal', pg.evaluate("document.documentElement.scrollWidth <= innerWidth"))
    T.v('sin errores de JavaScript', not pg.errs, pg.errs[:2]); ctx.close()
T.fin()
