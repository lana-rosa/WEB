import html, json, sys
sys.path.insert(0, sys.argv[1])
from glosario_datos import TERMINOS, CATEGORIAS

WEB = '/home/user/WEB/'
e = html.escape
AVATARES = ['rosina-saludo.jpg', 'rosina-corazon.jpg', 'rosina-abrazo.jpg', 'rosina-checklist.jpg']

src = open(WEB + 'rosina.html', encoding='utf-8').read()

css = '''
/* ===== Glosario ilustrado ===== */
.boton-primario, .boton-secundario { display: inline-block; padding: 12px 26px; border-radius: 999px; text-decoration: none; font-weight: 600; font-size: 0.95rem; font-family: var(--fuente-cuerpo); cursor: pointer; border: 2px solid var(--rosa-principal); }
.boton-primario { background: var(--rosa-principal); color: var(--blanco); }
.boton-primario:hover { background: #B83E78; border-color: #B83E78; }
.boton-secundario { background: transparent; color: var(--rosa-principal); }
.boton-secundario:hover { background: var(--rosa-suave); }
.herramientas-glosario { position: sticky; top: 100px; z-index: 5; background: rgba(250, 250, 247, 0.96); backdrop-filter: blur(6px); padding: 14px 0; display: flex; gap: 12px; flex-wrap: wrap; align-items: center; border-bottom: 1px solid rgba(69,69,74,0.08); margin-bottom: 26px; }
@media (max-width: 600px) { .herramientas-glosario { top: 80px; } }
.buscador { flex: 1 1 240px; display: flex; align-items: center; gap: 8px; background: var(--blanco); border: 1.5px solid var(--rosa-medio); border-radius: 999px; padding: 4px 6px 4px 16px; }
.buscador input { flex: 1; border: none; outline: none; background: transparent; font-family: var(--fuente-cuerpo); font-size: 0.98rem; padding: 8px 0; color: var(--tinta); min-width: 0; }
.chips { display: flex; gap: 8px; flex-wrap: wrap; }
.chips button { background: var(--blanco); border: 1.5px solid var(--rosa-medio); color: var(--tinta); border-radius: 999px; padding: 7px 14px; font-family: var(--fuente-cuerpo); font-weight: 600; font-size: 0.85rem; cursor: pointer; }
.chips button[aria-pressed="true"] { background: var(--rosa-principal); border-color: var(--rosa-principal); color: var(--blanco); }
.categoria-glosario { margin-bottom: 40px; scroll-margin-top: 190px; }
.categoria-glosario > h2 { display: flex; align-items: center; gap: 10px; }
.categoria-glosario > h2 small { font-family: var(--fuente-cuerpo); font-size: 0.85rem; color: var(--tinta-suave); font-weight: 500; }
.tarjetas { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; }
@media (max-width: 800px) { .tarjetas { grid-template-columns: 1fr; } }
.termino { background: var(--blanco); border-radius: var(--radio-suave); box-shadow: var(--sombra-suave); padding: 22px; display: grid; grid-template-columns: 76px minmax(0, 1fr); gap: 18px; align-items: start; scroll-margin-top: 190px; }
.termino:target { outline: 3px solid var(--rosa-medio); }
.ilustracion { width: 76px; height: 76px; border-radius: 18px; background: var(--rosa-suave); display: flex; align-items: center; justify-content: center; font-size: 2.3rem; }
.ilustracion svg { width: 60px; height: 60px; }
.termino h3 { margin: 0; font-size: 1.2rem; color: var(--tinta); display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.termino h3 a { color: inherit; text-decoration: none; }
.abrev { font-family: var(--fuente-cuerpo); font-size: 0.8rem; font-weight: 700; background: var(--rosa-principal); color: var(--blanco); border-radius: 999px; padding: 2px 10px; }
.ingles { font-size: 0.82rem; color: var(--tinta-suave); margin: 4px 0 0; }
.ingles span { font-weight: 700; color: var(--lila); }
.termino p.def { margin: 10px 0 0; font-size: 0.95rem; }
.termino .otros { font-size: 0.85rem; color: var(--tinta-suave); font-style: italic; margin: 6px 0 0; }
.termino details { margin-top: 10px; }
.termino summary { cursor: pointer; font-weight: 700; color: var(--rosa-principal); font-size: 0.9rem; }
.termino ol { margin: 8px 0 0; padding-left: 20px; font-size: 0.92rem; }
.termino ol li { margin-bottom: 4px; }
.rosina-dice { display: flex; gap: 10px; align-items: flex-start; background: var(--lila-suave); border-radius: 14px; padding: 10px 12px; margin-top: 12px; font-size: 0.88rem; }
.rosina-dice img { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; flex-shrink: 0; background: var(--blanco); }
.rosina-dice p { margin: 0; }
.enlace-termino { display: inline-block; margin-top: 10px; font-weight: 600; font-size: 0.9rem; }
.sin-resultados { text-align: center; color: var(--tinta-suave); padding: 30px 0; }
.leyenda { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; background: var(--blanco); border-left: 6px solid var(--lila); border-radius: 12px; padding: 14px 18px; margin-top: 18px; font-size: 0.92rem; max-width: 780px; }
.leyenda img { width: 52px; height: 52px; border-radius: 50%; object-fit: cover; }
.leyenda p { margin: 0; flex: 1 1 260px; }
@media print {
  @page { margin: 12mm; }
  body { background: #fff; }
  .encabezado, .nav-movil-panel, .pie-rico, .whatsapp-flotante, .boton-subir, .overlay-carrito, .panel-carrito, .no-imprimir, .herramientas-glosario, .enlace-termino { display: none !important; }
  .hero-rosina { display: none; }
  .termino { box-shadow: none; border: 1px solid #ddd; break-inside: avoid; padding: 12px; }
  .termino details { display: block; }
  .termino details > * { display: block; }
  .tarjetas { gap: 10px; }
  .ilustracion, .abrev, .rosina-dice { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .categoria-glosario { break-before: auto; }
}
'''

