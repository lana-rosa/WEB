/* Agenda para tejedoras: color de la letra y resaltar junto a la casilla (1-nov-2026, pedido de Jennifer).
   Antes era una barra desplegable arriba de las hojas; como en un editor, ahora aparece «🎨 Color» pegado a la casilla donde se escribe y abre
   una ventanita con los colores. Los botones de color y lo que se guarda (`datos._estilos`) son los de siempre; esta pieza solo los acerca a la casilla. */
(function () {
  'use strict';
  var zona = document.getElementById('agenda'), barra = document.getElementById('barra-agenda');
  if (!zona || !barra) return;
  var chip = document.createElement('button'); chip.type = 'button'; chip.className = 'color-chip no-imprimir'; chip.textContent = '🎨 Color';
  chip.setAttribute('aria-label', 'Color de la letra y resaltar'); chip.setAttribute('aria-expanded', 'false'); chip.hidden = true;
  document.body.appendChild(chip); document.body.appendChild(barra); barra.classList.add('flotante');
  var campo = null;
  function abierta() { return barra.classList.contains('abierta'); }
  function cerrar() { barra.classList.remove('abierta'); chip.setAttribute('aria-expanded', 'false'); }
  function ubicar() {
    if (!campo || !document.body.contains(campo) || campo.offsetParent === null || (campo !== document.activeElement && !abierta())) { if (!abierta()) chip.hidden = true; if (!campo || campo.offsetParent === null) cerrar(); return; }
    var r = campo.getBoundingClientRect(); if (r.bottom < 60 || r.top > innerHeight - 40) { chip.hidden = true; cerrar(); return; }
    chip.hidden = false; var w = chip.offsetWidth || 84, top = r.top - 34 > 70 ? r.top - 34 : r.bottom + 4, left = r.right - w;
    var dictar = document.querySelector('.voz-chip:not([hidden])'); if (dictar) left = dictar.getBoundingClientRect().left - w - 8;
    left = Math.max(8, Math.min(innerWidth - w - 8, left)); chip.style.top = Math.round(top) + 'px'; chip.style.left = Math.round(left) + 'px';
    if (abierta()) {
      var bw = barra.offsetWidth || 300, bh = barra.offsetHeight || 120, bt = top + 36, bl = Math.max(8, Math.min(innerWidth - bw - 8, left + w - bw));
      if (bt + bh > innerHeight - 8) bt = Math.max(8, top - bh - 6);
      barra.style.top = Math.round(bt) + 'px'; barra.style.left = Math.round(bl) + 'px';
    }
  }
  zona.addEventListener('focusin', function (e) {
    var el = e.target;
    if (el.matches && el.matches('[data-guardar]') && el.type !== 'checkbox' && !el.readOnly && !el.disabled) { campo = el; setTimeout(ubicar, 0); }
  });
  zona.addEventListener('focusout', function () { setTimeout(ubicar, 250); });
  chip.addEventListener('mousedown', function (e) { e.preventDefault(); });
  chip.addEventListener('click', function () { var ab = barra.classList.toggle('abierta'); chip.setAttribute('aria-expanded', String(ab)); ubicar(); });
  document.addEventListener('mousedown', function (e) { if (abierta() && !barra.contains(e.target) && e.target !== chip) cerrar(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && abierta()) { cerrar(); if (campo) campo.focus({ preventScroll: true }); } });
  window.addEventListener('scroll', function () { requestAnimationFrame(ubicar); }, true); window.addEventListener('resize', ubicar);
  window.lrColorCasilla = { ubicar: ubicar, cerrar: cerrar };
})();
