/* Agenda para tejedoras: «Mi año tejiendo» (27-oct-2026).
   En la vista del año cada mes muestra lo último que se escribió; al tocar un mes se abre a página entera para escribir con comodidad. */
(function () {
  'use strict';
  var hoja = document.getElementById('anio-tejiendo'), meses = hoja && hoja.querySelector('.meses');
  if (!meses) return;
  var tarjetas = Array.prototype.slice.call(meses.querySelectorAll('.mes'));
  var volver = document.createElement('button');
  volver.type = 'button'; volver.className = 'mes-volver boton-secundario boton-chico no-imprimir'; volver.textContent = '← Volver al año'; volver.hidden = true;
  meses.parentNode.insertBefore(volver, meses);

  function vista(t) {
    var lineas = String(t || '').split('\n').map(function (x) { return x.trim(); }).filter(Boolean);
    return lineas.slice(-3).join('\n');
  }
  tarjetas.forEach(function (c) {
    var ta = c.querySelector('textarea'), nombre = c.querySelector('strong').textContent;
    c.setAttribute('role', 'button'); c.tabIndex = 0; c.setAttribute('aria-label', 'Abrir ' + nombre + ' a página entera');
    var v = document.createElement('div'); v.className = 'mes-vista'; v.setAttribute('aria-hidden', 'true'); c.insertBefore(v, ta);
    c._vista = v; c._ta = ta;
  });
  function pintar() {
    tarjetas.forEach(function (c) { var t = vista(c._ta.value); c._vista.textContent = t || 'Toca para escribir…'; c._vista.classList.toggle('vacio', !t); });
  }
  function abrir(c) {
    meses.classList.add('con-abierto'); c.classList.add('abierto'); c.removeAttribute('role'); c.removeAttribute('tabindex'); volver.hidden = false;
    c._ta.focus(); c.scrollIntoView({ block: 'nearest' });
  }
  function cerrar() {
    var c = meses.querySelector('.mes.abierto'); meses.classList.remove('con-abierto'); volver.hidden = true;
    if (c) { c.classList.remove('abierto'); c.setAttribute('role', 'button'); c.tabIndex = 0; c.focus({ preventScroll: true }); }
    pintar();
  }
  meses.addEventListener('click', function (e) { var c = e.target.closest('.mes'); if (c && !c.classList.contains('abierto')) abrir(c); });
  meses.addEventListener('keydown', function (e) { var c = e.target.closest('.mes'); if (c && !c.classList.contains('abierto') && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); abrir(c); } });
  volver.addEventListener('click', cerrar);
  hoja.addEventListener('input', function (e) { if (e.target.closest('.mes')) pintar(); });
  document.addEventListener('agenda-guardada', pintar);
  var sel = document.getElementById('ag-anio-sel'); if (sel) sel.addEventListener('change', function () { cerrar(); setTimeout(pintar, 50); });
  pintar();
})();
