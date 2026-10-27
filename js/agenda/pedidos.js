/* Agenda para tejedoras: control de pedidos con cuentas (27-oct-2026).
   Calcula solo el valor total (cantidad × valor unidad), el total de la compra (con el envío) y el saldo pendiente, y resume lo que se debe.
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

  /* Cantidad × valor unidad → valor total; valor total + envío → total compra; total compra − abonado → saldo */
  function calcular(r) {
    var cambio = false, cant = num(campo(r, 'cantidad').value), vu = num(campo(r, 'valorunidad').value);
    if (cant !== null && vu !== null) cambio = poner(campo(r, 'precio'), pesos(cant * vu)) || cambio;
    var tot = num(campo(r, 'precio').value);
    if (tot !== null) cambio = poner(campo(r, 'totalcompra'), pesos(tot + (num(campo(r, 'costoenvio').value) || 0))) || cambio;
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
    if (/-(cantidad|valorunidad|precio|costoenvio|abono)$/.test(e.target.id) && calcular(r)) { N.guardar(); if (window.lrFichas) window.lrFichas.refrescar(); }
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
