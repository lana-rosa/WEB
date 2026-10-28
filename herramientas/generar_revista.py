#!/usr/bin/env python3
"""Genera la Revista: una página por artículo (/revista/<slug>/) y la portada con tarjetas (/revista.html).

Fuente: herramientas/revista/articulos/<slug>.html (primera línea: un comentario con los datos en JSON; luego el cuerpo del artículo)
y herramientas/revista/plantilla.html (cabecera, pie y estilos). Para cambiar un artículo se edita su archivo y se vuelve a generar:

  python3 herramientas/generar_revista.py
  python3 herramientas/sincronizar_encabezado.py     # menú y pie de las páginas nuevas

Datos de cada artículo: slug, titulo, categorias (separadas por espacio; la primera da el nombre que se ve), casas (en cuáles casas aparece),
categoria (nombre visible), publicado (AAAA-MM-DD), actualizado (opcional), firma ('rosina' = Rosina y el equipo: tips de tejido; 'equipo' = El equipo:
pedidos, regalos y negocio).
Los enlaces antiguos /revista.html#<slug> siguen funcionando: la portada los lleva a la página del artículo.
"""
import html, json, math, os, re

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
ARTICULOS = os.path.join(RAIZ, 'herramientas', 'revista', 'articulos')
SITIO = 'https://lanarosacrochet.com'
ORDEN = ['cuanta-lana-necesito', 'puntos-basicos-crochet', 'colores-combinan-amigurumis', 'errores-comunes-principiantes', 'conoce-a-rosina', 'cuidar-lavar-tejidos', 'cuanto-cobrar-tejidos',
         'regalos-graduacion', 'anillo-magico', 'leer-patron-crochet', 'elegir-hilo-amigurumi', 'aguja-segun-hilo', 'amigurumi-de-tu-mascota',
         'fotos-amigurumi-personalizado', 'empezar-crochet', 'materiales-primer-amigurumi', 'pedir-amigurumi-personalizado', 'pausas-activas',
         'ideas-regalo', 'tejer-desconectar']
ANTIGUOS = {'cuidado-amigurumi': 'cuidar-lavar-tejidos'}   # artículos que se unieron a otro
FILTROS = [('crochet', '🧶 Crochet'), ('regalos', '🎁 Regalos'), ('cuidados', '🧺 Cuidados'), ('bienestar', '🌸 Bienestar'),
           ('rosina', '🐑 Mundo Rosina'), ('emprendimiento', '💼 Emprendimiento')]
FIRMAS = {'rosina': '— Rosina 🐑 y el equipo de Lana Rosa', 'equipo': '— El equipo de Lana Rosa'}
MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
e = html.escape

def fecha_larga(iso):
    a, m, d = iso.split('-'); return f'{int(d)} de {MESES[int(m) - 1]} de {a}'
def mes_anio(iso):
    a, m, _ = iso.split('-'); return f'{MESES[int(m) - 1]} de {a}'

def texto(h):
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', h))).strip()

def leer():
    arts = {}
    for slug in ORDEN:
        s = open(os.path.join(ARTICULOS, slug + '.html'), encoding='utf-8').read()
        m = re.match(r'<!--(\{.*?\})-->\n', s, re.S)
        d = json.loads(m.group(1)); d['cuerpo'] = s[m.end():].strip()
        palabras = len(texto(d['cuerpo']).split())
        d['minutos'] = max(1, round(palabras / 200))
        primera = re.search(r'<p>(.*?)</p>', d['cuerpo'], re.S)
        d['resumen'] = texto(primera.group(1)) if primera else ''
        d['descripcion'] = d.get('descripcion_seo') or recorte(d['resumen'], 155)
        arts[slug] = d
    return [arts[s] for s in ORDEN]

def recorte(t, n):
    if len(t) <= n: return t
    return t[:n].rsplit(' ', 1)[0].rstrip(',;:') + '…'

def meta_linea(d, largo=True):
    partes = [d['categoria']]
    if largo:
        partes.append('Actualizado el ' + fecha_larga(d['actualizado']) if d.get('actualizado') else 'Publicado en ' + mes_anio(d['publicado']))
    partes.append(f"{d['minutos']} min de lectura")
    return ' · '.join(partes)

def tarjeta(d):
    return (f'<a class="tarjeta-revista" href="/revista/{d["slug"]}/" data-categorias="{e(d["categorias"])}" data-casas="{e(d["casas"])}">'
            f'<span class="meta">{e(meta_linea(d, False))}</span><h2>{d["titulo"]}</h2><p>{e(recorte(d["resumen"], 150))}</p>'
            '<span class="leer">Leer el artículo →</span></a>')

