"""Validaciones de pedidos y clientas (E34, 12-nov-2026). Uso: /usr/bin/python3 probar_agenda_validaciones.py"""
import json
from agenda_util import *
DATOS = {'ag-duena': 'Sara', 'ag-p1-cliente': 'Ana', 'ag-p1-pedido': 'Osito', 'ag-p1-cantidad': '1', 'ag-p1-valorunidad': '$ 80.000', 'ag-p1-totalcompra': '$ 80.000', 'ag-p1-precio': '$ 80.000', 'ag-p1-saldo': '$ 80.000',
         'ag-p2-cliente': 'Beto', 'ag-p2-pedido': 'Gorro', 'ag-p2-totalcompra': '$ 50.000', 'ag-p2-abono': '-20.000',
         'ag-cl1-nombre': 'Ana Gómez', 'ag-cl1-whatsapp': '3001234567', 'ag-cl2-nombre': 'Beto Ruiz', 'ag-cl2-whatsapp': '3109998888'}
T = Prueba()
def g(pg): return json.loads(pg.evaluate("localStorage.getItem('rosinaAgenda')") or '{}')
def fichas(pg, t): pg.evaluate("document.querySelectorAll('#%s tr.ficha .ficha-cab').forEach(b => { if (b.getAttribute('aria-expanded') !== 'true') b.click(); })" % t); pg.wait_for_timeout(500)
def sal(s): return str(s).replace(' ', '')
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM)
    pg = abrir(contexto(b, 1280, 1000, datos=DATOS, config_abierta=False), 'control-pedidos', 2300, config=False); fichas(pg, 'tabla-pedidos')
    td = lambda n, c: '#tabla-pedidos tr.ficha[data-fila="%d"] td[data-col="%s"]' % (n, c)
    # --- negativos al escribir
    pg.fill('#ag-p1-valorunidad', ''); pg.type('#ag-p1-valorunidad', '-50000'); pg.wait_for_timeout(700); d = g(pg)
    T.v('al escribir -50000 en el valor por unidad se quita el signo y queda 50.000', '-' not in d['ag-p1-valorunidad'] and sal(d['ag-p1-valorunidad']).endswith('50.000'), d['ag-p1-valorunidad'])
    T.v('el total se calcula con el valor sin signo (positivo)', '-' not in d['ag-p1-totalcompra'] and sal(d['ag-p1-totalcompra']).endswith('50.000'), d['ag-p1-totalcompra'])
    T.v('avisa «No puede ser negativo»', 'No puede ser negativo' in pg.inner_text(td(1, 'valorunidad')), pg.inner_text(td(1, 'valorunidad')))
    pg.fill('#ag-p1-abono', '-30000'); pg.wait_for_timeout(700); d = g(pg)
    T.v('un abono con signo menos queda sin signo y el saldo no crece (80.000 total → 50.000 si valor 50.000 − 30.000 = 20.000)', '-' not in d['ag-p1-abono'] and sal(d['ag-p1-saldo']) == '$20.000', (d['ag-p1-abono'], d['ag-p1-saldo']))
    pg.fill('#ag-p1-costoenvio', '−5000'); pg.wait_for_timeout(600)
    T.v('también quita el signo menos «largo» (−) al pegar', '−' not in g(pg)['ag-p1-costoenvio'] and g(pg)['ag-p1-costoenvio'].replace(' ', '').endswith('5.000'), g(pg)['ag-p1-costoenvio'])
    pg.fill('#ag-p1-valorunidad', '60000'); pg.press('#ag-p1-valorunidad', 'Tab'); pg.wait_for_timeout(500)
    T.v('al salir de la casilla con un valor normal el aviso se quita', pg.locator(td(1, 'valorunidad') + ' .val-neg').count() == 0)
    # --- negativo guardado de antes: aviso fijo sin cambiar el dato
    T.v('un valor negativo guardado de antes muestra «Este valor es negativo» y no se cambia solo', 'Este valor es negativo' in pg.inner_text(td(2, 'abono')) and g(pg)['ag-p2-abono'] == '-20.000', pg.inner_text(td(2, 'abono')))
    pg.fill('#ag-p2-abono', '20000'); pg.wait_for_timeout(800)
    T.v('al corregirlo el aviso fijo desaparece', pg.locator(td(2, 'abono') + ' .val-neg-fijo').count() == 0)
    # --- saldo nunca menor que 0
    pg.fill('#ag-p2-abono', '90000'); pg.wait_for_timeout(800); d = g(pg)
    T.v('si el abono supera el total, el saldo queda en $0 (no negativo)', sal(d['ag-p2-saldo']) == '$0', d['ag-p2-saldo'])
    T.v('y sigue el aviso «El abono es mayor que el total»', 'mayor que el total' in pg.inner_text('#tabla-pedidos tr.ficha[data-fila="2"] td.pd-abonos'))
    T.v('sin errores de JavaScript (pedidos)', not pg.errs, pg.errs)
    # --- WhatsApp repetido en clientas
    pg.evaluate("window.lrIrAHoja('mis-clientas')"); pg.wait_for_timeout(800); fichas(pg, 'tabla-clientas')
    tw = lambda n: '#tabla-clientas tr.ficha[data-fila="%d"] td[data-col="whatsapp"]' % n
    T.v('sin repetidos no avisa nada', pg.locator('#tabla-clientas .val-wa').count() == 0)
    pg.fill('#ag-cl3-nombre', 'Carla'); pg.fill('#ag-cl3-whatsapp', '300 123 4567'); pg.wait_for_timeout(900)
    T.v('una clienta nueva con el WhatsApp de otra avisa «Ya tienes a Ana Gómez»', 'Ya tienes a «Ana Gómez» con este WhatsApp' in pg.inner_text(tw(3)), pg.inner_text(tw(3)))
    T.v('y la primera también avisa de Carla; Beto no', 'Carla' in pg.inner_text(tw(1)) and pg.locator(tw(2) + ' .val-wa').count() == 0)
    T.v('solo avisa: no cambia el WhatsApp ni bloquea', g(pg)['ag-cl3-whatsapp'] == '300 123 4567' and g(pg)['ag-cl3-nombre'] == 'Carla')
    pg.fill('#ag-cl3-whatsapp', '3201112222'); pg.wait_for_timeout(900)
    T.v('al cambiarlo por uno distinto el aviso desaparece', pg.locator('#tabla-clientas .val-wa').count() == 0)
    pg.fill('#ag-cl3-whatsapp', '3001'); pg.wait_for_timeout(700)
    T.v('un teléfono incompleto no genera avisos', pg.locator('#tabla-clientas .val-wa').count() == 0)
    T.v('sin errores de JavaScript (clientas)', not pg.errs, pg.errs)
    b.close()
T.fin()
