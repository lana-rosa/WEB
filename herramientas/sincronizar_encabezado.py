#!/usr/bin/env python3
"""Pone en todas las páginas la franja de casas, el menú de cada casa, el menú móvil y el pie.

Una sola fuente: edita CASAS / MENUS / PIE aquí y vuelve a correr
    python3 herramientas/sincronizar_encabezado.py
Los bloques quedan entre marcadores <!-- CASAS:INICIO --> ... <!-- CASAS:FIN --> y <!-- PIE:INICIO --> ... <!-- PIE:FIN -->.
"""
import re, sys, glob, os

RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')

# página -> casa (las que no están aquí son comunes: sin casa resaltada)
CASA_DE = {
    'index': 'crochet', 'tienda': 'crochet', 'personaliza': 'crochet', 'sobre-nosotras': 'crochet', 'precios': 'crochet',
    'merceria': 'merceria', 'merceria-catalogo': 'merceria', 'merceria-tienda-fisica': 'merceria', 'merceria-preguntas-frecuentes': 'merceria', 'academy-preguntas-frecuentes': 'academy', 'merceria-como-comprar': 'merceria', 'academy-talleres': 'academy', 'academy-sobre-academy': 'academy',
    'academy': 'academy', 'aprende': 'academy', 'recursos-rosina': 'academy', 'rosina': 'academy', 'glosario-rosina': 'academy',
    'paletas-rosina': 'academy', 'calculadoras-rosina': 'academy', 'agenda-rosina': 'academy',
}
CASAS = [('crochet', 'Tienda de amigurumis', 'index.html'), ('merceria', 'Mercería', 'merceria/'), ('academy', 'Academy', 'academy/')]
CLASE = {'crochet': 'g-tienda', 'merceria': 'g-merceria', 'academy': 'g-aprende', 'comun': 'g-comun'}

# (texto, enlace, clase de color)
MENUS = {
    'crochet': [('Amigurumis', 'tienda.html#amigurumis', 'crochet'), ('Peluches', 'tienda.html#peluches', 'crochet'),
                ('Llaveros', 'tienda.html#llaveros', 'crochet'), ('Flores y macetas', 'tienda.html#macetas', 'crochet'),
                ('Personaliza el tuyo', 'personaliza.html', 'crochet'), ('Sobre nosotras', 'sobre-nosotras.html', 'comun')],
    # páginas comunes (contacto, preguntas, políticas, cuenta, Revista): menú de marca con las tres casas
    'comun': [('Tienda de amigurumis', 'index.html', 'crochet'), ('Mercería', 'merceria/', 'merceria'),
              ('Academy', 'academy/', 'academy'), ('Revista', 'revista.html', 'comun'), ('Sobre nosotras', 'sobre-nosotras.html', 'comun')],
    'merceria': [('Catálogo', 'merceria/catalogo/', 'merceria'), ('Lanas', 'merceria/catalogo/#lanas-merceria', 'merceria'), ('Hilos', 'merceria/catalogo/#hilos-merceria', 'merceria'),
                 ('Agujas', 'merceria/catalogo/#agujas-merceria', 'merceria'), ('Accesorios', 'merceria/catalogo/#accesorios-merceria', 'merceria'),
                 ('Tienda física', 'merceria/tienda-fisica/', 'merceria'),
                 ('Cómo comprar', 'merceria/como-comprar/', 'merceria')],
    'academy': [('Talleres', 'aprende.html#aprende', 'academy'), ('Tutoriales', 'aprende.html#crea', 'academy'),
                ('Recursos gratis', 'recursos-rosina.html', 'academy'), ('Glosario', 'glosario-rosina.html', 'academy'),
                ('Paletas', 'paletas-rosina.html', 'academy'), ('Calculadoras', 'calculadoras-rosina.html', 'academy')],
}

# imagen del logo por casa (las demás usan el logo rosa de Lana Rosa Crochet)
LOGO_IMG = {'merceria': ('img/logo-merceria.webp', 'Lana Rosa Mercería'), 'academy': ('img/logo-academy.webp', 'Lana Rosa Academy')}

# íconos de la pestaña y color de la barra del celular por casa
ICONOS = {
    'merceria': ('/img/favicon-merceria-256.png', '/img/apple-touch-icon-merceria.png', '#8E55D6'),
    'academy': ('/img/favicon-academy-256.png', '/img/apple-touch-icon-academy.png', '#2A6FCB'),
}
ICONOS_BASE = ('/img/favicon-256.png', '/img/apple-touch-icon.png', '#E74E96')