def ilustracion(t):
    if t.get('simbolo'):
        return f'<div class="ilustracion" aria-hidden="true"><svg viewBox="0 0 60 60">{t["simbolo"]}</svg></div>'
    return f'<div class="ilustracion" aria-hidden="true">{t["icono"]}</div>'

def tarjeta(t, n):
    texto_busqueda = ' '.join([t['nombre'], t.get('abrev', ''), t.get('en', ''), t.get('otros', ''), t['definicion']]).lower()
    h = [f'<article class="termino" id="{t["id"]}" data-cat="{t["cat"]}" data-buscar="{e(texto_busqueda)}">', ilustracion(t), '<div>']
    abrev = f' <span class="abrev">{e(t["abrev"])}</span>' if t.get('abrev') else ''
    h.append(f'<h3><a href="#{t["id"]}">{e(t["nombre"])}</a>{abrev}</h3>')
    h.append(f'<p class="ingles"><span>EN</span> {e(t["en"])}</p>')
    if t.get('otros'):
        h.append(f'<p class="otros">{e(t["otros"])}</p>')
    h.append(f'<p class="def">{e(t["definicion"])}</p>')
    if t.get('pasos'):
        h.append('<details><summary>Cómo se hace</summary><ol>' + ''.join(f'<li>{e(p)}</li>' for p in t['pasos']) + '</ol></details>')
    if t.get('tip'):
        av = AVATARES[n % len(AVATARES)]
        h.append(f'<div class="rosina-dice"><img src="img/mini/{av.replace(".jpg", ".webp")}" alt="" aria-hidden="true" loading="lazy"><p><strong>Rosina dice:</strong> {e(t["tip"])}</p></div>')
    if t.get('enlace'):
        url, txt = t['enlace']
        h.append(f'<a class="enlace-termino" href="{url}">{e(txt)} →</a>')
    h.append('</div></article>')
    return '\n'.join(h)

