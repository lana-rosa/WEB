/* Agenda para tejedoras: pedido y proyecto unidos (E34, 12-nov-2026; idea tomada de comparar con otra agenda, textos y diseño propios).
   En cada pedido, «Proyecto de este pedido»: «Crear proyecto de este pedido» (llena el proyecto con el producto, la clienta y la fecha de entrega) o «Vincular» uno que ya existe.
   Con el proyecto unido, el pedido muestra su estado, el último avance, las horas tejidas del cronómetro (y lo que vale ese tiempo si en «Mi catálogo de precios» está el valor de la hora)
   y la lana apartada (con aviso si no alcanza). En el proyecto sale «Del pedido de …» con lo que falta por cobrar y el botón «Ver pedido».
   El vínculo vive en `datos._pedProy['pN'] = N` (fila del proyecto; entra solo en copias, nube y Drive). Si el proyecto se renombra el vínculo sigue (va por fila);
   si el pedido o el proyecto se vacían, el vínculo se borra. Quitar el vínculo no borra nada. No cambia ningún campo `ag-*` salvo los del proyecto nuevo que se crea. */
(function () {
  'use strict';
  var N = window.lrAgendaNucleo, tp = document.getElementById('tabla-pedidos'), tf = document.getElementById('tabla-fila');
  if (!N || !tp || !tf || !N.tablas['tabla-pedidos'] || !N.tablas['tabla-fila']) return;
  var PD = N.tablas['tabla-pedidos'], PR = N.tablas['tabla-fila'];
  function el(tag, cls, t) { var e = document.createElement(tag); if (cls) e.className = cls; if (t != null) e.textContent = t; return e; }
  function T(t) { return window.lrI18n && window.lrI18n.t ? window.lrI18n.t(t) : t; }
  function sin(t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim(); }
  function num(t) { var n = parseInt(String(t == null ? '' : t).replace(/[^0-9-]/g, ''), 10); return isFinite(n) ? n : null; }
  function pesos(n) { return '$' + Math.round(n).toLocaleString('es-CO'); }
  function cant(n) { return String(Math.round(n * 10) / 10).replace('.', ','); }
  function vp(k, c) { var e = document.getElementById(PD.prefijo + k + '-' + c); return e ? e.value.trim() : ''; }
  function vr(f, c) { var e = document.getElementById(PR.prefijo + f + '-' + c); return e ? e.value.trim() : ''; }
  function pedidoVacio(k) { return !vp(k, 'cliente') && !vp(k, 'pedido') && num(vp(k, 'totalcompra')) === null && num(vp(k, 'precio')) === null; }
  function mapa() { var d = N.datos(); if (!d._pedProy || typeof d._pedProy !== 'object' || Array.isArray(d._pedProy)) d._pedProy = {}; return d._pedProy; }
  function vinculo(k) { var f = mapa()['p' + k]; return f && vr(f, 'proyecto') ? f : 0; }
  function pedidoDe(f) { var m = mapa(), k; for (k in m) if (m[k] === f && !pedidoVacio(+k.slice(1))) return +k.slice(1); return 0; }
  function limpiarVinculos() { var m = mapa(), cambio = false; Object.keys(m).forEach(function (k) { if (pedidoVacio(+k.slice(1)) || !vr(m[k], 'proyecto')) { delete m[k]; cambio = true; } }); if (cambio) N.guardar(); }
  function poner(e, v) { if (!e) return; e.value = v; N.datos()[e.id] = v; }
  function refrescar() { N.guardar(); if (window.lrFichas && window.lrFichas.refrescar) window.lrFichas.refrescar(); }

  /* ---- crear o vincular ---- */
  function nombresProyectos() { var o = {}, f; for (f = 1; f <= PR.n; f++) { var n = vr(f, 'proyecto'); if (n) o[sin(n)] = 1; } return o; }
  function nombreNuevo(k) {   // único: el tiempo y la lana de un proyecto van por su nombre
    var base = (vp(k, 'pedido') || ('Pedido de ' + (vp(k, 'cliente') || 'clienta'))).slice(0, 60), usados = nombresProyectos(), cli = vp(k, 'cliente').split(/\s+/)[0], n = base, i = 2;
    if (usados[sin(n)] && cli) n = (base + ' · ' + cli).slice(0, 60);
    while (usados[sin(n)]) { n = (base + ' ' + i).slice(0, 60); i++; }
    return n;
  }
  function filaLibre() {
    var f; for (f = 1; f <= PR.n; f++) if (!vr(f, 'proyecto') && !vr(f, 'para') && !vr(f, 'fecha')) return f;
    return N.agregarRenglon('tabla-fila') ? PR.n : 0;
  }
  function crear(k) {
    var f = filaLibre(); if (!f) return T('Tu lista de proyectos está llena. Libera un renglón e inténtalo de nuevo.');
    poner(document.getElementById(PR.prefijo + f + '-proyecto'), nombreNuevo(k)); poner(document.getElementById(PR.prefijo + f + '-para'), vp(k, 'cliente'));
    poner(document.getElementById(PR.prefijo + f + '-fecha'), vp(k, 'entrega')); poner(document.getElementById(PR.prefijo + f + '-estado'), 'Por empezar');
    mapa()['p' + k] = f; refrescar(); return '';
  }
  function vincular(k, f) { if (!vr(f, 'proyecto')) return; mapa()['p' + k] = f; refrescar(); }
  function irA(hoja, tabla, fila) {
    if (window.lrIrAHoja) window.lrIrAHoja(hoja);
    setTimeout(function () { var tr = document.querySelector('#' + tabla + ' tr.ficha[data-fila="' + fila + '"]'); if (!tr) return; var cab = tr.querySelector('.ficha-cab'); if (cab && cab.getAttribute('aria-expanded') !== 'true') cab.click(); tr.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 450);
  }

  /* ---- en el pedido ---- */
  function insertarPedido(tr, td) { var ref = tr.querySelector('td.pd-presup') || tr.querySelector('td.pd-abonos') || tr.querySelector('td[data-col="saldo"]'); tr.insertBefore(td, ref ? ref.nextSibling : tr.querySelector('td.celda-cal')); }
  function pintarPedidos() {
    tp.querySelectorAll('tr.ficha').forEach(function (tr) {
      var k = +tr.getAttribute('data-fila'), td = tr.querySelector('td.pd-proyecto');
      if (pedidoVacio(k)) { if (td) td.remove(); return; }
      if (!td) { td = el('td', 'pd-proyecto no-imprimir'); td.setAttribute('data-col', 'proyecto'); insertarPedido(tr, td); }
      var ac = document.activeElement; if (ac && ac.tagName === 'SELECT' && td.contains(ac)) return;
      td.textContent = '';
      td.appendChild(el('p', 'pl-t', 'Proyecto de este pedido'));
      var f = vinculo(k), msg = el('p', 'iv-aviso mal'); msg.setAttribute('role', 'alert'); msg.hidden = true;
      if (!f) {
        td.appendChild(el('p', 'pd-res info', 'Este pedido aún no tiene proyecto. Si lo creas, verás aquí las horas tejidas y la lana apartada.'));
        var b = el('button', 'boton-secundario boton-chico', '🧶 Crear proyecto de este pedido'); b.type = 'button';
        b.addEventListener('click', function () { var e = crear(k); if (e) { msg.textContent = e; msg.hidden = false; } }); td.appendChild(b);
        var usados = {}, m = mapa(); Object.keys(m).forEach(function (x) { usados[m[x]] = 1; });
        var libres = []; for (var r = 1; r <= PR.n; r++) if (vr(r, 'proyecto') && !usados[r]) libres.push(r);
        if (libres.length) {
          var fila = el('div', 'pl-fila'), sel = el('select', 'pl-sel'); sel.setAttribute('aria-label', T('Proyecto que ya tengo')); sel.setAttribute('data-no-traducir', '');
          libres.forEach(function (r) { var o = el('option', '', vr(r, 'proyecto')); o.value = String(r); sel.appendChild(o); });
          var bv = el('button', 'boton-secundario boton-chico', 'Vincular'); bv.type = 'button'; bv.addEventListener('click', function () { vincular(k, +sel.value); });
          fila.appendChild(sel); fila.appendChild(bv); td.appendChild(el('p', 'pd-res info', 'O une uno que ya tienes:')); td.appendChild(fila);
        }
        td.appendChild(msg); return;
      }
      var nom = vr(f, 'proyecto'), rs = el('p', 'pd-res'); rs.setAttribute('data-no-traducir', ''); rs.textContent = nom; td.appendChild(rs);
      var est = el('p', 'pd-linea'); est.setAttribute('data-no-traducir', ''); est.textContent = 'Estado: ' + (vr(f, 'estado') || 'Por empezar'); td.appendChild(est);
      var av = vr(f, 'avance').split(/\n+/).filter(Boolean).pop(); if (av) { var pa = el('p', 'pd-linea'); pa.setAttribute('data-no-traducir', ''); pa.textContent = 'Último avance: ' + av.slice(0, 120); td.appendChild(pa); }
      if (window.lrCrono) {
        var h = window.lrCrono.de(nom), ph = el('p', 'pd-linea'); ph.setAttribute('data-no-traducir', ''); ph.appendChild(document.createTextNode('Horas tejidas: '));
        var sp = el('strong', '', h.enMarcha ? window.lrCrono.formato(h.seg, true) : window.lrCrono.formato(h.seg)); if (h.enMarcha) sp.setAttribute('data-crono', h.clave); ph.appendChild(sp); td.appendChild(ph);
        var hora = num(((N.datos()._costos || {}).hora)) || 0;
        if (hora > 0 && h.seg >= 60) { var pv = el('p', 'pd-linea'); pv.setAttribute('data-no-traducir', ''); pv.textContent = 'Ese tiempo vale ≈ ' + pesos(h.seg / 3600 * hora) + ' (horas × tu valor de la hora)'; td.appendChild(pv); }
        else if (!hora && h.seg >= 60) td.appendChild(el('p', 'pd-res info', 'Anota cuánto vale tu hora en «Mi catálogo de precios» y aquí verás cuánto vale ese tiempo.'));
      }
      if (window.lrProyLana) {
        var le = window.lrProyLana.estado(nom), pl = el('p', 'pd-linea', 'Lana de este proyecto:'); td.appendChild(pl);
        if (!le.length) td.appendChild(el('p', 'pd-res info', 'Aún no apartaste lana. Se elige en el proyecto, en «Lana de este proyecto».'));
        else {
          var ul = el('ul', 'pd-lista'); ul.setAttribute('data-no-traducir', '');
          le.forEach(function (x) { var li = el('li', x.hecho ? 'hecho' : (x.falta > 0 ? 'falta' : '')); li.appendChild(el('span', '', cant(x.n) + ' × ' + x.lana + (x.hecho ? ' · descontada' : x.falta > 0 ? ' · ⚠ faltan ' + cant(x.falta) : ' · apartada'))); ul.appendChild(li); });
          td.appendChild(ul);
        }
      }
      var fb = el('div', 'pl-fila'), ver = el('button', 'boton-secundario boton-chico', 'Ver proyecto'), qui = el('button', 'enlace-copia', 'Quitar el vínculo'); ver.type = qui.type = 'button';
      ver.addEventListener('click', function () { irA('proyectos-fila', 'tabla-fila', f); });
      qui.addEventListener('click', function () { delete mapa()['p' + k]; refrescar(); });
      fb.appendChild(ver); fb.appendChild(qui); td.appendChild(fb); td.appendChild(msg);
    });
  }

  /* ---- en el proyecto ---- */
  function pintarProyectos() {
    tf.querySelectorAll('tr.ficha').forEach(function (tr) {
      var f = +tr.getAttribute('data-fila'), td = tr.querySelector('td.pp-pedido'), k = vr(f, 'proyecto') ? pedidoDe(f) : 0;
      if (!k) { if (td) td.remove(); return; }
      if (!td) { td = el('td', 'pp-pedido no-imprimir'); td.setAttribute('data-col', 'pedido'); var ref = tr.querySelector('td.pl-tiempo') || tr.querySelector('td.pl-lana') || tr.querySelector('td.celda-cal') || tr.querySelector('td.ficha-acciones'); tr.insertBefore(td, ref); }
      td.textContent = '';
      td.appendChild(el('p', 'pl-t', 'Pedido de este proyecto'));
      var tot = num(vp(k, 'totalcompra')); if (tot === null) tot = num(vp(k, 'precio'));
      var l1 = el('p', 'pd-res'); l1.setAttribute('data-no-traducir', ''); l1.textContent = (vp(k, 'cliente') ? 'Del pedido de ' + vp(k, 'cliente') : 'Del pedido ' + k); td.appendChild(l1);
      var det = []; if (vp(k, 'pedido')) det.push(vp(k, 'pedido')); if (vp(k, 'entrega')) det.push('entrega ' + vp(k, 'entrega'));
      if (tot !== null && tot > 0) { var falta = Math.max(0, tot - (num(vp(k, 'abono')) || 0)); det.push(falta > 0 ? 'falta por cobrar ' + pesos(falta) : 'pagado completo'); }
      if (det.length) { var l2 = el('p', 'pd-linea'); l2.setAttribute('data-no-traducir', ''); l2.textContent = det.join(' · '); td.appendChild(l2); }
      var b = el('button', 'boton-secundario boton-chico', 'Ver pedido'); b.type = 'button'; b.addEventListener('click', function () { irA('control-pedidos', 'tabla-pedidos', k); }); td.appendChild(b);
    });
  }

  function pintar() { limpiarVinculos(); pintarPedidos(); pintarProyectos(); }
  var espera = 0;
  function programar() { clearTimeout(espera); espera = setTimeout(pintar, 350); }
  document.addEventListener('agenda-guardada', programar);
  [tp, tf].forEach(function (t) { new MutationObserver(programar).observe(t, { childList: true }); });
  ['control-pedidos', 'proyectos-fila'].forEach(function (id) { var h = document.getElementById(id); if (h) new MutationObserver(programar).observe(h, { attributes: true, attributeFilter: ['class'] }); });
  programar();
  window.lrPedidoProyecto = { pintar: pintar, crear: crear, vincular: vincular };
})();
