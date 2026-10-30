"""Prueba que una copia sin «_filas» (muy antigua o hecha a mano) con datos en renglones lejanos no deje nada invisible (30-oct-2026, auditoría)."""
import sys, json; sys.path.insert(0, __file__.rsplit('/', 1)[0])
from agenda_util import *
T = Prueba()
IR = "(h)=>{const a=document.querySelector('#menu-hojas-lista a[data-hoja=\"'+h+'\"]'); if(a) a.click()}"
copia = {'agendaRosina': 1, 'fecha': '2026-09-01', 'datos': {'ag-p12-cliente': 'Clienta antigua 12', 'ag-vt15-producto': 'Venta 15', 'ag-vt15-precio': '$ 50.000', 'ag-c13-material': 'Lana', 'ag-pt1-guardado': True}}
open('/tmp/copia-vieja.json', 'w').write(json.dumps(copia))
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM, args=['--no-sandbox'])
    ctx = contexto(b, 1280, 900); pg = abrir(ctx, '', 1500)
    pg.set_input_files('#agenda-archivo', '/tmp/copia-vieja.json'); pg.wait_for_timeout(2500)
    pg.evaluate(IR, 'control-pedidos'); pg.wait_for_timeout(400)
    T.v('pedidos: el renglón 12 existe y muestra a la clienta de la copia', pg.evaluate("(document.getElementById('ag-p12-cliente')||{}).value") == 'Clienta antigua 12')
    T.v('ventas: el renglón 15 existe con su producto', pg.evaluate("(document.getElementById('ag-vt15-producto')||{}).value") == 'Venta 15')
    T.v('compras: el renglón 13 existe', pg.evaluate("(document.getElementById('ag-c13-material')||{}).value") == 'Lana')
    T.v('los renglones de otras listas no se inflan por claves parecidas (patrones, agujas)', pg.evaluate("document.querySelectorAll('#tabla-patrones tr.ficha, #tabla-coleccion tr.ficha').length") < 20 and pg.evaluate("document.querySelectorAll('#tabla-pedidos tr.ficha').length") == 12)
    d = json.loads(pg.evaluate("localStorage.getItem('rosinaAgenda')"))
    T.v('lo guardado conserva todo y registra cuántos renglones hay', d.get('ag-p12-cliente') == 'Clienta antigua 12' and d.get('_filas', {}).get('tabla-pedidos') == 12, d.get('_filas'))
    T.v('sin errores', not pg.errs, pg.errs[:2]); b.close()
T.fin()
