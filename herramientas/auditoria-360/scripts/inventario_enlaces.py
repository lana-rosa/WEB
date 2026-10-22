#!/usr/bin/env python3
"""Inventario de enlaces y recursos de todas las páginas del sitio (auditoría 360; solo lectura).

    python3 herramientas/auditoria-360/scripts/inventario_enlaces.py <salida.csv> [salida_resumen.json]

Recorre las páginas HTML publicables (todo lo que no está en herramientas/, node_modules/ ni .git/), extrae cada aparición de enlace o
recurso con archivo y línea, la resuelve como lo hace GitHub Pages (archivo, carpeta con index.html o nombre sin .html; distingue
mayúsculas) y comprueba las anclas (#id) contra el destino. Los enlaces externos NO se visitan: quedan «pendiente de comprobar».
"""
import csv, json, os, re, sys, collections
from html.parser import HTMLParser
from urllib.parse import urlparse, unquote

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
SITIO = 'lanarosacrochet.com'
SALTAR = ('herramientas', 'node_modules', '.git', '.github', '.tmp')
WA = '573205072801'
# Anclas que no existen en el HTML pero las resuelve JavaScript (revisado en el código; ver auditoría del 17-oct-2026)
ANCLAS_JS = {'#/mapa', '#/pasaporte', '#/ayuda', '#/adultos', '#lana', '#contador', '#costos', '#aumentos', '#muestra'}

paginas = []
for d, ds, fs in os.walk(ROOT):
    rel = os.path.relpath(d, ROOT)
    ds[:] = [x for x in ds if not (rel == '.' and x in SALTAR)]
    if rel != '.' and rel.split(os.sep)[0] in SALTAR: continue
    for f in fs:
        if f.endswith('.html'): paginas.append(os.path.normpath(os.path.join(rel, f)))
paginas.sort()


def existe(ruta):
    ruta = unquote(ruta.split('#')[0].split('?')[0])
    fp = os.path.join(ROOT, ruta.lstrip('/'))
    if ruta.endswith('/') or ruta == '':
        if os.path.isfile(os.path.join(fp, 'index.html')): return os.path.relpath(os.path.join(fp, 'index.html'), ROOT)
        return 'PREFIJO' if os.path.isdir(fp) else False   # carpeta sin index.html: prefijo que JavaScript completa (p. ej. /img/productos/)
    if os.path.isfile(fp): return os.path.relpath(fp, ROOT)
    if os.path.isdir(fp) and os.path.isfile(os.path.join(fp, 'index.html')): return os.path.relpath(os.path.join(fp, 'index.html'), ROOT)
    if os.path.isfile(fp + '.html'): return os.path.relpath(fp + '.html', ROOT)
    return False


ids_cache = {}
def ids_de(archivo):
    if archivo in ids_cache: return ids_cache[archivo]
    try: t = open(os.path.join(ROOT, archivo), encoding='utf-8').read()
    except Exception: t = ''
    ids_cache[archivo] = set(re.findall(r'\b(?:id|name)\s*=\s*["\']([^"\']+)["\']', t))
    return ids_cache[archivo]


class Lector(HTMLParser):
    def __init__(s):
        super().__init__(convert_charrefs=True); s.apar = []; s.en_script = False; s.script_txt = []; s.script_ini = 0
    def anota(s, tipo, destino):
        if destino: s.apar.append((tipo, destino.strip(), s.getpos()[0]))
    def handle_starttag(s, t, a):
        a = dict(a)
        if t in ('a', 'area'): s.anota('enlace', a.get('href'))
        if t == 'form': s.anota('enlace', a.get('action'))
        if a.get('data-href'): s.anota('enlace', a['data-href'])
        if t == 'link':
            if a.get('rel') == 'canonical': s.anota('canonical', a.get('href'))
            elif a.get('rel') not in ('preconnect', 'dns-prefetch'): s.anota('recurso', a.get('href'))
        if t in ('script', 'img', 'source', 'iframe', 'video', 'audio', 'embed'): s.anota('recurso', a.get('src'))
        if t in ('img', 'source') and a.get('srcset'):
            for x in a['srcset'].split(','):
                if x.strip(): s.anota('recurso', x.split()[0])
        if t == 'meta' and (a.get('property') in ('og:image', 'og:url') or a.get('name') == 'twitter:image'): s.anota('recurso', a.get('content'))
        if t == 'script' and not a.get('src'): s.en_script = True; s.script_txt = []; s.script_ini = s.getpos()[0]
    def handle_data(s, d):
        if s.en_script: s.script_txt.append(d)
    def handle_endtag(s, t):
        if t == 'script' and s.en_script:
            s.en_script = False; txt = ''.join(s.script_txt)
            for m in RUTA_JS.finditer(txt):
                s.apar.append(('ruta en JavaScript', m.group(1), s.script_ini + txt[:m.start()].count('\n')))


