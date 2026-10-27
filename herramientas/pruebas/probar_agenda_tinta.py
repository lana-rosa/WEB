#!/usr/bin/env python3
"""Prueba (27-oct-2026) del lápiz de la Agenda para tejedoras: trazos con lápiz digital, mouse y dedo, borrador, deshacer, guardado y copia.
Uso: con un servidor local en el puerto 8765:  /usr/bin/python3 herramientas/pruebas/probar_agenda_tinta.py [carpeta_capturas]"""
import sys, json, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from agenda_util import *
T = Prueba(); CAP = sys.argv[1] if len(sys.argv) > 1 else None
def cap(pg, n):
    if CAP: os.makedirs(CAP, exist_ok=True); pg.screenshot(path=os.path.join(CAP, n))
def guardado(pg): return json.loads(pg.evaluate("localStorage.getItem('rosinaAgenda') || '{}'"))
# lápiz digital simulado: eventos de puntero con pointerType 'pen' sobre el lienzo
TRAZO = """([tipo, pts]) => { const c = document.querySelector('.tinta-canvas'); const r = c.getBoundingClientRect();
  const mk = (t, p) => new PointerEvent(t, { pointerType: tipo, pointerId: 7, isPrimary: true, bubbles: true, cancelable: true, clientX: r.left + p[0], clientY: r.top + p[1] });
  c.dispatchEvent(mk('pointerdown', pts[0])); pts.slice(1).forEach(p => c.dispatchEvent(mk('pointermove', p))); c.dispatchEvent(mk('pointerup', pts[pts.length - 1])); }"""
def trazo(pg, tipo, pts): pg.evaluate(TRAZO, [tipo, pts]); pg.wait_for_timeout(120)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM, args=['--no-sandbox'])
    ctx = contexto(b, 768, 900); pg = abrir(ctx, 'ficha-proyecto')
    T.v('el botón «Lápiz» está en la barra de la agenda', pg.locator('#tinta-modo').count() == 1)
    T.v('sin activar, el lienzo no tapa las casillas', pg.evaluate("getComputedStyle(document.querySelector('.tinta-canvas')).pointerEvents") == 'none')
    pg.click('#tinta-modo'); pg.wait_for_timeout(300)
    T.v('al activarlo aparecen los colores, el borrador y deshacer', pg.is_visible('.tinta-barra') and pg.locator('.tinta-barra .tb-color').count() == 5)
    trazo(pg, 'pen', [[60, 120], [90, 150], [130, 170], [180, 160], [220, 120]])
    g = guardado(pg)
    T.v('un trazo del lápiz digital se guarda en la hoja', len(g.get('_tinta', {}).get('ficha-proyecto', [])) == 1 and g['_tinta']['ficha-proyecto'][0][2:6] != [], g.get('_tinta'))
    px = pg.evaluate("(() => { const c = document.querySelector('.tinta-canvas'); const x = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < x.length; i += 4) if (x[i]) n++; return n })()")
    T.v('el trazo se ve dibujado en el lienzo', px > 200, px)
    trazo(pg, 'touch', [[300, 200], [340, 240], [380, 260]])
    T.v('con el dedo (sin activar «Dedo») no se dibuja: solo mueve la página', len(guardado(pg)['_tinta']['ficha-proyecto']) == 1)
    pg.check('#tinta-dedo'); trazo(pg, 'touch', [[300, 300], [340, 340], [380, 360]])
    T.v('al activar «Dedo» el dedo también dibuja', len(guardado(pg)['_tinta']['ficha-proyecto']) == 2)
    trazo(pg, 'mouse', [[100, 300], [140, 320], [180, 330]])
    T.v('el mouse dibuja', len(guardado(pg)['_tinta']['ficha-proyecto']) == 3)
    pg.click('.tinta-barra [data-c="1"]'); pg.click('.tinta-barra [data-a="2"]'); trazo(pg, 'pen', [[60, 400], [200, 420]])
    s = guardado(pg)['_tinta']['ficha-proyecto'][3]
    T.v('el color y el grosor elegidos se guardan con el trazo', s[0] == 1 and s[1] == 2, s[:2])
    cap(pg, 'tinta-768.png')
    pg.click('.tinta-barra [data-acc="deshacer"]'); pg.wait_for_timeout(150)
    T.v('«Deshacer» quita el último trazo', len(guardado(pg)['_tinta']['ficha-proyecto']) == 3)
    pg.click('.tinta-barra [data-h="borrar"]'); trazo(pg, 'pen', [[100, 300], [101, 301]])
    T.v('el borrador quita el trazo que toca', len(guardado(pg)['_tinta']['ficha-proyecto']) == 2)
    pg.click('.tinta-barra [data-acc="deshacer"]'); pg.wait_for_timeout(150)
    T.v('«Deshacer» también devuelve lo borrado', len(guardado(pg)['_tinta']['ficha-proyecto']) == 3)
    pg.click('.tinta-barra [data-acc="listo"]'); pg.wait_for_timeout(200)
    T.v('«Listo» vuelve a dejar escribir en las casillas, con la tinta a la vista', pg.evaluate("getComputedStyle(document.querySelector('.tinta-canvas')).pointerEvents") == 'none' and not pg.is_visible('.tinta-barra'))
    pg.fill('#ag-nombre', 'Bufanda'); pg.wait_for_timeout(200)
    T.v('se puede escribir en la casilla con la tinta al lado', pg.input_value('#ag-nombre') == 'Bufanda')
    pg.reload(); pg.wait_for_timeout(1500)
    px2 = pg.evaluate("(() => { const c = document.querySelector('.tinta-canvas'); const x = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < x.length; i += 4) if (x[i]) n++; return n })()")
    T.v('al volver a entrar la tinta sigue en su hoja', px2 > 200, px2)
    pg.goto(BASE + '/agenda-rosina.html#control-pedidos'); pg.wait_for_timeout(1000)
    T.v('en otra hoja no aparece la tinta de la anterior', pg.evaluate("(() => { const c = document.querySelector('.tinta-canvas'); const x = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; for (let i = 3; i < x.length; i += 4) if (x[i]) return false; return true })()"))
    pg.goto(BASE + '/agenda-rosina.html#ficha-proyecto'); pg.wait_for_timeout(1000)
    pg.click('#tinta-modo'); pg.click('.tinta-barra [data-acc="limpiar"]'); pg.wait_for_timeout(200)
    T.v('«Borrar toda la tinta de esta hoja» la quita', not guardado(pg).get('_tinta', {}).get('ficha-proyecto'))
    pg.click('.tinta-barra [data-acc="listo"]')
    T.v('sin desplazamiento horizontal', pg.evaluate("document.documentElement.scrollWidth <= innerWidth + 1"))
    T.v('sin errores de JavaScript', not pg.errs, pg.errs[:2]); ctx.close()
    # imprimir en blanco no lleva tinta
    ctx = contexto(b, 1280, 900, datos={'_tinta': {'ficha-proyecto': [[0, 1, 100, 100, 300, 200, 500, 150]]}}); pg = abrir(ctx, 'ficha-proyecto')
    pg.evaluate("document.body.classList.add('en-blanco')")
    T.v('al imprimir en blanco la tinta no sale', pg.evaluate("getComputedStyle(document.querySelector('.tinta-canvas')).display") == 'none')
    ctx.close(); b.close()
T.fin()
