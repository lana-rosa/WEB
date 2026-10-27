"""Prueba (23-oct-2026): «Cargar una copia» de la Agenda para tejedoras no deja pasar HTML.
Uso: python3 herramientas/pruebas/probar_agenda_copia.py   (servidor local en el puerto 8765)"""
import json, os, sys, tempfile
from playwright.sync_api import sync_playwright
BASE = os.environ.get('BASE', 'http://localhost:8765')
res = []
def r(n, ok, d=''): res.append(ok); print(('  ok   ' if ok else '  FALLA'), n, ('' if ok else '→ ' + str(d)))
malo = {'agendaRosina': 1, 'fecha': '2026-10-23<img src=x onerror=window.__pwn=1>', 'datos': {
    'ventas': [{'cliente': '<img src=x onerror=window.__pwn=2>', 'valor': 5000}], 'notas': '<script>window.__pwn=3</script>Hola', '__proto__': {'x': 1},
    '<b onmouseover=1>': 'k', 'ok': 'texto normal & seguro', 'n': 12, 'lista': [1, '<i>2</i>', None, True]}}
bueno = {'agendaRosina': 1, 'fecha': '2026-10-23', 'datos': {'notas': 'Mi lista: 2 ovillos', 'n': 3}}
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/opt/pw-browsers/chromium', args=['--no-sandbox'])
    for w, h in ((390, 800), (1280, 800)):
        pg = b.new_page(viewport={'width': w, 'height': h}); errs = []; dialogs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('dialog', lambda d: (dialogs.append(d.message), d.accept()))
        pg.goto(BASE + '/agenda-rosina.html'); pg.wait_for_timeout(800)
        with tempfile.TemporaryDirectory() as td:
            for nombre, dato in (('malo', malo), ('bueno', bueno)):
                ruta = os.path.join(td, nombre + '.json'); open(ruta, 'w').write(json.dumps(dato))
                pg.set_input_files('#agenda-archivo', ruta); pg.wait_for_timeout(1500)
                pg.wait_for_load_state(); pg.wait_for_timeout(500)
                v = pg.evaluate("localStorage.getItem('rosinaAgenda')")
                if nombre == 'malo':
                    r(f'{w}px copia con HTML: se guardó sin < ni >', v is not None and '<' not in v and '>' not in v, v)
                    r(f'{w}px copia con HTML: los datos normales se conservan', v is not None and 'texto normal & seguro' in v and '"n":12' in v, v)
                    r(f'{w}px copia con HTML: no se ejecutó nada', pg.evaluate('window.__pwn') is None, pg.evaluate('window.__pwn'))
                    r(f'{w}px el aviso de confirmación no lleva HTML', dialogs and '<' not in dialogs[0], dialogs[:1])
                else:
                    r(f'{w}px copia normal: se carga igual', v is not None and all(json.loads(v).get(k) == x for k, x in bueno['datos'].items()), v)  # la agenda agrega sus propias claves (ag-anio, _anios)
        r(f'{w}px sin errores de JavaScript propios', not errs, errs[:2])
        pg.close()
    b.close()
print(f'\n{sum(res)} comprobaciones correctas, {len(res) - sum(res)} con falla.'); sys.exit(0 if all(res) else 1)
