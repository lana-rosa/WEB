#!/usr/bin/env python3
"""Fondos de pantalla de la agenda en estilo «doodle» (31-oct-2026, pedido de Jennifer: algo moderno como el fondo de WhatsApp/Telegram).
Genera en img/agenda/fondos/ baldosas SVG que se repiten: dibujos de crochet en línea fina (rosa, lila, azul), puntos y cuadrícula.
Uso: python3 herramientas/generar_fondos_doodle.py"""
import os
RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'img', 'agenda', 'fondos')
F = {  # dibujos en una cuadrícula de 24 x 24 (solo línea)
 'corazon': 'M12 20.5s-8-4.8-8-10.5a4.4 4.4 0 018-2.4A4.4 4.4 0 0120 10c0 5.7-8 10.5-8 10.5z',
 'estrella': 'M12 3l2.6 5.6 6.1.8-4.4 4.2 1.1 6L12 16.7 6.6 19.600l1.1-6L3.300 9.400l6.100-.8z',
 'ovillo': 'M12 4a8 8 0 100 16 8 8 0 000-16zM5 9.500c4 1.200 9 1.200 14 0M4.500 14.500c5 1.500 10 1.500 15 0M9.500 4.500c-1.200 5 0 10 3 15M19 17c2 .8 3 2.600 1.500 4',
 'gancho': 'M4 21L16.500 6.500M16.500 6.500c1.400-2 4.200-1.500 4.200.6 0 1.600-1.800 2.200-3 1.200',
 'flor': 'M12 9.500a2.500 2.500 0 100 5 2.500 2.500 0 000-5zM12 3.500a3 3 0 010 6M12 14.500a3 3 0 010 6M3.500 12a3 3 0 016 0M14.500 12a3 3 0 016 0',
 'tijeras': 'M7 4.500a2.500 2.500 0 100 5 2.500 2.500 0 000-5zM7 14.500a2.500 2.500 0 100 5 2.500 2.500 0 000-5zM9 9l12 8.500M9 15L21 6.500',
 'nube': 'M7 18a4 4 0 010-8 5.500 5.500 0 0110.500 1A3.500 3.500 0 0117 18H7z',
 'destello': 'M12 3v18M3 12h18M6 6l12 12M18 6L6 18',
 'agujas': 'M5 4l14 14M19 4L5 18M3.500 3.500a1 1 0 100 .01M20.500 3.500a1 1 0 100 .01',
 'lazo': 'M12 12c-3-5-8-5-8-2s5 4 8 2zM12 12c3-5 8-5 8-2s-5 4-8 2zM12 12l-3 8M12 12l3 8',
 'luna': 'M20 14.500A8.500 8.500 0 019.500 4 8.500 8.500 0 1020 14.500z',
 'cinta': 'M3 9h18v6H3zM7 9v3M11 9v2M15 9v3M19 9v2',
}
# (dibujo, x, y, tamaño, giro) en una baldosa de 320 x 320
POS = [('ovillo', 28, 30, 38, -12), ('corazon', 120, 18, 28, 14), ('gancho', 200, 36, 40, 8), ('estrella', 280, 22, 26, -10),
       ('flor', 14, 112, 32, 0), ('tijeras', 96, 100, 34, -18), ('nube', 178, 112, 36, 6), ('destello', 262, 108, 24, 0),
       ('luna', 36, 196, 28, 10), ('agujas', 112, 190, 34, 0), ('lazo', 196, 196, 34, -8), ('corazon', 276, 190, 24, 12),
       ('cinta', 18, 268, 36, -6), ('estrella', 104, 276, 24, 14), ('ovillo', 176, 270, 34, 16), ('flor', 258, 270, 30, -8)]
def doodle(nombre, fondo, trazo):
    g = []
    for d, x, y, s, r in POS:
        k = s / 24.0
        g.append('<g transform="translate(%s %s) rotate(%s %s %s) scale(%.3f)"><path d="%s"/></g>' % (x, y, r, 12 * k, 12 * k, k, F[d]))
    svg = ('<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320"><rect width="320" height="320" fill="%s"/>'
           '<g fill="none" stroke="%s" stroke-width="%.2f" stroke-linecap="round" stroke-linejoin="round">%s</g></svg>') % (fondo, trazo, 1.7, ''.join(g))
    open(os.path.join(RAIZ, nombre + '.svg'), 'w').write(svg)
def puntos(nombre, fondo, punto):
    svg = '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><rect width="28" height="28" fill="%s"/><circle cx="14" cy="14" r="1.5" fill="%s"/></svg>' % (fondo, punto)
    open(os.path.join(RAIZ, nombre + '.svg'), 'w').write(svg)
def cuadricula(nombre, fondo, linea):
    svg = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect width="32" height="32" fill="%s"/><path d="M0 .5H32M.5 0V32" stroke="%s" stroke-width="1" fill="none"/></svg>' % (fondo, linea)
    open(os.path.join(RAIZ, nombre + '.svg'), 'w').write(svg)
os.makedirs(RAIZ, exist_ok=True)
doodle('doodle-rosa', '#FFF1F7', '#F4A9C9'); doodle('doodle-lila', '#F4F4FF', '#B4B8FA'); doodle('doodle-azul', '#EFF7FF', '#98C9F5')
puntos('puntos', '#FFF6F9', '#F0B3CE'); cuadricula('cuadricula', '#FFF8FB', '#F7D3E3')
print('listo')
