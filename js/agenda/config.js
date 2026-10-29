/* Agenda para tejedoras: Configuración (29-oct-2026, pedido de Sara: «toda la información del inicio en un apartado de configuración, con un engranaje»).
   El botón ⚙️ abre/cierra el panel `#agenda-config`, que guarda lo que antes se veía arriba: nombre de la dueña, imprimir y borrar, copias, Google Calendar y el color.
   Color: 7 verdes (el menta es el de siempre); se guarda en este dispositivo (`localStorage.lrAgendaTema`) y se pone en `html[data-tema]` (los colores están en css/agenda-fichas.css).
   `window.lrAgendaConfig.abrir()` lo usan otros módulos (por ejemplo, la vuelta de Google Calendar) para mostrar el panel. */
(function () {
  'use strict';
  var btn = document.getElementById('agenda-config-btn'), panel = document.getElementById('agenda-config');
  if (!btn || !panel) return;
  function poner(abierto) { panel.hidden = !abierto; btn.setAttribute('aria-expanded', abierto ? 'true' : 'false'); }
  btn.addEventListener('click', function () { poner(panel.hidden); });
  window.lrAgendaConfig = { abrir: function () { poner(true); }, cerrar: function () { poner(false); } };
  var TEMAS = [['menta', 'Verde menta', '#12A66E'], ['esmeralda', 'Verde esmeralda', '#059669'], ['bosque', 'Verde bosque', '#3F8F54'], ['oliva', 'Verde oliva', '#8A9A3C'], ['pistacho', 'Verde pistacho', '#65A30D'], ['salvia', 'Verde salvia', '#7C9A88'], ['azulado', 'Verde azulado', '#14B8A6']];
  var caja = document.getElementById('ac-opciones'), actual = 'menta';
  try { actual = localStorage.getItem('lrAgendaTema') || 'menta'; } catch (e) {}
  if (!TEMAS.some(function (t) { return t[0] === actual; })) actual = 'menta';
  function aplicar(id) {
    actual = id; if (id === 'menta') document.documentElement.removeAttribute('data-tema'); else document.documentElement.setAttribute('data-tema', id);
    try { localStorage.setItem('lrAgendaTema', id); } catch (e) {}
    Array.prototype.forEach.call(caja.children, function (b) { b.setAttribute('aria-pressed', b.dataset.t === id ? 'true' : 'false'); });
  }
  TEMAS.forEach(function (t) {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'ac-op'; b.dataset.t = t[0]; b.setAttribute('aria-pressed', 'false');
    var i = document.createElement('i'); i.style.setProperty('--sw', t[2]); i.setAttribute('aria-hidden', 'true'); b.appendChild(i); b.appendChild(document.createTextNode(t[1]));
    b.addEventListener('click', function () { aplicar(t[0]); }); caja.appendChild(b);
  });
  aplicar(actual);
})();
