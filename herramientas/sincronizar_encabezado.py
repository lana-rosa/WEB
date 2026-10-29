#!/usr/bin/env python3
"""Pone en todas las páginas la franja de casas, el menú de cada casa, el menú móvil y el pie.

Una sola fuente: edita CASAS / MENUS / PIE aquí y vuelve a correr
    python3 herramientas/sincronizar_encabezado.py
Los bloques quedan entre marcadores <!-- CASAS:INICIO --> ... <!-- CASAS:FIN --> y <!-- PIE:INICIO --> ... <!-- PIE:FIN -->.
"""
import re, sys, glob, os, json

RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')

# página -> casa (las que no están aquí son comunes: sin casa resaltada)
CASA_DE = {
    'index': 'crochet', 'tienda': 'crochet', 'personaliza': 'crochet', 'universo-rosina': 'crochet', 'p': 'crochet', 'precios': 'crochet',
    'merceria': 'merceria', 'merceria-catalogo': 'merceria', 'merceria-tienda-fisica': 'merceria', 'merceria-preguntas-frecuentes': 'merceria', 'academy-preguntas-frecuentes': 'academy', 'merceria-como-comprar': 'merceria', 'merceria-paleta-de-colores': 'merceria', 'merceria-terminos-de-venta': 'merceria', 'merceria-cambios-y-devoluciones': 'merceria', 'academy-talleres': 'academy', 'academy-sobre-academy': 'academy', 'academy-empieza-aqui': 'academy',
    'merceria-rosina': 'merceria', 'academy-rosina': 'academy', 'academy': 'academy', 'aprende': 'academy', 'recursos-rosina': 'academy', 'rosina': 'academy', 'glosario-rosina': 'academy',
    'paletas-rosina': 'academy', 'calculadoras-rosina': 'academy', 'agenda-rosina': 'agenda',
}
CASAS = [('crochet', 'Tienda de amigurumis', 'tienda.html'), ('merceria', 'Mercería', 'merceria/'), ('academy', 'Academy', 'academy/'), ('agenda', 'Agenda', 'agenda-rosina.html')]   # la cuarta casa, la Agenda para tejedoras (29-oct-2026)
CLASE = {'crochet': 'g-tienda', 'merceria': 'g-merceria', 'academy': 'g-aprende', 'agenda': 'g-agenda', 'comun': 'g-comun', 'universo': 'g-universo'}

# (texto, enlace, clase de color)
MENUS = {
    'crochet': [('Tienda', 'tienda.html', 'crochet'), ('Amigurumis', 'tienda.html#amigurumis', 'crochet'), ('Peluches', 'tienda.html#peluches', 'crochet'),
                ('Llaveros', 'tienda.html#llaveros', 'crochet'), ('Flores y macetas', 'tienda.html#macetas', 'crochet'),
                ('Personaliza el tuyo', 'personaliza.html', 'crochet'), ('Rosina: regalos e ideas', 'universo-rosina.html', 'universo')],
    # páginas comunes (contacto, preguntas, políticas, cuenta, Revista): menú de marca con las tres casas
    'comun': [('Tienda de amigurumis', 'index.html', 'crochet'), ('Mercería', 'merceria/', 'merceria'),
              ('Academy', 'academy/', 'academy'), ('Revista', 'revista.html', 'comun'), ('Sobre nosotras', 'sobre-nosotras.html', 'comun'), ('Rosina: regalos e ideas', 'universo-rosina.html', 'universo')],
    # Solo categorías que tienen productos en el inventario (8-oct-2026: hoy solo Lanas). Cuando se carguen Hilos, Agujas, Herrajes,
    # Accesorios o Relleno al ERP, agregar aquí su enlace (merceria/catalogo/#<categoria>-merceria) y en MOVIL['merceria'] y PIE.
    'merceria': [('Catálogo', 'merceria/catalogo/', 'merceria'), ('Paleta de colores', 'merceria/paleta-de-colores/', 'merceria'),
                 ('Tienda física', 'merceria/tienda-fisica/', 'merceria'),
                 ('Cómo comprar', 'merceria/como-comprar/', 'merceria'),
                 ('Sobre nosotras', 'sobre-nosotras.html', 'merceria'),
                 ('Ayuda', 'merceria/preguntas-frecuentes/', 'merceria'), ('Rosina: lanas e ideas', 'merceria/rosina/', 'universo')],
    'agenda': [('Mi agenda', 'agenda-rosina.html', 'agenda'), ('Aprende y compra', 'agenda-rosina.html#aprende-compra', 'agenda'),
               ('Material gratis de Rosina', 'recursos-rosina.html', 'agenda'), ('Sobre nosotras', 'sobre-nosotras.html', 'agenda'),
               ('Ayuda', 'preguntas-frecuentes.html', 'agenda')],
    'academy': [('Talleres y clases', 'academy/talleres/', 'academy'),
                ('Revista', 'revista.html?casa=academy', 'academy'),
                ('Sobre Academy', 'academy/sobre-academy/', 'academy'), ('Sobre nosotras', 'sobre-nosotras.html', 'academy'),
                ('Rosina: tutoriales y recursos', 'academy/rosina/', 'universo')],
}

# imagen del logo por casa (las demás usan el logo rosa de Lana Rosa Crochet)
LOGO_IMG = {'merceria': ('img/logo-merceria-360.webp', 'Lana Rosa Mercería'), 'academy': ('img/logo-academy-360.webp', 'Lana Rosa Academy'), 'agenda': ('img/logo-agenda-360.webp', 'Lana Rosa Agenda para tejedoras')}

