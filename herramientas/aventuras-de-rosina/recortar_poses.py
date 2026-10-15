#!/usr/bin/env python3
"""Recorta las poses de las hojas de personajes (fondo blanco liso) y las deja con fondo transparente.
Uso: python3 herramientas/aventuras-de-rosina/recortar_poses.py <hoja.webp> <carpeta-salida> [--vista vista.png]
Funciona con hojas donde cada pose está separada por espacio blanco (como las de Sara del 12-oct-2026, estilo ilustración plana).
Pasos: el fondo es el blanco conectado con el borde; cada pose es un grupo de píxeles que no son fondo; se recorta con margen y se guarda en
WebP con transparencia (lado mayor 512 px). Imprime las cajas encontradas en orden de lectura (filas de arriba abajo, de izquierda a derecha)."""
import sys, os
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

def fondo_y_alpha(rgb):
    """El fondo es el blanco conectado con el borde, pero sin cruzar el contorno del personaje (con una barrera de 3 px
    para que las huellas finas del contorno no dejen escapar el fondo hacia el pelaje blanco de adentro)."""
    blanco = rgb.min(axis=2) >= 246
    barrera = ndi.binary_dilation(~blanco, iterations=3)
    libre = blanco & ~barrera
    etiquetas, n = ndi.label(libre)
    borde = set(np.unique(np.concatenate([etiquetas[0], etiquetas[-1], etiquetas[:, 0], etiquetas[:, -1]]))) - {0}
    fondo0 = np.isin(etiquetas, list(borde))
    # se recupera el halo blanco de afuera del contorno (solo píxeles blancos conectados, hasta 5 px)
    fondo = ndi.binary_dilation(fondo0, iterations=5, mask=blanco) | fondo0
    cerca = ndi.binary_dilation(fondo, iterations=2) & ~fondo
    alpha = np.full(fondo.shape, 255, np.uint8)
    alpha[fondo] = 0
    blancura = rgb.min(axis=2).astype(np.float32)
    rampa = np.clip((254 - blancura) / (254 - 215), 0, 1) * 255
    alpha[cerca] = rampa[cerca].astype(np.uint8)
    return fondo, alpha

def limpiar(rec):
    """Borra los trocitos sueltos del recorte (por ejemplo la punta de una oreja de la pose vecina)."""
    a = np.array(rec)
    solido = a[:, :, 3] > 24
    etiquetas, n = ndi.label(ndi.binary_dilation(solido, iterations=1))
    if n <= 1: return rec
    areas = ndi.sum(solido, etiquetas, index=range(1, n + 1))
    quedan = [i + 1 for i, v in enumerate(areas) if v >= 0.15 * max(areas)]
    mascara = np.isin(etiquetas, quedan)
    a[:, :, 3] = np.where(mascara, a[:, :, 3], 0)
    return Image.fromarray(a, 'RGBA')

