"""Genera los íconos de las tres apps instalables (img/app/): 192, 512 y 512 "maskable" para Tienda (Crochet), Mercería y Academy.
Uso: python3 herramientas/generar_iconos_app.py
Parte de los íconos de la pestaña de cada casa; los de Mercería y Academy miden 256 px, así que se amplían y se afilan los bordes."""
import os
from PIL import Image, ImageFilter
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FUENTES = {'crochet': 'img/icono-lr-original.png', 'merceria': 'img/favicon-merceria-256.png', 'academy': 'img/favicon-academy-256.png'}
FONDO = {'crochet': (251, 228, 239), 'merceria': (142, 87, 216), 'academy': (46, 113, 205)}   # color del centro de cada ícono (relleno del "maskable")

def afilar(im, lado):
    """Amplía un ícono pequeño y endurece el borde alfa para que no se vea borroso."""
    g = im.resize((lado, lado), Image.LANCZOS)
    a = g.getchannel('A').point(lambda v: 0 if v < 100 else (255 if v > 156 else int((v - 100) * 255 / 56)))
    g.putalpha(a)
    return g.filter(ImageFilter.UnsharpMask(radius=2, percent=90, threshold=2))

os.makedirs(os.path.join(R, 'img', 'app'), exist_ok=True)
for casa, f in FUENTES.items():
    src = Image.open(os.path.join(R, f)).convert('RGBA')
    for lado in (192, 512):
        im = afilar(src, lado) if src.width < lado else src.resize((lado, lado), Image.LANCZOS)
        im.save(os.path.join(R, 'img', 'app', f'icono-{casa}-{lado}.png'), optimize=True)
    # maskable: el sistema recorta con su propia forma, así que el dibujo va al 78 % dentro de un cuadrado lleno
    lienzo = Image.new('RGBA', (512, 512), FONDO[casa] + (255,))
    # para Crochet el círculo tiene borde rosa: se recorta sobre fondo rosa suave
    chico = afilar(src, 400) if src.width < 400 else src.resize((400, 400), Image.LANCZOS)
    lienzo.alpha_composite(chico, (56, 56))
    lienzo.save(os.path.join(R, 'img', 'app', f'icono-{casa}-maskable-512.png'), optimize=True)
print('ok')