# íconos de la pestaña y color de la barra del celular por casa
ICONOS = {
    'merceria': ('/img/favicon-merceria-256.png', '/img/apple-touch-icon-merceria.png', '#7C4DDB'),
    'academy': ('/img/favicon-academy-256.png', '/img/apple-touch-icon-academy.png', '#2F7DE1'),
    'agenda': ('/img/favicon-agenda-256.png', '/img/apple-touch-icon-agenda.png', '#1FB06F'),
}
ICONOS_BASE = ('/img/favicon-256.png', '/img/apple-touch-icon.png', '#E74E96')
# app instalable: manifiesto y nombre en la pantalla por casa (las páginas sin casa usan Crochet)
APP = {'merceria': ('merceria', 'Mercería Lana Rosa'), 'academy': ('academy', 'Lana Rosa Academy'), 'agenda': ('agenda', 'Agenda para tejedoras')}
APP_BASE = ('crochet', 'Lana Rosa Crochet')
def iconos(casa, pagina=None):
    ico, apple, color = ICONOS.get(casa, ICONOS_BASE)
    app = APP.get(casa, APP_BASE)
    # La agenda recuerda el color elegido: este script va aquí (dentro del bloque generado) para que el generador no lo borre.
    tema = ('<script>try{var t=localStorage.getItem("lrAgendaTema");if(t&&/^[a-z]+$/.test(t)&&t!=="menta"){document.documentElement.setAttribute("data-tema",t);'
            'if(t==="libre"){var v=JSON.parse(localStorage.getItem("lrAgendaColorVars")||"{}");for(var k in v)if(/^--[a-z0-9-]+$/.test(k)&&/^[#a-z0-9 ,.()%-]+$/i.test(v[k]))'
            'document.documentElement.style.setProperty(k,v[k])}}}catch(e){}</script>\n') if casa == 'agenda' else ''
    return (f'<!-- ICONOS:INICIO (generado) -->\n<link rel="icon" type="image/png" href="{ico}">\n'
            f'<link rel="apple-touch-icon" href="{apple}">\n<meta name="theme-color" content="{color}">\n{tema}'
            f'<link rel="manifest" href="/manifest-{app[0]}.webmanifest">\n'
            f'<meta name="apple-mobile-web-app-title" content="{app[1]}">\n<!-- ICONOS:FIN -->')

# nombre bajo el logo y destino del logo por casa
LOGO = {'crochet': ('Inicio', 'index.html'), 'merceria': ('Mercería', 'merceria/'), 'academy': ('Academy', 'academy/'), 'agenda': ('Agenda', 'agenda-rosina.html'),
        None: ('Inicio', 'index.html')}

# pie por casa: (frase, titulo de columna, enlaces)  — Crochet usa el pie original
PIE = {
    'crochet': ('Amigurumis y accesorios tejidos a mano en Manizales / Villamaría, Colombia.', 'Tienda de amigurumis',
                [('Ver catálogo', 'tienda.html'), ('Personaliza el tuyo', 'personaliza.html'), ('Precios', 'precios.html'),
                 ('Historias que tejimos', 'index.html#historias'), ('Comprar en línea', 'https://lana-rosa-crochet.cercia.co/')]),
    'merceria': ('Mercería Lana Rosa: insumos para tejedoras. Lanas e hilos para crochet. Villamaría, Caldas.', 'Mercería',
                 [('Catálogo', 'merceria/catalogo/'), ('Paleta de colores', 'merceria/paleta-de-colores/'),
                  ('Tienda física', 'merceria/tienda-fisica/'), ('Cómo comprar y envíos', 'merceria/como-comprar/'),
                  ('Términos de venta', 'merceria/terminos-de-venta/'), ('Cambios y devoluciones', 'merceria/cambios-y-devoluciones/'),
                  ('Lun a vie 7:30 a.m. a 6:15 p.m.', None), ('Sáb 8:00 a.m. a 12:00 m.', None)]),
    'academy': ('Lana Rosa Academy, academia de crochet: aprende a tejer paso a paso, sin experiencia y sin tecnicismos.', 'Academy',
                [('Inicio de Academy', 'academy/'), ('Talleres y clases', 'academy/talleres/'), ('Agenda para tejedoras', 'agenda-rosina.html'), ('Sobre Academy', 'academy/sobre-academy/'),
                 ('Empieza aquí', 'academy/empieza-aqui/'), ('Tutoriales', 'aprende.html#crea'), ('Rosina: tutoriales y material gratis', 'academy/rosina/'), ('Glosario', 'glosario-rosina.html'),
                 ('Paletas de color', 'paletas-rosina.html'), ('Calculadoras', 'calculadoras-rosina.html')]),
}

