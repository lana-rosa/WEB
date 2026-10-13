#!/usr/bin/env python3
"""Prepara las poses NUEVAS de Rosina para la aventura (hoja de Sara del 12-oct-2026, hecha con ChatGPT a partir de los stickers oficiales).
Uso: python3 herramientas/aventuras-de-rosina/preparar_rosina_poses.py <hoja-rosina.webp>
  Hoja: 10 poses en 2 filas de 5 con fondo blanco liso, sin borde de sticker. Orden de lectura (POSES abajo).
  1) recorta cada pose con recortar_poses.py (fondo transparente);
  2) le agrega el borde de sticker de las imágenes oficiales (≈14 px de blanco y un contorno gris fino y translúcido, medidos en
     img/stickers/rosina-01-saludo.webp) para que no se note la diferencia;
  3) la ajusta a un lienzo de 512×512 como los stickers oficiales (misma caja: x 74–437, y 22–489), así encaja en los mismos tamaños y estilos.
Salida: img/aventuras/rosina/<pose>.webp (512×512, transparente). Las hojas originales no se guardan en el repositorio.
Los stickers oficiales de img/stickers/ NO se tocan: estas son poses adicionales."""
import sys, os, tempfile, shutil
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
import recortar_poses as R
RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
POSES = ['tejiendo', 'gancho', 'contando', 'senalando', 'fuerza', 'sorpresa', 'consuelo', 'mapa', 'diploma', 'lupa']
BLANCO, GRIS = 14, 4                       # px de borde blanco y de contorno gris (en el lienzo final de 512)
CAJA_ANCHO, CAJA_ALTO, CENTRO_Y = 440, 467, 255.5   # caja de los stickers oficiales (figura + borde)

def disco(r):
    y, x = np.ogrid[-r:r + 1, -r:r + 1]
    return x * x + y * y <= r * r

def con_borde(img):
    """Devuelve la pose centrada en un lienzo 512×512 con borde de sticker."""
    img = img.convert('RGBA')
    margen = BLANCO + GRIS
    # escalar para que figura + borde entren en la caja oficial
    max_w, max_h = CAJA_ANCHO - 2 * margen, CAJA_ALTO - 2 * margen
    esc = min(max_w / img.width, max_h / img.height)
    img = img.resize((max(1, round(img.width * esc)), max(1, round(img.height * esc))), Image.LANCZOS)
    pad = margen + 6
    lienzo = Image.new('RGBA', (img.width + 2 * pad, img.height + 2 * pad), (0, 0, 0, 0)); lienzo.paste(img, (pad, pad), img)
    a = np.array(lienzo).astype(np.float32)
    figura = a[:, :, 3] > 40
    cerrada = ndi.binary_closing(np.pad(figura, 12), structure=disco(7))[12:-12, 12:-12]   # tapa huecos pequeños (entre brazo y cuerpo)
    cerrada = ndi.binary_fill_holes(cerrada)
    blanco = ndi.binary_dilation(cerrada, structure=disco(BLANCO))
    contorno = ndi.binary_dilation(cerrada, structure=disco(margen))
    suave = lambda m: ndi.gaussian_filter(m.astype(np.float32), 0.9)
    h, w = figura.shape
    salida = np.zeros((h, w, 4), np.float32)
    # contorno gris translúcido
    al_c = suave(contorno) * 0.43
    salida[:, :, :3] = np.array([146, 136, 140], np.float32); salida[:, :, 3] = al_c
    # borde blanco encima
    al_b = suave(blanco)
    for c in range(3): salida[:, :, c] = salida[:, :, c] * (1 - al_b) + 255 * al_b
    salida[:, :, 3] = al_b + salida[:, :, 3] * (1 - al_b)
    # la figura encima de todo
    al_f = a[:, :, 3] / 255.0
    for c in range(3): salida[:, :, c] = a[:, :, c] * al_f + salida[:, :, c] * (1 - al_f)
    salida[:, :, 3] = np.maximum(salida[:, :, 3], al_f * 255) if salida[:, :, 3].max() > 1.5 else salida[:, :, 3]
    salida[:, :, 3] = np.clip(salida[:, :, 3] * (255 if salida[:, :, 3].max() <= 1.5 else 1), 0, 255)
    pegado = Image.fromarray(salida.astype(np.uint8), 'RGBA')
    ys, xs = np.where(np.array(pegado)[:, :, 3] > 20)
    pegado = pegado.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    final = Image.new('RGBA', (512, 512), (0, 0, 0, 0))
    final.paste(pegado, (round(256 - pegado.width / 2), round(CENTRO_Y - pegado.height / 2)), pegado)
    return final

def main(hoja):
    tmp = tempfile.mkdtemp(); R.main(hoja, tmp)
    salida = os.path.join(RAIZ, 'img', 'aventuras', 'rosina'); os.makedirs(salida, exist_ok=True)
    for k, nombre in enumerate(POSES, 1):
        im = Image.open(os.path.join(tmp, f'pose-{k:02d}.webp'))
        con_borde(im).save(os.path.join(salida, nombre + '.webp'), 'WEBP', quality=88, method=6)
    shutil.rmtree(tmp)
    for f in sorted(os.listdir(salida)): print(f, os.path.getsize(os.path.join(salida, f)) // 1024, 'KB')

if __name__ == '__main__':
    main(sys.argv[1])
