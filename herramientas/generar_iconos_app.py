"""Genera los íconos de las cuatro apps/casas (Tienda de amigurumis, Mercería, Academy y Agenda para tejedoras) — 29-oct-2026, a pedido de Sara: redondos y con la ovejita grande.
Uso: /usr/bin/python3 herramientas/generar_iconos_app.py   (con esta versión de Pillow; la de `python3` puede dar otro resultado)

El dibujo (ovejita con el ovillo) sale de la línea blanca del ícono de Academy (img/favicon-academy-256.png, guardado la primera vez en herramientas/iconos-app/ovejita-256.png para que
la fuente no cambie al regenerar). Se agranda, se engrosa un poco y se pone sobre un círculo del color de cada casa:
  img/favicon-<casa>-256.png y .ico          círculo con transparencia (pestaña del navegador)
  img/apple-touch-icon-<casa>.png (180)      cuadrado lleno de color (iOS lo redondea solo)
  img/app/icono-<casa>-192/512.png           círculo con transparencia
  img/app/icono-<casa>-maskable-512.png      cuadrado lleno, con la oveja dentro de la zona segura (Android lo recorta con su forma)
Para el logo del encabezado de la Agenda: herramientas/generar_logo_agenda.py."""
import os
from PIL import Image, ImageFilter, ImageDraw, ImageChops
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FUENTE = os.path.join(R, 'herramientas', 'iconos-app', 'ovejita-256.png')
if not os.path.exists(FUENTE):
    os.makedirs(os.path.dirname(FUENTE), exist_ok=True)
    Image.open(os.path.join(R, 'img', 'favicon-academy-256.png')).convert('RGBA').save(FUENTE)
COLORES = {'crochet': (232, 78, 148), 'merceria': (142, 85, 214), 'academy': (42, 111, 203), 'agenda': (116, 61, 80)}
ARCHIVO = {'crochet': ('img/favicon-256.png', 'img/apple-touch-icon.png', 'img/favicon.ico'), 'merceria': ('img/favicon-merceria-256.png', 'img/apple-touch-icon-merceria.png', 'img/favicon-merceria.ico'),
           'academy': ('img/favicon-academy-256.png', 'img/apple-touch-icon-academy.png', 'img/favicon-academy.ico'), 'agenda': ('img/favicon-agenda-256.png', 'img/apple-touch-icon-agenda.png', 'img/favicon-agenda.ico')}

def mascara_oveja():
    """Línea blanca del dibujo como máscara de 1536 px, suave, más gruesa y recortada a su contorno."""
    src = Image.open(FUENTE).convert('RGBA'); w = src.width; c = w // 2
    base = src.getpixel((c, int(w * 0.09)))[:3]
    g = Image.new('L', src.size, 0); px = src.load(); gp = g.load()
    for y in range(w):
        for x in range(w):
            r, gg, b, a = px[x, y]
            if (x - c + .5) ** 2 + (y - c + .5) ** 2 > (w * 0.45) ** 2: continue    # fuera del disco (aro blanco): no es dibujo
            gp[x, y] = max(0, min(255, int((r - base[0]) * 255 / max(1, 255 - base[0]))))
    g = g.resize((1536, 1536), Image.LANCZOS).filter(ImageFilter.GaussianBlur(2))
    g = g.point(lambda v: 0 if v < 70 else (255 if v > 150 else int((v - 70) * 255 / 80)))         # borde limpio
    g = g.filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.GaussianBlur(1.6))                    # un poco más gruesa: se lee mejor en tamaños chicos
    return g.crop(g.getbbox())

MASCARA = mascara_oveja()

def dibujo(lado, color, fraccion):
    """Cuadrado `lado` del color, con la oveja blanca centrada que ocupa `fraccion` del lado (por su dimensión mayor)."""
    im = Image.new('RGBA', (lado, lado), color + (255,))
    k = fraccion * lado / max(MASCARA.size); m = MASCARA.resize((max(1, round(MASCARA.width * k)), max(1, round(MASCARA.height * k))), Image.LANCZOS)
    blanco = Image.new('RGBA', m.size, (232, 213, 212, 255) if color == COLORES['agenda'] else (255, 255, 255, 255)); blanco.putalpha(m)
    im.alpha_composite(blanco, ((lado - m.width) // 2, (lado - m.height) // 2 + round(lado * 0.01)))
    return im

def circulo(im):
    lado = im.width; S = 4
    m = Image.new('L', (lado * S, lado * S), 0); ImageDraw.Draw(m).ellipse((0, 0, lado * S - 1, lado * S - 1), fill=255)
    m = m.resize((lado, lado), Image.LANCZOS); a = ImageChops.multiply(im.getchannel('A'), m); im = im.copy(); im.putalpha(a); return im

if __name__ == '__main__':
    os.makedirs(os.path.join(R, 'img', 'app'), exist_ok=True)
    for casa, color in COLORES.items():
        if os.environ.get('SOLO') and os.environ['SOLO'] != casa: continue                 # SOLO=agenda regenera solo esa casa
        fav, apple, ico = ARCHIVO[casa]
        circulo(dibujo(1024, color, 0.86 if casa == 'agenda' else 0.76)).resize((256, 256), Image.LANCZOS).save(os.path.join(R, fav), optimize=True)
        dibujo(720, color, 0.86 if casa == 'agenda' else 0.74).resize((180, 180), Image.LANCZOS).convert('RGB').save(os.path.join(R, apple), optimize=True)
        for lado in (192, 512):
            if casa == 'agenda': circulo(dibujo(1024, color, 0.84)).resize((lado, lado), Image.LANCZOS).save(os.path.join(R, 'img', 'app', f'icono-{casa}-{lado}.png'), optimize=True)   # 29-oct: redondo, esquinas transparentes, ovejita grande (pedido de Sara)
            else: circulo(dibujo(1024, color, 0.76)).resize((lado, lado), Image.LANCZOS).save(os.path.join(R, 'img', 'app', f'icono-{casa}-{lado}.png'), optimize=True)
        dibujo(1024, color, 0.58).resize((512, 512), Image.LANCZOS).convert('RGB').save(os.path.join(R, 'img', 'app', f'icono-{casa}-maskable-512.png'), optimize=True)
        base = circulo(dibujo(1024, color, 0.86))
        base.resize((48, 48), Image.LANCZOS).save(os.path.join(R, ico), format='ICO', sizes=[(16, 16), (32, 32), (48, 48)])
        print('ok', casa)
