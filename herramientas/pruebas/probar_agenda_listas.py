#!/usr/bin/env python3
"""Prueba (27-oct-2026) de las demás hojas con fichas: ventas por mes, proyectos en fila, patrones, lo que aprendí, agujas, inventario y Mercería.
Uso: con un servidor local en el puerto 8765:  /usr/bin/python3 herramientas/pruebas/probar_agenda_listas.py [carpeta_capturas]"""
import sys, json, datetime, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from agenda_util import *
T = Prueba(); CAP = sys.argv[1] if len(sys.argv) > 1 else None
def cap(pg, n):
    if CAP: os.makedirs(CAP, exist_ok=True); pg.screenshot(path=os.path.join(CAP, n))
MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
h = datetime.date.today()
def vis(pg, tabla): return pg.evaluate("t => [...document.querySelectorAll('#'+t+' tr.ficha')].filter(x => !x.hidden && !x.classList.contains('fuera-mes')).map(x => [+x.dataset.fila, x.classList.contains('abierta')])", tabla)
def meta(pg, tabla, r): return pg.inner_text('#%s tr[data-fila="%d"] .ficha-meta' % (tabla, r))
MERC = [{'id': '1', 'nombre': 'Hilo Alize', 'categoria': 'Lanas', 'marca': 'Alize', 'color': 'Rosa', 'peso_gramos': 100, 'precio_gramo': 60, 'stock_actual': 500},
        {'id': '2', 'nombre': 'Aguja 3 mm', 'categoria': 'Agujas', 'marca': '', 'color': '', 'peso_gramos': 0, 'precio_gramo': 8000, 'stock_actual': 3},
        {'id': '3', 'nombre': 'Relleno', 'categoria': 'Relleno', 'marca': '', 'color': '', 'peso_gramos': 0, 'precio_gramo': 12000, 'stock_actual': 0}]