def iconos(casa):
    ico, apple, color = ICONOS.get(casa, ICONOS_BASE)
    return (f'<!-- ICONOS:INICIO (generado) -->\n<link rel="icon" type="image/png" href="{ico}">\n'
            f'<link rel="apple-touch-icon" href="{apple}">\n<meta name="theme-color" content="{color}">\n<!-- ICONOS:FIN -->')

# nombre bajo el logo y destino del logo por casa
LOGO = {'crochet': ('Inicio', 'index.html'), 'merceria': ('Mercería', 'merceria/'), 'academy': ('Academy', 'academy/'),
        None: ('Inicio', 'index.html')}

# pie por casa: (frase, titulo de columna, enlaces)  — Crochet usa el pie original
PIE = {
    'crochet': ('Amigurumis y accesorios tejidos a mano en Manizales / Villamaría, Colombia.', 'Tienda de amigurumis',
                [('Ver catálogo', 'tienda.html'), ('Personaliza el tuyo', 'personaliza.html'), ('Precios', 'precios.html'),
                 ('Historias que tejimos', 'index.html#historias'), ('Comprar en línea', 'https://lana-rosa-crochet.cercia.co/')]),
    'merceria': ('Mercería Lana Rosa: todo para tejer, lanas, hilos, agujas y accesorios. Villamaría, Caldas.', 'Mercería',
                 [('Catálogo', 'merceria/catalogo/'), ('Lanas', 'merceria/catalogo/#lanas-merceria'), ('Hilos', 'merceria/catalogo/#hilos-merceria'), ('Agujas', 'merceria/catalogo/#agujas-merceria'),
                  ('Herrajes', 'merceria/catalogo/#herrajes-merceria'), ('Accesorios', 'merceria/catalogo/#accesorios-merceria'),
                  ('Tienda física', 'merceria/tienda-fisica/'), ('Cómo comprar y envíos', 'merceria/como-comprar/'),
                  ('Lun a vie 7:30 a.m. a 6:15 p.m.', None), ('Sáb 8:00 a.m. a 12:00 m.', None)]),
    'academy': ('Lana Rosa Academy, academia de crochet: aprende a tejer paso a paso, sin experiencia y sin tecnicismos.', 'Academy',
                [('Inicio de Academy', 'academy/'), ('Calendario de talleres', 'academy/talleres/'), ('Sobre Academy', 'academy/sobre-academy/'), ('Tutoriales', 'aprende.html#crea'),
                 ('Rincón de Rosina', 'recursos-rosina.html'), ('Glosario', 'glosario-rosina.html'), ('Paletas de color', 'paletas-rosina.html'),
                 ('Calculadoras', 'calculadoras-rosina.html'), ('Agenda', 'agenda-rosina.html')]),
}

# Menú del celular propio de cada casa (las casas sin entrada usan el menú general).
MOVIL = {
    'crochet': '''  <nav class="nav-movil-panel" id="nav-movil-panel" aria-label="Navegación móvil">
    <a href="index.html">Inicio</a>
    <a href="cuenta.html">👤 Mi cuenta</a>
    <p class="grupo-nav">Tienda</p>
    <a href="tienda.html">Todo el catálogo</a>
    <a href="tienda.html#amigurumis">Amigurumis</a>
    <a href="tienda.html#peluches">Peluches</a>
    <a href="tienda.html#llaveros">Llaveros</a>
    <a href="tienda.html#macetas">Macetas y flores</a>
    <p class="grupo-nav">Personalizados</p>
    <a href="personaliza.html" class="nav-destacado">✨ Personaliza el tuyo</a>
    <a href="index.html#historias">Historias que tejimos</a>
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
    <a href="cuenta.html">👤 Mi cuenta</a>
    <p class="grupo-nav">Catálogo</p>
    <a href="merceria/catalogo/">Todo el catálogo</a>
    <a href="merceria/catalogo/#lanas-merceria">Lanas</a>
    <a href="merceria/catalogo/#hilos-merceria">Hilos</a>
    <a href="merceria/catalogo/#agujas-merceria">Agujas</a>
    <a href="merceria/catalogo/#herrajes-merceria">Herrajes</a>
    <a href="merceria/catalogo/#accesorios-merceria">Accesorios</a>
    <a href="merceria/catalogo/#relleno-merceria">Relleno</a>
    <p class="grupo-nav">Visítanos</p>
    <a href="merceria/tienda-fisica/">Tienda física: horario y dirección</a>
    <p class="grupo-nav">Ideas para tejer</p>
    <a href="revista.html?casa=merceria">Revista</a>
    <p class="grupo-nav">Ayuda</p>
    <a href="merceria/como-comprar/">Cómo comprar y envíos</a>
    <a href="merceria/preguntas-frecuentes/">Preguntas frecuentes</a>
    <a href="contacto.html">Contacto</a>
  </nav>''',
    'academy': '''  <nav class="nav-movil-panel" id="nav-movil-panel" aria-label="Navegación móvil">
    <a href="academy/">Inicio de Academy</a>
    <a href="cuenta.html">👤 Mi cuenta</a>
    <p class="grupo-nav">Aprende</p>
    <a href="aprende.html#aprende">Talleres presenciales</a>
    <a href="academy/talleres/">Calendario de talleres</a>
    <a href="aprende.html#crea">Tutoriales <span class="etiqueta-gratis">Gratis</span></a>
    <a href="academy/sobre-academy/">Sobre Academy</a>
    <p class="grupo-nav">Recursos gratis de Rosina</p>
    <a href="recursos-rosina.html">Rincón de Rosina</a>
    <a href="glosario-rosina.html">Glosario</a>
    <a href="paletas-rosina.html">Paletas de color</a>
    <a href="calculadoras-rosina.html">Calculadoras</a>
    <a href="agenda-rosina.html">Agenda de proyectos</a>
    <a href="rosina.html">Conoce a Rosina</a>
    <p class="grupo-nav">Ideas</p>
    <a href="revista.html?casa=academy">Revista</a>
    <p class="grupo-nav">Ayuda</p>
    <a href="academy/preguntas-frecuentes/">Preguntas frecuentes</a>
    <a href="contacto.html">Contacto</a>
  </nav>''',
}

