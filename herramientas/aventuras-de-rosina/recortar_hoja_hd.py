#!/usr/bin/env python3
"""Recorta las poses de Rosina de una hoja horizontal (varias poses en una fila, fondo blanco, sin borde de sticker) y las deja con fondo
transparente en un lienzo cuadrado de 1024 px (la pose se agranda con LANCZOS y un realce suave: el estilo plano de líneas finas lo tolera).

Uso: python3 herramientas/aventuras-de-rosina/recortar_hoja_hd.py HOJA.webp salida/ nombre1 nombre2 ...   (los nombres, de izquierda a derecha)
Busca los cortes en el espacio vacío entre poses (no necesita medidas). Ver ilustraciones/PROMPTS-ROSINA-Y-JUEGOS.md.
"""
import os, sys
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

LADO = 1024

def cortes(m, n):
    """Franjas verticales vacías entre poses; devuelve n tramos (x0, x1)."""
    col = m.sum(axis=0) > 0
    tramos, ini = [], None
    for x, v in enumerate(col):
        if v and ini is None: ini = x
        if not v and ini is not None:
            tramos.append([ini, x]); ini = None
    if ini is not None: tramos.append([ini, len(col)])
    tramos = [t for t in tramos if t[1] - t[0] > 20]
    while len(tramos) < n:  # poses que se tocan (un solo tramo): se parte el más ancho por donde haya menos dibujo
        i = max(range(len(tramos)), key=lambda i: tramos[i][1] - tramos[i][0]); x0, x1 = tramos[i]
        suave = np.convolve(m[:, x0:x1].sum(axis=0).astype(float), np.ones(9) / 9, mode='same')
        centro = range(int((x1 - x0) * 0.35), int((x1 - x0) * 0.65))
        corte = x0 + min(centro, key=lambda x: suave[x]); tramos[i:i + 1] = [[x0, corte], [corte, x1]]
    while len(tramos) > n:  # tramos de más (motas): se une el más pequeño con su vecino más cercano
        a = min(range(len(tramos)), key=lambda i: tramos[i][1] - tramos[i][0])
        j = a - 1 if a > 0 and (a == len(tramos) - 1 or tramos[a][0] - tramos[a - 1][1] < tramos[a + 1][0] - tramos[a][1]) else a + 1
        lo, hi = sorted((a, j)); tramos[lo] = [tramos[lo][0], tramos[hi][1]]; del tramos[hi]
    return tramos

def reparto(a, n):
    """Asigna cada punto del dibujo a una pose: se separan las poses con una erosión leve, se toman las n piezas grandes (de izquierda a derecha)
    y cada punto restante (la bombilla, un corazón suelto, el borde fino) va a la pieza grande más cercana. Devuelve una lista de máscaras o None."""
    m = a.min(axis=2) < 235
    er = ndimage.binary_erosion(m, iterations=3)
    lab, k = ndimage.label(er)
    if k < n: return None
    tam = ndimage.sum(er, lab, range(1, k + 1))
    grandes = [i + 1 for i in np.argsort(tam)[::-1][:n]]
    if min(tam[i - 1] for i in grandes) < 0.3 * max(tam): return None
    grandes.sort(key=lambda i: ndimage.center_of_mass(lab == i)[1])
    marc = np.zeros_like(lab)
    for j, i in enumerate(grandes, 1): marc[lab == i] = j
    _, (iy, ix) = ndimage.distance_transform_edt(marc == 0, return_indices=True)
    cerca = marc[iy, ix]
    return [ndimage.binary_fill_holes(m & (cerca == j)) for j in range(1, n + 1)]

