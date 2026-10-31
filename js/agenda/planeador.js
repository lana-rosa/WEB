/* Agenda para tejedoras: planeador del día y números del mes (28-oct-2026).
   Muestra, para el día elegido, lo que hay agendado (entregas y envíos de pedidos, ferias, proyectos, fechas especiales, cumpleaños), una lista de tareas
   y notas del día, y un enlace para ver ese día en Google Calendar (sin conectar nada). Abajo, los números del mes salen de las demás hojas. */
(function () {
  'use strict';
  var N = window.lrAgendaNucleo, hoja = document.getElementById('planeador-dia');
  if (!N || !hoja) return;
  var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  var DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'], CORTOS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
  var TIPOS = {
    pedido: { n: 'Entrega', ic: '📦', img: 'entrega', hoja: 'control-pedidos' }, pedidoEnvio: { n: 'Envío', ic: '🚚', img: 'entrega', hoja: 'control-pedidos' }, ficha: { n: 'Entrega de proyecto', ic: '📋', img: 'entrega', hoja: 'ficha-proyecto' },
    proyecto: { n: 'Proyecto', ic: '🧵', img: 'ovillo', hoja: 'proyectos-fila' }, fecha: { n: 'Fecha especial', ic: '🎁', img: 'regalo', hoja: 'fechas-especiales' }, feria: { n: 'Feria', ic: '🎪', img: 'feria', hoja: 'ferias-mercados' }, clienta: { n: 'Cumpleaños', ic: '🎂', img: 'cumple', hoja: 'mis-clientas' }
  };
  function dd(n) { return ('0' + n).slice(-2); }
  function iso(d) { return d.getFullYear() + '-' + dd(d.getMonth() + 1) + '-' + dd(d.getDate()); }
  function dia0(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function deIso(t) { var p = String(t).split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function el(id) { return document.getElementById(id); }
  function largo(d) { return DIAS[d.getDay()] + ' ' + d.getDate() + ' de ' + MESES[d.getMonth()] + ' de ' + d.getFullYear(); }
  function cap(t) { return t.charAt(0).toUpperCase() + t.slice(1); }
  var hoy = dia0(new Date()), sel = new Date(hoy), mes = { y: hoy.getFullYear(), m: hoy.getMonth() };

  function dias() { var d = N.datos(); return d._dias || (d._dias = {}); }
  function registro(crear) { var k = iso(sel), t = dias(); if (!t[k] && crear) t[k] = { t: [], n: '' }; return t[k] || { t: [], n: '' }; }
  function limpiarVacio() { var k = iso(sel), t = dias(), r = t[k]; if (r && !r.n && !(r.t || []).length) delete t[k]; }

  function eventosDe(d) {
    var evs = (window.lrAgenda && window.lrAgenda.eventos) ? window.lrAgenda.eventos() : [], k = iso(d), md = dd(d.getMonth() + 1) + '-' + dd(d.getDate());
    return evs.filter(function (e) { return e.fecha === k || (e.anual && e.fecha.slice(5) === md); });
  }
  function tareasConteo(d) { var r = dias()[iso(d)]; return r ? (r.t || []).filter(function (x) { return !x.ok; }).length : 0; }

  function pintarSemana() {
    var cont = el('pl-semana'), ini = new Date(sel.getFullYear(), sel.getMonth(), sel.getDate() - ((sel.getDay() + 6) % 7)); cont.textContent = '';
    for (var i = 0; i < 7; i++) {
      var d = new Date(ini.getFullYear(), ini.getMonth(), ini.getDate() + i), b = document.createElement('button'), n = eventosDe(d).length + tareasConteo(d);
      b.type = 'button'; b.className = 'pl-dia' + (iso(d) === iso(sel) ? ' sel' : '') + (iso(d) === iso(hoy) ? ' hoy' : ''); b.dataset.d = iso(d); b.setAttribute('aria-pressed', String(iso(d) === iso(sel)));
      b.setAttribute('aria-label', largo(d) + (n ? ', ' + n + (n === 1 ? ' cosa' : ' cosas') : ''));
      b.innerHTML = '<small>' + CORTOS[d.getDay()] + '</small><b>' + d.getDate() + '</b><span class="pl-pto">' + (n ? '●'.repeat(Math.min(3, n)) : '') + '</span>'; cont.appendChild(b);
    }
  }
  function pintarEventos() {
    var ul = el('pl-eventos'), evs = eventosDe(sel); ul.textContent = '';
    evs.forEach(function (e) {
      var tipo = TIPOS[e.clave.split(':')[0]] || TIPOS.fecha, li = document.createElement('li'); li.className = 'pl-evento';
      var ic = document.createElement('span'); ic.className = 'pl-ic'; ic.setAttribute('aria-hidden', 'true'); if (tipo.img) { var im = document.createElement('img'); im.src = '/img/agenda/menu/tipo-' + tipo.img + '.webp?v=1'; im.alt = ''; im.width = 32; im.height = 32; ic.appendChild(im); } else ic.textContent = tipo.ic; li.appendChild(ic);
      var cu = document.createElement('div'), t = document.createElement('strong'); t.textContent = e.titulo; cu.appendChild(t);
      var s = document.createElement('small'); s.textContent = tipo.n + (e.lugar ? ' · ' + e.lugar : ''); cu.appendChild(s);
      (e.detalle || '').split('\n').filter(function (x) { return x && x.indexOf('Desde la agenda') !== 0 && !/^(Cliente|Pedido|Proyecto|Para quién): /.test(x); }).slice(0, 3).forEach(function (x) { var p = document.createElement('span'); p.className = 'pl-det'; p.textContent = x; cu.appendChild(p); });
      li.appendChild(cu);
      var a = document.createElement('a'); a.className = 'pl-abrir no-imprimir'; a.href = '#' + tipo.hoja; a.textContent = 'Abrir'; li.appendChild(a); ul.appendChild(li);
    });
    el('pl-vacio').hidden = evs.length > 0;
  }
  function pintarTareas() {
    var ul = el('pl-tareas'), r = registro(false); ul.textContent = '';
    (r.t || []).forEach(function (x, i) {
      var li = document.createElement('li'), lab = document.createElement('label'), cb = document.createElement('input'), tx = document.createElement('span'), del = document.createElement('button');
      cb.type = 'checkbox'; cb.checked = !!x.ok; cb.dataset.i = i; tx.textContent = x.x; lab.appendChild(cb); lab.appendChild(tx); li.className = x.ok ? 'hecha' : '';
      del.type = 'button'; del.className = 'pl-borrar no-imprimir'; del.dataset.i = i; del.setAttribute('aria-label', 'Borrar la tarea ' + x.x); del.textContent = '✕';
      li.appendChild(lab); li.appendChild(del); ul.appendChild(li);
    });
  }
  function pintarDia() {
    el('pl-titulo').textContent = cap(largo(sel)) + (iso(sel) === iso(hoy) ? ' · hoy' : '');
    el('pl-fecha').value = iso(sel);
    var n = el('pl-notas'); if (document.activeElement !== n) n.value = registro(false).n || '';
    var k = iso(sel).replace(/-/g, ''), sig = new Date(sel.getFullYear(), sel.getMonth(), sel.getDate() + 1), k2 = iso(sig).replace(/-/g, '');
    el('pl-gcal').href = 'https://calendar.google.com/calendar/r/day/' + sel.getFullYear() + '/' + (sel.getMonth() + 1) + '/' + sel.getDate();
    el('pl-gcal-nuevo').href = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent('Mi día de tejido') + '&dates=' + k + '/' + k2 + '&details=' + encodeURIComponent('Desde la agenda para tejedoras · lanarosacrochet.com');
    pintarSemana(); pintarEventos(); pintarTareas(); pintarNumeros();
  }

  /* ---- números del mes ---- */
  function filas(tabla, cols) {
    var T = N.tablas[tabla], out = []; if (!T) return out;
    for (var r = 1; r <= T.n; r++) {
      var o = {}, alguno = false; cols.forEach(function (c) { var e = document.getElementById(T.prefijo + r + '-' + c); var v = e ? (e.type === 'checkbox' ? e.checked : String(e.value || '').trim()) : ''; o[c] = v; if (v) alguno = true; });
      if (alguno) out.push(o);
    }
    return out;
  }
  function enMes(texto) { var f = N.leerFecha ? N.leerFecha(texto) : null; return !!f && f.a === mes.y && f.m === mes.m + 1; }
  function pesos(t) { var n = parseInt(String(t || '').replace(/[^0-9]/g, ''), 10); return isFinite(n) ? n : 0; }
  function fm(x) { return '$' + x.toLocaleString('es-CO'); }
  function pintarNumeros() {
    el('pl-mes-txt').textContent = cap(MESES[mes.m]) + ' ' + mes.y;
    var nuevas = filas('tabla-clientas', ['desde']).filter(function (f) { return enMes(f.desde); }).length;
    var ventas = filas('tabla-ventas', ['fecha', 'precio']).filter(function (f) { return enMes(f.fecha); }), vend = ventas.reduce(function (s, f) { return s + pesos(f.precio); }, 0);
    var gastos = filas('tabla-gastos', ['fecha', 'valor']).filter(function (f) { return enMes(f.fecha); }), gas = gastos.reduce(function (s, f) { return s + pesos(f.valor); }, 0);
    var proy = filas('tabla-fila', ['cumplido', 'cumplidoen']).filter(function (f) { return f.cumplido === true && enMes(f.cumplidoen); }).length;
    var clases = filas('tabla-aprendi', ['fecha']).filter(function (f) { return enMes(f.fecha); }).length;
    var entreg = filas('tabla-pedidos', ['entrega', 'estado']).filter(function (f) { return f.estado === 'Entregado' && enMes(f.entrega); }).length;
    var tiles = [['👩‍🦰', 'Clientas nuevas', String(nuevas)], ['💰', 'Ventas (' + ventas.length + ')', fm(vend)], ['🧾', 'Gastos (' + gastos.length + ')', fm(gas)], ['📈', 'Te quedó', fm(vend - gas)], ['🧶', 'Proyectos tejidos', String(proy)], ['🎓', 'Clases y tutoriales vistos', String(clases)], ['📦', 'Pedidos entregados', String(entreg)]];
    var cont = el('pl-tiles'); cont.textContent = '';
    tiles.forEach(function (t, i) { var d = document.createElement('div'); d.className = 'pl-tile' + (i === 3 ? ' resalta' : ''); d.innerHTML = '<span class="pl-t-ic" aria-hidden="true"></span><small></small><strong></strong>'; d.querySelector('.pl-t-ic').textContent = t[0]; d.querySelector('small').textContent = t[1]; d.querySelector('strong').textContent = t[2]; cont.appendChild(d); });
  }

  /* ---- eventos de la hoja ---- */
  function ir(d) { sel = dia0(d); pintarDia(); }
  el('pl-ant').addEventListener('click', function () { ir(new Date(sel.getFullYear(), sel.getMonth(), sel.getDate() - 1)); });
  el('pl-sig').addEventListener('click', function () { ir(new Date(sel.getFullYear(), sel.getMonth(), sel.getDate() + 1)); });
  el('pl-hoy').addEventListener('click', function () { ir(new Date()); mes = { y: hoy.getFullYear(), m: hoy.getMonth() }; pintarNumeros(); });
  el('pl-fecha').addEventListener('change', function (e) { if (e.target.value) ir(deIso(e.target.value)); });
  el('pl-semana').addEventListener('click', function (e) { var b = e.target.closest('.pl-dia'); if (b) ir(deIso(b.dataset.d)); });
  el('pl-mes-ant').addEventListener('click', function () { mes = mes.m === 0 ? { y: mes.y - 1, m: 11 } : { y: mes.y, m: mes.m - 1 }; pintarNumeros(); });
  el('pl-mes-sig').addEventListener('click', function () { mes = mes.m === 11 ? { y: mes.y + 1, m: 0 } : { y: mes.y, m: mes.m + 1 }; pintarNumeros(); });
  function guardar() { N.guardar(); if (window.lrAgenda && window.lrAgenda.alCambiar) window.lrAgenda.alCambiar(); }
  el('pl-form').addEventListener('submit', function (e) {
    e.preventDefault(); var i = el('pl-tarea'), t = i.value.trim(); if (!t) return;
    registro(true).t.push({ x: t, ok: false }); i.value = ''; guardar(); pintarTareas(); pintarSemana(); i.focus();
  });
  el('pl-tareas').addEventListener('change', function (e) { var cb = e.target.closest('input[type=checkbox]'); if (!cb) return; registro(true).t[+cb.dataset.i].ok = cb.checked; guardar(); pintarTareas(); pintarSemana(); });
  el('pl-tareas').addEventListener('click', function (e) {
    var b = e.target.closest('.pl-borrar'); if (!b) return; registro(true).t.splice(+b.dataset.i, 1); limpiarVacio(); guardar(); pintarTareas(); pintarSemana();
  });
  el('pl-notas').addEventListener('input', function (e) { registro(true).n = e.target.value; limpiarVacio(); guardar(); });
  hoja.addEventListener('click', function (e) { var a = e.target.closest('.pl-abrir'); if (a) { e.preventDefault(); location.hash = a.getAttribute('href'); } });
  document.addEventListener('agenda-guardada', function () { if (hoja.classList.contains('abierta')) { pintarSemana(); pintarEventos(); pintarNumeros(); } });
  new MutationObserver(function () { if (hoja.classList.contains('abierta')) pintarDia(); }).observe(hoja, { attributes: true, attributeFilter: ['class'] });
  window.lrPlaneador = { pintar: pintarDia, irA: function (d) { ir(d); } };
  pintarDia();
})();