partes, n = [], 0
for cid, cnombre in CATEGORIAS:
    ts = [t for t in TERMINOS if t['cat'] == cid]
    tarjetas = []
    for t in ts:
        tarjetas.append(tarjeta(t, n)); n += 1
    partes.append(f'''  <section class="categoria-glosario" id="cat-{cid}" data-categoria="{cid}">
    <h2>{e(cnombre)} <small>{len(ts)} términos</small></h2>
    <div class="tarjetas">
{chr(10).join(tarjetas)}
    </div>
  </section>''')

chips = ''.join(f'<button type="button" data-filtro="{cid}" aria-pressed="false">{e(c)}</button>' for cid, c in CATEGORIAS)

main = f'''<main>
  <section class="hero-rosina contenedor">
    <div class="marco-rosina">
      <img src="img/rosina-aprende.jpg" alt="Rosina, la ovejita de Lana Rosa Crochet, tejiendo en su escritorio">
    </div>
    <div>
      <p class="eslogan">Material gratuito · Aprende con Rosina</p>
      <h1>Glosario ilustrado de crochet</h1>
      <p class="intro">¿Qué es una disminución invisible? ¿En qué hebra tejo? Rosina te explica {len(TERMINOS)} términos de crochet y amigurumi con palabras sencillas, el símbolo que verás en los patrones, cómo se hacen paso a paso y su nombre en inglés.</p>
      <div class="leyenda">
        <img src="img/mini/rosina-saludo.webp" alt="" aria-hidden="true" loading="lazy" decoding="async">
        <p>Los dibujos rosados son los <strong>símbolos internacionales</strong> que aparecen en los diagramas de crochet. ¡Aprende a reconocerlos y podrás leer patrones de cualquier país!</p>
      </div>
      <p class="no-imprimir" style="margin-top:18px; display:flex; gap:10px; flex-wrap:wrap;">
        <button type="button" class="boton-primario" id="imprimir-glosario">🖨️ Imprimir glosario</button>
        <a class="boton-secundario" href="recursos-rosina.html#abreviaturas">Abreviaturas en 8 idiomas</a>
      </p>
    </div>
  </section>

  <div class="contenedor">
    <div class="herramientas-glosario" role="search">
      <label class="buscador"><span aria-hidden="true">🔍</span><input type="search" id="buscar-termino" placeholder="Busca un término: aumento, FLO, lazada…" aria-label="Buscar término"></label>
      <div class="chips" role="group" aria-label="Filtrar por categoría"><button type="button" data-filtro="todos" aria-pressed="true">Todos</button>{chips}</div>
    </div>
{chr(10).join(partes)}
    <p class="sin-resultados" id="sin-resultados" hidden>Rosina no encontró ese término. 🐑 Prueba con otra palabra o <a href="https://wa.me/573205072801" target="_blank" rel="noopener">pregúntanos por WhatsApp</a>.</p>
  </div>

  <section class="contenedor no-imprimir" style="text-align:center;">
    <h2>¿Lista para practicar?</h2>
    <p style="color:var(--tinta-suave); max-width:56ch; margin:0 auto 20px;">Revisa la checklist de tu primer amigurumi o aprende con nosotras en uno de nuestros talleres.</p>
    <p style="display:flex; gap:10px; justify-content:center; flex-wrap:wrap;">
      <a class="boton-primario" href="recursos-rosina.html#checklist">Checklist del primer amigurumi</a>
      <a class="boton-secundario" href="aprende.html">Ver talleres</a>
    </p>
  </section>
</main>'''

