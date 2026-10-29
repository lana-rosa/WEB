/* Agenda para tejedoras: portada imprimible (27-oct-2026).
   Se elige el fondo (flores, hojas, madejas, Rosina o liso) y el color; sale el nombre escrito en «Esta agenda es de».
   Desde el 29-oct-2026 los fondos de flores, hojas y madejas son las acuarelas de Sara (`img/agenda/fondo-*.webp`, en vertical, con su miniatura `-mini`): se ven en la portada y,
   con la misma imagen, en todas las hojas de la agenda cuando la persona elige ese fondo (atributo `data-fondo-hojas` de `#agenda`; Rosina y liso dejan las hojas blancas). */
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

  var IMAGENES = { flores: '/img/agenda/fondo-flores.webp', hojas: '/img/agenda/fondo-hojas.webp', madejas: '/img/agenda/fondo-madejas.webp' };
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
    } else if (IMAGENES[f]) fondo.style.backgroundImage = 'url("' + IMAGENES[f] + '")';
    fondo.classList.toggle('con-imagen', !!IMAGENES[f]);
    /* las hojas de la agenda usan el mismo fondo, pero solo si la persona lo eligió (por defecto quedan blancas) */
    var zona = document.getElementById('agenda'), elegido = d['ag-portada-fondo'] && IMAGENES[d['ag-portada-fondo']] ? d['ag-portada-fondo'] : '';
    if (zona) { if (elegido) zona.dataset.fondoHojas = elegido; else delete zona.dataset.fondoHojas; }
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
  Object.keys(FONDOS).forEach(function (k) { var b = document.createElement('button'); b.type = 'button'; b.dataset.v = k; b.className = 'portada-op'; if (IMAGENES[k]) { var mi = document.createElement('span'); mi.className = 'portada-mini'; mi.setAttribute('aria-hidden', 'true'); mi.style.backgroundImage = 'url("/img/agenda/fondo-' + k + '-mini.webp")'; b.appendChild(mi); } b.appendChild(document.createTextNode(FONDOS[k])); b.addEventListener('click', function () { elegir('ag-portada-fondo', k); }); fb.appendChild(b); });
  Object.keys(COLORES).forEach(function (k) { var b = document.createElement('button'); b.type = 'button'; b.dataset.v = k; b.className = 'portada-color'; b.style.setProperty('--c', COLORES[k].a); b.setAttribute('aria-label', COLORES[k].n); b.title = COLORES[k].n; b.addEventListener('click', function () { elegir('ag-portada-color', k); }); cb.appendChild(b); });
  /* el nombre es el mismo de «Esta agenda es de» del inicio de la página */
  var nombre = document.getElementById('portada-nombre'), duena = document.getElementById('ag-duena');
  nombre.addEventListener('input', function () { if (duena) { duena.value = nombre.value; duena.dispatchEvent(new Event('input', { bubbles: true })); } N.datos()['ag-duena'] = nombre.value; pintar(); });
  if (duena) duena.addEventListener('input', function () { setTimeout(pintar, 0); });
  document.addEventListener('agenda-guardada', pintar);
  document.getElementById('portada-agenda').addEventListener('input', function (e) { if (e.target.id === 'ag-portada-frase') setTimeout(pintar, 0); });
  pintar();
})();
