#!/usr/bin/env python3
"""Genera la cajita de música original de la aventura (melodía propia, sin derechos de terceros).
Uso: python3 herramientas/aventuras-de-rosina/audio/generar_musica.py   (necesita numpy y lameenc)
Salida: aventuras-de-rosina/audio/musica-fondo.mp3 (bucle de ~32 s, suave)."""
import os, numpy as np, lameenc
SR = 32000
RAIZ = os.path.join(os.path.dirname(__file__), '..', '..', '..')
NOTAS = {'C4':261.63,'D4':293.66,'E4':329.63,'F4':349.23,'G4':392.0,'A4':440.0,'C5':523.25,'D5':587.33,'E5':659.25,'G5':783.99,'C3':130.81,'F3':174.61,'G3':196.0,'A3':220.0}
# Compás de 3/4, 90 ppm. Cada compás: (bajo, [notas de melodía en negras]).
BPM = 90; NEG = 60 / BPM
COMPASES = [
 ('C3', ['E5','D5','C5']), ('F3', ['A4','C5','A4']), ('C3', ['G4','E4','G4']), ('G3', ['D5','C5','D4']),
 ('C3', ['E5','G5','E5']), ('F3', ['C5','A4','F4']), ('G3', ['G4','A4','D5']), ('C3', ['C5','E4','C4']),
 ('A3', ['E5','D5','C5']), ('F3', ['A4','G4','A4']), ('C3', ['E4','G4','C5']), ('G3', ['D5','D4','G4']),
 ('C3', ['E5','D5','C5']), ('F3', ['C5','A4','C5']), ('G3', ['D5','G4','B4' if False else 'D5']), ('C3', ['C5','G4','E4']),
]
def campana(f, dur, vol):
    t = np.arange(int(SR * dur)) / SR
    y = (np.sin(2*np.pi*f*t) + .35*np.sin(2*np.pi*f*2.76*t)*np.exp(-t*9) + .2*np.sin(2*np.pi*f*4*t)*np.exp(-t*14)) * np.exp(-t*3.2)
    ataque = np.minimum(1, t / .004)
    return y * ataque * vol
total = int(SR * NEG * 3 * len(COMPASES)) + SR * 2
mix = np.zeros(total)
for i, (bajo, mel) in enumerate(COMPASES):
    base = i * 3 * NEG
    for j, n in enumerate(mel):
        s = int(SR * (base + j * NEG)); y = campana(NOTAS[n], 1.8, .5); mix[s:s+len(y)] += y
    s = int(SR * base); y = campana(NOTAS[bajo], 2.4, .35); mix[s:s+len(y)] += y
largo = int(SR * NEG * 3 * len(COMPASES))
cola = mix[largo:].copy(); mix = mix[:largo]; mix[:len(cola)] += cola[:len(mix)]  # la cola se mezcla al inicio: el bucle no se corta
mix = mix / np.abs(mix).max() * .8
pcm = (mix * 32767).astype('<i2')
e = lameenc.Encoder(); e.set_bit_rate(64); e.set_in_sample_rate(SR); e.set_channels(1); e.set_quality(2)
out = os.path.normpath(os.path.join(RAIZ, 'aventuras-de-rosina', 'audio', 'musica-fondo.mp3'))
open(out, 'wb').write(e.encode(pcm.tobytes()) + e.flush())
print(out, round(os.path.getsize(out)/1024), 'KB', round(largo/SR,1), 's')
