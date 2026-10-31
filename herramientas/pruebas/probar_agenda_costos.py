"""Plus etapa 4: costo por producto y precio sugerido en «Mi catálogo de precios» (31-oct-2026). Uso: /usr/bin/python3 probar_agenda_costos.py"""
from agenda_util import *
import datetime
hoy = datetime.date.today(); f = lambda d: d.strftime('%d/%m/%Y')
PRODS = {
  'ag-ct1-producto': 'Osito', 'ag-ct1-tamano': '15 cm', 'ag-ct1-materiales': '$ 12.000', 'ag-ct1-empaque': '2000', 'ag-ct1-horas': '4 horas', 'ag-ct1-precio': '$ 40.000',
  'ag-ct2-producto': 'Llavero', 'ag-ct2-materiales': '12000', 'ag-ct2-empaque': '2000', 'ag-ct2-precio': '13000',
  'ag-ct3-producto': 'Manta', 'ag-ct3-materiales': '12000', 'ag-ct3-empaque': '2000', 'ag-ct3-horas': '4', 'ag-ct3-precio': '30000',
  'ag-ct4-producto': 'Flor', 'ag-ct4-materiales': '5000', 'ag-ct4-empaque': '1000', 'ag-ct4-horas': '1', 'ag-ct4-precio': '20000',
  'ag-ct5-producto': 'Sin números'}
