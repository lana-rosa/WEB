"""Hojas unidas con pestañas (10-nov-2026): Mi tablero dentro de Mi panel y Proyectos por tejer junto a la Ficha de proyecto. Uso: python3 probar_agenda_pestanas_hoja.py"""
from agenda_util import *
T = Prueba()
DATOS = {'ag-duena': 'Sara', 'ag-f1-proyecto': 'Chal', 'ag-f1-estado': 'Tejiendo'}
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM, args=['--no-sandbox'])
    for ancho in (1280, 390):
        n = '%d px: ' % ancho
        pg = abrir(contexto(b, ancho, 900, datos=DATOS, config_abierta=False), '', 2000, config=False)
        T.v(n + 'el menú tiene 6 secciones (sin «Mi tablero» aparte)', pg.locator('.pestana').count() == 6 and 'tablero' not in ' '.join(pg.eval_on_selector_all('.pestana', 'e => e.map(x => x.textContent.toLowerCase())')))
        T.v(n + 'el menú de hojas ya no tiene «Mi tablero», «Proyectos por tejer» ni el Índice', pg.locator('#menu-hojas-lista a[data-hoja="tablero-agenda"], #menu-hojas-lista a[data-hoja="proyectos-fila"], #menu-hojas-lista a[data-hoja="indice-agenda"]').count() == 0)
        T.v(n + 'Mi panel tiene la pestaña «Mi tablero»', pg.locator('#panel-agenda .sub-pestana').count() == 2)
        pg.evaluate("document.querySelector('#panel-agenda .sub-pestana:not([aria-current])').click()"); pg.wait_for_timeout(500)
        T.v(n + 'tocar «Mi tablero» abre el tablero, con Inicio marcado en el menú y la pestaña actual', pg.evaluate("document.getElementById('tablero-agenda').classList.contains('abierta')") and pg.evaluate("document.querySelectorAll('.pestana')[0].getAttribute('aria-selected')") == 'true' and pg.evaluate("document.querySelector('#tablero-agenda .sub-pestana[aria-current]').textContent").endswith('Mi tablero'))
        pg.evaluate("document.querySelector('#tablero-agenda .sub-pestana:not([aria-current])').click()"); pg.wait_for_timeout(400)
        T.v(n + 'y se puede volver a Mi panel', pg.evaluate("document.getElementById('panel-agenda').classList.contains('abierta')"))
        pg.evaluate("window.lrIrAHoja('ficha-proyecto')"); pg.wait_for_timeout(400)
        T.v(n + 'Ficha de proyecto tiene la pestaña «Proyectos por tejer»', pg.locator('#ficha-proyecto .sub-pestana').count() == 2)
        pg.evaluate("document.querySelector('#ficha-proyecto .sub-pestana:not([aria-current])').click()"); pg.wait_for_timeout(500)
        T.v(n + 'que abre la lista, con «Mis proyectos» marcada en el menú', pg.evaluate("document.getElementById('proyectos-fila').classList.contains('abierta')") and pg.evaluate("document.querySelectorAll('.pestana')[1].getAttribute('aria-selected')") == 'true')
        T.v(n + 'la lista conserva lo escrito (datos intactos)', 'Chal' in pg.evaluate("document.getElementById('tabla-fila').innerText") or pg.evaluate("document.getElementById('ag-f1-proyecto') ? document.getElementById('ag-f1-proyecto').value : (JSON.parse(localStorage.getItem('rosinaAgenda')||'{}')['ag-f1-proyecto']||'')") == 'Chal')
        T.v(n + 'sin errores de JavaScript', not pg.errs, pg.errs)
    b.close()
T.fin()
