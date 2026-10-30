"""Mi panel, menú lateral y vista de sección de la Agenda para tejedoras (30-oct-2026). Uso: /usr/bin/python3 probar_agenda_panel.py"""
from agenda_util import *
import datetime
hoy = datetime.date.today(); f = lambda d: d.strftime('%d/%m/%Y')
DATOS = {'ag-duena': 'Sara Pérez',
         'ag-vt1-fecha': f(hoy), 'ag-vt1-producto': 'Osito', 'ag-vt1-cliente': 'María', 'ag-vt1-precio': '$ 85.000', 'ag-vt1-costo': '$ 20.000',
         'ag-vt2-fecha': f(hoy), 'ag-vt2-producto': 'Manta', 'ag-vt2-cliente': 'Laura', 'ag-vt2-precio': '$ 150.000', 'ag-vt2-costo': '$ 40.000',
         'ag-gs1-fecha': f(hoy), 'ag-gs1-detalle': 'Lana', 'ag-gs1-valor': '$ 60.000', 'ag-gs1-categoria': 'Materiales',
         'ag-p1-cliente': 'María Gómez', 'ag-p1-pedido': 'Osito', 'ag-p1-entrega': f(hoy + datetime.timedelta(days=3)), 'ag-p1-estado': 'En proceso', 'ag-p1-totalcompra': '$ 85.000', 'ag-p1-abono': '$ 45.000',
         'ag-p2-cliente': 'Laura', 'ag-p2-pedido': 'Manta', 'ag-p2-entrega': f(hoy), 'ag-p2-estado': 'Entregado', 'ag-p2-totalcompra': '$ 150.000', 'ag-p2-abono': '$ 150.000',
         'ag-f1-proyecto': 'Chaleco de María', 'ag-f1-para': 'María', 'ag-f1-estado': 'Tejiendo', 'ag-f2-proyecto': 'Manta bebé', 'ag-f2-estado': 'Por empezar', 'ag-f3-proyecto': 'Ya listo', 'ag-f3-estado': 'Terminado'}
