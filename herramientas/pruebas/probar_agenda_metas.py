"""Plus etapa 2: meta de ventas del mes y «¿Cuánto necesito vender al mes?» (31-oct-2026). Uso: /usr/bin/python3 probar_agenda_metas.py"""
from agenda_util import *
import datetime, calendar
hoy = datetime.date.today(); f = lambda d: d.strftime('%d/%m/%Y')
dm = calendar.monthrange(hoy.year, hoy.month)[1]; quedan = dm - hoy.day + 1
miles = lambda x: '{:,.0f}'.format(round(x)).replace(',', '.')
FIN = {'fijos': [{'id': 'a', 'n': 'Arriendo', 'v': '400000', 't': 'g', 'activo': True, 'dia': '5'}, {'id': 'b', 'n': 'Programa', 'v': '50000', 't': 's', 'activo': True, 'dia': '5'},
                 {'id': 'c', 'n': 'Viejo', 'v': '999999', 't': 'g', 'activo': False, 'dia': '5'}, {'id': 'd', 'n': 'Ahorro', 'v': '100000', 't': 'a', 'activo': True, 'dia': '5'}],
       'deudas': [{'id': 'x', 'n': 'Préstamo', 'cuota': '80000', 'cuotas': '10', 'pagadas': '3', 'dia': '10'}, {'id': 'y', 'n': 'Pagada', 'cuota': '1', 'cuotas': '2', 'pagadas': '2', 'dia': '1'}], 'movs': []}
DATOS = {'ag-duena': 'Sara', '_fin': FIN,
         'ag-vt1-fecha': f(hoy), 'ag-vt1-producto': 'Osito', 'ag-vt1-precio': '$ 100.000', 'ag-vt1-costo': '$ 40.000',
         'ag-vt2-fecha': f(hoy), 'ag-vt2-producto': 'Manta', 'ag-vt2-precio': '$ 200.000', 'ag-vt2-costo': '$ 100.000'}
