#!/usr/bin/env python3
"""Códigos QR de las piezas de Lana Rosa (Etapa 3 del universo de Rosina).

Cada QR abre la página pública de la pieza: https://lanarosacrochet.com/p/?i=<id>&o=etiqueta (cuidados, historia y enlaces).
También se genera una tarjeta con un QR general (https://lanarosacrochet.com/p/?o=tarjeta) para meter en los pedidos personalizados
y en cualquier pieza que no esté en el catálogo.

Todo se genera aquí, sin servicios externos (los QR no se envían a ningún tercero). Requisitos: pip install segno playwright.

  python3 herramientas/qr/generar_qr.py --datos piezas.json --salida carpeta [--tamano 30] [--origen etiqueta]
  python3 herramientas/qr/generar_qr.py --generico --salida carpeta

piezas.json: lista de {"id": "<uuid del producto>", "nombre": "…"}. Se puede sacar del ERP/Supabase con
  select json_agg(json_build_object('id', id, 'nombre', nombre) order by nombre) from obtener_tienda_web();

Salida: un SVG por pieza, hoja-etiquetas.pdf (A4, listas para imprimir), tarjeta-general.pdf y urls.csv.
"""
import argparse, csv, html, json, os, re, sys, unicodedata

import segno

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
UUID = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', re.I)
ORIGENES = ('etiqueta', 'tarjeta', 'estanteria')


def url_pieza(base, id_, origen):
    if not UUID.match(id_):
        raise ValueError('id inválido (debe ser el uuid del producto): %r' % id_)
    if origen not in ORIGENES:
        raise ValueError('origen inválido: %r' % origen)
    return '%s/p/?i=%s&o=%s' % (base.rstrip('/'), id_.lower(), origen)


def url_general(base):
    return base.rstrip('/') + '/p/?o=tarjeta'


def qr_svg(url, tamano_mm=None):
    """SVG del QR, dibujado a partir de la matriz (corrección de errores M, zona de silencio de 4 módulos, negro sobre blanco para que
    escanee bien). Lleva viewBox, así que se escala al tamaño que le dé el diseño (CSS) o el programa de impresión; si se da tamano_mm,
    el archivo trae también su medida real en milímetros."""
    q = segno.make(url, error='m', micro=False)
    borde = 4
    filas = [bytes(f) for f in q.matrix]
    n = len(filas) + 2 * borde
    trazos = []
    for y, fila in enumerate(filas):
        x = 0
        while x < len(fila):
            if fila[x]:
                ini = x
                while x < len(fila) and fila[x]:
                    x += 1
                trazos.append('M%d %dh%dv1h-%dz' % (ini + borde, y + borde, x - ini, x - ini))
            else:
                x += 1
    medida = ' width="%dmm" height="%dmm"' % (tamano_mm, tamano_mm) if tamano_mm else ''
    svg = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d"%s shape-rendering="crispEdges" role="img" aria-label="Código QR">'
           '<rect width="%d" height="%d" fill="#ffffff"/><path d="%s" fill="#000000"/></svg>' % (n, n, medida, n, n, ''.join(trazos)))
    return svg, q


def slug(texto):
    t = unicodedata.normalize('NFD', texto).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', '-', t).strip('-')[:60] or 'pieza'


CSS = """
@font-face { font-family: 'DynaPuff'; src: url('file://%(raiz)s/fonts/dynapuff-latin.woff2') format('woff2'); font-weight: 400 700; }
@font-face { font-family: 'Hanken Grotesk'; src: url('file://%(raiz)s/fonts/hanken-grotesk-latin.woff2') format('woff2'); font-weight: 100 900; }
@page { size: A4; margin: 10mm; }
* { box-sizing: border-box; }
body { margin: 0; font-family: 'Hanken Grotesk', sans-serif; color: #45454A; }
.hoja { display: grid; grid-template-columns: repeat(%(cols)d, %(ancho)smm); gap: 4mm; justify-content: center; }
.eti { width: %(ancho)smm; border: 0.3mm dashed #BBB; border-radius: 3mm; padding: 2.5mm; text-align: center; break-inside: avoid; }
.eti svg { width: %(qr)smm; height: %(qr)smm; display: block; margin: 0 auto; }
.eti .nombre { font-size: 2.9mm; line-height: 1.15; font-weight: 700; margin-top: 1.5mm; min-height: 6.6mm; overflow-wrap: anywhere; }
.eti .pie { font-family: 'DynaPuff', sans-serif; font-size: 2.6mm; color: #C81B6D; margin-top: 1mm; }
.eti .pista { font-size: 2.3mm; color: #64646A; }
.tarjeta { width: 85mm; height: 55mm; border: 0.3mm dashed #BBB; border-radius: 4mm; padding: 4mm; display: grid; grid-template-columns: 30mm 1fr; gap: 4mm; align-items: center; background: #FBE4EF; }
.tarjeta .qr { background: #fff; padding: 1mm; border-radius: 2mm; }
.tarjeta svg { width: 28mm; height: 28mm; display: block; }
.tarjeta h2 { font-family: 'DynaPuff', sans-serif; font-size: 4.6mm; margin: 0 0 1.5mm; color: #C81B6D; line-height: 1.1; }
.tarjeta p { margin: 0 0 1mm; font-size: 2.9mm; line-height: 1.25; }
.tarjeta .web { font-weight: 700; font-size: 2.6mm; }
"""


