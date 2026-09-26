import html, json, sys
sys.path.insert(0, sys.argv[1])
from paletas_datos import PALETAS, CATEGORIAS

WEB = '/home/user/WEB/'
e = html.escape
src = open(WEB + 'rosina.html', encoding='utf-8').read()

def claro(hexc):
    h = hexc.lstrip('#'); r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    return (0.299 * r + 0.587 * g + 0.114 * b) > 200

def ovillo(hexc):
    borde = ' stroke="#D9D9DE" stroke-width="1.5"' if claro(hexc) else ''
    return (f'<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="21" fill="{hexc}"{borde}/>'
            '<g fill="none" stroke="rgba(0,0,0,.16)" stroke-width="2" stroke-linecap="round">'
            '<path d="M8,17 C18,22 30,22 40,15"/><path d="M5,27 C17,33 31,33 43,25"/><path d="M11,38 C20,41 30,41 38,35"/>'
            '<path d="M17,5 C12,18 13,32 20,44"/></g><circle cx="16" cy="14" r="4" fill="rgba(255,255,255,.35)"/></svg>')

def rayas(colores):
    # manta de rayas: el primer color domina (regla 60-30-10 aproximada)
    n = len(colores); seq = []
    if n <= 4:
        pesos = {0: 6, 1: 3, 2: 2, 3: 1}
        orden = [0, 1, 0, 2, 0, 1, 0, 3 if n > 3 else 2, 0, 1]
        seq = [colores[i][1] for i in orden]
    else:
        seq = [c[1] for c in colores] + [c[1] for c in colores][::-1]
    w = 100 / len(seq)
    return '<div class="manta" aria-hidden="true">' + ''.join(f'<span style="background:{c}"></span>' for c in seq) + '</div>'

def tarjeta(p):
    datos = e(json.dumps({'nombre': p['nombre'], 'colores': p['colores']}, ensure_ascii=False))
    muestras = ''.join(f'<li>{ovillo(h)}<span class="nombre-color">{e(n)}</span><code>{h}</code></li>' for n, h in p['colores'])
    t = [f'<article class="paleta" id="{p["id"]}" data-cat="{p["cat"]}" data-paleta="{datos}">',
         f'<h3>{e(p["nombre"])}</h3>', f'<ul class="ovillos">{muestras}</ul>', rayas(p['colores']),
         f'<p class="uso">{e(p["uso"])}</p>']
    if p.get('tip'):
        t.append(f'<p class="tip-paleta"><img src="img/mini/rosina-saludo.webp" alt="" aria-hidden="true" loading="lazy" decoding="async"> <span><strong>Rosina dice:</strong> {e(p["tip"])}</span></p>')
    t.append('<div class="acciones-paleta no-imprimir"><a class="boton-primario boton-chico" data-pedir href="https://wa.me/573205072801" target="_blank" rel="noopener">🛒 Pedir estos colores</a><button type="button" class="boton-secundario boton-chico" data-copiar>📋 Copiar colores</button><button type="button" class="boton-secundario boton-chico" data-guardar>⬇ Guardar imagen</button></div>')
    t.append('</article>')
    return '\n'.join(t)

partes = []
for cid, cn in CATEGORIAS:
    ps = [p for p in PALETAS if p['cat'] == cid]
    partes.append(f'''  <section class="categoria-paletas" id="cat-{cid}" data-categoria="{cid}">
    <h2>{e(cn)}</h2>
    <div class="grid-paletas">
{chr(10).join(tarjeta(p) for p in ps)}
    </div>
  </section>''')

chips = ''.join(f'<button type="button" data-filtro="{c}" aria-pressed="false">{e(n)}</button>' for c, n in CATEGORIAS)
creador_inicial = ['#E74E96', '#FBE4EF', '#9EA2F9', '#FFF8F0']