# Menú del celular propio de cada casa (las casas sin entrada usan el menú general).
MOVIL = {
    'crochet': '''  <nav class="nav-movil-panel" id="nav-movil-panel" aria-label="Navegación móvil">
    <a href="index.html">Inicio</a>
    <a href="cuenta.html"><svg class="ico-linea" width="1.1em" height="1.1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false" style="vertical-align:-.2em"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/></svg> Mi cuenta</a>
    <p class="grupo-nav">Tienda</p>
    <a href="tienda.html">Todo el catálogo</a>
    <a href="tienda.html#amigurumis">Amigurumis</a>
    <a href="tienda.html#peluches">Peluches</a>
    <a href="tienda.html#llaveros">Llaveros</a>
    <a href="tienda.html#macetas">Macetas y flores</a>
    <p class="grupo-nav">Personalizados</p>
    <a href="personaliza.html" class="nav-destacado">✨ Personaliza el tuyo</a>
    <a href="index.html#historias">Historias que tejimos</a>
    <p class="grupo-nav">Rosina</p>
    <a href="universo-rosina.html">🐑 Rosina: regalos e ideas</a>
    <p class="grupo-nav">Lana Rosa</p>
    <a href="sobre-nosotras.html">Sobre nosotras</a>
    <a href="revista.html?casa=crochet">Revista</a>
    <p class="grupo-nav">Ayuda</p>
    <a href="preguntas-frecuentes.html">Preguntas frecuentes</a>
    <a href="contacto.html">Contacto</a>
    <a href="precios.html">Precios</a>
  </nav>''',
    'merceria': '''  <nav class="nav-movil-panel" id="nav-movil-panel" aria-label="Navegación móvil">
    <a href="merceria/">Inicio de la Mercería</a>
    <a href="cuenta.html"><svg class="ico-linea" width="1.1em" height="1.1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false" style="vertical-align:-.2em"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/></svg> Mi cuenta</a>
    <p class="grupo-nav">Catálogo</p>
    <a href="merceria/catalogo/">Todo el catálogo</a>
    <a href="merceria/catalogo/#lanas-merceria">Lanas</a>
    <a href="merceria/paleta-de-colores/">Paleta de colores</a>
    <p class="grupo-nav">Visítanos</p>
    <a href="merceria/tienda-fisica/">Tienda física: horario y dirección</a>
    <p class="grupo-nav">Rosina</p>
    <a href="merceria/rosina/">🐑 Rosina: tu lana, ideas y material gratis</a>
    <p class="grupo-nav">Ideas para tejer</p>
    <a href="revista.html?casa=merceria">Revista</a>
    <p class="grupo-nav">Lana Rosa</p>
    <a href="sobre-nosotras.html">Sobre nosotras</a>
    <p class="grupo-nav">Ayuda</p>
    <a href="merceria/como-comprar/">Cómo comprar y envíos</a>
    <a href="merceria/terminos-de-venta/">Términos de venta</a>
    <a href="merceria/cambios-y-devoluciones/">Cambios y devoluciones</a>
    <a href="merceria/preguntas-frecuentes/">Preguntas frecuentes</a>
    <a href="contacto.html">Contacto</a>
  </nav>''',
    'agenda': '''  <nav class="nav-movil-panel" id="nav-movil-panel" aria-label="Navegación móvil">
    <a href="agenda-rosina.html">📅 Mi agenda</a>
    <a href="cuenta.html">Mi cuenta</a>
    <p class="grupo-nav">Aprende y compra</p>
    <a href="agenda-rosina.html#aprende-compra">Clases, patrones y más</a>
    <a href="academy/talleres/">Talleres y clases</a>
    <a href="merceria/">Mercería</a>
    <p class="grupo-nav">Rosina</p>
    <a href="recursos-rosina.html">🐑 Material gratis de Rosina</a>
    <p class="grupo-nav">Lana Rosa</p>
    <a href="index.html">Tienda de amigurumis</a>
    <a href="sobre-nosotras.html">Sobre nosotras</a>
    <p class="grupo-nav">Ayuda</p>
    <a href="preguntas-frecuentes.html">Preguntas frecuentes</a>
    <a href="contacto.html">Contacto</a>
  </nav>''',
    'academy': '''  <nav class="nav-movil-panel" id="nav-movil-panel" aria-label="Navegación móvil">
    <a href="academy/">Inicio de Academy</a>
    <a href="cuenta.html"><svg class="ico-linea" width="1.1em" height="1.1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false" style="vertical-align:-.2em"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/></svg> Mi cuenta</a>
    <p class="grupo-nav">Cursos y clases</p>
    <a href="academy/talleres/">Talleres y clases</a>
    <a href="academy/sobre-academy/">Sobre Academy</a>
    <p class="grupo-nav">Aprende gratis</p>
    <a href="academy/empieza-aqui/">Empieza aquí</a>
    <a href="aprende.html#crea">Tutoriales <span class="etiqueta-gratis">Gratis</span></a>
    <p class="grupo-nav">Rosina</p>
    <a href="academy/rosina/">🐑 Rosina: tutoriales y material gratis</a>
    <a href="agenda-rosina.html">📅 Agenda para tejedoras</a>
    <p class="grupo-nav">Ideas</p>
    <a href="revista.html?casa=academy">Revista</a>
    <p class="grupo-nav">Lana Rosa</p>
    <a href="sobre-nosotras.html">Sobre nosotras</a>
    <p class="grupo-nav">Ayuda</p>
    <a href="academy/preguntas-frecuentes/">Preguntas frecuentes</a>
    <a href="contacto.html">Contacto</a>
  </nav>''',
}

ANUNCIOS = {
    'crochet': ['🚚 Envíos a toda Colombia', '🧶 Amigurumis 100% personalizados', '🐑 Tejido a mano en Manizales y Villamaría', '💕 Hechos con amor, punto a punto'],
    'merceria': ['🚚 Envíos a toda Colombia', '🧶 Materiales que usamos en nuestro taller', '📍 Tienda física en Villamaría, Caldas', '💕 Insumos para tejedoras'],
}

def anuncios(casa):
    if casa not in ANUNCIOS: return ''
    spans = ''.join(f'\n    <span>{t}</span>' for t in ANUNCIOS[casa] * 2)
    return f'<div class="franja-anuncios" role="region" aria-label="Anuncios"><div class="cinta">{spans}\n  </div></div>\n'

