/* Agenda para tejedoras: «Mis ventas del mes» por mes (27-oct-2026).
   Las ventas se escriben como fichas; el mes sale solo de la fecha de cada venta, así cada mes queda guardado con su nombre
   («Octubre 2026») y se elige en la lista. «Agregar el mes siguiente» deja listo el mes que sigue. Los totales son del mes elegido. */
(function () {
  'use strict';
  var N = window.lrAgendaNucleo;
  if (!N || !N.tablas['tabla-ventas']) return;
  var TABLA = 'tabla-ventas', MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  var sel = document.getElementById('vt-mes'), boton = document.getElementById('vt-mes-sig'), nota = document.getElementById('vt-nota'), tot = document.getElementById('totales-ventas');
  var elegido = null;   // clave AAAAMM, '' = todos
  function T() { return N.tablas[TABLA]; }
  function campo(r, c) { return document.getElementById(T().prefijo + r + '-' + c); }
  function val(r, c) { var e = campo(r, c); return e ? String(e.value || '').trim() : ''; }
  function clave(a, m) { return a * 100 + m; }
  function nombre(k) { return MESES[(k % 100) - 1] + ' ' + Math.floor(k / 100); }
  function mesDe(r) { var f = N.leerFecha(val(r, 'fecha')); return f ? clave(f.a, f.m) : null; }
  function tieneDatos(r) { return ['fecha', 'producto', 'cliente', 'precio', 'costo'].some(function (c) { return val(r, c) !== ''; }); }
  function sumar(k, d) { var a = Math.floor(k / 100), m = (k % 100) - 1 + d; a += Math.floor(m / 12); m = ((m % 12) + 12) % 12; return clave(a, m + 1); }
  function hoyClave() { var h = new Date(); return clave(h.getFullYear(), h.getMonth() + 1); }
  function pesosNum(t) { var n = parseInt(String(t || '').replace(/[^0-9]/g, ''), 10); return isFinite(n) ? n : 0; }
  function fm(x) { return '$' + x.toLocaleString('es-CO'); }

  function mesesConocidos() {
    var d = N.datos(), set = {}, r;
    (d._vtMeses || []).forEach(function (k) { set[k] = true; });
    for (r = 1; r <= T().n; r++) { var k = mesDe(r); if (k) set[k] = true; }
    return Object.keys(set).map(Number).sort(function (a, b) { return a - b; });
  }
  function contar(k) { var n = 0; for (var r = 1; r <= T().n; r++) if (tieneDatos(r) && mesDe(r) === k) n++; return n; }

  function pintarSelect() {
    var lista = mesesConocidos(), hoy = hoyClave();
    if (!lista.length) lista = [hoy];
    if (elegido === null) elegido = lista.indexOf(hoy) >= 0 ? hoy : lista[lista.length - 1];
    if (elegido !== '' && lista.indexOf(elegido) < 0) lista.push(elegido), lista.sort(function (a, b) { return a - b; });
    sel.innerHTML = '<option value="">Todos los meses</option>' + lista.map(function (k) { var n = contar(k); return '<option value="' + k + '">' + nombre(k) + (n ? ' (' + n + ')' : '') + '</option>'; }).join('');
    sel.value = String(elegido);
  }
  function aplicarFiltro() {
    var visibles = 0, ocultas = 0;
    for (var r = 1; r <= T().n; r++) {
      var tr = T().cuerpo.querySelector('tr[data-fila="' + r + '"]'); if (!tr) continue;
      var k = tieneDatos(r) ? mesDe(r) : null;
      var fuera = elegido !== '' && k !== null && k !== elegido;
      tr.classList.toggle('fuera-mes', fuera);
      if (!tr.hidden) { if (fuera) ocultas++; else visibles++; }
    }
    nota.hidden = !(elegido !== '' && !visibles);
    nota.textContent = nota.hidden ? '' : '💡 Todavía no hay ventas en ' + nombre(elegido) + '. Toca «Agregar venta» para anotar la primera.';
    totales();
  }
  function totales() {
    var v = 0, c = 0, n = 0;
    for (var r = 1; r <= T().n; r++) {
      if (!tieneDatos(r)) continue;
      var k = mesDe(r); if (elegido !== '' && k !== null && k !== elegido) continue;
      var pv = pesosNum(val(r, 'precio')), cv = pesosNum(val(r, 'costo'));
      if (pv) n++; v += pv; c += cv;
    }
    tot.innerHTML = '<div><span>Ventas (' + n + ')</span><strong>' + fm(v) + '</strong></div><div><span>Materiales</span><strong>' + fm(c) + '</strong></div><div class="ganancia"><span>Te quedó</span><strong>' + fm(v - c) + '</strong></div>';
  }
  var espera;
  function refrescar() { clearTimeout(espera); espera = setTimeout(function () { var e = elegido; pintarSelect(); aplicarFiltro(); }, 120); }

  sel.addEventListener('change', function () { elegido = sel.value === '' ? '' : Number(sel.value); aplicarFiltro(); });
  boton.addEventListener('click', function () {
    var lista = mesesConocidos(), k = sumar(lista.length ? lista[lista.length - 1] : hoyClave(), 1);
    var d = N.datos(); d._vtMeses = d._vtMeses || []; if (d._vtMeses.indexOf(k) < 0) d._vtMeses.push(k); N.guardar();
    elegido = k; pintarSelect(); aplicarFiltro();
  });
  /* una venta nueva toma la fecha de hoy (o el primer día del mes elegido) para quedar en su mes */
  document.addEventListener('ficha-agregada', function (e) {
    if (e.detail.tabla !== TABLA) return;
    var f = campo(e.detail.fila, 'fecha'); if (!f || f.value) return;
    var h = new Date(), k = elegido === '' || elegido === null ? hoyClave() : elegido;
    f.value = k === hoyClave() ? ('0' + h.getDate()).slice(-2) + '/' + ('0' + (h.getMonth() + 1)).slice(-2) + '/' + h.getFullYear() : '01/' + ('0' + (k % 100)).slice(-2) + '/' + Math.floor(k / 100);
    N.datos()[f.id] = f.value; N.guardar(); refrescar();
  });
  document.getElementById('ventas-mes').addEventListener('input', refrescar);
  document.getElementById('ventas-mes').addEventListener('change', refrescar);
  document.addEventListener('agenda-guardada', refrescar);
  window.lrVentas = { mes: function () { return elegido; }, refrescar: refrescar };
  pintarSelect(); aplicarFiltro();
  setTimeout(function () { pintarSelect(); aplicarFiltro(); }, 300);
})();
