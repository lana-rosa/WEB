"""«Materiales por comprar» de la semana → Lista de compras (pregunta 8, 11-nov-2026). Uso: python3 probar_agenda_compras_semana.py"""
from agenda_util import *
T = Prueba()
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM, args=['--no-sandbox'])
    ctx = contexto(b, 1280, 900, datos={'ag-duena': 'Sara', 'ag-comprar': 'Lana rosa\nOjos de 10 mm, Relleno\nlana ROSA', 'ag-c1-material': 'Relleno'}, config_abierta=False); pg = abrir(ctx, 'semana-tejiendo', 2000, config=False)
    mats = lambda: pg.evaluate("[...document.querySelectorAll('#tabla-compras textarea[id$=\"-material\"], #tabla-compras input[id$=\"-material\"]')].map(e => e.value).filter(Boolean)")
    T.v('hay un botón «Pasar a mi lista de compras» junto a los materiales por comprar', pg.locator('#semana-tejiendo .compras-semana button').count() == 1)
    pg.click('#semana-tejiendo .compras-semana button'); pg.wait_for_timeout(500)
    m = mats()
    T.v('pasa cada material a la lista, sin repetir los que ya están (ni con otras mayúsculas)', sorted(m) == sorted(['Relleno', 'Lana rosa', 'Ojos de 10 mm']), m)
    T.v('la casilla de la semana no se borra', 'Lana rosa' in pg.evaluate("document.getElementById('ag-comprar').value"))
    pg.click('#semana-tejiendo .compras-semana button'); pg.wait_for_timeout(300)
    T.v('si se toca otra vez no se duplica nada', len(mats()) == 3 and 'ya está' in pg.inner_text('#semana-tejiendo .compras-semana'), mats())
    pg.wait_for_timeout(800); pg.reload(); pg.wait_for_timeout(2000)
    T.v('queda guardado', len(mats()) == 3)
    T.v('sin errores de JavaScript', not pg.errs, pg.errs); ctx.close(); b.close()
T.fin()
