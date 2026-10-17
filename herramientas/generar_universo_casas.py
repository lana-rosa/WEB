#!/usr/bin/env python3
"""Genera el hub «El universo de Rosina» de Mercería y de Academy a partir de universo-rosina.html (el de la Tienda) y mantiene
el bloque «Material gratis de Rosina» (entre <!-- RECURSOS:INICIO --> y <!-- RECURSOS:FIN -->) de las tres versiones.

Una sola fuente: RECURSOS (qué se ve en cada casa). Uso: python3 herramientas/generar_universo_casas.py y luego
python3 herramientas/sincronizar_encabezado.py (menú, pie y colores de cada casa).
"""
import os, re
RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
BASE = os.path.join(RAIZ, 'universo-rosina.html')

# (icono, título, descripción corta, enlace)
R = {
    'glosario': ('🔤', 'Glosario ilustrado', '30 términos de crochet explicados', '/glosario-rosina.html'),
    'abrev': ('📖', 'Abreviaturas en 9 idiomas', 'Para leer cualquier patrón', '/recursos-rosina.html#abreviaturas'),
    'paletas': ('🎨', 'Paletas de color', 'Combinaciones para tus proyectos', '/paletas-rosina.html'),
    'calc': ('🧮', 'Calculadoras', 'Cuánta lana, qué gancho y más', '/calculadoras-rosina.html'),
    'agenda': ('📅', 'Agenda de Rosina', 'Organiza tus proyectos de tejido', '/agenda-rosina.html'),
    'checklist': ('✅', 'Checklist: tu primer amigurumi', 'Lo que necesitas, paso a paso', '/recursos-rosina.html#checklist'),
    'regalos': ('💝', 'Stickers, fondos e íconos', 'Regalos de Rosina para tu celular', '/recursos-rosina.html'),
    'cuida': ('🧺', 'Cuida tu pieza', 'Cómo lavar y guardar tu amigurumi', '/p/'),
    'conoce': ('🐑', 'Conoce a Rosina', 'Quién es y por qué nos acompaña', '#conoce-a-rosina'),
    'todo': ('🎁', 'Todo el Rincón de Rosina', 'El material gratuito completo', '/recursos-rosina.html'),
}
RECURSOS = {
    'crochet': ['cuida', 'regalos', 'glosario', 'abrev'],
    'merceria': ['calc', 'paletas', 'glosario', 'abrev'],
    'academy': ['agenda', 'glosario', 'abrev', 'checklist', 'calc', 'paletas', 'regalos'],
}
CASAS = {
    'merceria': ('merceria/rosina/index.html', 'Mercería Lana Rosa', 'Rosina te ayuda a elegir tus materiales y a inspirarte para tu próximo proyecto.'),
    'academy': ('academy/rosina/index.html', 'Lana Rosa Academy', 'Rosina te ayuda a aprender a tejer, inspirarte y, para los más pequeños, dar su primera cadeneta.'),
}

def bloque(casa):
    ids = RECURSOS[casa]
    tarjetas = ''.join(f'\n      <a class="recurso" href="{R[k][3]}"><span class="ico" aria-hidden="true">{R[k][0]}</span><strong>{R[k][1]}</strong><span class="sub">{R[k][2]}</span></a>' for k in ids)
    return ('<!-- RECURSOS:INICIO (generado por herramientas/generar_universo_casas.py) -->\n  <section class="ur-recursos" aria-labelledby="titulo-recursos">\n'
            '    <h2 id="titulo-recursos">Material gratis de Rosina</h2>\n    <p>Herramientas y guías para tejer, sin costo.</p>\n'
            f'    <div class="recursos">{tarjetas}\n    </div>\n  </section>\n  <!-- RECURSOS:FIN -->')

def poner_bloque(s, casa):
    if '<!-- RECURSOS:INICIO' in s:
        return re.sub(r'<!-- RECURSOS:INICIO.*?<!-- RECURSOS:FIN -->', lambda m: bloque(casa), s, flags=re.S)
    return s.replace('  <script>\n  // El Universo muestra solo lo de la casa', '  ' + bloque(casa) + '\n  <script>\n  // El Universo muestra solo lo de la casa', 1)

def _botones(a, b):
    return f'<p class="ur-botones"><a class="ur-boton" href="{a[1]}">{a[0]}</a><a class="ur-boton ur-boton-2" href="{b[1]}">{b[0]}</a></p>'
# Botones bajo el título y llamado final de cada casa: (botón principal, botón secundario) y texto del cierre
CTA = {
    'crochet': (('Personaliza el tuyo', '/personaliza.html'), ('Ver la tienda', '/tienda.html')),
    'merceria': (('Ver el catálogo', '/merceria/catalogo/'), ('Calcula tu lana', '/calculadoras-rosina.html#lana')),
    'academy': (('Talleres y clases', '/academy/talleres/'), ('Tutoriales gratis', '/aprende.html')),
}
CIERRE = {
    'crochet': ('¿Prefieres que Rosina te ayude a crear el tuyo?', 'Cuéntale tu idea y la tejemos a mano.', ('Crear con Rosina', '/personaliza.html?modo=guiado#pide-el-tuyo'), ('Ver la tienda', '/tienda.html')),
    'merceria': ('¿Ya sabes qué vas a tejer?', 'Elige tus lanas e hilos en el catálogo o calcula cuánta lana necesitas.', ('Ver el catálogo', '/merceria/catalogo/'), ('Calcula tu lana', '/calculadoras-rosina.html#lana')),
    'academy': ('¿Quieres empezar a tejer?', 'Aprende paso a paso con los talleres y los tutoriales gratis de Rosina.', ('Talleres y clases', '/academy/talleres/'), ('Tutoriales gratis', '/aprende.html')),
}