main = f'''<main>
  <section class="contenedor intro-paletas">
    <div class="intro-paletas-texto">
      <p class="eslogan">Material gratuito · Rincón de Rosina</p>
      <h1>Paletas de colores para tejer</h1>
      <p class="intro">¿No sabes qué colores combinar? Rosina armó {len(PALETAS)} paletas para fechas especiales, bebés, amigurumis y proyectos de hogar. Mira cómo se verían en una manta de rayas, guarda la paleta como imagen o pídenos los hilos por WhatsApp con un solo toque.</p>
      <p class="no-imprimir" style="display:flex; gap:10px; flex-wrap:wrap; margin:18px 0 0;">
        <a class="boton-primario" href="#crea-tu-paleta">🎨 Arma tu propia paleta</a>
        <a class="boton-secundario" href="merceria.html#lanas-merceria">Ver lanas en la mercería</a>
      </p>
    </div>
    <div class="intro-paletas-ovillos" aria-hidden="true">{''.join(ovillo(h) for h in ['#E74E96', '#F28FC0', '#9EA2F9', '#93C7F9', '#FFD95A', '#B7C9A8', '#C8603F', '#FFF8F0'])}</div>
  </section>

  <div class="contenedor">
    <div class="chips-paletas no-imprimir" role="group" aria-label="Filtrar paletas"><button type="button" data-filtro="todos" aria-pressed="true">Todas</button>{chips}</div>
{chr(10).join(partes)}
  </div>

  <section class="seccion-suave no-imprimir" id="crea-tu-paleta">
    <div class="contenedor creador">
      <div>
        <h2>🎨 Arma tu paleta con Rosina</h2>
        <p style="color:var(--tinta-suave);">Elige un color y Rosina te propone 5 colores que combinan con él. Si quieres, toca cualquier ovillo para ajustarlo a tu gusto.</p>
        <p class="paso-creador">1. Elige tu color favorito</p>
        <div class="muestras-rapidas" id="muestras-rapidas">
          {''.join(f'<button type="button" style="background:{c}" data-color="{c}" aria-label="Usar el color {c}"></button>' for c in ['#E74E96', '#F28FC0', '#D72638', '#F29A38', '#FFD95A', '#8BC77A', '#2E7D52', '#2EC4B6', '#5DADE2', '#1B4F72', '#9EA2F9', '#7552B3', '#B98555', '#A3A2A8'])}
          <label class="color-libre" title="Otro color"><input type="color" id="color-base" value="#E74E96" aria-label="Elegir otro color"><span>+</span></label>
        </div>
        <p class="paso-creador">2. ¿Qué tipo de combinación quieres?</p>
        <div class="modos-creador" role="radiogroup" aria-label="Tipo de combinación">
          <label><input type="radio" name="modo" value="tonos" checked><span><strong>Tonos</strong><small>El mismo color, de claro a oscuro</small></span></label>
          <label><input type="radio" name="modo" value="vecinos"><span><strong>Colores vecinos</strong><small>Colores parecidos que armonizan</small></span></label>
          <label><input type="radio" name="modo" value="contraste"><span><strong>Contraste</strong><small>Tu color con su opuesto, para resaltar</small></span></label>
        </div>
        <div class="campo" style="max-width:340px; margin-top:14px;"><label for="nombre-paleta">Nombre de tu paleta</label><input type="text" id="nombre-paleta" value="Mi paleta" maxlength="40"></div>
      </div>
      <div>
        <div class="vista-creador" id="vista-creador" aria-live="polite"></div>
        <div class="acciones-paleta" style="margin-top:14px;"><a class="boton-primario" id="pedir-mia" href="https://wa.me/573205072801" target="_blank" rel="noopener">🛒 Pedir estos colores</a><button type="button" class="boton-secundario" id="guardar-mia">⬇ Guardar imagen</button><button type="button" class="boton-secundario" id="copiar-mia">📋 Copiar colores</button></div>
      </div>
    </div>
  </section>

  <section class="contenedor tips-color">
    <h2>Tips de Rosina para combinar colores</h2>
    <div class="grid-tips">
      <div><strong>60 · 30 · 10</strong><p>Usa un color principal en la mayor parte de tu tejido (60 %), un segundo color en un 30 % y deja el 10 % para un acento que resalte.</p></div>
      <div><strong>Contraste en los detalles</strong><p>En amigurumis, los ojos, la nariz y la boca se ven mejor en un color oscuro sobre un fondo claro, o al revés.</p></div>
      <div><strong>El truco de la foto en blanco y negro</strong><p>Toma una foto de tus ovillos juntos y ponla en blanco y negro: si todos se ven del mismo gris, les falta contraste.</p></div>
      <div><strong>Mira los colores con luz natural</strong><p>La luz de la tienda cambia los tonos. Si puedes, acerca los ovillos a una ventana antes de decidir.</p></div>
      <div><strong>Mismo lote de tinte</strong><p>Compra todo lo que necesites de cada color del mismo lote: dos lotes distintos pueden verse diferentes en la misma pieza.</p></div>
      <div><strong>Los colores en pantalla varían</strong><p>Los colores de esta página son una guía: cada pantalla y cada marca de hilo los muestra un poco distinto.</p></div>
    </div>
  </section>
</main>'''

