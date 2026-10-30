/* Agenda para tejedoras: conexiones entre hojas (30-oct-2026, revisión de la agenda pedida por Sara). Para no escribir dos veces lo mismo:
   · Control de pedidos → Mis ventas: los pedidos en estado «Entregado» se pasan de una vez a Mis ventas (fecha de entrega, producto, cliente y total de la compra).
   · Inventario de lanas → Lista de compras: las lanas con 0 ovillos se agregan a la lista de compras.
   Las dos acciones se repiten sin duplicar (se compara lo que ya está) y solo las hace la persona al tocar el botón. */
(function () {
  'use strict';
  var N = window.lrAgendaNucleo;
  if (!N || !N.tablas) return;
  function celda(t, r, c) { return document.getElementById(N.tablas[t].prefijo + r + '-' + c); }
  function val(t, r, c) { var e = celda(t, r, c); if (e && e.type === 'checkbox') return e.checked ? '1' : ''; return e ? String(e.value || '').trim() : ''; }   // las casillas ✓ valen su estado, no su texto
  function poner(t, r, c, v) { var e = celda(t, r, c); if (!e) return; e.value = v; N.datos()[e.id] = v; }
  function limpiar(x) { return String(x || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim(); }
  function num(x) { var n = parseInt(String(x || '').replace(/[^0-9-]/g, ''), 10); return isFinite(n) ? n : null; }
  function hoy() { var h = new Date(); return ('0' + h.getDate()).slice(-2) + '/' + ('0' + (h.getMonth() + 1)).slice(-2) + '/' + h.getFullYear(); }
  function vacia(t, r, cols) { return cols.every(function (c) { return !val(t, r, c); }); }
  function sitioLibre(t, cols) {   // primera fila vacía o, si no hay, un renglón nuevo
    for (var r = 1; r <= N.tablas[t].n; r++) if (vacia(t, r, cols)) return r;
    return N.agregarRenglon(t) ? N.tablas[t].n : 0;
  }
  function aviso(hoja, id, texto, boton, accion) {
    var hoja_ = document.getElementById(hoja); if (!hoja_) return;
    var p = hoja_.querySelector('.' + id);
    if (!texto) { if (p) p.remove(); return; }
    if (!p) { p = document.createElement('p'); p.className = id + ' conexion-aviso aviso-auto no-imprimir'; var ref = hoja_.querySelector('.resumen-pedidos') || hoja_.querySelector('.aviso-alarma') || hoja_.querySelector('header'); ref.insertAdjacentElement('afterend', p); }
    p.innerHTML = '<span class="ca-texto"></span> <button type="button" class="boton-secundario boton-chico ca-boton"></button>';
    p.querySelector('.ca-texto').textContent = texto;
    var b = p.querySelector('.ca-boton'); b.textContent = boton;
    b.addEventListener('click', function () { var msg = accion(); N.guardar(); if (window.lrFichas) window.lrFichas.refrescar(); revisar(); mostrar(hoja_, msg); });
  }
  function mostrar(hoja, msg) {
    if (!msg) return;
    var s = hoja.querySelector('.conexion-ok'); if (!s) { s = document.createElement('p'); s.className = 'conexion-ok aviso-cal no-imprimir'; s.setAttribute('role', 'status'); var ref = hoja.querySelector('.conexion-aviso') || hoja.querySelector('.resumen-pedidos') || hoja.querySelector('header'); ref.insertAdjacentElement('afterend', s); }
    s.textContent = '✔ ' + msg; clearTimeout(s._t); s._t = setTimeout(function () { s.remove(); }, 7000);
  }

  /* ---------- Pedidos entregados → Mis ventas ---------- */
  var COLS_V = ['fecha', 'producto', 'cliente', 'precio', 'costo'];
  function clave(p, c, t) { return limpiar(p) + '|' + limpiar(c) + '|' + (num(t) || 0); }
  function pendientesVentas() {
    if (!N.tablas['tabla-pedidos'] || !N.tablas['tabla-ventas']) return [];
    var ya = {}, r, lista = [];
    for (r = 1; r <= N.tablas['tabla-ventas'].n; r++) ya[clave(val('tabla-ventas', r, 'producto'), val('tabla-ventas', r, 'cliente'), val('tabla-ventas', r, 'precio'))] = true;
    for (r = 1; r <= N.tablas['tabla-pedidos'].n; r++) {
      if (val('tabla-pedidos', r, 'estado') !== 'Entregado') continue;
      var total = val('tabla-pedidos', r, 'totalcompra') || val('tabla-pedidos', r, 'precio'); if (num(total) === null) continue;
      var prod = val('tabla-pedidos', r, 'pedido'), cli = val('tabla-pedidos', r, 'cliente');
      if (ya[clave(prod, cli, total)]) continue;
      lista.push({ fecha: val('tabla-pedidos', r, 'entrega') || hoy(), producto: prod, cliente: cli, precio: total });
    }
    return lista;
  }
  function pasarAVentas() {
    var lista = pendientesVentas(), n = 0;
    lista.forEach(function (v) { var f = sitioLibre('tabla-ventas', COLS_V); if (!f) return; COLS_V.slice(0, 4).forEach(function (c) { poner('tabla-ventas', f, c, v[c]); }); n++; });
    return n ? 'Pasé ' + n + (n === 1 ? ' pedido entregado' : ' pedidos entregados') + ' a Mis ventas. Escribe el costo de los materiales de cada venta para ver tu ganancia.' : '';
  }

  /* ---------- Lanas en 0 → Lista de compras ---------- */
  var COLS_C = ['material', 'color', 'cantidad', 'comprado'];
  function agotadas() {
    if (!N.tablas['tabla-lanas'] || !N.tablas['tabla-compras']) return [];
    var ya = {}, r, lista = [];
    for (r = 1; r <= N.tablas['tabla-compras'].n; r++) { var ck = celda('tabla-compras', r, 'comprado'); if (ck && ck.checked) continue; ya[limpiar(val('tabla-compras', r, 'material')) + '|' + limpiar(val('tabla-compras', r, 'color'))] = true; }
    for (r = 1; r <= N.tablas['tabla-lanas'].n; r++) {
      var marca = val('tabla-lanas', r, 'marca'), color = val('tabla-lanas', r, 'color'), ov = val('tabla-lanas', r, 'ovillos');
      if ((!marca && !color) || !/^0+([.,]0+)?(\s*ovillos?)?$/i.test(ov)) continue;
      var mat = ['Lana', marca, val('tabla-lanas', r, 'grosor')].filter(Boolean).join(' ').replace(/^Lana (Lana)/i, 'Lana');
      if (ya[limpiar(mat) + '|' + limpiar(color)]) continue;
      lista.push({ material: mat, color: color });
    }
    return lista;
  }
  function pasarACompras() {
    var lista = agotadas(), n = 0;
    lista.forEach(function (m) { var f = sitioLibre('tabla-compras', COLS_C); if (!f) return; poner('tabla-compras', f, 'material', m.material); poner('tabla-compras', f, 'color', m.color); poner('tabla-compras', f, 'cantidad', '1 ovillo'); n++; });
    return n ? 'Agregué ' + n + (n === 1 ? ' lana' : ' lanas') + ' a tu Lista de compras.' : '';
  }

  function revisar() {
    var v = pendientesVentas();
    aviso('control-pedidos', 'conexion-ventas', v.length ? '💰 ' + (v.length === 1 ? 'Tienes 1 pedido entregado' : 'Tienes ' + v.length + ' pedidos entregados') + ' que aún no está en Mis ventas.' : '', v.length === 1 ? 'Pasarlo a Mis ventas' : 'Pasarlos a Mis ventas', pasarAVentas);
    var a = agotadas();
    aviso('inventario-lanas', 'conexion-compras', a.length ? '🛍️ ' + (a.length === 1 ? 'Tienes 1 lana con 0 ovillos' : 'Tienes ' + a.length + ' lanas con 0 ovillos') + ' que no está en tu Lista de compras.' : '', a.length === 1 ? 'Agregarla a la lista' : 'Agregarlas a la lista', pasarACompras);
  }
  var t = null; document.addEventListener('agenda-guardada', function () { clearTimeout(t); t = setTimeout(revisar, 300); });
  revisar();
})();
