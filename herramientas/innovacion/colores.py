#!/usr/bin/env python3
"""Colores de las piezas para «Busca por color» (Etapa 4 del universo de Rosina).

Los colores se calculan con reglas (js/universo/colores.js, el mismo código del navegador) a partir de las fotos de img/productos/,
descontando el fondo de la foto (mesa, pared). Es una PROPUESTA: la revisan Claude a ojo y, luego, Sara o el taller. Los ajustes
a mano van en colores_datos.py (AJUSTES). El resultado es img/productos/colores.json (como extras.json, se vuelve a generar
cuando se suben fotos o productos nuevos). No usa IA ni servicios externos: las fotos no salen de este computador.

  python3 herramientas/innovacion/colores.py propuesta [carpeta_hojas]   → calcula y (si se da carpeta) dibuja hojas de revisión
  python3 herramientas/innovacion/colores.py generar                      → propuesta + AJUSTES → img/productos/colores.json
  python3 herramientas/innovacion/colores.py hoja carpeta                 → hojas de contacto del resultado final (para mirar)

Requisitos: Pillow y Node 18+.
"""
import base64, glob, json, os, re, subprocess, sys

from PIL import Image, ImageDraw

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
CARPETA = os.path.join(RAIZ, 'img', 'productos')
SALIDA = os.path.join(CARPETA, 'colores.json')
EXTRA = re.compile(r'-\d\.(jpg|jpeg|webp|png)$', re.I)   # nombre-2.jpg: fotos extra, no la principal
SIN_COLOR = re.compile(r'^amigurumi-personalizado-')       # fotos de referencia de lo que se teje a pedido: el color lo elige la persona
HEX = {'rosa': '#F28FC0', 'rojo': '#D62839', 'naranja': '#F28C28', 'amarillo': '#F7D23E', 'verde': '#4CAF50', 'azul': '#4C9BE8',
       'morado': '#9B6FD1', 'cafe': '#8B5A3C', 'crema': '#F5EBDC', 'gris': '#9A9A9F', 'negro': '#2B2B2E'}


def fotos():
    fs = sorted(os.path.basename(f) for f in glob.glob(os.path.join(CARPETA, '*')) if f.lower().endswith(('.jpg', '.jpeg', '.webp', '.png')))
    return [f for f in fs if not EXTRA.search(f) and not SIN_COLOR.match(f)]


def reducida(nombre, lado=64):
    im = Image.open(os.path.join(CARPETA, nombre)).convert('RGBA')
    k = min(1, lado / max(im.size))
    return im.resize((max(8, round(im.width * k)), max(8, round(im.height * k))), Image.BOX)


def perfiles(nombres):
    carga = []
    for n in nombres:
        im = reducida(n)
        carga.append({'id': n, 'ancho': im.width, 'alto': im.height, 'rgba': base64.b64encode(im.tobytes()).decode()})
    r = subprocess.run(['node', os.path.join(os.path.dirname(__file__), 'colores_cli.mjs')], input=json.dumps(carga), capture_output=True, text=True)
    if r.returncode:
        sys.exit('Falló el cálculo (¿Node instalado?):\n' + r.stderr)
    return {p['id']: p for p in json.loads(r.stdout)}


def ajustes():
    sys.path.insert(0, os.path.dirname(__file__))
    from colores_datos import AJUSTES
    return AJUSTES


def resultado(nombres=None):
    nombres = nombres or fotos()
    auto = perfiles(nombres)
    aj = ajustes()
    for k in aj:
        if k not in auto:
            print('Aviso: el ajuste de «%s» no corresponde a ninguna foto' % k)
    return {n: (aj[n] if n in aj else auto[n]['colores']) for n in nombres}, auto


def nombres_productos():
    # foto → nombre del producto (para que la hoja de revisión diga qué pieza es), tomado de la copia de prueba del catálogo
    ruta = os.path.join(RAIZ, 'herramientas', 'pruebas', 'fixtures', 'regalos.json')
    try:
        return {p['foto_url']: p['nombre'] for p in json.load(open(ruta, encoding='utf-8'))}
    except (OSError, ValueError, KeyError):
        return {}


def hojas(res, auto, carpeta, prefijo):
    os.makedirs(carpeta, exist_ok=True)
    nom = nombres_productos()
    nombres = sorted(res)
    W, H, cols, filas = 200, 290, 6, 3
    por = cols * filas
    for pag in range(0, len(nombres), por):
        grupo = nombres[pag:pag + por]
        hoja = Image.new('RGB', (W * cols, H * filas), 'white')
        d = ImageDraw.Draw(hoja)
        for i, n in enumerate(grupo):
            x, y = (i % cols) * W, (i // cols) * H
            im = Image.open(os.path.join(CARPETA, n)).convert('RGB'); im.thumbnail((W - 8, 210))
            hoja.paste(im, (x + 4, y + 2))
            for j, c in enumerate(res[n]):
                d.rectangle([x + 6 + j * 22, y + 216, x + 24 + j * 22, y + 234], fill=HEX[c], outline='#333')
            d.text((x + 6, y + 238), '%s%s' % (', '.join(res[n]), ' *' if n in ajustes() else ''), fill='black')
            d.text((x + 6, y + 252), (nom.get(n) or n)[:34], fill='#555')
            if n in auto:
                d.text((x + 6, y + 266), 'auto: ' + ', '.join(auto[n]['colores']), fill='#888')
        hoja.save(os.path.join(carpeta, '%s-%d.png' % (prefijo, pag // por + 1)))
    print('hojas en', carpeta)


def main():
    a = sys.argv[1:]
    if not a or a[0] not in ('propuesta', 'generar', 'hoja'):
        sys.exit(__doc__)
    res, auto = resultado()
    if a[0] == 'propuesta':
        for n in sorted(res):
            print('%-48s %s' % (n, ', '.join(auto[n]['colores'])))
        if len(a) > 1:
            hojas({n: auto[n]['colores'] for n in auto}, auto, a[1], 'propuesta')
    elif a[0] == 'generar':
        json.dump({'version': 1, 'nota': 'Colores de las fotos de los productos, propuestos con reglas y revisados; los ajustes a mano están en herramientas/innovacion/colores_datos.py',
                   'colores': res}, open(SALIDA, 'w', encoding='utf-8'), ensure_ascii=False, indent=1, sort_keys=True)
        print('%d fotos →' % len(res), os.path.relpath(SALIDA, RAIZ))
    else:
        hojas(res, auto, a[1] if len(a) > 1 else os.getcwd(), 'final')


if __name__ == '__main__':
    main()
