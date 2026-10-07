#!/usr/bin/env python3
"""Lista las fotos adicionales de productos (nombre-2.jpg, nombre-3.jpg) que existen en img/productos/.
La ficha de producto de tienda.html lee img/productos/extras.json para no pedir fotos que no existen.
Correr después de subir fotos adicionales:  python3 herramientas/generar_extras_productos.py
"""
import json, os, re
carpeta = os.path.join(os.path.dirname(__file__), '..', 'img', 'productos')
extras = sorted(f for f in os.listdir(carpeta) if re.search(r'-[23]\.(jpg|jpeg|png|webp)$', f, re.I))
with open(os.path.join(carpeta, 'extras.json'), 'w', encoding='utf-8') as o:
    json.dump(extras, o, ensure_ascii=False)
print(len(extras), 'fotos adicionales')
