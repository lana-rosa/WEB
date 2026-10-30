/* Agenda para tejedoras: «Mi panel» (lo primero que se ve) y vista de sección (30-oct-2026, pedido de Sara).
   - #panel-agenda: saludo, 4 números del mes (ventas, gastos, «Te quedó», pedidos activos), próximas fechas, proyectos en curso, acciones rápidas.
     Todo sale de lo que la persona ya escribió en las otras hojas (mismos datos de siempre; no guarda nada propio).
   - window.lrSeccion.abrir(i): al tocar una sección del menú lateral se ven sus hojas como tarjetas (#vista-seccion); cerrar() la oculta. */
(function () {
  'use strict';
  var N = window.lrAgendaNucleo, hoja = document.getElementById('panel-agenda'), cont = document.getElementById('panel-contenido');
  if (!N || !hoja || !cont) return;
  var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  var DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  var TIPOS = { pedido: 'Entrega', pedidoEnvio: 'Envío', ficha: 'Entrega', proyecto: 'Proyecto', fecha: 'Fecha', feria: 'Feria', clienta: 'Cumpleaños' };
  var HOJA_DE = { pedido: 'control-pedidos', pedidoEnvio: 'control-pedidos', ficha: 'ficha-proyecto', proyecto: 'proyectos-fila', fecha: 'fechas-especiales', feria: 'ferias-mercados', clienta: 'mis-clientas' };
  var ACCIONES = [['Anotar pedido', 'control-pedidos', 'tabla-pedidos'], ['Nuevo proyecto', 'proyectos-fila', 'tabla-fila'], ['Anotar venta', 'ventas-mes', 'tabla-ventas'], ['Anotar gasto', 'gastos-negocio', 'tabla-gastos']];
  function el(id) { return document.getElementById(id); }
  function dd(n) { return ('0' + n).slice(-2); }
  function iso(d) { return d.getFullYear() + '-' + dd(d.getMonth() + 1) + '-' + dd(d.getDate()); }
  function pesos(t) { var n = parseInt(String(t || '').replace(/[^0-9]/g, ''), 10); return isFinite(n) ? n : 0; }
  function fm(x) { return (x < 0 ? '−$ ' : '$ ') + Math.abs(Math.round(x)).toLocaleString('es-CO'); }
  function txt(tag, cls, t) { var e = document.createElement(tag); if (cls) e.className = cls; if (t != null) e.textContent = t; return e; }
  function filas(tabla, cols) {
    var T = N.tablas[tabla], out = []; if (!T) return out;
    for (var r = 1; r <= T.n; r++) {
      var o = {}, alguno = false;
      cols.forEach(function (c) { var e = document.getElementById(T.prefijo + r + '-' + c); var v = e ? (e.type === 'checkbox' ? e.checked : String(e.value || '').trim()) : ''; o[c] = v; if (v) alguno = true; });
      if (alguno) out.push(o);
    }
    return out;
  }
  function ir(id) { if (window.lrIrAHoja) window.lrIrAHoja(id); }
  function icono(nombre) { return window.lrIconos ? window.lrIconos(nombre) : null; }

  function saludo(hoy) {
    var h = hoy.getHours(), s = h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
    var nombre = String(N.datos()['ag-duena'] || '').trim().split(/\s+/)[0];
    return s + (nombre ? ', ' + nombre : '');
  }
  function proximas(hoy, max) {
    var evs = (window.lrAgenda && window.lrAgenda.eventos) ? window.lrAgenda.eventos() : [], out = [], lim = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 45);
    evs.forEach(function (e) {
      var p = String(e.fecha).split('-'); if (p.length !== 3) return;
      var f = new Date(+p[0], +p[1] - 1, +p[2]);
      if (e.anual) { f = new Date(hoy.getFullYear(), +p[1] - 1, +p[2]); if (f < hoy) f = new Date(hoy.getFullYear() + 1, +p[1] - 1, +p[2]); }
      if (f < hoy || f > lim) return;
      out.push({ f: f, tipo: String(e.clave || '').split(':')[0], titulo: e.titulo, det: String(e.detalle || '').split('\n')[0] });
    });
    out.sort(function (a, b) { return a.f - b.f; });
    return out.slice(0, max);
  }
  function tarjeta(titulo, valor, sub, clase) {
    var c = txt('div', 'pn-card pn-kpi' + (clase ? ' ' + clase : '')); c.appendChild(txt('small', '', titulo)); c.appendChild(txt('strong', '', valor)); c.appendChild(txt('span', '', sub)); return c;
  }
  function pintar() {
    var hoy = new Date(); hoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    var enMes = function (t) { var f = N.leerFecha ? N.leerFecha(t) : null; return !!f && f.a === hoy.getFullYear() && f.m === hoy.getMonth() + 1; };
    var ventas = filas('tabla-ventas', ['fecha', 'precio']).filter(function (f) { return enMes(f.fecha); }), vend = ventas.reduce(function (s, f) { return s + pesos(f.precio); }, 0);
    var gastos = filas('tabla-gastos', ['fecha', 'valor']).filter(function (f) { return enMes(f.fecha); }), gas = gastos.reduce(function (s, f) { return s + pesos(f.valor); }, 0);
    var ped = filas('tabla-pedidos', ['cliente', 'entrega', 'estado', 'precio', 'totalcompra', 'abono']);
    var activos = ped.filter(function (p) { return !/entreg|cancel|despachad|terminad/i.test(p.estado); });
    var semana = activos.filter(function (p) { var f = N.leerFecha ? N.leerFecha(p.entrega) : null; if (!f || f.sinAnio) return false; var d = Math.round((new Date(f.a, f.m - 1, f.d) - hoy) / 86400000); return d >= 0 && d <= 7; }).length;
    var cobrar = activos.reduce(function (s, p) { return s + Math.max(0, (pesos(p.totalcompra) || pesos(p.precio)) - pesos(p.abono)); }, 0);
    var proy = filas('tabla-fila', ['proyecto', 'para', 'fecha', 'estado']).filter(function (p) { return p.proyecto && p.estado !== 'Terminado'; });
    proy.sort(function (a, b) { return (a.estado === 'Tejiendo' ? 0 : 1) - (b.estado === 'Tejiendo' ? 0 : 1); });
    var tejiendo = proy.filter(function (p) { return p.estado === 'Tejiendo'; }).length;
    var prox = proximas(hoy, 5);

    cont.textContent = '';
    var cab = txt('div', 'pn-saludo'); cab.appendChild(txt('h4', '', saludo(new Date())));
    var partes = [];
    partes.push(semana ? 'Tienes ' + semana + (semana === 1 ? ' entrega' : ' entregas') + ' esta semana' : 'No tienes entregas esta semana');
    partes.push(tejiendo ? tejiendo + (tejiendo === 1 ? ' proyecto' : ' proyectos') + ' en el gancho' : 'ningún proyecto tejiéndose ahora');
    cab.appendChild(txt('p', '', DIAS[hoy.getDay()].replace(/^./, function (c) { return c.toUpperCase(); }) + ' ' + hoy.getDate() + ' de ' + MESES[hoy.getMonth()] + ' · ' + partes.join(' y ') + '.'));
    cont.appendChild(cab);

    var k = txt('div', 'pn-kpis'); k.setAttribute('role', 'group'); k.setAttribute('aria-label', 'Números de ' + MESES[hoy.getMonth()]);
    k.appendChild(tarjeta('Ventas de ' + MESES[hoy.getMonth()], fm(vend), ventas.length + (ventas.length === 1 ? ' venta anotada' : ' ventas anotadas')));
    k.appendChild(tarjeta('Gastos del mes', fm(gas), gastos.length + (gastos.length === 1 ? ' gasto anotado' : ' gastos anotados')));
    k.appendChild(tarjeta('Te quedó', fm(vend - gas), vend || gas ? (vend - gas >= 0 ? 'Ganancia del mes' : 'Este mes gastaste más de lo que vendiste') : 'Aparece cuando anotes ventas y gastos', vend - gas > 0 ? 'bien' : vend - gas < 0 ? 'mal' : ''));
    k.appendChild(tarjeta('Pedidos activos', String(activos.length), activos.length ? (cobrar ? 'Por cobrar ' + fm(cobrar) : 'Todo cobrado') : 'Anota tu primer pedido'));
    cont.appendChild(k);

    var dos = txt('div', 'pn-dos');
    var cf = txt('div', 'pn-card'); var h1 = txt('h4', '', 'Próximas fechas'); var v1 = txt('button', 'pn-enlace', 'Ver calendario'); v1.type = 'button'; v1.addEventListener('click', function () { ir('calendario-anual'); }); h1.appendChild(v1); cf.appendChild(h1);
    if (!prox.length) cf.appendChild(txt('p', 'pn-vacio', 'Todavía no hay fechas. Escribe la entrega de un pedido, una feria o un cumpleaños y aparecen aquí.'));
    prox.forEach(function (e) {
      var fila = txt('button', 'pn-fila'); fila.type = 'button'; fila.addEventListener('click', function () { ir(HOJA_DE[e.tipo] || 'calendario-anual'); });
      var fe = txt('span', 'pn-fecha'); fe.appendChild(txt('small', '', MESES[e.f.getMonth()].slice(0, 3))); fe.appendChild(txt('b', '', dd(e.f.getDate())));
      var t = txt('span', 'pn-t'); t.appendChild(txt('b', '', e.titulo)); if (e.det) t.appendChild(txt('small', '', e.det));
      fila.appendChild(fe); fila.appendChild(t); fila.appendChild(txt('span', 'pn-chip', TIPOS[e.tipo] || 'Fecha')); cf.appendChild(fila);
    });
    dos.appendChild(cf);
    var cp = txt('div', 'pn-card'); var h2 = txt('h4', '', 'Mis proyectos en curso'); var v2 = txt('button', 'pn-enlace', 'Ver todos'); v2.type = 'button'; v2.addEventListener('click', function () { ir('proyectos-fila'); }); h2.appendChild(v2); cp.appendChild(h2);
    if (!proy.length) cp.appendChild(txt('p', 'pn-vacio', 'Aquí salen los proyectos que estás tejiendo o por empezar. Agrega el primero con «Nuevo proyecto».'));
    proy.slice(0, 5).forEach(function (p) {
      var fila = txt('button', 'pn-fila'); fila.type = 'button'; fila.addEventListener('click', function () { ir('proyectos-fila'); });
      var t = txt('span', 'pn-t'); t.appendChild(txt('b', '', p.proyecto)); var sub = [p.para ? 'Para ' + p.para : '', p.fecha ? 'Fecha: ' + p.fecha : ''].filter(Boolean).join(' · '); if (sub) t.appendChild(txt('small', '', sub));
      fila.appendChild(t); fila.appendChild(txt('span', 'pn-chip' + (p.estado === 'Tejiendo' ? ' av' : ''), p.estado || 'Por empezar')); cp.appendChild(fila);
    });
    dos.appendChild(cp); cont.appendChild(dos);

    var ca = txt('div', 'pn-card'); ca.appendChild(txt('h4', '', 'Acciones rápidas'));
    var ac = txt('div', 'pn-acciones');
    ACCIONES.forEach(function (a) {
      var b = txt('button', 'pn-accion', '+ ' + a[0]); b.type = 'button';
      b.addEventListener('click', function () { ir(a[1]); setTimeout(function () { if (window.lrFichas) window.lrFichas.agregar(a[2]); else if (N.agregarRenglon) N.agregarRenglon(a[2]); }, 80); });
      ac.appendChild(b);
    });
    ca.appendChild(ac); cont.appendChild(ca);

    var mas = txt('div', 'pn-card'); mas.appendChild(txt('h4', '', 'Más en Inicio'));
    var lm = txt('div', 'pn-acciones');
    [['Planeador del día', 'planeador-dia'], ['Portada', 'portada-agenda'], ['Aprende y compra', 'aprende-compra'], ['Índice de hojas', 'indice-agenda']].forEach(function (a) {
      var b = txt('button', 'pn-accion sec', a[0]); b.type = 'button'; b.addEventListener('click', function () { ir(a[1]); }); lm.appendChild(b);
    });
    mas.appendChild(lm); cont.appendChild(mas);
    cont.appendChild(txt('p', 'pn-nota', 'Estos números salen de lo que escribes en tus hojas: Mis ventas, Gastos del negocio, Control de pedidos y Proyectos por tejer.'));
  }
  window.lrPintarPanel = pintar;
  document.addEventListener('agenda-guardada', function () { if (hoja.classList.contains('abierta')) pintar(); });
  pintar();

  /* ---------- Vista de sección: las hojas de una sección como tarjetas ---------- */
  var vista = null;
  function crearVista() {
    vista = txt('section', 'vista-seccion no-imprimir'); vista.id = 'vista-seccion'; vista.hidden = true; vista.setAttribute('aria-labelledby', 'vs-titulo');
    var padre = document.querySelector('.hojas-contenido'); padre.insertBefore(vista, padre.querySelector('.selector-hoja') ? padre.querySelector('.selector-hoja').nextSibling : padre.firstChild);
  }
  function limpio(t) { return String(t || '').replace(/^[^\p{L}\p{N}]+/u, '').trim(); }
  window.lrSeccion = {
    abrir: function (titulo, enlaces, bloqueo) {
      if (!vista) crearVista();
      vista.textContent = '';
      document.querySelectorAll('#agenda .hoja-agenda.abierta').forEach(function (h) { h.classList.remove('abierta'); });
      var cab = txt('div', 'vs-cab'); var h = txt('h2', '', titulo); h.id = 'vs-titulo'; h.tabIndex = -1; cab.appendChild(h);
      cab.appendChild(txt('p', '', enlaces.length + (enlaces.length === 1 ? ' hoja' : ' hojas') + '. Toca una para abrirla.')); vista.appendChild(cab);
      var g = txt('div', 'vs-hojas');
      enlaces.forEach(function (a) {
        var id = a.dataset.hoja, src = document.getElementById(id), p = src ? src.querySelector(':scope > header p') : null, bl = src && src.classList.contains('sin-membresia');
        var b = txt('button', 'pn-card vs-hoja' + (bl ? ' bloq' : '')); b.type = 'button';
        b.appendChild(txt('b', '', limpio(a.textContent))); if (p) b.appendChild(txt('small', '', p.textContent));
        if (bl) b.appendChild(txt('span', 'pn-chip', 'Con membresía'));
        b.addEventListener('click', function () { ir(id); }); g.appendChild(b);
      });
      vista.appendChild(g); vista.hidden = false;
      var sel = el('selector-hoja'); if (sel) sel.hidden = true;
      h.focus({ preventScroll: true });
      if (window.innerWidth < 900) vista.scrollIntoView({ block: 'start' });
    },
    cerrar: function () { if (vista) vista.hidden = true; },
    abierta: function () { return !!vista && !vista.hidden; }
  };
})();
