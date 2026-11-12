/* Agenda para tejedoras: lana de cada proyecto (Plus para emprendedoras, 2-nov-2026, a pedido de Jennifer: «lana por proyecto»).
   En la hoja de la fila de proyectos, cada proyecto con nombre tiene «Lana de este proyecto»: se elige una lana del Inventario, cuántos ovillos lleva y se agrega a la lista.
   Cuando el proyecto está «Terminado», el botón «Descontar del inventario» resta esos ovillos (queda anotado como «Usé» con el nombre del proyecto, y se puede
   deshacer desde el inventario). La lista vive en `datos._proyLana[nombre del proyecto sin tildes ni mayúsculas] = [{ id, lana, n, hecho }]` (entra sola en copias, nube y Drive).
   Si se cambia el nombre del proyecto, la lista queda con el nombre viejo. No resta nada sola: siempre con el botón.
   Lana apartada (E34, 12-nov-2026): lo que está en las listas sin descontar queda «apartado» (solo cuenta para proyectos que siguen en la hoja). Si lo apartado de una lana supera
   lo que hay en el inventario, la lista del proyecto y la ficha de esa lana avisan cuántos ovillos faltan. No quita nada del inventario por su cuenta.
   API: window.lrProyLana.apartadas() → { lana sin tildes: ovillos apartados }, .estado(proyecto) → [{ lana, n, hecho, stock, apartados, falta }]. */
