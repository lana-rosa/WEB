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
    'merceria': 'merceria', 'merceria-catalogo': 'merceria', 'merceria-tienda-fisica': 'merceria',
    'academy': 'academy', 'aprende': 'academy', 'recursos-rosina': 'academy', 'rosina': 'academy', 'glosario-rosina': 'academy',
    'paletas-rosina': 'academy', 'calculadoras-rosina': 'academy', 'agenda-rosina': 'academy',
}
CASAS = [('crochet', 'Tienda de amigurumis', 'index.html'), ('merceria', 'Mercería', 'merceria/'), ('academy', 'Academy', 'academy/')]
CLASE = {'crochet': 'g-tienda', 'merceria': 'g-merceria', 'academy': 'g-aprende', 'comun': 'g-comun'}

# (texto, enlace, clase de color)
MENUS = {
    'crochet': [('Tienda', 'tienda.html', 'crochet'), ('Personaliza el tuyo', 'personaliza.html', 'crochet'),
                ('Precios', 'precios.html', 'crochet'), ('Sobre nosotras', 'sobre-nosotras.html', 'comun')],
    # páginas comunes (contacto, preguntas, políticas, cuenta, Revista): menú de marca con las tres casas
    'comun': [('Tienda de amigurumis', 'index.html', 'crochet'), ('Mercería', 'merceria/', 'merceria'),
              ('Academy', 'academy/', 'academy'), ('Revista', 'revista.html', 'comun'), ('Sobre nosotras', 'sobre-nosotras.html', 'comun')],
    'merceria': [('Catálogo', 'merceria/catalogo/', 'merceria'), ('Lanas', 'merceria/catalogo/#lanas-merceria', 'merceria'), ('Hilos', 'merceria/catalogo/#hilos-merceria', 'merceria'),
                 ('Agujas', 'merceria/catalogo/#agujas-merceria', 'merceria'), ('Accesorios', 'merceria/catalogo/#accesorios-merceria', 'merceria'),
                 ('Tienda física', 'merceria/tienda-fisica/', 'merceria')],
    'academy': [('Talleres', 'aprende.html#aprende', 'academy'), ('Tutoriales', 'aprende.html#crea', 'academy'),
                ('Recursos gratis', 'recursos-rosina.html', 'academy'), ('Glosario', 'glosario-rosina.html', 'academy'),
                ('Paletas', 'paletas-rosina.html', 'academy'), ('Calculadoras', 'calculadoras-rosina.html', 'academy')],
}

