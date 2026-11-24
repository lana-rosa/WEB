/* Agenda para tejedoras: «Mis hábitos y agua» (23-nov-2026), dentro de la hoja «Registro de pausas activas» (Bienestar; sin hoja nueva en el menú).
   · Agua de hoy: vasos (meta 8, se puede cambiar de 1 a 20); tocar un vaso marca hasta ese vaso, tocar el último lo quita.
   · Hábitos del mes: hasta 8 hábitos con su cuadrícula de días (no deja marcar días futuros).
   Datos: datos._habitos = { lista: [{ id, n }], marcas: { 'AAAA-MM-DD': [ids] }, agua: { 'AAAA-MM-DD': vasos }, meta: 8 } (empieza con «_»: entra solo en copias, nube y Drive).
   NO guarda medicamentos ni suplementos (datos de salud sensibles: pendiente de decidir con la abogada). */
(function () {
  'use strict';
  var N = window.lrAgendaNucleo, hoja = document.getElementById('registro-pausas'); if (!N || !hoja) return;
  var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'], MAX = 8;
  var SUGERIDOS = ['Estirar las manos', 'Tejer un ratito', 'Salir a caminar'];
  function T(t) { return window.lrI18n && window.lrI18n.t ? window.lrI18n.t(t) : t; }
  function el(tag, cls, t) { var e = document.createElement(tag); if (cls) e.className = cls; if (t != null) e.textContent = t; return e; }
  function dd(n) { return (n < 10 ? '0' : '') + n; }
  function iso(y, m, d) { return y + '-' + dd(m + 1) + '-' + dd(d); }
  var hoy = new Date(), mes = { y: hoy.getFullYear(), m: hoy.getMonth() }, HOY = iso(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  function H() {
    var d = N.datos(), h = d._habitos; if (!h || typeof h !== 'object' || Array.isArray(h)) h = d._habitos = {};
    if (!Array.isArray(h.lista)) h.lista = []; if (!h.marcas || typeof h.marcas !== 'object') h.marcas = {}; if (!h.agua || typeof h.agua !== 'object') h.agua = {}; if (!(h.meta >= 1 && h.meta <= 20)) h.meta = 8; return h;
  }
  function guardar() { N.guardar(); if (window.lrAgenda && window.lrAgenda.alCambiar) window.lrAgenda.alCambiar(); }
  var raiz = el('section', 'hb-raiz no-imprimir'), ref = hoja.querySelector('.tip-agenda'); ref ? ref.parentNode.insertBefore(raiz, ref) : hoja.appendChild(raiz);

  function pintarAgua(cont) {
    var h = H(), n = Math.min(h.agua[HOY] || 0, h.meta), tarj = el('div', 'hb-tarjeta');
    tarj.appendChild(el('h4', 'hb-t', '💧 ' + T('Agua de hoy')));
    var fila = el('div', 'hb-vasos'); fila.setAttribute('role', 'group'); fila.setAttribute('aria-label', T('Vasos de agua de hoy'));
    for (var i = 1; i <= h.meta; i++) (function (i) {
      var b = el('button', 'hb-vaso' + (i <= n ? ' lleno' : ''), '🥛'); b.type = 'button'; b.setAttribute('aria-pressed', i <= n ? 'true' : 'false'); b.setAttribute('aria-label', T('Vaso') + ' ' + i); b.setAttribute('data-no-traducir', '');
      b.addEventListener('click', function () { h.agua[HOY] = (i === n) ? i - 1 : i; if (!h.agua[HOY]) delete h.agua[HOY]; guardar(); pintar(); }); fila.appendChild(b);
    })(i);
    tarj.appendChild(fila);
    var pie = el('div', 'hb-pie'), cu = el('span', 'hb-cuenta', n + ' / ' + h.meta + ' ' + T('vasos')); cu.setAttribute('data-no-traducir', ''); pie.appendChild(cu);
    var l = el('label', 'hb-meta'), i2 = el('input'); i2.type = 'number'; i2.min = 1; i2.max = 20; i2.inputMode = 'numeric'; i2.value = h.meta; i2.setAttribute('aria-label', T('Meta de vasos al día'));
    i2.addEventListener('change', function () { var v = Math.round(parseFloat(i2.value)); if (v >= 1 && v <= 20) { h.meta = v; guardar(); pintar(); } else i2.value = h.meta; });
    l.appendChild(el('span', '', T('Meta'))); l.appendChild(i2); pie.appendChild(l); tarj.appendChild(pie); cont.appendChild(tarj);
  }
  function pintarHabitos(cont) {
    var h = H(), tarj = el('div', 'hb-tarjeta'), dias = new Date(mes.y, mes.m + 1, 0).getDate(), esMesActual = mes.y === hoy.getFullYear() && mes.m === hoy.getMonth();
    tarj.appendChild(el('h4', 'hb-t', '✅ ' + T('Mis hábitos')));
    var nav = el('div', 'hb-mes'), a = el('button', 'hb-flecha', '‹'), s = el('button', 'hb-flecha', '›'), tit = el('strong', '', MESES[mes.m].charAt(0).toUpperCase() + MESES[mes.m].slice(1) + ' ' + mes.y);
    a.type = s.type = 'button'; a.setAttribute('aria-label', T('Mes anterior')); s.setAttribute('aria-label', T('Mes siguiente')); tit.setAttribute('data-no-traducir', '');
    a.addEventListener('click', function () { mes = mes.m === 0 ? { y: mes.y - 1, m: 11 } : { y: mes.y, m: mes.m - 1 }; pintar(); });
    s.addEventListener('click', function () { mes = mes.m === 11 ? { y: mes.y + 1, m: 0 } : { y: mes.y, m: mes.m + 1 }; pintar(); });
    nav.appendChild(a); nav.appendChild(tit); nav.appendChild(s); tarj.appendChild(nav);
    if (!h.lista.length) tarj.appendChild(el('p', 'hb-vacio', T('Escribe un hábito que quieras cuidar, como estirar las manos o salir a caminar, y marca cada día que lo cumplas.')));
    var tab = el('div', 'hb-scroll');
    h.lista.forEach(function (x) {
      var fila = el('div', 'hb-fila'), cab = el('div', 'hb-nombre'), n = 0, cel = el('div', 'hb-dias');
      for (var d = 1; d <= dias; d++) (function (d) {
        var k = iso(mes.y, mes.m, d), on = (h.marcas[k] || []).indexOf(x.id) >= 0, fut = k > HOY; if (on) n++;
        var b = el('button', 'hb-dia' + (on ? ' on' : '') + (k === HOY ? ' hoy' : ''), String(d)); b.type = 'button'; b.disabled = fut; b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.setAttribute('data-no-traducir', '');
        b.setAttribute('aria-label', x.n + ' · ' + d + ' ' + MESES[mes.m]);
        b.addEventListener('click', function () { var m = h.marcas[k] || (h.marcas[k] = []), i = m.indexOf(x.id); if (i >= 0) m.splice(i, 1); else m.push(x.id); if (!m.length) delete h.marcas[k]; guardar(); pintar(); }); cel.appendChild(b);
      })(d);
      var nm = el('span', 'hb-n', x.n), c = el('span', 'hb-c', n + ' / ' + (esMesActual ? hoy.getDate() : dias)); c.setAttribute('data-no-traducir', ''); nm.setAttribute('data-no-traducir', '');
      var del = el('button', 'hb-quitar', '✕'); del.type = 'button'; del.setAttribute('aria-label', T('Quitar el hábito') + ' ' + x.n);
      del.addEventListener('click', function () { if (!window.confirm(T('¿Quitar este hábito y sus marcas?'))) return; h.lista = h.lista.filter(function (y) { return y.id !== x.id; }); Object.keys(h.marcas).forEach(function (k) { h.marcas[k] = h.marcas[k].filter(function (i) { return i !== x.id; }); if (!h.marcas[k].length) delete h.marcas[k]; }); guardar(); pintar(); });
      cab.appendChild(nm); cab.appendChild(c); cab.appendChild(del); fila.appendChild(cab); fila.appendChild(cel); tab.appendChild(fila);
    });
    tarj.appendChild(tab);
    if (h.lista.length < MAX) {
      var f = el('form', 'hb-nuevo'), i = el('input'); i.maxLength = 40; i.placeholder = T('Escribe un hábito'); i.setAttribute('aria-label', T('Nuevo hábito')); i.autocomplete = 'off';
      var b = el('button', 'boton-primario boton-chico', T('Agregar')); b.type = 'submit'; f.appendChild(i); f.appendChild(b);
      function agregar(t) { t = String(t || '').trim(); if (!t) return; h.lista.push({ id: 'h' + Date.now().toString(36) + Math.floor(Math.random() * 100), n: t.slice(0, 40) }); guardar(); pintar(); }
      f.addEventListener('submit', function (e) { e.preventDefault(); agregar(i.value); }); tarj.appendChild(f);
      if (!h.lista.length) { var sg = el('div', 'hb-sug'); SUGERIDOS.forEach(function (t) { var c = el('button', 'hb-chip', T(t)); c.type = 'button'; c.addEventListener('click', function () { agregar(T(t)); }); sg.appendChild(c); }); tarj.appendChild(sg); }
    } else tarj.appendChild(el('p', 'hb-vacio', T('Ya tienes 8 hábitos: quita uno para agregar otro.')));
    cont.appendChild(tarj);
  }
  function pintar() {
    var ac = document.activeElement, tenia = ac && raiz.contains(ac) && ac.tagName === 'INPUT' && ac.type === 'text' ? ac.value : null;
    raiz.textContent = ''; raiz.appendChild(el('h3', 'hb-h', T('Mis hábitos y agua'))); pintarAgua(raiz); pintarHabitos(raiz);
    if (tenia) { var i = raiz.querySelector('.hb-nuevo input'); if (i) { i.value = tenia; i.focus(); } }
  }
  document.addEventListener('agenda-guardada', function () { if (hoja.classList.contains('abierta') && !raiz.contains(document.activeElement)) pintar(); });
  new MutationObserver(function () { if (hoja.classList.contains('abierta')) pintar(); }).observe(hoja, { attributes: true, attributeFilter: ['class'] });
  window.lrHabitos = { pintar: pintar, aguaHoy: function () { return H().agua[HOY] || 0; } };
  pintar();
})();