def franja(casa):
    items = []
    for k, nombre, href in CASAS:
        act = ' class="casa-actual" aria-current="true"' if k == casa else ''
        items.append(f'<a href="{href}" data-casa="{k}"{act}>{nombre}</a>')
    return ('<nav class="franja-casas" aria-label="Casas Lana Rosa">\n  <div class="contenedor">\n    '
            + '\n    '.join(items) + '\n  </div>\n</nav>')

def casas_pie(casa):
    """Las tres casas (Tienda de amigurumis, Mercería, Academy) viven en el pie; la casa actual va resaltada."""
    items = []
    for k, nombre, href in CASAS:
        act = ' class="casa-actual" aria-current="true"' if k == casa else ''
        items.append(f'<a href="{href}" data-casa="{k}"{act}>{nombre}</a>')
    return ('  <div class="contenedor pie-casas">\n    <p class="pie-h3">Nuestras casas</p>\n    <nav aria-label="Casas Lana Rosa">\n      '
            + '\n      '.join(items) + '\n    </nav>\n  </div>\n')

def _encabezado(casa):
    menu = MENUS[casa]
    lis = []
    for i, (t, h, g) in enumerate(menu):
        ini = ' grupo-inicio' if i == 0 else ''
        lis.append(f'        <li class="{CLASE[g]}{ini}"><a href="{h}">{t}</a></li>')
    buscar = 'merceria/catalogo/' if casa == 'merceria' else 'tienda.html'
    movil = MOVIL.get(casa) or f'''  <nav class="nav-movil-panel" id="nav-movil-panel" aria-label="Navegación móvil">
    <a href="index.html">Inicio</a>
    <a href="cuenta.html"><svg class="ico-linea" width="1.1em" height="1.1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false" style="vertical-align:-.2em"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/></svg> Mi cuenta</a>
    <p class="grupo-nav">Tienda de amigurumis</p>
    <a href="tienda.html">Tienda</a>
    <a href="personaliza.html">Personaliza el tuyo</a>
    <p class="grupo-nav">Mercería</p>
    <a href="merceria/">Mercería</a>
    <a href="merceria/tienda-fisica/">Tienda física</a>
    <p class="grupo-nav">Lana Rosa Academy</p>
    <a href="aprende.html">Aprende <span class="etiqueta-gratis">Tutoriales gratis</span></a>
    <p class="grupo-nav">Rosina</p>
    <a href="universo-rosina.html">🐑 Rosina: regalos e ideas</a>
    <p class="grupo-nav">Lana Rosa</p>
    <a href="revista.html">Revista</a>
    <a href="sobre-nosotras.html">Sobre nosotras</a>
    <p class="grupo-nav">Ayuda</p>
    <a href="preguntas-frecuentes.html">Preguntas frecuentes</a>
    <a href="contacto.html">Contacto</a>
    <a href="precios.html">Precios</a>
  </nav>'''
    texto, enlace = LOGO[casa]
    img, alt = LOGO_IMG.get(casa, ('img/logo-lana-rosa-360.webp', 'Lana Rosa Crochet'))
    return f'''<a class="saltar-contenido" href="#contenido-principal">Saltar al contenido</a>
{anuncios(casa)}<header class="encabezado" data-casa="{casa}">
  <div class="contenedor">
    <a href="{enlace}" class="logo"><img src="{img}" alt="{alt}" class="logo-img" width="360" height="230"><span class="texto-logo">{texto}</span></a>
    <nav aria-label="Navegación principal">
      <ul class="nav-principal">
{chr(10).join(lis)}
      </ul>
    </nav>
    <button class="menu-movil" id="boton-menu-movil" aria-label="Abrir menú" aria-expanded="false">☰</button>
    <div class="contenedor-buscar-header">
      <button type="button" class="boton-buscar-header" id="boton-buscar-header" aria-label="Buscar productos"><svg fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg></button>
      <form class="panel-buscar-header" id="panel-buscar-header" action="{buscar}" method="get">
        <input type="text" name="buscar" id="input-buscar-header" placeholder="Buscar productos...">
        <button type="submit" aria-label="Buscar"><svg fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg></button>
      </form>
    </div>
    <a href="cuenta.html" class="boton-cuenta-header" aria-label="Mi cuenta"><svg fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/></svg><span class="solo-lectores">Mi cuenta</span></a>
    <button class="boton-carrito-header" id="boton-carrito" aria-label="Ver carrito de compras">
      <svg fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 4h2.5l2.2 10.2a1 1 0 0 0 1 .8h8.6a1 1 0 0 0 1-.8L20 8H6.2"/><circle cx="9.5" cy="19.5" r="1.4"/><circle cx="17" cy="19.5" r="1.4"/></svg><span class="solo-lectores">Carrito</span><span class="contador-carrito" id="contador-carrito">0</span>
    </button>
  </div>
</header>
{movil}
'''

