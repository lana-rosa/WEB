/* Agenda para tejedoras: las tiras «Herramienta de Rosina» van al final de la hoja (1-nov-2026, pedido de Jennifer: «déjalo en la parte de abajo y no al inicio»).
   Las de cada hoja pasan al final de su artículo; las de «Diseña tu patrón» (por paso) al final de su paso. Solo mueve el elemento: los enlaces y estilos no cambian. */
(function () {
  'use strict';
  document.querySelectorAll('.hoja-agenda .herr-rosina').forEach(function (t) {
    var paso = t.closest('.dp-paso'), hoja = t.closest('.hoja-agenda');
    var destino = paso || hoja; if (!destino || t.parentNode === destino && !t.nextElementSibling) return;
    t.classList.add('herr-abajo'); destino.appendChild(t);
  });
})();
