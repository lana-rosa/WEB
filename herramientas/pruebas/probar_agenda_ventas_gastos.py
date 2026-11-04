"""«Ventas y gastos» (hoja única para anotar el dinero, 4-nov-2026): migración de «Mis ventas del mes» y «Gastos del negocio», formulario con producto, cliente y costo,
hojas viejas escondidas con sus enlaces, y que nada se cuente dos veces. Código: js/agenda/dinero.js (migrar) y agenda-rosina.html (hoja fin-movimientos)."""
import json
from agenda_util import *
from datetime import date
T = Prueba()
hoy = date.today(); mes = hoy.strftime('%Y-%m'); f1 = mes + '-03'; f2 = mes + '-10'
def fmt(f): return f[8:10] + '/' + f[5:7] + '/' + f[:4]
IR = "(h)=>{const a=document.querySelector('#menu-hojas-lista a[data-hoja=\"'+h+'\"]'); if(a) a.click()}"
FICHAS = {'ag-vt1-fecha': fmt(f1), 'ag-vt1-producto': 'Osito', 'ag-vt1-cliente': 'Ana', 'ag-vt1-precio': '$ 85.000', 'ag-vt1-costo': '$ 20.000',
          'ag-vt2-fecha': fmt(f2), 'ag-vt2-producto': 'Gorro', 'ag-vt2-precio': '40000',
          'ag-gs1-fecha': fmt(f2), 'ag-gs1-categoria': 'Materiales', 'ag-gs1-detalle': 'Lana', 'ag-gs1-valor': '$ 30.000', 'ag-gs1-proveedor': 'Mercería Sol', 'ag-gs1-medio': 'Nequi',
          'ag-p1-cliente': 'Luisa', 'ag-p1-pedido': 'Conejo', 'ag-p1-estado': 'Entregado', 'ag-p1-entrega': fmt(f2), 'ag-p1-totalcompra': '$ 60.000'}