def franja(casa):
    items = []
    for k, nombre, href in CASAS:
        act = ' class="casa-actual" aria-current="true"' if k == casa else ''
        items.append(f'<a href="{href}" data-casa="{k}"{act}>{nombre}</a>')
    return ('<nav class="franja-casas" aria-label="Casas Lana Rosa">\n  <div class="contenedor">\n    '
            + '\n    '.join(items) + '\n  </div>\n</nav>')

def encabezado(pagina):
    casa = CASA_DE.get(pagina)
    menu = MENUS[casa or 'comun']
    lis = []
    for i, (t, h, g) in enumerate(menu):
        ini = ' grupo-inicio' if i == 0 else ''
        lis.append(f'        <li class="{CLASE[g]}{ini}"><a href="{h}">{t}</a></li>')
    buscar = 'merceria/catalogo/' if casa == 'merceria' else 'tienda.html'
    movil = MOVIL.get(casa) or f'''  <nav class="nav-movil-panel" id="nav-movil-panel" aria-label="Navegación móvil">
    <a href="index.html">Inicio</a>
    <a href="cuenta.html">👤 Mi cuenta</a>
    <p class="grupo-nav">Tienda de amigurumis</p>
    <a href="tienda.html">Tienda</a>
    <a href="personaliza.html">Personaliza el tuyo</a>
    <p class="grupo-nav">Mercería</p>
    <a href="merceria/">Mercería</a>
    <a href="merceria/tienda-fisica/">Tienda física</a>
    <p class="grupo-nav">Lana Rosa Academy</p>
    <a href="aprende.html">Aprende <span class="etiqueta-gratis">Tutoriales gratis</span></a>
    <a href="recursos-rosina.html">Rincón de Rosina <span class="etiqueta-gratis">Material gratuito</span></a>
    <p class="grupo-nav">Lana Rosa</p>
    <a href="revista.html">Revista</a>
    <a href="sobre-nosotras.html">Sobre nosotras</a>
    <p class="grupo-nav">Ayuda</p>
    <a href="preguntas-frecuentes.html">Preguntas frecuentes</a>
    <a href="contacto.html">Contacto</a>
    <a href="precios.html">Precios</a>
  </nav>'''
    texto, enlace = LOGO[casa]
    img, alt = LOGO_IMG.get(casa, ('img/logo-lana-rosa.jpg', 'Lana Rosa Crochet'))
    return f'''<!-- CASAS:INICIO (generado por herramientas/sincronizar_encabezado.py) -->
{franja(casa)}
<header class="encabezado" data-casa="{casa or 'comun'}">
  <div class="contenedor">
    <a href="{enlace}" class="logo"><img src="{img}" alt="{alt}" class="logo-img" width="600" height="384"><span class="texto-logo">{texto}</span></a>
    <nav aria-label="Navegación principal">
      <ul class="nav-principal">
{chr(10).join(lis)}
      </ul>
    </nav>
    <button class="menu-movil" id="boton-menu-movil" aria-label="Abrir menú" aria-expanded="false">☰</button>
    <div class="contenedor-buscar-header">
      <button type="button" class="boton-buscar-header" id="boton-buscar-header" aria-label="Buscar productos">🔍</button>
      <form class="panel-buscar-header" id="panel-buscar-header" action="{buscar}" method="get">
        <input type="text" name="buscar" id="input-buscar-header" placeholder="Buscar productos...">
        <button type="submit" aria-label="Buscar">🔍</button>
      </form>
    </div>
    <a href="cuenta.html" class="boton-cuenta-header" aria-label="Mi cuenta">👤</a>
    <button class="boton-carrito-header" id="boton-carrito" aria-label="Ver carrito de compras">
      🛒<span class="contador-carrito" id="contador-carrito">0</span>
    </button>
  </div>
</header>
{movil}
<!-- CASAS:FIN -->'''

