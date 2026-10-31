# -*- coding: utf-8 -*-
"""Genera js/agenda/i18n/en.js y pt.js a partir de datos_*.py (cada uno con FILAS = [(español, inglés, portugués), …]).
Uso: python3 herramientas/agenda-idiomas/generar.py     También escribe REVISION.tsv (tres columnas) para que alguien que hable el idioma lo lea."""
import glob, importlib.util, json, os, sys
aqui = os.path.dirname(os.path.abspath(__file__)); raiz = os.path.dirname(os.path.dirname(aqui))
import re
# Textos largos que el código arma en JavaScript: una fila puede empezar con «~» y un comienzo del texto; se busca el texto completo en los .js y en el HTML
_lit = re.compile(r"'((?:[^'\\\n]|\\.)*)'|\"((?:[^\"\\\n]|\\.)*)\"")
_fuentes = []
for _f in glob.glob(os.path.join(raiz, 'js', 'agenda', '*.js')) + [os.path.join(raiz, 'agenda-rosina.html')]:
    for _m in _lit.finditer(open(_f, encoding='utf-8').read()):
        _t = (_m.group(1) if _m.group(1) is not None else _m.group(2)).replace("\\'", "'").replace('\\n', '\n')
        if len(_t) > 12: _fuentes.append(' '.join(_t.split()))
def resolver(es):
    if not es.startswith('~'): return es
    ini = ' '.join(es[1:].split()); hallados = sorted({t for t in _fuentes if t.startswith(ini)})
    if len(hallados) != 1: print('AVISO: «%s…» coincide con %d textos' % (ini[:50], len(hallados)), file=sys.stderr); return hallados[0] if hallados else ini
    return hallados[0]
en, pt, filas, vistos = {}, {}, [], {}
for f in sorted(glob.glob(os.path.join(aqui, 'datos_*.py'))):
    spec = importlib.util.spec_from_file_location(os.path.basename(f)[:-3], f); m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
    for es, e, p in m.FILAS:
        k = ' '.join(resolver(es).split())
        if k in vistos and vistos[k] != (e, p): print('AVISO: clave repetida con otra traducción:', k[:70], file=sys.stderr)
        vistos[k] = (e, p); en[k] = e; pt[k] = p; filas.append((k, e, p))
for idioma, d in (('en', en), ('pt', pt)):
    with open(os.path.join(raiz, 'js', 'agenda', 'i18n', idioma + '.js'), 'w', encoding='utf-8') as o:
        o.write("/* Diccionario %s de la Agenda (lo genera herramientas/agenda-idiomas/generar.py; no editar a mano). */\nwindow.lrI18n.add(%s, %s);\n" % (idioma.upper(), json.dumps(idioma), json.dumps(d, ensure_ascii=False, indent=0)))
with open(os.path.join(aqui, 'REVISION.tsv'), 'w', encoding='utf-8') as o:
    o.write('español\tinglés\tportugués\n'); [o.write('\t'.join(c.replace('\t', ' ').replace('\n', ' ') for c in fila) + '\n') for fila in filas]
print('%d textos' % len(filas))
