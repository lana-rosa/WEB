/* Agenda para tejedoras: las tiras «Herramienta de Rosina» van al final de la hoja (1-nov-2026, pedido de Jennifer: «déjalo en la parte de abajo y no al inicio»).
   Las de cada hoja pasan al final de su artículo; las de «Diseña tu patrón» (por paso) al final de su paso. Solo mueve el elemento: los enlaces y estilos no cambian. */
(function () {
  'use strict';
  document.querySelectorAll('.hoja-agenda .herr-rosina').forEach(function (t) {
    var paso = t.closest('.dp-paso'), hoja = t.closest('.hoja-agenda');
    var destino = paso || hoja; if (!destino || t.parentNode === destino && !t.nextElementSibling) return;
    t.classList.add('herr-abajo'); destino.appendChild(t);
  });
  /* 6-nov-2026 (pedido de Jennifer: «se sienten sobrecargadas»): cada tira queda CERRADA en una sola línea («🧰 Herramientas de Rosina») y se abre con un toque.
     Los enlaces son los mismos. */
  document.querySelectorAll('.hoja-agenda .herr-rosina').forEach(function (t) {
    if (t.closest('.herr-plegable')) return;
    var ti = t.querySelector('.hr-t'), det = document.createElement('details'), sum = document.createElement('summary');
    det.className = 'herr-plegable no-imprimir' + (t.classList.contains('herr-abajo') ? ' herr-abajo' : ''); t.classList.remove('herr-abajo');
    sum.textContent = ti ? ti.textContent : '🧰 Herramientas de Rosina'; if (ti) ti.hidden = true;
    t.parentNode.insertBefore(det, t); det.appendChild(sum); det.appendChild(t);
  });
  /* y lo mismo con «comprar los materiales» (bloques de la Mercería al final de las hojas): una línea que se abre */
  document.querySelectorAll('.hoja-agenda .elegir-tienda.oferta-merceria').forEach(function (b) {
    if (b.closest('.tienda-plegable')) return;
    var lab = b.querySelector(':scope > label'), det = document.createElement('details'), sum = document.createElement('summary');
    det.className = 'tienda-plegable no-imprimir'; sum.textContent = '🛍️ ' + (lab ? lab.textContent : 'Comprar materiales en la Mercería'); if (lab) lab.hidden = true;
    b.parentNode.insertBefore(det, b); det.appendChild(sum); det.appendChild(b);
  });
})();