# imagen del logo por casa (las demás usan el logo rosa de Lana Rosa Crochet)
LOGO_IMG = {'merceria': ('img/logo-merceria.webp', 'Lana Rosa Mercería'), 'academy': ('img/logo-academy.webp', 'Lana Rosa Academy')}

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
                  ('Tienda física', 'merceria/tienda-fisica/'),
                  ('Lun a vie 7:30 a.m. a 6:15 p.m.', None), ('Sáb 8:00 a.m. a 12:00 m.', None)]),
    'academy': ('Lana Rosa Academy, academia de crochet: aprende a tejer paso a paso, sin experiencia y sin tecnicismos.', 'Academy',
                [('Inicio de Academy', 'academy/'), ('Talleres', 'aprende.html#aprende'), ('Tutoriales', 'aprende.html#crea'),
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
    <a href="personaliza.html">Personaliza el tuyo</a>
    <a href="precios.html">Precios</a>
    <a href="index.html#historias">Historias que tejimos</a>
    <p class="grupo-nav">Lana Rosa</p>
    <a href="sobre-nosotras.html">Sobre nosotras</a>
    <a href="revista.html">Revista</a>
    <p class="grupo-nav">Ayuda</p>
    <a href="preguntas-frecuentes.html">Preguntas frecuentes</a>
    <a href="contacto.html">Contacto</a>
    <p class="grupo-nav otras-casas">Otras casas de Lana Rosa</p>
    <a class="otras-casas" href="merceria/">Mercería</a>
    <a class="otras-casas" href="academy/">Lana Rosa Academy</a>
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
    <a href="revista.html">Revista</a>
    <a href="recursos-rosina.html">Recursos gratis de Rosina</a>
    <p class="grupo-nav">Ayuda</p>
    <a href="preguntas-frecuentes.html">Preguntas frecuentes</a>
    <a href="contacto.html">Contacto</a>
    <p class="grupo-nav otras-casas">Otras casas de Lana Rosa</p>
    <a class="otras-casas" href="index.html">Tienda de amigurumis</a>
    <a class="otras-casas" href="aprende.html">Lana Rosa Academy</a>
  </nav>''',
    'academy': '''  <nav class="nav-movil-panel" id="nav-movil-panel" aria-label="Navegación móvil">
    <a href="academy/">Inicio de Academy</a>
    <a href="cuenta.html">👤 Mi cuenta</a>
    <p class="grupo-nav">Aprende</p>
    <a href="aprende.html#aprende">Talleres presenciales</a>
    <a href="aprende.html#crea">Tutoriales <span class="etiqueta-gratis">Gratis</span></a>
    <a href="aprende.html#conecta">Nuestra forma de enseñar</a>
    <p class="grupo-nav">Recursos gratis de Rosina</p>
    <a href="recursos-rosina.html">Rincón de Rosina</a>
    <a href="glosario-rosina.html">Glosario</a>
    <a href="paletas-rosina.html">Paletas de color</a>
    <a href="calculadoras-rosina.html">Calculadoras</a>
    <a href="agenda-rosina.html">Agenda de proyectos</a>
    <a href="rosina.html">Conoce a Rosina</a>
    <p class="grupo-nav">Materiales e ideas</p>
    <a href="merceria/">Mercería</a>
    <a href="revista.html">Revista</a>
    <p class="grupo-nav">Ayuda</p>
    <a href="preguntas-frecuentes.html">Preguntas frecuentes</a>
    <a href="contacto.html">Contacto</a>
    <p class="grupo-nav otras-casas">Otras casas de Lana Rosa</p>
    <a class="otras-casas" href="index.html">Tienda de amigurumis</a>
    <a class="otras-casas" href="merceria/">Mercería</a>
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
    <a href="precios.html">Precios</a>
    <a href="preguntas-frecuentes.html">Preguntas frecuentes</a>
    <a href="contacto.html">Contacto</a>
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

def pie(origen):
    m = re.search(r'<footer class="pie-rico".*?</footer>', origen, re.S)
    return m.group(0)

def pie_casa(modelo, casa):
    if casa not in PIE:
        return modelo
    frase, titulo, enlaces = PIE[casa]
    if casa in LOGO_IMG:
        img, alt = LOGO_IMG[casa]
        modelo = modelo.replace('<img src="img/logo-lana-rosa.jpg" alt="Lana Rosa Crochet"', f'<img src="{img}" alt="{alt}"', 1)
    m = modelo.replace('Amigurumis y accesorios tejidos a mano en Manizales / Villamaría, Colombia.', frase, 1)
    def li(t, h):
        if not h: return f'\n        <li>{t}</li>'
        ext = ' target="_blank" rel="noopener"' if h.startswith('http') else ''
        return f'\n        <li><a href="{h}"{ext}>{t}</a></li>'
    lis = ''.join(li(t, h) for t, h in enlaces)
    return re.sub(r'<h3>Tienda</h3>\s*<ul>.*?</ul>', lambda _: f'<h3>{titulo}</h3>\n      <ul>{lis}\n      </ul>', m, count=1, flags=re.S)

def main():
    # el pie modelo es el de las páginas comunes (contacto.html no tiene casa, así que nunca se modifica)
    idx = open(os.path.join(RAIZ, 'contacto.html'), encoding='utf-8').read()
    modelo = pie(idx)
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
        s = re.sub(r'<html lang="es-CO"[^>]*>', '<html lang="es-CO"' + (f' data-casa="{casa}"' if casa else '') + '>', s, count=1)
        open(f, 'w', encoding='utf-8').write(s)
        print('ok', n)

main()
