"""Genera los TEMAS del Rincón de Rosina: por cada fondo de pantalla, 12 íconos de apps con sus colores (img/iconos-app/), un ZIP por tema,
la vista previa de la pantalla de inicio con esos íconos sobre el fondo (img/temas/inicio-<tema>.webp) y las tarjetas de
recursos-rosina.html (entre <!-- temas:inicio --> y <!-- temas:fin -->).
Antes hay que tener los fondos: python3 herramientas/fondos/generar_fondos.py
Uso: python3 herramientas/iconos-app/generar_temas.py [tema ...]     (sin argumentos: todos)
Los temas (estación, frase, colores de los íconos) están en temas_datos.py; los dibujos de los íconos, en glifos.py."""
import os, sys, zipfile, tempfile, shutil, html
from PIL import Image
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from temas_datos import TEMAS
from glifos import G
R = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(R, 'img', 'iconos-app')
PREV = os.path.join(R, 'img', 'temas')
PX = 384   # lado del PNG (el celular lo redondea); con 256 colores el degradado se ve igual y pesa poco
ORDEN = list(G)
CUADRICULA = ['fotos', 'calendario', 'notas', 'reloj', 'musica', 'mapas', 'ajustes', 'lana']   # 2 filas de 4
DOCK = ['telefono', 'mensajes', 'camara', 'correo']


def svg(glifo, c1, c2, uid):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="{PX}" height="{PX}">
<defs><linearGradient id="g{uid}" x1="0" y1="0" x2="0.35" y2="1"><stop offset="0" stop-color="{c1}"/><stop offset="1" stop-color="{c2}"/></linearGradient></defs>
<rect width="100" height="100" fill="url(#g{uid})"/>
<circle cx="86" cy="10" r="30" fill="#fff" opacity=".13"/><circle cx="8" cy="98" r="24" fill="#fff" opacity=".1"/>
<g fill="none" stroke="#fff" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round" style="filter:drop-shadow(0 1.6px 1.4px rgba(60,30,40,.28))">{glifo}</g></svg>'''


def oscuro(c, f=0.5):
    n = [int(c[i:i + 2], 16) for i in (1, 3, 5)]
    return '#%02x%02x%02x' % tuple(int(x * f) for x in n)


def previa_html(tema, fondo_url, c2):
    oscuro_sobre_claro = tema != 'fucsia'   # los fondos claros llevan el nombre de la app en un tono oscuro del mismo color
    txt = oscuro(c2, .62) if oscuro_sobre_claro else '#fff'
    sombra = '0 1px 3px rgba(255,255,255,.6)' if oscuro_sobre_claro else '0 2px 8px rgba(0,0,0,.45)'
    def ic(k):
        return f'<img src="file://{OUT}/icono-{tema}-{k}.png">'
    cel = ''.join(f'<div class="a">{ic(k)}<span>{G[k][0]}</span></div>' for k in CUADRICULA)
    dock = ''.join(f'<div class="a">{ic(k)}</div>' for k in DOCK)
    return f'''<!doctype html><meta charset="utf-8"><style>
body{{margin:0;width:1080px;height:2340px;background:url("{fondo_url}") 0 0/100% 100%;position:relative;font-family:Arial,Helvetica,sans-serif}}
.g{{position:absolute;left:0;right:0;top:250px;display:grid;grid-template-columns:repeat(4,1fr);row-gap:48px}}
.a{{display:flex;flex-direction:column;align-items:center;gap:14px}}
.a img{{width:176px;height:176px;border-radius:40px;box-shadow:0 8px 22px rgba(40,20,30,.25)}}
.a span{{color:{txt};font-size:34px;font-weight:700;text-shadow:{sombra}}}
.d{{position:absolute;left:50px;right:50px;bottom:70px;height:240px;border-radius:80px;background:rgba(255,255,255,.66);display:grid;grid-template-columns:repeat(4,1fr);align-items:center;justify-items:center}}
</style><div class="g">{cel}</div><div class="d">{dock}</div>'''