def encabezado(pagina):
    """Menú de la página. Las páginas comunes (Revista, preguntas frecuentes, contacto, políticas, cuenta, gracias) salen con el de la Tienda y
    js/casa-menu.js lo cambia por el de la casa de la que viene la persona (?casa= o la última casa visitada); así el menú no cambia dentro de una casa."""
    casa = CASA_DE.get(pagina)
    if casa:
        if pagina == 'tienda':   # aquí se venden piezas listas: el anuncio no puede decir «100% personalizados»
            return ('<!-- CASAS:INICIO (generado por herramientas/sincronizar_encabezado.py) -->\n<script>try{sessionStorage.setItem("lrCasa","crochet");localStorage.setItem("lrCasa","crochet")}catch(e){}</script>\n'
                    + _encabezado(casa).replace('Amigurumis 100% personalizados', 'Listos para enviar o personalízalos') + '<!-- CASAS:FIN -->')
        return ('<!-- CASAS:INICIO (generado por herramientas/sincronizar_encabezado.py) -->\n<script>try{sessionStorage.setItem("lrCasa","' + casa + '");localStorage.setItem("lrCasa","' + casa + '")}catch(e){}</script>\n'
                + _encabezado(casa) + '<!-- CASAS:FIN -->')
    return ('<!-- CASAS:INICIO (generado por herramientas/sincronizar_encabezado.py) -->\n<div id="encabezado-casa" style="display:contents">\n'
            + _encabezado('crochet') + '</div>\n<script src="/js/casa-menu.js?v=2"></script>\n<!-- CASAS:FIN -->')

def js_casa_menu():
    bloques = {c: absolutas(_encabezado(c)) for c in ('crochet', 'merceria', 'academy', 'agenda')}
    return ('// GENERADO por herramientas/sincronizar_encabezado.py: no se edita a mano.\n'
            '// En las páginas comunes cambia el menú por el de la casa de la que viene la persona (?casa=merceria|academy, o la última casa visitada).\n'
            '(function () {\n  var B = ' + json.dumps(bloques, ensure_ascii=False) + ';\n'
            '  var c = null;\n'
            '  try { var q = new URLSearchParams(location.search).get("casa"); if (B[q]) { c = q; sessionStorage.setItem("lrCasa", c); localStorage.setItem("lrCasa", c); } else c = sessionStorage.getItem("lrCasa") || localStorage.getItem("lrCasa") || document.documentElement.getAttribute("data-casa-pref"); } catch (e) {}\n'
            '  var cont = document.getElementById("encabezado-casa");\n'
            '  if (!cont || !B[c] || c === "crochet") return;\n'
            '  cont.innerHTML = B[c];\n'
            '  var m = document.querySelector("main[id]"), a = cont.querySelector(".saltar-contenido");\n'
            '  if (m && a) a.setAttribute("href", "#" + m.id);\n'
            '  document.documentElement.setAttribute("data-casa", c);\n'
            '})();\n')

PIE_FAQ = {'crochet': 'preguntas-frecuentes.html', 'merceria': 'merceria/preguntas-frecuentes/', 'academy': 'academy/preguntas-frecuentes/', 'agenda': 'preguntas-frecuentes.html'}
PIE_REVISTA = {'crochet': 'revista.html?casa=crochet', 'merceria': 'revista.html?casa=merceria', 'academy': 'revista.html?casa=academy', 'agenda': 'revista.html?casa=academy'}
PIE_COMUN = ('Tres casas, una sola familia: amigurumis, mercería y academia de crochet en Manizales / Villamaría, Colombia.', 'Nuestras casas',
             [('Tienda de amigurumis', 'tienda.html'), ('Personaliza el tuyo', 'personaliza.html'), ('Mercería', 'merceria/'),
              ('Lana Rosa Academy', 'academy/'), ('Revista', 'revista.html')])
PIE_HORARIO = ('Lun a vie 7:30 a.m. a 6:15 p.m.', 'Sáb 8:00 a.m. a 12:00 m.')

# Pie simple (8-oct-2026): marca + casas con iconos pequeños, tres columnas cortas, una línea de pagos/apoyo y una de legales.
PIE_SIMPLE = {
    'crochet': ('Tienda', [('Ver catálogo', 'tienda.html'), ('Personaliza el tuyo', 'personaliza.html'), ('Historias que tejimos', 'index.html#historias')]),
    'merceria': ('Mercería', [('Catálogo', 'merceria/catalogo/'), ('Paleta de colores', 'merceria/paleta-de-colores/'), ('Tienda física', 'merceria/tienda-fisica/'), ('Cómo comprar y envíos', 'merceria/como-comprar/'), ('Términos de venta', 'merceria/terminos-de-venta/'), ('Cambios y devoluciones', 'merceria/cambios-y-devoluciones/')]),
    'agenda': ('Agenda', [('Mi agenda', 'agenda-rosina.html'), ('Aprende y compra', 'agenda-rosina.html#aprende-compra'), ('Material gratis de Rosina', 'recursos-rosina.html'), ('Instalar la agenda como app', 'agenda-rosina.html')]),
    'academy': ('Academy', [('Talleres y clases', 'academy/talleres/'), ('Agenda para tejedoras', 'agenda-rosina.html'), ('Empieza aquí', 'academy/empieza-aqui/'), ('Rosina: tutoriales y material gratis', 'academy/rosina/'), ('La aventura de Rosina', 'aventuras-de-rosina/'), ('Sobre Academy', 'academy/sobre-academy/')]),
}
PIE_SIMPLE_COMUN = ('Tienda', [('Ver catálogo', 'tienda.html'), ('Personaliza el tuyo', 'personaliza.html'), ('Mercería', 'merceria/'), ('Lana Rosa Academy', 'academy/')])
CASAS_ICONO = {'crochet': ('🧸', 'Tienda'), 'merceria': ('🧶', 'Mercería'), 'academy': ('🎓', 'Academy'), 'agenda': ('📅', 'Agenda')}

def casas_pie_mini(casa):
    """Las tres casas, junto al logo del pie, con iconos pequeños; la casa actual va resaltada."""
    items = []
    for k, nombre, href in CASAS:
        ico, corto = CASAS_ICONO.get(k, ('', nombre))
        act = ' class="casa-actual" aria-current="true"' if k == casa else ''
        items.append(f'<a href="{href}" data-casa="{k}" title="{nombre}"{act}><span aria-hidden="true">{ico}</span> {corto}</a>')
    return '<nav class="pie-casas-mini" aria-label="Casas Lana Rosa"><span class="pie-h3">Nuestras casas</span>' + ''.join(items) + '</nav>'

