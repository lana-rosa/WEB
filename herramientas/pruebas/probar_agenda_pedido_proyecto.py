"""Pedido y proyecto unidos, horas y lana apartada (E34, 12-nov-2026). Uso: /usr/bin/python3 probar_agenda_pedido_proyecto.py"""
import json
from agenda_util import *
DATOS = {'ag-duena': 'Sara', 'ag-l1-marca': 'Alize', 'ag-l1-color': 'Rosa', 'ag-l1-ovillos': '4', 'ag-l2-marca': 'Gamitex', 'ag-l2-color': 'Rojo', 'ag-l2-ovillos': '1',
         'ag-f1-proyecto': 'Chaleco de María', 'ag-f1-estado': 'Tejiendo',
         'ag-p1-cliente': 'Ana Gómez', 'ag-p1-pedido': 'Osito de apego', 'ag-p1-totalcompra': '$ 80.000', 'ag-p1-abono': '$ 30.000', 'ag-p1-entrega': '20/11/2026',
         'ag-p2-cliente': 'Beto Ruiz', 'ag-p2-pedido': 'Osito de apego', 'ag-p2-totalcompra': '$ 60.000'}
T = Prueba()
def g(pg): return json.loads(pg.evaluate("localStorage.getItem('rosinaAgenda')") or '{}')
def fichas(pg, tabla): pg.evaluate("document.querySelectorAll('#%s tr.ficha .ficha-cab').forEach(b => { if (b.getAttribute('aria-expanded') !== 'true') b.click(); })" % tabla); pg.wait_for_timeout(500)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM)
    pg = abrir(contexto(b, 1280, 1000, datos=DATOS, config_abierta=False), 'control-pedidos', 2300, config=False); fichas(pg, 'tabla-pedidos')
    P = lambda n: '#tabla-pedidos tr.ficha[data-fila="%d"] td.pd-proyecto' % n; Y = lambda n: '#tabla-fila tr.ficha[data-fila="%d"] td.pp-pedido' % n
    T.v('el pedido tiene «Proyecto de este pedido» con «Crear» y la lista para vincular el proyecto que ya existe', pg.locator(P(1) + ' button:has-text("Crear proyecto")').count() == 1 and pg.locator(P(1) + ' select option').count() == 1)
    pg.click(P(1) + ' button:has-text("Crear proyecto")'); pg.wait_for_timeout(900)
    d = g(pg)
    T.v('crear llena el proyecto 2: producto, clienta, entrega y «Por empezar»', d.get('ag-f2-proyecto') == 'Osito de apego' and d.get('ag-f2-para') == 'Ana Gómez' and d.get('ag-f2-fecha') == '20/11/2026' and d.get('ag-f2-estado') == 'Por empezar', {k: v for k, v in d.items() if k.startswith('ag-f2')})
    T.v('guarda el vínculo pedido 1 → proyecto 2 y el proyecto 1 no se toca', d['_pedProy'] == {'p1': 2} and d['ag-f1-proyecto'] == 'Chaleco de María')
    t = pg.inner_text(P(1))
    T.v('el pedido muestra el proyecto, su estado y las horas en 0', 'Osito de apego' in t and 'Estado: Por empezar' in t and 'Horas tejidas: 0 min' in t and 'Aún no apartaste lana' in t, t)
    # segundo pedido con el mismo producto: nombre único
    pg.click(P(2) + ' button:has-text("Crear proyecto")'); pg.wait_for_timeout(800)
    d = g(pg); nombres = [d.get('ag-f%d-proyecto' % i) for i in (1, 2, 3)]
    T.v('un segundo pedido con el mismo producto crea un proyecto con nombre distinto', nombres[2] and nombres[2] != nombres[1] and len(set(nombres)) == 3, nombres)
    # vincular uno existente: deshacer el vínculo del pedido 2 y unirlo al Chaleco
    pg.evaluate("window.lrIrAHoja('control-pedidos')"); pg.wait_for_timeout(500); fichas(pg, 'tabla-pedidos')
    pg.click(P(2) + ' button:has-text("Quitar el vínculo")'); pg.wait_for_timeout(700)
    pg.select_option(P(2) + ' select', label='Chaleco de María'); pg.click(P(2) + ' button:has-text("Vincular")'); pg.wait_for_timeout(800)
    T.v('«Vincular» une el pedido 2 con el proyecto 1 que ya existía', g(pg)['_pedProy'].get('p2') == 1 and 'Chaleco de María' in pg.inner_text(P(2)))
    # horas del cronómetro y valor de la hora
    pg.evaluate("(() => { const d = JSON.parse(localStorage.getItem('rosinaAgenda')); d._proyTiempo = { 'osito de apego': { seg: 5400, desde: 0, dias: {} } }; d._costos = { hora: '$ 10.000', margen: '' }; localStorage.setItem('rosinaAgenda', JSON.stringify(d)); })()")
    pg.reload(); pg.wait_for_timeout(2300); fichas(pg, 'tabla-pedidos')
    t = pg.inner_text(P(1))
    T.v('el pedido muestra las horas tejidas (1 h 30 min) y lo que vale ese tiempo (≈ $15.000)', 'Horas tejidas: 1 h 30 min' in t and '$15.000' in t, t)
    # lana apartada
    pg.evaluate("window.lrIrAHoja('proyectos-fila')"); pg.wait_for_timeout(900); fichas(pg, 'tabla-fila')
    L = lambda n: '#tabla-fila tr.ficha[data-fila="%d"] td.pl-lana' % n
    pg.select_option(L(2) + ' select', 'Alize · Rosa'); pg.fill(L(2) + ' .pl-n', '3'); pg.click(L(2) + ' button:has-text("Agregar a la lista")'); pg.wait_for_timeout(800)
    T.v('la lana agregada queda «apartada» y no hay aviso mientras alcanza', 'apartada' in pg.inner_text(L(2)) and pg.locator(L(2) + ' li.falta').count() == 0, pg.inner_text(L(2)))
    pg.select_option(L(1) + ' select', 'Alize · Rosa'); pg.fill(L(1) + ' .pl-n', '3'); pg.click(L(1) + ' button:has-text("Agregar a la lista")'); pg.wait_for_timeout(800)
    T.v('si entre dos proyectos se aparta más de lo que hay (6 de 4) avisa que faltan 2', 'no alcanza' in pg.inner_text(L(1)) and 'Te faltan 2 ovillo(s) de Alize · Rosa' in pg.inner_text(L(1)) and pg.locator(L(2) + ' li.falta').count() == 1, pg.inner_text(L(1)))
    pg.evaluate("window.lrIrAHoja('control-pedidos')"); pg.wait_for_timeout(700); fichas(pg, 'tabla-pedidos')
    t = pg.inner_text(P(1))
    T.v('el pedido muestra la lana del proyecto con el aviso «faltan 2»', '3 × Alize · Rosa' in t and 'faltan 2' in t, t)
    pg.evaluate("window.lrIrAHoja('inventario-lanas')"); pg.wait_for_timeout(900); fichas(pg, 'tabla-lanas')
    ti = pg.inner_text('#tabla-lanas tr.ficha[data-fila="1"] td.iv-apartada') if pg.locator('#tabla-lanas tr.ficha[data-fila="1"] td.iv-apartada').count() else ''
    T.v('la ficha de la lana en el inventario dice cuánto está apartado y que faltan 2', 'Apartados para proyectos: 6' in ti and 'te faltan 2' in ti, ti)
    T.v('la lana que no se apartó no muestra nada', pg.locator('#tabla-lanas tr.ficha[data-fila="2"] td.iv-apartada').count() == 0)
    # ver proyecto / ver pedido
    pg.evaluate("window.lrIrAHoja('control-pedidos')"); pg.wait_for_timeout(700); fichas(pg, 'tabla-pedidos')
    pg.click(P(1) + ' button:has-text("Ver proyecto")'); pg.wait_for_timeout(1200)
    T.v('«Ver proyecto» abre la hoja de proyectos', pg.evaluate("document.getElementById('proyectos-fila').classList.contains('abierta')"))
    T.v('el proyecto muestra «Del pedido de Ana Gómez» con lo que falta por cobrar', 'Del pedido de Ana Gómez' in pg.inner_text(Y(2)) and 'falta por cobrar $50.000' in pg.inner_text(Y(2)), pg.inner_text(Y(2)))
    pg.click(Y(2) + ' button:has-text("Ver pedido")'); pg.wait_for_timeout(1200)
    T.v('«Ver pedido» regresa a la hoja de pedidos', pg.evaluate("document.getElementById('control-pedidos').classList.contains('abierta')"))
    # quitar el vínculo no borra nada; vaciar el proyecto borra el vínculo
    fichas(pg, 'tabla-pedidos'); pg.click(P(1) + ' button:has-text("Quitar el vínculo")'); pg.wait_for_timeout(800)
    d = g(pg)
    T.v('quitar el vínculo conserva el proyecto y su lana', 'p1' not in d['_pedProy'] and d['ag-f2-proyecto'] == 'Osito de apego' and d['_proyLana']['osito de apego'])
    pg.click(P(2) + ' button:has-text("Quitar el vínculo")'); pg.wait_for_timeout(600)
    pg.evaluate("window.lrPedidoProyecto.vincular(1, 2)"); pg.wait_for_timeout(600)
    pg.evaluate("(() => { const e = document.getElementById('ag-f2-proyecto'); e.value = ''; e.dispatchEvent(new Event('input', {bubbles:true})); })()"); pg.wait_for_timeout(1200)
    T.v('si el proyecto se vacía, el vínculo se borra solo', 'p1' not in g(pg).get('_pedProy', {}))
    T.v('sin errores de JavaScript', not pg.errs, pg.errs)
    b.close()
T.fin()
