/* Agenda para tejedoras: portada imprimible (27-oct-2026).
   Se elige el fondo (flores, hojas, madejas, Rosina o liso) y el color; sale el nombre escrito en «Esta agenda es de».
   Los fondos se dibujan aquí mismo (sin imágenes externas) para que se vean igual en pantalla y al imprimir. */
(function () {
  'use strict';
  var N = window.lrAgendaNucleo, hoja = document.getElementById('portada-hoja');
  if (!N || !hoja) return;

  var COLORES = {
    rosa:    { n: 'Rosa',    base: '#FDEAF3', a: '#F28FC0', b: '#E74E96', c: '#FFFFFF', h: '#9BD3B0' },
    lila:    { n: 'Lila',    base: '#EEEEFF', a: '#9EA2F9', b: '#6D72E0', c: '#FFFFFF', h: '#9BD3B0' },
    azul:    { n: 'Azul',    base: '#E8F2FF', a: '#93C7F9', b: '#4C9BEA', c: '#FFFFFF', h: '#9BD3B0' },
    verde:   { n: 'Verde',   base: '#E8F7EE', a: '#8FD3A8', b: '#3FAE73', c: '#FFFFFF', h: '#F7B3D4' },
    durazno: { n: 'Durazno', base: '#FFF0E1', a: '#F9C48B', b: '#F0933B', c: '#FFFFFF', h: '#9BD3B0' }
  };
  var FONDOS = { flores: 'Flores', hojas: 'Hojas', madejas: 'Madejas', rosina: 'Rosina', liso: 'Liso' };
  var STICKERS = ['rosina-02-corazon', 'rosina-03-ovillo-corazon', 'rosina-05-ovillo-sentada', 'rosina-06-idea', 'rosina-08-feliz', 'rosina-12-pulgar-arriba', 'rosina-15-ramo', 'rosina-17-gorro'];

  function svgUri(w, h, cuerpo) { return 'url("data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '">' + cuerpo + '</svg>') + '")'; }
  function flor(cx, cy, r, c1, c2) {
    var x = '', i; for (i = 0; i < 5; i++) { var a = i * 72 * Math.PI / 180; x += '<circle cx="' + (cx + Math.sin(a) * r * 1.25).toFixed(1) + '" cy="' + (cy - Math.cos(a) * r * 1.25).toFixed(1) + '" r="' + r + '" fill="' + c1 + '"/>'; }
    return x + '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r * 0.75).toFixed(1) + '" fill="' + c2 + '"/>';
  }
  function hojaSvg(x, y, ang, esc, col) { return '<g transform="translate(' + x + ',' + y + ') rotate(' + ang + ') scale(' + esc + ')"><path d="M0,0 C8,-12 26,-12 34,0 C26,12 8,12 0,0 Z" fill="' + col + '"/><path d="M2,0 L30,0" stroke="#fff" stroke-width="1.5" opacity=".7"/></g>'; }
  function madeja(cx, cy, r, c1, c2) {
    var id = 'm' + cx + cy;
    return '<defs><clipPath id="' + id + '"><circle cx="' + cx + '" cy="' + cy + '" r="' + r + '"/></clipPath></defs><circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + c1 + '"/>' +
      '<g clip-path="url(#' + id + ')" fill="none" stroke="' + c2 + '" stroke-width="2" stroke-linecap="round"><path d="M' + (cx - r) + ',' + (cy - r * 0.3) + ' Q' + cx + ',' + (cy - r * 0.9) + ' ' + (cx + r) + ',' + (cy + r * 0.2) + '"/><path d="M' + (cx - r) + ',' + (cy + r * 0.2) + ' Q' + cx + ',' + (cy - r * 0.4) + ' ' + (cx + r) + ',' + (cy + r * 0.7) + '"/><path d="M' + (cx - r) + ',' + (cy + r * 0.7) + ' Q' + cx + ',' + (cy + r * 0.1) + ' ' + (cx + r) + ',' + (cy + r * 1.2) + '"/></g>' +
      '<path d="M' + (cx + r * 0.6) + ',' + (cy + r * 0.8) + ' q8,10 18,4 t16,2" fill="none" stroke="' + c2 + '" stroke-width="2" stroke-linecap="round"/>';
  }
  function fondoSvg(tipo, p) {
    if (tipo === 'flores') return svgUri(150, 150, flor(38, 38, 9, p.a, p.c) + flor(112, 108, 7, p.b, p.c) + '<circle cx="112" cy="36" r="3" fill="' + p.a + '"/><circle cx="36" cy="112" r="3" fill="' + p.b + '"/>' + hojaSvg(60, 70, 35, 0.6, p.h) + hojaSvg(88, 120, -40, 0.5, p.h));
    if (tipo === 'hojas') return svgUri(140, 140, hojaSvg(20, 30, 40, 1, p.a) + hojaSvg(95, 25, -30, 0.8, p.b) + hojaSvg(40, 100, -50, 0.9, p.b) + hojaSvg(105, 105, 25, 1, p.a) + hojaSvg(70, 65, 90, 0.6, p.h));
    if (tipo === 'madejas') return svgUri(170, 170, madeja(42, 44, 20, p.a, p.c) + madeja(124, 120, 16, p.b, p.c) + '<circle cx="128" cy="38" r="3" fill="' + p.a + '"/><circle cx="40" cy="132" r="3" fill="' + p.b + '"/>');
    return '';
  }
  function pintar() {
    var d = N.datos(), f = d['ag-portada-fondo'] && FONDOS[d['ag-portada-fondo']] ? d['ag-portada-fondo'] : 'flores', c = d['ag-portada-color'] && COLORES[d['ag-portada-color']] ? d['ag-portada-color'] : 'rosa';
    var p = COLORES[c], fondo = hoja.querySelector('.portada-fondo');
    hoja.dataset.fondo = f; hoja.dataset.color = c; hoja.style.setProperty('--pc-base', p.base); hoja.style.setProperty('--pc-a', p.a); hoja.style.setProperty('--pc-b', p.b);
    fondo.textContent = ''; fondo.style.backgroundImage = ''; fondo.classList.toggle('con-rosina', f === 'rosina');
    if (f === 'rosina') {
      for (var i = 0; i < 12; i++) {
        var im = document.createElement('img'); im.src = '/img/stickers/' + STICKERS[i % STICKERS.length] + '.webp'; im.alt = ''; im.width = 512; im.height = 512; im.decoding = 'async';
        im.style.left = (i % 3) * 33 + (Math.floor(i / 3) % 2 ? 4 : -3) + '%'; im.style.top = Math.floor(i / 3) * 25 + '%'; im.style.transform = 'rotate(' + [-12, 8, -6, 14, -9, 6][i % 6] + 'deg)'; fondo.appendChild(im);
      }
    } else fondo.style.backgroundImage = fondoSvg(f, p);
    document.querySelectorAll('#portada-fondos button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.v === f)); });
    document.querySelectorAll('#portada-colores button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.v === c)); });
    var nombre = String(d['ag-duena'] || '').trim();
    hoja.querySelector('#portada-nombre-vista').textContent = nombre || 'Tu nombre';
    hoja.querySelector('#portada-nombre-vista').classList.toggle('vacio', !nombre);
    hoja.querySelector('#portada-frase-vista').textContent = String(d['ag-portada-frase'] || '').trim();
    var campo = document.getElementById('portada-nombre'); if (campo && document.activeElement !== campo) campo.value = nombre;
  }
  function elegir(id, valor) {
    var e = document.getElementById(id); e.value = valor; e.dispatchEvent(new Event('input', { bubbles: true }));
    N.datos()[id] = valor; pintar();
  }
  var fb = document.getElementById('portada-fondos'), cb = document.getElementById('portada-colores');
  Object.keys(FONDOS).forEach(function (k) { var b = document.createElement('button'); b.type = 'button'; b.dataset.v = k; b.className = 'portada-op'; b.textContent = FONDOS[k]; b.addEventListener('click', function () { elegir('ag-portada-fondo', k); }); fb.appendChild(b); });
  Object.keys(COLORES).forEach(function (k) { var b = document.createElement('button'); b.type = 'button'; b.dataset.v = k; b.className = 'portada-color'; b.style.setProperty('--c', COLORES[k].a); b.setAttribute('aria-label', COLORES[k].n); b.title = COLORES[k].n; b.addEventListener('click', function () { elegir('ag-portada-color', k); }); cb.appendChild(b); });
  /* el nombre es el mismo de «Esta agenda es de» del inicio de la página */
  var nombre = document.getElementById('portada-nombre'), duena = document.getElementById('ag-duena');
  nombre.addEventListener('input', function () { if (duena) { duena.value = nombre.value; duena.dispatchEvent(new Event('input', { bubbles: true })); } N.datos()['ag-duena'] = nombre.value; pintar(); });
  if (duena) duena.addEventListener('input', function () { setTimeout(pintar, 0); });
  document.addEventListener('agenda-guardada', pintar);
  document.getElementById('portada-agenda').addEventListener('input', function (e) { if (e.target.id === 'ag-portada-frase') setTimeout(pintar, 0); });
  pintar();
})();
