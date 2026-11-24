/* Agenda para tejedoras: «Mi brújula», (entrega 1, 23-nov-2026: rueda de la vida y metas SMART; entrega 2, 24-nov-2026: Ikigai y carta de fin de año).
   · Rueda de la vida: 8 áreas con un valor de 1 a 10 y un gráfico de telaraña en SVG (los nombres van en HTML porque el traductor no entra en los svg; en el gráfico solo números).
   · Metas SMART: hasta 6; cada una con qué quiero lograr (específica), cómo lo mediré, qué haré (y si es realista) y para cuándo; se marcan cumplidas.
   · Ikigai: 4 listas (lo que amo, en lo que soy buena, lo que el mundo necesita, por lo que me pagarían) y una frase propia; se guardan al salir de cada casilla.
   · Carta de fin de año: una carta por año para releer en diciembre (antes de diciembre queda «sellada»; se puede editar).
   Datos: datos._brujula = { ikigai: { ama, buena, necesita, pagan, mi }, cartas: { 'AAAA': { t, f } }, rueda: { clave: 1..10 }, ruedaFecha: 'AAAA-MM-DD', metas: [{ id, q, m, h, f, ok }] } (empieza con «_»: entra solo en copias, nube y Drive). */
(function () {
  'use strict';
  var N = window.lrAgendaNucleo, hoja = document.getElementById('mi-brujula'); if (!N || !hoja) return;
  var AREAS = [['salud', 'Salud'], ['familia', 'Familia'], ['amigos', 'Amigos'], ['fe', 'Fe y espiritualidad'], ['trabajo', 'Mi negocio y trabajo'], ['dinero', 'Dinero'], ['aprender', 'Aprender y crecer'], ['descanso', 'Descanso y diversión']], MAXM = 6;
  function T(t) { return window.lrI18n && window.lrI18n.t ? window.lrI18n.t(t) : t; }
  function el(tag, cls, t) { var e = document.createElement(tag); if (cls) e.className = cls; if (t != null) e.textContent = t; return e; }
  function B() { var d = N.datos(), b = d._brujula; if (!b || typeof b !== 'object' || Array.isArray(b)) b = d._brujula = {}; if (!b.rueda || typeof b.rueda !== 'object') b.rueda = {}; if (!Array.isArray(b.metas)) b.metas = []; return b; }
  function guardar() { N.guardar(); if (window.lrAgenda && window.lrAgenda.alCambiar) window.lrAgenda.alCambiar(); }
  function hoyTxt() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  var raiz = el('div', 'bj-raiz'), ref = hoja.querySelector('.tip-agenda'); ref ? ref.parentNode.insertBefore(raiz, ref) : hoja.appendChild(raiz);

  function svgRueda(b) {
    var NS = 'http://www.w3.org/2000/svg', n = AREAS.length, c = 150, R = 105, s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', '0 0 300 300'); s.setAttribute('class', 'bj-svg'); s.setAttribute('role', 'img');
    s.setAttribute('aria-label', T('Rueda de la vida') + ': ' + AREAS.map(function (a, i) { return (i + 1) + ' = ' + (b.rueda[a[0]] || 0); }).join(', '));
    function pt(i, v) { var an = -Math.PI / 2 + i * 2 * Math.PI / n, r = R * v / 10; return [c + r * Math.cos(an), c + r * Math.sin(an)]; }
    function mk(tag, at) { var e = document.createElementNS(NS, tag); Object.keys(at).forEach(function (k) { e.setAttribute(k, at[k]); }); s.appendChild(e); return e; }
    [2.5, 5, 7.5, 10].forEach(function (v) { mk('polygon', { points: AREAS.map(function (_, i) { return pt(i, v).join(','); }).join(' '), fill: 'none', stroke: '#F28FC0', 'stroke-width': v === 10 ? 1.5 : 0.8, opacity: 0.8 }); });
    AREAS.forEach(function (_, i) { var p = pt(i, 10); mk('line', { x1: c, y1: c, x2: p[0], y2: p[1], stroke: '#F28FC0', 'stroke-width': 0.8, opacity: 0.8 }); });
    mk('polygon', { points: AREAS.map(function (a, i) { return pt(i, b.rueda[a[0]] || 0).join(','); }).join(' '), fill: 'rgba(231,78,150,.35)', stroke: '#E74E96', 'stroke-width': 2.5, 'stroke-linejoin': 'round' });
    AREAS.forEach(function (a, i) { var p = pt(i, 10), q = [c + (p[0] - c) * 1.16, c + (p[1] - c) * 1.16], t = mk('text', { x: q[0], y: q[1] + 5, 'text-anchor': 'middle', 'font-size': 15, 'font-weight': 700, fill: '#7A3FD6' }); t.textContent = String(i + 1); });
    return s;
  }
  function pintarRueda(cont) {
    var b = B(), tarj = el('div', 'bj-tarjeta');
    tarj.appendChild(el('h4', 'bj-t', '🧭 ' + T('Rueda de la vida')));
    tarj.appendChild(el('p', 'bj-s', T('Dale de 1 a 10 a cada área según cómo te sientes hoy. Entre más llena la rueda, más equilibrada tu vida.')));
    var g = el('div', 'bj-rueda'); g.appendChild(svgRueda(b));
    var lista = el('div', 'bj-areas');
    AREAS.forEach(function (a, i) {
      var f = el('label', 'bj-area'), nm = el('span', 'bj-nm', (i + 1) + ' · ' + T(a[1])), r = el('input'), v = el('output', 'bj-v', String(b.rueda[a[0]] || 0));
      r.type = 'range'; r.min = 0; r.max = 10; r.step = 1; r.value = b.rueda[a[0]] || 0; r.setAttribute('aria-label', T(a[1])); v.setAttribute('data-no-traducir', ''); nm.setAttribute('data-no-traducir', '');
      r.addEventListener('input', function () { v.textContent = r.value; });
      r.addEventListener('change', function () { var n = +r.value; if (n) b.rueda[a[0]] = n; else delete b.rueda[a[0]]; b.ruedaFecha = hoyTxt(); guardar(); pintar(); });
      f.appendChild(nm); f.appendChild(r); f.appendChild(v); lista.appendChild(f);
    });
    g.appendChild(lista); tarj.appendChild(g);
    var vals = AREAS.map(function (a) { return b.rueda[a[0]] || 0; }), llenas = vals.filter(Boolean).length;
    if (llenas === AREAS.length) {
      var min = AREAS.reduce(function (m, a) { return (b.rueda[a[0]] || 0) < (b.rueda[m[0]] || 0) ? a : m; }, AREAS[0]);
      tarj.appendChild(el('p', 'bj-lectura', T('El área que más cariño necesita ahora es:') + ' ' + T(min[1]) + '.'));
    } else tarj.appendChild(el('p', 'bj-lectura', T('Llena las 8 áreas para ver qué necesita más cariño.')));
    cont.appendChild(tarj);
  }
  function pintarMetas(cont) {
    var b = B(), tarj = el('div', 'bj-tarjeta');
    tarj.appendChild(el('h4', 'bj-t', '🎯 ' + T('Mis metas SMART')));
    tarj.appendChild(el('p', 'bj-s', T('Una meta SMART es clara, se puede medir, se puede lograr, te importa y tiene fecha.')));
    if (!b.metas.length) tarj.appendChild(el('p', 'bj-vacio', T('Aún no tienes metas. Escribe la primera.')));
    var hoy = hoyTxt();
    b.metas.forEach(function (x) {
      var c = el('div', 'bj-meta' + (x.ok ? ' ok' : '')), cab = el('label', 'bj-meta-cab'), ck = el('input'), tx = el('span', 'bj-meta-t', x.q);
      ck.type = 'checkbox'; ck.checked = !!x.ok; ck.addEventListener('change', function () { x.ok = ck.checked; guardar(); pintar(); }); tx.setAttribute('data-no-traducir', ''); cab.appendChild(ck); cab.appendChild(tx); c.appendChild(cab);
      [['m', 'Lo mediré así'], ['h', 'Lo haré así']].forEach(function (k) { if (x[k[0]]) { var p = el('p', 'bj-meta-l'), s = el('strong', '', T(k[1]) + ': '), v = el('span', '', x[k[0]]); v.setAttribute('data-no-traducir', ''); p.appendChild(s); p.appendChild(v); c.appendChild(p); } });
      if (x.f) { var vencida = !x.ok && x.f < hoy, p = el('p', 'bj-meta-l' + (vencida ? ' vencida' : '')), s = el('strong', '', T('Para el') + ' '), v = el('span', '', x.f); v.setAttribute('data-no-traducir', ''); p.appendChild(s); p.appendChild(v); if (vencida) p.appendChild(el('em', '', ' · ' + T('ya pasó la fecha: ¿la ajustas?'))); c.appendChild(p); }
      var del = el('button', 'bj-quitar', '✕'); del.type = 'button'; del.setAttribute('aria-label', T('Quitar la meta') + ' ' + x.q); del.addEventListener('click', function () { if (!window.confirm(T('¿Quitar esta meta?'))) return; b.metas = b.metas.filter(function (y) { return y.id !== x.id; }); guardar(); pintar(); });
      c.appendChild(del); tarj.appendChild(c);
    });
    if (b.metas.length < MAXM) {
      var f = el('form', 'bj-form'); f.autocomplete = 'off';
      function campo(id, etq, ph, tipo) { var l = el('label', 'bj-campo'), i = el('input'); i.id = 'bj-' + id; i.maxLength = 120; if (tipo) i.type = tipo; if (ph) i.placeholder = T(ph); l.appendChild(el('span', '', T(etq))); l.appendChild(i); f.appendChild(l); return i; }
      var q = campo('q', 'Qué quiero lograr (específica)', 'Ej.: vender 20 amigurumis este mes'), m = campo('m', 'Cómo lo mediré', 'Ej.: pedidos entregados en mi agenda'), h = campo('h', 'Qué haré para lograrlo', 'Ej.: publicar 3 veces por semana'), fe = campo('f', 'Para cuándo', '', 'date');
      var b1 = el('button', 'boton-primario boton-chico', T('Agregar meta')); b1.type = 'submit'; f.appendChild(b1);
      f.addEventListener('submit', function (e) { e.preventDefault(); var t = q.value.trim(); if (!t) { q.focus(); return; } b.metas.push({ id: 'm' + Date.now().toString(36) + Math.floor(Math.random() * 100), q: t, m: m.value.trim(), h: h.value.trim(), f: fe.value || '', ok: false }); guardar(); pintar(); });
      tarj.appendChild(f);
    } else tarj.appendChild(el('p', 'bj-vacio', T('Ya tienes 6 metas: cumple o quita una para agregar otra.')));
    cont.appendChild(tarj);
  }
  var IKI = [['ama', 'Lo que amo hacer', 'Lo que te hace perder la noción del tiempo'], ['buena', 'En lo que soy buena', 'Lo que los demás te reconocen'], ['necesita', 'Lo que el mundo necesita', 'A quién ayudas con lo que haces'], ['pagan', 'Por lo que me pueden pagar', 'Lo que ya vendes o podrías vender']];
  function pintarIkigai(cont) {
    var b = B(), ik = b.ikigai && typeof b.ikigai === 'object' ? b.ikigai : (b.ikigai = {}), tarj = el('div', 'bj-tarjeta');
    tarj.appendChild(el('h4', 'bj-t', '🌸 ' + T('Mi Ikigai')));
    tarj.appendChild(el('p', 'bj-s', T('Ikigai es tu razón de ser: donde se cruzan lo que amas, lo que haces bien, lo que el mundo necesita y lo que te puede dar ingresos. Escribe una idea por renglón.')));
    function campo(clave, etq, ayuda, filas) {
      var l = el('label', 'bj-campo'), t = el('textarea'); t.rows = filas || 3; t.maxLength = 600; t.id = 'bj-ik-' + clave; t.value = ik[clave] || ''; t.setAttribute('aria-describedby', 'bj-ik-' + clave + '-a');
      var a = el('small', 'bj-ayuda', T(ayuda)); a.id = 'bj-ik-' + clave + '-a';
      t.addEventListener('change', function () { var v = t.value.trim(); if (v) ik[clave] = v; else delete ik[clave]; guardar(); });
      l.appendChild(el('span', '', T(etq))); l.appendChild(a); l.appendChild(t); tarj.appendChild(l);
    }
    IKI.forEach(function (x) { campo(x[0], x[1], x[2]); });
    campo('mi', 'Mi Ikigai en una frase', 'Junta lo que escribiste en un solo renglón', 2);
    cont.appendChild(tarj);
  }
  var abrirCarta = false;
  function pintarCarta(cont) {
    var b = B(), cartas = b.cartas && typeof b.cartas === 'object' ? b.cartas : (b.cartas = {}), anio = String(new Date().getFullYear()), mesAct = new Date().getMonth(), tarj = el('div', 'bj-tarjeta'), c = cartas[anio];
    tarj.appendChild(el('h4', 'bj-t', '💌 ' + T('Carta de fin de año')));
    tarj.appendChild(el('p', 'bj-s', T('Escríbete una carta para leerla en diciembre: cómo quieres que haya sido tu año y qué quieres recordar.')));
    var sellada = c && c.t && mesAct < 11 && !abrirCarta;
    if (sellada) {
      tarj.appendChild(el('p', 'bj-lectura', '🔒 ' + T('Tu carta de este año está guardada. Se abre en diciembre.')));
      var e = el('button', 'boton-secundario boton-chico', T('Editar mi carta')); e.type = 'button'; e.addEventListener('click', function () { abrirCarta = true; pintar(); }); tarj.appendChild(e);
    }
    if (!sellada) {
      var l = el('label', 'bj-campo'), t = el('textarea'); t.rows = 7; t.maxLength = 3000; t.id = 'bj-carta'; t.value = c && c.t || ''; t.placeholder = T('Querida yo de diciembre:');
      t.addEventListener('change', function () { var v = t.value.trim(); if (v) cartas[anio] = { t: v, f: hoyTxt() }; else delete cartas[anio]; guardar(); });
      l.appendChild(el('span', '', T('Mi carta') + ' ' + anio)); l.appendChild(t); tarj.appendChild(l);
    }
    Object.keys(cartas).filter(function (k) { return k < anio && cartas[k] && cartas[k].t; }).sort().reverse().forEach(function (k) {
      var d = el('details', 'bj-vieja'), sm = el('summary', '', T('Mi carta') + ' ' + k), p = el('p', 'bj-vieja-t', cartas[k].t); sm.setAttribute('data-no-traducir', ''); p.setAttribute('data-no-traducir', ''); d.appendChild(sm); d.appendChild(p); tarj.appendChild(d);
    });
    cont.appendChild(tarj);
  }
  function pintar() {
    var ac = document.activeElement, guardado = {}; if (ac && raiz.contains(ac) && ac.tagName === 'TEXTAREA') return;
    if (ac && raiz.contains(ac) && ac.closest('.bj-form')) raiz.querySelectorAll('.bj-form input').forEach(function (i) { guardado[i.id] = i.value; });
    raiz.textContent = ''; pintarRueda(raiz); pintarMetas(raiz); pintarIkigai(raiz); pintarCarta(raiz);
    Object.keys(guardado).forEach(function (k) { var i = document.getElementById(k); if (i) i.value = guardado[k]; });
  }
  document.addEventListener('agenda-guardada', function () { if (hoja.classList.contains('abierta') && !raiz.contains(document.activeElement)) pintar(); });
  new MutationObserver(function () { if (hoja.classList.contains('abierta')) pintar(); }).observe(hoja, { attributes: true, attributeFilter: ['class'] });
  window.lrBrujula = { pintar: pintar };
  pintar();
})();
