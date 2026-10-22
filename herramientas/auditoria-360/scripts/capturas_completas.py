#!/usr/bin/env python3
"""Capturas de página completa para la revisión visual (solo lectura): rechaza el aviso de cookies, recorre la página para que aparezcan las secciones
con animación y guarda tiras de 1400 px (celular) o 1000 px (computador).

    python3 herramientas/auditoria-360/scripts/capturas_completas.py <carpeta_salida> <ruta> [<ruta> ...]
"""
import os, sys
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright
from PIL import Image
BASE = os.environ.get('AUD_BASE', 'http://localhost:8765')
def stub(route):
    h = urlsplit(route.request.url).hostname
    if h in ('localhost', '127.0.0.1'): return route.continue_()
    if h and h.endswith('supabase.co'): return route.fulfill(status=200, content_type='application/json', body='[]')
    return route.abort()
sal = sys.argv[1]; os.makedirs(sal, exist_ok=True)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/opt/pw-browsers/chromium', args=['--no-sandbox'])
    for ruta in sys.argv[2:]:
        for w, h, tira in ((390, 844, 1400), (1280, 800, 1000)):
            c = b.new_context(viewport={'width': w, 'height': h}); c.route('**/*', stub); pg = c.new_page()
            pg.goto(BASE + ruta, wait_until='domcontentloaded'); pg.wait_for_timeout(1200)
            try: pg.get_by_role('button', name='Rechazar').click(timeout=1500)
            except Exception: pass
            alto = pg.evaluate('document.documentElement.scrollHeight')
            y = 0
            while y < alto:
                pg.evaluate(f'window.scrollTo(0,{y})'); pg.wait_for_timeout(150); y += h // 2
            pg.evaluate('window.scrollTo(0,0)'); pg.wait_for_timeout(500)
            nombre = (ruta.strip('/').replace('/', '_').replace('.html', '').replace('?', '_').replace('=', '') or 'inicio')[:50]
            ruta_png = os.path.join(sal, f'{nombre}-{w}.png'); pg.screenshot(path=ruta_png, full_page=True)
            im = Image.open(ruta_png).convert('RGB'); W, H = im.size
            n = 0
            for top in range(0, H, tira):
                im.crop((0, top, W, min(H, top + tira))).save(os.path.join(sal, f'{nombre}-{w}-{n}.jpg'), quality=72); n += 1
            os.remove(ruta_png); print(nombre, w, H, 'px,', n, 'tiras')
            c.close()
    b.close()
