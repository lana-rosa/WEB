#!/usr/bin/env python3
"""Modelo 3D DE PRUEBA para el visor de la Etapa 5: un corazón «tejido» generado por reglas (no es un escaneo ni un trabajo de artista).

Sirve para probar el visor, la escala real y la realidad aumentada sin tener todavía el modelo de una pieza de verdad. Se parece al
Llavero Corazón 5 cm (forma de corazón inflado, rojo, puntos en V), pero NO es esa pieza y no debe publicarse como tal.

  python3 herramientas/modelos3d/generar_modelo_prueba.py            → modelos3d/prueba/corazon-prueba.glb
Requisitos: pip install trimesh numpy pillow
Escala: el glTF va en metros (5 cm de ancho = 0.05). Origen: centro de la base (Y hacia arriba, el corazón acostado sobre la mesa).
"""
import json, math, os, sys

import numpy as np
import trimesh
from PIL import Image
from trimesh.visual.material import PBRMaterial
from trimesh.visual.texture import TextureVisuals

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SALIDA = os.path.join(RAIZ, 'modelos3d', 'prueba', 'corazon-prueba.glb')
ANCHO_CM = 5.0       # ancho real del llavero corazón de la tienda (5 cm)
ESPESOR_CM = 1.8     # grosor del corazón inflado
N, K = 180, 40       # puntos del contorno y anillos hacia el centro (≈ 14 mil vértices, bien por debajo de 100 mil triángulos)
ROJO = (176, 28, 48)


def contorno(n):
    t = np.linspace(0, 2 * math.pi, n, endpoint=False)
    x = 16 * np.sin(t) ** 3
    y = 13 * np.cos(t) - 5 * np.cos(2 * t) - 2 * np.cos(3 * t) - np.cos(4 * t)
    return np.stack([x, y], axis=1)


def textura_punto_v(lado=512, celdas=16):
    """Textura de puntos en V (color) y su mapa de relieve (normal), una celda repetida."""
    c = lado // celdas
    yy, xx = np.mgrid[0:c, 0:c]
    u, v = (xx + 0.5) / c, (yy + 0.5) / c
    h = np.zeros((c, c))
    for (x0, y0, x1, y1) in ((0.12, 0.92, 0.5, 0.18), (0.88, 0.92, 0.5, 0.18)):
        dx, dy = x1 - x0, y1 - y0
        t = np.clip(((u - x0) * dx + (v - y0) * dy) / (dx * dx + dy * dy), 0, 1)
        d = np.hypot(u - (x0 + t * dx), v - (y0 + t * dy))
        h = np.maximum(h, np.exp(-(d / 0.13) ** 2))
    h = np.tile(h, (celdas, celdas))
    gy, gx = np.gradient(h)
    nx, ny, nz = -gx * 9, -gy * 9, np.ones_like(h)
    n = np.sqrt(nx * nx + ny * ny + nz * nz)
    normal = np.stack([(nx / n + 1) / 2, (ny / n + 1) / 2, (nz / n + 1) / 2], axis=2)
    base = np.array(ROJO, dtype=float)[None, None, :] * (0.72 + 0.28 * h)[:, :, None]
    return Image.fromarray(np.clip(base, 0, 255).astype(np.uint8)), Image.fromarray((normal * 255).astype(np.uint8))


