#!/usr/bin/env python3
"""Genera las miniaturas de las fotos de productos para las tarjetas de la tienda (img/productos-mini/<nombre>.webp, máx. 420 px de ancho).
Las tarjetas muestran la foto a unos 170 px; con la miniatura (~20 KB en lugar de ~75 KB) la categoría aparece casi al instante.
La ficha del producto sigue usando la foto grande. Correr después de subir fotos nuevas a img/productos/:
    python3 herramientas/generar_miniaturas_productos.py          (solo crea las que faltan)
    python3 herramientas/generar_miniaturas_productos.py --todas  (vuelve a crearlas todas)"""
import os, re, sys
from PIL import Image
RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'img')
ORIGEN, DESTINO = os.path.join(RAIZ, 'productos'), os.path.join(RAIZ, 'productos-mini')
os.makedirs(DESTINO, exist_ok=True)
todas = '--todas' in sys.argv
hechas = 0; ahorro = 0
for f in sorted(os.listdir(ORIGEN)):
    if not re.search(r'\.(jpe?g|png|webp)$', f, re.I) or re.search(r'-[23]\.(jpe?g|png|webp)$', f, re.I):
        continue   # las fotos adicionales (-2, -3) solo salen en la ficha
    ruta = os.path.join(ORIGEN, f); salida = os.path.join(DESTINO, re.sub(r'\.[A-Za-z]+$', '', f) + '.webp')
    if os.path.exists(salida) and not todas and os.path.getmtime(salida) >= os.path.getmtime(ruta):
        continue
    im = Image.open(ruta); im = im.convert('RGBA' if im.mode in ('RGBA', 'LA', 'P') else 'RGB')
    im.thumbnail((420, 525), Image.LANCZOS)
    im.save(salida, 'WEBP', quality=78, method=6)
    hechas += 1; ahorro += os.path.getsize(ruta) - os.path.getsize(salida)
print(hechas, 'miniaturas creadas;', ahorro // 1024, 'KB menos que las originales')