def logo_pie(casa, img, alt):
    """Logo animado del pie sobre fondo transparente (herramientas/logo-animado/): Tienda (crochet y páginas comunes), Mercería y Academy."""
    if casa == 'agenda':   # la Agenda no tiene logo animado: logo fijo en verde
        return f'<img class="pie-logo-agenda" src="/{img}" alt="{alt}" width="190" height="121" loading="lazy" decoding="async">'
    nombre = 'componente.html' if casa not in ('merceria', 'academy') else f'componente-{casa}.html'
    return open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'logo-animado', nombre), encoding='utf-8').read()

def pie_casa(modelo, casa, pagina=None):
    """Pie simple: logo con las tres casas al lado y redes, tres columnas cortas, pagos y apoyo en una línea, y los legales."""
    titulo, enlaces = PIE_SIMPLE.get(casa) or PIE_SIMPLE_COMUN
    img, alt = LOGO_IMG.get(casa, ('img/logo-lana-rosa-360.webp', 'Lana Rosa Crochet'))
    def li(t, h, extra=''):
        if not h: return f'\n        <li>{t}</li>'
        ext = ' target="_blank" rel="noopener"' if h.startswith('http') else ''
        return f'\n        <li><a href="{h}"{ext}>{t}</a></li>'
    lis = ''.join(li(t, h) for t, h in enlaces)
    faq = PIE_FAQ.get(casa, 'preguntas-frecuentes.html')
    universo_href = {'merceria': 'merceria/rosina/', 'academy': 'academy/rosina/', 'agenda': 'academy/rosina/'}.get(casa, 'universo-rosina.html')  # cada casa tiene su propio hub de Rosina
    rev = PIE_REVISTA.get(casa, 'revista.html')
    # en Mercería y Academy el universo de Rosina ya está en la columna de la casa: no se repite
    universo_li = '' if casa in ('merceria', 'academy') else f'<li><a href="{universo_href}">{"Rosina: tutoriales y recursos" if casa == "agenda" else "Rosina: regalos e ideas"}</a></li>'
    horario = '<li>Lun a vie 7:30 a.m. a 6:15 p.m. · Sáb 8:00 a.m. a 12:00 m.</li>' if casa == 'merceria' else ''
    nombre_app = APP.get(casa, APP_BASE)[1]
    return f'''<footer class="pie-rico">
  <div class="contenedor pie-top">
    <div class="pie-marca">
      {logo_pie(casa, img, alt)}
      {casas_pie_mini(casa)}
    </div>
    <div class="pie-redes" aria-label="Redes sociales">
      <a href="https://www.instagram.com/lanarosacrochet" target="_blank" rel="noopener" aria-label="Instagram" title="Instagram"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.3" cy="6.7" r="1.2" fill="currentColor"/></svg></a>
      <a href="https://www.facebook.com/lana.rosa.2025" target="_blank" rel="noopener" aria-label="Facebook" title="Facebook"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><path fill="currentColor" d="M13.5 21v-7.5h2.5l.5-3h-3V8.6c0-.9.3-1.5 1.6-1.5h1.5V4.4c-.3 0-1.2-.1-2.2-.1-2.3 0-3.9 1.4-3.9 4v2.2H8v3h2.5V21z"/></svg></a>
      <a href="https://www.tiktok.com/@lanarosacrochet" target="_blank" rel="noopener" aria-label="TikTok" title="TikTok"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><path fill="currentColor" d="M16.6 3c.3 2.3 1.6 3.7 3.9 3.9v3c-1.4.1-2.7-.3-3.9-1.1v5.6c0 3.6-2.9 5.6-5.7 5.6-3 0-5.4-2.4-5.4-5.4s2.7-5.7 6.1-5.3v3.1c-1.7-.4-3 .8-3 2.2 0 1.3 1 2.3 2.3 2.3 1.4 0 2.4-.9 2.4-2.6V3z"/></svg></a>
      <a href="https://www.youtube.com/@LanaRosaAcademy" target="_blank" rel="noopener" aria-label="YouTube" title="YouTube"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><path fill="currentColor" d="M21.6 7.2c-.2-.9-.9-1.5-1.8-1.7C18.2 5.1 12 5.1 12 5.1s-6.2 0-7.8.4c-.9.2-1.6.8-1.8 1.7C2 8.8 2 12 2 12s0 3.2.4 4.8c.2.9.9 1.5 1.8 1.7 1.6.4 7.8.4 7.8.4s6.2 0 7.8-.4c.9-.2 1.6-.8 1.8-1.7.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8zM10 15V9l5.2 3z"/></svg></a>
      <a href="https://wa.me/573205072801" target="_blank" rel="noopener" aria-label="WhatsApp" title="WhatsApp"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" d="M3.5 20.5l1.3-4.2A8.5 8.5 0 1 1 8 19.4z"/><path fill="currentColor" d="M9.2 7.6c.3-.5.7-.5 1-.3l.9 1.7c.1.3 0 .5-.2.7l-.5.600c.7 1.3 1.7 2.200 3 2.800l.6-.7c.2-.2.5-.3.8-.1l1.7.9c.3.200.3.600.1 1-.5 1.1-1.900 1.600-3.1 1.1-2.3-.9-4.200-2.900-5-5.200-.2-.9.1-1.900.7-2.5z"/></svg></a>
    </div>
  </div>
  <div class="contenedor pie-grid">
    <div class="pie-col">
      <p class="pie-h3">{titulo}</p>
      <ul>{lis}
      </ul>
    </div>
    <div class="pie-col">
      <p class="pie-h3">Lana Rosa</p>
      <ul>
        <li><a href="sobre-nosotras.html">Sobre nosotras</a></li>
        {universo_li}
        <li><a href="{rev}">Revista</a></li>
        <li><a href="{faq}">Preguntas frecuentes</a></li>
        <li><a href="precios.html">Precios</a></li>
        <li><a href="contacto.html">Contacto</a></li>
      </ul>
    </div>
    <div class="pie-col pie-contacto">
      <p class="pie-h3">Contáctanos</p>
      <ul>
        <li><a href="https://wa.me/573205072801" target="_blank" rel="noopener">WhatsApp 320 507 2801</a></li>
        <li><a href="mailto:contacto@lanarosacrochet.com">contacto@lanarosacrochet.com</a></li>
        <li>Calle 10 #5-37, Villamaría, Caldas · <a href="https://share.google/GkcZvd8av8NjmRPPM" target="_blank" rel="noopener">Ver en Google ↗</a></li>{horario}
      </ul>
    </div>
  </div>
  <div class="contenedor pie-franja">
    <p class="pie-pagos"><span class="pie-etiqueta">Pagos:</span> en línea: tarjeta, PSE, Nequi, Bancolombia o Bre-B · en la tienda física: efectivo, tarjeta o QR</p>
    <div class="pie-apoyo"><span>Con el apoyo de</span>
      <img src="img/logo-sena.png" alt="SENA" width="328" height="320" onerror="this.style.display='none'" loading="lazy" decoding="async">
      <img src="img/logo-fondo-emprender.webp" alt="Fondo Emprender SENA" width="420" height="94" onerror="this.style.display='none'" loading="lazy" decoding="async">
    </div>
  </div>
  <div class="contenedor pie-legal">
    <a href="politicas.html">Políticas</a>
    <a href="politicas.html#datos">Datos personales</a>
    <a href="politicas.html#cookies">Cookies</a>
    <a href="politicas.html#cookies" data-abrir-cookies>Configurar cookies</a>
    <button type="button" class="boton-instalar" data-instalar hidden aria-label="Instalar la app de {nombre_app}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14"/></svg> Instalar app</button>
    <span class="instalar-ayuda" role="status" hidden>En iPhone: toca el botón Compartir y luego «Agregar a pantalla de inicio».</span>
    <span class="derechos">© 2026 Lana Rosa Crochet</span>
  </div>
</footer>'''

