#!/usr/bin/env python3
"""Pone en sitemap.xml la fecha <lastmod> real de cada página (SEO-02).

Fecha = hoy si el archivo tiene cambios sin confirmar; si no, la del último commit que lo tocó.
Las páginas de la Revista las maneja generar_revista.py (fecha de publicación o «actualizado»): no se tocan aquí.
Uso: python3 herramientas/actualizar_lastmod.py   (correr antes de confirmar, después de los generadores)
"""
import datetime, os, re, subprocess

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITIO = 'https://lanarosacrochet.com'
HOY = datetime.date.today().isoformat()

def git(*a):
    return subprocess.run(['git', *a], cwd=RAIZ, capture_output=True, text=True).stdout.strip()

def archivo(loc):
    ruta = loc[len(SITIO):].lstrip('/')
    if ruta == '' : return 'index.html'
    if ruta.endswith('/'): return ruta + 'index.html'
    return ruta

modificados = {l[3:].strip() for l in git('status', '--porcelain').splitlines()}
sm_path = os.path.join(RAIZ, 'sitemap.xml')
sm = open(sm_path, encoding='utf-8').read()

def cambia(m):
    loc = m.group(1)
    if '/revista/' in loc: return m.group(0)
    f = archivo(loc)
    if not os.path.exists(os.path.join(RAIZ, f)): return m.group(0)
    fecha = HOY if f in modificados else (git('log', '-1', '--format=%cs', '--', f) or HOY)
    return re.sub(r'<lastmod>[^<]*</lastmod>', f'<lastmod>{fecha}</lastmod>', m.group(0))

nuevo = re.sub(r'<url>\s*<loc>([^<]*)</loc>.*?</url>', cambia, sm, flags=re.S)
open(sm_path, 'w', encoding='utf-8').write(nuevo)
print('sitemap.xml actualizado')
