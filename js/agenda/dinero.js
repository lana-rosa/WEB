/* Agenda para tejedoras: lector único del dinero (4-nov-2026, primer paso de «Ventas y gastos», E11/E16; solo lee, no guarda nada).
   Hasta hoy una venta o un gasto podía estar en tres sitios (Mis ventas del mes, Gastos del negocio e Ingresos y gastos) y cada módulo leía de uno distinto,
   así que el panel, el planeador, el informe, las metas y las gráficas no siempre daban lo mismo. Aquí se juntan las tres fuentes y se cuenta cada peso UNA vez:
   - registros(): todo lo anotado, normalizado: { f: 'AAAA-MM-DD', tipo: 'venta' | 'ingreso' | 'gasto' | 'ahorro', v, producto, cliente, costo, cat, desc, fijo, origen }.
   - Si una venta de «Mis ventas» y un ingreso de «Ingresos y gastos» tienen la misma fecha y el mismo valor, cuenta solo la venta; y por mes, entre las fichas de ventas y los
     ingresos de categoría «Ventas» (el total del día) se queda el lado que más suma; igual con los gastos. Los pagos fijos que se anotan solos y las compras
     de lana (`fijo`, `inv`) nunca se descartan.
   - delMes(y, m), totalesMes(y, m) y porMes(n) para quien necesite sumas. `entradas` = ventas + ingresos; `gastos` no incluye el ahorro. */