PIE_FAQ = {'crochet': 'preguntas-frecuentes.html', 'merceria': 'merceria/preguntas-frecuentes/', 'academy': 'academy/preguntas-frecuentes/'}
PIE_REVISTA = {'crochet': 'revista.html?casa=crochet', 'merceria': 'revista.html?casa=merceria', 'academy': 'revista.html?casa=academy'}
PIE_COMUN = ('Tres casas, una sola familia: amigurumis, mercería y academia de crochet en Manizales / Villamaría, Colombia.', 'Nuestras casas',
             [('Tienda de amigurumis', 'tienda.html'), ('Personaliza el tuyo', 'personaliza.html'), ('Mercería', 'merceria/'),
              ('Lana Rosa Academy', 'academy/'), ('Revista', 'revista.html')])
PIE_HORARIO = ('Lun a vie 7:30 a.m. a 6:15 p.m.', 'Sáb 8:00 a.m. a 12:00 m.')

def pie_casa(modelo, casa):
    """Pie compacto: marca + redes, enlaces de la casa, Lana Rosa, contacto; luego pagos/apoyo y legal en una franja."""
    frase, titulo, enlaces = PIE.get(casa) or PIE_COMUN
    img, alt = LOGO_IMG.get(casa, ('img/logo-lana-rosa.jpg', 'Lana Rosa Crochet'))
    def li(t, h):
        if not h: return f'\n        <li>{t}</li>'
        ext = ' target="_blank" rel="noopener"' if h.startswith('http') else ''
        return f'\n        <li><a href="{h}"{ext}>{t}</a></li>'
    # los enlaces de la casa: sin duplicados de Precios, sin horarios sueltos (van en Contáctanos)
    enl = [(t, h) for t, h in enlaces if h and t not in ('Precios', 'Herrajes', 'Comprar en línea', 'Inicio de Academy', 'Calculadoras', 'Agenda')]
    lis = ''.join(li(t, h) for t, h in enl)
    faq = PIE_FAQ.get(casa, 'preguntas-frecuentes.html')
    rev = PIE_REVISTA.get(casa, 'revista.html')
    horario = ''.join(li(t, None) for t in PIE_HORARIO) if casa == 'merceria' else ''
    return f'''<footer class="pie-rico">
  <div class="contenedor pie-grid">
    <div class="pie-marca">
      <div class="pie-logo-wrap"><img src="{img}" alt="{alt}" loading="lazy" decoding="async"></div>
      <p>{frase}</p>
      <div class="pie-redes" aria-label="Redes sociales">
        <a href="https://www.instagram.com/lanarosacrochet" target="_blank" rel="noopener">Instagram</a>
        <a href="https://www.facebook.com/lana.rosa.2025" target="_blank" rel="noopener">Facebook</a>
        <a href="https://www.tiktok.com/@lanarosacrochet" target="_blank" rel="noopener">TikTok</a>
        <a href="https://www.youtube.com/@LanaRosaAcademy" target="_blank" rel="noopener">YouTube</a>
      </div>
    </div>
    <div class="pie-col">
      <h3>{titulo}</h3>
      <ul>{lis}
      </ul>
    </div>
    <div class="pie-col">
      <h3>Lana Rosa</h3>
      <ul>
        <li><a href="sobre-nosotras.html">Quiénes somos</a></li>
        <li><a href="{rev}">Revista</a></li>
        <li><a href="{faq}">Preguntas frecuentes</a></li>
        <li><a href="precios.html">Precios</a></li>
        <li><a href="contacto.html">Contacto</a></li>
      </ul>
    </div>
    <div class="pie-col pie-contacto">
      <h3>Contáctanos</h3>
      <ul>
        <li><a href="https://wa.me/573205072801" target="_blank" rel="noopener">WhatsApp 320 507 2801</a></li>
        <li><a href="mailto:contacto@lanarosacrochet.com">contacto@lanarosacrochet.com</a></li>
        <li>Calle 10 #5-37 Centro, Villamaría, Caldas · <a href="https://share.google/GkcZvd8av8NjmRPPM" target="_blank" rel="noopener">Ver en Google ↗</a></li>{horario}
      </ul>
    </div>
  </div>
  <div class="contenedor pie-franja">
    <div class="pie-pagos"><span class="pie-etiqueta">Pagos</span><span>Efectivo</span><span>Nequi</span><span>Bre-B</span><span>Tarjeta débito/crédito</span></div>
    <div class="pie-apoyo"><span>Con el apoyo de</span>
      <img src="img/logo-sena.png" alt="SENA" onerror="this.style.display='none'" loading="lazy" decoding="async">
      <img src="img/logo-fondo-emprender.webp" alt="Fondo Emprender SENA" onerror="this.style.display='none'" loading="lazy" decoding="async">
    </div>
  </div>
  <div class="contenedor pie-legal">
    <a href="politicas.html#envios">Envíos</a>
    <a href="politicas.html#cambios">Cambios</a>
    <a href="politicas.html#datos">Datos personales</a>
    <a href="politicas.html#uso">Uso del sitio</a>
    <a href="politicas.html#cookies">Cookies</a>
    <span class="derechos">© 2026 Lana Rosa Crochet</span>
  </div>
</footer>'''

