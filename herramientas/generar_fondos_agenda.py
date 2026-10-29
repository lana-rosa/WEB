"""Fondos de la Agenda para tejedoras (29-oct-2026): a partir de las imágenes que pasó Sara (herramientas/agenda-fondos/originales/<fondo>.webp, horizontales) genera en img/agenda/.
Hay dos clases de fondo: «marco» (flores, hojas y madejas: acuarelas con adornos en las esquinas; se giran a vertical) y «patrón» (rosina = Rosina y sus amigos, ovejitas: dibujos repartidos por
toda la imagen; NO se giran, se recortan). Archivos por fondo:
  fondo-<f>.webp           la imagen en vertical (portada imprimible, 900 px de ancho; en los patrones es un recorte con la forma de la hoja carta)
  fondo-<f>-mini.webp      miniatura del botón de la Portada
  Marcos (flores, hojas, madejas):
  fondo-<f>-arriba.webp / -abajo.webp        mitades con el blanco vuelto transparente y bordes suavizados: marco de las hojas en pantallas anchas (horizontal)
  fondo-<f>-v-arriba.webp / -v-abajo.webp    lo mismo, de la imagen vertical: marco de las hojas en el celular
  Las hojas ponen la mitad de arriba pegada arriba y la de abajo pegada abajo, así el marco sirve para hojas cortas y largas.
  Patrones (rosina, ovejitas):
  fondo-<f>-borde.webp     anillo con piezas limpias del dibujo (4 esquinas, arriba/abajo e izquierda/derecha, todas con los bordes sin dibujos cortados) y centro transparente, para
                           `border-image` con `round`: el dibujo queda como BORDE de la hoja por los cuatro lados, repetido sin cortar nada. El `slice` (px de este archivo) está en
                           SLICE_BORDE y debe coincidir con css/agenda-fichas.css
Uso: /usr/bin/python3 herramientas/generar_fondos_agenda.py"""
import os
from PIL import Image, ImageChops
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORIG = os.path.join(R, 'herramientas', 'agenda-fondos', 'originales'); SAL = os.path.join(R, 'img', 'agenda'); os.makedirs(SAL, exist_ok=True)

def a_transparente(im, opacidad=0.9):
    """Color a alfa: sobre blanco se ve idéntico a la imagen, pero el blanco queda transparente."""
    im = im.convert('RGB'); w, h = im.size; px = im.load(); out = Image.new('RGBA', im.size); po = out.load()
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]; falta = 255 - min(r, g, b)
            a = min(1.0, falta / 70.0)
            if a <= 0.01: po[x, y] = (255, 255, 255, 0); continue
            po[x, y] = tuple(max(0, min(255, round((c - 255 * (1 - a)) / a))) for c in (r, g, b)) + (round(a * 255 * opacidad),)
    return out

def mitad(im, desde, hasta, suave):
    """Franja de filas [desde, hasta) con el borde que da al centro difuminado `suave` píxeles."""
    t = im.crop((0, desde, im.width, hasta)); a = t.getchannel('A'); px = a.load(); h = t.height
    for y in range(h):
        d = (h - 1 - y) if desde == 0 else y          # distancia al borde que se difumina
        k = min(1.0, d / suave)
        if k < 1.0:
            for x in range(t.width): px[x, y] = round(px[x, y] * k)
    t.putalpha(a); return t

def abrir(f):
    """Abre el original; si trae transparencia se pone sobre blanco (así se ve igual que en el archivo que mandó Sara)."""
    im = Image.open(os.path.join(ORIG, f + '.webp'))
    if im.mode in ('RGBA', 'LA', 'P'):
        im = im.convert('RGBA'); fondo = Image.new('RGB', im.size, (255, 255, 255)); fondo.paste(im, (0, 0), im); return fondo
    return im.convert('RGB')

# Patrones: recorte (x0, ancho) de la imagen horizontal para la portada (forma de hoja carta, 8,5 × 11) y para el marco de las hojas en el celular (cuadrado)
# portada: x0 del recorte con forma de hoja carta. borde: (T = grosor del anillo en px de la imagen original, ancho de las piezas de arriba y abajo, alto de las de los lados,
# px del `slice` en el archivo final, opacidad del dibujo)
PATRONES = {'rosina': {'portada': 560, 'borde': (190, 380, 380, 150, 0.85)}, 'ovejitas': {'portada': 700, 'borde': (170, 340, 340, 150, 0.95)}}
SLICE_BORDE = {f: c['borde'][3] for f, c in PATRONES.items()}

def guardar_marco(f, imagenes, opacidad=0.9):
    """imagenes: [(prefijo del archivo, imagen, ancho final, difuminado como fracción del alto)]"""
    for nombre, im, ancho, suave_fr in imagenes:
        im = im.resize((ancho, round(ancho * im.height / im.width)), Image.LANCZOS); t = a_transparente(im, opacidad); mid = t.height // 2; suave = round(t.height * suave_fr)
        mitad(t, 0, mid, suave).save(os.path.join(SAL, f'fondo-{f}-{nombre}arriba.webp'), quality=72, method=6)
        mitad(t, mid, t.height, suave).save(os.path.join(SAL, f'fondo-{f}-{nombre}abajo.webp'), quality=72, method=6)

