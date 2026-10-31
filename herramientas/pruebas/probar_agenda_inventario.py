"""Plus etapa 5: inventario de lanas con costo por ovillo, valor y mínimo (31-oct-2026). Uso: /usr/bin/python3 probar_agenda_inventario.py"""
from agenda_util import *
LANAS = {
  'ag-l1-marca': 'Alize', 'ag-l1-color': 'Rosa', 'ag-l1-ovillos': '4', 'ag-l1-costo': '$ 8.000', 'ag-l1-minimo': '2',
  'ag-l2-marca': 'Gamitex', 'ag-l2-color': 'Rojo', 'ag-l2-ovillos': '2', 'ag-l2-costo': '10000', 'ag-l2-minimo': '3',
  'ag-l3-marca': 'Lana', 'ag-l3-color': 'Azul', 'ag-l3-ovillos': '0', 'ag-l3-costo': '9000', 'ag-l3-minimo': '1',
  'ag-l4-marca': 'Sin costo', 'ag-l4-color': 'Verde', 'ag-l4-ovillos': '3',
  'ag-l5-marca': 'Solo mínimo', 'ag-l5-color': 'Negro', 'ag-l5-ovillos': '5', 'ag-l5-minimo': '2'}
DATOS = dict(LANAS); DATOS['ag-duena'] = 'Sara'
T = Prueba()
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM)
    pg = abrir(contexto(b, 1280, 1000, datos=DATOS, config_abierta=False), 'inventario-lanas', 2400, config=False)
    T.v('sin errores de JavaScript', not pg.errs, pg.errs)
    T.v('las dos columnas nuevas existen', pg.locator('#ag-l1-costo').count() == 1 and pg.locator('#ag-l1-minimo').count() == 1)
    r = pg.inner_text('#inv-resumen')
    # valor = 4×8000 + 2×10000 + 0×9000 = 52.000
    T.v('dinero en lana $ 52.000 (4×8.000 + 2×10.000 + 0)', '$ 52.000' in r, r)
    T.v('avisa que una lana no se cuenta por no tener costo (Verde y Negro: 2)', 'Sin contar 2 lanas sin costo' in r, r)
    T.v('ovillos en total 14', '\n14\n' in ('\n' + r.replace('\n\n', '\n') + '\n'), r)
    T.v('costo promedio por ovillo $ 8.667 (52.000 ÷ 6)', '$ 8.667' in r, r)
    T.v('por acabarse: 3 (Rojo 2≤3, Azul 0, Rosa 4 no)', 'Por acabarse' in r and 'Se acabó' in r and 'Quedan 2' in r and 'Gamitex · Rojo' in r and 'Alize · Rosa' not in r, r)
    pg.evaluate("document.querySelectorAll('#tabla-lanas tr.ficha .ficha-cab').forEach(b => { if (b.getAttribute('aria-expanded') !== 'true') b.click(); })"); pg.wait_for_timeout(500)
    t = lambda k: pg.inner_text('#tabla-lanas tr.ficha[data-fila="%d"] td.iv-calculo' % k) if pg.locator('#tabla-lanas tr.ficha[data-fila="%d"] td.iv-calculo' % k).count() else ''
    T.v('Rosa: valor $ 32.000 y por encima del mínimo', '$ 32.000' in t(1) and 'más de tu mínimo (2)' in t(1), t(1))
    T.v('Rojo: valor $ 20.000 y aviso de mínimo (quedan 2, mínimo 3)', '$ 20.000' in t(2) and 'Te quedan 2 ovillos y tu mínimo es 3' in t(2), t(2))
    T.v('Azul: se acabó', 'Se acabó' in t(3), t(3))
    T.v('Verde: sin costo ni mínimo no muestra cálculo', t(4) == '', t(4))
    T.v('Negro: solo mínimo, no inventa valor', 'Valor de esta lana' not in t(5) and 'más de tu mínimo (2)' in t(5), t(5))
    # conexión con la lista de compras: Azul (0) y Rojo (bajo mínimo)
    av = pg.inner_text('.conexion-compras') if pg.locator('.conexion-compras').count() else ''
    T.v('aviso de compras cuenta 2 lanas (agotada + bajo mínimo)', 'Tienes 2 lanas agotadas o por acabarse' in av, av)
    pg.click('.conexion-compras .ca-boton'); pg.wait_for_timeout(600)
    mats = pg.evaluate("[1,2,3,4].map(i => (document.getElementById('ag-c'+i+'-material')||{}).value + '|' + (document.getElementById('ag-c'+i+'-color')||{}).value)")
    T.v('las dos pasaron a la Lista de compras', any('Azul' in m for m in mats) and any('Rojo' in m for m in mats) and not any('Rosa' in m for m in mats), mats)
    T.v('y no se duplican al volver a mirar', not pg.locator('.conexion-compras').count() or '0 lanas' not in pg.inner_text('.conexion-compras'))
    T.v('las casillas de la persona no se tocaron', pg.input_value('#ag-l1-costo') == '$ 8.000' and pg.input_value('#ag-l2-minimo') == '3')
    pg.fill('#ag-l4-costo', '7000'); pg.press('#ag-l4-costo', 'Enter'); pg.wait_for_timeout(600)
    T.v('al anotar el costo de Verde el total sube a $ 73.000 (3×7.000)', '$ 73.000' in pg.inner_text('#inv-resumen'), pg.inner_text('#inv-resumen'))
    pg.close()
    # tablero de Mis materiales
    pg = abrir(contexto(b, 1280, 1000, datos=DATOS, config_abierta=False), '', 2400, config=False)
    pg.evaluate("document.querySelectorAll('.pestana')[3].click()"); pg.wait_for_timeout(800)
    d = pg.inner_text('.vs-dash') if pg.locator('.vs-dash').count() else ''
    T.v('tablero de Mis materiales muestra «Dinero en lana» $ 52.000 y «Por acabarse»', 'Dinero en lana' in d and '$ 52.000' in d and 'Por acabarse' in d, d)
    pg.close()
    # vacío: sin lanas no muestra resumen
    pg = abrir(contexto(b, 1280, 900, datos={'ag-duena': 'Sara'}, config_abierta=False), 'inventario-lanas', 2400, config=False)
    T.v('sin lanas no sale el resumen', pg.locator('#inv-resumen:visible').count() == 0)
    pg.close()
    # inglés
    ctx = contexto(b, 1280, 1000, datos=DATOS, config_abierta=False); ctx.add_init_script("localStorage.setItem('lrAgendaIdioma','en')")
    pg = abrir(ctx, 'inventario-lanas', 2600, config=False)
    r = pg.inner_text('#inv-resumen')
    T.v('en inglés: resumen traducido', 'Money in yarn' in r and 'Average cost per skein' in r and 'Running low' in r and 'Not counting 2 yarns with no cost' in r, r)
    pg.close()
    pg = abrir(contexto(b, 390, 844, datos=DATOS, config_abierta=False), 'inventario-lanas', 2400, config=False)
    pg.evaluate("document.querySelectorAll('#tabla-lanas tr.ficha .ficha-cab').forEach((x, i) => { if (i < 2 && x.getAttribute('aria-expanded') !== 'true') x.click(); })"); pg.wait_for_timeout(500)
    T.v('celular: sin desplazamiento horizontal', not pg.evaluate("document.documentElement.scrollWidth>innerWidth"))
    pg.close()
    b.close()
T.fin()
