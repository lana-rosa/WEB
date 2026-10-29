"""Fondos de la Agenda para tejedoras (29-oct-2026). A partir de las imágenes que pasó Sara (herramientas/agenda-fondos/originales/<fondo>.webp, horizontales) genera en img/agenda/:

  fondo-<f>.webp          la Portada: los marcos (flores, hojas, madejas) se giran a vertical; los patrones (rosina = Rosina y amigos, ovejitas) NO se giran: se recortan con la forma de la hoja carta
  fondo-<f>-mini.webp     miniatura del botón de la Portada
  fondo-<f>-borde.webp    la CINTA de las hojas de la agenda (pedido de Sara: «una cinta delgada pegada por todo el rededor»): un anillo transparente con una cinta del estilo de ese fondo
                          (dibujos pequeños sobre un fondo crema, con una línea fina en cada orilla y las esquinas en ángulo, como una cinta que se dobla). En el CSS se usa con
                          `border-image` y `round`; su `slice` (px de este archivo, SLICE_BORDE) debe coincidir con css/agenda-fichas.css.

La cinta de cada fondo (pedido de Sara: dibujos pequeños y COMPLETOS, sin desenfoque y más claros):
  - marcos (flores, hojas, madejas): las imágenes tienen los dibujos grandes en las esquinas y cortados por el borde, así que la cinta se arma como una guirnalda con los dibujos sueltos
    (cada flor, hoja, madeja, tijera… se recorta con una caja de SELLOS, se limpia lo que no es suyo y se reduce para que quepa entera dentro de la cinta). Las madejas que el borde de la imagen
    corta un poco se completan reflejándolas; se ven enteras.
  - patrones (Rosina y amigos, ovejitas): se buscan recortes cuyos extremos no cortan ningún dibujo, así los animales quedan siempre derechos y enteros.
  Todo va mezclado con el crema de la cinta (DESVANECIDO) para que se vea más claro, no en su color pleno; sin desenfoque. Las líneas de las orillas y las esquinas se dibujan después, nítidas.
Todo es determinista. Uso: /usr/bin/python3 herramientas/generar_fondos_agenda.py   (necesita numpy y Pillow)"""
import os
import numpy as np
from PIL import Image, ImageDraw

R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORIG = os.path.join(R, 'herramientas', 'agenda-fondos', 'originales'); SAL = os.path.join(R, 'img', 'agenda'); os.makedirs(SAL, exist_ok=True)

