#!/usr/bin/env python3
"""Reconstruye aventuras-de-rosina/audio/indice.json a partir de los archivos <clave>.mp3 que haya en esa carpeta y avisa qué falta.
El libro solo reproduce los audios listados en el índice; lo que no tiene audio se lee con la voz del dispositivo.
Uso: python3 herramientas/aventuras-de-rosina/audio/actualizar_indice.py"""
import json, os, re, sys

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.abspath(os.path.join(AQUI, '..', '..', '..'))
CARPETA = os.path.join(RAIZ, 'aventuras-de-rosina', 'audio')


def main():
    guion = json.load(open(os.path.join(AQUI, 'guion-audio.json'), encoding='utf-8'))
    claves = {f['clave']: f for f in guion}
    hay = sorted(m.group(1) for n in os.listdir(CARPETA) if (m := re.fullmatch(r'([0-9a-f]{8})\.mp3', n)))
    extra = [c for c in hay if c not in claves]
    faltan = [f for c, f in claves.items() if c not in hay]
    json.dump({c: 1 for c in hay}, open(os.path.join(CARPETA, 'indice.json'), 'w'), indent=0)
    print('Audios en el índice: %d de %d textos del guion.' % (len(hay) - len(extra), len(claves)))
    if extra:
        print('Archivos que no corresponden a ningún texto actual (¿cambió el texto?):', ', '.join(extra))
    for f in faltan[:60]:
        print('  falta', f['clave'], '·', f['lugar'], '·', f['texto'][:70])
    if len(faltan) > 60:
        print('  … y %d más' % (len(faltan) - 60))


if __name__ == '__main__':
    sys.exit(main())
