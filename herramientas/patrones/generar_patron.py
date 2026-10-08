"""Genera el PDF de un patrón de tejido de Lana Rosa con el diseño de marca.

Uso:
    python3 herramientas/patrones/generar_patron.py herramientas/patrones/ejemplo.json salida.pdf
    python3 herramientas/patrones/generar_patron.py datos.json salida.pdf --html     (además deja el .html para revisar el diseño)

Entra un archivo de datos (JSON, ver ejemplo.json) y sale un PDF A4 con:
  portada · antes de empezar (resumen, qué aprenderás, materiales, abreviaturas) · instrucciones por partes con tabla de vueltas ·
  armado y acabados · consejos · derechos de uso y contacto.
Las abreviaturas se arman solas con las que figuran en "puntos". Necesita Playwright (Chromium) y las fuentes de /fonts.
Para publicar un patrón real: ver herramientas/cuentas-clientes/migracion-13-patrones-digitales.sql (subir el PDF al bucket "patrones"
y agregar la fila en patrones_archivos).
"""
import os, sys, json, html, argparse
from playwright.sync_api import sync_playwright

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
WHATSAPP = '320 507 2801'

# Abreviaturas de crochet en español (las mismas que usa el Rincón de Rosina)
PUNTOS = {
    'am': ('Anillo mágico', 'Lazada ajustable con la que se empieza una pieza redonda.'),
    'cad': ('Cadeneta', 'Punto base: se pasa la lana por la lazada que está en la aguja.'),
    'pd': ('Punto deslizado', 'Se usa para cerrar una vuelta o para moverte sin altura.'),
    'pb': ('Punto bajo', 'Aguja en el punto, jalas lana, jalas otra vez y sacas las dos lazadas.'),
    'mpa': ('Medio punto alto', 'Hebra sobre la aguja, entras al punto, jalas y sacas las tres lazadas.'),
    'pa': ('Punto alto', 'Hebra sobre la aguja, jalas y sacas las lazadas de a dos veces.'),
    'aum': ('Aumento', '2 puntos bajos en el mismo punto.'),
    'dism': ('Disminución', '2 puntos bajos juntos: entras en dos puntos y cierras todo de una vez.'),
    'pbhd': ('Punto bajo en la hebra de atrás', 'Se teje solo por la hebra de atrás del punto.'),
}
VENTA = {
    'si': 'Puedes vender las piezas que tejas con este patrón.',
    'con_credito': 'Puedes vender las piezas que tejas con este patrón, dando crédito a Lana Rosa Crochet (por ejemplo: «Hecho con un patrón de Lana Rosa Crochet»).',
    'no': 'Este patrón es solo para tejer piezas para ti o para regalar: no se permite vender las piezas tejidas con él.',
}


def e(t):
    return html.escape(str(t), quote=True)


def img_uri(ruta):
    if not ruta:
        return ''
    p = ruta if os.path.isabs(ruta) else os.path.join(RAIZ, ruta)
    return 'file://' + p if os.path.exists(p) else ''


