"""Plus etapa 1: avisos de hoy y consejo de Rosina en Mi panel (31-oct-2026). Uso: /usr/bin/python3 probar_agenda_avisos.py"""
from agenda_util import *
import datetime
hoy = datetime.date.today(); f = lambda d: d.strftime('%d/%m/%Y'); d = lambda n: hoy + datetime.timedelta(days=n)
DATOS = {'ag-duena': 'Sara',
  'ag-p1-cliente': 'Ana', 'ag-p1-pedido': 'Osito', 'ag-p1-entrega': f(d(-2)), 'ag-p1-estado': 'En proceso', 'ag-p1-totalcompra': '$ 80.000', 'ag-p1-abono': '$ 30.000',
  'ag-p2-cliente': 'Beto', 'ag-p2-pedido': 'Gorro', 'ag-p2-entrega': f(hoy), 'ag-p2-estado': 'En proceso', 'ag-p2-totalcompra': '$ 40.000', 'ag-p2-abono': '$ 40.000',
  'ag-p3-cliente': 'Carla', 'ag-p3-pedido': 'Manta', 'ag-p3-entrega': f(d(1)), 'ag-p3-estado': 'En proceso', 'ag-p3-totalcompra': '$ 100.000', 'ag-p3-abono': '',
  'ag-p4-cliente': 'Dora', 'ag-p4-pedido': 'Bolso', 'ag-p4-entrega': f(d(3)), 'ag-p4-estado': 'En proceso', 'ag-p4-totalcompra': '$ 60.000', 'ag-p4-abono': '$ 60.000',
  'ag-p5-cliente': 'Eva', 'ag-p5-pedido': 'Llavero', 'ag-p5-entrega': f(d(10)), 'ag-p5-estado': 'En proceso', 'ag-p5-totalcompra': '$ 20.000', 'ag-p5-abono': '$ 20.000',
  'ag-p6-cliente': 'Fani', 'ag-p6-pedido': 'Cojín', 'ag-p6-entrega': f(d(-30)), 'ag-p6-estado': 'Entregado', 'ag-p6-totalcompra': '$ 50.000', 'ag-p6-abono': '$ 20.000',
  'ag-f1-proyecto': 'Chaleco viejo', 'ag-f1-fecha': f(d(-5)), 'ag-f1-estado': 'Tejiendo', 'ag-f2-proyecto': 'Terminado ya', 'ag-f2-fecha': f(d(-9)), 'ag-f2-estado': 'Terminado'}
T = Prueba()
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM)
    pg = abrir(contexto(b, 1280, 900, datos=DATOS, config_abierta=False), '', 2200, config=False)
    T.v('sin errores de JavaScript', not pg.errs, pg.errs)
    a = pg.inner_text('.pn-avisos') if pg.locator('.pn-avisos').count() else ''
    T.v('hay tarjeta «Avisos de hoy»', 'Avisos de hoy' in a, a)
    T.v('entrega atrasada con saldo', 'Entrega atrasada: Ana · saldo $ 50.000' in a, a)
    T.v('entrega de hoy (sin saldo)', 'Entrega de hoy: Beto' in a and 'Beto · saldo' not in a, a)
    T.v('entrega mañana con saldo', 'Entrega mañana: Carla · saldo $ 100.000' in a, a)
    T.v('entrega en 3 días', 'Entrega en 3 días: Dora' in a, a)
    T.v('no avisa una entrega a 10 días', 'Eva' not in a)
    T.v('saldo pendiente de un pedido ya entregado', 'Saldo pendiente de Fani: $ 30.000' in a, a)
    T.v('el orden: atrasada antes que hoy', a.find('Ana') < a.find('Beto') < a.find('Carla'), a)
    T.v('máximo 5 avisos y resto resumido', pg.locator('.pn-aviso').count() == 5 and 'Y 1 aviso más' in a, (pg.locator('.pn-aviso').count(), a))
    pg.click('.pn-aviso >> nth=0'); pg.wait_for_timeout(400)
    T.v('tocar un aviso abre Control de pedidos', pg.evaluate("document.getElementById('control-pedidos').classList.contains('abierta')"))
    pg.evaluate("window.lrIrAHoja('panel-agenda')"); pg.wait_for_timeout(300)
    c = pg.inner_text('.pn-consejo') if pg.locator('.pn-consejo').count() else ''
    T.v('consejo: pedido sin abono', 'sin abono' in c, c)
    pg.click('.pn-consejo .pn-accion.sec'); pg.wait_for_timeout(300)
    c2 = pg.inner_text('.pn-consejo') if pg.locator('.pn-consejo').count() else ''
    T.v('«Entendido» lo quita y sale el siguiente consejo (o ninguno), nunca el mismo', 'sin abono' not in c2, c2)
    T.v('«Entendido» se recuerda al recargar', 'abono' in (pg.evaluate("localStorage.getItem('lrAgendaConsejos')") or ''))
    pg.close()
    # proyecto vencido (sin el pedido entregado, caben los 5 avisos)
    pg = abrir(contexto(b, 1280, 900, datos={k: v for k, v in DATOS.items() if not k.startswith('ag-p6')}, config_abierta=False), '', 2200, config=False)
    a = pg.inner_text('.pn-avisos')
    T.v('proyecto vencido sí, terminado no', 'El proyecto «Chaleco viejo» ya pasó su fecha' in a and 'Terminado ya' not in a, a)
    pg.close()
    # idioma inglés
    D2 = {k: v for k, v in DATOS.items() if not k.startswith('ag-p6')}
    ctx = contexto(b, 1280, 900, datos=D2, config_abierta=False)
    ctx.add_init_script("localStorage.setItem('lrAgendaIdioma', 'en')")
    pg = abrir(ctx, '', 2600, config=False)
    a = pg.inner_text('.pn-avisos') if pg.locator('.pn-avisos').count() else ''
    T.v('en inglés: título y avisos traducidos', "Today's alerts" in a and 'Late delivery: Ana · balance $ 50.000' in a and 'Delivery in 3 days: Dora' in a and 'The project “Chaleco viejo” is past its date' in a, a)
    T.v('en inglés: nombres sin tocar', 'Ana' in a and 'Carla' in a)
    pg.close()
    # sin datos: nada
    pg = abrir(contexto(b, 390, 800, datos={'ag-duena': 'Sara'}, config_abierta=False), '', 2000, config=False)
    T.v('sin pedidos: no salen avisos ni consejo', pg.locator('.pn-avisos').count() == 0 and pg.locator('.pn-consejo').count() == 0)
    T.v('celular: sin desplazamiento horizontal', not pg.evaluate("document.documentElement.scrollWidth>innerWidth"))
    b.close()
T.fin()
