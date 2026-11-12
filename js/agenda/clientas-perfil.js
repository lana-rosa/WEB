/* Agenda para tejedoras: medidas y gustos de cada clienta (E34, 12-nov-2026; idea tomada de comparar con otra agenda, textos y diseño propios).
   En cada ficha de «Mis clientas», una casilla plegable «Medidas y gustos»: medidas del cuerpo en centímetros (busto, cintura, cadera, largo de la prenda, contorno de cabeza)
   y gustos (colores que le gustan, colores que evita, fibras o lanas, alergias o cuidados y otras notas). Sin hojas nuevas y sin tocar los campos de la lista de clientas.
   Los datos viven en `datos._clientaPerfil['cN'] = { busto, cintura, cadera, largo, cabeza, gusta, evita, fibras, alergias, notas }` (N = renglón de la clienta; entra solo en copias, nube y Drive).
   Se guarda al escribir; si la clienta se borra (nombre vacío) sus datos se borran también. Son datos personales delicados: la casilla recuerda guardarlos solo con el permiso de la clienta. */
(function () {
  'use strict';
  var N = window.lrAgendaNucleo, hoja = document.getElementById('mis-clientas');
  if (!N || !hoja || !N.tablas['tabla-clientas']) return;
  var CL = N.tablas['tabla-clientas'];
  var MEDIDAS = [['busto', 'Busto o pecho (cm)'], ['cintura', 'Cintura (cm)'], ['cadera', 'Cadera (cm)'], ['largo', 'Largo de la prenda (cm)'], ['cabeza', 'Contorno de la cabeza (cm)']];
  var GUSTOS = [['gusta', 'Colores que le gustan'], ['evita', 'Colores que evita'], ['fibras', 'Fibras o lanas que prefiere'], ['alergias', 'Alergias o cuidados con los materiales']];
  function el(tag, cls, t) { var e = document.createElement(tag); if (cls) e.className = cls; if (t != null) e.textContent = t; return e; }
  function T(t) { return window.lrI18n && window.lrI18n.t ? window.lrI18n.t(t) : t; }
  function datos() { var d = N.datos(); if (!d._clientaPerfil || typeof d._clientaPerfil !== 'object' || Array.isArray(d._clientaPerfil)) d._clientaPerfil = {}; return d._clientaPerfil; }
  function nombre(k) { var e = document.getElementById(CL.prefijo + k + '-nombre'); return e ? e.value.trim() : ''; }
  function llenos(k) { var p = datos()['c' + k] || {}; return Object.keys(p).filter(function (c) { return String(p[c] || '').trim(); }).length; }
  function guardarCampo(k, campo, valor) {
    var d = datos(), p = d['c' + k] || (d['c' + k] = {}), v = String(valor || '').trim();
    if (v) p[campo] = v; else delete p[campo];
    if (!Object.keys(p).length) delete d['c' + k];
    N.guardar();
  }
  function limpiar() { var d = datos(), cambio = false; Object.keys(d).forEach(function (c) { if (!nombre(+c.slice(1))) { delete d[c]; cambio = true; } }); if (cambio) N.guardar(); }

  function campo(k, c, etiqueta, grande) {
    var p = datos()['c' + k] || {}, w = el('label', 'cl-p-campo'), id = 'cl-p-' + k + '-' + c;
    w.appendChild(el('span', '', etiqueta));
    var i = el(grande ? 'textarea' : 'input', 'cl-p-in'); i.id = id; if (grande) i.rows = 2; else { i.type = 'text'; i.maxLength = 120; }
    if (/^(busto|cintura|cadera|largo|cabeza)$/.test(c)) { i.inputMode = 'decimal'; i.maxLength = 8; i.setAttribute('data-no-traducir', ''); }
    i.value = p[c] || ''; i.addEventListener('input', function () { guardarCampo(k, c, i.value); marcar(k); });
    w.appendChild(i); return w;
  }
  function marcar(k) {
    var s = hoja.querySelector('tr.ficha[data-fila="' + k + '"] td.cl-perfil summary .cl-p-n'); if (!s) return;
    var n = llenos(k); s.textContent = n ? T(' · ' + n + (n === 1 ? ' dato' : ' datos')) : '';
  }
  function pintar() {
    limpiar();
    hoja.querySelectorAll('#tabla-clientas tr.ficha').forEach(function (tr) {
      var k = +tr.getAttribute('data-fila'), td = tr.querySelector('td.cl-perfil');
      if (!nombre(k)) { if (td) td.remove(); return; }
      if (td) return;   // ya está: no se rehace mientras se escribe
      td = el('td', 'cl-perfil no-imprimir'); td.setAttribute('data-col', 'perfil');
      var ref = tr.querySelector('td.cl-historial') || tr.querySelector('td.celda-cal') || tr.querySelector('td.ficha-acciones'); tr.insertBefore(td, ref && ref.classList.contains('cl-historial') ? ref.nextSibling : ref);
      var det = el('details', 'cl-p-det'), sum = el('summary', 'cl-p-sum'); sum.appendChild(el('span', '', 'Medidas y gustos')); var n = el('span', 'cl-p-n'); n.setAttribute('data-no-traducir', ''); sum.appendChild(n); det.appendChild(sum);
      det.appendChild(el('p', 'cl-p-aviso', 'Guarda estos datos solo si tu clienta te dio permiso.'));
      det.appendChild(el('h5', 'cl-titulo', 'Medidas'));
      var g1 = el('div', 'cl-p-grid'); MEDIDAS.forEach(function (m) { g1.appendChild(campo(k, m[0], m[1], false)); }); det.appendChild(g1);
      det.appendChild(el('h5', 'cl-titulo', 'Gustos'));
      var g2 = el('div', 'cl-p-grid'); GUSTOS.forEach(function (m) { g2.appendChild(campo(k, m[0], m[1], false)); }); g2.appendChild(campo(k, 'notas', 'Otras notas', true)); det.appendChild(g2);
      td.appendChild(det); marcar(k);
    });
  }
  var espera = 0;
  function programar() { clearTimeout(espera); espera = setTimeout(function () { if (hoja.classList.contains('abierta')) pintar(); }, 250); }
  document.addEventListener('agenda-guardada', programar);
  new MutationObserver(function () { if (hoja.classList.contains('abierta')) programar(); }).observe(hoja, { attributes: true, attributeFilter: ['class'] });
  var tb = document.getElementById('tabla-clientas'); if (tb) new MutationObserver(programar).observe(tb, { childList: true });
  if (hoja.classList.contains('abierta')) programar();
  window.lrClientasPerfil = { pintar: pintar };
})();
