"""Fondos de la Agenda para tejedoras (29-oct-2026). A partir de las imágenes que pasó Sara (herramientas/agenda-fondos/originales/<fondo>.webp, horizontales) genera en img/agenda/:

  fondo-<f>.webp          la Portada: los marcos (flores, hojas, madejas) se giran a vertical; los patrones (rosina = Rosina y amigos, ovejitas) NO se giran: se recortan con la forma de la hoja carta
  fondo-<f>-mini.webp     miniatura del botón de la Portada
  fondo-<f>-borde.webp    la CINTA de las hojas de la agenda (pedido de Sara: «una cinta delgada pegada por todo el rededor»): un anillo transparente con una cinta del estilo de ese fondo
                          (un recorte de la propia imagen sobre un fondo crema, con una línea fina en cada orilla y las esquinas en ángulo, como una cinta que se dobla). En el CSS se usa con
                          `border-image` y `round`; su `slice` (px de este archivo, SLICE_BORDE) debe coincidir con css/agenda-fichas.css.

La cinta de cada fondo: en los marcos (flores, hojas, madejas) se toma el recorte de la imagen con más color y se pega con su reflejo para que se pueda repetir sin cortes (a los lados va girado);
en los patrones (Rosina y amigos, ovejitas) se buscan recortes cuyos extremos no cortan ningún dibujo, así los animales quedan siempre derechos y sin repetirse al revés.
Todo es determinista. Uso: /usr/bin/python3 herramientas/generar_fondos_agenda.py   (necesita numpy y Pillow)"""
import os
import numpy as np
from PIL import Image, ImageDraw

R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORIG = os.path.join(R, 'herramientas', 'agenda-fondos', 'originales'); SAL = os.path.join(R, 'img', 'agenda'); os.makedirs(SAL, exist_ok=True)

T = 40                       # grosor de la cinta en el archivo (px): es el `slice` del CSS (en pantalla la cinta es DELGADA: 18 px en computador, 16 en tablet y 12 en celular)
SLICE_BORDE = T
# tipo: marco = acuarela con adornos en las esquinas (se gira a vertical para la portada); patron = dibujos repartidos (se recorta para la portada)
# alto: alto del recorte de la imagen que se convierte en cinta (px de la imagen original); largo: largo de ese recorte; crema: color de la cinta; linea: color de las líneas de las orillas
FONDOS = {
    'flores':   {'tipo': 'marco',  'alto': 150, 'largo': 520, 'crema': (255, 248, 250), 'linea': (232, 111, 163)},
    'hojas':    {'tipo': 'marco',  'alto': 150, 'largo': 520, 'crema': (247, 252, 245), 'linea': (96, 160, 112)},
    'madejas':  {'tipo': 'marco',  'alto': 150, 'largo': 520, 'crema': (255, 253, 247), 'linea': (229, 130, 176)},
    'rosina':   {'tipo': 'patron', 'alto': 170, 'largo': 760, 'crema': (255, 250, 252), 'linea': (240, 150, 183), 'portada_x0': 560},
    'ovejitas': {'tipo': 'patron', 'alto': 170, 'largo': 760, 'crema': (255, 247, 249), 'linea': (240, 168, 188), 'portada_x0': 700},
}


def abrir(f):
    """Abre el original; si trae transparencia se pone sobre blanco (así se ve igual que en el archivo que mandó Sara)."""
    im = Image.open(os.path.join(ORIG, f + '.webp'))
    if im.mode in ('RGBA', 'LA', 'P'):
        im = im.convert('RGBA'); fondo = Image.new('RGB', im.size, (255, 255, 255)); fondo.paste(im, (0, 0), im); return fondo
    return im.convert('RGB')


def guardar_portada(f, im):
    im = im.resize((900, round(900 * im.height / im.width)), Image.LANCZOS)
    im.save(os.path.join(SAL, f'fondo-{f}.webp'), quality=80, method=6)
    im.resize((96, round(96 * im.height / im.width)), Image.LANCZOS).save(os.path.join(SAL, f'fondo-{f}-mini.webp'), quality=80)


# ---------- Búsqueda de recortes ----------
def integral(im):
    arr = np.asarray(im.convert('RGB'), dtype=np.int16); h, w = arr.shape[:2]
    ocupado = ((255 - arr.min(axis=2)) >= 14).astype(np.int64)
    S = np.zeros((h + 1, w + 1), dtype=np.int64); S[1:, 1:] = ocupado.cumsum(0).cumsum(1)
    return S, w, h


def rect(S, x0, y0, x1, y1): return S[y1, x1] - S[y0, x1] - S[y1, x0] + S[y0, x0]


def mejor_recorte(im, ancho, alto, limpio, excluir=(), paso=4, margen=3, eps=14):
    """Ventana ancho×alto con más dibujo. limpio: None (cualquiera), 'lados' (izquierda y derecha sin dibujos cortados) o 'arriba' (arriba y abajo sin dibujos cortados)."""
    S, w, h = integral(im)
    X, Y = np.meshgrid(np.arange(0, w - ancho + 1, paso), np.arange(0, h - alto + 1, paso))
    dens = rect(S, X, Y, X + ancho, Y + alto) / float(ancho * alto); ok = (dens >= 0.12) & (dens <= 0.85)
    if limpio == 'lados': ok &= (rect(S, X, Y, X + margen, Y + alto) <= eps) & (rect(S, X + ancho - margen, Y, X + ancho, Y + alto) <= eps)
    if limpio == 'arriba': ok &= (rect(S, X, Y, X + ancho, Y + margen) <= eps) & (rect(S, X, Y + alto - margen, X + ancho, Y + alto) <= eps)
    for ex, ey, ew, eh in excluir:                                                          # que no se solape con un recorte ya usado
        ok &= ~((X < ex + ew) & (X + ancho > ex) & (Y < ey + eh) & (Y + alto > ey))
    if not ok.any(): return None
    d = np.where(ok, dens, -1.0); i = np.unravel_index(int(np.argmax(d)), d.shape)
    return int(X[i]), int(Y[i]), ancho, alto