def poner_cta(s, casa):
    s = re.sub(r'<!-- CTA:INICIO.*?<!-- CTA:FIN -->', lambda m: '<!-- CTA:INICIO (generado por herramientas/generar_universo_casas.py) -->\n  ' + _botones(*CTA[casa]) + '\n  <!-- CTA:FIN -->', s, flags=re.S)
    t, d, a, b = CIERRE[casa]
    return re.sub(r'<!-- CIERRE:INICIO.*?<!-- CIERRE:FIN -->', lambda m: ('<!-- CIERRE:INICIO (generado por herramientas/generar_universo_casas.py) -->\n  <section class="ur-final" aria-labelledby="titulo-cierre">\n'
        f'    <h2 id="titulo-cierre">{t}</h2>\n    <p>{d}</p>\n    {_botones(a, b)}\n  </section>\n  <!-- CIERRE:FIN -->'), s, flags=re.S)

def main():
    base = open(BASE, encoding='utf-8').read()
    # 1) Tienda: el bloque de recursos y la redirección a los hubs de Mercería y Academy
    s = poner_cta(poner_bloque(base, 'crochet'), 'crochet')
    if 'REDIRIGE-CASA' not in s:
        s = s.replace('<meta name="viewport"', '<script>/* REDIRIGE-CASA */try{var _q=new URLSearchParams(location.search).get("casa");if(_q==="merceria")location.replace("/merceria/rosina/"+location.hash);else if(_q==="academy")location.replace("/academy/rosina/"+location.hash)}catch(e){}</script>\n<meta name="viewport"', 1)
    open(BASE, 'w', encoding='utf-8').write(s)
    # 2) Hubs de Mercería y Academy
    for casa, (ruta, nombre, intro) in CASAS.items():
        t = s
        t = re.sub(r'<script>/\* REDIRIGE-CASA \*/.*?</script>\n', '', t, flags=re.S)
        url = f'https://lanarosacrochet.com/{ruta[:-len("index.html")]}'
        t = t.replace('<title>El universo de Rosina | Lana Rosa Crochet</title>', f'<title>El universo de Rosina | {nombre}</title>')
        t = t.replace('https://lanarosacrochet.com/universo-rosina.html', url)
        t = re.sub(r'(<p class="eslogan" id="ur-casa"[^>]*>)[^<]*', lambda m: m.group(1) + nombre, t)
        t = re.sub(r'(<p id="ur-intro">)[^<]*', lambda m: m.group(1) + intro, t)
        t = poner_cta(poner_bloque(t, casa), casa)
        # recorridos de esa casa; el filtro por ?casa= ya no hace falta
        def recorrido(m):
            a = m.group(0)
            casas = re.search(r'data-casas="([^"]*)"', a).group(1).split()
            if casa not in casas: return ''
            a = a.replace(' hidden', '').replace('href="/revista.html"', f'href="/revista.html?casa={casa}"')
            return a
        t = re.sub(r'    <a class="recorrido".*?</a>\n', recorrido, t, flags=re.S)
        # sin buscador de regalos no hay grupos: se quitan los títulos «Para regalar y crear» / «Para aprender y jugar» y las filas vacías
        t = re.sub(r'  <h2 class="ur-grupo"[^>]*>[^<]*</h2>\n', '', t)
        t = re.sub(r'  <nav class="recorridos"[^>]*>\s*</nav>\n', '', t)
        t = t.replace(' aria-labelledby="grupo-regalar"', '').replace(' aria-labelledby="grupo-aprender"', '')
        t = re.sub(r'  <script>\n  // El Universo muestra solo lo de la casa.*?</script>\n\n', '', t, flags=re.S)
        t = re.sub(r'  <section class="ur-seccion-regalar".*?</section>\n', '', t, flags=re.S)
        t = re.sub(r"import \{ iniciarRegalar \} from '/js/universo/regalar.js';\nvar casaUr.*?\nif \(document.getElementById\('regalar-raiz'\)\) iniciarRegalar\(document.getElementById\('regalar-raiz'\)\);\n", '', t, flags=re.S)
        t = t.replace('<meta property="og:description" content="Rosina te ayuda a elegir un regalo, crear tu amigurumi, inspirarte y aprender a tejer.">', f'<meta property="og:description" content="{intro}">')
        t = t.replace('<meta name="description" content="Rosina te ayuda a regalar, crear, inspirarte y aprender: encuentra un amigurumi para esa persona especial con productos reales de Lana Rosa.">', f'<meta name="description" content="{intro}">')
        t = t.replace('<link rel="stylesheet" href="/css/universo.css?v=13">', '<link rel="stylesheet" href="/css/universo.css?v=14">')
        os.makedirs(os.path.dirname(os.path.join(RAIZ, ruta)), exist_ok=True)
        open(os.path.join(RAIZ, ruta), 'w', encoding='utf-8').write(t)
        print('ok', ruta, len(RECURSOS[casa]), 'recursos')

main()
