#!/usr/bin/env python3
"""Extrae el texto visible de cada página del sitio (sin scripts, estilos ni JSON-LD) a una carpeta, un .txt por página.

    python3 herramientas/auditoria-360/scripts/extraer_texto.py <carpeta_salida>

Sirve para la revisión editorial (ortografía, términos) y la matriz de coherencia comercial. Solo lectura.
"""
import os, re, sys, glob
from html.parser import HTMLParser
RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
OMITIR = {'script', 'style', 'noscript', 'svg', 'template', 'head'}

class P(HTMLParser):
    def __init__(s):
        super().__init__(convert_charrefs=True); s.o = []; s.pila = []
    def handle_starttag(s, t, a):
        if t in OMITIR: s.pila.append(t)
        elif t in ('br', 'p', 'li', 'h1', 'h2', 'h3', 'h4', 'div', 'tr', 'section', 'details', 'summary', 'button', 'a', 'label'): s.o.append('\n')
        d = dict(a)
        for k in ('alt', 'aria-label', 'placeholder', 'title'):
            if d.get(k) and not s.pila: s.o.append(f' [{k}: {d[k]}] ')
    def handle_endtag(s, t):
        if s.pila and s.pila[-1] == t: s.pila.pop()
    def handle_data(s, d):
        if not s.pila: s.o.append(d)

def main(sal):
    os.makedirs(sal, exist_ok=True)
    n = 0
    for f in sorted(glob.glob(os.path.join(RAIZ, '**', '*.html'), recursive=True)):
        rel = os.path.relpath(f, RAIZ).replace(os.sep, '/')
        if rel.startswith(('herramientas/', 'node_modules/', '.github/', '.tmp/')): continue
        p = P(); p.feed(open(f, encoding='utf-8').read())
        t = re.sub(r'\n\s*\n+', '\n', re.sub(r'[ \t]+', ' ', ''.join(p.o))).strip()
        open(os.path.join(sal, re.sub(r'[^A-Za-z0-9._-]+', '_', rel) + '.txt'), 'w', encoding='utf-8').write(f'# {rel}\n{t}\n'); n += 1
    print(n, 'páginas')
main(sys.argv[1])
