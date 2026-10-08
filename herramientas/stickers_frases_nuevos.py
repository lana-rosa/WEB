"""Stickers de Rosina con frase, SIN círculo (Rosina recortada + etiqueta rosada con la frase), y los stickers numerados 21 y 22.
Reemplaza a stickers_frases.py (que armaba insignias circulares con fotos). Escribe en img/stickers/ y rehace los dos ZIP.
Uso: python3 herramientas/stickers_frases_nuevos.py
Necesita Playwright (la etiqueta se dibuja con la fuente DynaPuff de /fonts)."""
import os, zipfile, tempfile, shutil, glob
from PIL import Image, ImageFilter, ImageChops
from playwright.sync_api import sync_playwright
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
S = os.path.join(R, 'img', 'stickers')
# (archivo de Rosina, frase, nombre del sticker)
LISTA = [
    ('rosina-01-saludo', '¡Hola, tejedora!', 'hola-tejedora'),
    ('rosina-02-corazon', 'Tejido con amor', 'tejido-con-amor'),
    ('rosina-12-pulgar-arriba', 'Aprobado por Rosina', 'aprobado-por-rosina'),
    ('rosina-05-ovillo-sentada', 'Una vuelta más', 'una-vuelta-mas'),
    ('rosina-18-ovillo-abrazo', 'Abrazos de lana', 'abrazos-de-lana'),
    ('rosina-03-ovillo-corazon', 'Hecho a mano', 'hecho-a-mano'),
    ('rosina-13-cafe', 'Buenos días', 'buenos-dias'),
    ('rosina-08-feliz', '¡Gracias!', 'gracias'),
    ('rosina-21-corazon-grande', 'Te quiero', 'te-quiero'),
    ('rosina-14-cantando', '¡Lo logré!', 'lo-logre'),
    ('rosina-16-diadema', 'Tejer es mi terapia', 'tejer-es-mi-terapia'),
    ('rosina-15-ramo', '¡Feliz cumpleaños!', 'feliz-cumpleanos'),
    ('rosina-04-flor', 'Para ti, con cariño', 'para-ti-con-carino'),
    ('rosina-17-gorro', 'Tú puedes', 'tu-puedes'),
]


def contorno(im, grosor=7):
    """Borde blanco de sticker alrededor de lo que no es transparente."""
    a = im.getchannel('A')
    gran = a.filter(ImageFilter.MaxFilter(grosor * 2 + 1)).filter(ImageFilter.GaussianBlur(1.2))
    blanco = Image.new('RGBA', im.size, (255, 255, 255, 0))
    blanco.putalpha(gran)
    out = Image.new('RGBA', im.size, (0, 0, 0, 0))
    out.alpha_composite(blanco)
    out.alpha_composite(im)
    return out


def guardar(im, nombre):
    im.save(os.path.join(S, nombre + '.png'), optimize=True)
    im.save(os.path.join(S, nombre + '.webp'), 'WEBP', quality=86, method=6)


# 1) 21 y 22: llegan como ilustraciones grandes sin borde; se pasan a 512 con el borde blanco de los demás
for n, nombre in ((21, 'rosina-21-corazon-grande'), (22, 'rosina-22-saludo-circulo')):
    src = Image.open(os.path.join(S, nombre + '.webp')).convert('RGBA')
    if src.width != 512:
        a = src.getchannel('A').getbbox()
        src = src.crop(a)
        src.thumbnail((486, 486), Image.LANCZOS)
        lienzo = Image.new('RGBA', (512, 512), (0, 0, 0, 0))
        lienzo.alpha_composite(src, ((512 - src.width) // 2, (512 - src.height) // 2))
        guardar(contorno(lienzo, 6), nombre)

# 2) frases: Rosina arriba y etiqueta abajo
tmp = tempfile.mkdtemp()
shutil.copy(os.path.join(R, 'fonts', 'dynapuff-latin.woff2'), os.path.join(tmp, 'dp.woff2'))
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/opt/pw-browsers/chromium', args=['--allow-file-access-from-files'])
    pg = b.new_page(viewport={'width': 512, 'height': 512}, device_scale_factor=2)
    for arte, frase, nombre in LISTA:
        png = os.path.join(S, arte + '.png')
        html = f'''<!doctype html><meta charset="utf-8"><style>
@font-face{{font-family:DP;src:url(dp.woff2)}}
html,body{{margin:0;background:transparent}}
body{{width:512px;height:512px;position:relative}}
img{{position:absolute;left:50%;top:6px;height:408px;max-width:490px;object-fit:contain;transform:translateX(-50%)}}
.e{{position:absolute;left:50%;bottom:20px;transform:translateX(-50%);background:#E74E96;color:#fff;font:600 31px/1 DP;padding:14px 28px 16px;border-radius:999px;white-space:nowrap;border:5px solid #fff;box-shadow:0 2px 0 rgba(0,0,0,.08)}}
</style><img src="file://{png}"><div class="e">{frase}</div>'''
        ruta = os.path.join(tmp, nombre + '.html')
        open(ruta, 'w', encoding='utf-8').write(html)
        pg.goto('file://' + ruta)
        pg.evaluate('document.fonts.ready')
        pg.wait_for_function('[...document.images].every(i=>i.complete&&i.naturalWidth>0)')
        out = os.path.join(tmp, nombre + '.png')
        pg.screenshot(path=out, omit_background=True)
        im = Image.open(out).convert('RGBA').resize((512, 512), Image.LANCZOS)
        guardar(contorno(im, 3), 'frase-' + nombre)
    b.close()
shutil.rmtree(tmp)

# 3) paquetes
for ext, zname in (('webp', 'stickers-rosina-webp.zip'), ('png', 'stickers-rosina-png.zip')):
    fs = sorted(glob.glob(os.path.join(S, 'frase-*.' + ext)) + glob.glob(os.path.join(S, 'rosina-*.' + ext)))
    with zipfile.ZipFile(os.path.join(S, zname), 'w', zipfile.ZIP_DEFLATED) as z:
        for f in fs:
            z.write(f, os.path.basename(f))
    print(zname, len(fs), os.path.getsize(os.path.join(S, zname)) // 1024, 'KB')
