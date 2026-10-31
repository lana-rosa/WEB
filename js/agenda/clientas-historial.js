/* Agenda para tejedoras: historial de cada clienta (Plus para emprendedoras, etapa 3, 31-oct-2026).
   En cada ficha de «Mis clientas» muestra, solo para leer: cuántos pedidos tiene, cuánto ha comprado, su última compra, lo que aún debe y sus pedidos recientes.
   Sale de «Control de pedidos» (y de «Mis ventas del mes» cuando una venta no viene de un pedido, sin contar dos veces). No guarda nada.
   La clienta se reconoce por el nombre (sin tildes ni mayúsculas) o por los últimos 10 dígitos del teléfono, igual que en pedidos.js. */
(function () {
  'use strict';
  var N = window.lrAgendaNucleo, hoja = document.getElementById('mis-clientas');
  if (!N || !hoja || !N.tablas['tabla-clientas']) return;
  var CL = N.tablas['tabla-clientas'];
  function limpiar(t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim(); }
  function d10(t) { var d = String(t || '').replace(/\D/g, ''); return d.length >= 10 ? d.slice(-10) : ''; }
  function num(t) { var n = parseInt(String(t == null ? '' : t).replace(/[^0-9]/g, ''), 10); return isFinite(n) ? n : 0; }
  function plata(x) { return '$ ' + Math.round(x).toLocaleString('es-CO'); }
  function el(tag, cls, t) { var e = document.createElement(tag); if (cls) e.className = cls; if (t != null) e.textContent = t; return e; }
  function filas(tabla, cols) {
    var T = N.tablas[tabla], out = []; if (!T) return out;
    for (var r = 1; r <= T.n; r++) {
      var o = {}, alguno = false;
      cols.forEach(function (c) { var e = document.getElementById(T.prefijo + r + '-' + c); var v = e ? String(e.value || '').trim() : ''; o[c] = v; if (v) alguno = true; });
      if (alguno) out.push(o);
    }
    return out;
  }
  function dd(f) { return ('0' + f.d).slice(-2) + '/' + ('0' + f.m).slice(-2) + '/' + f.a; }
  function valor(f) { return f.a * 10000 + f.m * 100 + f.d; }

  function historia(nombre, tel, pedidos, ventas) {
    var h0 = new Date(), hoyV = h0.getFullYear() * 10000 + (h0.getMonth() + 1) * 100 + h0.getDate();   // «última compra» nunca es una fecha futura
    var nn = limpiar(nombre), t10 = d10(tel);
    var suyos = pedidos.filter(function (p) { return (nn && limpiar(p.cliente) === nn) || (t10 && d10(p.telefono) === t10); }).filter(function (p) { return !/cancel/i.test(p.estado); });
    var llaves = {}; suyos.forEach(function (p) { llaves[limpiar(p.pedido) + '|' + (num(p.totalcompra) || num(p.precio))] = 1; });
    var sueltas = ventas.filter(function (v) { return nn && limpiar(v.cliente) === nn && !llaves[limpiar(v.producto) + '|' + num(v.precio)]; });
    var total = 0, saldo = 0, activos = 0, ultima = null, lista = [];
    suyos.forEach(function (p) {
      var t = num(p.totalcompra) || num(p.precio); total += t;
      var s = Math.max(0, t - num(p.abono)); saldo += s;
      var ent = /entreg/i.test(p.estado); if (!ent) activos++;
      var f = N.leerFecha ? N.leerFecha(p.entrega) : null; if (f && !f.sinAnio && valor(f) <= hoyV) { if (!ultima || valor(f) > valor(ultima)) ultima = f; }
      lista.push({ txt: p.pedido || 'Pedido', valor: t, estado: p.estado, f: f && !f.sinAnio ? f : null });
    });
    sueltas.forEach(function (v) {
      var t = num(v.precio); total += t; var f = N.leerFecha ? N.leerFecha(v.fecha) : null; if (f && !f.sinAnio && valor(f) <= hoyV) { if (!ultima || valor(f) > valor(ultima)) ultima = f; }
      lista.push({ txt: v.producto || 'Venta', valor: t, estado: 'Venta anotada', f: f && !f.sinAnio ? f : null });
    });
    lista.sort(function (a, b) { return (b.f ? valor(b.f) : 0) - (a.f ? valor(a.f) : 0); });
    var n = suyos.length + sueltas.length;
    return { n: n, total: total, saldo: saldo, activos: activos, ultima: ultima, lista: lista, promedio: n ? total / n : 0 };
  }

  function pintar() {
    var pedidos = filas('tabla-pedidos', ['cliente', 'telefono', 'pedido', 'estado', 'entrega', 'totalcompra', 'precio', 'abono']);
    var ventas = filas('tabla-ventas', ['fecha', 'producto', 'cliente', 'precio']);
    var hoy = new Date(); hoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    hoja.querySelectorAll('#tabla-clientas tr.ficha').forEach(function (tr) {
      var k = tr.getAttribute('data-fila'), nom = document.getElementById(CL.prefijo + k + '-nombre'), wa = document.getElementById(CL.prefijo + k + '-whatsapp');
      var td = tr.querySelector('td.cl-historial');
      if (!nom || !nom.value.trim()) { if (td) td.remove(); return; }
      if (!td) { td = el('td', 'cl-historial no-imprimir'); td.setAttribute('data-col', 'historial'); var acc = tr.querySelector('td.celda-cal') || tr.querySelector('td.ficha-acciones'); tr.insertBefore(td, acc); }
      var h = historia(nom.value, wa && wa.value, pedidos, ventas);
      td.textContent = '';
      td.appendChild(el('h5', 'cl-titulo', 'Historial de compras'));
      if (!h.n) { td.appendChild(el('p', 'cl-vacio', 'Todavía no tiene pedidos anotados. Cuando anotes un pedido a su nombre, aquí verás cuánto te ha comprado.')); return; }
      var ul = el('ul', 'mv-lista cl-lista');
      var dias = h.ultima ? Math.round((hoy - new Date(h.ultima.a, h.ultima.m - 1, h.ultima.d)) / 86400000) : null;
      [['Pedidos', String(h.n) + (h.activos ? ' · ' : ''), h.activos], ['Total comprado', plata(h.total)], ['Última compra', h.ultima ? dd(h.ultima) : '—'], ['Saldo pendiente', h.saldo ? plata(h.saldo) : 'Al día'], ['Promedio por pedido', plata(h.promedio)]].forEach(function (p) {
        var li = el('li'); li.appendChild(el('span', '', p[0])); var b = el('b', '', p[1]);
        if (p[2]) { var sp = el('span', 'cl-act', ''); sp.setAttribute('data-act', p[2]); b.appendChild(sp); }
        li.appendChild(b); ul.appendChild(li);
      });
      td.appendChild(ul);
      if (h.saldo) td.querySelectorAll('li').forEach(function (li) { if (/Saldo pendiente/.test(li.textContent) || li.firstChild.textContent === 'Saldo pendiente') li.classList.add('cl-debe'); });
      if (dias != null && dias >= 90 && !h.activos) td.appendChild(el('p', 'cl-aviso', 'Hace ' + dias + ' días que no te compra. ¿Le escribes?'));
      var rec = h.lista.slice(0, 3);
      if (rec.length) {
        td.appendChild(el('h5', 'cl-titulo cl-sub', 'Pedidos recientes'));
        var ol = el('ul', 'cl-recientes');
        rec.forEach(function (r) {
          var li = el('li'); var a = el('span', 'cl-prod', r.txt); a.setAttribute('data-no-traducir', ''); li.appendChild(a);
          li.appendChild(document.createTextNode(' · ' + plata(r.valor) + ' · ')); li.appendChild(el('span', '', r.estado || 'En proceso')); if (r.f) li.appendChild(document.createTextNode(' · ' + dd(r.f)));
          ol.appendChild(li);
        });
        td.appendChild(ol);
      }
    });
    // el contador de pedidos en proceso va con texto traducible: «N en proceso»
    hoja.querySelectorAll('.cl-act').forEach(function (s) { var n = s.getAttribute('data-act'); s.textContent = n + ' en proceso'; });
  }
  var espera = 0;
  function programar() { clearTimeout(espera); espera = setTimeout(function () { if (hoja.classList.contains('abierta')) pintar(); }, 150); }
  document.addEventListener('agenda-guardada', programar);
  new MutationObserver(function () { if (hoja.classList.contains('abierta')) programar(); }).observe(hoja, { attributes: true, attributeFilter: ['class'] });
  var tb = document.getElementById('tabla-clientas'); if (tb) new MutationObserver(function (r) { if (r.some(function (x) { return x.type === 'childList' && [].some.call(x.addedNodes, function (n) { return n.nodeName === 'TR'; }); })) programar(); }).observe(tb, { childList: true });
  if (hoja.classList.contains('abierta')) programar();
  window.lrClientasHistorial = { pintar: pintar };
})();