T = Prueba()
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM)
    # --- computador con datos
    pg = abrir(contexto(b, 1280, 900, datos=DATOS, config_abierta=False), '', 2200, config=False)
    T.v('abre en «Mi panel» sin ancla', pg.evaluate("document.getElementById('panel-agenda').classList.contains('abierta')"))
    T.v('sin errores de JavaScript', not pg.errs, pg.errs)
    T.v('saludo con el primer nombre', 'Sara' in pg.inner_text('.pn-saludo h4') and 'Pérez' not in pg.inner_text('.pn-saludo h4'), pg.inner_text('.pn-saludo h4'))
    k = pg.inner_text('.pn-kpis')
    T.v('ventas del mes = 235.000', '235.000' in k, k)
    T.v('gastos del mes = 60.000', '60.000' in k, k)
    T.v('«Te quedó» = 175.000', '175.000' in k, k)
    T.v('pedidos activos = 1 (el entregado no cuenta)', pg.evaluate("[...document.querySelectorAll('.pn-kpi')].find(x=>/Pedidos activos/.test(x.innerText)).querySelector('strong').textContent") == '1')
    T.v('por cobrar 40.000', 'Por cobrar $ 40.000' in k, k)
    T.v('próximas fechas incluye la entrega del pedido', 'Osito' in pg.inner_text('.pn-dos'), pg.inner_text('.pn-dos'))
    pr = pg.inner_text('.pn-dos')
    T.v('proyectos en curso: el que teje y el por empezar, no el terminado', 'Chaleco de María' in pr and 'Manta bebé' in pr and 'Ya listo' not in pr, pr)
    T.v('el menú lateral tiene 7 secciones', pg.locator('.pestana').count() == 7, pg.locator('.pestana').count())
    T.v('el menú lateral está a la izquierda del contenido', pg.evaluate("document.querySelector('.pestanas-agenda').getBoundingClientRect().right <= document.querySelector('.hojas-contenido').getBoundingClientRect().left + 1"))
    T.v('sin desbordes laterales', not pg.evaluate("document.documentElement.scrollWidth>innerWidth"))
    T.v('«Mi panel» marcada en el menú', pg.evaluate("document.querySelectorAll('.pestana')[0].getAttribute('aria-selected')") == 'true')
    T.v('el dibujo de Rosina no se ve en las cabeceras', pg.evaluate("[...document.querySelectorAll('#agenda .hoja-agenda > header > img')].every(i=>getComputedStyle(i).display==='none')"))
    # acción rápida
    pg.click('.pn-accion:has-text("Anotar venta")'); pg.wait_for_timeout(500)
    T.v('«Anotar venta» abre Mis ventas del mes', pg.evaluate("document.getElementById('ventas-mes').classList.contains('abierta')"))
    # sección
    pg.evaluate("document.querySelectorAll('.pestana')[4].click()"); pg.wait_for_timeout(400)
    T.v('al tocar «Mi emprendimiento» se ve la vista de sección', pg.evaluate("!document.getElementById('vista-seccion').hidden"))
    T.v('la vista muestra 8 hojas como tarjetas', pg.locator('.vs-hoja').count() == 8, pg.locator('.vs-hoja').count())
    T.v('ninguna hoja queda abierta detrás', pg.evaluate("document.querySelectorAll('#agenda .hoja-agenda.abierta').length") == 0)
    T.v('el título de la vista recibe el foco', pg.evaluate("document.activeElement.id") == 'vs-titulo', pg.evaluate("document.activeElement.id"))
    T.v('la sección queda marcada en el menú', pg.evaluate("document.querySelectorAll('.pestana')[4].getAttribute('aria-selected')") == 'true')
    pg.locator('.vs-hoja', has_text='Control de pedidos').click(); pg.wait_for_timeout(500)
    T.v('al tocar una tarjeta se abre esa hoja', pg.evaluate("document.getElementById('control-pedidos').classList.contains('abierta')"))
    T.v('y la vista de sección se oculta', pg.evaluate("document.getElementById('vista-seccion').hidden"))
    pg.evaluate("document.querySelectorAll('.pestana')[0].click()"); pg.wait_for_timeout(400)
    T.v('«Mi panel» vuelve al panel', pg.evaluate("document.getElementById('panel-agenda').classList.contains('abierta')"))
    pg.evaluate("document.querySelectorAll('.pestana')[1].click()"); pg.wait_for_timeout(400)
    T.v('«Mi tablero» (una sola hoja) la abre directo', pg.evaluate("document.getElementById('tablero-agenda').classList.contains('abierta')"))
    # ancla directa
    pg2 = abrir(contexto(b, 1280, 900, datos=DATOS, config_abierta=False), 'inventario-lanas', 1800, config=False)
    T.v('una ancla directa sigue abriendo esa hoja', pg2.evaluate("document.getElementById('inventario-lanas').classList.contains('abierta')"))
    # --- sin datos
    pv = abrir(contexto(b, 1280, 900, config_abierta=False), '', 2000, config=False)
    T.v('sin datos: mensajes de ayuda en vez de listas vacías', pv.locator('.pn-vacio').count() == 2, pv.locator('.pn-vacio').count())
    T.v('sin datos: saludo sin nombre', pv.inner_text('.pn-saludo h4').startswith('Buen') and ',' not in pv.inner_text('.pn-saludo h4'), pv.inner_text('.pn-saludo h4'))
    # --- celular
    pc = abrir(contexto(b, 390, 844, datos=DATOS, config_abierta=False), '', 2200, config=False)
    T.v('celular: sin desbordes laterales', not pc.evaluate("document.documentElement.scrollWidth>innerWidth"))
    T.v('celular: el menú es una barra fija abajo', pc.evaluate("(()=>{const r=document.querySelector('.pestanas-agenda').getBoundingClientRect();return getComputedStyle(document.querySelector('.pestanas-agenda')).position==='fixed'&&Math.abs(r.bottom-innerHeight)<2})()"))
    T.v('celular: los 7 botones de la barra miden al menos 44 px de alto', pc.evaluate("[...document.querySelectorAll('.pestana')].every(b=>b.getBoundingClientRect().height>=44)"))
    T.v('celular: nombres cortos en la barra', pc.evaluate("[...document.querySelectorAll('.pestana .p-corto')].every(s=>getComputedStyle(s).display!=='none')"))
    T.v('celular: WhatsApp flotante queda encima de la barra', pc.evaluate("document.querySelector('.whatsapp-flotante').getBoundingClientRect().bottom <= document.querySelector('.pestanas-agenda').getBoundingClientRect().top + 1"))
    pc.evaluate("document.querySelectorAll('.pestana')[3].click()"); pc.wait_for_timeout(400)
    T.v('celular: la vista de sección se ve en una columna', pc.evaluate("(()=>{const r=[...document.querySelectorAll('.vs-hoja')].map(x=>Math.round(x.getBoundingClientRect().left));return r.length>0&&r.every(x=>x===r[0])})()"))
    T.v('celular: sin desbordes en la vista de sección', not pc.evaluate("document.documentElement.scrollWidth>innerWidth"))
    b.close()
T.fin()