CSS = '''
/* Revista: portada con tarjetas y páginas de artículo */
.tarjetas-revista { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin: 0 0 40px; }
@media (max-width: 760px) { .tarjetas-revista { grid-template-columns: minmax(0, 1fr); } }
.tarjeta-revista { display: flex; flex-direction: column; gap: 8px; padding: 20px; border-radius: var(--radio-suave); background: var(--blanco); box-shadow: var(--sombra-suave); color: var(--tinta); text-decoration: none; border: 2px solid transparent; }
.tarjeta-revista[hidden] { display: none; }
.tarjeta-revista:hover, .tarjeta-revista:focus-visible { border-color: var(--rosa-medio); outline: none; }
.tarjeta-revista .meta { font-size: 0.8rem; color: var(--tinta-suave); }
.tarjeta-revista h2 { font-size: 1.15rem; margin: 0; color: var(--rosa-texto); line-height: 1.3; }
.tarjeta-revista p { margin: 0; color: var(--tinta-suave); font-size: 0.93rem; }
.tarjeta-revista .leer { margin-top: auto; padding-top: 6px; font-weight: 700; color: var(--rosa-texto); font-size: 0.92rem; }
.migas { margin: 26px 0 0; font-size: 0.92rem; }
.migas a { color: var(--rosa-texto); font-weight: 600; text-decoration: none; }
article.post h1 { font-size: clamp(1.6rem, 4vw, 2.2rem); margin: 0 0 14px; line-height: 1.2; }
article.post .firma { margin-top: 18px; color: var(--tinta-suave); font-style: italic; }
.recursos-gratis { background: var(--rosa-suave); border-radius: var(--radio-suave); padding: 22px; margin: 0 0 34px; text-align: center; }
.recursos-gratis h2 { font-size: 1.2rem; margin: 0 0 6px; }
.recursos-gratis p { margin: 0 auto 12px; max-width: 52ch; color: var(--tinta); font-size: 0.95rem; }
.recursos-gratis .rg-botones { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; }
.recursos-gratis a { display: inline-block; padding: 12px 24px; border-radius: 999px; font-weight: 700; text-decoration: none; background: var(--rosa-boton); color: var(--sobre-principal); border: 2px solid var(--rosa-boton); }
.recursos-gratis a:hover, .recursos-gratis a:focus-visible { background: var(--rosa-boton-hover); border-color: var(--rosa-boton-hover); outline: none; }
.recursos-gratis a.rg-2 { background: #fff; color: var(--rosa-texto); }
.recursos-gratis a.rg-2:hover, .recursos-gratis a.rg-2:focus-visible { background: #fff; border-color: var(--rosa-boton-hover); }
.mas-articulos { margin: 10px 0 40px; }
.mas-articulos h2 { font-size: 1.3rem; margin: 0 0 14px; }
</style>'''

def ld_json(obj):
    return '<script type="application/ld+json">\n' + json.dumps(obj, ensure_ascii=False, indent=2) + '\n</script>'

def pagina(plantilla, **c):
    s = plantilla.replace('</style>', CSS, 1)
    for k, v in c.items(): s = s.replace('{{' + k + '}}', v)
    if c.get('PREF'):
        s = s.replace('<html lang="es-CO" data-casa="crochet">', f'<html lang="es-CO" data-casa="crochet" data-casa-pref="{c["PREF"]}">', 1)
    return s

SCRIPT_PORTADA = '''<script>
// Revista: los enlaces antiguos /revista.html#<artículo> llevan a la página del artículo
(function () {
  var A = %(antiguos)s;
  var h = location.hash.slice(1);
  if (h && A[h]) location.replace('/revista/' + A[h] + '/' + location.search);
})();
// Filtro de la Revista: cada casa muestra solo sus artículos (data-casas). La casa viene de ?casa=merceria|academy|crochet (sin parámetro: Tienda de amigurumis).
(function () {
  var botones = document.querySelectorAll('.categorias-revista button');
  var articulos = document.querySelectorAll('.tarjeta-revista');
  var vacio = document.getElementById('sin-articulos');
  var CASAS = ['crochet', 'merceria', 'academy'];
  var q = new URLSearchParams(location.search).get('casa');
  var cat = 'todas', casa = CASAS.indexOf(q) > -1 ? q : 'crochet';
  try { if (CASAS.indexOf(q) < 0) casa = sessionStorage.getItem('lrCasa') || 'crochet'; if (CASAS.indexOf(casa) < 0) casa = 'crochet'; } catch (e) {}
  function deCasa(a) { return (a.dataset.casas || '').split(' ').indexOf(casa) > -1; }
  function aplicar() {
    var visibles = 0;
    articulos.forEach(function (a) {
      var okCat = cat === 'todas' || a.dataset.categorias.split(' ').indexOf(cat) > -1;
      a.hidden = !(okCat && deCasa(a)); if (!a.hidden) visibles++;
    });
    botones.forEach(function (b) {
      var f = b.dataset.filtro, on = f === cat;
      b.classList.toggle('activa', on); b.setAttribute('aria-pressed', on);
      // solo se ofrecen las categorías que tienen artículos en esta casa
      b.hidden = f !== 'todas' && !Array.prototype.some.call(articulos, function (a) { return deCasa(a) && a.dataset.categorias.split(' ').indexOf(f) > -1; });
    });
    vacio.hidden = visibles > 0;
  }
  document.querySelectorAll('[data-filtro]').forEach(function (b) { b.addEventListener('click', function () { cat = b.dataset.filtro; aplicar(); }); });
  aplicar();
})();
</script>'''

