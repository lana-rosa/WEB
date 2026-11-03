"""Íconos de perfil de Rosina para «Mi cuenta» (3-nov-2026): recorta cuadrados de 160 px, como los animalitos de img/agenda/ui/animales/.
Las poses sentadas se usan enteras; las de pie, de la cabeza a la cintura (así la cara se ve grande, como en los animalitos).
Uso: python3 herramientas/agenda-iconos/generar_iconos_rosina.py   (salida: img/agenda/ui/rosina-iconos/<nombre>.webp)"""
import os, sys
from PIL import Image
RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ORIG = os.path.join(RAIZ, 'img/aventuras/rosina-original'); SAL = os.path.join(RAIZ, 'img/agenda/ui/rosina-iconos')
SENTADAS = {'abrazo', 'corazon', 'gorro', 'leyendo', 'tejiendo', 'tejiendo2', 'sueno', 'sueno2'}
ELEGIDAS = ['feliz', 'saludo', 'abrazo', 'tejiendo', 'gorro', 'leyendo', 'gancho', 'celebra', 'corazon', 'risa', 'orgullosa', 'idea', 'ovillo', 'flor', 'lupa', 'diploma']
def icono(nombre, T=160, solo_cara=0.64):
    im = Image.open(os.path.join(ORIG, nombre + '.webp')).convert('RGBA'); bb = im.getchannel('A').point(lambda a: 255 if a > 24 else 0).getbbox(); im = im.crop(bb)
    if nombre not in SENTADAS: im = im.crop((0, 0, im.width, int(im.height * solo_cara)))
    lado = max(im.width, im.height); m = int(lado * 0.06); lienzo = Image.new('RGBA', (lado + 2 * m, lado + 2 * m), (0, 0, 0, 0))
    lienzo.paste(im, ((lienzo.width - im.width) // 2, m + (lado - im.height) // 2 if nombre in SENTADAS else m), im)
    return lienzo.resize((T, T), Image.LANCZOS)
if __name__ == '__main__':
    os.makedirs(SAL, exist_ok=True)
    for n in (sys.argv[1:] or ELEGIDAS): icono(n).save(os.path.join(SAL, n + '.webp'), 'WEBP', quality=88, method=6)
    print('listo:', len(os.listdir(SAL)), 'íconos en', SAL)