(function () {
  'use strict';
  var N = window.lrAgendaNucleo, tf = document.getElementById('tabla-fila');
  if (!N || !tf || !N.tablas['tabla-fila']) return;
  var PR = N.tablas['tabla-fila'];
  function el(tag, cls, t) { var e = document.createElement(tag); if (cls) e.className = cls; if (t != null) e.textContent = t; return e; }
  function sin(t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim(); }
  function T(t) { return window.lrI18n && window.lrI18n.t ? window.lrI18n.t(t) : t; }
  function num(n) { return String(Math.round(n * 10) / 10).replace('.', ','); }
  function v(k, c) { var e = document.getElementById(PR.prefijo + k + '-' + c); return e ? e.value.trim() : ''; }
  function datos() { var d = N.datos(); if (!d._proyLana || typeof d._proyLana !== 'object' || Array.isArray(d._proyLana)) d._proyLana = {}; return d._proyLana; }
  function lista(nom) { var d = datos(), k = sin(nom); if (!Array.isArray(d[k])) d[k] = []; return d[k]; }
  var errores = {};   // el aviso sobrevive al repintado que sigue a cada guardado
  function terminado(k) { return /terminad/i.test(v(k, 'estado')); }
  /* lana apartada: lo pendiente de las listas de los proyectos que siguen en la hoja */
  function apartadas() {
    var d = datos(), vivos = {}, out = {}, k;
    for (k = 1; k <= PR.n; k++) { var n = v(k, 'proyecto'); if (n) vivos[sin(n)] = 1; }
    Object.keys(d).forEach(function (clave) { if (!vivos[clave] || !Array.isArray(d[clave])) return; d[clave].forEach(function (it) { if (it && !it.hecho) out[sin(it.lana)] = (out[sin(it.lana)] || 0) + (+it.n || 0); }); });
    return out;
  }
  function stockDe(lana) { if (!window.lrInvMov) return null; var l = window.lrInvMov.lanas().filter(function (x) { return sin(x.nombre) === sin(lana); })[0]; return l ? l.ov : null; }
  function estado(nom) {
    var ap = apartadas();
    return ((datos()[sin(nom)]) || []).map(function (it) { var st = stockDe(it.lana), tot = ap[sin(it.lana)] || 0; return { lana: it.lana, n: +it.n || 0, hecho: !!it.hecho, stock: st, apartados: tot, falta: it.hecho || st === null ? 0 : Math.max(0, Math.round((tot - st) * 10) / 10) }; });
  }

  function pintar() {
    if (!window.lrInvMov) return;
    tf.querySelectorAll('tr.ficha').forEach(function (tr) {
      var k = +tr.getAttribute('data-fila'), nom = v(k, 'proyecto'), td = tr.querySelector('td.pl-lana');
      if (!nom) { if (td) td.remove(); return; }
      if (!td) { td = el('td', 'pl-lana no-imprimir'); td.setAttribute('data-col', 'lana'); var acc = tr.querySelector('td.celda-cal') || tr.querySelector('td.ficha-acciones'); tr.insertBefore(td, acc); }
      var ac = document.activeElement; if (ac && (ac.tagName === 'INPUT' || ac.tagName === 'SELECT') && td.contains(ac)) return;
      td.textContent = '';
      var items = (datos()[sin(nom)] || []).slice(), lanas = window.lrInvMov.lanas();
      var estados = estado(nom).map(function (x, i) { x.id = items[i] && items[i].id; return x; });
      td.appendChild(el('p', 'pl-t', 'Lana de este proyecto'));
      if (items.length) {
        var ul = el('ul', 'pl-lista'); ul.setAttribute('data-no-traducir', '');
        items.forEach(function (it) {
          var es = estados.filter(function (x) { return x.id === it.id; })[0] || {}, li = el('li', it.hecho ? 'hecho' : (es.falta > 0 ? 'falta' : '')); li.appendChild(el('span', '', T(num(it.n) + ' × ' + it.lana + (it.hecho ? ' · descontada' : es.falta > 0 ? ' · ⚠ no alcanza' : ' · apartada'))));
          if (!it.hecho) { var q = el('button', 'enlace-copia', '✕'); q.type = 'button'; q.setAttribute('aria-label', 'Quitar'); q.addEventListener('click', function () { delete errores[sin(nom)]; var l = lista(nom), i = l.findIndex(function (x) { return x.id === it.id; }); if (i >= 0) { l.splice(i, 1); if (!l.length) delete datos()[sin(nom)]; N.guardar(); } }); li.appendChild(q); }
          ul.appendChild(li);
        });
        td.appendChild(ul);
        var faltan = {}; estados.forEach(function (x) { if (x.falta > 0) faltan[x.lana] = x; });
        Object.keys(faltan).forEach(function (l) { var x = faltan[l], p = el('p', 'iv-aviso mal', T('Te faltan ' + num(x.falta) + ' ovillo(s) de ' + l + ': tienes ' + num(x.stock) + ' y entre tus proyectos tienes apartados ' + num(x.apartados) + '.')); p.setAttribute('role', 'status'); p.setAttribute('data-no-traducir', ''); td.appendChild(p); });
      }
      var msg = el('p', 'iv-aviso mal'); msg.setAttribute('role', 'alert'); msg.textContent = errores[sin(nom)] || ''; msg.hidden = !msg.textContent;
      if (!lanas.length) {
        td.appendChild(el('p', 'iv-aviso info', 'Primero anota tus lanas en el Inventario de lanas para poder elegirlas aquí.'));
      } else {
        var f = el('div', 'pl-fila');
        var sel = el('select', 'pl-sel'); sel.setAttribute('aria-label', 'Lana');
        lanas.forEach(function (l) { var o = el('option', '', l.nombre + ' (' + num(l.ov) + ')'); o.value = l.nombre; sel.appendChild(o); });
        sel.setAttribute('data-no-traducir', '');
        var c = el('input', 'pl-n'); c.type = 'number'; c.min = '0.5'; c.step = '0.5'; c.value = '1'; c.inputMode = 'decimal'; c.setAttribute('aria-label', 'Cuántos ovillos');
        var b = el('button', 'boton-secundario boton-chico', '➕ Agregar a la lista'); b.type = 'button';
        b.addEventListener('click', function () {
          var n = parseFloat(String(c.value).replace(',', '.')); if (!(n > 0)) { msg.textContent = T('Escribe cuántos ovillos (un número mayor que 0).'); msg.hidden = false; return; }
          delete errores[sin(nom)];
          lista(nom).push({ id: 'p' + Date.now().toString(36) + Math.floor(Math.random() * 1000), lana: sel.value, n: n, hecho: false }); N.guardar();
        });
        f.appendChild(sel); f.appendChild(c); f.appendChild(b); td.appendChild(f);
      }
      var pend = items.filter(function (i) { return !i.hecho; });
      if (pend.length && terminado(k)) {
        var d = el('button', 'boton-primario boton-chico', 'Descontar del inventario'); d.type = 'button';
        d.addEventListener('click', function () {
          var l = lista(nom); delete errores[sin(nom)];
          for (var j = 0; j < l.length; j++) {
            if (l[j].hecho) continue;
            var e = window.lrInvMov.descontar(l[j].lana, l[j].n, 'Proyecto: ' + nom);
            if (e) { errores[sin(nom)] = e; msg.textContent = e; msg.hidden = false; N.guardar(); return; }
            l[j].hecho = true; N.guardar();
          }
        });
        td.appendChild(d);
      } else if (pend.length) td.appendChild(el('p', 'iv-aviso info', 'Cuando el proyecto esté «Terminado» podrás descontar esta lana del inventario.'));
      td.appendChild(msg);
    });
  }
  /* en cada ficha del inventario: cuántos ovillos de esa lana están apartados para proyectos y cuántos quedan libres */
  var inv = document.getElementById('tabla-lanas');
  function pintarInv() {
    if (!inv || !window.lrInvMov) return;
    var ap = apartadas();
    inv.querySelectorAll('tr.ficha').forEach(function (tr) {
      var k = +tr.getAttribute('data-fila'), nom = window.lrInvMov.nombre(k), td = tr.querySelector('td.iv-apartada'), tot = nom ? (ap[sin(nom)] || 0) : 0;
      if (!tot) { if (td) td.remove(); return; }
      if (!td) { td = el('td', 'iv-apartada no-imprimir'); td.setAttribute('data-col', 'apartada'); var ref = tr.querySelector('td.iv-mov') || tr.querySelector('td.celda-cal') || tr.querySelector('td.ficha-acciones'); tr.insertBefore(td, ref); }
      var st = stockDe(nom) || 0, libres = Math.round((st - tot) * 10) / 10;
      td.textContent = '';
      var p = el('p', 'iv-aviso ' + (libres < 0 ? 'mal' : 'info'), T(libres < 0 ? 'Apartados para proyectos: ' + num(tot) + ' · te faltan ' + num(-libres) + ' ovillo(s).' : 'Apartados para proyectos: ' + num(tot) + ' · libres: ' + num(libres) + '.'));
      p.setAttribute('data-no-traducir', ''); td.appendChild(p);
    });
  }
  var espera = 0;
  function programar() { clearTimeout(espera); espera = setTimeout(function () { pintar(); pintarInv(); }, 250); }
  document.addEventListener('agenda-guardada', programar);
  new MutationObserver(programar).observe(tf, { childList: true });
  new MutationObserver(programar).observe(document.getElementById('proyectos-fila') || tf, { attributes: true, attributeFilter: ['class'] });
  programar();
  if (inv) new MutationObserver(programar).observe(inv, { childList: true });
  window.lrProyLana = { pintar: pintar, pintarInv: pintarInv, apartadas: apartadas, estado: estado };
})();
