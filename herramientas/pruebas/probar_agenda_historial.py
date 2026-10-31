"""Plus etapa 3: historial de cada clienta en «Mis clientas» (31-oct-2026). Uso: /usr/bin/python3 probar_agenda_historial.py"""
from agenda_util import *
import datetime
hoy = datetime.date.today(); f = lambda d: d.strftime('%d/%m/%Y'); d = lambda n: hoy + datetime.timedelta(days=n)
DATOS = {'ag-duena': 'Sara',
  'ag-cl1-nombre': 'Ana Gómez', 'ag-cl1-whatsapp': '300 111 2222',
  'ag-cl2-nombre': 'Beatriz', 'ag-cl2-whatsapp': '3105556666',
  'ag-cl3-nombre': 'Carla Nueva',
  # Ana: dos pedidos (uno entregado, uno en proceso con saldo) y una venta suelta; escrita sin tilde en un pedido
  'ag-p1-cliente': 'Ana Gómez', 'ag-p1-pedido': 'Osito', 'ag-p1-estado': 'Entregado', 'ag-p1-totalcompra': '$ 80.000', 'ag-p1-abono': '$ 80.000', 'ag-p1-entrega': f(d(-120)),
  'ag-p2-cliente': 'ana gomez', 'ag-p2-pedido': 'Manta', 'ag-p2-estado': 'En proceso', 'ag-p2-totalcompra': '$ 150.000', 'ag-p2-abono': '$ 50.000', 'ag-p2-entrega': f(d(-100)),
  'ag-p3-cliente': 'Alguien con otro nombre', 'ag-p3-telefono': '+57 300 111 2222', 'ag-p3-pedido': 'Llavero', 'ag-p3-estado': 'En proceso', 'ag-p3-totalcompra': '$ 20.000', 'ag-p3-abono': '$ 0', 'ag-p3-entrega': f(d(5)),
  'ag-p4-cliente': 'Beatriz', 'ag-p4-pedido': 'Cancelado', 'ag-p4-estado': 'Cancelado', 'ag-p4-totalcompra': '$ 99.000', 'ag-p4-abono': '', 'ag-p4-entrega': f(d(-3)),
  'ag-p5-cliente': 'Otra persona', 'ag-p5-pedido': 'Bolso', 'ag-p5-estado': 'En proceso', 'ag-p5-totalcompra': '$ 70.000', 'ag-p5-abono': '', 'ag-p5-entrega': f(d(2)),
  'ag-vt1-fecha': f(d(-10)), 'ag-vt1-producto': 'Gorro', 'ag-vt1-cliente': 'Beatriz', 'ag-vt1-precio': '$ 35.000',
  'ag-vt2-fecha': f(d(-120)), 'ag-vt2-producto': 'Osito', 'ag-vt2-cliente': 'Ana Gómez', 'ag-vt2-precio': '$ 80.000'}   # igual al pedido entregado: no debe contarse dos veces
