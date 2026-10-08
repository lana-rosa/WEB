"""Genera los íconos de apps para el celular del Rincón de Rosina (img/iconos-app/): 12 íconos × 4 estaciones, PNG de 512 px a sangre
(el celular les pone el borde redondeado), y un ZIP por estación más uno con todos.
Uso: python3 herramientas/iconos-app/generar_iconos_celular.py
Los dibujos son propios y genéricos (sin logos de otras marcas): se usan para cambiar el ícono de cualquier app o acceso directo."""
import os, zipfile, tempfile, shutil
from PIL import Image
from playwright.sync_api import sync_playwright
R = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(R, 'img', 'iconos-app')
ESTACIONES = {   # (color de arriba, color de abajo, brillo)
    'primavera': ('#F9A8CE', '#E96FA7'),
    'verano': ('#FFC46B', '#FF8E6B'),
    'otono': ('#E9A26B', '#B8553F'),
    'invierno': ('#B3BEF7', '#7782DC'),
}
# Dibujos en una cuadrícula de 100 × 100, trazo blanco redondeado
G = {
 'telefono': ('Teléfono', '<path d="M30 22 L41 20 L47 34 L40 40 C44 50 50 56 60 60 L66 53 L80 59 L78 70 C77 76 71 80 65 79 C42 76 24 58 21 35 C20 29 24 24 30 22Z"/>'),
 'mensajes': ('Mensajes', '<path d="M22 30 Q22 22 30 22 L70 22 Q78 22 78 30 L78 56 Q78 64 70 64 L46 64 L32 77 L32 64 L30 64 Q22 64 22 56Z"/><circle cx="38" cy="43" r="2.6" fill="#fff"/><circle cx="50" cy="43" r="2.6" fill="#fff"/><circle cx="62" cy="43" r="2.6" fill="#fff"/>'),
 'camara': ('Cámara', '<path d="M20 36 Q20 30 26 30 L35 30 L40 23 L60 23 L65 30 L74 30 Q80 30 80 36 L80 66 Q80 72 74 72 L26 72 Q20 72 20 66Z"/><circle cx="50" cy="51" r="12"/>'),
 'fotos': ('Fotos', '<rect x="20" y="22" width="60" height="56" rx="10"/><circle cx="38" cy="40" r="5.5"/><path d="M22 68 L40 52 L52 62 L62 52 L78 66"/>'),
 'calendario': ('Calendario', '<rect x="20" y="26" width="60" height="52" rx="9"/><path d="M20 42 L80 42 M36 20 L36 31 M64 20 L64 31"/><path d="M50 71 C41 64 36 60 36 55 C36 51 39 49 42 49 C46 49 48 51 50 53 C52 51 54 49 58 49 C61 49 64 51 64 55 C64 60 59 64 50 71Z" fill="#fff" stroke-width="2.5"/>'),
 'notas': ('Notas', '<path d="M27 20 L73 20 Q79 20 79 26 L79 74 Q79 80 73 80 L27 80 Q21 80 21 74 L21 26 Q21 20 27 20Z"/><path d="M33 38 L67 38 M33 50 L67 50 M33 62 L54 62"/>'),
 'reloj': ('Reloj', '<circle cx="50" cy="50" r="30"/><path d="M50 32 L50 51 L62 58"/>'),
 'musica': ('Música', '<path d="M40 70 L40 30 L72 24 L72 64"/><circle cx="33" cy="71" r="8" fill="#fff"/><circle cx="65" cy="65" r="8" fill="#fff"/>'),
 'mapas': ('Mapas', '<path d="M50 80 C34 62 28 53 28 43 C28 31 38 22 50 22 C62 22 72 31 72 43 C72 53 66 62 50 80Z"/><circle cx="50" cy="43" r="9"/>'),
 'correo': ('Correo', '<rect x="19" y="27" width="62" height="46" rx="9"/><path d="M22 33 L50 54 L78 33"/>'),
 'ajustes': ('Ajustes', '<path d="M24 32 L76 32 M24 50 L76 50 M24 68 L76 68"/><circle cx="40" cy="32" r="7" fill="#fff"/><circle cx="62" cy="50" r="7" fill="#fff"/><circle cx="36" cy="68" r="7" fill="#fff"/>'),
 'lana': ('Lana Rosa', '<circle cx="48" cy="46" r="26"/><path d="M27 34 C40 44 56 44 70 34 M23 48 C38 58 58 58 73 48 M30 64 C42 70 56 68 66 60"/><path d="M62 70 C70 80 80 80 82 72 C84 66 78 64 76 68" />'),
}
def svg(glifo, c1, c2, uid):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="512" height="512">
<defs><linearGradient id="g{uid}" x1="0" y1="0" x2="0.35" y2="1"><stop offset="0" stop-color="{c1}"/><stop offset="1" stop-color="{c2}"/></linearGradient></defs>
<rect width="100" height="100" fill="url(#g{uid})"/>
<circle cx="86" cy="10" r="30" fill="#fff" opacity=".13"/><circle cx="8" cy="98" r="24" fill="#fff" opacity=".1"/>
<g fill="none" stroke="#fff" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round" style="filter:drop-shadow(0 1.6px 1.4px rgba(60,30,40,.28))">{glifo}</g></svg>'''
os.makedirs(OUT, exist_ok=True)
tmp = tempfile.mkdtemp()
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/opt/pw-browsers/chromium')
    pg = b.new_page(viewport={'width': 512, 'height': 512})
    for est, (c1, c2) in ESTACIONES.items():
        for k, (nombre, glifo) in G.items():
            pg.set_content('<body style="margin:0">' + svg(glifo, c1, c2, k) + '</body>')
            ruta = os.path.join(OUT, f'icono-{est}-{k}.png')
            pg.screenshot(path=ruta, clip={'x': 0, 'y': 0, 'width': 512, 'height': 512})
            Image.open(ruta).convert('RGB').quantize(256, dither=Image.FLOYDSTEINBERG).save(ruta, optimize=True)   # 256 colores: el degradado se ve igual y pesa 10 veces menos
    b.close()
todos = zipfile.ZipFile(os.path.join(OUT, 'iconos-rosina-todos.zip'), 'w', zipfile.ZIP_DEFLATED)
for est in ESTACIONES:
    z = zipfile.ZipFile(os.path.join(OUT, f'iconos-rosina-{est}.zip'), 'w', zipfile.ZIP_DEFLATED)
    for k, (nombre, _) in G.items():
        f = os.path.join(OUT, f'icono-{est}-{k}.png')
        z.write(f, f'{est}/{nombre}.png'); todos.write(f, f'{est}/{nombre}.png')
    z.close()
todos.close()
print('ok', len(os.listdir(OUT)), 'archivos')