def construir():
    b = contorno(N)
    # el contorno debe verse desde el origen una sola vez por cada dirección (forma «estrellada»), si no los anillos se cruzan
    ang = np.unwrap(np.arctan2(b[:, 1], b[:, 0]))
    if not (np.all(np.diff(ang) > 0) or np.all(np.diff(ang) < 0)):
        sys.exit('el contorno no es estrellado desde el origen')
    unidad = ANCHO_CM / (b[:, 0].max() - b[:, 0].min())          # cm por unidad del contorno
    mitad = ESPESOR_CM / 2 / unidad                                # semi-espesor en unidades del contorno
    s = np.sin(np.linspace(0, math.pi / 2, K + 1))[1:]             # anillos más juntos hacia el borde (donde la superficie cae rápido)
    nn = 2.4
    z = mitad * (1 - s ** nn) ** (1 / nn)
    V, F = [], []
    def ring(k, signo):
        return [[s[k] * x, s[k] * y, signo * z[k]] for x, y in b]
    # cima y fondo (centro), anillos de arriba (k=0..K-1, el último es el borde z=0) y de abajo (k=K-2..0)
    V.append([0, 0, mitad]); apice_sup = 0
    base_sup = len(V)
    for k in range(K):
        V.extend(ring(k, 1))
    base_inf = len(V)
    for k in range(K - 2, -1, -1):
        V.extend(ring(k, -1))
    V.append([0, 0, -mitad]); apice_inf = len(V) - 1
    def idx_sup(k, i): return base_sup + k * N + (i % N)
    def idx_inf(k, i): return base_inf + (K - 2 - k) * N + (i % N) if k <= K - 2 else idx_sup(K - 1, i)
    for i in range(N):
        F.append([apice_sup, idx_sup(0, i), idx_sup(0, i + 1)][::1])
    for k in range(K - 1):
        for i in range(N):
            a, c, d, e = idx_sup(k, i), idx_sup(k, i + 1), idx_sup(k + 1, i), idx_sup(k + 1, i + 1)
            F += [[a, d, c], [c, d, e]]
    for i in range(N):
        F.append([apice_inf, idx_inf(0, i + 1), idx_inf(0, i)])
    for k in range(K - 2):
        for i in range(N):
            a, c, d, e = idx_inf(k, i), idx_inf(k, i + 1), idx_inf(k + 1, i), idx_inf(k + 1, i + 1)
            F += [[a, c, d], [c, e, d]]
    # unión entre el último anillo de abajo y el borde de arriba
    for i in range(N):
        a, c = idx_inf(K - 2, i), idx_inf(K - 2, i + 1)
        d, e = idx_sup(K - 1, i), idx_sup(K - 1, i + 1)
        F += [[a, c, d], [c, e, d]]
    V = np.array(V, dtype=float) * unidad / 100.0                  # unidades → metros
    uv = np.stack([(V[:, 0] - V[:, 0].min()) / (V[:, 0].max() - V[:, 0].min()), (V[:, 1] - V[:, 1].min()) / (V[:, 1].max() - V[:, 1].min())], axis=1)
    # acostado sobre la mesa: (x, y, z) → (x, z, -y); el borde de las lóbulos queda lejos de quien mira y la punta cerca
    R = V.copy(); R[:, 0], R[:, 1], R[:, 2] = V[:, 0], V[:, 2], -V[:, 1]
    R -= [(R[:, 0].max() + R[:, 0].min()) / 2, R[:, 1].min(), (R[:, 2].max() + R[:, 2].min()) / 2]
    color, normal = textura_punto_v()
    mat = PBRMaterial(baseColorTexture=color, normalTexture=normal, metallicFactor=0.0, roughnessFactor=0.92, name='lana-roja')
    malla = trimesh.Trimesh(vertices=R, faces=np.array(F), process=True, validate=True)
    # process=True puede reordenar vértices: se recalculan los UV con la misma regla
    vv = malla.vertices
    uv = np.stack([(vv[:, 0] - vv[:, 0].min()) / (vv[:, 0].max() - vv[:, 0].min()), (vv[:, 2].max() - vv[:, 2]) / (vv[:, 2].max() - vv[:, 2].min())], axis=1)
    malla.visual = TextureVisuals(uv=uv, material=mat)
    malla.fix_normals()
    return malla


def main():
    m = construir()
    ext = m.bounds[1] - m.bounds[0]
    esc = trimesh.Scene({'corazon-prueba': m})
    os.makedirs(os.path.dirname(SALIDA), exist_ok=True)
    esc.export(SALIDA)
    datos = {'ancho_cm': round(ext[0] * 100, 1), 'alto_cm': round(ext[1] * 100, 1), 'fondo_cm': round(ext[2] * 100, 1)}
    print('%d vértices, %d triángulos, cerrado=%s, %s KB' % (len(m.vertices), len(m.faces), m.is_watertight, round(os.path.getsize(SALIDA) / 1024)))
    print(json.dumps(datos))


if __name__ == '__main__':
    main()
