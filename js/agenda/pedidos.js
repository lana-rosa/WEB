/* Agenda para tejedoras: control de pedidos con cuentas (27-oct-2026).
   Calcula solo el total de la compra (cantidad × valor unidad + envío) y el saldo pendiente, y resume lo que se debe. Desde el 29-oct-2026 «Valor total» no se ve (era lo mismo que «Total compra»):
   queda oculto en `ag-pN-precio` con el valor de los productos sin envío, para no perder lo ya guardado ni lo que leen el calendario, el tablero y las deudas.
   También pone el enlace de WhatsApp debajo de cada teléfono (pedidos, clientas y contactos).
   Clienta automática (29-oct-2026, pedido de Sara): al terminar de escribir el nombre (o el teléfono) de un pedido, la clienta queda registrada en la hoja de clientas
   (nombre, WhatsApp y «clienta desde» de hoy); si ya está (mismo nombre o mismo teléfono) no se repite y, si le faltaba el WhatsApp, se lo completa. */
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
  /* Clienta automática: lo que se escribe en un pedido deja a la clienta en la hoja de clientas */
  var CL = 'tabla-clientas', COLS_CL = ['nombre', 'whatsapp', 'cumpleanos', 'desde', 'compras', 'notas'];
  function limpiar(t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim(); }
  function ultimos10(t) { var d = String(t || '').replace(/\D/g, ''); return d.length >= 10 ? d.slice(-10) : ''; }
  function deClienta(k, c) { var C = N.tablas[CL]; return document.getElementById(C.prefijo + k + '-' + c); }
  function hoy() { var h = new Date(); return ('0' + h.getDate()).slice(-2) + '/' + ('0' + (h.getMonth() + 1)).slice(-2) + '/' + h.getFullYear(); }
  function poner2(e, v) { if (!e) return; e.value = v; N.datos()[e.id] = v; }
  function registrarClienta(r) {
    var C = N.tablas[CL]; if (!C) return '';
    var nombre = campo(r, 'cliente').value.trim(); if (!nombre) return '';
    var telTxt = campo(r, 'telefono').value.trim(), tel = ultimos10(telTxt), nn = limpiar(nombre), hallada = 0, vacia = 0, k;
    for (k = 1; k <= C.n; k++) {
      var nom = deClienta(k, 'nombre'), wa = deClienta(k, 'whatsapp'); if (!nom) continue;
      if (limpiar(nom.value) === nn || (tel && ultimos10(wa && wa.value) === tel)) { hallada = k; break; }
      if (!vacia && COLS_CL.every(function (c) { var e = deClienta(k, c); return !e || !e.value.trim(); })) vacia = k;
    }
    if (hallada) {
      var w = deClienta(hallada, 'whatsapp');
      if (telTxt && w && !w.value.trim()) { poner2(w, telTxt); N.guardar(); if (window.lrFichas) window.lrFichas.refrescar(); return 'Agregué el WhatsApp de ' + nombre + ' en tu lista de clientas.'; }
      return '';
    }
    var fila = vacia || (N.agregarRenglon(CL) ? C.n : 0); if (!fila) return '';
    poner2(deClienta(fila, 'nombre'), nombre); if (telTxt) poner2(deClienta(fila, 'whatsapp'), telTxt); poner2(deClienta(fila, 'desde'), hoy());
    N.guardar(); if (window.lrFichas) window.lrFichas.refrescar();
    return nombre + ' quedó en tu lista de clientas.';
  }
  function avisoClienta(ta, msg) {
    var v = ta.parentNode.querySelector('.aviso-clienta'); if (v) v.remove(); if (!msg) return;
    var p = document.createElement('span'); p.className = 'aviso-cal aviso-clienta no-imprimir'; p.setAttribute('role', 'status'); p.textContent = '✔ ' + msg; ta.parentNode.appendChild(p);
    setTimeout(function () { if (p.parentNode) p.remove(); }, 6000);
  }
  document.getElementById('control-pedidos').addEventListener('change', function (e) {
    var tr = e.target.closest && e.target.closest('tr.ficha'); if (!tr || !/-(cliente|telefono)$/.test(e.target.id)) return;
    avisoClienta(e.target, registrarClienta(+tr.dataset.fila));
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
