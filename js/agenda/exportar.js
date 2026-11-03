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
  /* Finanzas del negocio (3-nov-2026): además de «Ingresos y gastos» salen presupuesto, metas, planes, gastos fijos, deudas y tarjetas. Cada hoja de Excel lleva `hoja` = el título de la hoja
     de la agenda de la que viene, para que el candado de la membresía funcione igual. Los importes van como {n, f:'peso'} y las cantidades como números simples. */
  var MES_N = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  function P(v) { return { n: Number(v) || 0, f: 'peso' }; }
  function deFinanzas() {
    var f = (N.datos()._fin || {}), salida = [];
    function agregar(hoja, nombre, columnas, filas) { if (filas.length) salida.push({ hoja: hoja, nombre: nombre, columnas: columnas, filas: filas }); }
    var movs = (f.movs || []).slice().sort(function (a, b) { return String(a.f).localeCompare(String(b.f)); });
    agregar('Ingresos y gastos del negocio', 'Ingresos y gastos del negocio', ['Fecha', 'Tipo', 'Categoría', 'Descripción', 'Valor', 'Medio de pago'],
      movs.map(function (m) { return [m.f, m.t === 'i' ? 'Ingreso' : 'Gasto', m.c || '', m.d || '', Number(m.v) || 0, m.m || '']; }));
    var HP = 'Presupuesto y metas del negocio', pres = f.pres || {};
    agregar(HP, 'Presupuesto mensual', ['Categoría', 'Presupuesto mensual'], Object.keys(pres).filter(function (k) { return Number(pres[k]) > 0; }).map(function (k) { return [k, P(pres[k])]; }));
    agregar(HP, 'Metas de ahorro del negocio', ['Meta', 'Valor de la meta', 'Ahorrado', 'Saldo que falta', 'Fecha objetivo'],
      (f.metas || []).filter(function (m) { return m && (m.n || Number(m.meta)); }).map(function (m) { var me = Number(m.meta) || 0, ah = Number(m.ahorrado) || 0; return [m.n || '', P(me), P(ah), P(Math.max(0, me - ah)), m.fecha || '']; }));
    agregar(HP, 'Planes del negocio', ['Plan', 'Mes', 'Costo', 'Cumplido'],
      (f.planes || []).filter(function (x) { return x && (x.n || Number(x.costo)); }).map(function (x) { return [x.n || '', MES_N[(Number(x.mes) || 0) - 1] || '', P(x.costo), x.listo ? 'Sí' : 'No']; }));
    var HF = 'Gastos fijos y deudas del negocio';
    agregar(HF, 'Gastos fijos del negocio', ['Concepto', 'Valor', 'Día del mes', 'Tipo', 'Categoría', 'Medio de pago', 'Estado'],
      (f.fijos || []).map(function (x) { return [x.n || '', P(x.v), Number(x.dia) || '', x.t === 'a' ? 'Ahorro e inversión' : (x.s ? 'Suscripción' : 'Gasto fijo'), x.c || '', x.m || '', x.activo === false ? 'En pausa' : 'Activo']; }));
    agregar(HF, 'Deudas del negocio', ['Deuda', 'Valor de cada pago', 'Plazo', 'Hechas', 'Faltan', 'Día del mes', 'Saldo por pagar'],
      (f.deudas || []).map(function (d) { var tot = Number(d.cuotas) || 0, hec = Number(d.pagadas) || 0; return [d.n || '', P(d.cuota), tot, hec, Math.max(0, tot - hec), Number(d.dia) || '', P(Math.max(0, tot - hec) * (Number(d.cuota) || 0))]; }));
    var HT = 'Tarjetas del negocio', nomT = {};
    (f.tarjetas || []).forEach(function (t) { nomT[t.id] = t.n; });
    agregar(HT, 'Tarjetas del negocio', ['Tarjeta', 'Cupo', 'Saldo inicial', 'Día de corte', 'Día límite'],
      (f.tarjetas || []).map(function (t) { return [t.n || '', P(t.cupo), P(t.saldo0), Number(t.corte) || '', Number(t.pago) || '']; }));
    agregar(HT, 'Pagos a tarjetas', ['Fecha', 'Tarjeta', 'Valor'],
      (f.pagosT || []).slice().sort(function (a, b) { return String(a.f).localeCompare(String(b.f)); }).map(function (x) { return [x.f || '', nomT[x.t] || '', P(x.v)]; }));
    return salida;
  }
  /* Importes y fechas como números y fechas de Excel (antes salían como texto y no se podían sumar ni ordenar) */
  var COL_DINERO = /valor|precio|costo|total|saldo|abono|ingreso|gasto|monto|cuota|meta|presupuesto|pago|utilidad/i;
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
  function tiparHojas(hojas) { return hojas.map(function (h) { return { hoja: h.hoja, nombre: h.nombre, columnas: h.columnas, filas: h.filas.map(function (fila) { return fila.map(function (v, i) { return tipar(v, h.columnas[i]); }); }) }; }); }
  /* Candado de la membresía (30-oct-2026, decisión de Sara): las hojas bloqueadas no se exportan a Excel (la copia de seguridad .json y la copia en la cuenta siguen incluyendo todo: son tus datos) */
  function sinBloqueadas(hojas) {
    var bloq = {}; document.querySelectorAll('.hoja-agenda.sin-membresia header h3').forEach(function (h) { bloq[h.textContent.trim()] = true; });
    return hojas.filter(function (h) { return !bloq[h.hoja || h.nombre]; });
  }
  function reunir() { return sinBloqueadas(tiparHojas([].concat(deListas(), deVersiones(), deAnio(), deVision(), deFinanzas(), window.lrInforme && window.lrInforme.paraExcel ? window.lrInforme.paraExcel() : [], window.lrIdeas && window.lrIdeas.paraExcel ? window.lrIdeas.paraExcel() : []))); }
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
