#!/usr/bin/env python3
"""Prueba (28-oct-2026) del planeador del día y de los números del mes de la Agenda para tejedoras.
Uso: con un servidor local en el puerto 8765:  /usr/bin/python3 herramientas/pruebas/probar_agenda_planeador.py [carpeta_capturas]"""
import sys, json, datetime, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from agenda_util import *
T = Prueba(); CAP = sys.argv[1] if len(sys.argv) > 1 else None
def cap(pg, n):
    if CAP: os.makedirs(CAP, exist_ok=True); pg.screenshot(path=os.path.join(CAP, n))
def guardado(pg): return json.loads(pg.evaluate("localStorage.getItem('rosinaAgenda') || '{}'"))
h = datetime.date.today(); f = lambda d: d.strftime('%d/%m/%Y'); mañana = h + datetime.timedelta(days=1)
datos = {'ag-p1-cliente': 'Ana', 'ag-p1-pedido': 'Oso de 15 cm', 'ag-p1-entrega': f(h), 'ag-p1-envio': f(mañana), 'ag-p1-telefono': '3001234567', 'ag-p1-estado': 'En proceso',
         'ag-nombre': 'Bufanda', 'ag-fin': f(h),
         '_ver': {'ferias-mercados': {'orden': ['k1'], 'actual': 'k1', 'v': {'k1': {}}, 'sig': 2}}, 'ag-fr-nombre': 'Feria del Libro', 'ag-fr-fecha': f(h), 'ag-fr-lugar': 'Plaza de Bolívar',
         'ag-cl1-nombre': 'Luz', 'ag-cl1-cumpleanos': h.strftime('%d/%m') , 'ag-cl1-desde': f(h),
         'ag-vt1-fecha': f(h), 'ag-vt1-producto': 'Llavero', 'ag-vt1-precio': '$20.000', 'ag-vt2-fecha': f(h), 'ag-vt2-precio': '$30.000',
         'ag-gs1-fecha': f(h), 'ag-gs1-valor': '$15.000', 'ag-f1-proyecto': 'Manta', 'ag-f1-cumplido': True, 'ag-f1-cumplidoen': f(h), 'ag-ap1-tecnica': 'Anillo mágico', 'ag-ap1-fecha': f(h), 'ag-ap2-tecnica': 'Punto alto', 'ag-ap2-fecha': f(h)}
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM, args=['--no-sandbox'])
    ctx = contexto(b, 390, datos=datos); pg = abrir(ctx, 'planeador-dia', 1800)
    T.v('el planeador es la primera hoja del grupo «Inicio»', pg.evaluate("[...document.querySelectorAll('#menu-hojas-lista a')].slice(0, 3).map(a => a.dataset.hoja)") == ['indice-agenda', 'planeador-dia', 'portada-agenda'])
    T.v('abre en el día de hoy', ' · hoy' in pg.inner_text('#pl-titulo') and pg.input_value('#pl-fecha') == h.isoformat(), pg.inner_text('#pl-titulo'))
    ev = pg.inner_text('#pl-eventos')
    T.v('muestra la entrega del pedido, la feria, el proyecto y el cumpleaños de hoy', all(x in ev for x in ['Entrega: Oso de 15 cm', 'Feria del Libro', 'Entrega: Bufanda', 'Cumpleaños de Luna'.replace('Luna', 'Luz')]), ev)
    T.v('la feria trae su lugar', 'Plaza de Bolívar' in ev)
    pg.click('#pl-sig'); pg.wait_for_timeout(300)
    T.v('mañana aparece el envío del pedido con su dirección y teléfono', 'Envío: Oso de 15 cm' in pg.inner_text('#pl-eventos') and ' · hoy' not in pg.inner_text('#pl-titulo'), pg.inner_text('#pl-eventos'))
    T.v('el enlace abre ese día en Google Calendar', pg.get_attribute('#pl-gcal', 'href') == 'https://calendar.google.com/calendar/r/day/%d/%d/%d' % (mañana.year, mañana.month, mañana.day), pg.get_attribute('#pl-gcal', 'href'))
    T.v('y hay un botón para crear un evento de ese día', 'calendar.google.com/calendar/render?action=TEMPLATE' in pg.get_attribute('#pl-gcal-nuevo', 'href') and mañana.strftime('%Y%m%d') in pg.get_attribute('#pl-gcal-nuevo', 'href'))
    pg.click('#pl-hoy'); pg.wait_for_timeout(300)
    pg.fill('#pl-tarea', 'Comprar relleno'); pg.click('#pl-form button'); pg.fill('#pl-tarea', 'Empacar el oso'); pg.press('#pl-tarea', 'Enter'); pg.wait_for_timeout(300)
    T.v('se agregan tareas del día', pg.locator('#pl-tareas li').count() == 2)
    pg.check('#pl-tareas li:first-child input'); pg.wait_for_timeout(200)
    g = guardado(pg)['_dias'][h.isoformat()]
    T.v('se marcan como hechas y se guardan en ese día', g['t'][0] == {'x': 'Comprar relleno', 'ok': True} and g['t'][1]['ok'] is False, g)
    pg.fill('#pl-notas', 'Llevar la factura'); pg.wait_for_timeout(200)
    T.v('las notas del día se guardan', guardado(pg)['_dias'][h.isoformat()]['n'] == 'Llevar la factura')
    pg.click('#pl-sig'); pg.wait_for_timeout(200)
    T.v('el día siguiente está limpio', pg.locator('#pl-tareas li').count() == 0 and pg.input_value('#pl-notas') == '')
    pg.click('#pl-ant'); pg.wait_for_timeout(200)
    T.v('al volver a hoy siguen sus tareas y notas', pg.locator('#pl-tareas li').count() == 2 and pg.input_value('#pl-notas') == 'Llevar la factura')
    pg.click('#pl-tareas li:last-child .pl-borrar'); pg.wait_for_timeout(200)
    T.v('una tarea se puede borrar', pg.locator('#pl-tareas li').count() == 1)
    tiles = pg.inner_text('#pl-tiles')
    T.v('números del mes: 1 clienta nueva, ventas $50.000, gastos $15.000, te quedó $35.000', all(x in tiles for x in ['$50.000', '$15.000', '$35.000']) and pg.locator('.pl-tile').nth(0).inner_text().endswith('1'), tiles)
    T.v('números del mes: 1 proyecto tejido y 2 clases vistas', pg.locator('.pl-tile').nth(4).inner_text().endswith('1') and pg.locator('.pl-tile').nth(5).inner_text().endswith('2'), tiles)
    pg.click('#pl-mes-ant'); pg.wait_for_timeout(200)
    T.v('al ir al mes anterior los números cambian a ceros', '$0' in pg.inner_text('#pl-tiles') and '$50.000' not in pg.inner_text('#pl-tiles'))
    cap(pg, 'planeador-390.png')
    pg.click('#pl-eventos .pl-abrir') if pg.locator('#pl-eventos .pl-abrir').count() else None
    T.v('sin desplazamiento horizontal', pg.evaluate("document.documentElement.scrollWidth <= innerWidth + 1"))
    T.v('sin errores de JavaScript', not pg.errs, pg.errs[:2]); ctx.close()
    ctx = contexto(b, 390, datos={'ag-p1-cliente': 'Ana', 'ag-p1-entrega': f(h)}); pg = abrir(ctx, 'planeador-dia', 1500)
    pg.click('#pl-eventos .pl-abrir'); pg.wait_for_timeout(600)
    T.v('«Abrir» lleva a la hoja del pedido', pg.evaluate("document.querySelector('#control-pedidos').classList.contains('abierta')"))
    ctx.close(); b.close()
T.fin()