def construir_html(d):
    nombre = e(d['nombre'])
    foto = img_uri(d.get('foto_portada'))
    logo = img_uri('img/logo-lana-rosa-nuevo.webp')
    rosina = img_uri('img/stickers/rosina-06-idea.png')
    fonts = os.path.join(RAIZ, 'fonts')
    chips = ''.join(f'<span class="chip"><small>{e(k)}</small><b>{e(d[c])}</b></span>' for k, c in (('Nivel', 'nivel'), ('Tamaño', 'tamano'), ('Tiempo', 'tiempo')) if d.get(c))

    mat = ''.join(f'<tr><td class="m-i">{e(m["item"])}</td><td>{e(m.get("detalle", ""))}</td></tr>' for m in d.get('materiales', []))
    ab = ''.join(f'<tr><td class="a-k">{e(k)}</td><td class="a-n">{e(PUNTOS[k][0])}</td><td>{e(PUNTOS[k][1])}</td></tr>' for k in d.get('puntos', []) if k in PUNTOS)
    extra = ''.join(f'<tr><td class="a-k">{e(k)}</td><td class="a-n">{e(v[0])}</td><td>{e(v[1])}</td></tr>' for k, v in (d.get('abreviaturas_extra') or {}).items())
    aprende = ''.join(f'<li>{e(x)}</li>' for x in d.get('aprenderas', []))

    partes = ''
    for n, p in enumerate(d.get('partes', []), 1):
        filas = ''.join(f'<tr><td class="v-n">{e(v[0])}</td><td>{e(v[1])}</td><td class="v-t">{e(v[2]) if len(v) > 2 else ""}</td></tr>' for v in p.get('vueltas', []))
        pf = img_uri(p.get('foto'))
        partes += f'''<section class="parte">
  <h2><span class="num">{n}</span>{e(p["titulo"])}</h2>
  {f'<p class="nota">{e(p["nota"])}</p>' if p.get('nota') else ''}
  <table class="vueltas"><thead><tr><th>Vuelta</th><th>Qué tejer</th><th>Puntos</th></tr></thead><tbody>{filas}</tbody></table>
  {f'<img class="foto-paso" src="{pf}" alt="">' if pf else ''}
  {f'<div class="consejo">{f"<img src={chr(34)}{rosina}{chr(34)} alt={chr(34)}{chr(34)}>" if rosina else ""}<p><b>Consejo de Rosina:</b> {e(p["consejo"])}</p></div>' if p.get('consejo') else ''}
</section>'''

    armado = ''.join(f'<li>{e(x)}</li>' for x in d.get('armado', []))
    consejos = ''.join(f'<li>{e(x)}</li>' for x in d.get('consejos', []))
    venta = VENTA.get(d.get('venta_piezas', 'no'), VENTA['no'])
    credito = e(d.get('credito', 'Patrón de Lana Rosa Crochet'))
    anio = e(d.get('anio', ''))
    version = e(d.get('version', '1.0'))

    return f'''<!doctype html><html lang="es"><meta charset="utf-8"><title>{nombre} · Lana Rosa Crochet</title>
<style>
@font-face {{ font-family: DP; src: url("file://{fonts}/dynapuff-latin.woff2"); font-weight: 400 700; }}
@font-face {{ font-family: HG; src: url("file://{fonts}/hanken-grotesk-latin.woff2"); font-weight: 100 900; }}
:root {{ --rosa: #E74E96; --rosa-texto: #B3145E; --rosa-medio: #F28FC0; --rosa-suave: #FBE4EF; --lila: #E6E7FD; --azul: #93C7F9; --tinta: #45454A; --suave: #6E6E73; }}
@page {{ size: A4; margin: 18mm 17mm 20mm; @bottom-center {{ content: "{nombre} · Lana Rosa Crochet · lanarosacrochet.com · " counter(page); font: 600 8pt HG; color: #8a8a90; }} }}
@page :first {{ margin: 0; @bottom-center {{ content: none; }} }}
* {{ box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }}
body {{ margin: 0; font: 10.5pt/1.5 HG, Arial, sans-serif; color: var(--tinta); }}
h1, h2, h3 {{ font-family: DP, HG, sans-serif; font-weight: 600; color: var(--rosa-texto); margin: 0; }}
.portada {{ height: 297mm; padding: 22mm 20mm 18mm; background: linear-gradient(160deg, #FBE4EF 0%, #E6E7FD 100%); display: flex; flex-direction: column; align-items: center; text-align: center; page-break-after: always; position: relative; overflow: hidden; }}
.portada::before, .portada::after {{ content: ""; position: absolute; border-radius: 50%; background: rgba(255,255,255,.55); }}
.portada::before {{ width: 150mm; height: 150mm; right: -60mm; top: -40mm; }} .portada::after {{ width: 110mm; height: 110mm; left: -45mm; bottom: -35mm; }}
.portada > * {{ position: relative; z-index: 1; }}
.portada .logo {{ width: 56mm; }}
.portada .foto {{ margin: 12mm 0 10mm; width: 108mm; height: 108mm; border-radius: 50%; background: #fff; border: 3mm solid #fff; box-shadow: 0 6mm 14mm rgba(231,78,150,.25); display: grid; place-items: center; overflow: hidden; }}
.portada .foto img {{ width: 100%; height: 100%; object-fit: contain; }}
.portada .tag {{ font-size: 9pt; letter-spacing: .14em; text-transform: uppercase; font-weight: 800; color: var(--rosa-texto); }}
.portada h1 {{ font-size: 34pt; line-height: 1.1; margin: 4mm 0 3mm; }} .portada .sub {{ font-size: 13pt; color: var(--suave); margin: 0 0 8mm; }}
.chips {{ display: flex; gap: 4mm; justify-content: center; flex-wrap: wrap; }}
.chip {{ background: #fff; border-radius: 6mm; padding: 3mm 6mm; display: flex; flex-direction: column; box-shadow: 0 2mm 5mm rgba(0,0,0,.08); }} .chip small {{ font-size: 7.5pt; text-transform: uppercase; letter-spacing: .1em; color: var(--suave); font-weight: 700; }} .chip b {{ font-size: 11pt; }}
.portada .pie {{ margin-top: auto; font-size: 9pt; color: var(--suave); }}
h2 {{ font-size: 17pt; margin: 0 0 4mm; display: flex; align-items: center; gap: 3mm; }}
h2 .num {{ width: 9mm; height: 9mm; border-radius: 50%; background: var(--rosa); color: #fff; display: inline-grid; place-items: center; font-size: 12pt; }}
.bloque {{ margin-bottom: 9mm; break-inside: avoid; }}
.dos {{ display: grid; grid-template-columns: 1fr 1fr; gap: 6mm; }}
.caja {{ background: var(--rosa-suave); border-radius: 5mm; padding: 5mm 6mm; }} .caja.lila {{ background: var(--lila); }}
.caja ul {{ margin: 0; padding-left: 5mm; }} .caja li {{ margin: 1mm 0; }}
table {{ border-collapse: collapse; width: 100%; }}
.mat td, .abrev td {{ padding: 2.2mm 3mm; border-bottom: 1px solid #F0E4EA; vertical-align: top; }} .m-i {{ font-weight: 700; width: 34mm; color: var(--rosa-texto); }}
.a-k {{ font: 700 10pt DP; color: var(--rosa-texto); width: 17mm; }} .a-n {{ font-weight: 700; width: 46mm; }}
.nota {{ background: #FFF6D6; border-radius: 4mm; padding: 3mm 5mm; margin: 0 0 4mm; font-size: 10pt; }}
.parte {{ margin-bottom: 10mm; }}
.vueltas {{ break-inside: auto; border-collapse: separate; border-spacing: 0; }} .vueltas tr {{ break-inside: avoid; }}
.vueltas th {{ background: var(--rosa); color: #fff; text-align: left; padding: 2.5mm 3mm; font-size: 9.5pt; }} .vueltas th:last-child, .v-t {{ text-align: center; width: 20mm; }} .vueltas th:first-child {{ border-radius: 3mm 0 0 0; }} .vueltas th:last-child {{ border-radius: 0 3mm 0 0; }}
.vueltas td {{ padding: 2.2mm 3mm; border-bottom: 1px solid #F0E4EA; }} .vueltas tbody tr:nth-child(even) td {{ background: #FDF3F8; }}
.v-n {{ font-weight: 800; width: 22mm; color: var(--rosa-texto); }} .v-t {{ font-weight: 800; }}
.foto-paso {{ display: block; max-width: 100%; max-height: 80mm; margin: 5mm auto 0; border-radius: 4mm; }}
.consejo {{ display: flex; gap: 4mm; align-items: center; background: var(--lila); border-radius: 5mm; padding: 4mm 5mm; margin-top: 5mm; break-inside: avoid; }} .consejo img {{ width: 16mm; height: 16mm; object-fit: contain; flex: none; }} .consejo p {{ margin: 0; }}
ol.pasos {{ padding-left: 0; list-style: none; counter-reset: p; margin: 0; }} ol.pasos li {{ counter-increment: p; display: flex; gap: 4mm; margin: 0 0 3mm; align-items: flex-start; }}
ol.pasos li::before {{ content: counter(p); flex: none; width: 7mm; height: 7mm; border-radius: 50%; background: var(--azul); color: #1f3b57; font-weight: 800; display: grid; place-items: center; margin-top: .3mm; }}
ul.pts {{ margin: 0; padding-left: 5mm; }} ul.pts li {{ margin: 1.5mm 0; }}
.derechos {{ border: 2px solid var(--rosa-medio); border-radius: 6mm; padding: 6mm 7mm; }} .derechos li {{ margin: 1.5mm 0; }}
.cierre {{ text-align: center; margin-top: 10mm; }} .cierre .logo {{ width: 42mm; }} .cierre p {{ margin: 2mm 0; }} .cierre .gracias {{ font: 600 14pt DP; color: var(--rosa-texto); }}
.pagina {{ page-break-before: always; }}
</style>
<body>
<section class="portada">
  {f'<img class="logo" src="{logo}" alt="Lana Rosa Crochet">' if logo else ''}
  <div class="foto">{f'<img src="{foto}" alt="">' if foto else ''}</div>
  <div class="tag">Patrón de tejido · crochet</div>
  <h1>{nombre}</h1>
  <p class="sub">{e(d.get("subtitulo", ""))}</p>
  <div class="chips">{chips}</div>
  <div class="pie">Patrón digital de uso personal · Versión {version} · {anio}<br>lanarosacrochet.com</div>
</section>

<section class="bloque">
  <h2>Antes de empezar</h2>
  <div class="dos">
    <div class="caja"><h3 style="font-size:12pt;margin-bottom:2mm">Lo que aprenderás</h3><ul>{aprende}</ul></div>
    <div class="caja lila"><h3 style="font-size:12pt;margin-bottom:2mm">En resumen</h3><ul>
      {f'<li><b>Nivel:</b> {e(d["nivel"])}</li>' if d.get('nivel') else ''}{f'<li><b>Tamaño:</b> {e(d["tamano"])}</li>' if d.get('tamano') else ''}{f'<li><b>Tiempo:</b> {e(d["tiempo"])}</li>' if d.get('tiempo') else ''}
      <li>Se teje en español, con las abreviaturas de la página siguiente.</li></ul></div>
  </div>
</section>
<section class="bloque"><h2>Materiales</h2><table class="mat"><tbody>{mat}</tbody></table></section>
<section class="bloque"><h2>Abreviaturas y puntos</h2><table class="abrev"><tbody>{ab}{extra}</tbody></table>
  <p style="font-size:9.5pt;color:var(--suave)">¿Quieres ver cómo se hace cada punto? Visita el glosario de Rosina: lanarosacrochet.com/glosario-rosina.html</p></section>

<div class="pagina"></div>
<h1 style="font-size:22pt;margin-bottom:6mm">Instrucciones</h1>
{partes}

<section class="bloque"><h2>Armado y acabados</h2><ol class="pasos">{armado}</ol></section>
<section class="bloque"><h2>Consejos</h2><ul class="pts">{consejos}</ul></section>

<section class="bloque"><h2>Derechos de uso</h2>
  <div class="derechos"><ul style="margin:0;padding-left:5mm">
    <li>Este patrón es de <b>uso personal</b>: es para quien lo compró.</li>
    <li>No se puede compartir, revender, publicar ni redistribuir el archivo, completo o en partes, ni sus fotos y textos.</li>
    <li>{e(venta)}</li>
    <li>Los derechos de autor del patrón, sus textos y sus fotos son de Lana Rosa Crochet.</li>
  </ul></div></section>
<section class="cierre">
  {f'<img class="logo" src="{logo}" alt="">' if logo else ''}
  <p class="gracias">¡Gracias por tejer con nosotras!</p>
  <p>Cuéntanos cómo te quedó: etiquétanos en Instagram <b>@lanarosacrochet</b> y comparte tu tejido.</p>
  <p>¿Dudas con el patrón? Escríbenos por WhatsApp al <b>{WHATSAPP}</b> o visita <b>lanarosacrochet.com</b></p>
  <p style="font-size:9pt;color:var(--suave);margin-top:6mm">{credito} · Versión {version} · {anio}</p>
</section>
</body></html>'''


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('datos'); ap.add_argument('salida'); ap.add_argument('--html', action='store_true', help='deja también el .html')
    a = ap.parse_args()
    d = json.load(open(a.datos, encoding='utf-8'))
    codigo = construir_html(d)
    ruta_html = os.path.splitext(a.salida)[0] + '.html'
    open(ruta_html, 'w', encoding='utf-8').write(codigo)
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path='/opt/pw-browsers/chromium', args=['--allow-file-access-from-files'])
        pg = b.new_page()
        pg.goto('file://' + os.path.abspath(ruta_html))
        pg.evaluate('document.fonts.ready')
        pg.wait_for_function('[...document.images].every(i=>i.complete)')
        pg.pdf(path=a.salida, prefer_css_page_size=True, print_background=True)
        b.close()
    if not a.html:
        os.remove(ruta_html)
    print('PDF listo:', a.salida, round(os.path.getsize(a.salida) / 1024), 'KB')


if __name__ == '__main__':
    main()
