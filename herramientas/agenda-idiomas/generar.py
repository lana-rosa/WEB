# -*- coding: utf-8 -*-
"""Genera js/agenda/i18n/en.js y pt.js a partir de datos_*.py (cada uno con FILAS = [(español, inglés, portugués), …]).
Uso: python3 herramientas/agenda-idiomas/generar.py     También escribe REVISION.tsv (tres columnas) para que alguien que hable el idioma lo lea."""
import glob, importlib.util, json, os, sys
aqui = os.path.dirname(os.path.abspath(__file__)); raiz = os.path.dirname(os.path.dirname(aqui))
en, pt, filas, vistos = {}, {}, [], {}
for f in sorted(glob.glob(os.path.join(aqui, 'datos_*.py'))):
    spec = importlib.util.spec_from_file_location(os.path.basename(f)[:-3], f); m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
    for es, e, p in m.FILAS:
        k = ' '.join(es.split())
        if k in vistos and vistos[k] != (e, p): print('AVISO: clave repetida con otra traducción:', k[:70], file=sys.stderr)
        vistos[k] = (e, p); en[k] = e; pt[k] = p; filas.append((k, e, p))
for idioma, d in (('en', en), ('pt', pt)):
    with open(os.path.join(raiz, 'js', 'agenda', 'i18n', idioma + '.js'), 'w', encoding='utf-8') as o:
        o.write("/* Diccionario %s de la Agenda (lo genera herramientas/agenda-idiomas/generar.py; no editar a mano). */\nwindow.lrI18n.add(%s, %s);\n" % (idioma.upper(), json.dumps(idioma), json.dumps(d, ensure_ascii=False, indent=0)))
with open(os.path.join(aqui, 'REVISION.tsv'), 'w', encoding='utf-8') as o:
    o.write('español\tinglés\tportugués\n'); [o.write('\t'.join(c.replace('\t', ' ').replace('\n', ' ') for c in fila) + '\n') for fila in filas]
print('%d textos' % len(filas))