def cajas(fondo, union=1, area_cuerpo=9000, holgura=30):
    """Cada pose = un cuerpo grande; los trocitos sueltos (manos, alas, moños) se pegan al cuerpo más cercano."""
    solido = ndi.binary_dilation(~fondo, iterations=union)
    etiquetas, n = ndi.label(solido)
    objs = ndi.find_objects(etiquetas)
    info = []
    for i, sl in enumerate(objs, 1):
        area = int(((etiquetas[sl] == i) & ~fondo[sl]).sum())
        info.append([sl[0].start, sl[0].stop, sl[1].start, sl[1].stop, area])
    cuerpos = [b[:4] for b in info if b[4] >= area_cuerpo]
    for y0, y1, x0, x1, area in info:
        if area >= area_cuerpo or area < 40: continue
        cy, cx = (y0 + y1) / 2, (x0 + x1) / 2
        mejor = None
        for c in cuerpos:
            if c[2] - holgura <= cx <= c[3] + holgura and c[0] - holgura <= cy <= c[1] + holgura:
                mejor = c; break
        if mejor:
            mejor[0], mejor[1], mejor[2], mejor[3] = min(mejor[0], y0), max(mejor[1], y1), min(mejor[2], x0), max(mejor[3], x1)
    res = [tuple(c) for c in cuerpos]
    # poses que se tocan (orejas o alas con la vecina): se parten por los valles de la proyección de columnas
    ancho_tipico = np.median([b[3] - b[2] for b in res])
    partido = []
    for y0, y1, x0, x1 in res:
        k = int(round((x1 - x0) / ancho_tipico)) if (x1 - x0) > 1.6 * ancho_tipico else 1
        if k <= 1:
            partido.append((y0, y1, x0, x1)); continue
        proy = (~fondo[y0:y1, x0:x1]).sum(axis=0)
        w = x1 - x0
        cortes = [0]
        for j in range(1, k):
            centro = int(j * w / k); ven = int(w / k / 3)
            lo, hi = max(centro - ven, 1), min(centro + ven, w - 1)
            cortes.append(lo + int(np.argmin(proy[lo:hi])))
        cortes.append(w)
        for a, b in zip(cortes[:-1], cortes[1:]):
            sub = ~fondo[y0:y1, x0 + a:x0 + b]
            ys = np.where(sub.any(axis=1))[0]
            partido.append((y0 + int(ys[0]), y0 + int(ys[-1]) + 1, x0 + a, x0 + b))
    res = partido
    alto = np.median([b[1] - b[0] for b in res])
    # orden de lectura: se agrupa por filas (salto grande entre centros verticales) y cada fila se ordena de izquierda a derecha
    por_y = sorted(res, key=lambda b: (b[0] + b[1]) / 2)
    filas, actual = [], [por_y[0]]
    for b in por_y[1:]:
        if (b[0] + b[1]) / 2 - np.mean([(c[0] + c[1]) / 2 for c in actual]) > 0.6 * alto: filas.append(actual); actual = [b]
        else: actual.append(b)
    filas.append(actual)
    res = [b for f in filas for b in sorted(f, key=lambda c: c[2])]
    return res

def main(ruta, salida, vista=None):
    im = Image.open(ruta).convert('RGB')
    rgb = np.array(im)
    fondo, alpha = fondo_y_alpha(rgb)
    rgba = np.dstack([rgb, alpha])
    img = Image.fromarray(rgba, 'RGBA')
    lista = cajas(fondo)
    os.makedirs(salida, exist_ok=True)
    for k, (y0, y1, x0, x1) in enumerate(lista, 1):
        m = 6
        rec = img.crop((max(x0 + 5 - m, 0), max(y0 + 5 - m, 0), min(x1 - 5 + m, img.size[0]), min(y1 - 5 + m, img.size[1])))
        rec = limpiar(rec)
        bb = rec.getbbox()
        if bb: rec = rec.crop(bb)
        rec.thumbnail((512, 512), Image.LANCZOS)
        destino = os.path.join(salida, f'pose-{k:02d}.webp')
        rec.save(destino, 'WEBP', quality=82, method=6)
        print(k, rec.size, os.path.getsize(destino) // 1024, 'KB', (x0, y0, x1, y1))
    if vista:
        W = Image.new('RGB', (1600, 1000), (250, 214, 226)); x = y = 0; alto_fila = 0
        for k in range(1, len(lista) + 1):
            p = Image.open(os.path.join(salida, f'pose-{k:02d}.webp')).convert('RGBA'); p.thumbnail((300, 300))
            if x + p.size[0] > 1600: x = 0; y += alto_fila + 6; alto_fila = 0
            W.paste(p, (x, y), p); x += p.size[0] + 6; alto_fila = max(alto_fila, p.size[1])
        W.save(vista)

if __name__ == '__main__':
    a = sys.argv[1:]
    main(a[0], a[1], a[a.index('--vista') + 1] if '--vista' in a else None)