T = Prueba()
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM)
    pg = abrir(contexto(b, 1280, 900, datos=DATOS, config_abierta=False), 'mis-clientas', 2400, config=False)
    T.v('sin errores de JavaScript', not pg.errs, pg.errs)
    pg.evaluate("document.querySelectorAll('#tabla-clientas tr.ficha .ficha-cab').forEach(b => { if (b.getAttribute('aria-expanded') !== 'true') b.click(); })"); pg.wait_for_timeout(500)
    t = lambda k: pg.inner_text('#tabla-clientas tr.ficha[data-fila="%d"] td.cl-historial' % k) if pg.locator('#tabla-clientas tr.ficha[data-fila="%d"] td.cl-historial' % k).count() else ''
    a = t(1)
    T.v('Ana: tiene historial', 'Historial de compras' in a, a)
    T.v('Ana: 3 pedidos (el segundo con el nombre sin tilde ni mayúsculas y el tercero por teléfono)', 'Pedidos\n3' in a.replace(' · ', '\n').replace('\n\n', '\n') or '3 ·' in a or '3\n' in a, a)
    T.v('Ana: total 250.000 (80 + 150 + 20; la venta igual al pedido no se cuenta dos veces)', '$ 250.000' in a, a)
    T.v('Ana: saldo pendiente 120.000 (100.000 + 20.000)', '$ 120.000' in a, a)
    T.v('Ana: 2 en proceso', '2 en proceso' in a, a)
    import re
    m = re.search(r'Última compra\s+(\S+)', a)
    T.v('Ana: última compra = la más reciente que ya pasó (no la entrega futura)', bool(m) and m.group(1) == f(d(-100)), a)
    T.v('Ana: tiene un pedido en proceso, así que no se le dice «hace N días que no te compra»', 'que no te compra' not in a, a)
    T.v('Ana: pedidos recientes con los 3', all(x in a for x in ('Osito', 'Manta', 'Llavero')) and 'Pedidos recientes' in a, a)
    be = t(2)
    T.v('Beatriz: el pedido cancelado no cuenta y la venta suelta sí (1 · $ 35.000)', '$ 35.000' in be and '99.000' not in be, be)
    T.v('Beatriz: saldo al día', 'Al día' in be, be)
    T.v('Beatriz: sin avisos de «hace N días» (compró hace 10)', 'días que no te compra' not in be, be)
    T.v('Carla nueva: sin pedidos, explica qué anotar', 'Todavía no tiene pedidos anotados' in t(3), t(3))
    T.v('«Otra persona» no aparece en ningún historial', all('Bolso' not in t(k) for k in (1, 2, 3)))
    T.v('no se imprime', pg.evaluate("document.querySelectorAll('td.cl-historial.no-imprimir').length") >= 3)
    # un pedido nuevo cambia el historial al instante
    pg.evaluate("window.lrIrAHoja('control-pedidos')"); pg.wait_for_timeout(400)
    pg.evaluate("(()=>{const e=document.getElementById('ag-p5-cliente'); e.value='Carla Nueva'; e.dispatchEvent(new Event('input',{bubbles:true})); e.dispatchEvent(new Event('change',{bubbles:true}));})()"); pg.wait_for_timeout(700)
    pg.evaluate("window.lrIrAHoja('mis-clientas')"); pg.wait_for_timeout(900)
    pg.evaluate("document.querySelectorAll('#tabla-clientas tr.ficha .ficha-cab').forEach(b => { if (b.getAttribute('aria-expanded') !== 'true') b.click(); })"); pg.wait_for_timeout(400)
    T.v('al anotar un pedido a nombre de Carla, su historial lo muestra', '$ 70.000' in t(3) and 'Bolso' in t(3), t(3))
    pg.close()
    # clienta sin compra hace tiempo (aviso de 90 días)
    D2 = {'ag-duena': 'Sara', 'ag-cl1-nombre': 'Lejana', 'ag-p1-cliente': 'Lejana', 'ag-p1-pedido': 'Cojín', 'ag-p1-estado': 'Entregado', 'ag-p1-totalcompra': '$ 40.000', 'ag-p1-abono': '$ 40.000', 'ag-p1-entrega': f(d(-200))}
    pg = abrir(contexto(b, 1280, 900, datos=D2, config_abierta=False), 'mis-clientas', 2400, config=False)
    pg.evaluate("document.querySelectorAll('#tabla-clientas tr.ficha .ficha-cab').forEach(b => { if (b.getAttribute('aria-expanded') !== 'true') b.click(); })"); pg.wait_for_timeout(500)
    tl = pg.inner_text('#tabla-clientas tr.ficha[data-fila="1"] td.cl-historial')
    T.v('hace 200 días: aviso para escribirle', 'Hace 200 días que no te compra. ¿Le escribes?' in tl, tl)
    pg.close()
    pg = abrir(contexto(b, 390, 844, datos=DATOS, config_abierta=False), 'mis-clientas', 2400, config=False)
    pg.evaluate("document.querySelectorAll('#tabla-clientas tr.ficha .ficha-cab').forEach(b => { if (b.getAttribute('aria-expanded') !== 'true') b.click(); })"); pg.wait_for_timeout(500)
    T.v('celular: sin desplazamiento horizontal', not pg.evaluate("document.documentElement.scrollWidth>innerWidth"))
    pg.close()
    ctx = contexto(b, 1280, 900, datos=DATOS, config_abierta=False); ctx.add_init_script("localStorage.setItem('lrAgendaIdioma','en')")
    pg = abrir(ctx, 'mis-clientas', 3000, config=False)
    pg.evaluate("document.querySelectorAll('#tabla-clientas tr.ficha .ficha-cab').forEach(b => { if (b.getAttribute('aria-expanded') !== 'true') b.click(); })"); pg.wait_for_timeout(600)
    ti = pg.inner_text('#tabla-clientas tr.ficha[data-fila="1"] td.cl-historial')
    T.v('en inglés: etiquetas traducidas y nombres de productos intactos', 'Purchase history' in ti and 'Total purchased' in ti and 'Balance due' in ti and 'Osito' in ti and '2 in progress' in ti, ti)
    b.close()
T.fin()