(function () {
  'use strict';
  var N = window.lrAgendaNucleo; if (!N) return;
  function num(t) { var n = parseInt(String(t == null ? '' : t).replace(/[^0-9]/g, ''), 10); return isFinite(n) ? n : 0; }
  function dos(n) { return ('0' + n).slice(-2); }
  function iso(texto) { var f = N.leerFecha ? N.leerFecha(texto) : null; return f && f.a ? f.a + '-' + dos(f.m) + '-' + dos(f.d || 1) : ''; }
  function filas(tabla, cols) {
    var T = N.tablas && N.tablas[tabla], out = []; if (!T) return out;
    for (var r = 1; r <= T.n; r++) {
      var o = {}, alguno = false;
      cols.forEach(function (c) { var e = document.getElementById(T.prefijo + r + '-' + c); var v = e ? String(e.value || '').trim() : ''; o[c] = v; if (v) alguno = true; });
      if (alguno) out.push(o);
    }
    return out;
  }
  function registros() {
    var out = [], d = N.datos(), movs = (d._fin && d._fin.movs) || [];
    var ventas = filas('tabla-ventas', ['fecha', 'producto', 'cliente', 'precio', 'costo']).filter(function (r) { return num(r.precio) > 0 || r.producto; });
    var gastos = filas('tabla-gastos', ['fecha', 'categoria', 'detalle', 'valor']).filter(function (r) { return num(r.valor) > 0 || r.detalle; });
    var usados = {};   // movimientos de «Ingresos y gastos» ya contados por una ficha (uno por uno)
    function descontar(t, f, v) {
      for (var i = 0; i < movs.length; i++) { var x = movs[i]; if (usados[i] || !x || x.t !== t || x.fijo || x.inv) continue; if (String(x.f || '').slice(0, 10) === f && num(x.v) === v && v > 0) { usados[i] = true; return; } }
    }
    ventas.forEach(function (r) { var f = iso(r.fecha), v = num(r.precio); if (f) descontar('i', f, v); out.push({ f: f, tipo: 'venta', v: v, producto: r.producto, cliente: r.cliente, costo: num(r.costo), cat: '', desc: r.producto, fijo: false, origen: 'ventas' }); });
    gastos.forEach(function (r) { var f = iso(r.fecha), v = num(r.valor); if (f) descontar('g', f, v); out.push({ f: f, tipo: 'gasto', v: v, producto: '', cliente: '', costo: 0, cat: r.categoria, desc: r.detalle, fijo: false, origen: 'gastos' }); });
    /* Un total del día anotado en «Ingresos y gastos» (categoría Ventas) y las ventas una por una en «Mis ventas» son el mismo dinero. Por mes se queda el lado que más sume
       (el otro es un subconjunto o una copia), así no se cuenta doble ni se pierde plata. Lo que no tiene ficha equivalente (otros ingresos, pagos fijos, compras de lana) sigue contando. */
    var sV = {}, sG = {}, mV = {}, mG = {}, mes;
    out.forEach(function (r) { if (!r.f) return; var k = r.f.slice(0, 7); if (r.tipo === 'venta') sV[k] = (sV[k] || 0) + r.v; else if (r.tipo === 'gasto') sG[k] = (sG[k] || 0) + r.v; });
    function esVentaMov(x) { return x.t === 'i' && (!String(x.c || '').trim() || /^venta/i.test(String(x.c).trim())); }
    function esGastoMov(x) { return x.t === 'g' && !x.fijo && !x.inv; }
    movs.forEach(function (x, i) { if (!x || usados[i]) return; var k = String(x.f || '').slice(0, 7), v = num(x.v); if (esVentaMov(x)) mV[k] = (mV[k] || 0) + v; else if (esGastoMov(x)) mG[k] = (mG[k] || 0) + v; });
    var ganaMovV = {}, ganaMovG = {}; Object.keys(mV).forEach(function (k) { if (mV[k] > (sV[k] || 0)) ganaMovV[k] = 1; }); Object.keys(mG).forEach(function (k) { if (mG[k] > (sG[k] || 0)) ganaMovG[k] = 1; });
    out = out.filter(function (r) { var k = r.f.slice(0, 7); return !((r.tipo === 'venta' && ganaMovV[k]) || (r.tipo === 'gasto' && ganaMovG[k])); });
    movs.forEach(function (x, i) {
      if (!x || usados[i]) return;
      mes = String(x.f || '').slice(0, 7);
      if (esVentaMov(x) && !ganaMovV[mes] && mV[mes]) return;   // ya están las fichas de ventas de ese mes
      if (esGastoMov(x) && !ganaMovG[mes] && mG[mes]) return;   // ya están las fichas de gastos de ese mes
      var tipo = x.t === 'i' ? 'ingreso' : x.t === 'g' ? 'gasto' : x.t === 'a' ? 'ahorro' : ''; if (!tipo) return;
      out.push({ f: String(x.f || '').slice(0, 10), tipo: tipo, v: num(x.v), producto: '', cliente: '', costo: 0, cat: x.fijo ? 'Gastos fijos' : (String(x.c || '').trim() || (tipo === 'gasto' ? 'Otros' : '')), desc: x.d || '', fijo: !!x.fijo, origen: 'movimientos' });
    });
    return out;
  }
  function ventasFicha() {   // las ventas de «Mis ventas» tal cual (producto, cliente, costo), sin descartar nada: para top de productos y margen
    return filas('tabla-ventas', ['fecha', 'producto', 'cliente', 'precio', 'costo']).map(function (r) { return { f: iso(r.fecha), tipo: 'venta', v: num(r.precio), producto: r.producto, cliente: r.cliente, costo: num(r.costo) }; });
  }
  function delMes(y, m) { var k = y + '-' + dos(m); return registros().filter(function (r) { return r.f.slice(0, 7) === k; }); }
  function totalesMes(y, m) {
    var rs = delMes(y, m), t = { y: y, m: m, entradas: 0, gastos: 0, utilidad: 0, ventasN: 0, hay: rs.length > 0, porCat: {}, registros: rs };
    rs.forEach(function (r) {
      if (r.tipo === 'venta' || r.tipo === 'ingreso') { t.entradas += r.v; if (r.tipo === 'venta') t.ventasN++; }
      else if (r.tipo === 'gasto') { t.gastos += r.v; var c = r.cat || 'Otros'; t.porCat[c] = (t.porCat[c] || 0) + r.v; }
    });
    t.utilidad = t.entradas - t.gastos; return t;
  }
  function porMes(n) {   // los últimos n meses, del más antiguo al de hoy: [{ y, m (1-12), entradas, gastos }]
    var hoy = new Date(), out = [], rs = registros();
    for (var i = n - 1; i >= 0; i--) { var f = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1); out.push({ y: f.getFullYear(), m: f.getMonth() + 1, entradas: 0, gastos: 0, k: f.getFullYear() + '-' + dos(f.getMonth() + 1) }); }
    rs.forEach(function (r) { var o = out.filter(function (x) { return x.k === r.f.slice(0, 7); })[0]; if (!o) return; if (r.tipo === 'venta' || r.tipo === 'ingreso') o.entradas += r.v; else if (r.tipo === 'gasto') o.gastos += r.v; });
    return out;
  }
  window.lrDinero = { registros: registros, ventasFicha: ventasFicha, delMes: delMes, totalesMes: totalesMes, porMes: porMes };
})();
