/* Agenda para tejedoras: abonos de cada pedido (E34, 11-nov-2026; idea tomada de comparar con otra agenda, textos y diseño propios).
   En «Precio y pago» de cada pedido sale «Pagos de este pedido»: cuánto se ha abonado, cuánto falta, la lista de abonos con su fecha y «Registrar abono».
   El campo `ag-pN-abono` SIGUE siendo el total abonado (lo leen Mi panel, el informe, las clientas, el tablero y Excel): registrar un abono lo suma ahí y quitarlo lo resta.
   Lo que la persona ya había escrito en «Abono» queda como «Anticipo anotado» (lo que no está en la lista). No deja registrar más de lo que falta (el saldo).
   La lista vive en `datos._abonos['pN'] = [{ id, f: 'AAAA-MM-DD', v: valor }]` (entra sola en copias, nube y Drive). Si el pedido se vacía, su lista se borra. */
(function () {
  'use strict';
  var N = window.lrAgendaNucleo, tp = document.getElementById('tabla-pedidos');
  if (!N || !tp || !N.tablas['tabla-pedidos']) return;
  var PD = N.tablas['tabla-pedidos'], MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'], errores = {};
  function el(tag, cls, t) { var e = document.createElement(tag); if (cls) e.className = cls; if (t != null) e.textContent = t; return e; }
  function T(t) { return window.lrI18n && window.lrI18n.t ? window.lrI18n.t(t) : t; }
  function campo(k, c) { return document.getElementById(PD.prefijo + k + '-' + c); }
  function num(t) { var n = parseInt(String(t == null ? '' : t).replace(/[^0-9-]/g, ''), 10); return isFinite(n) ? n : null; }
  function pesos(n) { return '$' + Math.round(n).toLocaleString('es-CO'); }
  function val(k, c) { var e = campo(k, c); return e ? e.value.trim() : ''; }
  function hoyTxt() { var f = new Date(); return f.getFullYear() + '-' + (f.getMonth() < 9 ? '0' : '') + (f.getMonth() + 1) + '-' + (f.getDate() < 10 ? '0' : '') + f.getDate(); }
  function fechaCorta(s) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ''); return m ? (+m[3]) + ' ' + MESES[+m[2] - 1] + ' ' + m[1] : ''; }
  function datos() { var d = N.datos(); if (!d._abonos || typeof d._abonos !== 'object' || Array.isArray(d._abonos)) d._abonos = {}; return d._abonos; }
  function lista(k) { var d = datos(); if (!Array.isArray(d['p' + k])) d['p' + k] = []; return d['p' + k]; }
  function vacio(k) { return !val(k, 'cliente') && !val(k, 'pedido') && num(val(k, 'totalcompra')) === null && num(val(k, 'precio')) === null; }
  function total(k) { var t = num(val(k, 'totalcompra')); return t !== null ? t : num(val(k, 'precio')); }
  function leer(k) { var l = datos()['p' + k]; return Array.isArray(l) ? l : []; }
  function suma(k) { return leer(k).reduce(function (s, x) { return s + (+x.v || 0); }, 0); }
  /* escribe el abono como lo haría la persona: así se recalcula el saldo, se guarda y se refrescan las fichas */
  function ponerAbono(k, n) {
    var e = campo(k, 'abono'); if (!e) return; var v = n > 0 ? pesos(n) : ''; e.value = v; N.datos()[e.id] = v;
    e.dispatchEvent(new Event('input', { bubbles: true })); N.guardar(); if (window.lrFichas && window.lrFichas.refrescar) window.lrFichas.refrescar();
  }

  function pintar() {
    tp.querySelectorAll('tr.ficha').forEach(function (tr) {
      var k = +tr.getAttribute('data-fila'), td = tr.querySelector('td.pd-abonos');
      if (vacio(k)) { if (td) td.remove(); var d0 = datos(); if (d0['p' + k]) { delete d0['p' + k]; N.guardar(); } return; }
      if (!td) { td = el('td', 'pd-abonos no-imprimir'); td.setAttribute('data-col', 'pagos'); var ref = tr.querySelector('td[data-col="saldo"]'); tr.insertBefore(td, ref ? ref.nextSibling : tr.querySelector('td.celda-cal')); }
      var ac = document.activeElement; if (ac && ac.tagName === 'INPUT' && td.contains(ac)) return;
      td.textContent = '';
      var tot = total(k), abon = num(val(k, 'abono')) || 0, falta = tot === null ? null : tot - abon, items = leer(k), base = Math.max(0, abon - suma(k)), clave = 'p' + k;
      td.appendChild(el('p', 'pl-t', 'Pagos de este pedido'));
      var res = el('p', 'pd-res'); res.setAttribute('data-no-traducir', '');
      if (tot === null) { res.className = 'pd-res info'; res.removeAttribute('data-no-traducir'); res.textContent = T('Escribe el total de la compra para ver cuánto falta por cobrar.'); }
      else if (falta <= 0 && tot > 0) { res.className = 'pd-res ok'; res.textContent = T('✓ Pagado completo · ' + pesos(abon)); }
      else res.textContent = T('Abonado ' + pesos(abon) + ' de ' + pesos(tot) + ' · Falta ' + pesos(falta));
      td.appendChild(res);
      if (tot !== null && abon > tot) { var ex = el('p', 'iv-aviso mal', 'El abono es mayor que el total de la compra: revisa los valores.'); ex.setAttribute('role', 'alert'); td.appendChild(ex); }
      if (suma(k) > abon) { var ds = el('p', 'iv-aviso mal', 'Cambiaste el abono a mano y ahora es menor que la suma de los pagos de la lista: revisa los valores.'); ds.setAttribute('role', 'alert'); td.appendChild(ds); }
      if (base > 0 || items.length) {
        var ul = el('ul', 'pd-lista'); ul.setAttribute('data-no-traducir', '');
        if (base > 0) { var l0 = el('li'); l0.appendChild(el('span', '', T('Anticipo anotado: ' + pesos(base)))); ul.appendChild(l0); }
        items.forEach(function (it) {
          var li = el('li'); li.appendChild(el('span', '', (fechaCorta(it.f) ? fechaCorta(it.f) + ' · ' : '') + pesos(it.v)));
          var q = el('button', 'enlace-copia', '✕'); q.type = 'button'; q.setAttribute('aria-label', T('Quitar este abono'));
          q.addEventListener('click', function () { var l = lista(k), i = l.findIndex(function (x) { return x.id === it.id; }); if (i < 0) return; var v = +l[i].v || 0; l.splice(i, 1); delete errores[clave]; ponerAbono(k, Math.max(0, (num(val(k, 'abono')) || 0) - v)); });
          li.appendChild(q); ul.appendChild(li);
        });
        td.appendChild(ul);
      }
      var msg = el('p', 'iv-aviso mal'); msg.setAttribute('role', 'alert'); msg.textContent = errores[clave] || ''; msg.hidden = !msg.textContent;
      if (falta === null || falta > 0) {
        var f = el('div', 'pl-fila pd-nuevo');
        var c = el('input', 'pl-n pd-valor'); c.type = 'text'; c.inputMode = 'numeric'; c.placeholder = '$'; c.setAttribute('aria-label', T('Valor del abono'));
        var fe = el('input', 'pd-fecha'); fe.type = 'date'; fe.value = hoyTxt(); fe.setAttribute('aria-label', T('Fecha del abono'));
        var b = el('button', 'boton-secundario boton-chico', '＋ Registrar abono'); b.type = 'button';
        var s = null; if (falta !== null && falta > 0) { s = el('button', 'enlace-copia pd-saldo', 'Poner lo que falta'); s.type = 'button'; s.addEventListener('click', function () { c.value = String(falta); c.focus(); }); }
        b.addEventListener('click', function () {
          var n = num(c.value), fa = total(k) === null ? null : total(k) - (num(val(k, 'abono')) || 0);
          if (!(n > 0)) { errores[clave] = T('Escribe cuánto abonó (un número mayor que 0).'); }
          else if (fa === null) { errores[clave] = T('Primero escribe el total de la compra.'); }
          else if (n > fa) { errores[clave] = 'Ese abono es mayor que lo que falta por cobrar (' + pesos(fa) + '). Escribe un valor menor o igual.'; }
          else { delete errores[clave]; lista(k).push({ id: 'a' + Date.now().toString(36) + Math.floor(Math.random() * 1000), f: fe.value || hoyTxt(), v: n }); ponerAbono(k, (num(val(k, 'abono')) || 0) + n); return; }
          msg.textContent = errores[clave]; msg.hidden = false;
        });
        f.appendChild(c); f.appendChild(fe); f.appendChild(b); td.appendChild(f); if (s) td.appendChild(s);
      }
      td.appendChild(msg);
    });
  }
  var espera = 0;
  function programar() { clearTimeout(espera); espera = setTimeout(pintar, 250); }
  document.addEventListener('agenda-guardada', programar);
  new MutationObserver(programar).observe(tp, { childList: true });
  new MutationObserver(programar).observe(document.getElementById('control-pedidos') || tp, { attributes: true, attributeFilter: ['class'] });
  programar();
  window.lrAbonos = { pintar: pintar };
})();
