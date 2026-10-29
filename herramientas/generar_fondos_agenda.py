"""Fondos de la Agenda para tejedoras (29-oct-2026): a partir de las acuarelas que pasó Sara (herramientas/agenda-fondos/originales/<fondo>.webp, horizontales) genera en img/agenda/:
  fondo-<f>.webp           la imagen girada a vertical (portada imprimible; 900 px de ancho)
  fondo-<f>-mini.webp      miniatura del botón de la Portada
  fondo-<f>-arriba.webp / -abajo.webp        mitades con el blanco vuelto transparente y bordes suavizados: marco de las hojas en pantallas anchas (horizontal)
  fondo-<f>-v-arriba.webp / -v-abajo.webp    lo mismo, de la imagen vertical: marco de las hojas en el celular
Las hojas ponen la mitad de arriba pegada arriba y la de abajo pegada abajo, así el marco sirve para hojas cortas y largas.
Uso: /usr/bin/python3 herramientas/generar_fondos_agenda.py"""
import os
from PIL import Image, ImageChops
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORIG = os.path.join(R, 'herramientas', 'agenda-fondos', 'originales'); SAL = os.path.join(R, 'img', 'agenda'); os.makedirs(SAL, exist_ok=True)

def a_transparente(im):
    """Color a alfa: sobre blanco se ve idéntico a la imagen, pero el blanco queda transparente."""
    im = im.convert('RGB'); w, h = im.size; px = im.load(); out = Image.new('RGBA', im.size); po = out.load()
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]; falta = 255 - min(r, g, b)
            a = min(1.0, falta / 70.0)
            if a <= 0.01: po[x, y] = (255, 255, 255, 0); continue
            po[x, y] = tuple(max(0, min(255, round((c - 255 * (1 - a)) / a))) for c in (r, g, b)) + (round(a * 255 * 0.9),)
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

for f in ('flores', 'hojas', 'madejas'):
    L = Image.open(os.path.join(ORIG, f + '.webp')).convert('RGB')
    V = L.transpose(Image.ROTATE_270)                                             # 90° a la derecha: vertical
    Vp = V.resize((900, round(900 * V.height / V.width)), Image.LANCZOS)
    Vp.save(os.path.join(SAL, f'fondo-{f}.webp'), quality=80, method=6)
    Vp.resize((96, round(96 * Vp.height / Vp.width)), Image.LANCZOS).save(os.path.join(SAL, f'fondo-{f}-mini.webp'), quality=80)
    for nombre, im, ancho in (('', L, 1100), ('v-', V, 680)):
        im = im.resize((ancho, round(ancho * im.height / im.width)), Image.LANCZOS); t = a_transparente(im); mid = t.height // 2; suave = round(t.height * 0.09)
        mitad(t, 0, mid, suave).save(os.path.join(SAL, f'fondo-{f}-{nombre}arriba.webp'), quality=72, method=6)
        mitad(t, mid, t.height, suave).save(os.path.join(SAL, f'fondo-{f}-{nombre}abajo.webp'), quality=72, method=6)
    print('ok', f)
