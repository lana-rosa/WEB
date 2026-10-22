#!/usr/bin/env python3
"""Arma INVENTARIO_PAGINAS.csv y REGISTRO_HALLAZGOS.csv de la auditoría 360 a partir de los datos medidos (solo lectura).

    python3 herramientas/auditoria-360/scripts/construir_entregables.py <carpeta_datos> <carpeta_salida>

<carpeta_datos> debe traer: inventario_paginas.csv (rastrear.py + analizar_rastreo.py), rastreo.json, pasada2.json, rendimiento.json,
lista58.json, out/enlaces.csv y out/enlaces_resumen.json, sitemap_urls.txt.
"""
import csv, json, os, re, shutil, sys, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from hallazgos_datos import HALLAZGOS, REVERIFICACION

D = sys.argv[1]; S = sys.argv[2]; os.makedirs(S, exist_ok=True); os.makedirs(os.path.join(S, 'datos'), exist_ok=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
cargar = lambda f: json.load(open(os.path.join(D, f), encoding='utf-8'))
filas = {r['ruta']: r for r in csv.DictReader(open(os.path.join(D, 'inventario_paginas.csv'), encoding='utf-8'))}
lista58 = cargar('lista58.json'); pasada2 = cargar('pasada2.json'); rend = cargar('rendimiento.json')
sitemap = {l.strip() for l in open(os.path.join(D, 'sitemap_urls.txt'), encoding='utf-8') if l.strip()}
enlaces = list(csv.DictReader(open(os.path.join(D, 'out', 'enlaces.csv'), encoding='utf-8')))

def archivo_de(ruta):
    r = ruta.split('#')[0].split('?')[0]
    if r == '/': return 'index.html'
    if r.endswith('/'): return r.strip('/') + '/index.html'
    return r.lstrip('/')

# ---------------------------------------------------------------- propósito de cada página (a mano para las de servicio; el resto sale del título)
PROPOSITO = {
 '/': 'Inicio de Lana Rosa Crochet: propuesta (amigurumis personalizados), recorrido a Tienda y Personaliza, recomendador de regalos y preguntas frecuentes.',
 '/tienda.html': 'Catálogo en línea de amigurumis, peluches, llaveros, flores y complementos, con ficha, carrito y pago con Wompi.',
 '/personaliza.html': 'Pedir un amigurumi personalizado a partir de una foto (asistente o formulario), con cotización o pago del precio base.',
 '/precios.html': 'Rangos de precio, plazos y forma de pago de los personalizados.',
 '/aprende.html': 'Aprender crochet: talleres, tutoriales y lista de espera.',
 '/sobre-nosotras.html': 'Historia del taller y del equipo.',
 '/contacto.html': 'Datos de contacto (WhatsApp, correo, taller, redes) y guía de qué canal usar.',
 '/preguntas-frecuentes.html': 'Preguntas frecuentes de la tienda: personalizados, pedidos, pagos y envíos.',
 '/politicas.html': 'Políticas de cambios, envíos, datos personales, cookies, membresía y uso de IA.',
 '/merceria/': 'Inicio de la Mercería: categorías de insumos, aviso «Muy pronto» y Rosina.',
 '/merceria/catalogo/': 'Catálogo de insumos (lanas, hilos, agujas…) leído en vivo de la base; hoy en «Muy pronto» con botón «Avísame cuando abra».',
 '/merceria/tienda-fisica/': 'Tienda física de Villamaría: horario, cómo llegar y apertura del 15-nov.',
 '/merceria/rosina/': 'El universo de Rosina visto desde la Mercería (colores y recursos de la casa).',
 '/merceria/preguntas-frecuentes/': 'Preguntas frecuentes de la Mercería.',
 '/merceria/terminos-de-venta/': 'Términos de venta de la Mercería.',
 '/merceria/cambios-y-devoluciones/': 'Política de cambios y devoluciones de la Mercería.',
 '/merceria/como-comprar/': 'Cómo comprar en la Mercería: pasos, pago, envío contraentrega y descuento.',
 '/academy/': 'Inicio de Lana Rosa Academy: talleres, clases particulares y recursos.',
 '/academy/rosina/': 'El universo de Rosina visto desde Academy.',
 '/academy/preguntas-frecuentes/': 'Preguntas frecuentes de Academy.',
 '/academy/talleres/': 'Talleres y clases particulares: precios, duración y lista de espera.',
 '/academy/empieza-aqui/': 'Guía para empezar a tejer desde cero.',
 '/academy/sobre-academy/': 'Qué es Academy y quién enseña.',
 '/universo-rosina.html': 'Portada del universo de Rosina y recomendador «Rosina te ayuda a regalar».',
 '/recursos-rosina.html': 'Recursos gratis (stickers, fondos, íconos, checklist) con la puerta de cuenta gratuita.',
 '/glosario-rosina.html': 'Glosario de crochet con abreviaturas en varios idiomas y buscador.',
 '/paletas-rosina.html': 'Paletas de color para tejer.',
 '/agenda-rosina.html': 'Agenda para tejedoras emprendedoras (hojas de pedidos, inventario, costos) gratis con cuenta.',
 '/calculadoras-rosina.html': 'Calculadoras de lana, costos, aumentos y muestra.',
 '/aventuras-de-rosina/': 'Cuento interactivo para niñas y niños: la gran aventura de la primera cadeneta (sin cuentas ni cookies).',
 '/aventuras-de-rosina/privacidad.html': 'Política de privacidad de las familias para el cuento.',
 '/revista.html': 'Portada de la Revista: tarjetas con filtro por casa y categoría.',
 '/cuenta.html': 'Cuenta de clienta: ingreso con Google o enlace al correo, pedidos, favoritos, direcciones y mensajes.',
 '/gracias.html': 'Confirmación del pago: lee el estado del pedido en el servidor y vacía el carrito.',
 '/baja-recordatorios.html': 'Baja de los recordatorios de carrito abandonado (llega desde el correo).',
 '/p/': 'Página que abre el código QR de cada pieza: historia, material y cuidados; sin código, cuidados generales.',
 '/404.html': 'Página de error 404 («se nos destejió»).',
 '/offline.html': 'Pantalla sin conexión de las apps instaladas.',
 '/3d-prueba.html': 'Página técnica oculta para probar el visor 3D y la realidad aumentada.',
 '/revista/': 'Redirección a /revista.html (carpeta con index.html).',
 '/rosina.html': 'Redirección al universo de Rosina (antigua página «Conoce a Rosina»).',
 '/ruta-que-no-existe-auditoria/': 'Sonda de error 404 de la auditoría (el servidor local responde con su página, no con 404.html).',
 '/p/?i=00000000-0000-0000-0000-000000000000&o=etiqueta': 'Variante de /p/ con un código de pieza inexistente.',
 '/universo-rosina.html?casa=merceria': 'Variante que redirige al hub de Rosina de la Mercería.',
 '/tienda.html?producto=00000000-0000-0000-0000-000000000000': 'Variante de la tienda con un producto inexistente en la dirección.',
 '/aventuras-de-rosina/#/mapa': 'Ruta interna del cuento: mapa.',
 '/aventuras-de-rosina/#/ayuda': 'Ruta interna del cuento: ayuda.',
 '/aventuras-de-rosina/#/adultos': 'Ruta interna del cuento: guía para adultos.',
 '/calculadoras-rosina.html#lana': 'Calculadora de lana (ancla resuelta por JavaScript).',
 '/personaliza.html?modo=guiado': 'Personaliza en modo asistente.',
 '/cuenta.html?volver=recursos-rosina.html': 'Cuenta con retorno a Recursos (flujo de descarga gratis).',
}
# ---------------------------------------------------------------- pruebas que cubren cada página
tiene_menu = lambda r: 'nav-movil-panel' in open(os.path.join(RAIZ, archivo_de(r)), encoding='utf-8').read() if os.path.exists(os.path.join(RAIZ, archivo_de(r))) else False
SIN_MENU_TEST = {'/aventuras-de-rosina/', '/aventuras-de-rosina/privacidad.html', '/404.html', '/offline.html', '/3d-prueba.html', '/baja-recordatorios.html', '/rosina.html'}
PRUEBAS = collections.defaultdict(list)
def pr(rutas, *t):
    for r in rutas: PRUEBAS[r].extend(t)
pr(['/'], 'probar_regalar (formulario del inicio)', 'probar_rosina_chat', 'prueba_consentimiento (pasos 1-5)')
pr(['/tienda.html'], 'probar_flujos_tienda (búsqueda, ficha, carrito, pago de 4 pasos)', 'probar_ampliar', 'probar_xss_catalogo', 'prueba_consentimiento (pasos 1-5)')
pr(['/personaliza.html', '/personaliza.html?modo=guiado'], 'probar_crear', 'probar_fotos_autorizacion', 'probar_ampliar')
pr(['/aprende.html', '/academy/', '/academy/talleres/'], 'probar_lista_espera')
pr(['/contacto.html'], 'probar_flujos_servicio (enlaces de contacto)')
pr(['/preguntas-frecuentes.html'], 'probar_flujos_servicio (teclado)')
pr(['/merceria/catalogo/'], 'probar_aviso_merceria')
pr(['/merceria/rosina/', '/academy/rosina/', '/universo-rosina.html', '/universo-rosina.html?casa=merceria'], 'probar_rosina_casas')
pr(['/universo-rosina.html'], 'probar_regalar', 'probar_colores')
pr(['/recursos-rosina.html', '/cuenta.html?volver=recursos-rosina.html'], 'probar_suscripcion', 'probar_flujos_servicio (descargas con puerta)')
pr(['/glosario-rosina.html'], 'probar_flujos_servicio (buscador)')
pr(['/agenda-rosina.html'], 'probar_flujos_servicio (puerta de cuenta)')
pr(['/calculadoras-rosina.html', '/calculadoras-rosina.html#lana'], 'probar_flujos_servicio (calculadora de lana)')
pr(['/aventuras-de-rosina/', '/aventuras-de-rosina/privacidad.html', '/aventuras-de-rosina/#/mapa', '/aventuras-de-rosina/#/ayuda', '/aventuras-de-rosina/#/adultos'], 'aventuras-de-rosina/probar.py (82)')
pr(['/revista.html', '/revista/'], 'probar_flujos_servicio (filtros)')
pr(['/cuenta.html'], 'probar_flujos_servicio (correo inválido, casillas, sin contraseña)')
pr(['/gracias.html'], 'probar_flujos_servicio (pagado, rechazado, pendiente, inválida)')
pr(['/baja-recordatorios.html'], 'probar_flujos_servicio (token válido, inválido, fallo)')
pr(['/404.html', '/offline.html'], 'probar_flujos_servicio')
pr(['/p/', '/p/?i=00000000-0000-0000-0000-000000000000&o=etiqueta'], 'probar_qr', 'probar_historias', 'probar_visor3d')
pr(['/3d-prueba.html'], 'probar_visor3d')
for r in list(filas):
    if r not in SIN_MENU_TEST and tiene_menu(r) and not r.startswith('/revista/') or (r.startswith('/revista/') and r != '/revista/' and tiene_menu(r)):
        PRUEBAS[r].insert(0, 'probar_menus')

# ---------------------------------------------------------------- hallazgos por página (los específicos y los medidos en cada página)
ESPECIFICOS = {
 '/': ['SEG-04', 'REN-01', 'UX-01', 'PRI-01'], '/tienda.html': ['SEG-04', 'ACC-03', 'PRI-01', 'REN-01'],
 '/personaliza.html': ['SEG-04'], '/personaliza.html?modo=guiado': ['SEG-04'],
 '/preguntas-frecuentes.html': ['CON-02'], '/politicas.html': ['PRI-02', 'CON-03'],
 '/merceria/': ['SEG-04'], '/merceria/catalogo/': ['ARQ-02', 'UX-01'], '/cuenta.html': ['SEG-04'], '/cuenta.html?volver=recursos-rosina.html': ['SEG-04'],
 '/gracias.html': ['PRI-01'], '/baja-recordatorios.html': ['ACC-01', 'ACC-06'], '/404.html': ['ACC-01'],
 '/academy/empieza-aqui/': ['ACC-05'], '/p/': ['ACC-05'], '/p/?i=00000000-0000-0000-0000-000000000000&o=etiqueta': ['ACC-05'],
 '/agenda-rosina.html': ['CON-01', 'ACC-06', 'REN-01'], '/recursos-rosina.html': ['REN-01'], '/calculadoras-rosina.html': ['ACC-06'], '/calculadoras-rosina.html#lana': ['ACC-06'],
 '/merceria/rosina/': ['ACC-06'], '/academy/rosina/': ['ACC-06'], '/universo-rosina.html?casa=merceria': ['ACC-06'],
 '/aventuras-de-rosina/': ['REN-02', 'UX-02'], '/contacto.html': ['PRI-03', 'PRI-04'], '/merceria/cambios-y-devoluciones/': ['PRI-04'], '/aventuras-de-rosina/privacidad.html': ['PRI-04'],
 '/merceria/como-comprar/': ['CON-03'],
}
sin_pie = {'/aventuras-de-rosina/', '/aventuras-de-rosina/privacidad.html', '/offline.html', '/3d-prueba.html', '/aventuras-de-rosina/#/mapa', '/aventuras-de-rosina/#/ayuda', '/aventuras-de-rosina/#/adultos'}
def hallazgos_de(ruta, r):
    ids = list(ESPECIFICOS.get(ruta, []))
    if 'label-content-name-mismatch' in (r['axe_390'] or ''): ids.append('ACC-04')
    if int(r['objetivos_pequenos_24px'] or 0) > 0: ids.append('ACC-07')
    if ruta not in sin_pie and ruta not in ('/ruta-que-no-existe-auditoria/',): ids.append('ACC-02')
    if ruta in pasada2['saltar'] and not pasada2['saltar'][ruta]: ids.append('ACC-08')
    if ruta in sitemap and (int(r['len_titulo'] or 0) > 60 or int(r['len_descripcion'] or 0) > 160): ids.append('SEO-01')
    if ruta in sitemap: ids.append('SEO-02')
    vistos = []; [vistos.append(x) for x in ids if x not in vistos]
    return vistos
COMUNES = {'ACC-02', 'ACC-04', 'ACC-07', 'ACC-08', 'SEO-01', 'SEO-02'}   # medidos en muchas páginas: se listan aparte
prioridad_de = {h['id']: h['prioridad'] for h in HALLAZGOS}
def maxima(ids):
    p = [prioridad_de[i] for i in ids if i in prioridad_de]
    return min(p) if p else '—'

# ---------------------------------------------------------------- estado en producción
def produccion(ruta):
    if ruta in sitemap: return 'Verificada (200): el rastreo de GitHub del 22-oct 19:53 UTC (ejecución 42) pide todo el mapa del sitio y no halló ninguna ruta distinta de 200'
    if ruta in ('/cuenta.html', '/p/'): return 'Alcanzable por enlaces: el rastreo no halló rutas distintas de 200 pero no lista cada ruta; no se puede afirmar una por una'
    if ruta in ('/gracias.html', '/baja-recordatorios.html', '/404.html', '/offline.html', '/3d-prueba.html'): return 'No verificada: sin enlaces entrantes, el rastreo no llega; abrir a mano'
    return 'No aplica (variante, redirección o sonda de la auditoría)'

grupo_de = {u: g for g, u in lista58}
en58 = set(grupo_de)
orden = [u for _, u in lista58] + [u for u in filas if u not in en58]
cols = ['id', 'grupo', 'ruta', 'url_completa', 'en_las_58', 'estado_http_local', 'estado_produccion', 'proposito', 'navegacion_y_casa', 'indexacion', 'canonical',
        'titulo', 'len_titulo', 'len_descripcion', 'h1', 'saltos_encabezados', 'og_completo', 'datos_estructurados', 'imagenes_sin_alt', 'enlaces_internos_externos',
        'axe_390', 'axe_1280', 'desborde_horizontal_390_1280', 'reflujo_320', 'errores_javascript', 'objetivos_menores_24px', 'teclado_foco_saltar',
        'rendimiento_laboratorio', 'pruebas_que_la_cubren', 'ux_observaciones', 'hallazgos_propios', 'hallazgos_comunes', 'prioridad_maxima_propios', 'cobertura', 'limitaciones']
salida = []
cuenta_cob = collections.Counter()
ENL = collections.defaultdict(lambda: collections.Counter())
for e in enlaces: ENL[e['origen']][e['clase']] += 1
for i, ruta in enumerate(orden, 1):
    r = filas[ruta]; en = ruta in en58
    es_redir = ruta in ('/revista/', '/rosina.html', '/universo-rosina.html?casa=merceria')
    indexa = 'noindex' if (r['noindex'] == 'sí' or es_redir or ruta in ('/cuenta.html', '/gracias.html', '/baja-recordatorios.html', '/p/')) else 'indexable'
    if ruta in ('/cuenta.html?volver=recursos-rosina.html', '/p/?i=00000000-0000-0000-0000-000000000000&o=etiqueta'): indexa = 'noindex'
    indexa += ' · ' + ('en el mapa del sitio' if ruta in sitemap else 'fuera del mapa')
    canon = r['canonical']
    if ruta == '/rosina.html': canon = '/universo-rosina.html#conoce-a-rosina (fuente)'
    if ruta == '/revista/': canon = '/revista.html (fuente)'
    p320 = pasada2['reflujo320'].get(ruta)
    refl = ('sin desplazamiento horizontal (scroll %s = ancho %s)' % (p320['scroll'], p320['inner'])) if p320 and p320['scroll'] == p320['inner'] else ('desborda' if p320 else 'no medido')
    foco = pasada2['foco'].get(ruta)
    teclado = ''
    if foco:
        sk = pasada2['saltar'].get(ruta)
        teclado = '%d tabulaciones recorridas; sin indicador de foco: %s; enlace «Saltar al contenido»: %s' % (foco['tabulados'], (', '.join(x.split('|')[-1] for x in foco['sin_indicador']) or 'ninguno'), 'sí' if sk else 'no')
    rd = rend.get(ruta)
    if rd:
        m = rd['metricas']; rend_txt = '%d solicitudes; %d KB comprimidos (est.); LCP %.1f s; CLS %.3f; bloqueo %d ms; %d nodos' % (rd['solicitudes'], round(rd['bytes_gzip_estimado'] / 1024), m.get('lcp', 0) / 1000, m.get('cls', 0), m.get('tbt', 0), m.get('nodos', 0))
    else: rend_txt = 'no medido'
    nav = r['area']
    if ruta in ('/revista/', '/rosina.html'): nav = r['area'] + ' (redirección)'
    ids = [] if es_redir else hallazgos_de(ruta, r)
    tests = PRUEBAS.get(ruta, [])
    funcional = [t for t in tests if t != 'probar_menus']
    cobertura = 'Rastreo automático completo (HTTP, SEO, axe-core, errores JS, desbordes en 390 y 1280 px)'
    if funcional: cobertura += ' + pruebas funcionales con datos simulados'
    if foco: cobertura += ' + teclado'
    if rd: cobertura += ' + rendimiento de laboratorio'
    lim = []
    if ruta in ('/revista/', '/rosina.html', '/universo-rosina.html?casa=merceria'): lim.append('las métricas del rastreo son las de la página de destino (la redirección corre en el navegador); los datos de indexación vienen del código fuente')
    if ruta == '/ruta-que-no-existe-auditoria/': lim.append('el servidor local no sirve 404.html; no representa a producción')
    if 'merceria/catalogo' in ruta or ruta in ('/tienda.html', '/'): lim.append('datos de la base simulados: no se vio el catálogo real')
    if ruta in ('/cuenta.html', '/gracias.html'): lim.append('inicio de sesión con Google, envío de correos y pago real no se pudieron probar')
    if ruta in ('/p/',): lim.append('lectura del código QR impreso y realidad aumentada sin probar en teléfono real')
    if ruta.startswith('/aventuras'): lim.append('validación pedagógica y de términos de las imágenes, pendientes de la experta y la abogada')
    lim.append('sin lector de pantalla real; revisión humana de redacción solo dirigida (ortografía, precios, plazos y valores de marca automatizados)')
    cob_clase = 'Reforzada' if (en and (funcional or foco or rd)) else ('Automática' if en else 'Variante o sonda')
    cuenta_cob[cob_clase] += 1
    ux = ''
    if ruta == '/': ux = 'Botones flotantes de Rosina y WhatsApp tapan parte de la franja de confianza a 390 px (UX-01).'
    if ruta == '/merceria/catalogo/': ux = 'Aviso «Muy pronto» claro con botón «Avísame cuando abra»; el botón flotante tapa parte del título a 390 px.'
    if ruta == '/404.html': ux = 'Mensaje claro con dos botones; el pie tiene textos casi invisibles (ACC-01).'
    if ruta == '/agenda-rosina.html': ux = 'La puerta de cuenta bloquea las hojas; el encabezado promete lo contrario (CON-01).'
    if ruta == '/personaliza.html': ux = 'Acordeones y pasos en fila deslizable a 390 px; el aviso de WhatsApp flotante se superpone a las tarjetas.'
    salida.append({
        'id': ('URL-%03d' % i) if en else ('EXTRA-%02d' % (i - 58)), 'grupo': grupo_de.get(ruta, 'Extra de la auditoría'), 'ruta': ruta, 'url_completa': 'https://lanarosacrochet.com' + ruta,
        'en_las_58': 'sí' if en else 'no', 'estado_http_local': r['estado_http'], 'estado_produccion': produccion(ruta), 'proposito': PROPOSITO.get(ruta, r['titulo']),
        'navegacion_y_casa': nav, 'indexacion': indexa, 'canonical': canon, 'titulo': r['titulo'], 'len_titulo': r['len_titulo'], 'len_descripcion': r['len_descripcion'], 'h1': r['h1'],
        'saltos_encabezados': r['saltos_de_nivel'], 'og_completo': r['og_completo'], 'datos_estructurados': r['jsonld'] or 'ninguno', 'imagenes_sin_alt': r['imgs_sin_alt'],
        'enlaces_internos_externos': '%s enlaces (%s externos en el código)' % (r['enlaces'], ENL[archivo_de(ruta)].get('externo', 0)),
        'axe_390': 'n/a (redirección)' if es_redir else (r['axe_390'] or 'sin violaciones'), 'axe_1280': 'n/a (redirección)' if es_redir else (r['axe_1280'] or 'sin violaciones'),
        'desborde_horizontal_390_1280': ('%s / %s' % (r['desborde_390'], r['desborde_1280'])), 'reflujo_320': refl, 'errores_javascript': r['errores_js'],
        'objetivos_menores_24px': r['objetivos_pequenos_24px'], 'teclado_foco_saltar': teclado or 'no medido', 'rendimiento_laboratorio': rend_txt,
        'pruebas_que_la_cubren': ' · '.join(tests) or 'solo rastreo automático', 'ux_observaciones': ux, 'hallazgos_propios': ' '.join(i for i in ids if i not in COMUNES), 'hallazgos_comunes': ' '.join(i for i in ids if i in COMUNES), 'prioridad_maxima_propios': maxima([i for i in ids if i not in COMUNES]),
        'cobertura': cob_clase + ': ' + cobertura, 'limitaciones': '; '.join(lim)})
with open(os.path.join(S, 'INVENTARIO_PAGINAS.csv'), 'w', newline='', encoding='utf-8-sig') as fh:
    w = csv.DictWriter(fh, fieldnames=cols); w.writeheader(); [w.writerow(x) for x in salida]

# ---------------------------------------------------------------- registro de hallazgos
hcols = ['id', 'prioridad', 'clase', 'area', 'titulo', 'ubicacion', 'evidencia', 'reproduccion', 'impacto', 'correccion', 'verificacion', 'origen', 'depende_de', 'estado', 'paginas_afectadas']
afect = collections.defaultdict(list)
for x in salida:
    for i in (x['hallazgos_propios'] + ' ' + x['hallazgos_comunes']).split(): afect[i].append(x['ruta'])
orden_p = {'P0': 0, 'P1': 1, 'P2': 2, 'P3': 3}
with open(os.path.join(S, 'REGISTRO_HALLAZGOS.csv'), 'w', newline='', encoding='utf-8-sig') as fh:
    w = csv.DictWriter(fh, fieldnames=hcols); w.writeheader()
    for h in sorted(HALLAZGOS, key=lambda h: (orden_p[h['prioridad']], h['id'])):
        w.writerow({**{k: h[k] for k in ('id', 'prioridad', 'clase', 'area', 'titulo', 'ubicacion', 'evidencia', 'reproduccion', 'impacto', 'correccion', 'verificacion', 'origen')},
                    'depende_de': h['depende'], 'estado': 'Abierto (sin corregir; esperando autorización)', 'paginas_afectadas': ' '.join(afect.get(h['id'], [])[:40])})

# ---------------------------------------------------------------- copias de apoyo y números
shutil.copy(os.path.join(D, 'out', 'enlaces.csv'), os.path.join(S, 'INVENTARIO_ENLACES.csv'))
shutil.copy(os.path.join(D, 'out', 'enlaces_resumen.json'), os.path.join(S, 'datos', 'enlaces_resumen.json'))
shutil.copy(os.path.join(D, 'pasada2.json'), os.path.join(S, 'datos', 'teclado_reflujo_objetivos.json'))
shutil.copy(os.path.join(D, 'rendimiento.json'), os.path.join(S, 'datos', 'rendimiento_laboratorio.json'))
with open(os.path.join(S, 'datos', 'reverificacion_auditoria_previa.csv'), 'w', newline='', encoding='utf-8-sig') as fh:
    w = csv.writer(fh); w.writerow(['id_previo', 'hallazgo_o_tema', 'estado_hoy', 'evidencia']); [w.writerow(x) for x in REVERIFICACION]
n58 = [x for x in salida if x['en_las_58'] == 'sí']
def cuantas(f): return sum(1 for x in n58 if f(x))
print('Filas:', len(salida), '| de las 58:', len(n58))
print('Cobertura por URL (58):', dict(collections.Counter(x['cobertura'].split(':')[0] for x in n58)))
print('con pruebas funcionales:', cuantas(lambda x: x['pruebas_que_la_cubren'] != 'solo rastreo automático' and any(t for t in x['pruebas_que_la_cubren'].split(' · ') if t != 'probar_menus')))
print('con probar_menus:', cuantas(lambda x: 'probar_menus' in x['pruebas_que_la_cubren']))
print('con teclado:', cuantas(lambda x: x['teclado_foco_saltar'] != 'no medido'), '| con rendimiento:', cuantas(lambda x: x['rendimiento_laboratorio'] != 'no medido'), '| con reflujo 320:', cuantas(lambda x: x['reflujo_320'] != 'no medido'))
print('producción verificada (sitemap):', cuantas(lambda x: x['estado_produccion'].startswith('Verificada')), '| alcanzable:', cuantas(lambda x: x['estado_produccion'].startswith('Alcanzable')), '| no verificada:', cuantas(lambda x: x['estado_produccion'].startswith('No verificada')))
print('hallazgos:', len(HALLAZGOS), dict(collections.Counter(h['prioridad'] for h in HALLAZGOS)), dict(collections.Counter(h['clase'] for h in HALLAZGOS)))
print('páginas con ≥1 hallazgo específico (sin SEO-02/ACC-02/ACC-04/ACC-07/ACC-08/SEO-01):', cuantas(lambda x: bool(x['hallazgos_propios'].strip())))