T = Prueba()
txt = lambda pg: pg.inner_text('#metas-ventas')
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM)
    pg = abrir(contexto(b, 1280, 900, datos=DATOS, config_abierta=False), 'fin-presupuesto', 2200, config=False)
    T.v('sin errores de JavaScript', not pg.errs, pg.errs)
    t = txt(pg) if pg.locator('#metas-ventas').count() else ''
    T.v('la tarjeta está en «Presupuesto y metas del negocio»', 'Meta de ventas de' in t and pg.evaluate("document.getElementById('fin-presupuesto').contains(document.getElementById('metas-ventas'))"), t[:200])
    T.v('sin meta: invita a escribirla', 'Escribe una meta' in t, t)
    T.v('gastos fijos = 450.000 (cuenta fijos y suscripciones, no ahorro ni inactivos)', 'suman $ 450.000' in t, t)
    T.v('cuotas de deudas = 80.000 (la deuda pagada no cuenta)', 'cuotas de deudas, $ 80.000' in t, t)
    T.v('margen real 53 % de 2 ventas con costo', 'margen real es 53 %' in t and '2 ventas' in t, t)
    T.v('punto de equilibrio mensual = fijos ÷ margen', '$ %s al mes' % miles(450000 / 0.53) in t, t)
    T.v('con cuotas de deudas = 1.000.000', '$ 1.000.000 al mes' in t, t)
    T.v('por semana y por día de venta', miles(450000 / 0.53 / 4.345) in t and miles(450000 / 0.53 / 30) in t, t)
    pg.fill('#mv-meta', '1000000'); pg.press('#mv-meta', 'Enter'); pg.wait_for_timeout(400)
    t = txt(pg)
    sem = max(1, quedan / 7)
    T.v('con meta: lleva 300.000 de 1.000.000 (30 %)', 'Llevas $ 300.000 de $ 1.000.000 (30 %)' in t, t)
    T.v('te faltan 700.000', 'Te faltan' in t and '$ 700.000' in t, t)
    T.v('por semana y por día', miles(700000 / sem) in t and miles(700000 / quedan) in t, (t, miles(700000 / sem), miles(700000 / quedan)))
    T.v('quedan N días', ('Quedan' in t) and ('%d día' % quedan) in t, t)
    T.v('la meta quedó guardada en los datos', pg.evaluate("JSON.parse(localStorage.getItem('rosinaAgenda'))._metaVentas.metas['%d-%02d']" % (hoy.year, hoy.month)) == 1000000)
    pg.reload(); pg.wait_for_timeout(2200)
    T.v('al recargar, la meta sigue', pg.input_value('#mv-meta') == '1.000.000', pg.input_value('#mv-meta'))
    pg.click('.mv-usar'); pg.wait_for_timeout(300)
    T.v('«Usar … como mi meta» pone el equilibrio con cuotas (1.000.000)', pg.evaluate("JSON.parse(localStorage.getItem('rosinaAgenda'))._metaVentas.metas['%d-%02d']" % (hoy.year, hoy.month)) == 1000000)
    pg.fill('#mv-margen', '40'); pg.press('#mv-margen', 'Enter'); pg.wait_for_timeout(400)
    t = txt(pg)
    T.v('margen propio 40 % → 1.125.000', 'Uso el margen que escribiste: 40 %' in t and '$ 1.125.000 al mes' in t, t)
    pg.fill('#mv-meta', '200000'); pg.press('#mv-meta', 'Enter'); pg.wait_for_timeout(400)
    T.v('meta cumplida: mensaje de felicitación', 'Cumpliste tu meta' in txt(pg), txt(pg))
    T.v('no se imprime', pg.evaluate("getComputedStyle(document.getElementById('metas-ventas'), null) && !!document.querySelector('#metas-ventas.no-imprimir')"))
    T.v('no inventó ventas: las ventas siguen siendo las de «Mis ventas»', pg.evaluate("document.getElementById('ag-vt1-precio').value") == '$ 100.000')
    pg.close()
    # sin gastos fijos y sin costo
    pg = abrir(contexto(b, 390, 844, datos={'ag-duena': 'Sara', 'ag-vt1-fecha': f(hoy), 'ag-vt1-precio': '$ 50.000'}, config_abierta=False), 'fin-presupuesto', 2200, config=False)
    t = txt(pg)
    T.v('sin pagos fijos: explica cómo calcularlo', 'Gastos fijos y deudas del negocio' in t, t)
    T.v('celular: sin desplazamiento horizontal', not pg.evaluate("document.documentElement.scrollWidth>innerWidth"))
    pg.close()
    d2 = dict(DATOS); d2['ag-vt1-costo'] = ''; d2['ag-vt2-costo'] = ''
    pg = abrir(contexto(b, 1280, 900, datos=d2, config_abierta=False), 'fin-presupuesto', 2200, config=False)
    T.v('sin costos: pide anotarlos o escribir un %', 'Falta tu margen' in txt(pg), txt(pg))
    pg.close()
    # ingresos del negocio cuando no hay ventas anotadas
    fi = dict(FIN); fi['movs'] = [{'id': '1', 't': 'i', 'f': hoy.strftime('%Y-%m-%d'), 'v': '250000', 'c': 'Ventas', 'm': 'Efectivo'}]
    pg = abrir(contexto(b, 1280, 900, datos={'ag-duena': 'Sara', '_fin': fi, '_metaVentas': {'metas': {'%d-%02d' % (hoy.year, hoy.month): 500000}, 'margen': ''}}, config_abierta=False), 'fin-presupuesto', 2200, config=False)
    T.v('sin «Mis ventas»: usa los ingresos del negocio', 'Llevas $ 250.000 de $ 500.000' in txt(pg) and 'Ingresos y gastos del negocio' in txt(pg), txt(pg))
    pg.close()
    ctx = contexto(b, 1280, 900, datos=DATOS, config_abierta=False); ctx.add_init_script("localStorage.setItem('lrAgendaIdioma','en')")
    pg = abrir(ctx, 'fin-presupuesto', 2600, config=False)
    t = txt(pg)
    T.v('en inglés: títulos y etiquetas traducidos', ('Sales goal for ' + calendar.month_name[hoy.month]) in t and 'How much do I need to sell per month?' in t, t[:300])
    b.close()
T.fin()
