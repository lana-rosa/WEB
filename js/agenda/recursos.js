/* Agenda para tejedoras: hoja «Recursos de Rosina» (1-nov-2026, pedido de Jennifer: tener los recursos gratis dentro de la agenda, sin salir).
   Etapa 1: Glosario ilustrado (buscador, categorías, cada término se despliega) y Abreviaturas de crochet en 9 idiomas (filtro de idiomas).
   Etapa 2 (2-nov-2026): pestaña «Paletas» (tocar un color copia su código).
   Los datos salen de js/agenda/recursos-datos.js, que genera herramientas/generar_recursos_agenda.py a partir del glosario y la tabla de abreviaturas
   del Rincón de Rosina (si cambian allá, volver a correr el generador). No guarda nada: es solo para consultar. */
(function () {
  'use strict';
  var hoja = document.getElementById('recursos-rosina'), D = window.lrRecursosDatos;
  if (!hoja || !D) return;
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function sin(t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

  /* ---------- pestañas ---------- */
  var pestanas = hoja.querySelectorAll('.rr-pestanas [data-rr]');
  function mostrar(cual, ancla) {
    if (cual === 'calculadoras' && typeof cargarCalculadoras === 'function') cargarCalculadoras(ancla || anclaActual);
    pestanas.forEach(function (b) { var on = b.dataset.rr === cual; b.setAttribute('aria-selected', String(on)); });
    hoja.querySelectorAll('.rr-panel').forEach(function (p) { p.hidden = p.id !== 'rr-' + cual; });
  }
  pestanas.forEach(function (b) {   /* cada pestaña lleva su dibujo (3-nov-2026, íconos de Jennifer) */
    if (!b.querySelector('.rr-ic')) b.insertAdjacentHTML('afterbegin', '<img class="rr-ic" src="/img/agenda/recursos/rr-' + b.dataset.rr + '.webp?v=1" alt="" width="28" height="28" aria-hidden="true" decoding="async">');
    b.addEventListener('click', function () { mostrar(b.dataset.rr); });
  });

  /* ---------- glosario ---------- */
  var gl = document.getElementById('rr-glosario'), cat = 'todas', texto = '';
  var barra = el('div', 'rr-barra no-imprimir');
  barra.innerHTML = '<label class="rr-buscar"><span class="rr-etq">Buscar un término</span><input type="search" id="rr-buscar" placeholder="Ej.: anillo mágico, pb, aguja…" autocomplete="off"></label>';
  var chips = el('div', 'rr-chips no-imprimir'); chips.setAttribute('role', 'group'); chips.setAttribute('aria-label', 'Categorías del glosario');
  [{ id: 'todas', n: 'Todos' }].concat(D.categorias).forEach(function (c) {
    var b = el('button', 'rr-chip'); b.type = 'button'; b.dataset.cat = c.id; b.textContent = c.n; b.setAttribute('aria-pressed', String(c.id === 'todas'));
    b.addEventListener('click', function () { cat = c.id; chips.querySelectorAll('.rr-chip').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); pintar(); });
    chips.appendChild(b);
  });
  var cuenta = el('p', 'rr-cuenta no-imprimir'); cuenta.setAttribute('role', 'status'); cuenta.setAttribute('aria-live', 'polite');
  var lista = el('div', 'rr-lista'); lista.setAttribute('data-no-traducir', '');
  gl.appendChild(barra); gl.appendChild(chips); gl.appendChild(cuenta); gl.appendChild(lista);
  barra.querySelector('input').addEventListener('input', function (e) { texto = sin(e.target.value.trim()); pintar(); });

  function termino(t) {
    var d = el('details', 'rr-termino'); d.dataset.cat = t.cat;
    var sim = t.simbolo ? '<svg viewBox="0 0 60 60" width="46" height="46" aria-hidden="true" focusable="false">' + t.simbolo + '</svg>' : (t.icono ? '<span class="rr-emoji" aria-hidden="true">' + esc(t.icono) + '</span>' : '');
    var h = '<summary><span class="rr-sim">' + sim + '</span><span class="rr-nom"><b>' + esc(t.nombre) + '</b>' + (t.en ? '<small>' + esc(t.en) + '</small>' : '') + '</span>' + (t.abrev ? '<span class="rr-abrev">' + esc(t.abrev) + '</span>' : '') + '</summary><div class="rr-cuerpo">';
    if (t.otros) h += '<p class="rr-otros">' + esc(t.otros) + '</p>';
    h += '<p>' + esc(t.definicion) + '</p>';
    if (t.pasos && t.pasos.length) h += '<ol class="rr-pasos">' + t.pasos.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ol>';
    if (t.tip) h += '<p class="rr-tip"><b>Tip de Rosina:</b> ' + esc(t.tip) + '</p>';
    if (t.enlace) h += '<p class="rr-enlace no-imprimir"><a href="/' + esc(t.enlace[0]).replace(/^\//, '') + '" target="_blank" rel="noopener">' + esc(t.enlace[1]) + ' →</a></p>';
    d.innerHTML = h + '</div>'; d._busca = sin([t.nombre, t.abrev, t.en, t.otros, t.definicion].join(' ')); return d;
  }
  var nodos = D.glosario.map(termino);
  function pintar() {
    lista.textContent = ''; var n = 0;
    D.categorias.forEach(function (c) {
      if (cat !== 'todas' && cat !== c.id) return;
      var delGrupo = nodos.filter(function (d) { return d.dataset.cat === c.id && (!texto || d._busca.indexOf(texto) >= 0); });
      if (!delGrupo.length) return;
      var g = el('section', 'rr-grupo'); g.appendChild(el('h4', 'sub-hoja', esc(c.n)));
      delGrupo.forEach(function (d) { g.appendChild(d); n++; if (texto) d.open = true; }); lista.appendChild(g);
    });
    if (!n) lista.appendChild(el('p', 'rr-vacio', 'No encontré ese término. Prueba con otra palabra o con la abreviatura (por ejemplo «pb»).'));
    cuenta.textContent = n + (n === 1 ? ' término' : ' términos');
  }
  pintar();

  /* ---------- abreviaturas ---------- */
  var ab = document.getElementById('rr-abreviaturas');
  var filtro = el('div', 'rr-idiomas no-imprimir'); filtro.setAttribute('role', 'group'); filtro.setAttribute('aria-label', 'Idiomas de la tabla');
  var activos = { 'en-us': true, 'en-uk': true, pt: true, fr: false, it: false, zh: false, ru: false, tr: false };
  D.abrev.idiomas.filter(function (i) { return i.id !== 'es'; }).forEach(function (i) {
    var l = el('label', 'rr-idioma'); l.innerHTML = '<input type="checkbox" value="' + i.id + '"' + (activos[i.id] ? ' checked' : '') + '> <span>' + esc(i.n) + '</span>';
    l.querySelector('input').addEventListener('change', function (e) { activos[i.id] = e.target.checked; aplicar(); });
    filtro.appendChild(l);
  });
  var intro = el('p', 'rr-intro', '¿Encontraste un patrón en inglés, portugués u otro idioma? Elige los idiomas que quieres ver y busca cada punto.');
  var envol = el('div', 'tabla-scroll rr-tabla'); envol.setAttribute('data-no-traducir', '');
  var tb = el('table', 'tabla-abrev rr-tab'), cab = '<thead><tr>' + D.abrev.idiomas.map(function (i) { return '<th data-idioma="' + i.id + '">' + esc(i.n) + '</th>'; }).join('') + '</tr></thead>';
  tb.innerHTML = cab + '<tbody>' + D.abrev.filas.map(function (f) { return '<tr>' + f.map(function (c, k) { return '<td data-idioma="' + D.abrev.idiomas[k].id + '"><b>' + esc(c[0]) + '</b><small>' + esc(c[1]) + '</small></td>'; }).join('') + '</tr>'; }).join('') + '</tbody>';
  envol.appendChild(tb);
  var ojo = el('p', 'rr-ojo', '<b>¡Ojo con el inglés!</b> Los patrones de EE. UU. y del Reino Unido usan los mismos nombres para puntos distintos: el <em>double crochet</em> americano es nuestro punto alto, y el británico es nuestro punto bajo. Mira siempre de qué país es el patrón.');
  ojo.setAttribute('data-no-traducir', ''); ab.appendChild(intro); ab.appendChild(filtro); ab.appendChild(envol); ab.appendChild(ojo);
  function aplicar() { tb.querySelectorAll('[data-idioma]').forEach(function (c) { var id = c.dataset.idioma; c.hidden = id !== 'es' && !activos[id]; }); }
  aplicar();



  /* ---------- checklist (2-nov-2026): «Tu primer amigurumi»; el avance se guarda en el mismo lugar que en el Rincón de Rosina ---------- */
  var ck = document.getElementById('rr-checklist');
  if (ck && D.checklist) {
    var CLAVE_CK = 'rosinaChecklist', marcadas = {};
    try { marcadas = JSON.parse(localStorage.getItem(CLAVE_CK)) || {}; } catch (e) { marcadas = {}; }
    var guardarCk = function () { try { localStorage.setItem(CLAVE_CK, JSON.stringify(marcadas)); } catch (e) { /* sin almacenamiento */ } };
    ck.appendChild(el('p', 'rr-intro', 'Todo lo que necesitas antes de empezar, revisado por Rosina. Ve marcando lo que ya tienes (se guarda en tu dispositivo).'));
    var prog = el('p', 'rr-ck-prog'); prog.setAttribute('role', 'status'); prog.setAttribute('aria-live', 'polite'); ck.appendChild(prog);
    var cuerpo = el('div', 'rr-ck-grid'); cuerpo.setAttribute('data-no-traducir', '');
    D.checklist.grupos.forEach(function (g) {
      var caja = el('div', 'rr-ck-grupo'); caja.appendChild(el('h4', 'sub-hoja', esc(g.titulo))); var ul = el('ul', 'rr-ck-lista');
      g.items.forEach(function (it) {
        var li = el('li'); li.innerHTML = '<label><input type="checkbox" data-ck="' + esc(it.id) + '"><span>' + it.html + '</span></label>';
        var c = li.querySelector('input'); c.checked = !!marcadas[it.id];
        c.addEventListener('change', function () { marcadas[it.id] = c.checked; guardarCk(); pintarCk(); });
        li.querySelectorAll('a').forEach(function (a) { a.setAttribute('target', '_blank'); a.setAttribute('rel', 'noopener'); });
        ul.appendChild(li);
      }); caja.appendChild(ul); cuerpo.appendChild(caja);
    });
    ck.appendChild(cuerpo);
    if (D.checklist.tip) { var tp = el('p', 'rr-tip'); tp.appendChild(el('b', '', 'Tip de Rosina:')); tp.appendChild(document.createTextNode(' ' + D.checklist.tip.replace(/^Tip de Rosina:\s*/, ''))); tp.setAttribute('data-no-traducir', ''); ck.appendChild(tp); }
    var acc = el('div', 'rr-ck-acc no-imprimir');
    var faltan = el('a', 'boton-primario'); faltan.target = '_blank'; faltan.rel = 'noopener'; faltan.hidden = true;
    var kit = el('a', 'boton-secundario', 'Quiero el kit completo de principiante'); kit.target = '_blank'; kit.rel = 'noopener';
    kit.href = 'https://wa.me/573205072801?text=' + encodeURIComponent('Hola! Vengo de mi Agenda para tejedoras 🐑 Quiero el kit completo de principiante para tejer mi primer amigurumi (hilo, aguja, relleno, ojos de seguridad, aguja lanera y marcador). ¿Qué precio tiene?');
    var borrarCk = el('button', 'boton-secundario', 'Desmarcar todo'); borrarCk.type = 'button';
    borrarCk.addEventListener('click', function () { ck.querySelectorAll('input[data-ck]').forEach(function (c) { c.checked = false; }); marcadas = {}; guardarCk(); pintarCk(); });
    acc.appendChild(faltan); acc.appendChild(kit); acc.appendChild(borrarCk); ck.appendChild(acc);
    function pintarCk() {
      var todas = ck.querySelectorAll('input[data-ck]'), listas = 0, falta = [];
      todas.forEach(function (c) { if (c.checked) listas++; });
      prog.textContent = listas === todas.length ? '¡Tienes todo! Ya puedes empezar tu primer amigurumi 🎉' : 'Llevas ' + listas + ' de ' + todas.length + ' listos';
      ck.querySelectorAll('.rr-ck-grupo').forEach(function (g, k) { if (k > 1) return; g.querySelectorAll('input[data-ck]').forEach(function (c) { if (!c.checked) falta.push(c.closest('label').querySelector('strong').textContent.replace(/[.:]$/, '')); }); });
      faltan.hidden = !falta.length;
      if (falta.length) { faltan.textContent = 'Pedir lo que me falta (' + falta.length + ')'; faltan.href = 'https://wa.me/573205072801?text=' + encodeURIComponent('Hola! Vengo de mi Agenda para tejedoras 🐑 Estoy preparando mi primer amigurumi y me falta:\n' + falta.map(function (n) { return '• ' + n; }).join('\n') + '\n¿Me ayudan con esto?'); }
    }
    pintarCk();
  }

  /* ---------- descargables (2-nov-2026): stickers y fondos con íconos para el celular ---------- */
  var ds = document.getElementById('rr-descargables');
  if (ds && D.stickers && D.temas) {
    ds.appendChild(el('p', 'rr-intro', 'Stickers, fondos de pantalla e íconos de Rosina para tu celular. Toca uno para descargarlo.'));
    var sti = el('section', 'rr-grupo'); sti.appendChild(el('h4', 'sub-hoja', 'Stickers de Rosina'));
    sti.appendChild(el('p', 'rr-intro', '36 stickers con fondo transparente (512 × 512 px, como los de WhatsApp). Toca uno o baja el paquete completo.'));
    var zips = el('div', 'rr-ck-acc no-imprimir'); zips.innerHTML = '<a class="boton-primario" href="/img/stickers/stickers-rosina-webp.zip" download>⬇ Paquete para WhatsApp (1,1 MB)</a><a class="boton-secundario" href="/img/stickers/stickers-rosina-png.zip" download>⬇ Paquete PNG (7 MB)</a>';
    sti.appendChild(zips);
    var gst = el('div', 'rr-stickers'); gst.setAttribute('data-no-traducir', '');
    D.stickers.forEach(function (g) {
      gst.appendChild(el('h5', 'rr-st-t', esc(g.titulo)));
      var fila = el('div', 'rr-st-fila');
      g.items.forEach(function (s) { fila.innerHTML += '<a class="rr-st" href="' + esc(s.href) + '" download="' + esc(s.archivo) + '"><img src="' + esc(s.img) + '" alt="' + esc(s.alt) + '" loading="lazy" width="96" height="96"></a>'; });
      gst.appendChild(fila);
    });
    sti.appendChild(gst); ds.appendChild(sti);
    var fon = el('section', 'rr-grupo'); fon.appendChild(el('h4', 'sub-hoja', 'Tu celular con Rosina: fondo e íconos'));
    fon.appendChild(el('p', 'rr-intro', 'Elige el tamaño de tu celular y el tema que más te guste. Cada uno trae el fondo de pantalla y los íconos de las apps con sus mismos colores.'));
    var TAM = [['samsung', 'Samsung Galaxy S'], ['android', 'Otro Android'], ['iphone', 'iPhone'], ['iphone-max', 'iPhone Pro Max / Plus']];
    var tam = 'samsung', est = 'todas';
    var selT = el('label', 'rr-buscar no-imprimir'); selT.innerHTML = '<span class="rr-etq">Mi celular es</span><select id="rr-tamano"></select>';
    var sTam = selT.querySelector('select'); TAM.forEach(function (t) { var o = el('option', '', t[1]); o.value = t[0]; sTam.appendChild(o); });
    sTam.addEventListener('change', function () { tam = sTam.value; pintarTemas(); });
    var chEst = el('div', 'rr-chips no-imprimir'); chEst.setAttribute('role', 'group'); chEst.setAttribute('aria-label', 'Elegir estación');
    [['todas', 'Todas'], ['primavera', 'Primavera'], ['verano', 'Verano'], ['otono', 'Otoño'], ['invierno', 'Invierno'], ['todo', 'Todo el año']].forEach(function (e) {
      var b = el('button', 'rr-chip', e[1]); b.type = 'button'; b.setAttribute('aria-pressed', String(e[0] === 'todas'));
      b.addEventListener('click', function () { est = e[0]; chEst.querySelectorAll('.rr-chip').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); pintarTemas(); });
      chEst.appendChild(b);
    });
    var gt = el('div', 'rr-temas'); gt.setAttribute('data-no-traducir', '');
    fon.appendChild(selT); fon.appendChild(chEst); fon.appendChild(gt); ds.appendChild(fon);
    function pintarTemas() {
      gt.textContent = '';
      D.temas.filter(function (t) { return est === 'todas' || t.estacion === est; }).forEach(function (t) {
        var d = el('article', 'rr-tema'), url = '/img/fondos/fondo-rosina-' + t.id + '-' + tam + '.jpg';
        d.innerHTML = '<div class="rr-tema-prev"><img src="' + esc(t.fondo) + '" alt="Fondo de pantalla: ' + esc(t.nombre) + '" loading="lazy" width="90" height="195"><img src="' + esc(t.inicio) + '" alt="Pantalla de inicio con los íconos del tema ' + esc(t.nombre) + '" loading="lazy" width="90" height="195"></div><h5>' + esc(t.nombre) + '</h5>' +
          '<div class="rr-tema-bot no-imprimir"><a class="boton-primario boton-chico" href="' + esc(url) + '" download="fondo-rosina-' + esc(t.id) + '-' + tam + '.jpg">⬇ Fondo</a>' + (t.zip ? '<a class="boton-secundario boton-chico" href="' + esc(t.zip) + '" download>⬇ Íconos (ZIP)</a>' : '') + '</div>';
        gt.appendChild(d);
      });
    }
    pintarTemas();
  }
  /* ---------- calculadoras (2-nov-2026): la página de calculadoras del Rincón, incrustada sin encabezado ni pie ---------- */
  var cp = document.getElementById('rr-calculadoras'), marco = null, anclaActual = '';
  function cargarCalculadoras(ancla) {
    if (!cp) return;
    if (!marco) {
      cp.appendChild(el('p', 'rr-intro', 'Rosina hace las cuentas por ti: elige una herramienta y todo se calcula al instante. Lo que escribes se guarda en tu dispositivo.'));
      marco = el('iframe', 'rr-marco no-imprimir'); marco.title = 'Calculadoras de Rosina'; marco.setAttribute('loading', 'lazy'); marco.setAttribute('data-no-traducir', ''); cp.appendChild(marco);
      var ajustar = function () { try { var d = marco.contentDocument; if (d && d.body) marco.style.height = Math.max(420, d.documentElement.scrollHeight + 4) + 'px'; } catch (e) { /* mismo sitio: no debería fallar */ } };
      marco.addEventListener('load', function () { ajustar(); try { var d = marco.contentDocument; if (window.ResizeObserver && d.body) new ResizeObserver(ajustar).observe(d.body); } catch (e) {} setInterval(ajustar, 1500); });
    }
    if (ancla !== anclaActual || !marco.getAttribute('src')) { anclaActual = ancla || ''; marco.src = '/calculadoras-rosina.html?incrustada=1' + (anclaActual ? '#' + anclaActual : ''); }
  }
  /* ---------- paletas de colores (2-nov-2026) ---------- */
  var pl = document.getElementById('rr-paletas');
  if (pl && D.paletas) {
    var pcat = 'todas';
    pl.appendChild(el('p', 'rr-intro', 'Combinaciones de colores listas para tu próximo proyecto. Toca un color para copiar su código.'));
    var pchips = el('div', 'rr-chips no-imprimir'); pchips.setAttribute('role', 'group'); pchips.setAttribute('aria-label', 'Categorías de paletas');
    [{ id: 'todas', n: 'Todos' }].concat(D.paletas.categorias).forEach(function (c) {
      var b = el('button', 'rr-chip'); b.type = 'button'; b.textContent = c.n; b.setAttribute('aria-pressed', String(c.id === 'todas'));
      b.addEventListener('click', function () { pcat = c.id; pchips.querySelectorAll('.rr-chip').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); pintarPaletas(); });
      pchips.appendChild(b);
    });
    var pcopiado = el('p', 'rr-cuenta no-imprimir'); pcopiado.setAttribute('role', 'status'); pcopiado.setAttribute('aria-live', 'polite');
    var plista = el('div', 'rr-paletas-lista'); plista.setAttribute('data-no-traducir', '');
    pl.appendChild(pchips); pl.appendChild(pcopiado); pl.appendChild(plista);
    plista.addEventListener('click', function (e) {
      var b = e.target.closest('.rr-color'); if (!b) return; var hex = b.dataset.hex;
      var fin = function (ok) { pcopiado.textContent = ok ? 'Copiado: ' + hex : 'Código: ' + hex; };
      try { navigator.clipboard.writeText(hex).then(function () { fin(true); }, function () { fin(false); }); } catch (x) { fin(false); }
    });
    function pintarPaletas() {
      plista.textContent = '';
      D.paletas.categorias.forEach(function (c) {
        if (pcat !== 'todas' && pcat !== c.id) return;
        var delas = D.paletas.lista.filter(function (p) { return p.cat === c.id; }); if (!delas.length) return;
        var g = el('section', 'rr-grupo'); g.appendChild(el('h4', 'sub-hoja', esc(c.n)));
        delas.forEach(function (p) {
          var t = el('div', 'rr-paleta');
          t.innerHTML = '<h5>' + esc(p.nombre) + '</h5><div class="rr-colores">' + p.colores.map(function (k) { return '<button type="button" class="rr-color" data-hex="' + esc(k[1]) + '" aria-label="' + esc(k[0] + ' ' + k[1] + ', copiar código') + '"><i style="background:' + esc(k[1]) + '"></i><b>' + esc(k[0]) + '</b><small>' + esc(k[1]) + '</small></button>'; }).join('') + '</div>' +
            (p.uso ? '<p class="rr-uso"><b>Ideal para:</b> ' + esc(p.uso) + '</p>' : '') + (p.tip ? '<p class="rr-tip"><b>Tip de Rosina:</b> ' + esc(p.tip) + '</p>' : '');
          g.appendChild(t);
        }); plista.appendChild(g);
      });
    }
    pintarPaletas();
  }
  /* Las tiras «Herramienta de Rosina» de otras hojas abren esta hoja (sin salir de la agenda); sin JavaScript siguen llevando a la página de siempre */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('.herr-rosina a'); if (!a || !window.lrIrAHoja) return;
    var h = a.getAttribute('href') || '', cual = /^\/glosario-rosina\.html/.test(h) ? 'glosario' : (/^\/recursos-rosina\.html#abreviaturas/.test(h) ? 'abreviaturas' : (/^\/paletas-rosina\.html/.test(h) || /^\/recursos-rosina\.html#paletas/.test(h) ? 'paletas' : (/^\/calculadoras-rosina\.html/.test(h) ? 'calculadoras' : (/^\/recursos-rosina\.html#checklist/.test(h) ? 'checklist' : ''))));
    if (!cual) return; e.preventDefault(); window.lrIrAHoja('recursos-rosina'); mostrar(cual, cual === 'calculadoras' ? (h.split('#')[1] || '') : '');
  });
  window.lrRecursos = { mostrar: mostrar };
})();
