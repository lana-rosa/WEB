/* Agenda para tejedoras: «Materiales por comprar» de Mi semana tejiendo → Lista de compras (pregunta 8 de Jennifer, 11-nov-2026).
   La casilla de la semana (`ag-comprar`) no se toca ni se borra: se agrega el botón «Pasar a mi lista de compras», que lleva cada renglón (o cada cosa separada por coma)
   a un renglón nuevo de la Lista de compras (columna «Material»), sin repetir lo que ya está en la lista. */
(function () {
  'use strict';
  var N = window.lrAgendaNucleo, ta = document.getElementById('ag-comprar'), TC = 'tabla-compras';
  if (!N || !ta || !N.tablas[TC]) return;
  var C = N.tablas[TC];
  function limpiar(t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim(); }
  function campo(k, c) { return document.getElementById(C.prefijo + k + '-' + c); }
  function pasar() {
    var items = ta.value.split(/\n|,|;/).map(function (x) { return x.replace(/^[-•*\s]+/, '').trim(); }).filter(Boolean), ya = {}, k, nuevos = 0, repetidos = 0;
    for (k = 1; k <= C.n; k++) { var m = campo(k, 'material'); if (m && m.value.trim()) ya[limpiar(m.value)] = 1; }
    items.forEach(function (it) {
      var clave = limpiar(it); if (ya[clave]) { repetidos++; return; }
      var fila = 0; for (k = 1; k <= C.n; k++) { var m2 = campo(k, 'material'); if (m2 && !m2.value.trim() && !(campo(k, 'color') && campo(k, 'color').value.trim()) && !(campo(k, 'cantidad') && campo(k, 'cantidad').value.trim())) { fila = k; break; } }
      if (!fila) { if (!N.agregarRenglon(TC)) return; fila = C.n; }
      var e = campo(fila, 'material'); e.value = it; N.datos()[e.id] = it; ya[clave] = 1; nuevos++;
    });
    if (nuevos) { N.guardar(); if (window.lrFichas && window.lrFichas.refrescar) window.lrFichas.refrescar(); }
    return { nuevos: nuevos, repetidos: repetidos, total: items.length };
  }
  var cont = document.createElement('p'); cont.className = 'compras-semana no-imprimir';
  var b = document.createElement('button'); b.type = 'button'; b.className = 'boton-secundario boton-chico'; b.textContent = '🛍️ Pasar a mi lista de compras';
  var msg = document.createElement('span'); msg.className = 'aviso-cal'; msg.setAttribute('role', 'status');
  cont.appendChild(b); cont.appendChild(msg); ta.parentNode.parentNode.insertBefore(cont, ta.parentNode.nextSibling);
  b.addEventListener('click', function () {
    var r = pasar();
    msg.textContent = !r.total ? 'Escribe primero los materiales por comprar.' : r.nuevos ? '✔ Pasé ' + r.nuevos + (r.nuevos === 1 ? ' material' : ' materiales') + ' a tu lista de compras' + (r.repetidos ? ' (los repetidos no se agregaron).' : '.') : 'Todo eso ya está en tu lista de compras.';
    setTimeout(function () { msg.textContent = ''; }, 7000);
  });
})();
