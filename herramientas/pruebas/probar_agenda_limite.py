"""Prueba el aviso al llegar al máximo de 200 fichas en una lista (30-oct-2026, auditoría M2)."""
import sys, json; sys.path.insert(0, __file__.rsplit('/', 1)[0])
from agenda_util import *
T = Prueba()
D = {'_filas': {'tabla-clientas': 200}}
for i in range(1, 201): D['ag-cl%d-nombre' % i] = 'Clienta %d' % i
IR = "(h)=>{const a=document.querySelector('#menu-hojas-lista a[data-hoja=\"'+h+'\"]'); if(a) a.click()}"
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM, args=['--no-sandbox'])
    for ancho in (1280, 390):
        n = '%d px: ' % ancho
        ctx = contexto(b, ancho, 800, datos=D, config_abierta=False); pg = abrir(ctx, '', 2000, config=False)
        pg.evaluate(IR, 'mis-clientas'); pg.wait_for_timeout(500)
        filas = pg.evaluate("document.querySelectorAll('#tabla-clientas tr.ficha').length")
        T.v(n + 'la lista tiene las 200 fichas', filas == 200, filas)
        pg.evaluate("document.querySelector('#mis-clientas .ficha-barra [data-agregar], #mis-clientas .ficha-barra button').click()"); pg.wait_for_timeout(500)
        T.v(n + 'al intentar agregar la 201 aparece el aviso con la explicación', pg.locator('#mis-clientas .aviso-limite').is_visible() and '200 fichas' in pg.inner_text('#mis-clientas .aviso-limite'), pg.inner_text('#mis-clientas')[:200])
        T.v(n + 'no se creó ninguna ficha de más', pg.evaluate("document.querySelectorAll('#tabla-clientas tr.ficha').length") == 200)
        T.v(n + 'sin errores', not pg.errs, pg.errs[:2]); ctx.close()
    b.close()
T.fin()
