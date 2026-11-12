/* Agenda para tejedoras: pestaña «Patrones que diseñé» y «Dar por terminado» (12-nov-2026, pedido de Jennifer; antes la lista iba dentro de «Mi colección de patrones», 6-nov-2026).
   Cada patrón de «Diseña tu patrón» es una ficha de esa hoja (formas.js, `datos._ver['disena-patron']`). En el último paso hay una casilla «Dar por terminado» (campo `ag-dp-terminado`, dentro de la ficha).
   · Un patrón terminado sale de la pila de «Diseña tu patrón» (formas.js lo oculta salvo que sea el que está abierto) y aparece en la pestaña «Patrones que diseñé» (hoja `patrones-disenados`), con «Abrir →».
   · Al dar por terminado el patrón abierto, se pasa al siguiente que esté sin terminar (o a uno nuevo) y sale un aviso con «Verlo».
   · Un patrón terminado que se abre muestra «Seguir editando», que quita la marca y lo devuelve a «Diseña tu patrón».
   Esta lista no copia nada: solo muestra fichas que ya existen (una sola fuente de datos, nada se duplica en las copias). Nada se borra. */
(function () {
  'use strict';
  var HOJA = 'disena-patron', CK = 'ag-dp-terminado';
  var hoja = document.getElementById('patrones-disenados'), dp = document.getElementById(HOJA), V = window.lrVersiones;
  if (!hoja || !dp || !V || !V.lista) return;
  function T(t) { return window.lrI18n && window.lrI18n.t ? window.lrI18n.t(t) : t; }
  function el(tag, cls, t) { var e = document.createElement(tag); if (cls) e.className = cls; if (t != null) e.textContent = t; return e; }
  function terminado(k) { return !!V.valores(HOJA, k)[CK]; }
  function conDatos(k) { return Object.keys(V.valores(HOJA, k)).length > 0; }

  /* ---- la pestaña «Patrones que diseñé» ---- */
  var caja = el('section', 'pp-propios no-imprimir'); caja.id = 'patrones-propios'; caja.setAttribute('aria-label', 'Patrones que diseñé');
  caja.innerHTML = '<p class="dp-ayuda">Aquí quedan los patrones que das por terminados en «Diseña tu patrón». Toca uno para abrirlo.</p><ul class="pp-lista"></ul><p class="pp-vacio" hidden>Aún no has dado por terminado ningún patrón. Cuando termines uno en «Diseña tu patrón», marca «Dar por terminado» en el último paso y aparece aquí.</p><button type="button" class="boton-secundario boton-chico pp-nuevo">➕ Diseñar un patrón nuevo</button>';
  var pasos = hoja.querySelector(':scope > .hojas-pasos'); if (pasos) hoja.insertBefore(caja, pasos); else hoja.appendChild(caja);   // la lista va antes de «Hoja anterior / Siguiente hoja»
  var ul = caja.querySelector('.pp-lista'), vacio = caja.querySelector('.pp-vacio'), nuevo = caja.querySelector('.pp-nuevo');
  function pintar() {
    var fichas = V.lista(HOJA).filter(function (f) { return terminado(f.k); });
    ul.textContent = ''; vacio.hidden = fichas.length > 0;
    fichas.forEach(function (f) {
      var li = el('li'), b = el('button', 'pp-item'); b.type = 'button';
      var n = el('span', 'pp-nombre', f.nombre); n.setAttribute('data-no-traducir', ''); b.appendChild(n);
      var m = el('span', 'pp-meta'); f.chips.forEach(function (c) { if (/Terminado/.test(c[0])) return; m.appendChild(el('span', 'ficha-chip' + (c[1] ? ' ' + c[1] : ''), c[0])); }); b.appendChild(m);
      b.appendChild(el('span', 'pp-abrir', 'Abrir →'));
      b.addEventListener('click', function () { V.abrir(HOJA, f.k); });
      li.appendChild(b); ul.appendChild(li);
    });
  }
  nuevo.addEventListener('click', function () {
    var lista = V.lista(HOJA), vacia = lista.filter(function (f) { return !conDatos(f.k); })[0];
    if (vacia) V.abrir(HOJA, vacia.k); else { V.agregar(HOJA); if (window.lrIrAHoja) window.lrIrAHoja(HOJA); }
  });

  /* ---- el aviso dentro de «Diseña tu patrón» ---- */
  var aviso = el('div', 'pt-aviso no-imprimir'); aviso.id = 'pt-aviso'; aviso.setAttribute('role', 'status'); aviso.hidden = true;
  var pila = dp.querySelector('.vers-lista'); if (pila) pila.parentNode.insertBefore(aviso, pila); else dp.appendChild(aviso);
  var pasoAviso = null, tAviso = 0;
  function cb() { return document.getElementById(CK); }
  function pintarAviso() {
    aviso.textContent = ''; aviso.className = 'pt-aviso no-imprimir';
    if (pasoAviso) {
      aviso.classList.add('ok'); var s = el('span', '', '✔ «' + pasoAviso + '» ya está en «Patrones que diseñé».'); s.setAttribute('data-no-traducir', ''); aviso.appendChild(s);
      var b = el('button', 'boton-secundario boton-chico', 'Verlo'); b.type = 'button'; b.addEventListener('click', function () { pasoAviso = null; clearTimeout(tAviso); if (window.lrIrAHoja) window.lrIrAHoja('patrones-disenados'); }); aviso.appendChild(b);
      aviso.hidden = false; return;
    }
    var k = V.actual(HOJA);
    if (cb() && cb().checked && k) {
      aviso.appendChild(el('span', '', '✅ Este patrón está terminado y está en «Patrones que diseñé».'));
      var q = el('button', 'boton-secundario boton-chico', 'Seguir editando'); q.type = 'button';
      q.addEventListener('click', function () { var c = cb(); if (!c) return; c.checked = false; c.dispatchEvent(new Event('input', { bubbles: true })); c.dispatchEvent(new Event('change', { bubbles: true })); });
      aviso.appendChild(q); aviso.hidden = false; return;
    }
    aviso.hidden = true;
  }
  function terminar() {
    var k = V.actual(HOJA), nombre = (V.lista(HOJA).filter(function (f) { return f.k === k; })[0] || {}).nombre || 'Patrón';
    var otros = V.lista(HOJA).filter(function (f) { return f.k !== k && !terminado(f.k); });
    if (otros.length) V.abrir(HOJA, otros[0].k); else { V.agregar(HOJA); if (window.lrIrAHoja) window.lrIrAHoja(HOJA); }
    var primero = dp.querySelector('.dp-paso-btn'); if (primero) primero.click();   // el patrón al que se pasa empieza en el paso 1
    pasoAviso = nombre; clearTimeout(tAviso); tAviso = setTimeout(function () { pasoAviso = null; pintarAviso(); }, 12000);
    pintar(); pintarAviso();
  }
  dp.addEventListener('change', function (e) {
    if (e.target.id !== CK) return;
    if (e.target.checked) setTimeout(terminar, 0); else { pasoAviso = null; setTimeout(function () { pintar(); pintarAviso(); }, 0); }
  });

  var t = null; function luego() { clearTimeout(t); t = setTimeout(function () { pintar(); if (!pasoAviso) pintarAviso(); }, 300); }
  document.addEventListener('version-cambiada', function (e) { if (e.detail && e.detail.hoja === HOJA) luego(); });
  dp.addEventListener('input', luego);
  new MutationObserver(function () { if (hoja.classList.contains('abierta')) pintar(); }).observe(hoja, { attributes: true, attributeFilter: ['class'] });
  pintar(); pintarAviso();
  window.lrPatronesTerminados = { pintar: function () { pintar(); pintarAviso(); } };
})();
