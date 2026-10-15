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
    im = Image.open(ruta).convert('RGBA')
    a = np.array(im)
    alfa = a[..., 3]
    blanco = (alfa < 250) | (a[..., :3].min(axis=2) >= 236)  # transparente o casi blanco
    etiquetas, n = ndimage.label(blanco)
    borde = set(etiquetas[0, :]) | set(etiquetas[-1, :]) | set(etiquetas[:, 0]) | set(etiquetas[:, -1])
    borde.discard(0)
    exterior = np.isin(etiquetas, list(borde))
    # el borde de sticker es una banda: se quita todo el blanco conectado con el exterior y se suaviza un píxel
    a[exterior, 3] = 0
    nuevo = Image.fromarray(a)
    alfa2 = np.array(nuevo)[..., 3]
    suave = ndimage.gaussian_filter(alfa2.astype(float), 0.8)
    suave[alfa2 == 0] = np.minimum(suave[alfa2 == 0], 0)
    arr = np.array(nuevo); arr[..., 3] = np.clip(np.where(alfa2 > 0, np.maximum(suave, alfa2 * 0.0 + 0) + (alfa2 - suave).clip(0) * 0, 0), 0, 255).astype(np.uint8)
    arr[..., 3] = np.where(alfa2 > 0, 255, 0).astype(np.uint8)
    nuevo = Image.fromarray(arr)
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