css = '''
/* ===== Paletas de colores ===== */
.boton-primario, .boton-secundario { display: inline-block; padding: 12px 26px; border-radius: 999px; text-decoration: none; font-weight: 600; font-size: 0.95rem; font-family: var(--fuente-cuerpo); cursor: pointer; border: 2px solid var(--rosa-principal); }
.boton-primario { background: var(--rosa-principal); color: var(--blanco); }
.boton-primario:hover { background: #B83E78; border-color: #B83E78; }
.boton-secundario { background: var(--blanco); color: var(--rosa-principal); }
.boton-secundario:hover { background: var(--rosa-suave); }
.boton-chico { padding: 7px 14px; font-size: 0.83rem; }
section.intro-paletas { padding-top: 48px; padding-bottom: 24px; display: grid; grid-template-columns: 1.3fr 0.7fr; gap: 30px; align-items: center; }
@media (max-width: 800px) { section.intro-paletas { grid-template-columns: 1fr; padding-top: 28px; } }
.intro-paletas .eslogan { color: var(--rosa-principal); font-weight: 600; margin: 0 0 8px; }
.intro-paletas .intro { color: var(--tinta-suave); font-size: 1.06rem; max-width: 60ch; }
.intro-paletas-ovillos { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; max-width: 320px; justify-self: center; }
.intro-paletas-ovillos svg { width: 100%; height: auto; filter: drop-shadow(0 6px 10px rgba(58,42,46,0.15)); }
@media (max-width: 800px) { .intro-paletas-ovillos { grid-template-columns: repeat(8, 1fr); max-width: 100%; } }
.chips-paletas { display: flex; gap: 8px; flex-wrap: wrap; margin: 6px 0 26px; }
.chips-paletas button { background: var(--blanco); border: 1.5px solid var(--rosa-medio); color: var(--tinta); border-radius: 999px; padding: 7px 16px; font-family: var(--fuente-cuerpo); font-weight: 600; font-size: 0.88rem; cursor: pointer; }
.chips-paletas button[aria-pressed="true"] { background: var(--rosa-principal); border-color: var(--rosa-principal); color: var(--blanco); }
section.categoria-paletas { padding: 0 0 36px; }
.grid-paletas { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; }
@media (max-width: 980px) { .grid-paletas { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 620px) { .grid-paletas { grid-template-columns: 1fr; } }
.paleta { background: var(--blanco); border-radius: var(--radio-suave); box-shadow: var(--sombra-suave); padding: 20px; display: flex; flex-direction: column; gap: 12px; scroll-margin-top: 120px; }
.paleta h3 { margin: 0; font-size: 1.15rem; color: var(--tinta); }
.ovillos { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(62px, 1fr)); gap: 8px; }
.ovillos li { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 2px; }
.ovillos svg { width: 48px; height: 48px; }
.nombre-color { font-size: 0.74rem; font-weight: 600; line-height: 1.2; }
.ovillos code { font-size: 0.68rem; color: var(--tinta-suave); font-family: ui-monospace, monospace; }
.manta { display: flex; height: 44px; border-radius: 10px; overflow: hidden; border: 1.5px solid #E6E3E8; }
.manta span { flex: 1; }
.uso { margin: 0; font-size: 0.9rem; color: var(--tinta-suave); }
.tip-paleta { margin: 0; display: flex; gap: 8px; align-items: flex-start; background: var(--lila-suave); border-radius: 12px; padding: 8px 10px; font-size: 0.84rem; }
.tip-paleta img { width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0; }
.acciones-paleta { display: flex; gap: 8px; flex-wrap: wrap; margin-top: auto; }
.creador { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; align-items: center; }
@media (max-width: 800px) { .creador { grid-template-columns: 1fr; } }
.paso-creador { font-weight: 700; margin: 16px 0 8px; }
.muestras-rapidas { display: flex; flex-wrap: wrap; gap: 8px; }
.muestras-rapidas button, .color-libre { width: 38px; height: 38px; border-radius: 50%; border: 3px solid var(--blanco); box-shadow: 0 2px 6px rgba(0,0,0,0.15); cursor: pointer; padding: 0; }
.muestras-rapidas button[aria-pressed="true"] { outline: 3px solid var(--tinta); outline-offset: 1px; }
.color-libre { position: relative; display: flex; align-items: center; justify-content: center; background: conic-gradient(#E74E96, #FFD95A, #8BC77A, #5DADE2, #7552B3, #E74E96); color: #fff; font-weight: 800; font-size: 1.2rem; text-shadow: 0 1px 2px rgba(0,0,0,0.4); }
.color-libre input { position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%; }
.modos-creador { display: flex; flex-direction: column; gap: 8px; }
.modos-creador label { display: flex; gap: 10px; align-items: flex-start; background: var(--blanco); border: 2px solid transparent; border-radius: 14px; padding: 10px 14px; cursor: pointer; }
.modos-creador label:has(input:checked) { border-color: var(--rosa-principal); }
.modos-creador input { accent-color: var(--rosa-principal); margin-top: 4px; }
.modos-creador small { display: block; color: var(--tinta-suave); font-size: 0.82rem; }
.ovillos-editables li { position: relative; }
.ovillos-editables input[type="color"] { position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 48px; height: 48px; opacity: 0; cursor: pointer; }
.selector-color { display: flex; flex-direction: column; align-items: center; gap: 4px; font-size: 0.8rem; font-weight: 600; cursor: pointer; }
.selector-color input { width: 64px; height: 64px; border: 4px solid var(--blanco); border-radius: 50%; padding: 0; cursor: pointer; box-shadow: var(--sombra-suave); background: none; }
.selector-color input::-webkit-color-swatch-wrapper { padding: 0; }
.selector-color input::-webkit-color-swatch { border: none; border-radius: 50%; }
.selector-color input::-moz-color-swatch { border: none; border-radius: 50%; }
.campo { display: flex; flex-direction: column; gap: 4px; }
.campo label { font-weight: 600; font-size: 0.9rem; }
.campo input { font-family: var(--fuente-cuerpo); font-size: 1rem; padding: 10px 14px; border-radius: 12px; border: 1.5px solid rgba(69,69,74,0.18); background: var(--blanco); color: var(--tinta); }
.vista-creador .paleta { box-shadow: var(--sombra-suave); }
.vista-creador .manta { height: 90px; }
.tips-color { padding-top: 48px; }
.grid-tips { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
@media (max-width: 860px) { .grid-tips { grid-template-columns: 1fr; } }
.grid-tips div { background: var(--blanco); border-radius: var(--radio-suave); padding: 18px; box-shadow: var(--sombra-suave); }
.grid-tips strong { font-family: var(--fuente-titulo); font-weight: 600; color: var(--rosa-principal); }
.grid-tips p { margin: 6px 0 0; font-size: 0.92rem; color: var(--tinta-suave); }
.aviso-copiado { position: fixed; left: 50%; bottom: 90px; transform: translateX(-50%); background: var(--tinta); color: var(--blanco); padding: 10px 18px; border-radius: 999px; font-size: 0.9rem; z-index: 2000; opacity: 0; transition: opacity 0.2s; pointer-events: none; }
.aviso-copiado.visible { opacity: 1; }
@media print {
  .encabezado, .nav-movil-panel, .pie-rico, .whatsapp-flotante, .boton-subir, .overlay-carrito, .panel-carrito, .no-imprimir { display: none !important; }
  .paleta { box-shadow: none; border: 1px solid #ddd; break-inside: avoid; }
  .manta span, .ovillos svg { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
'''

