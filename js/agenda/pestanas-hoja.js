/* Agenda para tejedoras: hojas que se unieron en una sola entrada del menú, con pestañas adentro (10-nov-2026, 9 preguntas de Jennifer).
   Cada hoja sigue siendo la misma (mismos campos y datos, nada se mueve): solo se quita su entrada aparte del menú y arriba de cada una
   se pone una tira de pestañas para pasar de una a otra. Mi tablero va dentro de Mi panel; Proyectos por tejer, junto a la Ficha de proyecto.
   Para unir otro par de hojas basta agregar un grupo a GRUPOS (y quitar la entrada del menú y ponerla en EN_MENU de agenda-rosina.html). */
(function () {
  'use strict';
  var GRUPOS = [
    [['panel-agenda', '🏠 Mi panel'], ['tablero-agenda', '📈 Mi tablero']],
    [['ficha-proyecto', '📋 Ficha de proyecto'], ['proyectos-fila', '🧵 Proyectos por tejer']],
    [['coleccion-patrones', '📚 Mis patrones'], ['disena-patron', '✏️ Diseña tu patrón']],
    [['mis-clientas', '💕 Mis clientas'], ['contactos', '📇 Contactos (proveedoras, colegas…)']]
  ];
  GRUPOS.forEach(function (g) {
    g.forEach(function (h) {
      var art = document.getElementById(h[0]), cab = art && art.querySelector(':scope > header'); if (!art || !cab || art.querySelector(':scope > .sub-pestanas')) return;
      var nav = document.createElement('div'); nav.className = 'sub-pestanas no-imprimir'; nav.setAttribute('role', 'group'); nav.setAttribute('aria-label', 'Hojas de esta entrada');
      g.forEach(function (o) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'sub-pestana'; b.textContent = o[1]; b.dataset.hoja = o[0];
        if (o[0] === h[0]) b.setAttribute('aria-current', 'page'); else b.addEventListener('click', function () { if (window.lrIrAHoja) window.lrIrAHoja(o[0]); });
        nav.appendChild(b);
      });
      cab.parentNode.insertBefore(nav, cab.nextSibling);
    });
  });
})();
