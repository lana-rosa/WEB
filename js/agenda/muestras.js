/* Agenda para tejedoras: muestras de lana desde la paleta de la Mercería (28-oct-2026).
   Lista los colores de obtener_paleta_merceria() y agrega una línea («Marca Línea — Color (cód. 2110)») a «Muestras de lana» de la ficha del proyecto. */
(function () {
  'use strict';
  var sel = document.getElementById('muestras-sel'), boton = document.getElementById('muestras-add'), campo = document.getElementById('ag-muestras');
  if (!sel || !campo) return;
  var URL_RPC = 'https://ngjoognzvehwjtpqwrqe.supabase.co/rest/v1/rpc/obtener_paleta_merceria', LLAVE = 'sb_publishable_2TQ_piaHlSMHa79zjmOOXg_6bEwgkKD', lista = [];
  fetch(URL_RPC, { method: 'POST', headers: { apikey: LLAVE, Authorization: 'Bearer ' + LLAVE, 'Content-Type': 'application/json' }, body: '{}' })
    .then(function (r) { if (!r.ok) throw r.status; return r.json(); })
    .then(function (d) {
      if (!d || !d.length) throw 0;
      var grupos = {}; d.forEach(function (p) { var g = [p.marca, p.linea].filter(Boolean).join(' · ') || 'Mercería'; (grupos[g] = grupos[g] || []).push(p); });
      var html = '<option value="">Elige un color de la paleta…</option>';
      Object.keys(grupos).sort().forEach(function (g) {
        html += '<optgroup label="' + g.replace(/"/g, '') + '">' + grupos[g].map(function (p) {
          lista.push(p); var n = String(p.color || '').replace(/\s+\d+\s*$/, '').trim() || p.color;
          return '<option value="' + (lista.length - 1) + '">' + String(n).replace(/</g, '') + (p.codigo_color ? ' (cód. ' + String(p.codigo_color).replace(/</g, '') + ')' : '') + '</option>';
        }).join('') + '</optgroup>';
      });
      sel.innerHTML = html; sel.disabled = false;
    })
    .catch(function () { sel.innerHTML = '<option value="">No pudimos cargar la paleta ahora</option>'; });
  sel.addEventListener('change', function () { boton.disabled = !sel.value; });
  boton.addEventListener('click', function () {
    var p = lista[sel.value]; if (!p) return;
    var n = String(p.color || '').replace(/\s+\d+\s*$/, '').trim() || p.color;
    var linea = [p.marca, p.linea && p.linea.replace(/^Lana\s+/i, '')].filter(Boolean).join(' ') + ' — ' + n + (p.codigo_color ? ' (cód. ' + p.codigo_color + ')' : '');
    campo.value = (campo.value.trim() ? campo.value.replace(/\s+$/, '') + '\n' : '') + linea;
    campo.dispatchEvent(new Event('input', { bubbles: true })); sel.value = ''; boton.disabled = true;
  });
})();
