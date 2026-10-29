"""Fondos de la Agenda para tejedoras (29-oct-2026): a partir de las imágenes que pasó Sara (herramientas/agenda-fondos/originales/<fondo>.webp, horizontales) genera en img/agenda/.
Hay dos clases de fondo: «marco» (flores, hojas y madejas: acuarelas con adornos en las esquinas; se giran a vertical) y «patrón» (rosina = Rosina y sus amigos, ovejitas: dibujos repartidos por
toda la imagen; NO se giran, se recortan). Archivos por fondo:
  fondo-<f>.webp           la imagen en vertical (portada imprimible, 900 px de ancho; en los patrones es un recorte con la forma de la hoja carta)
  fondo-<f>-mini.webp      miniatura del botón de la Portada
  fondo-<f>-arriba.webp / -abajo.webp        mitades con el blanco vuelto transparente y bordes suavizados: marco de las hojas en pantallas anchas (horizontal)
  fondo-<f>-v-arriba.webp / -v-abajo.webp    lo mismo, de la imagen vertical: marco de las hojas en el celular
Las hojas ponen la mitad de arriba pegada arriba y la de abajo pegada abajo, así el marco sirve para hojas cortas y largas.
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
PATRONES = {'rosina': {'portada': 560, 'movil': 380, 'opacidad': 0.7}, 'ovejitas': {'portada': 700, 'movil': 600, 'opacidad': 0.9}}   # opacidad: qué tan marcado se ve el dibujo en las hojas (los colores fuertes de Rosina y amigos, más suave)

def guardar_marco(f, imagenes, opacidad=0.9):
    """imagenes: [(prefijo del archivo, imagen, ancho final, difuminado como fracción del alto)]"""
    for nombre, im, ancho, suave_fr in imagenes:
        im = im.resize((ancho, round(ancho * im.height / im.width)), Image.LANCZOS); t = a_transparente(im, opacidad); mid = t.height // 2; suave = round(t.height * suave_fr)
        mitad(t, 0, mid, suave).save(os.path.join(SAL, f'fondo-{f}-{nombre}arriba.webp'), quality=72, method=6)
        mitad(t, mid, t.height, suave).save(os.path.join(SAL, f'fondo-{f}-{nombre}abajo.webp'), quality=72, method=6)

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
    guardar_marco(f, [('', L, 1100, 0.22), ('v-', L.crop((c['movil'], 0, c['movil'] + h, h)), 680, 0.22)], c['opacidad'])   # en los patrones el difuminado es más largo: los dibujos se van borrando hacia el centro de la hoja
    print('ok', f)