def absolutas(html):
    """Enlaces del menú y del pie con ruta desde la raíz (/tienda.html, /merceria/...): funcionan igual desde cualquier página,
    con o sin <base href="/">, y no generan /merceria/merceria/... en rastreadores que ignoran <base>."""
    html = re.sub(r'(<(?:a|form)\b[^>]*?\s(?:href|action)=")/?index\.html(?=[#?"])', lambda m: m.group(1) + '/', html)   # el inicio es "/" (index.html sería una URL duplicada)
    return re.sub(r'(<(?:a|form|img|source|link|script)\b[^>]*?\s(?:href|src|action)=")(?!/|#|\?|https?:|mailto:|tel:|javascript:|data:)([^"]+)"', lambda m: m.group(1) + '/' + m.group(2) + '"', html)

# Barra «Rosina» (una fila corta, con los colores de la casa) en todas las páginas del Rincón de Rosina
BARRA_PAGINAS = {'recursos-rosina': 'recursos-rosina.html', 'glosario-rosina': 'glosario-rosina.html', 'paletas-rosina': 'paletas-rosina.html',
                 'calculadoras-rosina': 'calculadoras-rosina.html'}   # la Agenda ya es su propia casa (sin barra «Rosina»)
BARRA_ITEMS = [('Material gratis', 'recursos-rosina.html'), ('Glosario', 'glosario-rosina.html'), ('Paletas', 'paletas-rosina.html'),
               ('Calculadoras', 'calculadoras-rosina.html'), ('Agenda', 'agenda-rosina.html')]   # «Conoce a Rosina» solo en los hubs de Mercería y Academy (la Tienda ya no lo tiene)
HUB_TEXTO = {'crochet': 'Rosina: regalos e ideas', 'merceria': 'Rosina: lanas e ideas', 'academy': 'Rosina: tutoriales y recursos'}
HUB = {'crochet': 'universo-rosina.html', 'merceria': 'merceria/rosina/', 'academy': 'academy/rosina/'}

def barra_rosina(pagina, casa):
    hub = HUB.get(casa, 'universo-rosina.html')
    items = [f'<a href="{hub}" class="br-hub">🐑 {HUB_TEXTO.get(casa, HUB_TEXTO["crochet"])}</a>']
    if casa in ('merceria', 'academy'):
        items_conoce = f'<a href="{hub}#conoce-a-rosina">Conoce a Rosina</a>'
    else:
        items_conoce = None
    for t, h in BARRA_ITEMS:
        act = ' aria-current="page" class="br-actual"' if h == BARRA_PAGINAS.get(pagina) else ''
        items.append(f'<a href="{h}"{act}>{t}</a>')
    if items_conoce: items.append(items_conoce)
    return ('<!-- BARRA:INICIO (generado por herramientas/sincronizar_encabezado.py) -->\n<nav class="barra-rosina" aria-label="Rosina">\n  <div class="contenedor">\n    '
            + '\n    '.join(items) + '\n  </div>\n</nav>\n<!-- BARRA:FIN -->')

