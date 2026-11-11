/* Agenda para tejedoras: avisos claros al escribir (E34, 12-nov-2026; idea tomada de comparar con otra agenda, textos y diseño propios).
   1) Pedidos: valor por unidad, costo de envío, total de la compra y abono no pueden ser negativos. Al escribir un signo menos se quita solo y sale «No puede ser negativo…».
      Si ya hay un valor negativo guardado de antes, no se cambia: sale un aviso fijo «Este valor es negativo: corrígelo.» hasta que la persona lo arregle.
   2) Mis clientas: si el WhatsApp de una clienta ya lo tiene otra (mismos últimos 10 dígitos), sale «Ya tienes a … con este WhatsApp.». Solo avisa: no bloquea ni cambia nada.
   (El saldo del pedido nunca baja de $0: está en pedidos.js; el aviso «El abono es mayor que el total» está en abonos.js.) No guarda nada propio. */
(function () {
  'use strict';
  var N = window.lrAgendaNucleo;
  if (!N) return;
  var MONEDA = /^ag-p\d+-(valorunidad|costoenvio|totalcompra|abono)$/, TIENE_MENOS = /[-−–—]/, MENOS = /[-−–—]/g;
  function el(tag, cls, t) { var e = document.createElement(tag); if (cls) e.className = cls; if (t != null) e.textContent = t; return e; }
  function T(t) { return window.lrI18n && window.lrI18n.t ? window.lrI18n.t(t) : t; }
  function limpiar(t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim(); }
  function d10(t) { var d = String(t || '').replace(/\D/g, ''); return d.length >= 10 ? d.slice(-10) : ''; }
  function aviso(td, cls, texto) { var p = td.querySelector('.' + cls); if (!texto) { if (p) p.remove(); return; } if (!p) { p = el('p', 'iv-aviso mal val-aviso ' + cls); p.setAttribute('role', 'status'); td.appendChild(p); } if (p.textContent !== texto) p.textContent = texto; }

  /* 1) sin signo menos en el dinero del pedido (en fase de captura, antes de que otros módulos lean el valor) */
  var timers = {};
  document.addEventListener('input', function (ev) {
    var e = ev.target; if (!e || !MONEDA.test(e.id || '') || !TIENE_MENOS.test(e.value)) return;
    var pos = typeof e.selectionStart === 'number' ? e.selectionStart : null, antes = pos === null ? 0 : (e.value.slice(0, pos).match(MENOS) || []).length;
    e.value = e.value.replace(MENOS, '');
    if (pos !== null && document.activeElement === e) { try { e.setSelectionRange(pos - antes, pos - antes); } catch (x) {} }
    var td = e.closest('td'); if (!td) return;
    aviso(td, 'val-neg', T('No puede ser negativo. Quité el signo menos.'));
    clearTimeout(timers[e.id]); timers[e.id] = setTimeout(function () { aviso(td, 'val-neg', ''); }, 6000);
  }, true);
  document.addEventListener('focusout', function (ev) {   // al salir de la casilla, el aviso de «quité el signo» ya cumplió
    var e = ev.target; if (!e || !MONEDA.test(e.id || '')) return; var td = e.closest('td'); if (td) aviso(td, 'val-neg', '');
  }, true);
  function negativosGuardados() {
    var tp = document.getElementById('tabla-pedidos'); if (!tp) return;
    tp.querySelectorAll('textarea, input').forEach(function (e) {
      if (!MONEDA.test(e.id || '')) return; var td = e.closest('td'); if (!td) return;
      var neg = /^\s*(\$\s*)?[-−–—]/.test(e.value) || (parseInt(String(e.value).replace(/[^0-9-]/g, ''), 10) < 0);
      aviso(td, 'val-neg-fijo', neg ? T('Este valor es negativo: corrígelo.') : '');
    });
  }

  /* 2) WhatsApp repetido entre clientas */
  function repetidos() {
    var t = N.tablas['tabla-clientas']; if (!t) return;
    var filas = [], k; for (k = 1; k <= t.n; k++) { var nom = document.getElementById(t.prefijo + k + '-nombre'), wa = document.getElementById(t.prefijo + k + '-whatsapp'); if (!nom || !wa) continue; filas.push({ k: k, nombre: nom.value.trim(), tel: d10(wa.value), wa: wa }); }
    filas.forEach(function (f) {
      var td = f.wa.closest('td'); if (!td) return;
      var otros = f.tel && f.nombre ? filas.filter(function (o) { return o.k !== f.k && o.tel === f.tel && o.nombre; }) : [];
      aviso(td, 'val-wa', otros.length ? T('Ya tienes a «' + otros.map(function (o) { return o.nombre; }).join('», «') + '» con este WhatsApp.') : '');
      var p = td.querySelector('.val-wa'); if (p) { p.classList.remove('mal'); p.classList.add('alerta'); p.setAttribute('data-no-traducir', ''); }
    });
  }

  var espera = 0;
  function programar() { clearTimeout(espera); espera = setTimeout(function () { negativosGuardados(); repetidos(); }, 350); }
  document.addEventListener('agenda-guardada', programar);
  document.addEventListener('input', programar);
  ['control-pedidos', 'mis-clientas'].forEach(function (id) { var h = document.getElementById(id); if (h) new MutationObserver(programar).observe(h, { attributes: true, attributeFilter: ['class'] }); });
  ['tabla-pedidos', 'tabla-clientas'].forEach(function (id) { var t = document.getElementById(id); if (t) new MutationObserver(programar).observe(t, { childList: true }); });
  programar();
  window.lrValidar = { revisar: function () { negativosGuardados(); repetidos(); } };
})();
