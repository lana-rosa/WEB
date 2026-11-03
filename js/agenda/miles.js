/* Puntos de miles al escribir dinero (3-nov-2026, pedido de Jennifer: «que se vea con el punto»).
   Mientras la persona escribe, 1500000 pasa a 1.500.000 en las casillas de dinero de la agenda (meta del mes, ventas, gastos, pagos fijos,
   deudas, tarjetas, metas de ahorro, catálogo, inventario, ferias y las columnas de dinero de las fichas). Todos los módulos leen el dinero
   quitando lo que no es dígito, así que el punto no cambia ningún cálculo. No toca días, cuotas, cantidades ni porcentajes. */
(function () {
  'use strict';
  var IDS = /^(fin-v|fm-meta|fm-ah|fp-c|ff-v|fd-cuota|ft-cupo|ft-saldo|ag-fr-costo|ag-fr-vendido|mv-meta|ct-hora)$/;
  var COLS = /^(valor|valorunidad|precio|costoenvio|abono|costo|materiales|empaque)$/;
  function esDinero(e) {
    if (!e || !e.tagName || (e.tagName !== 'INPUT' && e.tagName !== 'TEXTAREA') || e.type === 'number' || e.readOnly) return false;
    if (IDS.test(e.id)) return true;
    var td = e.closest && e.closest('td[data-col]'); if (td && COLS.test(td.dataset.col)) return true;
    if (e.tagName === 'INPUT' && e.getAttribute('inputmode') === 'numeric') { var l = e.closest('label'); if (l && /\$/.test(l.textContent)) return true; }   /* p. ej. «Ahorrado $» de cada meta */
    return false;
  }
  function conPuntos(t) {
    var peso = /^\s*\$/.test(t) ? '$ ' : '', neg = /^\s*(\$\s*)?-/.test(t), d = String(t).replace(/\D/g, '').replace(/^0+(?=\d)/, '');   /* conserva el «$ » de las metas de ahorro */
    return d ? peso + (neg ? '-' : '') + d.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : (peso ? '$ ' : '') + (neg ? '-' : '');
  }
  function formatear(e) {
    var v = e.value, n = conPuntos(v); if (n === v) return;
    var pos = e.selectionStart, ok = typeof pos === 'number' && document.activeElement === e, dig = 0;
    if (ok) dig = v.slice(0, pos).replace(/\D/g, '').length;
    e.value = n;
    if (ok) { var i = 0, c = 0; while (i < n.length && c < dig) { if (/\d/.test(n.charAt(i))) c++; i++; } try { e.setSelectionRange(i, i); } catch (x) {} }
  }
  /* en fase de captura: así los módulos que guardan al escribir ya reciben el valor con puntos */
  document.addEventListener('input', function (ev) { if (esDinero(ev.target)) formatear(ev.target); }, true);
  /* al salir de la casilla: también lo escrito antes (sin puntos) queda con puntos */
  document.addEventListener('focusout', function (ev) {
    var e = ev.target; if (!esDinero(e) || !e.value) return; var n = conPuntos(e.value);
    if (n !== e.value) { e.value = n; e.dispatchEvent(new Event('input', { bubbles: true })); }
  }, true);
  window.lrMiles = { conPuntos: conPuntos };
})();