T = 40                       # grosor de la cinta en el archivo (px): es el `slice` del CSS (en pantalla la cinta es DELGADA: 18 px en computador, 16 en tablet y 12 en celular)
SLICE_BORDE = T
DESVANECIDO = 0.42           # cuánto se mezcla la imagen con el crema de la cinta: 0 = color pleno, 1 = solo crema. Pedido de Sara: «que se viera más claro»
GAP = 9                      # espacio entre dibujos de la guirnalda (px del archivo)
# tipo: marco = acuarela/dibujos en las esquinas (se gira a vertical para la portada; la cinta es una guirnalda de SELLOS); patron = dibujos repartidos (se recorta para la portada y la cinta)
# crema: color de la cinta; linea: color de las líneas de las orillas
# SELLOS: caja = (x0, y0, x1, y1) del dibujo en una vista de ancho `vista` px (la caja se escala al tamaño real); m = tamaño máximo del dibujo en la cinta (px);
#         elipse = recorta con un óvalo (flores que tocan a otras; True o su radio de 0 a 1); espejo = 'derecha' o 'abajo': el borde de la imagen corta la madeja, se completa reflejando hasta la columna/fila `eje` (px de la caja en la vista)
FONDOS = {
    'flores': {'tipo': 'marco', 'crema': (255, 248, 250), 'linea': (232, 111, 163), 'vista': 1500, 'sellos': [
        {'caja': (1322, 160, 1442, 290), 'm': 34, 'elipse': 0.9}, {'caja': (1135, 622, 1240, 728), 'm': 30}, {'caja': (312, 96, 374, 158), 'm': 22},
        {'caja': (205, 48, 312, 152), 'm': 34, 'elipse': 0.95}, {'caja': (228, 562, 300, 645), 'm': 30}, {'caja': (130, 612, 252, 742), 'm': 34, 'elipse': 0.84},
        {'caja': (190, 145, 270, 222), 'm': 28}, {'caja': (1182, 208, 1236, 262), 'm': 22}, {'caja': (1205, 532, 1300, 655), 'm': 32},
        {'caja': (40, 382, 105, 445), 'm': 24}, {'caja': (158, 220, 228, 298), 'm': 30}, {'caja': (1358, 578, 1472, 690), 'm': 34, 'elipse': 0.95},
        {'caja': (1422, 385, 1480, 442), 'm': 22}, {'caja': (272, 655, 358, 742), 'm': 30}, {'caja': (1296, 492, 1392, 572), 'm': 28}]},
    'hojas': {'tipo': 'marco', 'crema': (247, 252, 245), 'linea': (96, 160, 112), 'vista': 1400, 'sellos': [
        {'caja': (270, 18, 442, 148), 'm': 34}, {'caja': (490, 22, 545, 82), 'm': 28}, {'caja': (1240, 460, 1312, 545), 'm': 34}, {'caja': (20, 198, 70, 241), 'm': 24},
        {'caja': (0, 226, 206, 424), 'm': 34}, {'caja': (1062, 113, 1103, 176), 'm': 30}, {'caja': (1334, 455, 1400, 548), 'm': 34}, {'caja': (166, 428, 233, 477), 'm': 26},
        {'caja': (305, 668, 424, 782), 'm': 32}, {'caja': (1118, 24, 1196, 69), 'm': 28}, {'caja': (266, 165, 296, 238), 'm': 32}, {'caja': (1148, 398, 1182, 446), 'm': 24},
        {'caja': (833, 728, 881, 771), 'm': 24}, {'caja': (473, 724, 529, 771), 'm': 26}]},
    'madejas': {'tipo': 'marco', 'crema': (255, 253, 247), 'linea': (229, 130, 176), 'vista': 1400, 'sellos': [
        {'caja': (0, 0, 222, 206), 'm': 34, 'elipse': True}, {'caja': (594, 34, 644, 98), 'm': 24}, {'caja': (968, 14, 1188, 248), 'm': 34}, {'caja': (176, 180, 210, 212), 'm': 14},
        {'caja': (775, 600, 1055, 788), 'm': 34, 'espejo': 'abajo', 'eje': 146}, {'caja': (686, 48, 738, 110), 'm': 24}, {'caja': (385, 600, 592, 788), 'm': 34}, {'caja': (1028, 540, 1082, 596), 'm': 24},
        {'caja': (1262, 205, 1400, 445), 'm': 34, 'espejo': 'derecha', 'eje': 126, 'elipse': True}, {'caja': (1138, 225, 1170, 256), 'm': 14}, {'caja': (503, 72, 552, 130), 'm': 24},
        {'caja': (244, 380, 294, 440), 'm': 24}, {'caja': (258, 640, 320, 700), 'm': 24}]},
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
    """Recorte de la imagen sobre el color crema de la cinta, más claro (mezclado con el crema: DESVANECIDO). El blanco de la imagen se vuelve crema y los colores se conservan."""
    a = np.asarray(recorte.convert('RGB'), dtype=np.float32) / 255.0; c = np.array(crema, dtype=np.float32) / 255.0
    a = a * (1 - DESVANECIDO) + DESVANECIDO                                                            # hacia el blanco = hacia el crema al multiplicar
    return Image.fromarray((np.clip(a * c, 0, 1) * 255).astype(np.uint8), 'RGB')


def etiquetas(mask):
    """Piezas conectadas de una máscara (vecindad de 8)."""
    h, w = mask.shape; lab = np.zeros((h, w), np.int32); n = 0
    for y in range(h):
        for x in range(w):
            if mask[y, x] and not lab[y, x]:
                n += 1; lab[y, x] = n; pila = [(y, x)]
                while pila:
                    cy, cx = pila.pop()
                    for dy in (-1, 0, 1):
                        for dx in (-1, 0, 1):
                            ny, nx = cy + dy, cx + dx
                            if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not lab[ny, nx]: lab[ny, nx] = n; pila.append((ny, nx))
    return lab, n


def papel_blanco(im):
    """El papel de la imagen no es blanco puro: se lleva a blanco para que, al multiplicar, la cinta quede limpia."""
    a = np.asarray(im.convert('RGB'), dtype=np.float32); fondo = np.percentile(a.reshape(-1, 3), 97, axis=0)
    return np.clip(a * (255.0 / np.maximum(fondo, 1)), 0, 255)


def sello(blanca, vista, c):
    """Un dibujo suelto de la imagen: se recorta con su caja, se limpia lo que no es suyo (pedazos de los vecinos), se reduce para que quepa entero en la cinta y queda sobre blanco."""
    esc = blanca.shape[1] / float(vista); x0, y0, x1, y1 = [int(round(v * esc)) for v in c['caja']]
    rec = blanca[y0:y1, x0:x1].copy()
    if c.get('espejo') == 'derecha':                                   # la imagen corta la madeja cerca del centro: la mitad completa se refleja para cerrarla
        eje = int(round(c['eje'] * esc)); mitad = rec[:, :eje]; rec = np.concatenate([mitad, mitad[:, ::-1]], axis=1)
    elif c.get('espejo') == 'abajo':                                   # lo mismo cuando la corta el borde de abajo
        eje = int(round(c['eje'] * esc)); mitad = rec[:eje]; rec = np.concatenate([mitad, mitad[::-1]], axis=0)
    h, w = rec.shape[:2]
    tinta = (255 - rec.min(axis=2)) >= 22
    if c.get('elipse'):                                                # óvalo dentro de la caja (elipse = su radio, de 0 a 1): quita lo que asoma de otras flores
        r = 0.99 if c['elipse'] is True else float(c['elipse'])
        yy, xx = np.mgrid[0:h, 0:w]; d = ((xx - (w - 1) / 2.0) / (w / 2.0)) ** 2 + ((yy - (h - 1) / 2.0) / (h / 2.0)) ** 2
        rec = np.where((d <= r * r)[..., None], rec, 255.0); tinta &= d <= r * r
    # se descartan las piezas que tocan el borde de la caja (son de otro dibujo), salvo la más grande
    ch = 2; hh, ww = h // ch, w // ch
    peq = tinta[:hh * ch, :ww * ch].reshape(hh, ch, ww, ch).any(axis=(1, 3))
    d1 = peq.copy(); d1[1:] |= peq[:-1]; d1[:-1] |= peq[1:]; d1[:, 1:] |= peq[:, :-1]; d1[:, :-1] |= peq[:, 1:]
    lab, n = etiquetas(d1)
    if n:
        tam = [(lab == i).sum() for i in range(1, n + 1)]; grande = 1 + int(np.argmax(tam)); quitar = np.zeros_like(peq)
        for i in range(1, n + 1):
            if i == grande: continue
            ys, xs = np.where(lab == i)
            if ys.min() == 0 or xs.min() == 0 or ys.max() == hh - 1 or xs.max() == ww - 1: quitar |= (lab == i)
        mq = np.kron(quitar, np.ones((ch, ch), bool)); mq = np.pad(mq, ((0, h - mq.shape[0]), (0, w - mq.shape[1])))
        rec = np.where(mq[..., None], 255.0, rec); tinta &= ~mq
    ys, xs = np.where(tinta)
    rec = rec[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    im = Image.fromarray(rec.astype(np.uint8), 'RGB'); k = c['m'] / float(max(im.size))
    return im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.LANCZOS)


def guirnalda(f, im, c):
    """La cinta de un marco: los dibujos sueltos en fila sobre el crema, cada uno entero y pequeño. Devuelve la tira horizontal (T de alto) y la vertical (la misma fila en otro orden, girada)."""
    blanca = papel_blanco(im); sellos = [sello(blanca, c['vista'], s) for s in c['sellos']]
    def fila(orden):
        largo = sum(x.width for x in orden) + GAP * len(orden); tira = Image.new('RGB', (largo, T), (255, 255, 255)); x = GAP // 2
        for i, sl in enumerate(orden):
            y = (T - sl.height) // 2 + (2 if (i % 2 and sl.height < T - 8) else -2 if (sl.height < T - 8) else 0)            # un poquito arriba y abajo, como una guirnalda
            tira.paste(sl, (x, max(0, min(T - sl.height, y)))); x += sl.width + GAP
        return tira
    crema = c['crema']
    horiz = sobre_crema(fila(sellos), crema); vert = sobre_crema(fila(sellos[::-1]), crema).transpose(Image.ROTATE_90)
    return horiz, vert


def lineas_orilla(tira, color, vertical):
    """Dos líneas finas, una en cada orilla de la cinta."""
    d = ImageDraw.Draw(tira, 'RGBA'); w, h = tira.size; c = color + (120,)
    if vertical: d.rectangle((0, 0, 1, h), fill=c); d.rectangle((w - 2, 0, w - 1, h), fill=c)
    else: d.rectangle((0, 0, w, 1), fill=c); d.rectangle((0, h - 2, w, h), fill=c)
    return tira


def construir(f, im, c):
    crema, linea = c['crema'], c['linea']
    if c['tipo'] == 'marco':
        horiz, vert = guirnalda(f, im, c)
    else:
        alto, largo = c['alto'], c['largo']; k = T / float(alto)
        a = mejor_recorte(im, largo, alto, 'lados')
        b = mejor_recorte(im, alto, int(largo * 0.8), 'arriba', excluir=[a] if a else ()) or mejor_recorte(im, alto, int(largo * 0.8), 'arriba')
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
