"""Pantalla de fotos del proyecto: antes, durante y después (E34, 12-nov-2026). Los datos son de lrDibStore.fotos (probar_agenda_fotos_galeria.py).
Uso: /usr/bin/python3 probar_agenda_fotos_proyecto.py"""
import json, os, tempfile
from PIL import Image, ImageDraw
from agenda_util import *
T = Prueba()
TMP = tempfile.mkdtemp(prefix='fp-')
def jpg(i):
    im = Image.new('RGB', (1400, 1000), (230 - i * 12, 120 + i * 8, 160)); d = ImageDraw.Draw(im); d.rectangle((200 + i * 20, 200, 900, 700), fill=(255, 255, 255)); d.ellipse((600, 300, 1100, 800), fill=(60, 20 + i * 10, 90))
    r = os.path.join(TMP, 'foto%d.jpg' % i); im.save(r, 'JPEG', quality=90); return r
FOTOS = [jpg(i) for i in range(10)]
F = "window.lrDibStore.fotos"
def lista(pg): return pg.evaluate(F + ".lista('ficha-proyecto', 'k1')")
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM)
    ctx = contexto(b, 1280, 1000, datos={'ag-duena': 'Sara', 'ag-pr-nombre': 'Chaleco'}, config_abierta=False)
    pg = abrir(ctx, 'ficha-proyecto', 2600, config=False)
    inp = '.fp-caja input[type=file]'
    T.v('la ficha de proyecto tiene «Fotos del proyecto» con «0 de 8» y «Agregar fotos»', pg.locator('.fp-caja').count() == 1 and 'fotos del proyecto' in pg.inner_text('.fp-caja').lower() and '0 de 8' in pg.inner_text('.fp-caja') and pg.locator('.fp-caja .dib-subir').is_visible())
    pg.set_input_files(inp, FOTOS[:3]); pg.wait_for_timeout(2500)
    T.v('al elegir 3 fotos quedan guardadas con las claves ficha-proyecto:k1:f1 a f3', [x['clave'] for x in lista(pg)] == ['ficha-proyecto:k1:f%d' % i for i in (1, 2, 3)], lista(pg) and [x['clave'] for x in lista(pg)])
    T.v('se ven 3 fotos y «3 de 8»', pg.locator('.fp-foto').count() == 3 and '3 de 8' in pg.inner_text('.fp-barra'))
    T.v('las fotos se reducen (cada una pesa menos del tope)', all(len(x['img']) <= pg.evaluate(F + '.TOPE_FOTO') for x in lista(pg)))
    pg.locator('.fp-foto').nth(0).locator('.fp-chip:has-text("Antes")').click(); pg.wait_for_timeout(400)
    T.v('«Antes» etiqueta la primera foto y queda marcada', lista(pg)[0]['t'] == 'Antes' and pg.locator('.fp-foto').nth(0).locator('.fp-chip.activo').inner_text() == 'Antes' and pg.locator('.fp-foto').nth(0).locator('.fp-chip.activo').get_attribute('aria-pressed') == 'true')
    pg.locator('.fp-foto').nth(0).locator('.fp-chip:has-text("Antes")').click(); pg.wait_for_timeout(400)
    T.v('tocar «Antes» otra vez quita la etiqueta', lista(pg)[0]['t'] == '')
    pg.locator('.fp-foto').nth(1).locator('.fp-chip:has-text("Después")').click(); pg.wait_for_timeout(300)
    pg.locator('.fp-foto').nth(2).locator('.fp-t').fill('Con el relleno puesto'); pg.locator('.fp-foto').nth(2).locator('.fp-t').press('Tab'); pg.wait_for_timeout(500)
    T.v('también se puede escribir lo que muestra la foto', [x['t'] for x in lista(pg)] == ['', 'Después', 'Con el relleno puesto'], [x['t'] for x in lista(pg)])
    # vista grande
    pg.locator('.fp-foto').nth(1).locator('.fp-ver').click(); pg.wait_for_selector('.pp-fondo'); pg.wait_for_timeout(300)
    T.v('al tocar una foto se abre la vista grande con su nombre', pg.locator('.fp-grande').is_visible() and 'Después' in pg.inner_text('.pp-caja h2'))
    pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
    T.v('Escape cierra la vista y devuelve el foco a la foto', pg.locator('.pp-fondo').count() == 0 and pg.evaluate("document.activeElement.classList.contains('fp-ver')"))
    # quitar
    pg.locator('.fp-foto').nth(0).locator('.fp-quitar').click(); pg.wait_for_timeout(500)
    T.v('«Quitar» saca la foto: quedan 2 y las otras conservan su etiqueta', len(lista(pg)) == 2 and [x['t'] for x in lista(pg)] == ['Después', 'Con el relleno puesto'] and '2 de 8' in pg.inner_text('.fp-barra'))
    # llegar al máximo
    pg.set_input_files(inp, FOTOS[3:9]); pg.wait_for_timeout(5000)
    T.v('con 6 fotos más llegan a 8 y desaparece «Agregar fotos»', len(lista(pg)) == 8 and pg.locator('.fp-caja .dib-subir').count() == 0 and '8 de 8' in pg.inner_text('.fp-barra'), len(lista(pg)))
    pg.locator('.fp-foto').nth(7).locator('.fp-quitar').click(); pg.wait_for_timeout(500)
    pg.set_input_files(inp, FOTOS[:3]); pg.wait_for_timeout(4000)
    T.v('si se eligen más fotos de las que caben, guarda solo las que caben (8) y avisa que ya tiene 8', len(lista(pg)) == 8 and 'Ya tienes 8 fotos' in pg.inner_text('.fp-msg'), (len(lista(pg)), pg.inner_text('.fp-msg')))
    # persistencia y fichas
    pg.reload(); pg.wait_for_timeout(3500)
    T.v('al recargar las 8 fotos siguen ahí con sus etiquetas', pg.locator('.fp-foto').count() == 8 and 'Después' in pg.locator('.fp-foto').nth(0).inner_text(), pg.locator('.fp-foto').count())
    pg.evaluate("window.lrVersiones.agregar('ficha-proyecto')"); pg.wait_for_timeout(1000)
    T.v('una ficha de proyecto nueva empieza sin fotos (0 de 8)', pg.locator('.fp-foto').count() == 0 and '0 de 8' in pg.inner_text('.fp-barra') and len(lista(pg)) == 8)
    pg.evaluate("window.lrVersiones.abrir('ficha-proyecto', 'k1')"); pg.wait_for_timeout(1000)
    T.v('al volver a la primera ficha están sus 8 fotos', pg.locator('.fp-foto').count() == 8)
    T.v('el dibujo del diseño de la ficha no se toca', 'ficha-proyecto:k1' not in [x['clave'] for x in lista(pg)] and pg.locator('#dibujo-proyecto').count() == 1)
    T.v('sin errores de JavaScript (computador)', not pg.errs, pg.errs)
    # celular
    ctx2 = contexto(b, 390, 844, datos={'ag-duena': 'Sara'}, config_abierta=False); pc = abrir(ctx2, 'ficha-proyecto', 2600, config=False)
    pc.set_input_files(inp, FOTOS[:4]); pc.wait_for_timeout(3500)
    T.v('en el celular las fotos se ven en rejilla y no hay desplazamiento horizontal', pc.locator('.fp-foto').count() == 4 and pc.evaluate("document.documentElement.scrollWidth <= window.innerWidth + 1"), pc.evaluate("document.documentElement.scrollWidth"))
    T.v('los botones de «Antes / Durante / Después» miden al menos 36 px de alto en el celular', pc.evaluate("[...document.querySelectorAll('.fp-chip')].every(e => e.getBoundingClientRect().height >= 35)"))
    T.v('sin errores de JavaScript (celular)', not pc.errs, pc.errs)
    b.close()
T.fin()
