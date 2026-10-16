#!/usr/bin/env python3
"""Quita el borde blanco de sticker de las poses de Rosina para que combine con los demás personajes del libro (sin borde).

Lee las poses de Rosina (stickers oficiales de img/stickers/ y poses nuevas de img/aventuras/rosina/), borra la banda blanca
que rodea la silueta (solo la que está conectada con el exterior y llega hasta el contorno propio del dibujo) y guarda las copias en
img/aventuras/rosina-plana/. NO modifica los archivos oficiales. Uso: python3 herramientas/aventuras-de-rosina/quitar_borde_rosina.py
"""
import os, re, sys
import numpy as np
from PIL import Image
from scipy import ndimage

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
DESTINO = os.path.join(RAIZ, 'img', 'aventuras', 'rosina-plana')
LADO = 512


def sin_borde(ruta):
    """Quita la banda del borde de sticker midiendo su ancho (no por color): así no se borran partes claras de Rosina (orejas, manos, cara)."""
    im = Image.open(ruta).convert('RGBA')
    a = np.array(im)
    dentro = a[..., 3] > 128
    dist = ndimage.distance_transform_edt(dentro)  # distancia de cada punto al exterior
    coloreado = dentro & (a[..., :3].min(axis=2) < 232)  # el dibujo propio (contorno, pelo, vestido…); el borde es casi blanco
    ancho = np.percentile(dist[coloreado], 2)  # donde empieza el dibujo = ancho del borde
    mantener = dist >= max(1.0, ancho - 0.5)
    mantener = ndimage.binary_opening(mantener, iterations=1)
    alfa = ndimage.gaussian_filter(mantener.astype(float), 0.8) * 255
    a[..., 3] = np.clip(alfa, 0, 255).astype(np.uint8)
    nuevo = Image.fromarray(a)
    caja = nuevo.getbbox()
    nuevo = nuevo.crop(caja)
    k = (LADO - 24) / max(nuevo.size)
    nuevo = nuevo.resize((max(1, round(nuevo.width * k)), max(1, round(nuevo.height * k))), Image.LANCZOS)
    lienzo = Image.new('RGBA', (LADO, LADO), (0, 0, 0, 0))
    lienzo.paste(nuevo, ((LADO - nuevo.width) // 2, LADO - nuevo.height - 8), nuevo)
    return lienzo


def main():
    os.makedirs(DESTINO, exist_ok=True)
    js = open(os.path.join(RAIZ, 'aventuras-de-rosina', 'contenido', 'personajes.js'), encoding='utf-8').read()
    rutas = sorted(set(re.findall(r"'(/img/(?:stickers/rosina-[\w-]+|aventuras/rosina/[\w-]+)\.webp)'", js)))
    for r in rutas:
        out = os.path.join(DESTINO, os.path.basename(r))
        sin_borde(os.path.join(RAIZ, r.lstrip('/'))).save(out, quality=88, method=6)
        print('ok', os.path.relpath(out, RAIZ))


if __name__ == '__main__':
    sys.exit(main())
