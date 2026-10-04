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
    'merceria': 'merceria',
    'aprende': 'academy', 'recursos-rosina': 'academy', 'rosina': 'academy', 'glosario-rosina': 'academy',
    'paletas-rosina': 'academy', 'calculadoras-rosina': 'academy', 'agenda-rosina': 'academy',
}
CASAS = [('crochet', 'Crochet', 'index.html'), ('merceria', 'Mercería', 'merceria.html'), ('academy', 'Academy', 'aprende.html')]
CLASE = {'crochet': 'g-tienda', 'merceria': 'g-merceria', 'academy': 'g-aprende', 'comun': 'g-comun'}

# (texto, enlace, clase de color)
MENUS = {
    'crochet': [('Tienda', 'tienda.html', 'crochet'), ('Personaliza el tuyo', 'personaliza.html', 'crochet'),
                ('Revista', 'revista.html', 'comun'), ('Sobre nosotras', 'sobre-nosotras.html', 'comun')],
    'merceria': [('Mercería', 'merceria.html', 'merceria'),
                 ('Revista', 'revista.html', 'comun'), ('Sobre nosotras', 'sobre-nosotras.html', 'comun')],
    'academy': [('Aprende', 'aprende.html', 'academy'), ('Rincón de Rosina', 'recursos-rosina.html', 'academy'),
                ('Revista', 'revista.html', 'comun'), ('Sobre nosotras', 'sobre-nosotras.html', 'comun')],
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
    menu = MENUS[casa or 'crochet']
    lis = []
    for i, (t, h, g) in enumerate(menu):
        ini = ' grupo-inicio' if i == 0 else ''
        lis.append(f'        <li class="{CLASE[g]}{ini}"><a href="{h}">{t}</a></li>')
    buscar = 'merceria.html' if pagina == 'merceria' else 'tienda.html'
    def act(h):
        return ' class="casa-actual"' if h.split('.')[0] == pagina else ''
    movil = f'''  <nav class="nav-movil-panel" id="nav-movil-panel" aria-label="Navegación móvil">
    <a href="index.html">Inicio</a>
    <a href="cuenta.html">👤 Mi cuenta</a>
    <p class="grupo-nav">Crochet</p>
    <a href="tienda.html">Tienda</a>
    <a href="personaliza.html">Personaliza el tuyo</a>
    <p class="grupo-nav">Mercería</p>
    <a href="merceria.html">Mercería</a>
    <p class="grupo-nav">Academy</p>
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
    return f'''<!-- CASAS:INICIO (generado por herramientas/sincronizar_encabezado.py) -->
{franja(casa)}
<header class="encabezado" data-casa="{casa or 'comun'}">
  <div class="contenedor">
    <a href="index.html" class="logo"><img src="img/logo-lana-rosa.jpg" alt="Lana Rosa Crochet" class="logo-img"><span class="texto-logo">Inicio</span></a>
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

def main():
    # el pie modelo vive en index.html la primera vez; luego se toma del marcador
    idx = open(os.path.join(RAIZ, 'index.html'), encoding='utf-8').read()
    modelo = pie(idx)
    for f in sorted(glob.glob(os.path.join(RAIZ, '*.html'))):
        n = os.path.basename(f)[:-5]
        if n == '404':
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
        bloque = f'<!-- PIE:INICIO (generado) -->\n{modelo}\n<!-- PIE:FIN -->'
        if '<!-- PIE:INICIO' in s:
            s = re.sub(r'<!-- PIE:INICIO.*?<!-- PIE:FIN -->', lambda m: bloque, s, flags=re.S)
        else:
            s = re.sub(r'<footer class="pie-rico".*?</footer>', lambda m: bloque, s, count=1, flags=re.S)
        open(f, 'w', encoding='utf-8').write(s)
        print('ok', n)

main()