def hoja_etiquetas(piezas, base, origen, tamano):
    ancho = tamano + 8
    cols = max(1, int(190 // (ancho + 4)))
    celdas = []
    for p in piezas:
        svg, _ = qr_svg(url_pieza(base, p['id'], origen))
        celdas.append('<div class="eti">%s<div class="nombre">%s</div><div class="pie">Lana Rosa Crochet</div><div class="pista">Escanéame: cuidados e historia</div></div>' % (svg, html.escape(p['nombre'])))
    return '<!doctype html><meta charset="utf-8"><style>%s</style><div class="hoja">%s</div>' % (CSS % {'raiz': RAIZ, 'cols': cols, 'ancho': ancho, 'qr': tamano}, ''.join(celdas))


def tarjeta_general(base):
    svg, _ = qr_svg(url_general(base))
    return ('<!doctype html><meta charset="utf-8"><style>%s</style><div class="tarjeta"><div class="qr">%s</div><div><h2>Cuida tu pieza</h2>'
            '<p>Escanea y mira cómo cuidarla para que dure toda la vida.</p><p class="web">lanarosacrochet.com/p/</p><p>Hecho a mano con amor 🐑</p></div></div>'
            % (CSS % {'raiz': RAIZ, 'cols': 1, 'ancho': 40, 'qr': 28}, svg))


def a_pdf(contenido_html, destino):
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        kw = {'executable_path': '/opt/pw-browsers/chromium'} if os.path.exists('/opt/pw-browsers/chromium') else {}
        nav = p.chromium.launch(**kw)
        pg = nav.new_page()
        ruta = destino + '.html'
        open(ruta, 'w', encoding='utf-8').write(contenido_html)
        pg.goto('file://' + os.path.abspath(ruta)); pg.wait_for_timeout(400)
        pg.pdf(path=destino, format='A4', print_background=True, margin={'top': '10mm', 'bottom': '10mm', 'left': '10mm', 'right': '10mm'})
        nav.close()
        os.remove(ruta)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--datos', help='JSON con la lista de piezas [{id, nombre}]')
    ap.add_argument('--generico', action='store_true', help='solo la tarjeta con el QR general')
    ap.add_argument('--salida', required=True, help='carpeta de salida')
    ap.add_argument('--base', default='https://lanarosacrochet.com')
    ap.add_argument('--origen', default='etiqueta', choices=ORIGENES)
    ap.add_argument('--tamano', type=int, default=30, help='lado del QR en mm (mínimo recomendado: 20)')
    a = ap.parse_args()
    if a.tamano < 20:
        sys.exit('El QR no debería medir menos de 20 mm para que escanee bien.')
    os.makedirs(a.salida, exist_ok=True)
    filas = []
    if a.datos:
        piezas = json.load(open(a.datos, encoding='utf-8'))
        for p in piezas:
            svg, q = qr_svg(url_pieza(a.base, p['id'], a.origen), tamano_mm=a.tamano)
            open(os.path.join(a.salida, '%s.svg' % slug(p['nombre'])), 'w', encoding='utf-8').write(svg)
            filas.append((p['nombre'], p['id'], url_pieza(a.base, p['id'], a.origen)))
        a_pdf(hoja_etiquetas(piezas, a.base, a.origen, a.tamano), os.path.join(a.salida, 'hoja-etiquetas.pdf'))
        with open(os.path.join(a.salida, 'urls.csv'), 'w', encoding='utf-8-sig', newline='') as f:
            w = csv.writer(f); w.writerow(['pieza', 'id', 'url']); w.writerows(filas)
        print('%d etiquetas →' % len(piezas), os.path.join(a.salida, 'hoja-etiquetas.pdf'))
    if a.generico or not a.datos:
        a_pdf(tarjeta_general(a.base), os.path.join(a.salida, 'tarjeta-general.pdf'))
        print('tarjeta general →', os.path.join(a.salida, 'tarjeta-general.pdf'))


if __name__ == '__main__':
    main()
