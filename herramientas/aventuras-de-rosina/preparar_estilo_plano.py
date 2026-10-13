#!/usr/bin/env python3
"""Prepara las poses de Luna, Tito, Pipo y Bruno en estilo ilustración plana (como la Rosina oficial) para la aventura.
Uso: python3 herramientas/aventuras-de-rosina/preparar_estilo_plano.py <hoja-pipo-tito.webp|-> <hoja-bruno-luna.webp|->
  Cada hoja: 10 poses en 2 filas (5 por personaje), fondo blanco liso y espacio entre poses (hojas de Sara del 12-oct-2026).
  Hoja 1 vigente (3.ª ronda, 12-oct-2026): fila 1 Tito (caparazón tejido, lentes coral), fila 2 Pipo (ponchito de rayas). Hoja 2: fila 1 Bruno, fila 2 Luna. Con «-» se omite esa hoja (solo se reemplazan los personajes de la otra).
  Hoja 2 vigente (3.ª ronda de Sara, 12-oct-2026): Bruno con gorro de lana azul con pompón y sin corazón; Luna lila con orejas
  desiguales y bufanda lila (rediseño para no parecerse a personajes existentes).
  Después de correrlo hay que actualizar POSES_PLANO (medidas) en contenido/personajes.js: ver actualizar_medidas() más abajo.
Salida: img/aventuras/plano/<personaje>-<pose>.webp (transparente, lado mayor 512 px). Las hojas originales no se guardan en el repositorio
hasta confirmar el origen y la licencia de las imágenes."""
import sys, os, tempfile, shutil
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import recortar_poses as R
RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
# (hoja, posiciones 1..n en orden de lectura) -> nombres de pose
PLAN = {
    'tito':  (0, [1, 2, 3, 4, 5],    ['saludo', 'descansa', 'lee', 'piensa', 'celebra']),
    'pipo':  (0, [6, 7, 8, 9, 10],   ['saludo', 'corazon', 'piensa', 'animo', 'ovillo']),
    'bruno': (1, [1, 2, 3, 4, 5],    ['saludo', 'regalo', 'piensa', 'descansa', 'celebra']),
    'luna':  (1, [6, 7, 8, 9, 10],   ['saludo', 'flor', 'piensa', 'descansa', 'celebra']),
}
def actualizar_medidas(salida):
    """Reescribe POSES_PLANO (ancho, alto de cada pose) en contenido/personajes.js según los archivos que hay en la carpeta."""
    import json, re
    from PIL import Image
    medidas = {}
    for f in sorted(os.listdir(salida)):
        if not f.endswith('.webp'): continue
        nombre, pose = f[:-5].split('-', 1)
        medidas.setdefault(nombre, {})[pose] = list(Image.open(os.path.join(salida, f)).size)
    ruta = os.path.join(RAIZ, 'aventuras-de-rosina', 'contenido', 'personajes.js')
    txt = open(ruta, encoding='utf-8').read()
    nuevo = 'export const POSES_PLANO = ' + json.dumps(medidas, sort_keys=True) + ';'
    txt2 = re.sub(r'export const POSES_PLANO = \{.*?\};', lambda m: nuevo, txt, count=1, flags=re.S)
    assert txt2 != txt or nuevo in txt, 'no se encontró POSES_PLANO'
    open(ruta, 'w', encoding='utf-8').write(txt2)

def main(hojas):
    tmp = tempfile.mkdtemp()
    carpetas = []
    for i, h in enumerate(hojas):
        if h == '-': carpetas.append(None); continue
        d = os.path.join(tmp, f'h{i}'); R.main(h, d); carpetas.append(d)
    salida = os.path.join(RAIZ, 'img', 'aventuras', 'plano'); os.makedirs(salida, exist_ok=True)
    for nombre, (hoja, idx, poses) in PLAN.items():
        if carpetas[hoja] is None: continue
        for k, pose in zip(idx, poses):
            shutil.copy(os.path.join(carpetas[hoja], f'pose-{k:02d}.webp'), os.path.join(salida, f'{nombre}-{pose}.webp'))
    shutil.rmtree(tmp)
    actualizar_medidas(salida)
    for f in sorted(os.listdir(salida)): print(f, os.path.getsize(os.path.join(salida, f)) // 1024, 'KB')
if __name__ == '__main__':
    main(sys.argv[1:3])
