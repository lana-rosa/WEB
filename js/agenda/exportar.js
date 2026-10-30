/* Agenda para tejedoras: exportar lo escrito a Excel (.xlsx), una hoja por cada hoja de la agenda con datos. */
(function () {
  'use strict';
  var N = window.lrAgendaNucleo;
  if (!N || !window.lrXlsx) return;

  function tituloHoja(id) { var h = document.querySelector('#' + id + ' header h3'); return h ? h.textContent.trim() : id; }
  function valorCampo(id) { var e = document.getElementById(id); if (!e) return ''; return e.type === 'checkbox' ? e.checked : String(e.value || '').trim(); }
  function numeroSi(v) { return /^-?\d+([.,]\d+)?$/.test(String(v)) ? Number(String(v).replace(',', '.')) : v; }

  /* Listas (fichas): una fila por ficha con datos */
  function deListas() {
    var salida = [], F = window.lrFichas;
    if (!F) return salida;
    Object.keys(F.LISTAS).forEach(function (tabla) {
      var T = N.tablas[tabla]; if (!T) return;
      var cols = [], nombres = [];
      T.cols.forEach(function (c, i) { var id = typeof c === 'string' ? c : c.id; if (id === 'cal' || (tabla === 'tabla-pedidos' && id === 'precio')) return; cols.push(id); nombres.push(T.titulos[i] || id); });
      var filas = [];
      for (var r = 1; r <= T.n; r++) {
        var fila = cols.map(function (c) { return valorCampo(T.prefijo + r + '-' + c); });
        if (fila.some(function (v) { return v === true || (v !== false && v !== ''); })) filas.push(fila.map(function (v, i) { return /^(precio|abono|costo|ovillos|cantidad|horas)$/.test(cols[i]) ? numeroSi(v) : v; }));
      }
      var hojaT = T.cuerpo.closest('.hoja-agenda');   // las hojas bloqueadas del modo «hojas gratis» no se exportan
      if (filas.length && hojaT) salida.push({ nombre: tituloHoja(hojaT.id), columnas: nombres, filas: filas });
    });
    return salida;
  }
  /* Hojas de una sola ficha o de varias versiones (las agrega el módulo de versiones) */
  function deVersiones() { return window.lrVersiones && window.lrVersiones.paraExcel ? window.lrVersiones.paraExcel() : []; }
  function deAnio() {
    var d = N.datos(), anios = d._anios || {}, filas = [];
    Object.keys(anios).sort().forEach(function (a) { (anios[a] || []).forEach(function (t, i) { if (String(t || '').trim()) filas.push([+a, ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][i], t]); }); });
    return filas.length ? [{ nombre: 'Mi año tejiendo', columnas: ['Año', 'Mes', 'Lo que terminé'], filas: filas }] : [];
  }
  function deVision() {
    var filas = [];
    document.querySelectorAll('#vision-anio [data-guardar]').forEach(function (e) {
      var v = valorCampo(e.id); if (!v) return;
      var l = document.querySelector('label[for="' + e.id + '"]'); filas.push([l ? l.textContent.trim() : e.id, v]);
    });
    return filas.length ? [{ nombre: 'Mi visión del año', columnas: ['Pregunta', 'Respuesta'], filas: filas }] : [];
  }
  function deFinanzas() {
    var f = (N.datos()._fin || {}), salida = [];
    var movs = (f.movs || []).slice().sort(function (a, b) { return String(a.f).localeCompare(String(b.f)); });
    if (movs.length) salida.push({ nombre: 'Ingresos y gastos del negocio', columnas: ['Fecha', 'Tipo', 'Categoría', 'Descripción', 'Valor', 'Medio de pago'],
      filas: movs.map(function (m) { return [m.f, m.t === 'i' ? 'Ingreso' : 'Gasto', m.c || '', m.d || '', Number(m.v) || 0, m.m || '']; }) });
    return salida;
  }
  /* Importes y fechas como números y fechas de Excel (antes salían como texto y no se podían sumar ni ordenar) */
  var COL_DINERO = /valor|precio|costo|total|saldo|abono|ingreso|gasto|monto|cuota|meta|presupuesto|pago/i;
  function serial(a, m, d) { var t = Date.UTC(a, m - 1, d), x = new Date(t); if (x.getUTCFullYear() !== a || x.getUTCMonth() !== m - 1 || x.getUTCDate() !== d) return null; return Math.round(t / 86400000) + 25569; }
  function tipar(v, col) {
    if (typeof v === 'number') return COL_DINERO.test(col || '') ? { n: v, f: 'peso' } : v;
    if (typeof v !== 'string') return v;
    var t = v.trim(), f = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(t), i = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t), n;
    if (f && (n = serial(+f[3], +f[2], +f[1])) !== null) return { n: n, f: 'fecha' };
    if (i && (n = serial(+i[1], +i[2], +i[3])) !== null) return { n: n, f: 'fecha' };
    var m = /^\$\s*(-?\d{1,3}(?:[.\s]\d{3})*|-?\d+)(?:,(\d{1,2}))?$/.exec(t);   // «$ 170.000», «$85.000», «$ 1.250,50»
    if (m) return { n: Number(m[1].replace(/[.\s]/g, '') + (m[2] ? '.' + m[2] : '')), f: 'peso' };
    if (COL_DINERO.test(col || '') && /^-?\d{1,3}(?:\.\d{3})+$|^-?\d+$/.test(t)) return { n: Number(t.replace(/\./g, '')), f: 'peso' };
    return v;
  }
  function tiparHojas(hojas) { return hojas.map(function (h) { return { nombre: h.nombre, columnas: h.columnas, filas: h.filas.map(function (fila) { return fila.map(function (v, i) { return tipar(v, h.columnas[i]); }); }) }; }); }
  function reunir() { return tiparHojas([].concat(deListas(), deVersiones(), deAnio(), deVision(), deFinanzas(), window.lrIdeas && window.lrIdeas.paraExcel ? window.lrIdeas.paraExcel() : [])); }
  function descargar() {
    var hojas = reunir();
    if (!hojas.length) { alert('Todavía no hay nada escrito para exportar. Llena alguna hoja de tu agenda y vuelve a intentarlo.'); return; }
    var blob = window.lrXlsx.crear(hojas), a = document.createElement('a'), hoy = new Date().toISOString().slice(0, 10);
    a.href = URL.createObjectURL(blob); a.download = 'agenda-para-tejedoras-' + hoy + '.xlsx';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
    (window.dataLayer = window.dataLayer || []).push({ event: 'resource_use', recurso: 'agenda_excel' });
  }
  var b = document.getElementById('agenda-excel');
  if (b) b.addEventListener('click', descargar);
  window.lrExportar = { reunir: reunir, descargar: descargar };
})();