def piezas_limpias(im):
    """Busca en la imagen ventanas rectangulares cuyos cuatro bordes no cortan ningún dibujo (así se pueden pegar unas junto a otras sin dibujos partidos).
    Devuelve una función buscar(ancho, alto) -> [(x, y, densidad)] con la densidad de dibujo de cada ventana."""
    import numpy as np
    arr = np.asarray(im.convert('RGB'), dtype=np.int16); h, w = arr.shape[:2]
    ocupado = ((255 - arr.min(axis=2)) >= 14).astype(np.int64)
    S = np.zeros((h + 1, w + 1), dtype=np.int64); S[1:, 1:] = ocupado.cumsum(0).cumsum(1)
    def r(x0, y0, x1, y1): return S[y1, x1] - S[y0, x1] - S[y1, x0] + S[y0, x0]
    def buscar(ancho, alto, paso=3, margen=3, eps=10, minimo=0.05, maximo=0.40):
        X, Y = np.meshgrid(np.arange(0, w - ancho + 1, paso), np.arange(0, h - alto + 1, paso))
        dens = r(X, Y, X + ancho, Y + alto) / float(ancho * alto)
        ok = (r(X, Y, X + ancho, Y + margen) <= eps) & (r(X, Y + alto - margen, X + ancho, Y + alto) <= eps) & (r(X, Y, X + margen, Y + alto) <= eps) & (r(X + ancho - margen, Y, X + ancho, Y + alto) <= eps) & (dens >= minimo) & (dens <= maximo)
        return [(int(x), int(y), float(d)) for x, y, d in zip(X[ok], Y[ok], dens[ok])]
    return buscar

def guardar_borde(f, im, T, ancho_pieza, alto_pieza, lado_final, opacidad):
    """Borde de la hoja con el dibujo del patrón: un anillo hecho con piezas limpias de la imagen (4 esquinas T×T, arriba y abajo ancho_pieza×T, izquierda y derecha T×alto_pieza), todas con los bordes
    vacíos, para que `border-image` (con `round`) las repita por los cuatro lados sin cortar ningún dibujo. El centro queda transparente. En el CSS el `slice` es `lado_final` (ver SLICE_BORDE)."""
    buscar = piezas_limpias(im); elegidas = []
    def choque(x, y, w, h): return any(not (x + w <= ex or ex + ew <= x or y + h <= ey or ey + eh <= y) for ex, ey, ew, eh in elegidas)
    def elegir(w, h, objetivo=0.17):
        for eps, margen, minimo in ((10, 3, 0.07), (24, 3, 0.05), (48, 2, 0.04), (90, 2, 0.03)):               # si no hay ventana limpia, se acepta algún roce pequeño
            cand = sorted(buscar(w, h, eps=eps, margen=margen, minimo=minimo), key=lambda c: abs(c[2] - objetivo))
            for x, y, d in cand:
                if not choque(x, y, w, h): elegidas.append((x, y, w, h)); return (x, y, w, h)
        raise SystemExit(f'No hay una pieza limpia de {w}x{h} en {f}; cambia T o los anchos en PATRONES')
    arriba = elegir(ancho_pieza, T); abajo = elegir(ancho_pieza, T); izq = elegir(T, alto_pieza); der = elegir(T, alto_pieza)
    esq = [elegir(T, T) for _ in range(4)]
    W = 2 * T + ancho_pieza; H = 2 * T + alto_pieza
    lienzo = Image.new('RGBA', (W, H), (255, 255, 255, 0))
    def pegar(ventana, dx, dy):
        x, y, w, h = ventana; lienzo.alpha_composite(a_transparente(im.crop((x, y, x + w, y + h)), opacidad), (dx, dy))
    pegar(esq[0], 0, 0); pegar(arriba, T, 0); pegar(esq[1], T + ancho_pieza, 0)
    pegar(izq, 0, T); pegar(der, T + ancho_pieza, T)
    pegar(esq[2], 0, T + alto_pieza); pegar(abajo, T, T + alto_pieza); pegar(esq[3], T + ancho_pieza, T + alto_pieza)
    k = lado_final / float(T)
    lienzo.resize((round(W * k), round(H * k)), Image.LANCZOS).save(os.path.join(SAL, f'fondo-{f}-borde.webp'), quality=80, method=6)

def guardar_portada(f, im):
    im = im.resize((900, round(900 * im.height / im.width)), Image.LANCZOS)
    im.save(os.path.join(SAL, f'fondo-{f}.webp'), quality=80, method=6)
    im.resize((96, round(96 * im.height / im.width)), Image.LANCZOS).save(os.path.join(SAL, f'fondo-{f}-mini.webp'), quality=80)

for f in ('flores', 'hojas', 'madejas'):
    L = abrir(f); V = L.transpose(Image.ROTATE_270)                              # 90° a la derecha: vertical
    guardar_portada(f, V)
    guardar_marco(f, [('', L, 1100, 0.09), ('v-', V, 680, 0.09)])
    print('ok', f)
for f, c in PATRONES.items():
    L = abrir(f); h = L.height; ancho_carta = round(h * 8.5 / 11)
    guardar_portada(f, L.crop((c['portada'], 0, c['portada'] + ancho_carta, h)))
    guardar_borde(f, L, *c['borde'])
    print('ok', f)
