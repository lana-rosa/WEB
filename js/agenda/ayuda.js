/* Agenda para tejedoras: UN solo botón flotante de ayuda (etapa 5, ola 3; 30-oct-2026, decisión de Sara).
   Antes había tres círculos sobre las hojas (Rosina, WhatsApp y, en pantallas pequeñas, otro más). Ahora hay uno que abre un menú con
   «Preguntar a Rosina» (abre el chat de siempre), «Escribir por WhatsApp» y «Subir». Los otros botones flotantes se ocultan con CSS (agenda-panel.css). */
(function () {
  'use strict';
  if (!document.getElementById('agenda')) return;
  var ICONOS = {
    ayuda: 'M12 3a9 9 0 100 18 9 9 0 000-18zM9.500 9.500a2.500 2.500 0 114 2c-.8.6-1.500 1-1.500 2M12 17h.01',
    rosina: 'M4 5h16v11H9l-5 4zM8.500 10h.01M12 10h.01M15.500 10h.01',
    whatsapp: 'M5 19l1.200-4A8 8 0 1110 18.800zM9 9c0 3 3 6 6 6l1-2-2-1-1 .8c-1-.4-2-1.400-2.400-2.400L11 10l-1-2z',
    subir: 'M12 19V5m0 0l-6 6m6-6l6 6', cerrar: 'M6 6l12 12M18 6L6 18'
  };
  function svg(d) { return '<svg viewBox="0 0 24 24" class="ic-l" aria-hidden="true" focusable="false"><path d="' + d + '"/></svg>'; }
  var cont = document.createElement('div'); cont.className = 'ayuda-flotante no-imprimir'; cont.id = 'agenda-ayuda';
  cont.innerHTML = '<div class="af-menu" id="af-menu" hidden role="menu" aria-label="Ayuda">' +
    '<button type="button" role="menuitem" data-af="rosina">' + svg(ICONOS.rosina) + 'Preguntar a Rosina</button>' +
    '<a role="menuitem" data-af="whatsapp" href="https://wa.me/573205072801" target="_blank" rel="noopener">' + svg(ICONOS.whatsapp) + 'Escribir por WhatsApp</a>' +
    '<button type="button" role="menuitem" data-af="subir">' + svg(ICONOS.subir) + 'Subir</button></div>' +
    '<button type="button" class="af-boton" id="af-boton" aria-expanded="false" aria-controls="af-menu" aria-label="Ayuda: Rosina, WhatsApp y subir">' + svg(ICONOS.ayuda) + '</button>';
  document.body.appendChild(cont);
  var boton = document.getElementById('af-boton'), menu = document.getElementById('af-menu');
  function abrir(si) {
    menu.hidden = !si; boton.setAttribute('aria-expanded', String(si));
    boton.innerHTML = svg(si ? ICONOS.cerrar : ICONOS.ayuda);
    if (si) { var p = menu.querySelector('button, a'); if (p) p.focus(); }
  }
  boton.addEventListener('click', function () { abrir(menu.hidden); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) { abrir(false); boton.focus(); } });
  document.addEventListener('click', function (e) { if (!menu.hidden && e.composedPath().indexOf(cont) < 0) abrir(false); });
  menu.addEventListener('click', function (e) {
    var b = e.target.closest('[data-af]'); if (!b) return; var que = b.dataset.af;
    abrir(false);
    if (que === 'subir') { window.scrollTo({ top: 0, behavior: 'smooth' }); boton.focus(); }
    if (que === 'rosina') { var r = document.querySelector('.rc-boton'); if (r) r.click(); }
    if (que === 'whatsapp' && window.dataLayer) window.dataLayer.push({ event: 'clic_whatsapp', ubicacion: 'agenda_ayuda' });
  });
})();
