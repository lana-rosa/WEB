"""Logo animado de Lana Rosa Crochet para el pie (23-oct-2026).
Parte del HTML que envió Sara (original-de-sara-rosa.html: 15 capas PNG con transparencia, animación en CSS, fondo de un solo color).
Extrae las capas, las recorta al logo (sin el margen del lienzo cuadrado), las guarda como WebP en img/logo-animado/NN.webp
y escribe en consola el HTML del componente y el CSS (ya copiados a css/comun.css y a sincronizar_encabezado.py).
Uso: python3 herramientas/logo-animado/generar_logo_animado.py"""
import re, base64, io, os
from PIL import Image
ROOT = os.path.join(os.path.dirname(__file__), '..', '..')
t = open(os.path.join(os.path.dirname(__file__), 'original-de-sara-rosa.html'), encoding='utf-8').read()
items = re.findall(r'<div class="pos" style="left:([\d.]+)%;top:([\d.]+)%;width:([\d.]+)%;height:([\d.]+)%;"><img class="([^"]*)"(?: style="animation-delay:([\d.]+)s")? src="data:image/png;base64,([A-Za-z0-9+/=]+)"', t[t.index('<body'):])
L = [(float(a), float(b), float(c), float(d), cl, de, g) for a, b, c, d, cl, de, g in items]
x0 = min(i[0] for i in L); y0 = min(i[1] for i in L)
x1 = max(i[0] + i[2] for i in L); y1 = max(i[1] + i[3] for i in L)
W, H = x1 - x0, y1 - y0
out = os.path.join(ROOT, 'img', 'logo-animado'); os.makedirs(out, exist_ok=True)
html = []
for n, (l, tp, w, h, cl, de, g) in enumerate(L):
    im = Image.open(io.BytesIO(base64.b64decode(g))).convert('RGBA')
    im.save(os.path.join(out, f'{n:02d}.webp'), 'WEBP', quality=88, method=6)
    pos = f'left:{(l-x0)/W*100:.3f}%;top:{(tp-y0)/H*100:.3f}%;width:{w/W*100:.3f}%;height:{h/H*100:.3f}%'
    delay = f' style="animation-delay:{de}s"' if de else ''
    html.append((cl, pos, delay, n))
ASPECTO = f'{W:.3f} / {H:.3f}'
ORIGEN = f'{(37-x0)/W*100:.1f}% {(52-y0)/H*100:.1f}%'
capas = []
for cl, pos, delay, n in html:
    clases = ' '.join('la-' + c for c in cl.split())
    capas.append(f'<span class="la-pos" style="{pos}"><img class="{clases}"{delay} src="/img/logo-animado/{n:02d}.webp" alt="" width="64" height="40" loading="lazy" decoding="async"></span>')
# la cabeza (oveja y ojo) se mueve junta: se envuelve en .la-cabeza
cab = capas[0] + capas[1]
resto = ''.join(capas[2:])
comp = ('<div class="pie-logo-anim" role="img" aria-label="Lana Rosa Crochet" style="aspect-ratio:' + ASPECTO + '">'
        '<span class="la-cabeza" style="transform-origin:' + ORIGEN + '">' + cab + '</span>' + resto + '</div>')
open(os.path.join(os.path.dirname(__file__), 'componente.html'), 'w', encoding='utf-8').write(comp)
print('listo:', ASPECTO, ORIGEN, len(comp), 'bytes de HTML')
