"""Íconos de perfil de Rosina para «Mi cuenta» (3-nov-2026): recorta cuadrados de 160 px, como los animalitos de img/agenda/ui/animales/.
Las poses sentadas se usan enteras; las de pie, de la cabeza a la cintura (así la cara se ve grande, como en los animalitos).
Uso: python3 herramientas/agenda-iconos/generar_iconos_rosina.py   (salida: img/agenda/ui/rosina-iconos/<nombre>.webp)"""
import os, sys
import numpy as np
from PIL import Image, ImageFilter
RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ORIG = os.path.join(RAIZ, 'img/aventuras/rosina-original'); SAL = os.path.join(RAIZ, 'img/agenda/ui/rosina-iconos')
SENTADAS = {'abrazo', 'corazon', 'gorro', 'leyendo', 'tejiendo', 'tejiendo2', 'sueno', 'sueno2'}
ELEGIDAS = ['feliz', 'saludo', 'abrazo', 'tejiendo', 'gorro', 'leyendo', 'gancho', 'celebra', 'corazon', 'risa', 'orgullosa', 'idea', 'ovillo', 'flor', 'lupa', 'diploma']
def vivo(im, rosa=2.0, cafe_s=1.3, cafe_v=0.85):
    """Colores más vivos (pedido de Jennifer, 4-nov-2026): rosados del vestido, moños y corazones con más fuerza, café del cabello más rico y un contorno café
    fino alrededor, como los animalitos. Solo toca los tonos rosados y cafés: el blanco de la cara y los amarillos de las estrellas quedan igual."""
    a = np.array(im.convert('RGBA')).astype(np.float32) / 255; rgb = a[..., :3]; al = a[..., 3]
    mx = rgb.max(-1); mn = rgb.min(-1); d = mx - mn; s = np.where(mx > 0, d / np.maximum(mx, 1e-6), 0); v = mx; r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    m = d > 1e-6; h = np.zeros_like(mx)
    h = np.where(m & (mx == r), ((g - b) / np.maximum(d, 1e-6)) % 6, h); h = np.where(m & (mx == g), (b - r) / np.maximum(d, 1e-6) + 2, h); h = np.where(m & (mx == b), (r - g) / np.maximum(d, 1e-6) + 4, h); h = h * 60
    rosa_m = (h >= 300) & (s > 0.05); cafe_m = (h >= 8) & (h <= 45) & (s > 0.12) & (v < 0.8)
    s2 = np.where(rosa_m, np.minimum(1, s * rosa + 0.06), s); v2 = v.copy(); s2 = np.where(cafe_m, np.minimum(1, s * cafe_s), s2); v2 = np.where(cafe_m, v * cafe_v, v2)
    hh = (h / 60) % 6; i = np.floor(hh).astype(int); f = hh - i; p = v2 * (1 - s2); q = v2 * (1 - f * s2); t = v2 * (1 - (1 - f) * s2); out = np.zeros_like(rgb)
    for k, (rr, gg, bb) in enumerate([(v2, t, p), (q, v2, p), (p, v2, t), (p, q, v2), (t, p, v2), (v2, p, q)]):
        sel = (i == k); out[..., 0] = np.where(sel, rr, out[..., 0]); out[..., 1] = np.where(sel, gg, out[..., 1]); out[..., 2] = np.where(sel, bb, out[..., 2])
    res = Image.fromarray((np.dstack([out, al]) * 255).astype(np.uint8), 'RGBA')
    base = Image.new('RGBA', res.size, (107, 67, 51, 255)); base.putalpha(res.getchannel('A').filter(ImageFilter.MaxFilter(5))); base.alpha_composite(res); return base
def icono(nombre, T=160, solo_cara=0.64):
    im = Image.open(os.path.join(ORIG, nombre + '.webp')).convert('RGBA'); bb = im.getchannel('A').point(lambda a: 255 if a > 24 else 0).getbbox(); im = im.crop(bb)
    if nombre not in SENTADAS: im = im.crop((0, 0, im.width, int(im.height * solo_cara)))
    lado = max(im.width, im.height); m = int(lado * 0.06); lienzo = Image.new('RGBA', (lado + 2 * m, lado + 2 * m), (0, 0, 0, 0))
    lienzo.paste(im, ((lienzo.width - im.width) // 2, m + (lado - im.height) // 2 if nombre in SENTADAS else m), im)
    return vivo(lienzo.resize((T * 2, T * 2), Image.LANCZOS)).resize((T, T), Image.LANCZOS)
if __name__ == '__main__':
    os.makedirs(SAL, exist_ok=True)
    for n in (sys.argv[1:] or ELEGIDAS): icono(n).save(os.path.join(SAL, n + '.webp'), 'WEBP', quality=88, method=6)
    print('listo:', len(os.listdir(SAL)), 'íconos en', SAL)
