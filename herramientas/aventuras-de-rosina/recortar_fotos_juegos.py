#!/usr/bin/env python3
"""Recorta las fotos reales de los juegos de la aventura (hojas de Sara en ilustraciones/juegos-reales/) y las deja en img/aventuras/fotos/
(WebP de hasta 720 px, sin completar: el juego las centra sobre el color crema del fondo)."""
import os
from PIL import Image
R = os.path.join(os.path.dirname(__file__), 'ilustraciones', 'juegos-reales')
S = os.path.join(os.path.dirname(__file__), '..', '..', 'img', 'aventuras', 'fotos')
CORTES = {  # hoja: {nombre: (x0, y0, x1, y1)}
    'lanas-3-ovillos.webp': {'lana-gruesa': (0, 180, 560, 900), 'lana-fina': (580, 330, 940, 900), 'lana-peluda': (950, 190, 1448, 800)},
    'implementos-5-fotos.webp': {'ovillo': (4, 4, 481, 538), 'gancho': (490, 4, 960, 538), 'tijeras': (968, 4, 1446, 538), 'aguja': (4, 548, 720, 1084), 'nudo-corredizo': (728, 548, 1446, 1084)},
}
os.makedirs(S, exist_ok=True)
for hoja, d in CORTES.items():
    im = Image.open(os.path.join(R, hoja)).convert('RGB')
    for n, caja in d.items():
        c = im.crop(caja); c.thumbnail((720, 720), Image.LANCZOS)
        c.save(os.path.join(S, n + '.webp'), quality=82, method=6)
        print('ok', n, c.size, '#%02x%02x%02x' % c.getpixel((c.width // 2, 3)))
