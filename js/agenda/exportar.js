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
      T.cols.forEach(function (c, i) { var id = typeof c === 'string' ? c : c.id; if (id === 'cal') return; cols.push(id); nombres.push(T.titulos[i] || id); });
      var filas = [];
      for (var r = 1; r <= T.n; r++) {
        var fila = cols.map(function (c) { return valorCampo(T.prefijo + r + '-' + c); });
        if (fila.some(function (v) { return v === true || (v !== false && v !== ''); })) filas.push(fila.map(function (v, i) { return /^(precio|abono|costo|ovillos|cantidad|horas)$/.test(cols[i]) ? numeroSi(v) : v; }));
      }
      if (filas.length) salida.push({ nombre: tituloHoja(T.cuerpo.closest('.hoja-agenda').id), columnas: nombres, filas: filas });
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
    if (movs.length) salida.push({ nombre: 'Mis movimientos', columnas: ['Fecha', 'Tipo', 'Categoría', 'Descripción', 'Valor', 'Medio de pago'],
      filas: movs.map(function (m) { return [m.f, m.t === 'i' ? 'Ingreso' : 'Gasto', m.c || '', m.d || '', Number(m.v) || 0, m.m || '']; }) });
    return salida;
  }
  function reunir() { return [].concat(deListas(), deVersiones(), deAnio(), deVision(), deFinanzas(), window.lrIdeas && window.lrIdeas.paraExcel ? window.lrIdeas.paraExcel() : []); }
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
