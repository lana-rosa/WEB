/* Agenda para tejedoras: «Patrones que diseñé» dentro de «Mi colección de patrones» (6-nov-2026, pedido de Jennifer).
   Los patrones que se crean en «Diseña tu patrón» ya se guardan solos con su nombre (cada uno es una ficha de esa hoja: formas.js, `datos._ver['disena-patron']`).
   Esta lista no copia nada: solo los muestra aquí (una sola fuente de datos, nada se duplica en las copias) y deja abrirlos o diseñar otro. */
(function () {
  'use strict';
  var hoja = document.getElementById('coleccion-patrones'), ancla = document.getElementById('patrones-auto'), V = window.lrVersiones;
  if (!hoja || !ancla || !V || !V.lista) return;
  var caja = document.createElement('section'); caja.className = 'pp-propios no-imprimir'; caja.id = 'patrones-propios'; caja.setAttribute('aria-labelledby', 'pp-titulo');
  caja.innerHTML = '<h4 class="sub-hoja" id="pp-titulo">✏️ Patrones que diseñé</h4><p class="dp-ayuda">Se guardan solos, con su nombre, desde «Diseña tu patrón». Toca uno para abrirlo.</p><ul class="pp-lista"></ul><p class="pp-vacio" hidden>Aún no has diseñado ninguno. Cuando escribas el nombre de tu primer patrón, aparecerá aquí.</p><button type="button" class="boton-secundario boton-chico pp-nuevo">➕ Diseñar un patrón</button>';
  ancla.parentNode.insertBefore(caja, ancla.nextSibling);
  var ul = caja.querySelector('.pp-lista'), vacio = caja.querySelector('.pp-vacio'), nuevo = caja.querySelector('.pp-nuevo');
  function pintar() {
    var fichas = V.lista('disena-patron').filter(function (f) { return Object.keys(V.valores('disena-patron', f.k)).length > 0; });
    ul.textContent = ''; vacio.hidden = fichas.length > 0; nuevo.textContent = fichas.length ? '➕ Diseñar otro patrón' : '➕ Diseñar mi primer patrón';
    fichas.forEach(function (f) {
      var li = document.createElement('li'), b = document.createElement('button'); b.type = 'button'; b.className = 'pp-item';
      var n = document.createElement('span'); n.className = 'pp-nombre'; n.textContent = f.nombre; b.appendChild(n);
      var m = document.createElement('span'); m.className = 'pp-meta'; f.chips.forEach(function (c) { var s = document.createElement('span'); s.className = 'ficha-chip' + (c[1] ? ' ' + c[1] : ''); s.textContent = c[0]; m.appendChild(s); }); b.appendChild(m);
      var a = document.createElement('span'); a.className = 'pp-abrir'; a.textContent = 'Abrir →'; b.appendChild(a);
      b.addEventListener('click', function () { V.abrir('disena-patron', f.k); });
      li.appendChild(b); ul.appendChild(li);
    });
  }
  nuevo.addEventListener('click', function () {
    var lista = V.lista('disena-patron'), vacia = lista.filter(function (f) { return !Object.keys(V.valores('disena-patron', f.k)).length; })[0];
    if (vacia) V.abrir('disena-patron', vacia.k); else { V.agregar('disena-patron'); if (window.lrIrAHoja) window.lrIrAHoja('disena-patron'); }
  });
  var t = null; function luego() { clearTimeout(t); t = setTimeout(pintar, 300); }
  document.addEventListener('version-cambiada', function (e) { if (e.detail && e.detail.hoja === 'disena-patron') luego(); });
  var dp = document.getElementById('disena-patron'); if (dp) { dp.addEventListener('input', luego); dp.addEventListener('change', luego); }
  new MutationObserver(function () { if (hoja.classList.contains('abierta')) pintar(); }).observe(hoja, { attributes: true, attributeFilter: ['class'] });
  pintar();
})();
