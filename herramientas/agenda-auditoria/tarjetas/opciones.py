"""E25 (4-nov-2026): opciones de color y contraste para las tarjetas de la agenda. Inyecta CSS sobre la página real (no cambia la agenda) y toma capturas de 390 px.
Uso: PYTHONPATH=<carpeta con sitecustomize si hace falta> python3 herramientas/agenda-auditoria/tarjetas/opciones.py"""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'pruebas'))
from agenda_util import *
from PIL import Image, ImageDraw, ImageFont
SAL = os.path.dirname(os.path.abspath(__file__))
TINTE = ['#FBE4EF', '#E6E7FD', '#DCEEFE', '#FFE8D6', '#DDF3E6']          # rosa, lila, azul acero, durazno, menta
BORDE = ['#C81B6D', '#4B4FB8', '#1F6FDB', '#B4551A', '#2F7A52']          # borde/ícono en tono más oscuro de cada uno
def ciclo(sel, i): return '%s:nth-child(5n+%d) { background: %s !important; border-color: %s !important; }' % (sel, i + 1, TINTE[i], BORDE[i])
OPC = {
 'actual': '',
 'A-color-de-la-seccion': """
  #agenda .vs-hoja, #agenda .pn-card { background: var(--sec-bg) !important; border: 2px solid var(--sec-fg) !important; border-left-width: 8px !important; box-shadow: 0 3px 0 var(--sec-fg) !important; }
  #agenda .vs-hoja b, #agenda .pn-card h4 { color: #2B2B30 !important; } #agenda .vs-hoja small { color: #3f3f46 !important; }
  #agenda .vs-ic { background: #fff !important; color: var(--sec-fg) !important; box-shadow: 0 0 0 2px var(--sec-fg) !important; }
  #agenda .vs-cab { background: var(--sec-fg) !important; border-radius: 20px; } #agenda .vs-cab h2, #agenda .vs-cab p { color: #fff !important; }
""",
 'B-colores-de-la-paleta': ''.join(ciclo('#agenda .vs-hoja', i) for i in range(5)) + """
  #agenda .vs-hoja, #agenda .pn-card { border: 2px solid #E74E96; border-radius: 20px !important; box-shadow: 0 4px 10px rgba(59,42,51,.14) !important; }
  #agenda .vs-hoja b, #agenda .pn-card h4 { color: #3b2a33 !important; } #agenda .vs-hoja small { color: #4a3b43 !important; }
  #agenda .vs-ic { background: #fff !important; box-shadow: 0 0 0 2px rgba(59,42,51,.25) !important; }
  #agenda .pn-card { background: #fff !important; }
""",
 'C-contraste-fuerte': """
  body, #agenda { background: #F4DDE8 !important; } #agenda .agenda-layout, .agenda-layout { background: transparent !important; }
  #agenda .vs-hoja, #agenda .pn-card { background: #fff !important; border: 2px solid #3b2a33 !important; box-shadow: 4px 4px 0 var(--sec-fg) !important; border-radius: 18px !important; }
  #agenda .vs-hoja b, #agenda .pn-card h4 { color: #1f1620 !important; font-weight: 800 !important; } #agenda .vs-hoja small { color: #3f3f46 !important; }
  #agenda .vs-ic { background: var(--sec-fg) !important; color: #fff !important; } #agenda .vs-ic img { background: #fff; border-radius: 12px; }
  #agenda .vs-cab h2 { color: #1f1620 !important; }
""",
}
VISTAS = [('Mi panel', 0), ('Mis proyectos', 2), ('Mi emprendimiento', 4), ('Finanzas', 5)]
def main():
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=CHROMIUM, args=['--no-sandbox'])
        for nombre, css in OPC.items():
            fotos = []
            for et, k in VISTAS:
                pg = abrir(contexto(b, 390, 900, config_abierta=False, has_touch=True, is_mobile=True), '', 2200, config=False)
                if css: pg.add_style_tag(content=css)
                if k: pg.evaluate("k=>document.querySelectorAll('#pestanas-agenda .pestana')[k].click()", k)
                pg.wait_for_timeout(700); pg.evaluate("(()=>{const h=document.querySelector('.vs-hojas');window.scrollTo(0,h&&h.offsetParent?h.getBoundingClientRect().top+window.scrollY-130:0)})()"); pg.wait_for_timeout(300)
                f = os.path.join(SAL, '_%s_%d.png' % (nombre, k)); pg.screenshot(path=f); fotos.append((et, f))
            W = 390 * len(fotos) + 20 * (len(fotos) + 1); lienzo = Image.new('RGB', (W, 900 + 90), '#ffffff'); d = ImageDraw.Draw(lienzo)
            fnt = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 22)
            d.text((20, 14), 'Opción ' + nombre.replace('-', ' ') if nombre != 'actual' else 'Como está hoy', fill='#3b2a33', font=fnt)
            for i, (et, f) in enumerate(fotos): lienzo.paste(Image.open(f), (20 + i * 410, 80)); d.text((24 + i * 410, 52), et, fill='#6a5560', font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 16))
            lienzo.save(os.path.join(SAL, 'tarjetas-%s.png' % nombre))
            for et, f in fotos: os.remove(f)
        b.close()
main()
