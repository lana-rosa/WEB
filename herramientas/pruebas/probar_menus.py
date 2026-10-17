#!/usr/bin/env python3
"""Comprueba que todas las páginas de una casa abren el mismo menú (el de las tres rayitas y el de escritorio), y que las páginas comunes
(Revista, preguntas frecuentes, contacto, políticas, cuenta, gracias) muestran el menú de la casa de la que viene la persona.
Uso: con un servidor local en el puerto 8765: python3 herramientas/pruebas/probar_menus.py"""
import os, sys, glob, re
from playwright.sync_api import sync_playwright
RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
CHROMIUM = os.environ.get('CHROMIUM', '/opt/pw-browsers/chromium')
BASE = 'http://localhost:8765'
bien = mal = 0
def v(n, ok):
    global bien, mal
    print(('  ok   ' if ok else '  FALLA ') + n); bien += ok; mal += (not ok)
def ruta(f):
    r = '/' + f.replace(os.sep, '/')
    return r[:-len('index.html')] if r.endswith('/index.html') else r
# páginas por casa, leídas del data-casa de cada página
casas = {'crochet': [], 'merceria': [], 'academy': []}; comunes = []
for f in sorted(glob.glob(os.path.join(RAIZ, '**', '*.html'), recursive=True)):
    rel = os.path.relpath(f, RAIZ)
    if rel.split(os.sep)[0] in ('herramientas', 'aventuras-de-rosina', 'img', 'node_modules') or rel in ('404.html', 'offline.html', 'merceria.html', 'rosina.html', '3d-prueba.html', 'baja-recordatorios.html'): continue
    s = open(f, encoding='utf-8').read()
    if 'nav-movil-panel' not in s: continue
    if 'id="encabezado-casa"' in s: comunes.append(ruta(rel)); continue
    m = re.search(r'<html[^>]*data-casa="([^"]*)"', s)
    if m and m.group(1) in casas: casas[m.group(1)].append(ruta(rel))
def menu(pg):
    return pg.evaluate("""() => ({movil: [...document.querySelectorAll('#nav-movil-panel a')].map(a => a.getAttribute('href')).join('|'),
      escritorio: [...document.querySelectorAll('.nav-principal a')].map(a => a.getAttribute('href')).join('|'), casa: document.documentElement.getAttribute('data-casa')})""")
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM)
    pg = b.new_page(viewport={'width': 390, 'height': 844})
    ref = {}
    for c, paginas in casas.items():
        for u in paginas:
            pg.goto(BASE + u); pg.wait_for_timeout(250); m = menu(pg)
            ref.setdefault(c, m)
            v(f'{c}: {u} abre el mismo menú que el resto de la casa', m['movil'] == ref[c]['movil'] and m['escritorio'] == ref[c]['escritorio'])
    for u in comunes:
        for c in casas:
            ctx = b.new_context(viewport={'width': 390, 'height': 844}); q = ctx.new_page()
            q.goto(BASE + u + ('&' if '?' in u else '?') + 'casa=' + c); q.wait_for_timeout(300); m = menu(q)
            v(f'{u}?casa={c} muestra el menú de {c}', m['movil'] == ref[c]['movil'] and m['escritorio'] == ref[c]['escritorio'] and m['casa'] == c)
            ctx.close()
        # sin ?casa= usa la última casa visitada (sessionStorage); sin visita previa, la Tienda
        ctx = b.new_context(viewport={'width': 390, 'height': 844}); q = ctx.new_page()
        q.goto(BASE + u); q.wait_for_timeout(300); m = menu(q)
        v(f'{u} sin visita previa muestra el menú de la Tienda', m['movil'] == ref['crochet']['movil'])
        q.goto(BASE + '/merceria/'); q.wait_for_timeout(200); q.goto(BASE + u); q.wait_for_timeout(300); m = menu(q)
        v(f'{u} después de visitar la Mercería conserva el menú de la Mercería', m['movil'] == ref['merceria']['movil'])
        ctx.close()
    b.close()
print(f'\n{bien} comprobaciones correctas, {mal} con falla.')
sys.exit(1 if mal else 0)
