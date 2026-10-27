"""Genera los íconos de las cuatro apps instalables (img/app/): 192, 512 y 512 "maskable" para Tienda (Crochet), Mercería, Academy y la Agenda para tejedoras (verde menta; también su favicon y el apple-touch-icon).
Uso: python3 herramientas/generar_iconos_app.py
Parte de los íconos de la pestaña de cada casa (la ovejita con la lana en un círculo del color de la casa: rosado, lila y azul); miden 256 px, así que se amplían y se afilan los bordes."""
import os
from PIL import Image, ImageFilter
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FUENTES = {'crochet': 'img/favicon-256.png', 'merceria': 'img/favicon-merceria-256.png', 'academy': 'img/favicon-academy-256.png'}
FONDO = {'crochet': (220, 61, 135), 'merceria': (142, 87, 216), 'academy': (46, 113, 205)}   # color del centro de cada ícono (relleno del "maskable")

def afilar(im, lado):
    """Amplía un ícono pequeño y endurece el borde alfa para que no se vea borroso."""
    g = im.resize((lado, lado), Image.LANCZOS)
    a = g.getchannel('A').point(lambda v: 0 if v < 100 else (255 if v > 156 else int((v - 100) * 255 / 56)))
    g.putalpha(a)
    return g.filter(ImageFilter.UnsharpMask(radius=2, percent=90, threshold=2))

def sin_aro(im):
    """El ícono de la pestaña es un disco de color con las esquinas blancas: se pinta todo lo que queda fuera del disco con el color del disco (sin círculo blanco)."""
    im = im.copy(); w = im.width; c = w / 2; color = im.getpixel((int(c), int(w * 0.09)))[:3] + (255,)
    px = im.load()
    for y in range(w):
        for x in range(w):
            if (x - c + .5) ** 2 + (y - c + .5) ** 2 > (w * 0.455) ** 2: px[x, y] = color
    return im

os.makedirs(os.path.join(R, 'img', 'app'), exist_ok=True)
for casa, f in FUENTES.items():
    src = sin_aro(Image.open(os.path.join(R, f)).convert('RGBA'))
    FONDO[casa] = src.getpixel((src.width // 2, int(src.width * 0.09)))[:3]
    for lado in (192, 512):
        im = afilar(src, lado) if src.width < lado else src.resize((lado, lado), Image.LANCZOS)
        im.save(os.path.join(R, 'img', 'app', f'icono-{casa}-{lado}.png'), optimize=True)
    # maskable: el sistema recorta con su propia forma, así que el dibujo va al 78 % dentro de un cuadrado lleno
    lienzo = Image.new('RGBA', (512, 512), FONDO[casa] + (255,))
    chico = afilar(src, 400) if src.width < 400 else src.resize((400, 400), Image.LANCZOS)
    lienzo.alpha_composite(chico, (56, 56))
    lienzo.save(os.path.join(R, 'img', 'app', f'icono-{casa}-maskable-512.png'), optimize=True)
print('ok')

# ---- Agenda para tejedoras (28-oct-2026): la misma ovejita del ícono de Academy, con el disco en verde menta ----
VERDE = (30, 158, 120)
def recolorear(im, color):
    """Cambia el azul del disco por `color` conservando el dibujo blanco (mezcla según cuánto se aleja el píxel del azul original)."""
    im = im.copy().convert('RGBA'); base = im.getpixel((im.width // 2, int(im.width * 0.09)))[:3]; px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            t = max(0.0, min(1.0, (r - base[0]) / max(1, 255 - base[0])))
            px[x, y] = (int(color[0] + (255 - color[0]) * t), int(color[1] + (255 - color[1]) * t), int(color[2] + (255 - color[2]) * t), a)
    return im
src = recolorear(sin_aro(Image.open(os.path.join(R, 'img/favicon-academy-256.png')).convert('RGBA')), VERDE)
src.save(os.path.join(R, 'img', 'favicon-agenda-256.png'), optimize=True)
afilar(src, 180).save(os.path.join(R, 'img', 'apple-touch-icon-agenda.png'), optimize=True)
for lado in (192, 512):
    afilar(src, lado).save(os.path.join(R, 'img', 'app', f'icono-agenda-{lado}.png'), optimize=True)
lienzo = Image.new('RGBA', (512, 512), VERDE + (255,)); lienzo.alpha_composite(afilar(src, 400), (56, 56))
lienzo.save(os.path.join(R, 'img', 'app', 'icono-agenda-maskable-512.png'), optimize=True)
print('ok agenda')
