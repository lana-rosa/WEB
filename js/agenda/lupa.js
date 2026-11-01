/* Agenda para tejedoras: el buscador queda en una lupa (1-nov-2026, pedido de Jennifer: «que se vea solo la lupa, al lado de la barra donde se ven las hojas de la sección»).
   La lupa va a la derecha de la lista «Hojas de…»; al tocarla se abre la barra de búsqueda de siempre (el mismo campo `#buscar-agenda`) y se cierra con Esc o al tocarla otra vez. */
(function () {
  'use strict';
  var cont = document.querySelector('.hojas-contenido'), sel = document.getElementById('selector-hoja'), buscar = document.querySelector('.buscar-agenda');
  if (!cont || !sel || !buscar) return;
  var fila = document.createElement('div'); fila.className = 'fila-hojas no-imprimir';
  cont.insertBefore(fila, sel); fila.appendChild(sel);
  var lupa = document.createElement('button'); lupa.type = 'button'; lupa.id = 'buscar-lupa'; lupa.className = 'boton-lupa';
  lupa.setAttribute('aria-label', 'Buscar en mi agenda'); lupa.setAttribute('aria-expanded', 'false'); lupa.setAttribute('aria-controls', 'caja-buscar');
  lupa.innerHTML = '<img src="/img/agenda/menu/btn-buscar.webp?v=1" width="30" height="30" alt="" aria-hidden="true">';
  fila.appendChild(lupa);
  var caja = document.createElement('div'); caja.id = 'caja-buscar'; caja.className = 'caja-buscar no-imprimir'; caja.hidden = true; caja.appendChild(buscar);
  cont.insertBefore(caja, fila.nextSibling);
  function abrir(on) {
    caja.hidden = !on; lupa.setAttribute('aria-expanded', String(on));
    if (on) { var i = document.getElementById('buscar-agenda'); if (i) i.focus(); }
  }
  lupa.addEventListener('click', function () { abrir(caja.hidden); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !caja.hidden) { abrir(false); lupa.focus(); } });
  window.lrLupa = { abrir: function () { abrir(true); }, cerrar: function () { abrir(false); } };
})();
