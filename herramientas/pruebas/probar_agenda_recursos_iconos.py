"""Íconos de «Recursos de Rosina» en la agenda: ninguno debe mostrar su código como texto (14-nov-2026, error de «Aguja lanera»). Uso: /usr/bin/python3 probar_agenda_recursos_iconos.py"""
from agenda_util import *
T = Prueba()
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM)
    for ancho, alto, n in ((1280, 900, '1280 px: '), (390, 844, '390 px: ')):
        pg = abrir(contexto(b, ancho, alto, datos={'ag-duena': 'Sara'}, config_abierta=False), 'recursos-rosina', 2800, config=False)
        T.v(n + 'hay términos de glosario en la hoja', pg.locator('#recursos-rosina .rr-termino').count() > 20, pg.locator('#recursos-rosina .rr-termino').count())
        T.v(n + 'ningún texto de la hoja muestra código de un dibujo («<svg», «&lt;»)', not pg.evaluate("/<svg|&lt;|stroke-linecap/.test(document.getElementById('recursos-rosina').innerText)"))
        a = pg.locator('#recursos-rosina .rr-termino:has(b:text-is("Aguja lanera")) .rr-sim')
        T.v(n + '«Aguja lanera» muestra su dibujo (un svg), no texto', a.count() == 1 and a.locator('svg.ic-aguja').count() == 1 and a.inner_text().strip() == '', a.inner_text() if a.count() else 'no está')
        T.v(n + 'el dibujo de «Aguja lanera» tiene tamaño visible', pg.evaluate("(() => { const e = document.querySelector('#recursos-rosina .rr-termino svg.ic-aguja'); if (!e) return false; const r = e.getBoundingClientRect(); return r.width >= 12 && r.width <= 60 && r.height >= 12; })()"))
        T.v(n + 'todos los términos tienen su dibujo o ícono (ninguno con el recuadro vacío)', pg.evaluate("[...document.querySelectorAll('#recursos-rosina .rr-termino .rr-sim')].every(e => e.querySelector('svg') || e.textContent.trim().length > 0)"))
        T.v(n + 'sin errores de JavaScript', not pg.errs, pg.errs)
    b.close()
T.fin()
