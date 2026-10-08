"""Genera los fondos de pantalla de Rosina (img/fondos/): 4 tamaños de celular por diseño, más una miniatura para la galería.
Uso: python3 herramientas/fondos/generar_fondos.py [diseño ...]     (sin argumentos: todos)
Los diseños (colores, Rosina, frase) están en herramientas/fondos/fondo.html (objeto V). Hace falta la fuente DynaPuff, que se copia de /fonts.
Clasificación por estación: la hace recursos-rosina.html (data-estacion), no este script."""
import os, sys, shutil, tempfile
from playwright.sync_api import sync_playwright
from PIL import Image
R = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
TAM = {'samsung': (1080, 2340), 'android': (1080, 2400), 'iphone': (1170, 2532), 'iphone-max': (1290, 2796)}
TODOS = ['rosa', 'lila', 'fucsia', 'cielo', 'crema', 'cafe', 'gorro', 'terapia', 'patron', 'flores', 'brote', 'sol', 'hojas', 'hojas2']
dis = sys.argv[1:] or TODOS
tmp = tempfile.mkdtemp()
shutil.copy(os.path.join(R, 'herramientas/fondos/fondo.html'), tmp)
shutil.copy(os.path.join(R, 'fonts/dynapuff-latin.woff2'), os.path.join(tmp, 'dp.woff2'))
out = os.path.join(R, 'img', 'fondos')
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/opt/pw-browsers/chromium', args=['--allow-file-access-from-files'])
    for t, (W, H) in TAM.items():
        k = W / 1170
        pg = b.new_page(viewport={'width': 1170, 'height': round(H / k)}, device_scale_factor=k)
        for v in dis:
            pg.goto('file://' + tmp + '/fondo.html?v=' + v)
            pg.evaluate('document.fonts.ready')
            pg.wait_for_function('[...document.images].every(i=>i.complete&&i.naturalWidth>0)')
            png = os.path.join(tmp, f'{v}-{t}.png')
            pg.screenshot(path=png)
            im = Image.open(png).convert('RGB')
            im.save(os.path.join(out, f'fondo-rosina-{v}-{t}.jpg'), quality=88, optimize=True)
            if t == 'samsung':
                im.resize((300, 650), Image.LANCZOS).save(os.path.join(out, f'mini-{v}.webp'), quality=82)
        pg.close()
    b.close()
shutil.rmtree(tmp)
print('ok', dis)
