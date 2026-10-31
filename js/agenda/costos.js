/* Agenda para tejedoras: costo por producto y precio sugerido (Plus para emprendedoras, etapa 4, 31-oct-2026).
   En «Mi catálogo de precios»: la persona anota materiales, empaque y horas de cada producto, y escribe una sola vez cuánto vale su hora y qué ganancia quiere.
   La agenda calcula el costo (materiales + empaque + horas × valor de la hora), el precio sugerido, lo que le deja su precio actual, lo que le queda por hora de trabajo
   y avisa si el precio no cubre el costo. Guarda solo las dos «reglas de precio» en datos._costos { hora, margen }; todo lo demás se calcula al momento.
   Es una guía de precios: no incluye los gastos fijos del negocio (eso lo ve «Punto de equilibrio»). API: window.lrCostos.calcular(), .margenPromedio(). */
(function () {
  'use strict';
  var N = window.lrAgendaNucleo, hoja = document.getElementById('catalogo-precios');
  if (!N || !hoja || !N.tablas['tabla-catalogo']) return;
  var CT = N.tablas['tabla-catalogo'];
  function el(tag, cls, t) { var e = document.createElement(tag); if (cls) e.className = cls; if (t != null) e.textContent = t; return e; }
  function num(t) { var n = parseInt(String(t == null ? '' : t).replace(/[^0-9]/g, ''), 10); return isFinite(n) ? n : 0; }
  function horasDe(t) { var m = /(\d+(?:[.,]\d+)?)/.exec(String(t || '')); return m ? parseFloat(m[1].replace(',', '.')) : 0; }
  function plata(x) { return (x < 0 ? '−' : '') + '$ ' + Math.abs(Math.round(x)).toLocaleString('es-CO'); }
  function reglas() { var d = N.datos(); return d._costos || (d._costos = { hora: '', margen: '' }); }
  function campo(k, c) { return document.getElementById(CT.prefijo + k + '-' + c); }

  /* ---- cálculo (una ficha) ---- */
  function de(k) {
    var nombre = ((campo(k, 'producto') || {}).value || '').trim(), tam = ((campo(k, 'tamano') || {}).value || '').trim();
    var mat = num((campo(k, 'materiales') || {}).value), emp = num((campo(k, 'empaque') || {}).value), h = horasDe((campo(k, 'horas') || {}).value), precio = num((campo(k, 'precio') || {}).value);
    var r = reglas(), hora = num(r.hora), margen = Math.max(0, Math.min(95, num(r.margen)));
    if (!nombre && !mat && !emp && !h && !precio) return null;
    var base = mat + emp, trabajo = h * hora, costo = base + trabajo;
    var sug = (costo > 0 && margen > 0) ? Math.ceil(costo / (1 - margen / 100) / 500) * 500 : 0;
    var ganancia = precio - costo, mg = precio > 0 ? Math.round(ganancia / precio * 100) : null;
    var horaReal = (h > 0 && precio > 0) ? (precio - base) / h : null;
    return { k: k, nombre: nombre + (tam ? ' · ' + tam : ''), mat: mat, emp: emp, horas: h, precio: precio, hora: hora, margenDeseado: margen, base: base, trabajo: trabajo, costo: costo, sugerido: sug, ganancia: ganancia, margen: mg, horaReal: horaReal, hayCosto: base > 0 || trabajo > 0 };
  }
  function todos() { var out = []; for (var k = 1; k <= CT.n; k++) { var c = de(k); if (c) out.push(c); } return out; }
  function margenPromedio() {
    var l = todos().filter(function (c) { return c.hayCosto && c.precio > 0 && c.margen != null; });
    if (!l.length) return null; var p = l.reduce(function (s, c) { return s + c.margen; }, 0) / l.length; return { pct: Math.round(p), n: l.length };
  }

  /* ---- pintar ---- */
  function aviso(c) {
    if (!c.hayCosto) return ['info', 'Anota lo que gastas en materiales y empaque (y las horas) para ver cuánto te cuesta.'];
    if (!c.precio) return ['info', c.sugerido ? 'Aún no pones precio. Te sugiero cobrar ' + plata(c.sugerido) + '.' : 'Anota tu precio para ver cuánto te deja.'];
    if (c.precio < c.base) return ['mal', 'Tu precio no cubre ni los materiales: pierdes ' + plata(c.base - c.precio) + ' por cada pieza.'];
    if (c.hora > 0 && c.precio < c.costo) return ['alerta', 'Cubre los materiales, pero tu hora de trabajo te queda en ' + plata(c.horaReal) + ', menos de lo que vale (' + plata(c.hora) + ').'];
    if (c.margenDeseado > 0 && c.margen < c.margenDeseado) return ['alerta', 'Te deja ' + c.margen + ' % de ganancia y quieres ' + c.margenDeseado + ' %. Con ' + plata(c.sugerido) + ' lo logras.'];
    return ['bien', 'Buen precio: te deja ' + (c.margen != null ? c.margen + ' % de ganancia' : 'ganancia') + ' después de pagar tu hora.'];
  }
  var cabecera = null;
  function asegurarCabecera() {
    if (cabecera && hoja.contains(cabecera)) return cabecera;
    cabecera = el('div', 'ct-reglas no-imprimir'); cabecera.id = 'ct-reglas';
    var ref = hoja.querySelector('.herr-rosina') || hoja.querySelector('header'); ref.parentNode.insertBefore(cabecera, ref.nextSibling);
    return cabecera;
  }
  function pintarReglas(lista) {
    var c = asegurarCabecera(), r = reglas(); var activo = document.activeElement; if (activo && c.contains(activo) && activo.tagName === 'INPUT') return;
    c.textContent = '';
    c.appendChild(el('h4', 'sub-hoja', 'Mis reglas de precio'));
    c.appendChild(el('p', 'ct-nota', 'Se escriben una sola vez y valen para todos tus productos.'));
    var fila = el('div', 'ct-campos');
    [['ct-hora', 'Mi hora de trabajo vale ($)', r.hora ? num(r.hora).toLocaleString('es-CO') : '', 'hora', '0'], ['ct-margen', 'Ganancia que quiero por pieza (%)', r.margen || '', 'margen', 'Ej. 40']].forEach(function (f) {
      var l = el('div', 'linea'); var lb = el('label', '', f[1]); lb.setAttribute('for', f[0]); var i = el('input'); i.id = f[0]; i.setAttribute('inputmode', 'numeric'); i.setAttribute('placeholder', f[4]); i.value = f[2];
      i.addEventListener('change', function () { var v = num(i.value); if (f[3] === 'margen') v = Math.min(95, v); reglas()[f[3]] = v || ''; N.guardar(); pintarTodo(true); });
      l.appendChild(lb); l.appendChild(i); fila.appendChild(l);
    });
    c.appendChild(fila);
    if (!num(r.hora)) c.appendChild(el('p', 'ct-nota', 'Si no sabes cuánto vale tu hora, la calculadora de Rosina te ayuda: lo que quieres ganar al mes ÷ las horas que tejes al mes.'));
    /* gráfica: ganancia por producto */
    var con = lista.filter(function (x) { return x.hayCosto && x.precio > 0 && x.margen != null; });
    if (con.length) {
      c.appendChild(el('h4', 'sub-hoja', 'Cuánto te deja cada producto'));
      var g = el('div', 'ct-barras'); g.setAttribute('role', 'img');
      var tope = Math.max.apply(null, con.map(function (x) { return Math.abs(x.margen); }).concat([r.margen ? num(r.margen) : 0, 50])) || 50;
      g.setAttribute('aria-label', 'Margen de ganancia por producto: ' + con.map(function (x) { return x.nombre + ' ' + x.margen + ' %'; }).join(', '));
      con.sort(function (a, b) { return b.margen - a.margen; }).forEach(function (x) {
        var f = el('div', 'ct-barra'), nom = el('span', 'ct-nom', x.nombre || 'Producto'); nom.setAttribute('data-no-traducir', '');
        var pista = el('div', 'ct-pista'), rel = el('i', 'ct-rel ' + (x.margen < 0 ? 'mal' : (num(r.margen) && x.margen < num(r.margen)) ? 'alerta' : 'bien')); rel.style.width = Math.max(2, Math.min(100, Math.abs(x.margen) / tope * 100)) + '%'; pista.appendChild(rel);
        if (num(r.margen)) { var mk = el('b', 'ct-meta'); mk.style.left = Math.min(100, num(r.margen) / tope * 100) + '%'; pista.appendChild(mk); }
        f.appendChild(nom); f.appendChild(pista); f.appendChild(el('span', 'ct-pct', x.margen + ' %')); g.appendChild(f);
      });
      c.appendChild(g);
      var lg = el('div', 'gr-leyenda'); [['Bien', '#4F8A5B'], ['Por debajo de tu meta', '#D9A441'], ['Pierdes', '#C81B6D']].forEach(function (p) { var s = el('span'); var i = el('i'); i.style.background = p[1]; s.appendChild(i); s.appendChild(document.createTextNode(p[0])); lg.appendChild(s); });
      if (num(r.margen)) { var s2 = el('span'); var i2 = el('i', 'gr-raya'); s2.appendChild(i2); s2.appendChild(document.createTextNode('Tu ganancia deseada')); lg.appendChild(s2); }
      c.appendChild(lg);
    }
  }
  function pintarFichas() {
    hoja.querySelectorAll('#tabla-catalogo tr.ficha').forEach(function (tr) {
      var k = +tr.getAttribute('data-fila'), c = de(k), td = tr.querySelector('td.ct-calculo');
      if (!c) { if (td) td.remove(); return; }
      if (!td) { td = el('td', 'ct-calculo no-imprimir'); td.setAttribute('data-col', 'calculo'); var acc = tr.querySelector('td.celda-cal') || tr.querySelector('td.ficha-acciones'); tr.insertBefore(td, acc); }
      td.textContent = ''; td.appendChild(el('h5', 'cl-titulo', 'Costo y ganancia'));
      var ul = el('ul', 'mv-lista ct-lista');
      var filas = [['Te cuesta', c.hayCosto ? plata(c.costo) : '—'], ['Precio sugerido', c.sugerido ? plata(c.sugerido) : (c.hayCosto && !c.margenDeseado ? 'Falta tu ganancia (%)' : '—')], ['Te deja por pieza', c.precio && c.hayCosto ? plata(c.ganancia) : '—'], ['Tu hora queda en', c.horaReal != null && c.hayCosto ? plata(c.horaReal) : '—']];
      filas.forEach(function (p) { var li = el('li'); li.appendChild(el('span', '', p[0])); li.appendChild(el('b', '', p[1])); ul.appendChild(li); });
      td.appendChild(ul);
      var a = aviso(c); td.appendChild(el('p', 'ct-aviso ' + a[0], a[1]));
      if (c.sugerido && c.sugerido !== c.precio) {
        var bt = el('button', 'boton-secundario boton-chico ct-usar', 'Usar ' + plata(c.sugerido) + ' como mi precio'); bt.type = 'button';
        bt.addEventListener('click', function () { var e = campo(k, 'precio'); if (!e) return; e.value = '$ ' + c.sugerido.toLocaleString('es-CO'); N.datos()[e.id] = e.value; N.guardar(); if (window.lrFichas) window.lrFichas.refrescar(); pintarTodo(true); });
        td.appendChild(bt);
      }
    });
  }
  function pintarTodo(forzar) { var l = todos(); pintarReglas(l); pintarFichas(); }
  var espera = 0;
  function programar() { clearTimeout(espera); espera = setTimeout(function () { if (hoja.classList.contains('abierta')) pintarTodo(); }, 150); }
  document.addEventListener('agenda-guardada', programar);
  new MutationObserver(function () { if (hoja.classList.contains('abierta')) programar(); }).observe(hoja, { attributes: true, attributeFilter: ['class'] });
  var tb = document.getElementById('tabla-catalogo'); if (tb) new MutationObserver(function (r) { if (r.some(function (x) { return [].some.call(x.addedNodes, function (n) { return n.nodeName === 'TR'; }); })) programar(); }).observe(tb, { childList: true });
  if (hoja.classList.contains('abierta')) programar();
  window.lrCostos = { calcular: todos, margenPromedio: margenPromedio, pintar: pintarTodo };
  document.dispatchEvent(new Event('costos-listos'));
})();