def con_barra(s, pagina, casa):
    s = re.sub(r'\n?<!-- BARRA:INICIO.*?<!-- BARRA:FIN -->\n?', '\n', s, flags=re.S)
    if pagina in BARRA_PAGINAS:
        s = s.replace('<!-- CASAS:FIN -->', '<!-- CASAS:FIN -->\n' + absolutas(barra_rosina(pagina, casa)), 1)
    return s


# Páginas sin menú que llevan el pie unificado: el generador solo mantiene su bloque <!-- PIE:INICIO --> ... <!-- PIE:FIN -->
SOLO_PIE = ('404.html', 'baja-recordatorios.html')


def main():
    # el pie modelo es el de las páginas comunes (contacto.html no tiene casa, así que nunca se modifica)
    modelo = None
    archivos = sorted(glob.glob(os.path.join(RAIZ, '*.html'))) + [os.path.join(RAIZ, 'p', 'index.html')] + sorted(glob.glob(os.path.join(RAIZ, 'merceria', '**', 'index.html'), recursive=True)) + sorted(glob.glob(os.path.join(RAIZ, 'revista', '*', 'index.html'))) + sorted(glob.glob(os.path.join(RAIZ, 'academy', '**', 'index.html'), recursive=True))
    for f in archivos:
        rel = os.path.relpath(f, RAIZ).replace(os.sep, '/')
        # merceria/index.html -> merceria; merceria/catalogo/index.html -> merceria-catalogo
        n = rel[:-len('/index.html')].replace('/', '-') if rel.endswith('/index.html') else rel[:-5]
        if rel in SOLO_PIE:
            # páginas sin menú que sí llevan el pie unificado (23-oct-2026): solo se renueva el bloque del pie
            t = open(f, encoding='utf-8').read()
            bloque = f'<!-- PIE:INICIO (generado) -->\n{absolutas(pie_casa(modelo, "crochet"))}\n<!-- PIE:FIN -->'
            if '<!-- PIE:INICIO' not in t:
                print('sin marcadores del pie:', n); continue
            t = re.sub(r'<!-- PIE:INICIO.*?<!-- PIE:FIN -->', lambda m: bloque, t, flags=re.S)
            open(f, 'w', encoding='utf-8').write(t)
            print('ok (solo pie)', n); continue
        if n in ('404', 'merceria', 'offline') and rel == n + '.html':
            continue  # 404 y la redirección merceria.html no llevan menú
        s = open(f, encoding='utf-8').read()
        if '<!-- CASAS:INICIO' in s:
            s = re.sub(r'<!-- CASAS:INICIO.*?<!-- CASAS:FIN -->', lambda m: absolutas(encabezado(n)), s, flags=re.S)
        else:
            a = s.find('<header class="encabezado"')
            b = s.find('</nav>', s.find('id="nav-movil-panel"')) + len('</nav>')
            if a < 0 or b < 10:
                print('sin encabezado:', n); continue
            s = s[:a] + absolutas(encabezado(n)) + s[b:]
        bloque = f'<!-- PIE:INICIO (generado) -->\n{absolutas(pie_casa(modelo, CASA_DE.get(n) or "crochet", n))}\n<!-- PIE:FIN -->'
        if '<!-- PIE:INICIO' in s:
            s = re.sub(r'<!-- PIE:INICIO.*?<!-- PIE:FIN -->', lambda m: bloque, s, flags=re.S)
        else:
            s = re.sub(r'<footer class="pie-rico".*?</footer>', lambda m: bloque, s, count=1, flags=re.S)
        casa = CASA_DE.get(n) or 'crochet'
        # íconos de pestaña y color de la barra: quita los que había y pone los de la casa
        s = re.sub(r'<!-- ICONOS:INICIO.*?<!-- ICONOS:FIN -->\n?', '', s, flags=re.S)
        s = re.sub(r'<link rel="icon"[^>]*>\n?|<link rel="apple-touch-icon"[^>]*>\n?|<meta name="theme-color"[^>]*>\n?', '', s)
        s = s.replace('</head>', iconos(casa, n) + '\n</head>', 1)
        pref = re.search(r'<html lang="es-CO"[^>]*?(data-casa-pref="[^"]*")', s)   # casa preferida de los artículos de la Revista (la usa js/casa-menu.js)
        s = re.sub(r'<html lang="es-CO"[^>]*>', '<html lang="es-CO"' + (f' data-casa="{casa}"' if casa else '') + (' ' + pref.group(1) if pref else '') + '>', s, count=1)
        s = con_barra(s, n, casa)
        # enlace «Saltar al contenido» (ACC-08): el <main> necesita un id; si ya tiene uno propio, el enlace apunta a ese
        mm = re.search(r'<main\b([^>]*)>', s)
        if mm:
            idm = re.search(r'\bid="([^"]+)"', mm.group(1))
            if idm:
                s = s.replace('href="#contenido-principal">Saltar al contenido', f'href="#{idm.group(1)}">Saltar al contenido', 1)
                if 'tabindex' not in mm.group(1): s = s.replace(mm.group(0), '<main tabindex="-1"' + mm.group(1) + '>', 1)
            else:
                s = s.replace(mm.group(0), '<main id="contenido-principal" tabindex="-1"' + mm.group(1) + '>', 1)
        open(f, 'w', encoding='utf-8').write(s)
        print('ok', n)

open(os.path.join(RAIZ, 'js', 'casa-menu.js'), 'w', encoding='utf-8').write(js_casa_menu())
main()