js = '''<div class="aviso-copiado" id="aviso-copiado" role="status"></div>
<script>
(function() {
  var aviso = document.getElementById('aviso-copiado');
  function avisar(t) { aviso.textContent = t; aviso.classList.add('visible'); setTimeout(function() { aviso.classList.remove('visible'); }, 1800); }
  function texto(p) { return p.nombre + ':\\n' + p.colores.map(function(c) { return '• ' + c[0] + ' ' + c[1]; }).join('\\n') + '\\n— Paletas de Rosina · lanarosacrochet.com'; }
  function copiar(p) {
    var t = texto(p);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(t).then(function() { avisar('¡Colores copiados! 🐑'); }, function() { window.prompt('Copia los colores:', t); });
    } else { window.prompt('Copia los colores:', t); }
  }
  function claro(h) { var r = parseInt(h.substr(1, 2), 16), g = parseInt(h.substr(3, 2), 16), b = parseInt(h.substr(5, 2), 16); return (0.299 * r + 0.587 * g + 0.114 * b) > 200; }
  function dibujar(p) {
    var n0 = p.colores.length, filas0 = Math.ceil(n0 / (n0 <= 4 ? n0 : 3));
    var W = 1080, H = Math.max(1080, 380 + filas0 * 300 - 40 + 170 + 48 + 150), c = document.createElement('canvas'); c.width = W; c.height = H;
    var x = c.getContext('2d');
    x.fillStyle = '#FAFAF7'; x.fillRect(0, 0, W, H);
    x.fillStyle = '#FBE4EF'; x.beginPath(); x.arc(W - 90, 90, 220, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#E74E96'; x.textAlign = 'center';
    x.font = '600 34px "Hanken Grotesk", sans-serif'; x.fillText('PALETA DE ROSINA', W / 2, 130);
    x.fillStyle = '#45454A'; x.font = '600 76px DynaPuff, sans-serif'; x.fillText(p.nombre, W / 2, 225, W - 120);
    var n = p.colores.length, cols = n <= 4 ? n : 3, filas = Math.ceil(n / cols), r = n <= 4 ? 95 : 80;
    var paso = (W - 120) / cols;
    p.colores.forEach(function(col, i) {
      var cx = 60 + paso * (i % cols) + paso / 2, cy = 380 + Math.floor(i / cols) * 300;
      x.fillStyle = col[1]; x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill();
      if (claro(col[1])) { x.strokeStyle = '#D9D9DE'; x.lineWidth = 4; x.stroke(); }
      x.strokeStyle = 'rgba(0,0,0,0.16)'; x.lineWidth = 7; x.lineCap = 'round';
      [[-0.65, -0.3, 0.65, -0.35], [-0.8, 0.12, 0.8, 0.05], [-0.5, 0.55, 0.55, 0.45]].forEach(function(l) {
        x.beginPath(); x.moveTo(cx + l[0] * r, cy + l[1] * r); x.quadraticCurveTo(cx, cy + (l[1] + 0.22) * r, cx + l[2] * r, cy + l[3] * r); x.stroke();
      });
      x.fillStyle = '#45454A'; x.font = '700 32px "Hanken Grotesk", sans-serif'; x.fillText(col[0], cx, cy + r + 50, paso - 20);
      x.fillStyle = '#6E6E73'; x.font = '500 28px monospace'; x.fillText(col[1], cx, cy + r + 88);
    });
    var y0 = 380 + filas * 300 - 40, alto = 170, seq = [];
    if (n <= 4) { seq = [0, 1, 0, 2, 0, 1, 0, n > 3 ? 3 : 2, 0, 1].map(function(i) { return p.colores[Math.min(i, n - 1)][1]; }); }
    else { var cs = p.colores.map(function(c) { return c[1]; }); seq = cs.concat(cs.slice().reverse()); }
    var w = (W - 120) / seq.length;
    x.save(); x.beginPath(); if (x.roundRect) x.roundRect(60, y0, W - 120, alto, 24); else x.rect(60, y0, W - 120, alto); x.clip();
    seq.forEach(function(col, i) { x.fillStyle = col; x.fillRect(60 + i * w, y0, w + 1, alto); }); x.restore();
    x.fillStyle = '#6E6E73'; x.font = '500 28px "Hanken Grotesk", sans-serif'; x.fillText('Así se vería en una manta de rayas', W / 2, y0 + alto + 48);
    x.fillStyle = '#E74E96'; x.font = '600 36px DynaPuff, sans-serif'; x.fillText('♡ lanarosacrochet.com', W / 2, H - 60);
    return c;
  }
  function guardar(p) {
    var f = document.fonts && document.fonts.load ? Promise.all([document.fonts.load('600 76px DynaPuff'), document.fonts.load('700 32px "Hanken Grotesk"')]) : Promise.resolve();
    f.catch(function() {}).then(function() {
      dibujar(p).toBlob(function(blob) {
        var url = URL.createObjectURL(blob), a = document.createElement('a');
        a.href = url; a.download = 'paleta-rosina-' + p.nombre.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.png';
        document.body.appendChild(a); a.click(); a.remove(); setTimeout(function() { URL.revokeObjectURL(url); }, 2000);
        avisar('¡Paleta guardada! 🎨');
      }, 'image/png');
    });
  }
  function pedido(p) {
    return 'https://wa.me/573205072801?text=' + encodeURIComponent('Hola! Vengo del Rincón de Rosina 🐑 Me gustó la paleta «' + p.nombre + '» y quiero hilos en estos colores:\\n' + p.colores.map(function(c) { return '• ' + c[0] + ' (' + c[1] + ')'; }).join('\\n') + '\\n¿Cuáles tienen disponibles o cuáles se parecen?');
  }
  document.querySelectorAll('.paleta[data-paleta]').forEach(function(el) {
    var p = JSON.parse(el.dataset.paleta);
    el.querySelector('[data-pedir]').href = pedido(p);
    el.querySelector('[data-copiar]').addEventListener('click', function() { copiar(p); });
    el.querySelector('[data-guardar]').addEventListener('click', function() { guardar(p); });
  });
  /* Filtros */
  var chips = document.querySelectorAll('.chips-paletas button');
  chips.forEach(function(ch) {
    ch.addEventListener('click', function() {
      chips.forEach(function(c) { c.setAttribute('aria-pressed', c === ch); });
      document.querySelectorAll('.categoria-paletas').forEach(function(s) { s.hidden = !(ch.dataset.filtro === 'todos' || s.dataset.categoria === ch.dataset.filtro); });
    });
  });
  /* Creador: genera 5 colores a partir de uno */
  function hexAHsl(h) {
    var r = parseInt(h.substr(1, 2), 16) / 255, gg = parseInt(h.substr(3, 2), 16) / 255, b = parseInt(h.substr(5, 2), 16) / 255;
    var max = Math.max(r, gg, b), min = Math.min(r, gg, b), l = (max + min) / 2, s = 0, hh = 0, d = max - min;
    if (d) { s = l > 0.5 ? d / (2 - max - min) : d / (max + min); hh = max === r ? (gg - b) / d + (gg < b ? 6 : 0) : max === gg ? (b - r) / d + 2 : (r - gg) / d + 4; hh *= 60; }
    return [hh, s * 100, l * 100];
  }
  function hslAHex(h, s, l) {
    h = ((h % 360) + 360) % 360; s = Math.max(0, Math.min(100, s)) / 100; l = Math.max(0, Math.min(100, l)) / 100;
    var k = function(n) { return (n + h / 30) % 12; }, a = s * Math.min(l, 1 - l);
    var f = function(n) { return Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))))).toString(16).padStart(2, '0'); };
    return ('#' + f(0) + f(8) + f(4)).toUpperCase();
  }
  function generar(base, modo) {
    var c = hexAHsl(base), h = c[0], s = c[1], l = c[2];
    if (modo === 'tonos') {
      return [[h, Math.min(s, 70), l + (96 - l) * 0.8], [h, s, l + (96 - l) * 0.45], [h, s, l], [h, s, l * 0.72], [h, s, l * 0.45]].map(function(x, i) { return i === 2 ? base.toUpperCase() : hslAHex(x[0], x[1], x[2]); });
    }
    var lm = Math.max(38, Math.min(75, l));
    if (modo === 'vecinos') {
      return [[h - 40, s, lm + 8], [h - 20, s, lm], [h, s, l], [h + 20, s, lm], [h + 40, s, lm + 8]].map(function(x, i) { return i === 2 ? base.toUpperCase() : hslAHex(x[0], x[1], x[2]); });
    }
    return [base.toUpperCase(), hslAHex(h, s, l + (96 - l) * 0.6), hslAHex(h + 180, s, lm), hslAHex(h + 180, s * 0.8, lm + (96 - lm) * 0.55), '#FFF8F0'];
  }
  var nombre = document.getElementById('nombre-paleta'), vista = document.getElementById('vista-creador'), colorBase = document.getElementById('color-base');
  var CLAVE = 'rosinaMiPaleta2', estado = { base: '#E74E96', modo: 'tonos', colores: [] };
  try { var g0 = JSON.parse(localStorage.getItem(CLAVE)); if (g0 && g0.colores && g0.colores.length === 5) { estado = g0; nombre.value = g0.nombre || nombre.value; } } catch (e) {}
  if (!estado.colores.length) estado.colores = generar(estado.base, estado.modo);
  var radio = document.querySelector('input[name="modo"][value="' + estado.modo + '"]'); if (radio) radio.checked = true;
  colorBase.value = estado.base;
  function mia() { return { nombre: nombre.value.trim() || 'Mi paleta', colores: estado.colores.map(function(c, k) { return ['Color ' + (k + 1), c]; }) }; }
  function marcarMuestra() { document.querySelectorAll('#muestras-rapidas button').forEach(function(b) { b.setAttribute('aria-pressed', b.dataset.color.toUpperCase() === estado.base.toUpperCase()); }); }
  function pintar() {
    var p = mia(), cs = estado.colores, seq = cs.concat(cs.slice().reverse());
    vista.innerHTML = '<div class="paleta"><h3></h3><ul class="ovillos ovillos-editables">' + cs.map(function(c, k) {
      return '<li><svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="21" fill="' + c + '" stroke="#D9D9DE" stroke-width="1"/><g fill="none" stroke="rgba(0,0,0,.16)" stroke-width="2" stroke-linecap="round"><path d="M8,17 C18,22 30,22 40,15"/><path d="M5,27 C17,33 31,33 43,25"/><path d="M11,38 C20,41 30,41 38,35"/><path d="M17,5 C12,18 13,32 20,44"/></g></svg><input type="color" value="' + c + '" data-k="' + k + '" aria-label="Ajustar color ' + (k + 1) + '"><code>' + c + '</code></li>';
    }).join('') + '</ul><div class="manta">' + seq.map(function(c) { return '<span style="background:' + c + '"></span>'; }).join('') + '</div><p class="uso">Toca un ovillo para ajustar su color. Así se vería tu manta de rayas.</p></div>';
    vista.querySelector('h3').textContent = p.nombre;
    vista.querySelectorAll('input[type="color"]').forEach(function(inp) {
      inp.addEventListener('change', function() { estado.colores[+inp.dataset.k] = inp.value.toUpperCase(); pintar(); });
    });
    document.getElementById('pedir-mia').href = pedido(p);
    marcarMuestra();
    try { estado.nombre = nombre.value; localStorage.setItem(CLAVE, JSON.stringify(estado)); } catch (e) {}
  }
  function regenerar() { estado.colores = generar(estado.base, estado.modo); pintar(); }
  document.querySelectorAll('#muestras-rapidas button').forEach(function(b) { b.addEventListener('click', function() { estado.base = b.dataset.color; colorBase.value = b.dataset.color; regenerar(); }); });
  colorBase.addEventListener('input', function() { estado.base = colorBase.value; regenerar(); });
  document.querySelectorAll('input[name="modo"]').forEach(function(r) { r.addEventListener('change', function() { estado.modo = r.value; regenerar(); }); });
  nombre.addEventListener('input', pintar);
  document.getElementById('guardar-mia').addEventListener('click', function() { guardar(mia()); });
  document.getElementById('copiar-mia').addEventListener('click', function() { copiar(mia()); });
  pintar();
})();
</script>
'''

