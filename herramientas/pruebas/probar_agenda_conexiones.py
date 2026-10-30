"""Prueba las conexiones entre hojas: pedidos entregados → Mis ventas y lanas en 0 → Lista de compras (js/agenda/conexiones.js, 30-oct-2026)."""
import sys; sys.path.insert(0, __file__.rsplit('/', 1)[0])
from agenda_util import *
T = Prueba()
DATOS = {'ag-p1-cliente': 'Ana', 'ag-p1-pedido': 'Osito', 'ag-p1-estado': 'Entregado', 'ag-p1-entrega': '10/10/2026', 'ag-p1-totalcompra': '$ 85.000', 'ag-p1-precio': '$ 85.000',
         'ag-p2-cliente': 'Luisa', 'ag-p2-pedido': 'Conejo', 'ag-p2-estado': 'En proceso', 'ag-p2-totalcompra': '$ 60.000',
         'ag-p3-cliente': 'Marta', 'ag-p3-pedido': 'Gato', 'ag-p3-estado': 'Entregado', 'ag-p3-totalcompra': '$ 70.000',
         'ag-l1-marca': 'Alize', 'ag-l1-color': 'Rosa', 'ag-l1-grosor': '4', 'ag-l1-ovillos': '0',
         'ag-l2-marca': 'Gatito', 'ag-l2-color': 'Azul', 'ag-l2-ovillos': '3'}
IR = "(h)=>{const a=document.querySelector('#menu-hojas-lista a[data-hoja=\"'+h+'\"]'); if(a) a.click()}"
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM, args=['--no-sandbox'])
    for ancho in (1280, 390):
        n = '%d px: ' % ancho
        ctx = contexto(b, ancho, 800, datos=DATOS, config_abierta=False); pg = abrir(ctx, '', 1500, config=False)
        pg.evaluate(IR, 'control-pedidos'); pg.wait_for_timeout(500)
        T.v(n + 'pedidos: avisa que hay 2 entregados sin pasar a ventas', '2 pedidos entregados' in pg.inner_text('#control-pedidos .conexion-ventas'), pg.inner_text('#control-pedidos'))
        pg.click('#control-pedidos .conexion-ventas .ca-boton'); pg.wait_for_timeout(600)
        d = pg.evaluate("JSON.parse(localStorage.getItem('rosinaAgenda'))")
        T.v(n + 'los dos entregados quedan en Mis ventas (y el que está en proceso no)', d.get('ag-vt1-producto') == 'Osito' and d.get('ag-vt1-cliente') == 'Ana' and d.get('ag-vt1-precio') == '$ 85.000' and d.get('ag-vt1-fecha') == '10/10/2026' and d.get('ag-vt2-producto') == 'Gato' and 'ag-vt3-producto' not in d and not d.get('ag-vt3-producto'), {k: v for k, v in d.items() if k.startswith('ag-vt')})
        T.v(n + 'muestra la confirmación y el aviso desaparece', pg.locator('#control-pedidos .conexion-ok').count() == 1 and pg.locator('#control-pedidos .conexion-ventas').count() == 0)
        pg.reload(); pg.wait_for_timeout(1200); pg.evaluate(IR, 'control-pedidos'); pg.wait_for_timeout(400)
        T.v(n + 'al volver a entrar no ofrece de nuevo lo ya pasado (sin duplicar)', pg.locator('#control-pedidos .conexion-ventas').count() == 0)
        pg.evaluate(IR, 'inventario-lanas'); pg.wait_for_timeout(500)
        T.v(n + 'lanas: avisa de la lana con 0 ovillos (y no de la que tiene 3)', '1 lana con 0 ovillos' in pg.inner_text('#inventario-lanas .conexion-compras'), pg.inner_text('#inventario-lanas'))
        pg.click('#inventario-lanas .conexion-compras .ca-boton'); pg.wait_for_timeout(600)
        d = pg.evaluate("JSON.parse(localStorage.getItem('rosinaAgenda'))")
        T.v(n + 'la lana agotada queda en la Lista de compras con su color y 1 ovillo', d.get('ag-c1-material') == 'Lana Alize 4' and d.get('ag-c1-color') == 'Rosa' and d.get('ag-c1-cantidad') == '1 ovillo' and not d.get('ag-c2-material'), {k: v for k, v in d.items() if k.startswith('ag-c')})
        pg.reload(); pg.wait_for_timeout(1200); pg.evaluate(IR, 'inventario-lanas'); pg.wait_for_timeout(400)
        T.v(n + 'sin duplicar la segunda vez', pg.locator('#inventario-lanas .conexion-compras').count() == 0)
        T.v(n + 'los avisos no se imprimen', pg.evaluate("[...document.querySelectorAll('.conexion-aviso, .conexion-ok')].every(e => e.classList.contains('no-imprimir'))"))
        T.v(n + 'sin desplazamiento horizontal ni errores', pg.evaluate("document.documentElement.scrollWidth <= innerWidth + 1") and not pg.errs, pg.errs[:2])
        if ancho == 390:
            pg.evaluate("localStorage.setItem('rosinaAgenda', JSON.stringify(%s))" % __import__('json').dumps({k: v for k, v in DATOS.items() if k.startswith('ag-p')})); pg.reload(); pg.wait_for_timeout(1200); pg.evaluate(IR, 'control-pedidos'); pg.wait_for_timeout(500)
            pg.locator('#control-pedidos .conexion-ventas').scroll_into_view_if_needed(); pg.evaluate("window.scrollBy(0,-80)"); pg.screenshot(path='/tmp/claude-0/-home-user-WEB/e30344ec-58b1-5323-9c0b-85d6933c6ac1/scratchpad/conexion-pedidos-390.png')
        ctx.close()
    b.close()
T.fin()