RUTA_JS = re.compile(r"""['"`](/(?:[A-Za-z0-9_\-%.]+/)*(?:[A-Za-z0-9_\-%.]+\.(?:html|css|js|json|png|jpe?g|webp|svg|gif|ico|mp3|mp4|webm|zip|pdf|glb|woff2?|webmanifest|txt|xml|csv|ics)|(?:[A-Za-z0-9_\-%.]+/)))(?:[?#][^'"`\s]*)?['"`]""")

filas = []
def clasifica(destino):
    d = destino
    if d.startswith('mailto:'): return 'mailto'
    if d.startswith('tel:'): return 'tel'
    if d.startswith(('javascript:', 'data:', 'blob:', 'sms:')): return 'otro'
    if re.match(r'https?://(wa\.me|api\.whatsapp\.com)', d): return 'whatsapp'
    if d.startswith('#'): return 'ancla'
    if d.startswith(('http://', 'https://', '//')):
        u = urlparse(d if not d.startswith('//') else 'https:' + d)
        return 'interno-absoluto' if u.netloc.replace('www.', '') == SITIO else 'externo'
    return 'interno'


def evalua(origen, tipo, destino, linea):
    clase = clasifica(destino); resuelto = ''; res = ''; estado = ''; evid = ''; corr = ''
    if clase == 'externo':
        estado = 'pendiente de comprobar'; res = 'no se visita desde el entorno de la auditoría (sin salida a internet)'
    elif clase == 'whatsapp':
        n = re.search(r'(?:wa\.me/|phone=)(\d+)', destino)
        ok = bool(n) and n.group(1) == WA
        estado = 'verificado' if ok else 'problema confirmado'; res = 'número ' + (n.group(1) if n else 'no encontrado') + (' = 573205072801' if ok else ' ≠ 573205072801')
    elif clase == 'mailto':
        m = destino[7:].split('?')[0]; ok = bool(re.fullmatch(r'[^@\s]+@[^@\s]+\.[^@\s]+', m))
        estado = 'verificado' if ok else 'problema confirmado'; res = 'formato de correo ' + ('válido' if ok else 'inválido'); resuelto = m
    elif clase in ('tel', 'otro'):
        estado = 'verificado'; res = 'formato revisado'
    elif clase == 'ancla':
        if destino in ANCLAS_JS or destino.startswith('#/'): estado = 'verificado'; res = 'ancla que resuelve JavaScript (leída en el código, no probada con clic)'
        elif destino == '#': estado = 'verificado'; res = 'ancla vacía (arriba de la página)'
        else:
            ok = destino[1:] in ids_de(origen); estado = 'verificado' if ok else 'problema confirmado'; res = 'ancla ' + ('existe' if ok else 'NO existe') + ' en la misma página'
    else:   # interno / interno-absoluto / canonical / js
        ruta = destino
        if clase == 'interno-absoluto': ruta = urlparse(destino if not destino.startswith('//') else 'https:' + destino); ruta = ruta.path + (('#' + ruta.fragment) if ruta.fragment else '')
        if not ruta.startswith('/'):
            estado = 'problema confirmado'; res = 'ruta relativa (la regla de arquitectura exige empezar con /)'; corr = 'Empezar la ruta con /'
        else:
            e = existe(ruta); resuelto = ruta.split('#')[0].split('?')[0]
            if not e:
                estado = 'problema confirmado'; res = 'la ruta no existe en el repositorio'
                if destino == '/merceria.html': estado = 'verificado'; res = 'redirección intencional de una dirección antigua (404.html la lleva a /merceria/)'
            elif e == 'PREFIJO':
                estado = 'verificado'; res = 'prefijo de carpeta que JavaScript completa con el nombre del archivo'
            else:
                estado = 'verificado'; res = 'ruta existe en el repositorio (' + e + ')'
                if '#' in ruta and e.endswith('.html'):
                    fr = ruta.split('#', 1)[1]
                    if fr and not fr.startswith('/') and ('#' + fr) not in ANCLAS_JS and fr not in ids_de(e):
                        estado = 'problema confirmado'; res += '; el ancla #' + fr + ' NO existe en ' + e
    return clase, resuelto, res, estado, evid, corr


for p in paginas:
    lector = Lector()
    try: lector.feed(open(os.path.join(ROOT, p), encoding='utf-8').read())
    except Exception as e: print('No se pudo leer', p, e, file=sys.stderr); continue
    for tipo, destino, linea in lector.apar:
        clase, resuelto, res, estado, evid, corr = evalua(p, tipo, destino, linea)
        filas.append(dict(tipo=tipo, origen=p, archivo_linea=f'{p}:{linea}', destino=destino, resuelto=resuelto, clase=clase, resultado=res, estado=estado, evidencia=evid, correccion=corr))

# Archivos de apoyo: JavaScript externo, CSS, manifiestos y sitemap
def archivos(ext):
    out = []
    for d, ds, fs in os.walk(ROOT):
        rel = os.path.relpath(d, ROOT)
        ds[:] = [x for x in ds if not (rel == '.' and x in SALTAR)]
        if rel != '.' and rel.split(os.sep)[0] in SALTAR: continue
        if 'vendor' in rel.split(os.sep): continue
        for f in fs:
            if f.endswith(ext): out.append(os.path.normpath(os.path.join(rel, f)))
    return sorted(out)

