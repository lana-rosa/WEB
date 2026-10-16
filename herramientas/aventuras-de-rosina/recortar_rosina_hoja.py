#!/usr/bin/env python3
"""Recorta las 10 poses nuevas de Rosina de la hoja de Sara (ilustraciones/hoja-rosina-poses.webp, fondo blanco y sin borde de sticker)
y las guarda con fondo transparente en img/aventuras/rosina-plana/ (reemplazan a las que dejó el recorte automático).
Orden de la hoja: fila 1: tejiendo, gancho, contando, señalando, fuerza; fila 2: sorpresa, consuelo, mapa, diploma, lupa.
Uso: python3 herramientas/aventuras-de-rosina/recortar_rosina_hoja.py"""
import os
import numpy as np
from PIL import Image
from scipy import ndimage

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
HOJA = os.path.join(os.path.dirname(__file__), 'ilustraciones', 'hoja-rosina-poses.webp')
DESTINO = os.path.join(RAIZ, 'img', 'aventuras', 'rosina-plana')
NOMBRES = [['tejiendo', 'gancho', 'contando', 'senalando', 'fuerza'], ['sorpresa', 'consuelo', 'mapa', 'diploma', 'lupa']]
COLUMNAS = [0, 318, 620, 925, 1213, 1536]  # cortes entre poses (medidos sobre la hoja de 1536 x 1024)
FILAS = [0, 512, 1024]
LADO = 512


def recortar(sub):
    m = sub.min(axis=2)
    fondo_pos = m >= 249  # el fondo de la hoja es 254; la cara y las manos de Rosina son más oscuras
    lab, n = ndimage.label(fondo_pos)
    borde = set(lab[0, :]) | set(lab[-1, :]) | set(lab[:, 0]) | set(lab[:, -1])
    borde.discard(0)
    fondo = np.isin(lab, list(borde))
    # huecos blancos entre brazo y cuerpo, etc.: solo si son blanco puro y grandes
    for i in range(1, n + 1):
        if i not in borde and (lab == i).sum() > 200 and m[lab == i].min() >= 251:
            fondo |= (lab == i)
    alfa = np.where(fondo, 0.0, 1.0)
    # orilla suave: los píxeles claros pegados al fondo salen semitransparentes (sin halo blanco)
    orilla = ndimage.binary_dilation(fondo, iterations=2) & ~fondo
    alfa = np.where(orilla, np.clip((252 - m) / 22.0, 0, 1), alfa)
    # se queda solo con la pieza grande (descarta motas)
    lab2, n2 = ndimage.label(alfa > 0.05)
    tam = ndimage.sum(alfa > 0.05, lab2, range(1, n2 + 1))
    grandes = [i + 1 for i, t in enumerate(tam) if t >= 0.05 * max(tam)]
    alfa = np.where(np.isin(lab2, grandes), alfa, 0)
    rgba = np.dstack([sub, (alfa * 255).astype(np.uint8)])
    im = Image.fromarray(rgba.astype(np.uint8), 'RGBA')
    im = im.crop(im.getbbox())
    k = (LADO - 24) / max(im.size)
    im = im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.LANCZOS)
    lienzo = Image.new('RGBA', (LADO, LADO), (0, 0, 0, 0))
    lienzo.paste(im, ((LADO - im.width) // 2, LADO - im.height - 8), im)
    return lienzo


def cortes(a, fila):
    """Afina los cortes entre poses: en cada fila busca, cerca del corte medido, la franja con menos dibujo (así no se recortan orejas ni manos)."""
    sub = a[FILAS[fila]:FILAS[fila + 1]].min(axis=2)
    oscuro = (sub < 245).sum(axis=0).astype(float)
    res = [0]
    for c in COLUMNAS[1:-1]:
        ventana = range(max(res[-1] + 100, c - 60), min(len(oscuro) - 100, c + 60))
        suave = np.convolve(oscuro, np.ones(9) / 9, mode='same')
        res.append(min(ventana, key=lambda x: suave[x]))
    res.append(len(oscuro))
    return res


def main():
    os.makedirs(DESTINO, exist_ok=True)
    a = np.array(Image.open(HOJA).convert('RGB'))
    for f, fila in enumerate(NOMBRES):
        cs = cortes(a, f)
        for c, nombre in enumerate(fila):
            sub = a[FILAS[f]:FILAS[f + 1], cs[c]:cs[c + 1]]
            recortar(sub).save(os.path.join(DESTINO, nombre + '.webp'), quality=90, method=6)
            print('ok', nombre)


if __name__ == '__main__':
    main()
