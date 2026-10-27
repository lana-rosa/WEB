/* Agenda para tejedoras: listas por mes (28-oct-2026): «Mis ventas del mes» y «Gastos del negocio».
   Se escriben como fichas; el mes sale solo de la fecha de cada una, así cada mes queda guardado con su nombre («Octubre 2026») y se elige en la lista.
   «Agregar el mes siguiente» deja listo el mes que sigue. Los totales son del mes elegido. */
(function () {
  'use strict';
  var N = window.lrAgendaNucleo;
  if (!N) return;
  var MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  function clave(a, m) { return a * 100 + m; }
  function nombre(k) { return MESES[(k % 100) - 1] + ' ' + Math.floor(k / 100); }
  function sumar(k, d) { var a = Math.floor(k / 100), m = (k % 100) - 1 + d; a += Math.floor(m / 12); m = ((m % 12) + 12) % 12; return clave(a, m + 1); }
  function hoyClave() { var h = new Date(); return clave(h.getFullYear(), h.getMonth() + 1); }
  function pesosNum(t) { var n = parseInt(String(t || '').replace(/[^0-9]/g, ''), 10); return isFinite(n) ? n : 0; }
  function fm(x) { return '$' + x.toLocaleString('es-CO'); }
  function esc(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  function crear(cfg) {
    var T = N.tablas[cfg.tabla], sel = document.getElementById(cfg.sel), boton = document.getElementById(cfg.boton), nota = document.getElementById(cfg.nota), tot = document.getElementById(cfg.idTotales);
    if (!T || !sel) return null;
    var elegido = null, espera;   // clave AAAAMM, '' = todos
    function campo(r, c) { return document.getElementById(T.prefijo + r + '-' + c); }
    function val(r, c) { var e = campo(r, c); return e ? String(e.value || '').trim() : ''; }
    function mesDe(r) { var f = N.leerFecha(val(r, 'fecha')); return f ? clave(f.a, f.m) : null; }
    function tieneDatos(r) { return cfg.campos.some(function (c) { return val(r, c) !== ''; }); }
    function mesesConocidos() {
      var set = {}, r; (N.datos()[cfg.guardaMeses] || []).forEach(function (k) { set[k] = true; });
      for (r = 1; r <= T.n; r++) { var k = mesDe(r); if (k) set[k] = true; }
      return Object.keys(set).map(Number).sort(function (a, b) { return a - b; });
    }
    function contar(k) { var n = 0; for (var r = 1; r <= T.n; r++) if (tieneDatos(r) && mesDe(r) === k) n++; return n; }
    function pintarSelect() {
      var lista = mesesConocidos(), hoy = hoyClave();
      if (!lista.length) lista = [hoy];
      if (elegido === null) elegido = lista.indexOf(hoy) >= 0 ? hoy : lista[lista.length - 1];
      if (elegido !== '' && lista.indexOf(elegido) < 0) { lista.push(elegido); lista.sort(function (a, b) { return a - b; }); }
      sel.innerHTML = '<option value="">Todos los meses</option>' + lista.map(function (k) { var n = contar(k); return '<option value="' + k + '">' + nombre(k) + (n ? ' (' + n + ')' : '') + '</option>'; }).join('');
      sel.value = String(elegido);
    }
    function aplicarFiltro() {
      var visibles = 0;
      for (var r = 1; r <= T.n; r++) {
        var tr = T.cuerpo.querySelector('tr[data-fila="' + r + '"]'); if (!tr) continue;
        var k = tieneDatos(r) ? mesDe(r) : null, fuera = elegido !== '' && k !== null && k !== elegido;
        tr.classList.toggle('fuera-mes', fuera); if (!tr.hidden && !fuera) visibles++;
      }
      nota.hidden = !(elegido !== '' && !visibles);
      nota.textContent = nota.hidden ? '' : '💡 Todavía no hay ' + cfg.plural + ' en ' + nombre(elegido) + '. Toca «' + cfg.agregar + '» para anotar ' + cfg.primera + '.';
      totales();
    }
    function filasDelMes() {
      var out = [];
      for (var r = 1; r <= T.n; r++) {
        if (!tieneDatos(r)) continue; var k = mesDe(r); if (elegido !== '' && k !== null && k !== elegido) continue;
        var o = {}; cfg.campos.forEach(function (c) { o[c] = val(r, c); }); out.push(o);
      }
      return out;
    }
    function totales() { tot.innerHTML = cfg.calcular(filasDelMes(), { fm: fm, num: pesosNum, esc: esc }); }
    function refrescar() { clearTimeout(espera); espera = setTimeout(function () { pintarSelect(); aplicarFiltro(); }, 120); }
    sel.addEventListener('change', function () { elegido = sel.value === '' ? '' : Number(sel.value); aplicarFiltro(); });
    boton.addEventListener('click', function () {
      var lista = mesesConocidos(), k = sumar(lista.length ? lista[lista.length - 1] : hoyClave(), 1), d = N.datos();
      d[cfg.guardaMeses] = d[cfg.guardaMeses] || []; if (d[cfg.guardaMeses].indexOf(k) < 0) d[cfg.guardaMeses].push(k); N.guardar();
      elegido = k; pintarSelect(); aplicarFiltro();
    });
    /* una ficha nueva toma la fecha de hoy (o el primer día del mes elegido) para quedar en su mes */
    document.addEventListener('ficha-agregada', function (e) {
      if (e.detail.tabla !== cfg.tabla) return;
      var f = campo(e.detail.fila, 'fecha'); if (!f || f.value) return;
      var h = new Date(), k = elegido === '' || elegido === null ? hoyClave() : elegido;
      f.value = k === hoyClave() ? ('0' + h.getDate()).slice(-2) + '/' + ('0' + (h.getMonth() + 1)).slice(-2) + '/' + h.getFullYear() : '01/' + ('0' + (k % 100)).slice(-2) + '/' + Math.floor(k / 100);
      N.datos()[f.id] = f.value; N.guardar(); refrescar();
    });
    document.getElementById(cfg.hoja).addEventListener('input', refrescar);
    document.getElementById(cfg.hoja).addEventListener('change', refrescar);
    document.addEventListener('agenda-guardada', refrescar);
    pintarSelect(); aplicarFiltro(); setTimeout(function () { pintarSelect(); aplicarFiltro(); }, 300);
    return { mes: function () { return elegido; }, refrescar: refrescar, filas: filasDelMes };
  }

  window.lrVentas = crear({
    tabla: 'tabla-ventas', hoja: 'ventas-mes', sel: 'vt-mes', boton: 'vt-mes-sig', nota: 'vt-nota', idTotales: 'totales-ventas', guardaMeses: '_vtMeses',
    campos: ['fecha', 'producto', 'cliente', 'precio', 'costo'], plural: 'ventas', agregar: 'Agregar venta', primera: 'la primera',
    calcular: function (filas, u) {
      var v = 0, c = 0, n = 0; filas.forEach(function (f) { var pv = u.num(f.precio), cv = u.num(f.costo); if (pv) n++; v += pv; c += cv; });
      return '<div><span>Ventas (' + n + ')</span><strong>' + u.fm(v) + '</strong></div><div><span>Materiales</span><strong>' + u.fm(c) + '</strong></div><div class="ganancia"><span>Te quedó</span><strong>' + u.fm(v - c) + '</strong></div>';
    }
  });
  window.lrGastos = crear({
    tabla: 'tabla-gastos', hoja: 'gastos-negocio', sel: 'gs-mes', boton: 'gs-mes-sig', nota: 'gs-nota', idTotales: 'totales-gastos', guardaMeses: '_gsMeses',
    campos: ['fecha', 'categoria', 'detalle', 'valor', 'proveedor', 'medio'], plural: 'gastos', agregar: 'Agregar gasto', primera: 'el primero',
    calcular: function (filas, u) {
      var total = 0, por = {}, n = 0;
      filas.forEach(function (f) { var v = u.num(f.valor); if (!v) return; n++; total += v; var c = f.categoria || 'Sin categoría'; por[c] = (por[c] || 0) + v; });
      var top = Object.keys(por).sort(function (a, b) { return por[b] - por[a]; }).slice(0, 2);
      var h = '<div class="ganancia"><span>Gastos (' + n + ')</span><strong>' + u.fm(total) + '</strong></div>';
      top.forEach(function (c) { h += '<div><span>' + u.esc(c) + '</span><strong>' + u.fm(por[c]) + '</strong></div>'; });
      for (var i = top.length; i < 2; i++) h += '<div><span>—</span><strong>$0</strong></div>';
      return h;
    }
  });
})();
