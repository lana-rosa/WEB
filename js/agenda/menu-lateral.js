/* Agenda para tejedoras: menú lateral que se esconde (31-oct-2026, pedido de Sara).
   - Computador (más de 1100 px): el menú sale abierto; el botón «Ocultar menú» lo esconde del todo y el contenido ocupa todo el ancho
     (queda un botón «Menú» pegado al borde izquierdo para volver a mostrarlo).
   - Tableta (821 a 1100 px): el menú sale como una barra angosta con solo los íconos; «Ampliar menú» la abre con los nombres.
   - Celular (hasta 820 px): sigue la barra de abajo de siempre; este módulo no hace nada.
   Se recuerda la elección en localStorage.lrAgendaMenu = 'abierto' | 'cerrado' (sin elección: depende del ancho). */
(function () {
  'use strict';
  var layout = document.querySelector('.agenda-layout'), nav = document.getElementById('pestanas-agenda');
  if (!layout || !nav) return;
  var CLAVE = 'lrAgendaMenu';
  function leer() { try { var v = localStorage.getItem(CLAVE); return v === 'abierto' || v === 'cerrado' ? v : ''; } catch (e) { return ''; } }
  function guardar(v) { try { localStorage.setItem(CLAVE, v); } catch (e) { /* sin almacenamiento: vale solo en esta visita */ } }
  var eleccion = leer();
  function estado() {
    var w = window.innerWidth, ancho = w > 1100;
    if (eleccion === 'cerrado') return ancho ? 'oculto' : 'riel';
    if (eleccion === 'abierto') return 'abierto';
    return ancho ? 'abierto' : 'riel';
  }
  var SVG = function (d) { return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + d + '</svg>'; };
  var IC_OCULTAR = SVG('<path d="M15 6l-6 6 6 6"/>'), IC_MOSTRAR = SVG('<path d="M9 6l6 6-6 6"/>'), IC_MENU = SVG('<path d="M4 7h16M4 12h16M4 17h16"/>');
  var toggle = null, abrir = null;
  function crear() {
    if (!toggle || !nav.contains(toggle)) {
      toggle = document.createElement('button'); toggle.type = 'button'; toggle.className = 'menu-toggle no-imprimir'; toggle.id = 'menu-toggle';
      toggle.addEventListener('click', function () {
        var e = estado(), ancho = window.innerWidth > 1100;
        if (e === 'abierto') eleccion = 'cerrado'; else eleccion = 'abierto';
        if (!ancho && e === 'abierto') eleccion = 'cerrado';
        guardar(eleccion); aplicar();
      });
      nav.appendChild(toggle);
    }
    if (!abrir || !document.body.contains(abrir)) {
      abrir = document.createElement('button'); abrir.type = 'button'; abrir.className = 'menu-abrir no-imprimir'; abrir.id = 'menu-abrir';
      abrir.innerHTML = IC_MENU + '<span>Menú</span>'; abrir.setAttribute('aria-label', 'Mostrar menú'); abrir.title = 'Mostrar menú';
      abrir.addEventListener('click', function () { eleccion = 'abierto'; guardar(eleccion); aplicar(); });
      layout.appendChild(abrir);
    }
  }
  function aplicar() {
    crear();
    var e = estado(); layout.setAttribute('data-menu', e);
    var t = e === 'abierto' ? 'Ocultar menú' : e === 'riel' ? 'Ampliar menú' : '';
    toggle.innerHTML = (e === 'abierto' ? IC_OCULTAR : IC_MOSTRAR) + '<span class="mt-texto">' + (e === 'abierto' ? 'Ocultar menú' : 'Ampliar menú') + '</span>';
    toggle.setAttribute('aria-label', t || 'Mostrar menú'); toggle.title = t || 'Mostrar menú'; toggle.setAttribute('aria-expanded', e === 'abierto' ? 'true' : 'false');
    abrir.hidden = e !== 'oculto';
    // En la barra angosta los nombres se esconden: cada botón conserva su nombre para lectores de pantalla y como globo al pasar el mouse
    nav.querySelectorAll('.pestana').forEach(function (b) { var l = b.querySelector('.p-largo'); if (l && l.textContent.trim()) { b.setAttribute('aria-label', l.textContent.trim()); b.title = l.textContent.trim(); } });
    if (window.lrI18n && window.lrI18n.lang !== 'es') { /* el traductor revisa los cambios del DOM solo */ }
  }
  // Los botones de las pestañas los arma el script de la página: se vuelve a poner el botón si la lista se rehace
  new MutationObserver(function () { if (!toggle || !nav.contains(toggle) || nav.querySelector('.pestana:not([aria-label])')) aplicar(); }).observe(nav, { childList: true });
  window.addEventListener('resize', aplicar);
  aplicar();
  window.lrMenuLateral = { estado: estado, abrir: function () { eleccion = 'abierto'; guardar(eleccion); aplicar(); }, ocultar: function () { eleccion = 'cerrado'; guardar(eleccion); aplicar(); } };
})();
