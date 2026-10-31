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

  /* Ícono de línea de cada hoja junto a su título (31-oct-2026, «le falta vida»): sale del emoji con que empieza su enlace en el menú de hojas */
  function iconosDeHoja() {
    if (!window.lrIconos || !window.lrIconos.de) return;
    zona.querySelectorAll('.hoja-agenda').forEach(function (h) {
      var cab = h.querySelector(':scope > header'); if (!cab || cab.querySelector('.hoja-ic') || h.id === 'panel-agenda' || h.id === 'portada-agenda') return;
      var a = document.querySelector('#menu-hojas-lista a[data-hoja="' + h.id + '"]'); if (!a) return;
      var b = document.createElement('span'); b.className = 'hoja-ic'; b.setAttribute('aria-hidden', 'true'); b.appendChild(window.lrIconos.hoja ? window.lrIconos.hoja(h.id, a.textContent) : window.lrIconos.de(a.textContent));
      cab.insertBefore(b, cab.firstChild);
    });
  }
  iconosDeHoja(); setTimeout(iconosDeHoja, 800);
})();
