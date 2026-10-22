#!/usr/bin/env python3
"""Convierte el JSON del rastreo en INVENTARIO_PAGINAS.csv y un resumen de hallazgos automáticos (solo lectura).

    python3 herramientas/auditoria-360/scripts/analizar_rastreo.py rastreo.json inventario_paginas.csv resumen.json
"""
import json, sys, csv, re, os, collections
RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
d = json.load(open(sys.argv[1]))
BASE = 'https://lanarosacrochet.com'
sitemap = set(u.replace(BASE, '') or '/' for u in re.findall(r'<loc>(.*?)</loc>', open(os.path.join(RAIZ, 'sitemap.xml')).read()))

def area(r):
    if r.startswith('/merceria'): return 'Mercería'
    if r.startswith('/academy'): return 'Academy'
    if r.startswith('/aventuras'): return 'Aventura de Rosina'
    if r.startswith('/revista'): return 'Revista'
    if any(k in r for k in ('rosina', 'glosario', 'paletas', 'recursos', 'agenda', 'calculadoras')): return 'Universo / Rincón de Rosina'
    if r in ('/tienda.html', '/personaliza.html', '/precios.html', '/') or r.startswith('/tienda') or r.startswith('/personaliza'): return 'Lana Rosa Crochet (tienda)'
    return 'Común / servicio'

COND = {  # requiere sesión, parámetros o condiciones especiales
    '/cuenta.html': 'Funciones con sesión (enlace al correo / Google); la página de entrada es pública',
    '/gracias.html': 'Requiere ?ref=LRW-… (referencia de un pedido)',
    '/baja-recordatorios.html': 'Requiere ?t=<token> (llega por correo)',
    '/p/': 'Pública; con ?i=<uuid del producto> muestra la ficha de la pieza (QR)',
    '/3d-prueba.html': 'Oculta a propósito (noindex, sin menú)',
    '/agenda-rosina.html': 'Pública; guardar en el dispositivo; cuenta opcional',
    '/recursos-rosina.html': 'Pública; las descargas piden cuenta gratis',
    '/404.html': 'Página de error', '/offline.html': 'Se muestra sin internet (service worker)',
}
def norm(c, ruta):
    return c.replace(BASE, '') if c else None

