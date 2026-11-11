"""Pedidos con producto y precio del catálogo (pregunta 6, 11-nov-2026). Uso: python3 probar_agenda_pedido_catalogo.py"""
from agenda_util import *
T = Prueba()
CAT = {'ag-ct1-producto': 'Osito de apego', 'ag-ct1-tamano': '20 cm', 'ag-ct1-precio': '$ 85.000', 'ag-ct2-producto': 'Gorro', 'ag-ct2-precio': '$ 40.000'}
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM, args=['--no-sandbox'])
    ctx = contexto(b, 1280, 900, datos=dict({'ag-duena': 'Sara'}, **CAT), config_abierta=False); pg = abrir(ctx, 'control-pedidos', 2000, config=False)
    val = lambda i: pg.evaluate("document.getElementById('%s').value" % i)
    pg.evaluate("(() => { const s = document.querySelector('#ag-p1-pedido').parentElement.querySelector('.ped-cat'); s.dispatchEvent(new Event('focus')); })()")
    ops = pg.evaluate("[...document.querySelector('#ag-p1-pedido').parentElement.querySelectorAll('.ped-cat option')].map(o => o.textContent)")
    T.v('la lista trae los productos del catálogo con su precio', ops == ['Elegir de mi catálogo…', 'Osito de apego · 20 cm — $ 85.000', 'Gorro — $ 40.000'], ops)
    pg.evaluate("(() => { const s = document.querySelector('#ag-p1-pedido').parentElement.querySelector('.ped-cat'); s.value = '0'; s.dispatchEvent(new Event('change', { bubbles: true })); })()"); pg.wait_for_timeout(400)
    T.v('al elegir un producto se escribe en el pedido, con su precio, cantidad 1 y el total', val('ag-p1-pedido') == 'Osito de apego · 20 cm' and '85' in val('ag-p1-valorunidad') and val('ag-p1-cantidad') == '1' and '85' in val('ag-p1-totalcompra'), [val('ag-p1-pedido'), val('ag-p1-valorunidad'), val('ag-p1-cantidad'), val('ag-p1-totalcompra')])
    pg.fill('#ag-p1-valorunidad', '$ 90.000'); pg.wait_for_timeout(300)
    T.v('el precio se puede cambiar y el total sigue', '90' in val('ag-p1-totalcompra'), val('ag-p1-totalcompra'))
    pg.evaluate("(() => { const s = document.querySelector('#ag-p1-pedido').parentElement.querySelector('.ped-cat'); s.dispatchEvent(new Event('focus')); s.value = '1'; s.dispatchEvent(new Event('change', { bubbles: true })); })()"); pg.wait_for_timeout(400)
    T.v('si el pedido ya tenía producto, el nuevo se agrega y el precio NO se toca', val('ag-p1-pedido') == 'Osito de apego · 20 cm, Gorro' and '90' in val('ag-p1-valorunidad'), [val('ag-p1-pedido'), val('ag-p1-valorunidad')])
    pg.wait_for_timeout(800); pg.reload(); pg.wait_for_timeout(2000)
    T.v('lo elegido queda guardado', val('ag-p1-pedido') == 'Osito de apego · 20 cm, Gorro' and '90' in val('ag-p1-valorunidad'))
    T.v('sin errores de JavaScript', not pg.errs, pg.errs); ctx.close()
    ctx = contexto(b, 1280, 900, datos={'ag-duena': 'Sara'}, config_abierta=False); pg = abrir(ctx, 'control-pedidos', 2000, config=False)
    T.v('sin catálogo: la lista avisa y no deja elegir', pg.evaluate("(() => { const s = document.querySelector('#ag-p1-pedido').parentElement.querySelector('.ped-cat'); return s.disabled && s.options[0].textContent.indexOf('Aún no hay productos') === 0; })()"))
    ctx.close(); b.close()
T.fin()
