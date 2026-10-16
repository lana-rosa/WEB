#!/usr/bin/env python3
"""Recorta los implementos de tejer de la hoja hecha con ChatGPT (ilustraciones/hoja-implementos-chatgpt.webp) y los guarda sueltos,
con fondo transparente, en img/aventuras/implementos/. Se usan en los dibujos del libro (dibujos.js).
Uso: python3 herramientas/aventuras-de-rosina/recortar_implementos.py"""
import os
import numpy as np
from PIL import Image
from scipy import ndimage

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
HOJA = os.path.join(os.path.dirname(__file__), 'ilustraciones', 'hoja-implementos-chatgpt.webp')
DESTINO = os.path.join(RAIZ, 'img', 'aventuras', 'implementos')
# nombre -> caja (x0, x1, y0, y1) medida sobre la hoja de 1672 x 940
CAJAS = {
    'gancho': (20, 570, 185, 285), 'gancho-cabeza': (70, 256, 252, 440), 'ovillo': (562, 898, 105, 470), 'madeja': (915, 1195, 62, 472),
    'tijeras': (1190, 1642, 120, 424), 'aguja': (20, 506, 604, 822), 'marcadores': (536, 818, 536, 830), 'cinta': (832, 1126, 538, 850),
    'cadeneta': (1136, 1672, 513, 735),
}


def recortar(a, caja):
    x0, x1, y0, y1 = caja
    sub = a[y0:y1, x0:x1].copy()
    fondo = sub.min(axis=2) >= 241
    lab, n = ndimage.label(fondo)
    grandes = [i for i in range(1, n + 1) if (lab == i).sum() > 400]
    quitar = np.isin(lab, grandes)
    alfa = np.where(quitar, 0.0, 255.0)
    alfa = ndimage.gaussian_filter(alfa, 0.7)
    alfa = np.where(quitar & (alfa < 40), 0, alfa)
    # se queda solo con las piezas grandes del recuadro (descarta trozos de objetos vecinos que entran en la caja)
    lab2, n2 = ndimage.label(ndimage.binary_dilation(~quitar, iterations=3))
    tam = ndimage.sum(~quitar, lab2, range(1, n2 + 1))
    buenas = [i + 1 for i, t in enumerate(tam) if t >= 0.15 * max(tam)]
    alfa = np.where(np.isin(lab2, buenas), alfa, 0)
    rgba = np.dstack([sub, np.clip(alfa, 0, 255).astype(np.uint8)])
    im = Image.fromarray(rgba.astype(np.uint8), 'RGBA')
    return im.crop(im.getbbox())


def main():
    os.makedirs(DESTINO, exist_ok=True)
    a = np.array(Image.open(HOJA).convert('RGB'))
    for nombre, caja in CAJAS.items():
        im = recortar(a, caja)
        im.save(os.path.join(DESTINO, nombre + '.webp'), quality=90, method=6)
        print(nombre, im.size)


if __name__ == '__main__':
    main()