def dato(pg): return pg.evaluate("JSON.parse(localStorage.getItem('rosinaAgenda'))")
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM, args=['--no-sandbox'])
    for ancho, alto, kw in ((1280, 900, {}), (390, 844, {'has_touch': True, 'is_mobile': True})):
        n = '%d px: ' % ancho
        ctx = contexto(b, ancho, alto, datos=FICHAS, config_abierta=False, **kw); pg = abrir(ctx, '', 2200, config=False)
        d = dato(pg); fin = d.get('_fin') or {}; movs = {x['id']: x for x in fin.get('movs', [])}
        T.v(n + 'se migró solo y quedó marcado', bool(fin.get('migrado')) and fin.get('migracion', {}).get('n') == 3, fin.get('migracion'))
        T.v(n + 'las ventas pasan con producto, cliente y costo', movs.get('vt1', {}).get('p') == 'Osito' and movs['vt1'].get('cl') == 'Ana' and movs['vt1'].get('cm') == 20000 and movs['vt1'].get('v') == 85000 and movs.get('vt2', {}).get('v') == 40000, movs.get('vt1'))
        T.v(n + 'el gasto pasa con su categoría, proveedor y medio', movs.get('gs1', {}).get('c') == 'Materiales (lanas)' and 'Mercería Sol' in movs['gs1'].get('d', '') and movs['gs1'].get('m') == 'Nequi / Daviplata' and movs['gs1'].get('v') == 30000, movs.get('gs1'))
        T.v(n + 'las fichas viejas no se tocan (quedan de respaldo)', d.get('ag-vt1-producto') == 'Osito' and d.get('ag-gs1-valor') == '$ 30.000')
        t = pg.evaluate("(()=>{const t=window.lrDinero.totalesMes(%d,%d);return [t.entradas,t.gastos]})()" % (hoy.year, hoy.month)); T.v(n + 'la plata es la misma: entró 125.000, salió 30.000', t == [125000, 30000], t)
        # menú y hojas viejas
        T.v(n + '«Ventas y gastos» está en Mi emprendimiento y las dos hojas viejas ya no están en el menú', pg.evaluate("(()=>{const l=[...document.querySelectorAll('#menu-hojas-lista > *')];let g='',donde='';l.forEach(e=>{if(e.classList.contains('menu-grupo'))g=e.textContent.trim();else if(e.dataset&&e.dataset.hoja==='fin-movimientos')donde=g+'|'+e.textContent.trim();});return donde.indexOf('Mi emprendimiento')===0&&donde.indexOf('Ventas y gastos')>0&&!document.querySelector('#menu-hojas-lista a[data-hoja=ventas-mes],#menu-hojas-lista a[data-hoja=gastos-negocio]')})()"))
        T.v(n + 'las hojas viejas están escondidas', not pg.is_visible('#ventas-mes') and not pg.is_visible('#gastos-negocio'))
        pg.evaluate("window.lrIrAHoja('ventas-mes')"); pg.wait_for_timeout(500)
        T.v(n + 'un enlace a «Mis ventas del mes» abre «Ventas y gastos»', pg.evaluate("document.getElementById('fin-movimientos').classList.contains('abierta')"))
        T.v(n + 'la lista muestra las ventas con producto y cliente', 'Osito · Ana' in pg.inner_text('#fin-tabla') and 'Gorro' in pg.inner_text('#fin-tabla') and 'Lana' in pg.inner_text('#fin-tabla'), pg.inner_text('#fin-tabla')[:200])
        # formulario de venta
        pg.select_option('#fin-t', 'i'); pg.wait_for_timeout(150); pg.select_option('#fin-c', 'Ventas'); pg.wait_for_timeout(150)
        T.v(n + 'al elegir Venta salen producto, cliente y costo de materiales', pg.is_visible('#fin-p') and pg.is_visible('#fin-cl') and pg.is_visible('#fin-cm'))
        pg.select_option('#fin-t', 'g'); pg.wait_for_timeout(150); T.v(n + 'con un gasto esos campos se esconden', not pg.is_visible('#fin-p'))
        pg.select_option('#fin-t', 'i'); pg.wait_for_timeout(150); pg.select_option('#fin-c', 'Ventas')
        pg.fill('#fin-p', 'Llavero'); pg.fill('#fin-cl', 'Marta'); pg.fill('#fin-cm', '3000'); pg.fill('#fin-v', '12000'); pg.click('#fin-guardar'); pg.wait_for_timeout(500)
        mv = [x for x in (dato(pg).get('_fin') or {}).get('movs', []) if x.get('p') == 'Llavero']
        T.v(n + 'una venta nueva se guarda con producto, cliente, costo y valor', len(mv) == 1 and mv[0]['cl'] == 'Marta' and mv[0]['cm'] == 3000 and mv[0]['v'] == 12000 and mv[0]['c'] == 'Ventas', mv)
        T.v(n + 'aparece en la lista y suma al total', 'Llavero · Marta' in pg.inner_text('#fin-tabla') and '137.000' in pg.inner_text('#fin-totales'), pg.inner_text('#fin-totales'))
        pg.fill('#fin-texto', 'vendí un osito por 85 mil'); pg.press('#fin-texto', 'Enter'); pg.wait_for_timeout(500)
        mv = [x for x in (dato(pg).get('_fin') or {}).get('movs', []) if x.get('p') == 'osito']
        T.v(n + '«vendí un osito por 85 mil» queda como venta de «osito»', len(mv) == 1 and mv[0]['v'] == 85000, mv)
        # el informe y el historial usan lo nuevo
        inf = pg.evaluate("(()=>{const x=window.lrInforme.datos(%d,%d);return [x.nVentas,x.ingresos]})()" % (hoy.year, hoy.month)); T.v(n + 'el informe cuenta las ventas nuevas', inf[0] == 4 and inf[1] == 125000 + 12000 + 85000, inf)
        # pedidos entregados -> Ventas y gastos
        pg.evaluate(IR, 'control-pedidos'); pg.wait_for_timeout(500)
        T.v(n + 'el pedido entregado se ofrece para pasar a Ventas y gastos', 'Ventas y gastos' in pg.inner_text('#control-pedidos .conexion-ventas'), pg.inner_text('#control-pedidos')[:200])
        pg.click('#control-pedidos .conexion-ventas .ca-boton'); pg.wait_for_timeout(600)
        mv = [x for x in (dato(pg).get('_fin') or {}).get('movs', []) if x.get('p') == 'Conejo']
        T.v(n + 'queda como venta con su cliente y total', len(mv) == 1 and mv[0]['cl'] == 'Luisa' and mv[0]['v'] == 60000, mv)
        # acciones rápidas del panel
        pg.evaluate("window.lrIrAHoja('panel-agenda')"); pg.wait_for_timeout(600)
        pg.click('.pn-accion:has-text("Anotar venta")'); pg.wait_for_timeout(500)
        T.v(n + '«Anotar venta» del panel abre la hoja con los campos de venta', pg.evaluate("document.getElementById('fin-movimientos').classList.contains('abierta')") and pg.is_visible('#fin-p'))
        # idempotente: al recargar no duplica
        antes = len((dato(pg).get('_fin') or {}).get('movs', [])); pg.reload(); pg.wait_for_timeout(1800)
        T.v(n + 'al recargar no se duplica nada', len((dato(pg).get('_fin') or {}).get('movs', [])) == antes, antes)
        T.v(n + 'sin desbordes ni errores de JavaScript', not pg.errs and pg.evaluate("document.documentElement.scrollWidth <= innerWidth + 1"), pg.errs[:2]); ctx.close()
    # --- lo personal (4-nov-2026): se anota en el mismo lugar, pero nunca se mezcla con el negocio
    ctx = contexto(b, 1280, 900, datos={'_fin': {'movs': [{'id': 'a', 'f': f1, 't': 'i', 'c': 'Ventas', 'd': 'Osito', 'p': 'Osito', 'cl': '', 'cm': '', 'v': 85000, 'm': ''}, {'id': 'b', 'f': f2, 't': 'g', 'c': 'Mercado', 'd': 'Mercado del mes', 'v': 300000, 'm': '', 'neg': False}, {'id': 'c', 'f': f2, 't': 'g', 'c': 'Empaques', 'd': 'Bolsas', 'v': 20000, 'm': ''}], 'fijos': [], 'deudas': []}}, config_abierta=False)
    pg = abrir(ctx, '', 2000, config=False)
    t = pg.evaluate("(()=>{const t=window.lrDinero.totalesMes(%d,%d);return [t.entradas,t.gastos]})()" % (hoy.year, hoy.month)); T.v('lo personal no entra en los números del negocio (entró 85.000, salió 20.000)', t == [85000, 20000], t)
    pp = pg.evaluate("(()=>{const t=window.lrDinero.personalMes(%d,%d);return [t.gastos,t.porCat.Mercado]})()" % (hoy.year, hoy.month)); T.v('y se puede leer aparte: gastos personales 300.000 en Mercado', pp == [300000, 300000], pp)
    inf = pg.evaluate("(()=>{const x=window.lrInforme.datos(%d,%d);return [x.ingresos,x.gastos]})()" % (hoy.year, hoy.month)); T.v('el informe del mes solo trae el negocio', inf == [85000, 20000], inf)
    pg.evaluate("window.lrIrAHoja('fin-movimientos')"); pg.wait_for_timeout(500)
    T.v('la lista empieza en «Mi negocio» (no muestra el mercado personal)', 'Mercado' not in pg.inner_text('#fin-tabla') and 'Bolsas' in pg.inner_text('#fin-tabla'))
    pg.select_option('#fin-fil-neg', 'p'); pg.wait_for_timeout(300)
    T.v('al elegir «Personal» sale el mercado con su marca «Personal»', 'Mercado' in pg.inner_text('#fin-tabla') and pg.locator('#fin-tabla .fin-personal').count() == 1 and 'Bolsas' not in pg.inner_text('#fin-tabla'), pg.inner_text('#fin-tabla')[:120])
    pg.select_option('#fin-de', 'p'); pg.select_option('#fin-t', 'g'); pg.wait_for_timeout(200)
    cats = pg.evaluate("[...document.querySelectorAll('#fin-c option')].map(o => o.value)")
    T.v('con «De: Personal» las categorías son las personales y no salen los campos de venta', 'Vivienda' in cats and 'Mercado' in cats and 'Empaques' not in cats and not pg.is_visible('#fin-p'), cats)
    pg.select_option('#fin-c', 'Salud'); pg.fill('#fin-d', 'Droguería'); pg.fill('#fin-v', '45000'); pg.click('#fin-guardar'); pg.wait_for_timeout(500)
    mv = [x for x in (dato(pg).get('_fin') or {}).get('movs', []) if x.get('d') == 'Droguería']
    T.v('un gasto personal nuevo se guarda con neg = falso y deja la lista en «Personal»', len(mv) == 1 and mv[0].get('neg') is False and mv[0]['c'] == 'Salud' and pg.input_value('#fin-fil-neg') == 'p', mv)
    t = pg.evaluate("window.lrDinero.totalesMes(%d,%d).gastos" % (hoy.year, hoy.month)); T.v('y sigue sin tocar los gastos del negocio (20.000)', t == 20000, t)
    pg.select_option('#fin-fil-neg', 'n'); pg.fill('#fin-texto', 'gasté 120 mil en mercado personal'); pg.press('#fin-texto', 'Enter'); pg.wait_for_timeout(500)
    mv = [x for x in (dato(pg).get('_fin') or {}).get('movs', []) if x.get('v') == 120000]
    T.v('«gasté 120 mil en mercado personal» queda como gasto personal de Mercado', len(mv) == 1 and mv[0].get('neg') is False and mv[0]['c'] == 'Mercado' and mv[0]['t'] == 'g', mv)
    pg.select_option('#fin-fil-neg', ''); pg.wait_for_timeout(300)
    T.v('con «Los dos» se ve todo', 'Mercado' in pg.inner_text('#fin-tabla') and 'Bolsas' in pg.inner_text('#fin-tabla'))
    T.v('sin errores de JavaScript', not pg.errs, pg.errs[:2]); ctx.close()
    # copias duplicadas: total del día «Ventas» + las mismas ventas por ficha
    D2 = dict(FICHAS); D2['_fin'] = {'movs': [{'id': 'x1', 'f': f1, 't': 'i', 'c': 'Ventas', 'd': 'Total', 'v': 125000, 'm': ''}]}
    ctx = contexto(b, 1280, 900, datos=D2, config_abierta=False); pg = abrir(ctx, '', 2000, config=False); fin = dato(pg)['_fin']
    T.v('el total «Ventas» copia de las fichas sale de la lista y queda guardado aparte', not any(x['id'] == 'x1' for x in fin['movs']) and any(x['id'] == 'x1' for x in fin.get('respaldoMovs', [])), [x['id'] for x in fin['movs']])
    t = pg.evaluate("(()=>{const t=window.lrDinero.totalesMes(%d,%d);return t.entradas})()" % (hoy.year, hoy.month)); T.v('y no se cuenta doble (125.000)', t == 125000, t); ctx.close()
    b.close()
T.fin()
