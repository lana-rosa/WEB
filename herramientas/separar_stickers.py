from PIL import Image, ImageFilter
import sys
# Uso: python3 separar_stickers.py <hoja_de_stickers.webp>  (hoja con 20 stickers sobre fondo blanco)
import numpy as np, os
from scipy import ndimage as nd
OUT = 'img/stickers'; os.makedirs(OUT, exist_ok=True)
im = Image.open(sys.argv[1]).convert('RGB')
a = np.asarray(im).astype(np.int16)
mn = a.min(2); mx = a.max(2)
c = (mn < 225) | ((mx - mn) > 25)
c = nd.binary_opening(c, iterations=1)
lab, n = nd.label(nd.binary_dilation(c, iterations=4))
areas = nd.sum(np.ones_like(lab), lab, range(1, n+1))
objs = nd.find_objects(lab)
big = [i+1 for i, ar in enumerate(areas) if ar > 8000]
cent = {i: nd.center_of_mass(lab == i) for i in big}
grupo = {i: [i] for i in big}
for j in range(1, n+1):
    if j in big or areas[j-1] < 30: continue
    cj = nd.center_of_mass(lab == j)
    k = min(big, key=lambda i: (cent[i][0]-cj[0])**2 + (cent[i][1]-cj[1])**2)
    grupo[k].append(j)
# ordenar por fila y columna
orden = sorted(big, key=lambda i: (round(cent[i][0] / 300), cent[i][1]))
nombres = ['saludo','corazon','ovillo-corazon','flor','ovillo-sentada',
           'idea','leyendo','feliz','cartel','bolso',
           'computador','pulgar-arriba','cafe','cantando','ramo',
           'diadema','gorro','ovillo-abrazo','beso','sentada-saludo']
H, W = mn.shape
for num, (i, nombre) in enumerate(zip(orden, nombres), 1):
    m = np.isin(lab, grupo[i]) & c
    m = nd.binary_closing(m, iterations=3)
    m = nd.binary_fill_holes(m)
    d = np.pad(nd.binary_dilation(m, iterations=10), 30)
    d = nd.binary_closing(d, structure=nd.generate_binary_structure(2, 1), iterations=14)
    sil = nd.binary_fill_holes(d)[30:-30, 30:-30]
    ys, xs = np.where(sil)
    y0, y1, x0, x1 = max(ys.min()-4,0), min(ys.max()+5,H), max(xs.min()-4,0), min(xs.max()+5,W)
    rgb = a[y0:y1, x0:x1].copy().astype(np.uint8)
    ms = sil[y0:y1, x0:x1]; mc = m[y0:y1, x0:x1]
    # borde: fuera del contenido, todo blanco limpio
    borde = ms & ~nd.binary_dilation(mc, iterations=2)
    rgb[borde] = 255
    alpha = Image.fromarray((ms*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))
    # contorno suave rosado para que se vea sobre fondos claros
    anillo = nd.binary_dilation(ms, iterations=2) & ~ms
    rgba = np.dstack([rgb, np.asarray(alpha)])
    full = np.zeros((ms.shape[0]+6, ms.shape[1]+6, 4), np.uint8)
    full[3:-3, 3:-3] = rgba
    an = np.zeros(full.shape[:2], bool); an[3:-3,3:-3] = anillo
    an = nd.binary_dilation(an, iterations=1) & (full[...,3] < 128)
    full[an] = [236, 200, 216, 170]
    st = Image.fromarray(full, 'RGBA')
    k = 480 / max(st.width, st.height); st = st.resize((round(st.width*k), round(st.height*k)), Image.LANCZOS)
    lienzo = Image.new('RGBA', (512, 512), (0,0,0,0))
    lienzo.paste(st, ((512-st.width)//2, (512-st.height)//2), st)
    base = f'{OUT}/rosina-{num:02d}-{nombre}'
    lienzo.save(base + '.png', optimize=True)
    lienzo.save(base + '.webp', 'WEBP', quality=86, method=6)
    print(num, nombre, os.path.getsize(base+'.png')//1024, 'KB png', os.path.getsize(base+'.webp')//1024, 'KB webp')