def main():
    arts = leer()
    plantilla = open(os.path.join(RAIZ, 'herramientas', 'revista', 'plantilla.html'), encoding='utf-8').read()
    # ---- portada
    chips = '<button type="button" class="activa" data-filtro="todas" aria-pressed="true">Todo</button>\n    ' + '\n    '.join(
        f'<button type="button" data-filtro="{k}" aria-pressed="false">{n}</button>' for k, n in FILTROS)
    main_html = f'''<main class="contenedor">
  <div class="hero">
    <p class="eslogan">Revista Lana Rosa</p>
    <h1>Historias, cuidados y consejos desde el taller</h1>
    <p class="intro">Consejos, cuidados y aprendizajes que nacen en nuestro taller, para que tus amigurumis duren más y disfrutes cada puntada.</p>
  </div>

  <nav class="categorias-revista" aria-label="Categorías de la Revista">
    {chips}
  </nav>
  <p class="sin-articulos" id="sin-articulos" hidden>Muy pronto vamos a publicar más artículos aquí. Mientras tanto, <button type="button" data-filtro="todas">mira todas las categorías</button>.</p>

  <div class="tarjetas-revista">
  {chr(10).join('  ' + tarjeta(d) for d in arts).lstrip()}
  </div>
  <section class="recursos-gratis" aria-labelledby="rg-titulo">
    <h2 id="rg-titulo">🎁 Regalos gratis de Rosina</h2>
    <p>Stickers, fondos de pantalla, íconos y más. Son gratis con tu cuenta de Lana Rosa: se crea con tu correo, sin contraseña.</p>
    <div class="rg-botones"><a href="/recursos-rosina.html">Ver los recursos</a><a class="rg-2" href="/cuenta.html?volver=recursos-rosina.html">Crear mi cuenta gratis</a></div>
  </section>
</main>'''
    ld = ld_json({'@context': 'https://schema.org', '@type': 'Blog', 'name': 'Revista Lana Rosa Crochet', 'url': SITIO + '/revista.html',
                  'publisher': {'@type': 'Organization', 'name': 'Lana Rosa Crochet'},
                  'blogPost': [{'@type': 'BlogPosting', 'headline': texto(d['titulo']), 'datePublished': d['publicado'],
                                'url': f'{SITIO}/revista/{d["slug"]}/'} for d in arts]})
    out = pagina(plantilla, TITLE='Revista de crochet, regalos y bienestar | Lana Rosa',
                 DESC='Guías de crochet para principiantes, materiales para tu primer amigurumi, cuidados de tus tejidos y cómo pedir un amigurumi personalizado. Desde nuestro taller en Villamaría, Caldas.',
                 URL=SITIO + '/revista.html', OGTIPO='website', OGTITLE='Revista — Lana Rosa Crochet', LD=ld, MAIN=main_html,
                 SCRIPTS=SCRIPT_PORTADA % {'antiguos': json.dumps({**{d['slug']: d['slug'] for d in arts}, **ANTIGUOS})}, PREF='')
    open(os.path.join(RAIZ, 'revista.html'), 'w', encoding='utf-8').write(out)
    # ---- una página por artículo
    for d in arts:
        casas = d['casas'].split()
        rel = [x for x in arts if x['slug'] != d['slug']]
        rel.sort(key=lambda x: (-(len(set(x['casas'].split()) & set(casas))), -(len(set(x['categorias'].split()) & set(d['categorias'].split()))), ORDEN.index(x['slug'])))
        url = f'{SITIO}/revista/{d["slug"]}/'
        titulo_txt = texto(d['titulo'])
        main_a = f'''<main class="contenedor">
  <nav class="migas" aria-label="Migas de pan"><a href="/revista.html">← Revista</a></nav>
  <article class="post">
    <p class="meta">{e(meta_linea(d))}</p>
    <h1>{d["titulo"]}</h1>
    {d["cuerpo"]}
    <p class="firma">{FIRMAS[d["firma"]]}</p>
  </article>
  <section class="recursos-gratis" aria-labelledby="rg-titulo">
    <h2 id="rg-titulo">🎁 Regalos gratis de Rosina</h2>
    <p>Stickers, fondos de pantalla, íconos y más. Son gratis con tu cuenta de Lana Rosa: se crea con tu correo, sin contraseña.</p>
    <div class="rg-botones"><a href="/recursos-rosina.html">Ver los recursos</a><a class="rg-2" href="/cuenta.html?volver=recursos-rosina.html">Crear mi cuenta gratis</a></div>
  </section>
  <section class="mas-articulos" aria-labelledby="mas-titulo">
    <h2 id="mas-titulo">Sigue leyendo</h2>
    <div class="tarjetas-revista">
    {chr(10).join('    ' + tarjeta(x) for x in rel[:2]).lstrip()}
    </div>
  </section>
</main>'''
        obj = {'@context': 'https://schema.org', '@type': 'BlogPosting', 'headline': titulo_txt, 'description': d['descripcion'],
               'datePublished': d['publicado'], 'dateModified': d.get('actualizado', d['publicado']), 'inLanguage': 'es-CO',
               'mainEntityOfPage': url, 'image': SITIO + '/img/og-lana-rosa-2.jpg',
               'author': {'@type': 'Organization', 'name': 'Lana Rosa Crochet'},
               'publisher': {'@type': 'Organization', 'name': 'Lana Rosa Crochet', 'url': SITIO}}
        migas = {'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': [
            {'@type': 'ListItem', 'position': 1, 'name': 'Inicio', 'item': SITIO + '/'},
            {'@type': 'ListItem', 'position': 2, 'name': 'Revista', 'item': SITIO + '/revista.html'},
            {'@type': 'ListItem', 'position': 3, 'name': titulo_txt, 'item': url}]}
        out = pagina(plantilla, TITLE=e(d.get('titulo_seo') or (titulo_txt + ' | Revista Lana Rosa')), DESC=e(d['descripcion']), URL=url, OGTIPO='article',
                     OGTITLE=e(titulo_txt), LD=ld_json(obj) + '\n' + ld_json(migas), MAIN=main_a, SCRIPTS='', PREF=casas[0])
        os.makedirs(os.path.join(RAIZ, 'revista', d['slug']), exist_ok=True)
        open(os.path.join(RAIZ, 'revista', d['slug'], 'index.html'), 'w', encoding='utf-8').write(out)
        print('ok', d['slug'], d['minutos'], 'min')

