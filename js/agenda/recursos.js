/* Agenda para tejedoras: hoja «Recursos de Rosina» (1-nov-2026, pedido de Jennifer: tener los recursos gratis dentro de la agenda, sin salir).
   Etapa 1: Glosario ilustrado (buscador, categorías, cada término se despliega) y Abreviaturas de crochet en 9 idiomas (filtro de idiomas).
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
  function mostrar(cual) {
    pestanas.forEach(function (b) { var on = b.dataset.rr === cual; b.setAttribute('aria-selected', String(on)); });
    hoja.querySelectorAll('.rr-panel').forEach(function (p) { p.hidden = p.id !== 'rr-' + cual; });
  }
  pestanas.forEach(function (b) { b.addEventListener('click', function () { mostrar(b.dataset.rr); }); });

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
  ab.appendChild(intro); ab.appendChild(filtro); ab.appendChild(envol); ab.appendChild(ojo);
  function aplicar() { tb.querySelectorAll('[data-idioma]').forEach(function (c) { var id = c.dataset.idioma; c.hidden = id !== 'es' && !activos[id]; }); }
  aplicar();
  /* Las tiras «Herramienta de Rosina» de otras hojas abren esta hoja (sin salir de la agenda); sin JavaScript siguen llevando a la página de siempre */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('.herr-rosina a'); if (!a || !window.lrIrAHoja) return;
    var h = a.getAttribute('href') || '', cual = /^\/glosario-rosina\.html/.test(h) ? 'glosario' : (/^\/recursos-rosina\.html#abreviaturas/.test(h) ? 'abreviaturas' : '');
    if (!cual) return; e.preventDefault(); window.lrIrAHoja('recursos-rosina'); mostrar(cual);
  });
  window.lrRecursos = { mostrar: mostrar };
})();
