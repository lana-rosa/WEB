"""«Resumen del emprendimiento» (4-nov-2026): une «Mi negocio en números», «Resultados del negocio» y «Análisis del negocio» en una sola hoja que solo mira (pestañas Este mes · Comparar meses · El año)."""
from agenda_util import *
from datetime import date
T = Prueba()
hoy = date.today(); mes = hoy.strftime('%Y-%m')
D = {'_fin': {'movs': [{'id': '1', 'f': mes + '-03', 't': 'i', 'c': 'Ventas', 'd': 'Osito', 'p': 'Osito', 'cl': 'Ana', 'cm': 20000, 'v': 85000, 'm': ''},
                       {'id': '2', 'f': mes + '-05', 't': 'g', 'c': 'Materiales (lanas)', 'd': 'Lana', 'v': 30000, 'm': 'Efectivo'}, {'id': '3', 'f': mes + '-06', 't': 'a', 'c': 'Ahorro', 'd': '', 'v': 10000, 'm': ''}], 'fijos': [], 'deudas': []},
     'ag-p1-cliente': 'Luisa', 'ag-p1-pedido': 'Conejo', 'ag-p1-estado': 'En proceso', 'ag-p1-totalcompra': '$ 60.000', 'ag-p1-abono': '$ 10.000', 'ag-duena': 'Ana'}
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM, args=['--no-sandbox'])
    for ancho, alto, kw in ((1280, 900, {}), (390, 844, {'has_touch': True, 'is_mobile': True})):
        n = '%d px: ' % ancho
        pg = abrir(contexto(b, ancho, alto, datos=D, config_abierta=False, **kw), '', 2200, config=False)
        T.v(n + 'en el menú solo hay «Resumen del emprendimiento» (no Resultados, Mi negocio en números ni Análisis)', pg.evaluate("(()=>{const t=[...document.querySelectorAll('#menu-hojas-lista a')].map(a=>a.textContent);return t.some(x=>x.indexOf('Resumen del emprendimiento')>=0)&&!t.some(x=>/Resultados del negocio|Mi negocio en números|Análisis del negocio/.test(x))})()"))
        pg.evaluate("window.lrIrAHoja('fin-negocio')"); pg.wait_for_timeout(700)
        T.v(n + 'los enlaces a «Resultados del negocio» abren el Resumen', pg.evaluate("document.getElementById('fin-resumen').classList.contains('abierta')"))
        T.v(n + 'Este mes: tarjetas, tabla de resultados, gráfica, por cobrar y por pagar', all(pg.evaluate("s=>{const e=document.querySelector(s);return !!e&&e.offsetParent!==null&&e.innerText.trim().length>0}", s_) for s_ in ('#fin-tarjetas', '#fn-resultados', '#fin-barras', '#fn-cobrar', '#fn-pagar')))
        T.v(n + 'Este mes trae 85.000 de ingresos, 30.000 de gastos y 10.000 ahorrados', all(x in pg.inner_text('#fin-tarjetas') for x in ('85.000', '30.000', '10.000')), pg.inner_text('#fin-tarjetas')[:150])
        T.v(n + 'el botón del informe y el punto de equilibrio siguen en la hoja', pg.locator('#fin-resumen #inf-boton').count() == 1)
        T.v(n + 'no hay casillas para escribir (solo mira)', pg.evaluate("[...document.querySelectorAll('#fin-resumen input:not([type=button]), #fin-resumen textarea, #fin-resumen select')].filter(e=>e.offsetParent!==null).length") == 0)
        pg.click('#rs-t-comp'); pg.wait_for_timeout(400)
        T.v(n + 'Comparar meses: se ve la comparación y el ahorro, y se esconde lo demás', pg.is_visible('#fa-comparar') and pg.is_visible('#fa-ahorro') and not pg.is_visible('#fin-tarjetas') and pg.get_attribute('#rs-t-comp', 'aria-selected') == 'true')
        pg.click('#rs-t-anio'); pg.wait_for_timeout(400)
        T.v(n + 'El año: se ve el resumen del año con su Excel', pg.is_visible('#fa-anio-cards') and pg.is_visible('#fa-exportar') and not pg.is_visible('#fa-comparar'))
        pg.click('#rs-t-mes'); pg.keyboard.press('ArrowRight'); pg.wait_for_timeout(300)
        T.v(n + 'las flechas del teclado cambian de pestaña', pg.get_attribute('#rs-t-comp', 'aria-selected') == 'true')
        pg.emulate_media(media='print'); T.v(n + 'al imprimir salen las tres partes', all(pg.is_visible(s) for s in ('#rs-mes', '#rs-comp', '#rs-anio'))); pg.emulate_media(media='screen'); pg.wait_for_timeout(400)
        T.v(n + 'sin desbordes ni errores de JavaScript', not pg.errs and pg.evaluate("document.documentElement.scrollWidth <= innerWidth + 1"), (pg.errs[:2], pg.evaluate("[document.documentElement.scrollWidth, innerWidth]")))
    b.close()
T.fin()