def main():
    # el pie modelo es el de las páginas comunes (contacto.html no tiene casa, así que nunca se modifica)
    modelo = None
    archivos = sorted(glob.glob(os.path.join(RAIZ, '*.html'))) + sorted(glob.glob(os.path.join(RAIZ, 'merceria', '**', 'index.html'), recursive=True)) + sorted(glob.glob(os.path.join(RAIZ, 'academy', '**', 'index.html'), recursive=True))
    for f in archivos:
        rel = os.path.relpath(f, RAIZ).replace(os.sep, '/')
        # merceria/index.html -> merceria; merceria/catalogo/index.html -> merceria-catalogo
        n = rel[:-len('/index.html')].replace('/', '-') if rel.endswith('/index.html') else rel[:-5]
        if n in ('404', 'merceria') and rel == n + '.html':
            continue  # 404 y la redirección merceria.html no llevan menú
            continue
        s = open(f, encoding='utf-8').read()
        if '<!-- CASAS:INICIO' in s:
            s = re.sub(r'<!-- CASAS:INICIO.*?<!-- CASAS:FIN -->', lambda m: encabezado(n), s, flags=re.S)
        else:
            a = s.find('<header class="encabezado"')
            b = s.find('</nav>', s.find('id="nav-movil-panel"')) + len('</nav>')
            if a < 0 or b < 10:
                print('sin encabezado:', n); continue
            s = s[:a] + encabezado(n) + s[b:]
        bloque = f'<!-- PIE:INICIO (generado) -->\n{pie_casa(modelo, CASA_DE.get(n))}\n<!-- PIE:FIN -->'
        if '<!-- PIE:INICIO' in s:
            s = re.sub(r'<!-- PIE:INICIO.*?<!-- PIE:FIN -->', lambda m: bloque, s, flags=re.S)
        else:
            s = re.sub(r'<footer class="pie-rico".*?</footer>', lambda m: bloque, s, count=1, flags=re.S)
        casa = CASA_DE.get(n)
        # íconos de pestaña y color de la barra: quita los que había y pone los de la casa
        s = re.sub(r'<!-- ICONOS:INICIO.*?<!-- ICONOS:FIN -->\n?', '', s, flags=re.S)
        s = re.sub(r'<link rel="icon"[^>]*>\n?|<link rel="apple-touch-icon"[^>]*>\n?|<meta name="theme-color"[^>]*>\n?', '', s)
        s = s.replace('</head>', iconos(casa) + '\n</head>', 1)
        s = re.sub(r'<html lang="es-CO"[^>]*>', '<html lang="es-CO"' + (f' data-casa="{casa}"' if casa else '') + '>', s, count=1)
        open(f, 'w', encoding='utf-8').write(s)
        print('ok', n)

main()
