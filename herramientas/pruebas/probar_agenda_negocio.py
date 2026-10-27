#!/usr/bin/env python3
"""Prueba (28-oct-2026) de las hojas del emprendimiento de la Agenda para tejedoras: pedidos con cuentas, contactos, gastos, proyectos por tejer y números del mes.
Uso: con un servidor local en el puerto 8765:  /usr/bin/python3 herramientas/pruebas/probar_agenda_negocio.py [carpeta_capturas]"""
import sys, json, datetime, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from agenda_util import *
T = Prueba(); CAP = sys.argv[1] if len(sys.argv) > 1 else None
def cap(pg, n):
    if CAP: os.makedirs(CAP, exist_ok=True); pg.screenshot(path=os.path.join(CAP, n))
def guardado(pg): return json.loads(pg.evaluate("localStorage.getItem('rosinaAgenda') || '{}'"))
def meta(pg, tabla, r): return pg.inner_text('#%s tr[data-fila="%d"] .ficha-meta' % (tabla, r))
h = datetime.date.today()
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM, args=['--no-sandbox'])
    # pedidos
    ctx = contexto(b, 390); pg = abrir(ctx, 'control-pedidos')
    ids = ['cliente', 'telefono', 'direccion', 'pedido', 'cantidad', 'valorunidad', 'precio', 'costoenvio', 'totalcompra', 'abono', 'saldo', 'reserva', 'entrega', 'envio', 'medio', 'forma', 'estado', 'obs']
    T.v('pedidos: tiene todas las preguntas pedidas', all(pg.locator('#ag-p1-' + i).count() == 1 for i in ids), [i for i in ids if pg.locator('#ag-p1-' + i).count() != 1])
    T.v('medio de pago y forma de envío son listas', pg.evaluate("document.getElementById('ag-p1-medio').tagName") == 'SELECT' and pg.evaluate("document.getElementById('ag-p1-forma').tagName") == 'SELECT')
    pg.fill('#ag-p1-cliente', 'Ana María'); pg.fill('#ag-p1-telefono', '300 123 4567'); pg.fill('#ag-p1-direccion', 'Calle 10 #5-37, Villamaría'); pg.fill('#ag-p1-pedido', 'Oso de 15 cm')
    pg.fill('#ag-p1-cantidad', '3'); pg.fill('#ag-p1-valorunidad', '$85.000'); pg.fill('#ag-p1-costoenvio', '18000'); pg.fill('#ag-p1-abono', '100000'); pg.wait_for_timeout(300)
    T.v('el valor total se calcula (3 × $85.000 = $255.000)', pg.input_value('#ag-p1-precio') == '$255.000', pg.input_value('#ag-p1-precio'))
    T.v('el total de la compra suma el envío ($273.000)', pg.input_value('#ag-p1-totalcompra') == '$273.000', pg.input_value('#ag-p1-totalcompra'))
    T.v('el saldo pendiente resta lo abonado ($173.000)', pg.input_value('#ag-p1-saldo') == '$173.000', pg.input_value('#ag-p1-saldo'))
    T.v('la ficha cerrada dice cuánto debe', 'Debe $173.000' in meta(pg, 'tabla-pedidos', 1), meta(pg, 'tabla-pedidos', 1))
    T.v('arriba se resume lo por cobrar', 'Por cobrar: $173.000' in pg.inner_text('#control-pedidos .resumen-pedidos'), pg.inner_text('#control-pedidos .resumen-pedidos'))
    pg.fill('#ag-p1-abono', '273000'); pg.wait_for_timeout(300)
    T.v('al pagar todo el saldo queda en $0 y la ficha dice «Pagado»', pg.input_value('#ag-p1-saldo') == '$0' and 'Pagado' in meta(pg, 'tabla-pedidos', 1), pg.input_value('#ag-p1-saldo'))
    T.v('se guarda con los nombres de siempre y los nuevos', guardado(pg).get('ag-p1-saldo') == '$0' and guardado(pg).get('ag-p1-telefono') == '300 123 4567')
    T.v('el teléfono trae el enlace de WhatsApp', pg.evaluate("document.querySelector('#ag-p1-telefono').parentNode.querySelector('.wa-link').href") == 'https://wa.me/573001234567', pg.evaluate("document.querySelector('#ag-p1-telefono').parentNode.querySelector('.wa-link').href"))
    pg.fill('#ag-p1-envio', (h + datetime.timedelta(days=2)).strftime('%d/%m/%Y')); pg.wait_for_timeout(300)
    ev = pg.evaluate("window.lrAgenda.eventos().filter(e => e.clave.startsWith('pedidoEnvio')).map(e => e.titulo)")
    T.v('la fecha de envío llega al calendario como «Envío: …»', len(ev) == 1 and ev[0].startswith('Envío: Oso de 15 cm'), ev)
    cap(pg, 'negocio-pedidos-390.png')
    T.v('sin desplazamiento horizontal', pg.evaluate("document.documentElement.scrollWidth <= innerWidth + 1"))
    T.v('sin errores de JavaScript', not pg.errs, pg.errs[:2]); ctx.close()
    # un pedido de antes (solo precio y abono) no se pisa
    ctx = contexto(b, 1280, datos={'ag-p1-cliente': 'Sara', 'ag-p1-precio': '$50.000', 'ag-p1-abono': '$20.000'}); pg = abrir(ctx, 'control-pedidos')
    pg.click('#tabla-pedidos tr[data-fila="1"] .ficha-cab'); pg.fill('#ag-p1-observ' if False else '#ag-p1-obs', 'Entregar en la tarde'); pg.wait_for_timeout(300)
    T.v('un pedido de antes conserva su precio y abono', pg.input_value('#ag-p1-precio') == '$50.000' and pg.input_value('#ag-p1-abono') == '$20.000')
    pg.fill('#ag-p1-abono', '$30.000'); pg.wait_for_timeout(300)
    T.v('y al cambiar el abono calcula el total de la compra y el saldo', pg.input_value('#ag-p1-totalcompra') == '$50.000' and pg.input_value('#ag-p1-saldo') == '$20.000', pg.input_value('#ag-p1-saldo'))
    T.v('sin errores de JavaScript', not pg.errs, pg.errs[:2]); ctx.close(); b.close()
T.fin()
