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
  function filas(tabla, cols, conFila) {
    var T = N.tablas && N.tablas[tabla], out = []; if (!T) return out;
    for (var r = 1; r <= T.n; r++) {
      var o = conFila ? { _fila: r } : {}, alguno = false;
      cols.forEach(function (c) { var e = document.getElementById(T.prefijo + r + '-' + c); var v = e ? String(e.value || '').trim() : ''; o[c] = v; if (v) alguno = true; });
      if (alguno) out.push(o);
    }
    return out;
  }
  function registros(todo) {   // sin argumento: solo lo del negocio (lo personal nunca se mezcla); registros(true) incluye lo personal con `personal: true`
    var out = [], d = N.datos(), movs = (d._fin && d._fin.movs) || [];
    var migrado = !!(d._fin && d._fin.migrado);   // desde la migración, «Ventas y gastos» es la única hoja donde se anota: las fichas viejas quedan solo de respaldo
    var ventas = migrado ? [] : filas('tabla-ventas', ['fecha', 'producto', 'cliente', 'precio', 'costo'], true).filter(function (r) { return num(r.precio) > 0 || r.producto; });
    var gastos = migrado ? [] : filas('tabla-gastos', ['fecha', 'categoria', 'detalle', 'valor', 'proveedor', 'medio'], true).filter(function (r) { return num(r.valor) > 0 || r.detalle; });
    var usados = {};   // movimientos de «Ingresos y gastos» ya contados por una ficha (uno por uno)
    function descontar(t, f, v) {
      for (var i = 0; i < movs.length; i++) { var x = movs[i]; if (usados[i] || !x || x.t !== t || x.fijo || x.inv) continue; if (String(x.f || '').slice(0, 10) === f && num(x.v) === v && v > 0) { usados[i] = true; return; } }
    }
    ventas.forEach(function (r) { var f = iso(r.fecha), v = num(r.precio); if (f) descontar('i', f, v); out.push({ f: f, tipo: 'venta', v: v, producto: r.producto, cliente: r.cliente, costo: num(r.costo), cat: '', desc: r.producto, fijo: false, origen: 'ventas', fila: r._fila }); });
    gastos.forEach(function (r) { var f = iso(r.fecha), v = num(r.valor); if (f) descontar('g', f, v); out.push({ f: f, tipo: 'gasto', v: v, producto: '', cliente: '', costo: 0, cat: r.categoria, desc: r.detalle, fijo: false, origen: 'gastos', fila: r._fila, prov: r.proveedor, medio: r.medio }); });
    /* Un total del día anotado en «Ingresos y gastos» (categoría Ventas) y las ventas una por una en «Mis ventas» son el mismo dinero. Por mes se queda el lado que más sume
       (el otro es un subconjunto o una copia), así no se cuenta doble ni se pierde plata. Lo que no tiene ficha equivalente (otros ingresos, pagos fijos, compras de lana) sigue contando. */
    var sV = {}, sG = {}, mV = {}, mG = {}, mes;
    out.forEach(function (r) { if (!r.f) return; var k = r.f.slice(0, 7); if (r.tipo === 'venta') sV[k] = (sV[k] || 0) + r.v; else if (r.tipo === 'gasto') sG[k] = (sG[k] || 0) + r.v; });
    function esVentaMov(x) { return x.neg !== false && x.t === 'i' && (!String(x.c || '').trim() || /^venta/i.test(String(x.c).trim())); }
    function esGastoMov(x) { return x.neg !== false && x.t === 'g' && !x.fijo && !x.inv; }
    movs.forEach(function (x, i) { if (!x || usados[i]) return; var k = String(x.f || '').slice(0, 7), v = num(x.v); if (esVentaMov(x)) mV[k] = (mV[k] || 0) + v; else if (esGastoMov(x)) mG[k] = (mG[k] || 0) + v; });
    var ganaMovV = {}, ganaMovG = {}; Object.keys(mV).forEach(function (k) { if (mV[k] > (sV[k] || 0)) ganaMovV[k] = 1; }); Object.keys(mG).forEach(function (k) { if (mG[k] > (sG[k] || 0)) ganaMovG[k] = 1; });
    out = out.filter(function (r) { var k = r.f.slice(0, 7); return !((r.tipo === 'venta' && ganaMovV[k]) || (r.tipo === 'gasto' && ganaMovG[k])); });
    movs.forEach(function (x, i) {
      if (!x || usados[i]) return;
      mes = String(x.f || '').slice(0, 7);
      if (esVentaMov(x) && !ganaMovV[mes] && mV[mes]) return;   // ya están las fichas de ventas de ese mes
      if (esGastoMov(x) && !ganaMovG[mes] && mG[mes]) return;   // ya están las fichas de gastos de ese mes
      var tipo = x.t === 'i' ? (x.p != null ? 'venta' : 'ingreso') : x.t === 'g' ? 'gasto' : x.t === 'a' ? 'ahorro' : ''; if (!tipo) return;   // una venta anotada en «Ventas y gastos» lleva producto (aunque sea vacío)
      out.push({ mid: x.id, personal: x.neg === false, f: String(x.f || '').slice(0, 10), tipo: tipo, v: num(x.v), producto: x.p || '', cliente: x.cl || '', costo: num(x.cm), cat: x.fijo ? 'Gastos fijos' : (String(x.c || '').trim() || (tipo === 'gasto' ? 'Otros' : '')), desc: x.d || '', fijo: !!x.fijo, origen: 'movimientos' });
    });
    return todo ? out : out.filter(function (r) { return !r.personal; });
  }
  function ventasDetalle() {   // las ventas con su detalle (producto, cliente, costo), sin descartar nada: para el top de productos, el margen y el historial de cada clienta
    var d = N.datos(), f = d._fin || {}, out = [];
    (f.movs || []).forEach(function (x) { if (x && x.t === 'i' && x.p != null) out.push({ f: String(x.f || '').slice(0, 10), tipo: 'venta', v: num(x.v), producto: x.p || '', cliente: x.cl || '', costo: num(x.cm) }); });
    (f.detalleVentas || []).forEach(function (x) { out.push({ f: x.f, tipo: 'venta', v: num(x.v), producto: x.p || '', cliente: x.cl || '', costo: num(x.cm) }); });   // ventas con detalle cuyo dinero ya estaba en un total mayor
    if (!f.migrado) filas('tabla-ventas', ['fecha', 'producto', 'cliente', 'precio', 'costo']).forEach(function (r) { out.push({ f: iso(r.fecha), tipo: 'venta', v: num(r.precio), producto: r.producto, cliente: r.cliente, costo: num(r.costo) }); });
    return out;
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
  /* ---- Migración única (4-nov-2026): lo anotado en «Mis ventas del mes» y «Gastos del negocio» pasa a «Ventas y gastos» (datos._fin.movs), sin perder nada ni duplicar ----
     Se pasa exactamente lo que el lector único ya contaba (misma plata antes y después). Las fichas viejas NO se tocan: quedan guardadas como respaldo y esas hojas se esconden.
     Los ids son fijos (vt<fila>, gs<fila>), así que una copia de otro aparato que ya migró no duplica. Marca: datos._fin.migrado. */
  var CAT_GASTO = { 'Materiales': 'Materiales (lanas)', 'Transporte': 'Transporte y envíos', 'Ferias y mercados': 'Ferias y mercados', 'Empaques': 'Empaques', 'Publicidad': 'Publicidad', 'Servicios': 'Servicios', 'Herramientas': 'Herramientas y equipos', 'Otros': 'Otros' };
  function medioDe(t) { t = String(t || '').trim(); if (/nequi|daviplata/i.test(t)) return 'Nequi / Daviplata'; return ['Efectivo', 'Tarjeta', 'Transferencia', 'Otro'].indexOf(t) >= 0 ? t : ''; }
  function hoyIso() { var h = new Date(); return h.getFullYear() + '-' + dos(h.getMonth() + 1) + '-' + dos(h.getDate()); }
  function migrar() {
    var d = N.datos(), f = d._fin || {}; if (f.migrado) return 0;
    var TV = N.tablas && N.tablas['tabla-ventas'], TG = N.tablas && N.tablas['tabla-gastos']; if (!TV || !TG) return 0;
    if (!document.getElementById(TV.prefijo + '1-fecha') || !document.getElementById(TG.prefijo + '1-fecha')) return 0;   // las fichas todavía no están pintadas
    var previos = registros(true);
    var hayFichas = filas('tabla-ventas', ['fecha', 'producto', 'cliente', 'precio', 'costo']).some(function (r) { return num(r.precio) > 0 || r.producto; }) || filas('tabla-gastos', ['fecha', 'detalle', 'valor']).some(function (r) { return num(r.valor) > 0 || r.detalle; });
    if (!hayFichas) return 0;   // nada que pasar: no se escribe nada (una agenda vacía sigue vacía); si luego llega una copia con fichas, se migra entonces
    if (!d._fin) d._fin = f;
    f.movs = f.movs || []; var ids = {}, vivos = {}; f.movs.forEach(function (x) { if (x && x.id != null) ids[x.id] = 1; });
    previos.forEach(function (r) { if (r.mid != null) vivos[r.mid] = 1; });
    /* las ventas con detalle que el lector descartaba (su dinero ya estaba en un total mayor de «Ingresos y gastos») no suman, pero su detalle (producto, cliente, costo) se guarda en `_fin.detalleVentas` */
    var entran = {}; previos.forEach(function (r) { if (r.origen === 'ventas') entran[r.fila] = 1; });
    f.detalleVentas = f.detalleVentas || [];
    filas('tabla-ventas', ['fecha', 'producto', 'cliente', 'precio', 'costo'], true).forEach(function (r) { if ((num(r.precio) > 0 || r.producto) && !entran[r._fila]) f.detalleVentas.push({ f: iso(r.fecha), v: num(r.precio), p: r.producto, cl: r.cliente, cm: num(r.costo) }); });
    /* lo que el lector ya descartaba por ser copia de las fichas sale de la lista de movimientos (para que ninguna hoja lo cuente doble) y se guarda en `_fin.respaldoMovs` */
    f.respaldoMovs = f.respaldoMovs || [];
    f.movs = f.movs.filter(function (x) { if (x && (x.t === 'i' || x.t === 'g') && !x.fijo && !x.inv && !vivos[x.id]) { f.respaldoMovs.push(x); return false; } return true; });
    var pasadas = 0, sinFecha = 0;
    previos.forEach(function (r) {
      if ((r.origen !== 'ventas' && r.origen !== 'gastos') || !(r.v > 0)) return;
      var id = (r.origen === 'ventas' ? 'vt' : 'gs') + r.fila; if (ids[id]) return;
      var m = r.origen === 'ventas' ? { id: id, f: r.f || hoyIso(), t: 'i', c: 'Ventas', d: r.producto || '', p: r.producto || '', cl: r.cliente || '', cm: r.costo || '', v: r.v, m: '', o: id }
        : { id: id, f: r.f || hoyIso(), t: 'g', c: CAT_GASTO[String(r.cat || '').trim()] || 'Otros', d: [r.desc, r.prov].filter(Boolean).join(' · '), v: r.v, m: medioDe(r.medio), o: id };
      if (!r.f) { m.sf = 1; m.d = (m.d ? m.d + ' ' : '') + '(sin fecha: revísala)'; sinFecha++; }
      f.movs.push(m); pasadas++;
    });
    f.migrado = hoyIso(); f.migracion = { n: pasadas, sinFecha: sinFecha };
    N.guardar(); if (window.lrFinReset) window.lrFinReset();
    return pasadas;
  }
  function personalMes(y, m) {   // lo personal del mes: gastos, ingresos y ahorro (aparte del negocio)
    var k = y + '-' + dos(m), t = { y: y, m: m, entradas: 0, gastos: 0, ahorro: 0, porCat: {}, registros: [] };
    registros(true).forEach(function (r) { if (!r.personal || r.f.slice(0, 7) !== k) return; t.registros.push(r); if (r.tipo === 'gasto') { t.gastos += r.v; var c = r.cat || 'Otros'; t.porCat[c] = (t.porCat[c] || 0) + r.v; } else if (r.tipo === 'ahorro') t.ahorro += r.v; else t.entradas += r.v; });
    return t;
  }
  window.lrDinero = { registros: registros, personalMes: personalMes, ventasFicha: ventasDetalle, ventasDetalle: ventasDetalle, migrar: migrar, migrado: function () { var f = N.datos()._fin; return !!(f && f.migrado); }, delMes: delMes, totalesMes: totalesMes, porMes: porMes };
  /* se migra al abrir la agenda, y otra vez si llega una copia vieja (de otro aparato o de la cuenta) que todavía trae las fichas */
  function arrancar() { try { migrar(); } catch (e) { if (window.console) console.warn('Migración de Ventas y gastos pendiente', e); } }
  arrancar(); document.addEventListener('agenda-guardada', arrancar); window.addEventListener('load', function () { setTimeout(arrancar, 400); });
})();