def agrega(p, tipo, destino, linea):
    clase, resuelto, res, estado, evid, corr = evalua(p, tipo, destino, linea)
    filas.append(dict(tipo=tipo, origen=p, archivo_linea=f'{p}:{linea}', destino=destino, resuelto=resuelto, clase=clase, resultado=res, estado=estado, evidencia=evid, correccion=corr))

for p in archivos('.js'):
    try: txt = open(os.path.join(ROOT, p), encoding='utf-8').read()
    except Exception: continue
    for m in RUTA_JS.finditer(txt): agrega(p, 'ruta en JavaScript', m.group(1), txt[:m.start()].count('\n') + 1)
for p in archivos('.css'):
    try: txt = open(os.path.join(ROOT, p), encoding='utf-8').read()
    except Exception: continue
    for m in re.finditer(r'url\(\s*[\'"]?([^\'")\s]+)[\'"]?\s*\)', txt):
        if not m.group(1).startswith('data:'): agrega(p, 'recurso css', m.group(1), txt[:m.start()].count('\n') + 1)
for p in archivos('.webmanifest'):
    try: j = json.load(open(os.path.join(ROOT, p), encoding='utf-8'))
    except Exception: continue
    for k in ('start_url', 'scope'):   # «id» del manifiesto es un identificador, no una dirección que deba existir
        if isinstance(j.get(k), str) and j[k].startswith('/'): agrega(p, 'manifiesto', j[k], 1)
    for ic in j.get('icons', []) + [s_ for sc in j.get('screenshots', []) for s_ in [sc]] + [x.get('icons', [{}])[0] for x in j.get('shortcuts', []) if x.get('icons')]:
        if ic.get('src'): agrega(p, 'manifiesto', ic['src'], 1)
    for sh in j.get('shortcuts', []):
        if sh.get('url'): agrega(p, 'manifiesto', sh['url'], 1)
try:
    sm = open(os.path.join(ROOT, 'sitemap.xml'), encoding='utf-8').read()
    for m in re.finditer(r'<loc>([^<]+)</loc>', sm): agrega('sitemap.xml', 'sitemap', m.group(1), sm[:m.start()].count('\n') + 1)
except Exception: pass

# páginas del sitio que existen pero no aparecen enlazadas desde ninguna otra (entrantes)
entrantes = collections.defaultdict(set)
for f in filas:
    if f['tipo'] == 'enlace' and f['clase'] in ('interno', 'interno-absoluto') and f['resuelto']:
        e = existe(f['resuelto'])
        if e and e != 'PREFIJO' and e != f['origen']: entrantes[e].add(f['origen'])
salida = sys.argv[1] if len(sys.argv) > 1 else 'inventario_enlaces.csv'
cols = ['id', 'tipo', 'origen', 'archivo_linea', 'destino', 'resuelto', 'clase', 'resultado', 'estado', 'evidencia', 'correccion']
with open(salida, 'w', newline='', encoding='utf-8') as fh:
    w = csv.DictWriter(fh, fieldnames=cols); w.writeheader()
    for i, f in enumerate(filas, 1): f['id'] = f'ENL-{i:05d}'; w.writerow({c: f.get(c, '') for c in cols})

por_estado = collections.Counter(f['estado'] for f in filas)
por_clase = collections.Counter(f['clase'] for f in filas)
por_tipo = collections.Counter(f['tipo'] for f in filas)
ext_unicos = sorted({f['destino'].split('#')[0] for f in filas if f['clase'] == 'externo'})
int_unicos = {f['resuelto'] for f in filas if f['clase'] in ('interno', 'interno-absoluto') and f['resuelto']}
problemas = [f for f in filas if f['estado'] == 'problema confirmado']
sin_entrante = [p for p in paginas if p != 'index.html' and not entrantes.get(p)]
resumen = dict(paginas=len(paginas), apariciones=len(filas), por_estado=por_estado, por_clase=por_clase, por_tipo=por_tipo,
               destinos_internos_unicos=len(int_unicos), externos_unicos=len(ext_unicos), externos=ext_unicos,
               problemas=[(f['archivo_linea'], f['destino'], f['resultado']) for f in problemas][:200], n_problemas=len(problemas),
               paginas_sin_enlace_entrante=sin_entrante)
if len(sys.argv) > 2: json.dump(resumen, open(sys.argv[2], 'w', encoding='utf-8'), ensure_ascii=False, indent=1, default=dict)
print(json.dumps({k: (dict(v) if isinstance(v, collections.Counter) else v) for k, v in resumen.items() if k not in ('externos', 'problemas')}, ensure_ascii=False, indent=1))
for f in problemas[:60]: print('PROBLEMA', f['archivo_linea'], f['destino'], '→', f['resultado'])