def rep(s, a, b):
    assert s.count(a) == 1, a
    return s.replace(a, b)

desc = f'{len(PALETAS)} paletas de colores de hilo para tejer: fechas especiales, bebés, amigurumis y mantas. Crea tu propia paleta y guárdala como imagen. Gratis.'
src = rep(src, '<title>Conoce a Rosina — Lana Rosa Crochet</title>', '<title>Paletas de colores para tejer — Rosina · Lana Rosa Crochet</title>')
src = rep(src, '<meta name="description" content="Rosina es la ovejita de lana esponjosa, embajadora de calidad y asistente de enseñanza de Lana Rosa Crochet. Conoce su historia y sus tips.">', f'<meta name="description" content="{e(desc)}">')
src = src.replace('https://lanarosacrochet.com/rosina.html', 'https://lanarosacrochet.com/paletas-rosina.html')
src = rep(src, '<meta property="og:title" content="Conoce a Rosina — Lana Rosa Crochet">', '<meta property="og:title" content="Paletas de colores para tejer — Rosina">')
src = rep(src, '<meta property="og:description" content="La ovejita embajadora de Lana Rosa Crochet: curiosa, detallista y muy amable.">', f'<meta property="og:description" content="{e(desc)}">')
src = rep(src, '<meta property="og:image" content="https://lanarosacrochet.com/img/rosina.jpg">', '<meta property="og:image" content="https://lanarosacrochet.com/img/rincon-de-rosina-og.jpg?v=2">')
i = src.index('</style>'); src = src[:i] + css + src[i:]
a = src.index('<main>'); b = src.index('</main>') + len('</main>')
src = src[:a] + main + src[b:]
i = src.rindex('</body>'); src = src[:i] + js + src[i:]
open(WEB + 'paletas-rosina.html', 'w', encoding='utf-8').write(src)
print('ok', len(PALETAS), 'paletas')
