#!/usr/bin/env python3
"""Fotos de antes y después de la simplificación de la agenda (6-nov-2026): dibujo del diseño, tiras de Rosina y compra de materiales al final de las hojas,
«Diseña tu patrón» (partes y fotos) y «Mis patrones». Uso: python3 herramientas/agenda-oscuro/fotos_simplificar.py SALIDA  (con la web en el puerto 8765)."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'pruebas'))
from agenda_util import *
DIB = {'ficha-proyecto:k1': {'s': [[1, 1, 120, 520, 260, 300, 400, 520, 540, 300, 680, 520], [2, 2, 150, 600, 650, 600], [0, 1, 300, 380, 300, 440]], 'img': ''}}
DP1 = {'ag-dp-nombre': 'Ovejita Rosa', 'ag-dp-nivel': 'Principiante', 'ag-dp-tipo': 'Amigurumi', 'ag-dp-p1-nombre': 'Cabeza', 'ag-dp-p1-vueltas': 'V1: 6 pb en am (6)\nV2: aum en cada pto (12)', 'ag-dp-p2-nombre': 'Cuerpo', 'ag-dp-p2-vueltas': 'V1: 6 pb en am (6)'}
DP2 = {'ag-dp-nombre': 'Gorro de invierno', 'ag-dp-nivel': 'Intermedio', 'ag-dp-probado': True}
DATOS = {'ag-duena': 'Sara', 'ag-nombre': 'Chal de lana', '_dib': DIB, **DP1,
         '_ver': {'disena-patron': {'orden': ['k1', 'k2'], 'actual': 'k1', 'v': {'k1': DP1, 'k2': DP2}, 'sig': 3}}}
ESCENAS = [('ficha-proyecto', None, 'proyecto'), ('mis-ideas', None, 'ideas'), ('disena-patron', 4, 'patron-partes'), ('disena-patron', 6, 'patron-fotos'), ('coleccion-patrones', None, 'mis-patrones')]
DESPUES = len(sys.argv) > 2 and sys.argv[2] == 'despues'
def foto_prueba(rgb1, rgb2):
    from PIL import Image
    im = Image.new('RGB', (600, 450)); px = im.load()
    for y in range(450):
        for x in range(600): t = (x + y) / 1050; px[x, y] = tuple(int(a + (b - a) * t) for a, b in zip(rgb1, rgb2))
    import io; bio = io.BytesIO(); im.save(bio, 'PNG'); return bio.getvalue()
def main():
    out = sys.argv[1]; os.makedirs(out, exist_ok=True)
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=CHROMIUM, args=['--no-sandbox'])
        for modo in ('claro', 'oscuro'):
            for disp, (w, h) in (('cel', (390, 844)), ('pc', (1280, 900))):
                ctx = contexto(b, w, h, datos=DATOS, config_abierta=False)
                ctx.add_init_script("localStorage.setItem('lrAgendaModo','%s');localStorage.setItem('lrAgendaTour','1');" % modo)
                pg = abrir(ctx, '', 2200, config=False)
                for hoja, paso, nombre in ESCENAS:
                    pg.evaluate("window.lrIrAHoja('%s')" % hoja); pg.wait_for_timeout(500)
                    if paso: pg.evaluate("document.querySelector('#dp-pasos .dp-paso-btn[data-i=\"%d\"]').click()" % paso); pg.wait_for_timeout(400)
                    if DESPUES and nombre == 'patron-partes':
                        for _ in range(4): pg.click('#dp-parte-mas'); pg.wait_for_timeout(120)
                        pg.keyboard.type('Cola'); pg.wait_for_timeout(200)
                    if DESPUES and nombre == 'patron-fotos':
                        pg.set_input_files('#dp-fotos input[type=file]', [{'name': 'a.png', 'mimeType': 'image/png', 'buffer': foto_prueba((242, 143, 192), (231, 78, 150))}, {'name': 'b.png', 'mimeType': 'image/png', 'buffer': foto_prueba((158, 162, 249), (147, 199, 249))}]); pg.wait_for_timeout(1200)
                        pg.fill('#dp-fotos .dp-foto >> nth=0 >> input', 'El resultado terminado'); pg.fill('#dp-fotos .dp-foto >> nth=1 >> input', 'Paso 3: la cabeza'); pg.keyboard.press('Tab'); pg.wait_for_timeout(300)
                    pg.screenshot(path='%s/%s-%s-%s.png' % (out, nombre, modo, disp), full_page=True)
                    if DESPUES and nombre == 'proyecto':
                        pg.click('.dib-abrir'); pg.wait_for_timeout(500); pg.evaluate("document.querySelectorAll('#ficha-proyecto .herr-plegable,#ficha-proyecto .tienda-plegable').forEach(d => d.open = true)")
                        pg.screenshot(path='%s/proyecto-abierto-%s-%s.png' % (out, modo, disp), full_page=True); pg.click('.dib-abrir')
                ctx.close()
        b.close()
main()
