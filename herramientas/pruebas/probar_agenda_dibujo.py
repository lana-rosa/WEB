#!/usr/bin/env python3
"""Prueba (28-oct-2026) de la ficha de proyecto ampliada (muestras de la paleta, dibujo y foto) y de la hoja de puntos.
Uso: con un servidor local en el puerto 8765:  /usr/bin/python3 herramientas/pruebas/probar_agenda_dibujo.py [carpeta_capturas]"""
import sys, json, os, base64, tempfile
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from agenda_util import *
T = Prueba(); CAP = sys.argv[1] if len(sys.argv) > 1 else None
def cap(pg, n):
    if CAP: os.makedirs(CAP, exist_ok=True); pg.screenshot(path=os.path.join(CAP, n))
def guardado(pg): return json.loads(pg.evaluate("localStorage.getItem('rosinaAgenda') || '{}'"))
PALETA = [{'id': 'a1', 'linea': 'Lana Chelin', 'marca': 'Kusi Kusi', 'color': 'Almendra', 'codigo_color': '2110'}, {'id': 'a2', 'linea': 'Lana Ecological Cotton', 'marca': 'Papatya', 'color': 'Lila 505', 'codigo_color': '505'}]
TRAZO = """([sel, tipo, pts]) => { const c = document.querySelector(sel); const r = c.getBoundingClientRect();
  const mk = (t, p) => new PointerEvent(t, { pointerType: tipo, pointerId: 9, isPrimary: true, bubbles: true, cancelable: true, clientX: r.left + p[0], clientY: r.top + p[1] });
  c.dispatchEvent(mk('pointerdown', pts[0])); pts.slice(1).forEach(p => c.dispatchEvent(mk('pointermove', p))); c.dispatchEvent(mk('pointerup', pts[pts.length - 1])); }"""