# ---------- La cinta ----------
def sobre_crema(recorte, crema):
    """Recorte de la imagen sobre el color crema de la cinta (el blanco de la imagen se vuelve crema)."""
    a = np.asarray(recorte.convert('RGB'), dtype=np.float32) / 255.0; c = np.array(crema, dtype=np.float32) / 255.0
    return Image.fromarray((np.clip(a * c, 0, 1) * 255).astype(np.uint8), 'RGB')                       # multiplicar: el blanco queda crema y los colores se conservan


def lineas_orilla(tira, color, vertical):
    """Dos líneas finas, una en cada orilla de la cinta."""
    d = ImageDraw.Draw(tira, 'RGBA'); w, h = tira.size; c = color + (120,)
    if vertical: d.rectangle((0, 0, 1, h), fill=c); d.rectangle((w - 2, 0, w - 1, h), fill=c)
    else: d.rectangle((0, 0, w, 1), fill=c); d.rectangle((0, h - 2, w, h), fill=c)
    return tira


def construir(f, im, c):
    alto, largo, crema, linea = c['alto'], c['largo'], c['crema'], c['linea']; k = T / float(alto)
    usados = []
    if c['tipo'] == 'marco':
        a = mejor_recorte(im, largo, alto, None); usados.append(a)
        b = mejor_recorte(im, largo, alto, None, excluir=usados) or a
        h0 = sobre_crema(im.crop((a[0], a[1], a[0] + largo, a[1] + alto)), crema).resize((round(largo * k), T), Image.LANCZOS)
        v0 = sobre_crema(im.crop((b[0], b[1], b[0] + largo, b[1] + alto)), crema).resize((round(largo * k), T), Image.LANCZOS)
        horiz = Image.new('RGB', (h0.width * 2, T)); horiz.paste(h0, (0, 0)); horiz.paste(h0.transpose(Image.FLIP_LEFT_RIGHT), (h0.width, 0))    # con su reflejo: se repite sin cortes
        vert = Image.new('RGB', (v0.width * 2, T)); vert.paste(v0, (0, 0)); vert.paste(v0.transpose(Image.FLIP_LEFT_RIGHT), (v0.width, 0)); vert = vert.transpose(Image.ROTATE_90)
    else:
        a = mejor_recorte(im, largo, alto, 'lados'); usados.append(a)
        b = mejor_recorte(im, alto, int(largo * 0.8), 'arriba', excluir=usados) or mejor_recorte(im, alto, int(largo * 0.8), 'arriba')
        if not a or not b: raise SystemExit(f'{f}: no hay recortes limpios para la cinta; cambia alto/largo en FONDOS')
        horiz = sobre_crema(im.crop((a[0], a[1], a[0] + a[2], a[1] + a[3])), crema).resize((round(a[2] * k), T), Image.LANCZOS)
        vert = sobre_crema(im.crop((b[0], b[1], b[0] + b[2], b[1] + b[3])), crema).resize((T, round(b[3] * k)), Image.LANCZOS)
    horiz = lineas_orilla(horiz.convert('RGBA'), linea, False); vert = lineas_orilla(vert.convert('RGBA'), linea, True)
    Lh, Lv = horiz.width, vert.height; W, H = 2 * T + Lh, 2 * T + Lv
    ring = Image.new('RGBA', (W, H), (255, 255, 255, 0))
    ring.alpha_composite(horiz, (T, 0)); ring.alpha_composite(horiz, (T, T + Lv))                     # sin voltear nada: los animales siempre quedan derechos
    ring.alpha_composite(vert, (0, T)); ring.alpha_composite(vert, (T + Lh, T))
    # esquinas en ángulo (como una cinta que se dobla): arriba va la cinta horizontal por un lado de la diagonal y la vertical por el otro
    yy, xx = np.mgrid[0:T, 0:T]
    bloque_h = horiz.crop((0, 0, T, T)); bloque_v = vert.crop((0, 0, T, T))
    for (cx, cy), cond in (((0, 0), yy <= xx), ((T + Lh, 0), yy <= (T - 1 - xx)), ((0, T + Lv), yy >= (T - 1 - xx)), ((T + Lh, T + Lv), yy >= xx)):
        m = Image.fromarray((cond * 255).astype(np.uint8), 'L'); esq = Image.composite(bloque_h, bloque_v, m)
        d = ImageDraw.Draw(esq, 'RGBA'); diag = ((0, 0, T - 1, T - 1) if (cx == 0) == (cy == 0) else (T - 1, 0, 0, T - 1)); d.line(diag, fill=linea + (150,), width=2)
        ring.alpha_composite(esq, (cx, cy))
    ring.save(os.path.join(SAL, f'fondo-{f}-borde.webp'), quality=90, method=6)
    return Lh, Lv


if __name__ == '__main__':
    for f, c in FONDOS.items():
        L = abrir(f)
        if c['tipo'] == 'marco': guardar_portada(f, L.transpose(Image.ROTATE_270))                      # 90° a la derecha: vertical
        else: ancho_carta = round(L.height * 8.5 / 11); guardar_portada(f, L.crop((c['portada_x0'], 0, c['portada_x0'] + ancho_carta, L.height)))
        Lh, Lv = construir(f, L, c)
        print('ok', f, '- cinta de', Lh, 'x', Lv, 'px por lado')