def pose(sub):
    m = sub.min(axis=2)
    fondo_pos = m >= 245
    lab, n = ndimage.label(fondo_pos)
    borde = set(lab[0, :]) | set(lab[-1, :]) | set(lab[:, 0]) | set(lab[:, -1]); borde.discard(0)
    fondo = np.isin(lab, list(borde))
    for i in range(1, n + 1):  # huecos blancos grandes entre brazo y cuerpo
        if i not in borde and (lab == i).sum() > 300 and m[lab == i].min() >= 250: fondo |= (lab == i)
    alfa = np.where(fondo, 0.0, 1.0)
    orilla = ndimage.binary_dilation(fondo, iterations=2) & ~fondo
    alfa = np.where(orilla, np.clip((250 - m) / 25.0, 0, 1), alfa)
    lab2, n2 = ndimage.label(alfa > 0.05)
    tam = ndimage.sum(alfa > 0.05, lab2, range(1, n2 + 1))
    # Se conservan las piezas grandes y también las pequeñas sueltas (la bombilla sobre la cabeza, un corazón), pero no los restos de la pose
    # vecina: una pieza pequeña pegada al borde izquierdo o derecho del recorte es un resto.
    cajas = ndimage.find_objects(lab2); ancho = alfa.shape[1]; buenas = []
    for i, t in enumerate(tam):
        cx = (cajas[i][1].start + cajas[i][1].stop) / 2
        pegada = cajas[i][1].start <= 2 or cajas[i][1].stop >= ancho - 2 or cx < 0.18 * ancho or cx > 0.82 * ancho
        if t >= 0.25 * max(tam) or (t >= 0.002 * max(tam) and not pegada): buenas.append(i + 1)
    alfa = np.where(np.isin(lab2, buenas), alfa, 0)
    im = Image.fromarray(np.dstack([sub, (alfa * 255).astype(np.uint8)]).astype(np.uint8), 'RGBA')
    im = im.crop(im.getbbox())
    k = (LADO - 40) / max(im.size)
    im = im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.LANCZOS)
    rgb = im.convert('RGB').filter(ImageFilter.UnsharpMask(radius=1.2, percent=60, threshold=2))
    im = Image.merge('RGBA', (*rgb.split(), im.getchannel('A')))
    lienzo = Image.new('RGBA', (LADO, LADO), (0, 0, 0, 0))
    lienzo.paste(im, ((LADO - im.width) // 2, LADO - im.height - 16), im)
    return lienzo

def main():
    hoja, salida, nombres = sys.argv[1], sys.argv[2], sys.argv[3:]
    a = np.array(Image.open(hoja).convert('RGB'))
    os.makedirs(salida, exist_ok=True)
    m = a.min(axis=2) < 235
    tramos = cortes(m, len(nombres))
    # Las poses que se tocan (orejas pegadas) salen en un solo tramo: ahí se reparten por piezas conectadas; las demás se cortan por columnas.
    juntos = {}
    col = m.sum(axis=0) > 0
    sueltos, ini = [], None
    for x, v in enumerate(col):
        if v and ini is None: ini = x
        if not v and ini is not None:
            if x - ini > 20: sueltos.append((ini, x))
            ini = None
    if ini is not None: sueltos.append((ini, len(col)))
    for (x0, x1), nombre in zip(tramos, nombres): pass
    ancho_t = [t[1] - t[0] for t in tramos]
    salida_poses = {}
    i = 0
    while i < len(tramos):
        x0, x1 = tramos[i]
        sub = a[:, max(0, x0 - 2):x1 + 2]
        salida_poses[nombres[i]] = sub
        i += 1
    # tramos que salieron de partir una pieza ancha: se rehacen por piezas conectadas
    for (s0, s1) in sueltos:
        dentro = [i for i, (x0, x1) in enumerate(tramos) if x0 >= s0 - 2 and x1 <= s1 + 2]
        if len(dentro) > 1:
            zona = a[:, s0:s1]
            mk = reparto(np.concatenate([zona, np.full((zona.shape[0], 0, 3), 255, dtype=zona.dtype)], axis=1), len(dentro))
            if mk is not None:
                for i, mm in zip(dentro, mk):
                    ys, xs = np.where(mm)
                    sub = np.where(mm[..., None], zona, 255)[:, max(0, xs.min() - 4):xs.max() + 5]
                    salida_poses[nombres[i]] = sub
    for nombre in nombres:
        pose(salida_poses[nombre]).save(os.path.join(salida, nombre + '.webp'), quality=92, method=6)
        print('ok', nombre)

if __name__ == '__main__':
    main()
