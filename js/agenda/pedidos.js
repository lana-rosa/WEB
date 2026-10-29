/* Agenda para tejedoras: control de pedidos con cuentas (27-oct-2026).
   Calcula solo el total de la compra (cantidad × valor unidad + envío) y el saldo pendiente, y resume lo que se debe. Desde el 29-oct-2026 «Valor total» no se ve (era lo mismo que «Total compra»):
   queda oculto en `ag-pN-precio` con el valor de los productos sin envío, para no perder lo ya guardado ni lo que leen el calendario, el tablero y las deudas.
   También pone el enlace de WhatsApp debajo de cada teléfono (pedidos, clientas y contactos). */
(function () {
  'use strict';
  var N = window.lrAgendaNucleo;
  if (!N || !N.tablas['tabla-pedidos']) return;
  var TABLA = 'tabla-pedidos', T = N.tablas[TABLA];
  function campo(r, c) { return document.getElementById(T.prefijo + r + '-' + c); }
  function num(t) { var n = parseInt(String(t || '').replace(/[^0-9-]/g, ''), 10); return isFinite(n) ? n : null; }
  function pesos(n) { return '$' + Math.round(n).toLocaleString('es-CO'); }
  function poner(e, v) { if (!e || e.value === v) return false; e.value = v; N.datos()[e.id] = v; return true; }

  /* Cantidad × valor unidad (+ envío) → total compra; total compra − abonado → saldo. Si la persona escribe el total a mano, el valor de los productos es ese total menos el envío */
  function calcular(r, origen) {
    var cambio = false, envio = num(campo(r, 'costoenvio').value) || 0;
    if (origen === 'totalcompra') {
      var tc = num(campo(r, 'totalcompra').value);
      if (tc !== null) cambio = poner(campo(r, 'precio'), pesos(tc - envio)) || cambio;
    } else {
      var cant = num(campo(r, 'cantidad').value), vu = num(campo(r, 'valorunidad').value);
      if (origen === 'productos' && cant !== null && vu !== null) cambio = poner(campo(r, 'precio'), pesos(cant * vu)) || cambio;   // solo al cambiar cantidad o valor unidad (si no, se pisaría un total escrito a mano)
      var sub = num(campo(r, 'precio').value);
      if (sub !== null) cambio = poner(campo(r, 'totalcompra'), pesos(sub + envio)) || cambio;
    }
    var compra = num(campo(r, 'totalcompra').value);
    if (compra !== null) cambio = poner(campo(r, 'saldo'), pesos(compra - (num(campo(r, 'abono').value) || 0))) || cambio;
    return cambio;
  }
  function resumen() {
    var hoja = document.getElementById('control-pedidos'), p = hoja.querySelector('.resumen-pedidos');
    if (!p) { p = document.createElement('p'); p.className = 'resumen-pedidos aviso-auto no-imprimir'; var a = hoja.querySelector('.aviso-alarma'); (a || hoja.querySelector('header')).insertAdjacentElement('afterend', p); }
    var deuda = 0, n = 0, vendido = 0;
    for (var r = 1; r <= T.n; r++) {
      var est = campo(r, 'estado').value; if (est === 'Cancelado') continue;
      var tot = num(campo(r, 'totalcompra').value); if (tot === null) continue;
      vendido += tot; var sal = num(campo(r, 'saldo').value) || 0; if (sal > 0) { deuda += sal; n++; }
    }
    p.hidden = !vendido;
    p.textContent = vendido ? '💰 Pedidos: ' + pesos(vendido) + ' en total · Por cobrar: ' + pesos(deuda) + (n ? ' (' + n + (n === 1 ? ' pedido con saldo' : ' pedidos con saldo') + ')' : ' — ¡todo está pago!') : '';
  }
  document.getElementById('control-pedidos').addEventListener('input', function (e) {
    var tr = e.target.closest && e.target.closest('tr.ficha'); if (!tr) return;
    var r = +tr.dataset.fila;
    if (/-(cantidad|valorunidad|totalcompra|costoenvio|abono)$/.test(e.target.id) && calcular(r, /-totalcompra$/.test(e.target.id) ? 'totalcompra' : /-(cantidad|valorunidad)$/.test(e.target.id) ? 'productos' : '')) { N.guardar(); if (window.lrFichas) window.lrFichas.refrescar(); }
    resumen();
  });
  document.addEventListener('agenda-guardada', resumen);
  resumen();

  /* WhatsApp bajo los teléfonos */
  function digitos(t) { return String(t || '').replace(/\D/g, ''); }
  function enlace(ta) {
    var a = ta.parentNode.querySelector('.wa-link'); if (!a) return;
    var d = digitos(ta.value);
    if (d.length >= 10) { if (d.length === 10) d = '57' + d; a.href = 'https://wa.me/' + d; a.hidden = false; } else { a.hidden = true; a.removeAttribute('href'); }
  }
  function todos() { document.querySelectorAll('#agenda .wa-link').forEach(function (a) { var ta = a.parentNode.querySelector('textarea'); if (ta) enlace(ta); }); }
  document.getElementById('agenda').addEventListener('input', function (e) { if (e.target.matches && e.target.matches('textarea') && e.target.parentNode.querySelector('.wa-link')) enlace(e.target); });
  document.addEventListener('agenda-guardada', todos);
  todos();
})();