filas = []; resumen = collections.defaultdict(list)
for ruta, v in d.items():
    a, b = v.get('390', {}), v.get('1280', {})
    if a.get('error') or not a.get('titulo') and a.get('estado') != 404:
        pass
    t = a.get('titulo') or ''
    desc = a.get('descripcion') or ''
    can = norm(a.get('canonical'), ruta)
    ruta_base = ruta.split('?')[0].split('#')[0]
    robots = a.get('robots') or ''
    noindex = 'noindex' in robots
    og = a.get('og') or {}
    og_ok = all(og.get(k) for k in ('title', 'desc', 'img', 'url'))
    axe = lambda x: [f"{z['id']}({z['n']})" for z in (x.get('axe') or [])]
    ax390, ax1280 = axe(a), axe(b)
    graves = lambda x: [z for z in (x.get('axe') or []) if z['impact'] in ('critical', 'serious')]
    fila = {
        'ruta': ruta, 'estado_http': a.get('estado'), 'area': area(ruta_base), 'condiciones': COND.get(ruta_base, ''),
        'en_sitemap': 'sí' if ruta_base in sitemap else 'no', 'noindex': 'sí' if noindex else 'no',
        'titulo': t, 'len_titulo': len(t), 'len_descripcion': len(desc), 'canonical': can or '', 'h1': len(a.get('h1') or []), 'saltos_de_nivel': a.get('saltosDeNivel'),
        'lang': a.get('lang'), 'og_completo': 'sí' if og_ok else 'no', 'twitter_card': a.get('tw') or '', 'jsonld': ';'.join(x.get('tipo', 'ERROR') if x.get('ok') else 'ERROR' for x in (a.get('jsonld') or [])),
        'imgs': a.get('imgs'), 'imgs_sin_alt': a.get('imgsSinAlt'), 'enlaces': a.get('enlaces'), 'enlaces_vacios': a.get('enlacesVacios'), 'href_vacio': a.get('hrefVacio'), 'blank_sin_noopener': a.get('blankSinNoopener'),
        'campos_sin_etiqueta': a.get('camposSinEtiqueta'), 'botones_sin_nombre': a.get('botonesSinNombre'), 'objetivos_pequenos_24px': a.get('objetivosPequenos'),
        'desborde_390': 'sí' if a.get('ancho', {}).get('scroll', 0) > a.get('ancho', {}).get('inner', 1) else 'no', 'desborde_1280': 'sí' if b.get('ancho', {}).get('scroll', 0) > b.get('ancho', {}).get('inner', 1) else 'no',
        'errores_js': len(a.get('erroresJs') or []) + len(b.get('erroresJs') or []), 'recursos_locales_con_error': len(a.get('recursosMalos') or []),
        'hosts_externos_intentados': ';'.join(a.get('externosIntentados') or []), 'axe_390': ' '.join(ax390), 'axe_1280': ' '.join(ax1280),
        'axe_graves_o_serias': sum(z['n'] for z in graves(a)) + sum(z['n'] for z in graves(b)), 'manifest': a.get('manifest') or '', 'theme_color': a.get('temaColor') or '', 'alto_px_390': a.get('alto'),
    }
    filas.append(fila)
    esperado_404 = ruta.startswith('/ruta-que-no-existe')
    if a.get('estado') not in (200,) and not esperado_404: resumen['estado_no_200'].append(ruta)
    if not noindex and not esperado_404:
        if not (30 <= len(t) <= 70): resumen['titulo_fuera_de_30_70'].append((ruta, len(t)))
        if not desc: resumen['sin_descripcion'].append(ruta)
        elif not (70 <= len(desc) <= 170): resumen['descripcion_fuera_de_70_170'].append((ruta, len(desc)))
        if can and can != ruta_base and not (ruta_base.endswith('/index.html')): resumen['canonical_distinto'].append((ruta, can))
        if not can: resumen['sin_canonical'].append(ruta)
        if not og_ok: resumen['og_incompleto'].append(ruta)
        if len(a.get('h1') or []) != 1: resumen['h1_distinto_de_1'].append((ruta, len(a.get('h1') or [])))
    if a.get('imgsSinAlt'): resumen['imgs_sin_alt'].append((ruta, a['imgsSinAlt']))
    if a.get('blankSinNoopener'): resumen['blank_sin_noopener'].append((ruta, a['blankSinNoopener']))
    if a.get('camposSinEtiqueta'): resumen['campos_sin_etiqueta'].append((ruta, a['camposSinEtiqueta']))
    if a.get('botonesSinNombre'): resumen['botones_sin_nombre'].append((ruta, a['botonesSinNombre']))
    if fila['desborde_390'] == 'sí': resumen['desborde_390'].append(ruta)
    if fila['desborde_1280'] == 'sí': resumen['desborde_1280'].append(ruta)
    if fila['errores_js']: resumen['errores_js'].append((ruta, (a.get('erroresJs') or b.get('erroresJs'))[:2]))
    if a.get('recursosMalos'): resumen['recursos_locales_con_error'].append((ruta, a['recursosMalos'][:3]))
    if a.get('externosIntentados'): resumen['hosts_externos'].append((ruta, a['externosIntentados']))
    for x in (a.get('jsonld') or []):
        if not x.get('ok'): resumen['jsonld_invalido'].append(ruta)
    for w, x in (('390', a), ('1280', b)):
        for z in (x.get('axe') or []): resumen['axe:' + z['id'] + ':' + z['impact']].append((ruta, w, z['n'], z['ejemplo'][:1]))
cols = list(filas[0].keys())
with open(sys.argv[2], 'w', newline='', encoding='utf-8') as f:
    w = csv.DictWriter(f, fieldnames=cols); w.writeheader(); w.writerows(filas)
json.dump(resumen, open(sys.argv[3], 'w'), ensure_ascii=False, indent=1)
print(len(filas), 'filas')
for k, v in sorted(resumen.items()): print(f'{k}: {len(v)}')
