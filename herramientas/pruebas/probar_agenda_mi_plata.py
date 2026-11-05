"""«Mis números» (4-nov-2026): presupuesto y metas, y gastos fijos + tarjetas + deudas, cada uno con el interruptor «Mi negocio / Personal». Lo personal vive en datos._finP y nunca toca los números del negocio."""
from agenda_util import *
from datetime import date
T = Prueba()
hoy = date.today(); mes = hoy.strftime('%Y-%m')
D = {'_fin': {'movs': [{'id': 'a', 'f': mes + '-03', 't': 'i', 'c': 'Ventas', 'd': 'Osito', 'p': 'Osito', 'cl': '', 'cm': '', 'v': 100000, 'm': ''}],
               'fijos': [{'id': 'f1', 'n': 'Internet del taller', 'v': 70000, 'dia': 1, 't': 'g', 's': False, 'c': 'Servicios', 'm': '', 'activo': True, 'desde': mes, 'saltados': []}], 'deudas': [], 'tarjetas': [], 'metas': [], 'planes': [], 'pres': {'Materiales (lanas)': 300000}}}
def dato(pg): return pg.evaluate("JSON.parse(localStorage.getItem('rosinaAgenda'))")
IR = "(h)=>{const a=document.querySelector('#menu-hojas-lista a[data-hoja=\"'+h+'\"]'); if(a) a.click()}"
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM, args=['--no-sandbox'])
    for ancho, alto, kw in ((1280, 900, {}), (390, 844, {'has_touch': True, 'is_mobile': True})):
        n = '%d px: ' % ancho
        ctx = contexto(b, ancho, alto, datos=D, config_abierta=False, **kw); pg = abrir(ctx, '', 2200, config=False)
        T.v(n + 'el grupo «Mis números» tiene solo «Presupuesto y metas» y «Gastos fijos, tarjetas y deudas»', pg.evaluate("(()=>{let g='',o=[];[...document.querySelectorAll('#menu-hojas-lista > *')].forEach(e=>{if(e.classList.contains('menu-grupo'))g=e.textContent.trim();else if(g==='Mis números')o.push(e.textContent.trim())});return JSON.stringify(o)})()") == '["🐷 Presupuesto y metas","🔁 Gastos fijos, tarjetas y deudas"]')
        pg.evaluate("window.lrIrAHoja('fin-tcredito')"); pg.wait_for_timeout(600)
        T.v(n + 'el enlace a «Tarjetas del negocio» abre Gastos fijos, tarjetas y deudas', pg.evaluate("document.getElementById('fin-fijos').classList.contains('abierta')") and pg.is_visible('#ft-form'))
        T.v(n + 'empieza en «Mi negocio» y muestra el pago fijo del negocio', pg.get_attribute('.amb-sw button[data-amb=n] >> nth=1', 'aria-pressed') == 'true' and 'Internet del taller' in pg.inner_text('#ff-lista') and pg.input_value('#ff-n') == '')
        pg.click('#fin-fijos .amb-sw button[data-amb=p]'); pg.wait_for_timeout(400)
        T.v(n + 'con «Personal» no se ve lo del negocio y los textos cambian', 'Internet del taller' not in pg.inner_text('#ff-lista') and pg.text_content('#ff-l-n') == '¿Qué pagas?' and pg.text_content('#ff-h4c') == 'Tarjetas')
        pg.fill('#ff-n', 'Arriendo de la casa'); pg.fill('#ff-v', '900000'); pg.fill('#ff-dia', '1')
        cats = pg.evaluate("[...document.querySelectorAll('#ff-c option')].map(o => o.value)"); T.v(n + 'las categorías del pago fijo son personales', 'Vivienda' in cats and 'Empaques' not in cats, cats)
        pg.select_option('#ff-c', 'Vivienda'); pg.click('#ff-guardar'); pg.wait_for_timeout(500)
        d = dato(pg); fp = (d.get('_finP') or {}).get('fijos', []); fn = (d.get('_fin') or {}).get('fijos', [])
        T.v(n + 'el pago fijo personal se guarda en _finP y el del negocio no cambia', len(fp) == 1 and fp[0]['n'] == 'Arriendo de la casa' and len(fn) == 1, (len(fp), len(fn)))
        mv = [x for x in d['_fin']['movs'] if x.get('d', '').startswith('Arriendo de la casa')]
        T.v(n + 'y se anota solo como gasto PERSONAL (neg falso)', len(mv) == 1 and mv[0].get('neg') is False and mv[0]['v'] == 900000, mv)
        t = pg.evaluate("(()=>{const t=window.lrDinero.totalesMes(%d,%d);return [t.entradas,t.gastos]})()" % (hoy.year, hoy.month)); T.v(n + 'los números del negocio no cambian (entró 100.000, salió 70.000 del internet)', t == [100000, 70000], t)
        pg.fill('#ft-n', 'Visa personal'); pg.fill('#ft-cupo', '2000000'); pg.fill('#ft-saldo', '300000'); pg.click('#ft-guardar'); pg.wait_for_timeout(400)
        pg.fill('#fd-n', 'Crédito del carro'); pg.fill('#fd-cuota', '400000'); pg.fill('#fd-cuotas', '24'); pg.click('#fd-guardar'); pg.wait_for_timeout(400)
        d = dato(pg); fp = d.get('_finP') or {}
        T.v(n + 'una tarjeta y una deuda personales quedan en _finP y no en el negocio', len(fp.get('tarjetas', [])) == 1 and len(fp.get('deudas', [])) == 1 and not (d['_fin'].get('tarjetas') or []) and not (d['_fin'].get('deudas') or []), (len(fp.get('tarjetas', [])), len(fp.get('deudas', []))))
        # presupuesto y metas
        pg.evaluate(IR, 'fin-presupuesto'); pg.wait_for_timeout(600)
        T.v(n + 'Presupuesto y metas abre en «Personal» (se recuerda) con categorías personales y sin la meta de ventas', pg.is_visible('#fin-pres label[data-amb=p]') and not pg.is_visible('#fin-pres label[data-amb=n]') and not pg.is_visible('#metas-ventas'))
        pg.fill('#fm-n', 'Viaje'); pg.fill('#fm-meta', '3000000'); pg.click('#fm-agregar'); pg.wait_for_timeout(400)
        pg.fill('#fin-pres label[data-amb=p] >> nth=0 >> input', '500000'); pg.wait_for_timeout(300)
        d = dato(pg); fp = d.get('_finP') or {}
        T.v(n + 'la meta y el presupuesto personales se guardan aparte', len(fp.get('metas', [])) == 1 and fp['metas'][0]['n'] == 'Viaje' and 'Vivienda' in fp.get('pres', {}) and not (d['_fin'].get('metas') or []) and list(d['_fin']['pres'].keys()) == ['Materiales (lanas)'], (fp.get('pres'), d['_fin'].get('pres')))
        pg.click('#fin-presupuesto .amb-sw button[data-amb=n]'); pg.wait_for_timeout(500)
        T.v(n + 'al volver a «Mi negocio» sale su presupuesto y no la meta personal', pg.is_visible('#fin-pres label[data-amb=n]') and 'Viaje' not in pg.inner_text('#fin-metas') and pg.is_visible('#metas-ventas'))
        inf = pg.evaluate("(()=>{const x=window.lrMetasVentas.calcular(%d,%d);return x.fijos})()" % (hoy.year, hoy.month)); T.v(n + 'el punto de equilibrio solo cuenta los fijos del negocio (70.000)', inf == 70000, inf)
        T.v(n + 'sin desbordes ni errores de JavaScript', not pg.errs and pg.evaluate("document.documentElement.scrollWidth <= innerWidth + 1"), pg.errs[:2]); ctx.close()
    b.close()
T.fin()
