/* Agenda para tejedoras: un color de acento por sección (30-oct-2026, pedido de Sara: «se ve muy aburrida», opción 1).
   Marca en #agenda cuál sección está activa (data-sec = posición de la pestaña elegida); los colores salen de css/agenda-colores.css.
   No guarda nada ni cambia ninguna hoja: solo pone una marca para que el CSS elija el color. */
(function () {
  'use strict';
  var zona = document.getElementById('agenda'), menu = document.getElementById('pestanas-agenda');
  if (!zona || !menu) return;
  function marcar() {
    var bs = menu.querySelectorAll('.pestana'), n = 0;
    for (var i = 0; i < bs.length; i++) if (bs[i].getAttribute('aria-selected') === 'true') { n = i; break; }
    if (zona.dataset.sec !== String(n)) zona.dataset.sec = String(n);
  }
  new MutationObserver(marcar).observe(menu, { attributes: true, attributeFilter: ['aria-selected'], subtree: true, childList: true });
  marcar();
})();
