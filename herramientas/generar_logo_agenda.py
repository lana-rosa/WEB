"""Logo del encabezado de la casa «Agenda» (29-oct-2026): el logo de Academy en verde y con «Agenda» en la píldora.
Uso: /usr/bin/python3 herramientas/generar_logo_agenda.py   (necesita Playwright para dibujar el texto con la letra DynaPuff)"""
import os, tempfile
from PIL import Image, ImageDraw
from playwright.sync_api import sync_playwright
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CLARO = (255, 255, 255); VERDE = (158, 162, 249); VERDE_OSCURO = (91, 96, 214); PILDORA = (255, 255, 255)   # lila de Lana Rosa #9EA2F9, texto #5B60D6 y blanco (31-oct-2026; antes fucsia y antes vinotinto)
src = Image.open(os.path.join(R, 'img', 'logo-academy-360.webp')).convert('RGB'); px = src.load(); w, h = src.size
base = src.getpixel((5, 5))
# 1) recolorear: el azul de fondo pasa a verde y el blanco queda blanco (mezcla según lo cerca que esté del blanco)
out = Image.new('RGB', src.size); po = out.load()
for y in range(h):
    for x in range(w):
        r, g, b = px[x, y]; t = max(0.0, min(1.0, (r - base[0]) / (255 - base[0])))
        po[x, y] = tuple(round(VERDE[i] + (CLARO[i] - VERDE[i]) * t) for i in range(3))   # la oveja y las letras en rosa empolvado
# 2) la píldora: se borra el texto «Academy» y se vuelve a dibujar redonda
S = 4; x0, y0, x1, y1 = 122, 185, 238, 212
pil = Image.new('RGBA', ((x1 - x0) * S, (y1 - y0) * S), (0, 0, 0, 0)); ImageDraw.Draw(pil).rounded_rectangle((0, 0, pil.width - 1, pil.height - 1), radius=(y1 - y0) * S // 2, fill=PILDORA + (255,))
# 3) «Agenda» con DynaPuff
html = '<style>@font-face{font-family:DP;src:url("file://%s/fonts/dynapuff-latin.woff2");font-weight:400 700}body{margin:0;background:transparent}span{font:700 17px DP;color:rgb%s;white-space:nowrap;display:inline-block;padding:6px}</style><span id="t">Agenda</span>' % (R, VERDE_OSCURO)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get('CHROMIUM', '/opt/pw-browsers/chromium'), args=['--no-sandbox', '--allow-file-access-from-files'])
    pg = b.new_page(device_scale_factor=S, viewport={'width': 300, 'height': 80}); f = os.path.join(tempfile.mkdtemp(), 't.html'); open(f, 'w').write(html); pg.goto('file://' + f); pg.wait_for_timeout(600)
    pg.locator('#t').screenshot(path=f + '.png', omit_background=True); b.close()
txt = Image.open(f + '.png').convert('RGBA'); txt = txt.crop(txt.getbbox())
pil.alpha_composite(txt, ((pil.width - txt.width) // 2, (pil.height - txt.height) // 2 - S // 2))
pil = pil.resize((x1 - x0, y1 - y0), Image.LANCZOS)
# se pinta primero un rectángulo del verde del fondo sobre la píldora vieja (con un píxel de holgura) y luego la nueva
ImageDraw.Draw(out).rectangle((x0 - 1, y0 - 1, x1 + 1, y1 + 1), fill=VERDE)
out.paste(pil, (x0, y0), pil)
out.save(os.path.join(R, 'img', 'logo-agenda-360.webp'), quality=92)
print('ok', os.path.getsize(os.path.join(R, 'img', 'logo-agenda-360.webp')))
