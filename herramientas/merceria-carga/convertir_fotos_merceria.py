#!/usr/bin/env python3
"""Convierte las 34 fotos de las lanas de la Mercería a WebP liviano y deja el SQL para apuntar `foto_url` a ellas (E2, 17-nov-2026).

    python3 herramientas/merceria-carga/convertir_fotos_merceria.py CARPETA_CON_LAS_FOTOS

Qué hace (no toca la base): lee .jpg/.jpeg/.png de la carpeta, las reduce a un máximo de 800x1000 px, guarda
`img/productos/<nombre>.webp` (calidad 80) y escribe en pantalla el SQL de `foto_url` y las fotos que no coinciden con
ningún producto. Después correr `python3 herramientas/generar_miniaturas_productos.py` para las miniaturas.
Los nombres esperados salen de `foto_url` de cada lana en la base (p. ej. `lana-chelin-kusi-kusi-almendra.jpg`): la foto debe llamarse igual
(la extensión da igual). Cambiar `foto_url` a `.webp` es un cambio en la base (nivel 🔴): se hace con el sí de Jennifer."""
import os, re, sys
from PIL import Image
RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
DESTINO = os.path.join(RAIZ, 'img', 'productos')
if len(sys.argv) < 2 or not os.path.isdir(sys.argv[1]):
    sys.exit('Uso: convertir_fotos_merceria.py CARPETA_CON_LAS_FOTOS')
hechas, sql = [], []
for f in sorted(os.listdir(sys.argv[1])):
    if not re.search(r'\.(jpe?g|png|webp)$', f, re.I):
        continue
    base = re.sub(r'\.[A-Za-z]+$', '', f).lower().replace(' ', '-')
    im = Image.open(os.path.join(sys.argv[1], f)); im = im.convert('RGB')
    im.thumbnail((800, 1000), Image.LANCZOS)
    salida = os.path.join(DESTINO, base + '.webp')
    im.save(salida, 'WEBP', quality=80, method=6)
    hechas.append((base, os.path.getsize(salida) // 1024))
    sql.append(f"update inventario_items set foto_url = '{base}.webp', updated_at = now() where foto_url in ('{base}.jpg','{base}.jpeg','{base}.png','{base}.webp') and centro_costo_id = '2c1577b5-514e-4952-ba15-4feb64ea1879';")
print(f'{len(hechas)} fotos convertidas en img/productos/ (WebP, máx. 800x1000):')
for b, kb in hechas:
    print(f'  {b}.webp  {kb} KB')
print('\n-- SQL para apuntar foto_url a los .webp (revisar y aplicar con el sí de Jennifer):')
print('\n'.join(sql))