def tarjetas():
    out = []
    for t, est, frase, _, desc in TEMAS:
        iconos = ''.join(
            f'<a href="/img/iconos-app/icono-{t}-{k}.png" download="icono-rosina-{t}-{k}.png"><img src="/img/iconos-app/icono-{t}-{k}.png" '
            f'alt="Ícono de {G[k][0].lower()}, tema {html.escape(frase)}" loading="lazy" width="56" height="56"></a>' for k in ORDEN)
        out.append(f'''        <article class="tema" data-fondo="{t}" data-estacion="{est}">
          <div class="tema-previa">
            <figure><img src="/img/fondos/mini-{t}.webp" alt="Fondo de pantalla {html.escape(desc)}: {html.escape(frase)}" loading="lazy" width="300" height="650"><figcaption>Fondo</figcaption></figure>
            <figure><img src="/img/temas/inicio-{t}.webp" alt="Pantalla de inicio con los íconos del tema {html.escape(frase)}" loading="lazy" width="300" height="650"><figcaption>Con íconos</figcaption></figure>
          </div>
          <h3>{html.escape(frase)}</h3>
          <div class="tema-botones no-imprimir">
            <a class="boton-primario boton-chico" data-fondo-link href="/img/fondos/fondo-rosina-{t}-samsung.jpg" download>⬇ Fondo</a>
            <a class="boton-secundario boton-chico" href="/img/iconos-app/iconos-rosina-{t}.zip" download>⬇ Íconos (ZIP)</a>
          </div>
          <details class="tema-iconos no-imprimir"><summary>Ver y guardar los íconos uno por uno</summary><div class="tema-iconos-grilla">{iconos}</div></details>
        </article>''')
    return '\n'.join(out)


lista = sys.argv[1:] or [t[0] for t in TEMAS]
os.makedirs(OUT, exist_ok=True)
os.makedirs(PREV, exist_ok=True)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/opt/pw-browsers/chromium', args=['--allow-file-access-from-files'])
    pg = b.new_page(viewport={'width': PX, 'height': PX})
    for t, est, frase, (c1, c2), _ in TEMAS:
        if t not in lista:
            continue
        for k in ORDEN:
            pg.set_content('<body style="margin:0">' + svg(G[k][1], c1, c2, k) + '</body>')
            ruta = os.path.join(OUT, f'icono-{t}-{k}.png')
            pg.screenshot(path=ruta, clip={'x': 0, 'y': 0, 'width': PX, 'height': PX})
            Image.open(ruta).convert('RGB').quantize(256, dither=Image.FLOYDSTEINBERG).save(ruta, optimize=True)
        with zipfile.ZipFile(os.path.join(OUT, f'iconos-rosina-{t}.zip'), 'w', zipfile.ZIP_DEFLATED) as z:
            for k in ORDEN:
                z.write(os.path.join(OUT, f'icono-{t}-{k}.png'), f'{frase}/{G[k][0]}.png')
    pv = b.new_page(viewport={'width': 1080, 'height': 2340})
    tmp = tempfile.mkdtemp()
    for t, _e, _f, (_c1, c2), _d in TEMAS:
        if t not in lista:
            continue
        ruta = os.path.join(tmp, f'{t}.html')
        open(ruta, 'w').write(previa_html(t, 'file://' + os.path.join(R, 'img', 'fondos', f'fondo-rosina-{t}-samsung.jpg'), c2))
        pv.goto('file://' + ruta)
        pv.wait_for_function('[...document.images].every(i=>i.complete&&i.naturalWidth>0)')
        png = os.path.join(tmp, f'{t}.png')
        pv.screenshot(path=png)
        Image.open(png).convert('RGB').resize((300, 650), Image.LANCZOS).save(os.path.join(PREV, f'inicio-{t}.webp'), quality=82)
    shutil.rmtree(tmp)
    b.close()
pagina = os.path.join(R, 'recursos-rosina.html')
s = open(pagina, encoding='utf-8').read()
a, z = '<!-- temas:inicio -->', '<!-- temas:fin -->'
if a in s:
    s = s[:s.index(a) + len(a)] + '\n' + tarjetas() + '\n        ' + s[s.index(z):]
    open(pagina, 'w', encoding='utf-8').write(s)
print('ok', lista)