def con_merceria(ctx, datos):
    ctx.route('**/rest/v1/rpc/obtener_merceria_web', lambda r: r.fulfill(status=200, content_type='application/json', body=json.dumps(datos)))
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM, args=['--no-sandbox'])
    # ventas por mes
    ant = (h.replace(day=1) - datetime.timedelta(days=1)); k_ant = '%s %d' % (MESES[ant.month - 1], ant.year); k_hoy = '%s %d' % (MESES[h.month - 1], h.year)
    nxt_m = h.month % 12 + 1; nxt_y = h.year + (1 if h.month == 12 else 0); k_sig = '%s %d' % (MESES[nxt_m - 1], nxt_y)
    datos = {'ag-vt1-fecha': ant.strftime('%d/%m/%Y'), 'ag-vt1-producto': 'Oso', 'ag-vt1-precio': '$50.000', 'ag-vt1-costo': '$10.000',
             'ag-vt2-fecha': h.strftime('%d/%m/%Y'), 'ag-vt2-producto': 'Llavero', 'ag-vt2-precio': '$20.000', 'ag-vt2-costo': '$5.000',
             'ag-vt3-fecha': h.strftime('%d/%m/%Y'), 'ag-vt3-producto': 'Gorro', 'ag-vt3-precio': '$30.000', 'ag-vt3-costo': '$8.000'}
    ctx = contexto(b, 390, datos=datos); pg = abrir(ctx, 'ventas-mes')
    opts = pg.evaluate("[...document.querySelectorAll('#vt-mes option')].map(o => o.textContent)")
    T.v('ventas: la lista trae «Todos» y cada mes con su nombre y cuántas ventas tiene', opts == ['Todos los meses', k_ant + ' (1)', k_hoy + ' (2)'], opts)
    T.v('se abre en el mes actual con sus dos ventas', pg.input_value('#vt-mes') == str(h.year * 100 + h.month) and [x[0] for x in vis(pg, 'tabla-ventas')] == [2, 3], vis(pg, 'tabla-ventas'))
    T.v('los totales son del mes elegido ($50.000 y $13.000 de materiales → te quedó $37.000)', '$50.000' in pg.inner_text('#totales-ventas') and '$13.000' in pg.inner_text('#totales-ventas') and '$37.000' in pg.inner_text('#totales-ventas'), pg.inner_text('#totales-ventas'))
    pg.select_option('#vt-mes', str(ant.year * 100 + ant.month)); pg.wait_for_timeout(200)
    T.v('al elegir el mes anterior se ve solo su venta y sus totales', [x[0] for x in vis(pg, 'tabla-ventas')] == [1] and '$40.000' in pg.inner_text('#totales-ventas'), pg.inner_text('#totales-ventas'))
    pg.click('#vt-mes-sig'); pg.wait_for_timeout(300)
    T.v('«Agregar el mes siguiente» deja listo el mes que sigue del último', pg.evaluate("document.querySelector('#vt-mes option:checked').textContent").startswith(k_sig), pg.evaluate("document.querySelector('#vt-mes option:checked').textContent"))
    pg.click('#ventas-mes .agregar-renglon'); pg.wait_for_timeout(500)
    nueva = [x for x in vis(pg, 'tabla-ventas') if x[1]]
    T.v('la venta nueva queda en el mes elegido (fecha puesta sola)', len(nueva) == 1 and pg.input_value('#ag-vt%d-fecha' % nueva[0][0]).endswith('/%02d/%d' % (nxt_m, nxt_y)), pg.input_value('#ag-vt%d-fecha' % (nueva[0][0] if nueva else 4)))
    pg.select_option('#vt-mes', ''); pg.wait_for_timeout(200)
    T.v('«Todos los meses» muestra todas las ventas', len(vis(pg, 'tabla-ventas')) == 4)
    cap(pg, 'listas-ventas-390.png')
    T.v('sin errores de JavaScript', not pg.errs, pg.errs[:2]); ctx.close()
    # proyectos en fila: casilla de cumplido
    ctx = contexto(b, 390, datos={'ag-f1-proyecto': 'Manta', 'ag-f1-para': 'Abuela', 'ag-f1-fecha': (h + datetime.timedelta(days=1)).strftime('%d/%m/%Y'), 'ag-f2-proyecto': 'Gorro', 'ag-f2-estado': 'Tejiendo'}); pg = abrir(ctx, 'proyectos-fila')
    T.v('proyectos en fila: dos fichas cerradas', vis(pg, 'tabla-fila') == [[1, False], [2, False]], vis(pg, 'tabla-fila'))
    T.v('el proyecto con fecha cercana avisa', 'En 1 día' in meta(pg, 'tabla-fila', 1), meta(pg, 'tabla-fila', 1))
    pg.click('#tabla-fila tr[data-fila="1"] .ficha-cab'); pg.wait_for_timeout(200)
    pg.check('#ag-f1-cumplido'); pg.wait_for_timeout(400)
    g = json.loads(pg.evaluate("localStorage.getItem('rosinaAgenda')"))
    T.v('marcar «Ya lo cumplí» se guarda y pasa el estado a Terminado', g.get('ag-f1-cumplido') is True and g.get('ag-f1-estado') == 'Terminado', {k: v for k, v in g.items() if k.startswith('ag-f1')})
    T.v('el proyecto cumplido muestra la etiqueta, ya no avisa y pasa al final', 'Cumplido' in meta(pg, 'tabla-fila', 1) and 'En 1 día' not in meta(pg, 'tabla-fila', 1) and pg.evaluate("document.querySelector('#tabla-fila tr[data-fila=\"1\"]').classList.contains('al-final')"))
    T.v('sin errores de JavaScript', not pg.errs, pg.errs[:2]); ctx.close()
    # patrones
    ctx = contexto(b, 390, datos={'ag-pt1-patron': 'Zorro', 'ag-pt1-fuente': 'Ravelry\nlink largo https://x.co/abc'}); pg = abrir(ctx, 'coleccion-patrones')
    T.v('patrones: cada pregunta es un renglón (ya lo guardé y dónde lo guardé)', pg.locator('#ag-pt1-guardado').count() == 1 and pg.evaluate("document.getElementById('ag-pt1-dondeguardo').tagName") == 'TEXTAREA')
    pg.click('#tabla-patrones tr[data-fila="1"] .ficha-cab'); pg.wait_for_timeout(200)
    pg.check('#ag-pt1-guardado'); pg.fill('#ag-pt1-dondeguardo', 'Carpeta Patrones en el celular'); pg.wait_for_timeout(300)
    T.v('se guarda si ya guardó el patrón y dónde', json.loads(pg.evaluate("localStorage.getItem('rosinaAgenda')")).get('ag-pt1-dondeguardo') == 'Carpeta Patrones en el celular' and 'Guardado' in meta(pg, 'tabla-patrones', 1))
    alto = pg.evaluate("document.getElementById('ag-pt1-fuente').getBoundingClientRect().height")
    T.v('«Dónde lo encontré» ocupa al menos un renglón y crece con el texto', alto > 40, alto)
    T.v('sin errores de JavaScript', not pg.errs, pg.errs[:2]); ctx.close()
    # lo que aprendí
    ctx = contexto(b, 390, datos={'ag-ap1-tecnica': 'Anillo mágico', 'ag-ap1-donde': 'Taller', 'ag-ap2-tecnica': 'Punto alto', 'ag-ap2-domino': True}); pg = abrir(ctx, 'lo-que-aprendi')
    T.v('lo que aprendí: lo que ya domina queda cerrado y compacto al final', vis(pg, 'tabla-aprendi') == [[1, False], [2, False]] and pg.evaluate("document.querySelector('#tabla-aprendi tr[data-fila=\"2\"]').classList.contains('al-final')"))
    pg.click('#tabla-aprendi tr[data-fila="1"] .ficha-cab'); pg.check('#ag-ap1-domino'); pg.wait_for_timeout(400)
    T.v('al marcar «Ya lo domino» la ficha se minimiza sola', vis(pg, 'tabla-aprendi')[0] == [1, False], vis(pg, 'tabla-aprendi'))
    pg.click('#tabla-aprendi tr[data-fila="2"] .ficha-cab'); pg.wait_for_timeout(200)
    T.v('al tocar una dominada se ve toda su ficha', pg.is_visible('#ag-ap2-tecnica') and pg.is_visible('#ag-ap2-donde'))
    T.v('sin errores de JavaScript', not pg.errs, pg.errs[:2]); ctx.close()
    # agujas
    comprada_vieja = '%d' % (h.year - 3); comprada_nueva = '%s %d' % (MESES[h.month - 1].lower()[:3], h.year)
    ctx = contexto(b, 390, datos={'ag-ag1-medida': '3', 'ag-ag1-material': 'Bambú o madera', 'ag-ag1-compra': 'ene ' + comprada_vieja, 'ag-ag2-medida': '4', 'ag-ag2-material': 'Aluminio', 'ag-ag2-compra': comprada_nueva}); con_merceria(ctx, MERC); pg = abrir(ctx, 'mis-agujas')
    T.v('agujas: la de bambú comprada hace 3 años dice que la cambie', 'Cámbiala' in meta(pg, 'tabla-agujas', 1), meta(pg, 'tabla-agujas', 1))
    T.v('la de aluminio comprada este mes no avisa', 'Cámbiala' not in meta(pg, 'tabla-agujas', 2) and 'Revísala' not in meta(pg, 'tabla-agujas', 2), meta(pg, 'tabla-agujas', 2))
    T.v('arriba de la lista sale el aviso con la guía general', 'para cambiar' in pg.inner_text('#mis-agujas .aviso-agujas'), pg.inner_text('#mis-agujas .aviso-agujas'))
    opts = pg.evaluate("[...document.querySelectorAll('#mis-agujas .merc-sel option')].map(o => o.textContent)")
    T.v('agujas: ofrece las agujas de la Mercería con existencias (y no las lanas)', any('Aguja 3 mm' in o for o in opts) and not any('Alize' in o for o in opts), opts)
    pg.select_option('#mis-agujas .merc-sel', index=1); pg.click('#mis-agujas .merc-add'); pg.wait_for_timeout(400)
    T.v('al agregarla va a la lista de compras con su precio', 'Aguja 3 mm' in json.loads(pg.evaluate("localStorage.getItem('rosinaAgenda')")).get('ag-c1-material', ''))
    cap(pg, 'listas-agujas-390.png')
    T.v('sin errores de JavaScript', not pg.errs, pg.errs[:2]); ctx.close()
    # inventario y Mercería
    ctx = contexto(b, 390); con_merceria(ctx, MERC); pg = abrir(ctx, 'inventario-lanas')
    opts = pg.evaluate("[...document.querySelectorAll('#inventario-lanas .merc-sel option')].map(o => o.textContent)")
    T.v('inventario: ofrece las lanas de la Mercería con el precio del ovillo', any('Alize — Rosa — $6.000' in o for o in opts), opts)
    T.v('inventario: color, grosor, ovillos y «lo usé en» tienen su propio renglón', all(pg.locator('#ag-l1-' + c).count() == 1 for c in ['color', 'grosor', 'ovillos', 'uso']))
    ctx.close()
    ctx = contexto(b, 390); con_merceria(ctx, [x for x in MERC if x['categoria'] == 'Relleno']); pg = abrir(ctx, 'inventario-lanas')
    T.v('sin existencias en línea: lo dice y lleva a la Mercería', 'Pronto' in pg.inner_text('#inventario-lanas .merc-sel') and pg.locator('#inventario-lanas .merc-ayuda a[href="/merceria/catalogo/"]').count() == 1, pg.inner_text('#inventario-lanas .oferta-merceria'))
    ctx.close(); b.close()
T.fin()