js = '''<script>
(function() {
  var input = document.getElementById('buscar-termino');
  var chips = document.querySelectorAll('.chips button');
  var terminos = document.querySelectorAll('.termino');
  var secciones = document.querySelectorAll('.categoria-glosario');
  var vacio = document.getElementById('sin-resultados');
  var filtro = 'todos';
  function normalizar(t) { return t.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, ''); }
  terminos.forEach(function(t) { t.dataset.buscarNorm = normalizar(t.dataset.buscar); });
  function aplicar() {
    var q = normalizar(input.value.trim());
    var visibles = 0;
    terminos.forEach(function(t) {
      var ok = (filtro === 'todos' || t.dataset.cat === filtro) && (!q || t.dataset.buscarNorm.indexOf(q) !== -1);
      t.hidden = !ok;
      if (ok) visibles++;
    });
    secciones.forEach(function(s) { s.hidden = !s.querySelector('.termino:not([hidden])'); });
    vacio.hidden = visibles > 0;
  }
  input.addEventListener('input', aplicar);
  chips.forEach(function(chip) {
    chip.addEventListener('click', function() {
      filtro = chip.dataset.filtro;
      chips.forEach(function(c) { c.setAttribute('aria-pressed', c === chip); });
      aplicar();
    });
  });
  document.getElementById('imprimir-glosario').addEventListener('click', function() {
    input.value = ''; filtro = 'todos';
    chips.forEach(function(c) { c.setAttribute('aria-pressed', c.dataset.filtro === 'todos'); });
    aplicar();
    document.querySelectorAll('.termino details').forEach(function(d) { d.open = true; });
    window.print();
  });
})();
</script>
'''

ld = {
    '@context': 'https://schema.org', '@type': 'DefinedTermSet',
    'name': 'Glosario ilustrado de crochet de Rosina',
    'url': 'https://lanarosacrochet.com/glosario-rosina.html', 'inLanguage': 'es',
    'hasDefinedTerm': [{'@type': 'DefinedTerm', 'name': t['nombre'], 'termCode': t.get('abrev') or None,
                        'description': t['definicion'], 'url': 'https://lanarosacrochet.com/glosario-rosina.html#' + t['id']} for t in TERMINOS],
}
for d in ld['hasDefinedTerm']:
    if d['termCode'] is None: del d['termCode']
ldtag = '<script type="application/ld+json">\n' + json.dumps(ld, ensure_ascii=False, indent=1) + '\n</script>\n'

def rep(s, a, b):
    assert s.count(a) == 1, a
    return s.replace(a, b)

desc = f'Glosario ilustrado de crochet y amigurumi: {len(TERMINOS)} términos explicados por Rosina, con símbolos de patrones, paso a paso y su nombre en inglés.'
src = rep(src, '<title>Conoce a Rosina — Lana Rosa Crochet</title>', '<title>Glosario ilustrado de crochet — Rosina · Lana Rosa Crochet</title>')
src = rep(src, '<meta name="description" content="Rosina es la ovejita de lana esponjosa, embajadora de calidad y asistente de enseñanza de Lana Rosa Crochet. Conoce su historia y sus tips.">', f'<meta name="description" content="{e(desc)}">')
src = src.replace('https://lanarosacrochet.com/rosina.html', 'https://lanarosacrochet.com/glosario-rosina.html')
src = rep(src, '<meta property="og:title" content="Conoce a Rosina — Lana Rosa Crochet">', '<meta property="og:title" content="Glosario ilustrado de crochet — Rosina">')
src = rep(src, '<meta property="og:description" content="La ovejita embajadora de Lana Rosa Crochet: curiosa, detallista y muy amable.">', f'<meta property="og:description" content="{e(desc)}">')
src = rep(src, '<meta property="og:image" content="https://lanarosacrochet.com/img/rosina.jpg">', '<meta property="og:image" content="https://lanarosacrochet.com/img/rosina-aprende.jpg">')
i = src.index('</style>'); src = src[:i] + css + src[i:]
i = src.index('</head>'); src = src[:i] + ldtag + src[i:]
a = src.index('<main>'); b = src.index('</main>') + len('</main>')
src = src[:a] + main + src[b:]
if '<script>\n(function() {\n  var video' in src:
    v0 = src.index('<script>\n(function() {\n  var video'); v1 = src.index('</script>', v0) + len('</script>\n')
    src = src[:v0] + src[v1:]
i = src.rindex('</body>'); src = src[:i] + js + src[i:]
open(WEB + 'glosario-rosina.html', 'w', encoding='utf-8').write(src)
print('ok', len(TERMINOS), 'términos')