DATOS = dict(PRODS); DATOS.update({'ag-duena': 'Sara', '_costos': {'hora': 5000, 'margen': 40}})
T = Prueba()
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM)
    pg = abrir(contexto(b, 1280, 1000, datos=DATOS, config_abierta=False), 'catalogo-precios', 2400, config=False)
    T.v('sin errores de JavaScript', not pg.errs, pg.errs)
    T.v('las dos columnas nuevas existen en cada ficha (materiales y empaque)', pg.locator('#ag-ct1-materiales').count() == 1 and pg.locator('#ag-ct1-empaque').count() == 1)
    T.v('las reglas de precio están al inicio de la hoja', pg.locator('#ct-reglas').count() == 1 and pg.input_value('#ct-hora') == '5.000' and pg.input_value('#ct-margen') == '40')
    pg.evaluate("document.querySelectorAll('#tabla-catalogo tr.ficha .ficha-cab').forEach(b => { if (b.getAttribute('aria-expanded') !== 'true') b.click(); })"); pg.wait_for_timeout(500)
    t = lambda k: pg.inner_text('#tabla-catalogo tr.ficha[data-fila="%d"] td.ct-calculo' % k) if pg.locator('#tabla-catalogo tr.ficha[data-fila="%d"] td.ct-calculo' % k).count() else ''
    a = t(1)
    T.v('Osito: te cuesta $ 34.000 (12.000 + 2.000 + 4 h × 5.000)', 'Te cuesta' in a and '$ 34.000' in a, a)
    T.v('Osito: precio sugerido $ 57.000 (34.000 ÷ 0,6 redondeado a 500)', '$ 57.000' in a, a)
    T.v('Osito: te deja $ 6.000 y su hora queda en $ 6.500', '$ 6.000' in a and '$ 6.500' in a, a)
    T.v('Osito: avisa que está por debajo de la ganancia que quiere (15 % de 40 %)', '15 % de ganancia' in a and 'quieres 40 %' in a, a)
    T.v('Llavero: el precio no cubre ni los materiales (pierde $ 1.000)', 'no cubre ni los materiales' in t(2) and '$ 1.000' in t(2), t(2))
    T.v('Manta: su hora queda en $ 4.000, menos de lo que vale', 'hora de trabajo te queda en $ 4.000' in t(3), t(3))
    T.v('Flor: buen precio (45 %)', 'Buen precio' in t(4) and '45 %' in t(4), t(4))
    T.v('Producto sin números: pide anotar materiales', 'Anota lo que gastas' in t(5), t(5))
    barras = pg.locator('.ct-barra').count()
    T.v('gráfica: 4 productos (el que no tiene costo no sale)', barras == 4, barras)
    cls = pg.evaluate("[...document.querySelectorAll('.ct-barra')].map(x => x.querySelector('.ct-rel').className.replace('ct-rel ', '') + ':' + x.querySelector('.ct-pct').textContent)")
    T.v('gráfica: Flor bien, Osito por debajo de la meta, Llavero y Manta pierden', cls[0].startswith('bien:45') and any(c.startswith('alerta:15') for c in cls) and sum(c.startswith('mal') for c in cls) == 2, cls)
    pg.click('#tabla-catalogo tr.ficha[data-fila="1"] .ct-usar'); pg.wait_for_timeout(600)
    T.v('«Usar $ 57.000 como mi precio» pone el precio en la ficha', pg.input_value('#ag-ct1-precio') == '$ 57.000', pg.input_value('#ag-ct1-precio'))
    T.v('y ya no se ofrece de nuevo; ahora el aviso es verde', 'Buen precio' in t(1) and pg.locator('#tabla-catalogo tr.ficha[data-fila="1"] .ct-usar').count() == 0, t(1))
    pg.fill('#ct-hora', '8000'); pg.press('#ct-hora', 'Enter'); pg.wait_for_timeout(500)
    T.v('al cambiar el valor de la hora todo se recalcula (4 h × 8.000 → te cuesta $ 46.000)', '$ 46.000' in t(1), t(1))
    T.v('la regla quedó guardada en los datos', pg.evaluate("JSON.parse(localStorage.getItem('rosinaAgenda'))._costos.hora") == 8000)
    T.v('las demás cifras de las hojas no se tocaron', pg.input_value('#ag-ct2-precio') == '13000')
    pg.close()
    # sin reglas: no inventa precio sugerido
    pg = abrir(contexto(b, 1280, 900, datos=dict(PRODS, **{'ag-duena': 'Sara'}), config_abierta=False), 'catalogo-precios', 2400, config=False)
    pg.evaluate("document.querySelectorAll('#tabla-catalogo tr.ficha .ficha-cab').forEach(b => { if (b.getAttribute('aria-expanded') !== 'true') b.click(); })"); pg.wait_for_timeout(500)
    a = pg.inner_text('#tabla-catalogo tr.ficha[data-fila="1"] td.ct-calculo')
    T.v('sin tu hora ni tu ganancia: no sugiere precio y lo dice', 'Falta tu ganancia (%)' in a and 'Usar' not in a, a)
    T.v('sin tu hora: el costo cuenta solo materiales y empaque (14.000)', '$ 14.000' in a, a)
    T.v('explica cómo calcular la hora', 'Si no sabes cuánto vale tu hora' in pg.inner_text('#ct-reglas'))
    pg.close()
    # el margen del catálogo sirve de respaldo para el punto de equilibrio
    D3 = {'ag-duena': 'Sara', 'ag-ct1-producto': 'A', 'ag-ct1-materiales': '14000', 'ag-ct1-precio': '20000', 'ag-ct2-producto': 'B', 'ag-ct2-materiales': '5000', 'ag-ct2-precio': '10000',
          '_fin': {'fijos': [{'id': 'a', 'n': 'Arriendo', 'v': '300000', 't': 'g', 'activo': True, 'dia': '5'}], 'deudas': [], 'movs': []}}
    pg = abrir(contexto(b, 1280, 900, datos=D3, config_abierta=False), 'fin-presupuesto', 2600, config=False)
    t3 = pg.inner_text('#metas-ventas')
    T.v('equilibrio con el margen del catálogo (30 % y 50 % → promedio 40 %, 2 productos): 300.000 ÷ 0,40 = 750.000', 'Tu margen es 40 % (promedio de 2 productos' in t3 and '$ 750.000 al mes' in t3, t3)
    pg.close()
    pg = abrir(contexto(b, 390, 844, datos=DATOS, config_abierta=False), 'catalogo-precios', 2400, config=False)
    pg.evaluate("document.querySelectorAll('#tabla-catalogo tr.ficha .ficha-cab').forEach((x, i) => { if (i < 2 && x.getAttribute('aria-expanded') !== 'true') x.click(); })"); pg.wait_for_timeout(500)
    T.v('celular: sin desplazamiento horizontal', not pg.evaluate("document.documentElement.scrollWidth>innerWidth"))
    pg.close()
    ctx = contexto(b, 1280, 900, datos=DATOS, config_abierta=False); ctx.add_init_script("localStorage.setItem('lrAgendaIdioma','en')")
    pg = abrir(ctx, 'catalogo-precios', 3000, config=False)
    pg.evaluate("document.querySelectorAll('#tabla-catalogo tr.ficha .ficha-cab').forEach(b => { if (b.getAttribute('aria-expanded') !== 'true') b.click(); })"); pg.wait_for_timeout(600)
    ti = pg.inner_text('#tabla-catalogo tr.ficha[data-fila="1"] td.ct-calculo'); tr_ = pg.inner_text('#ct-reglas')
    T.v('en inglés: reglas, cálculo y avisos traducidos; el nombre del producto intacto', 'My pricing rules' in tr_ and 'Cost and profit' in ti and 'Suggested price' in ti and 'Osito' in pg.inner_text('#tabla-catalogo tr.ficha[data-fila="1"]'), (tr_[:80], ti[:200]))
    T.v('en inglés: aviso con plantilla', 'leaves you 15 % profit and you want 40 %' in ti, ti)
    b.close()
T.fin()