def trazo(pg, sel, pts, tipo='pen'): pg.evaluate(TRAZO, [sel, tipo, pts]); pg.wait_for_timeout(150)
# una imagen PNG pequeña
PNG = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mP8z8BQz0AEYBxVSF+FABJADveWkH6oAAAAAElFTkSuQmCC')
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM, args=['--no-sandbox'])
    ctx = contexto(b, 390); ctx.route('**/rpc/obtener_paleta_merceria', lambda r: r.fulfill(status=200, content_type='application/json', body=json.dumps(PALETA)))
    pg = abrir(ctx, 'ficha-proyecto')
    ids = ['nombre', 'para', 'autor', 'patron', 'marca', 'lana', 'aguja', 'colores', 'muestras', 'muestra', 'medidas', 'puntos', 'ajustes', 'notas']
    T.v('ficha de proyecto: tiene producto, autor, marca, aguja, muestras, medidas, puntos, ajustes y notas', all(pg.locator('#ag-' + i).count() == 1 for i in ids), [i for i in ids if pg.locator('#ag-' + i).count() != 1])
    T.v('sigue sin el contador de 100 vueltas', pg.locator('#vueltas-grid').count() == 0)
    opts = pg.evaluate("[...document.querySelectorAll('#muestras-sel option')].map(o => o.textContent)")
    T.v('el selector ofrece los colores de la paleta de la Mercería con su código', any('Almendra (cód. 2110)' in o for o in opts), opts)
    pg.select_option('#muestras-sel', index=1); pg.click('#muestras-add'); pg.select_option('#muestras-sel', index=2); pg.click('#muestras-add'); pg.wait_for_timeout(200)
    T.v('cada muestra se agrega en su renglón con marca, color y código', pg.input_value('#ag-muestras') == 'Kusi Kusi Chelin — Almendra (cód. 2110)\nPapatya Ecological Cotton — Lila (cód. 505)', repr(pg.input_value('#ag-muestras')))
    T.v('hay un enlace a la paleta para comprar', pg.locator('#ficha-proyecto a[href="/merceria/paleta-de-colores/"]').count() == 1)
    T.v('hay un lienzo para el dibujo del diseño', pg.locator('#dibujo-proyecto canvas').count() == 1 and pg.locator('#dibujo-proyecto input[type=file]').count() == 1)
    trazo(pg, '#dibujo-proyecto canvas', [[40, 60], [90, 100], [150, 90], [200, 40]])
    g = guardado(pg).get('_dib', {})
    T.v('un trazo del lápiz queda guardado en la ficha del proyecto', len(g.get('ficha-proyecto:k1', {}).get('s', [])) == 1, g)
    cap(pg, 'dibujo-proyecto-390.png')
    pg.click('#ficha-proyecto .vers-nueva'); pg.wait_for_timeout(400)
    trazo(pg, '#dibujo-proyecto canvas', [[30, 30], [120, 120]])
    g = guardado(pg).get('_dib', {})
    T.v('al agregar otro proyecto el dibujo es nuevo y no mezcla trazos', len(g.get('ficha-proyecto:k1', {}).get('s', [])) == 1 and len(g.get('ficha-proyecto:k2', {}).get('s', [])) == 1, list(g))
    pg.click('#ficha-proyecto .vers-item:first-child .vers-cab'); pg.wait_for_timeout(400)
    px = pg.evaluate("(() => { const c = document.querySelector('#dibujo-proyecto canvas'); const x = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < x.length; i += 4) if (x[i]) n++; return n })()")
    T.v('al volver al primero se ve su dibujo', px > 100, px)
    ruta = os.path.join(tempfile.mkdtemp(), 'f.png'); open(ruta, 'wb').write(PNG)
    pg.set_input_files('#dibujo-proyecto input[type=file]', ruta); pg.wait_for_timeout(700)
    T.v('subir una foto la deja de fondo y guardada (reducida)', (guardado(pg).get('_dib', {}).get('ficha-proyecto:k1', {}).get('img') or '').startswith('data:image/jpeg') and pg.is_visible('#dibujo-proyecto .dib-foto'))
    with pg.expect_download() as d: pg.click('#dibujo-proyecto [data-acc="bajar"]')
    T.v('se puede bajar el dibujo como imagen', d.value.suggested_filename.endswith('.png'), d.value.suggested_filename)
    pg.click('#ficha-proyecto .vers-item:nth-child(2) .vers-cab'); pg.wait_for_timeout(300)
    pg.click('#ficha-proyecto .vers-borrar'); pg.wait_for_timeout(400)
    T.v('borrar un proyecto borra también su dibujo', 'ficha-proyecto:k2' not in guardado(pg).get('_dib', {}), list(guardado(pg).get('_dib', {})))
    T.v('sin desplazamiento horizontal', pg.evaluate("document.documentElement.scrollWidth <= innerWidth + 1"))
    T.v('sin errores de JavaScript', not pg.errs, pg.errs[:2]); ctx.close()
    # hoja de puntos
    ctx = contexto(b, 390); pg = abrir(ctx, 'hoja-puntos')
    T.v('hoja de puntos: está en el menú y el índice', pg.locator('#menu-hojas-lista a[data-hoja="hoja-puntos"]').count() == 1 and pg.locator('#indice-agenda [data-ir="hoja-puntos"]').count() == 1)
    T.v('tiene su fondo de puntos y una sola página', pg.locator('.dib-fondo-puntos').count() == 1 and 'Página 1 de 1' in pg.inner_text('#puntos-cuenta'))
    trazo(pg, '#puntos-lienzo canvas', [[50, 80], [160, 140], [220, 90]])
    pg.click('#puntos-nueva'); pg.wait_for_timeout(300)
    T.v('«Agregar página» abre una hoja nueva en blanco', 'Página 2 de 2' in pg.inner_text('#puntos-cuenta') and guardado(pg).get('_puntosN') == 2)
    # Hoja de dibujo (antes «Hoja de puntos»): todos los colores
    T.v('se llama «Hoja de dibujo» en el menú, el índice y el título', 'Hoja de dibujo' in pg.inner_text('#menu-hojas-lista a[data-hoja="hoja-puntos"]') and 'Hoja de dibujo' in pg.inner_text('#hoja-puntos h3') and 'Hoja de puntos' not in pg.inner_text('#indice-agenda'))
    T.v('hay 5 colores a la vista y un botón de arcoíris para elegir cualquiera', pg.locator('#puntos-lienzo .dib-barra button.dib-color:not(.dib-color-libre):not(.dib-mio)').count() == 5 and pg.locator('#puntos-lienzo .dib-color-libre').count() == 1)
    pg.click('#puntos-lienzo .dib-color-libre'); pg.wait_for_timeout(200)
    T.v('el arcoíris abre una rueda de colores con «Agregar»', pg.locator('#puntos-lienzo .dib-rueda:visible .dr-disco').count() == 1 and pg.locator('#puntos-lienzo .dr-agregar').count() == 1)
    pg.evaluate("""() => { const d = document.querySelector('#puntos-lienzo .dr-disco'), r = d.getBoundingClientRect(); const o = { bubbles: true, clientX: r.left + r.width * 0.8, clientY: r.top + r.height / 2, pointerId: 1, pointerType: 'mouse', isPrimary: true, buttons: 1 }; d.dispatchEvent(new PointerEvent('pointerdown', o)); d.dispatchEvent(new PointerEvent('pointerup', o)); }""")
    pg.click('#puntos-lienzo .dr-agregar'); pg.wait_for_timeout(200)
    T.v('«Agregar a mis colores» deja el color guardado junto a los 5', pg.locator('#puntos-lienzo .dib-mio').count() == 1 and len(json.loads(pg.evaluate("localStorage.getItem('lrDibColores') || '[]'"))) == 1)
    pg.click('#puntos-lienzo .dib-color-libre'); pg.wait_for_timeout(100)
    pg.click('#puntos-lienzo .dib-mio'); pg.wait_for_timeout(100)
    mio = json.loads(pg.evaluate("localStorage.getItem('lrDibColores')"))[0].lower()
    trazo(pg, '#puntos-lienzo canvas', [[70, 70], [120, 160]])
    T.v('con el color de la rueda el trazo guarda el color elegido', guardado(pg).get('_dib', {}).get('puntos:2', {}).get('s', [[None]])[-1][0].lower() == mio, guardado(pg).get('_dib', {}).get('puntos:2'))
    pg.click('#puntos-lienzo .dib-barra button.dib-color[data-c="3"]')
    trazo(pg, '#puntos-lienzo canvas', [[30, 30], [60, 90]])
    T.v('un color de la paleta nueva guarda su número', guardado(pg).get('_dib', {}).get('puntos:2', {}).get('s', [[None]])[-1][0] == 3)
    pg.click('#puntos-lienzo [data-acc="deshacer"]'); pg.click('#puntos-lienzo [data-acc="deshacer"]'); pg.wait_for_timeout(200)
    trazo(pg, '#puntos-lienzo canvas', [[60, 60], [100, 200]])
    g = guardado(pg).get('_dib', {})
    T.v('cada página guarda sus trazos', len(g.get('puntos:1', {}).get('s', [])) == 1 and len(g.get('puntos:2', {}).get('s', [])) == 1, list(g))
    pg.click('#puntos-ant'); pg.wait_for_timeout(300)
    T.v('«Anterior» vuelve a la primera', 'Página 1 de 2' in pg.inner_text('#puntos-cuenta'))
    cap(pg, 'dibujo-puntos-390.png')
    T.v('sin desplazamiento horizontal', pg.evaluate("document.documentElement.scrollWidth <= innerWidth + 1"))
    T.v('sin errores de JavaScript', not pg.errs, pg.errs[:2]); ctx.close(); b.close()
T.fin()