def actualizar_sitemap_y_llms(arts):
    # sitemap: una entrada por artículo, justo después de la portada de la Revista
    sm = open(os.path.join(RAIZ, 'sitemap.xml'), encoding='utf-8').read()
    sm = re.sub(r'  <url>\s*<loc>https://lanarosacrochet\.com/revista/[^<]*</loc>.*?</url>\n', '', sm, flags=re.S)
    nuevas = ''.join(f'  <url>\n    <loc>{SITIO}/revista/{d["slug"]}/</loc>\n    <lastmod>{d.get("actualizado", d["publicado"])}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>\n' for d in arts)
    m = re.search(r'  <url>\s*<loc>https://lanarosacrochet\.com/revista\.html</loc>.*?</url>\n', sm, re.S)
    sm = sm[:m.end()] + nuevas + sm[m.end():]
    open(os.path.join(RAIZ, 'sitemap.xml'), 'w', encoding='utf-8').write(sm)
    # llms.txt: lista de artículos bajo la línea de la Revista
    ll = open(os.path.join(RAIZ, 'llms.txt'), encoding='utf-8').read()
    ll = re.sub(r'(- \[Revista\]\(https://lanarosacrochet\.com/revista\.html\):[^\n]*\n)(?:  - \[[^\n]*\n)*', lambda m: m.group(1) + ''.join(f'  - [{texto(d["titulo"])}]({SITIO}/revista/{d["slug"]}/)\n' for d in arts), ll)
    open(os.path.join(RAIZ, 'llms.txt'), 'w', encoding='utf-8').write(ll)

actualizar_sitemap_y_llms(leer())
main()
