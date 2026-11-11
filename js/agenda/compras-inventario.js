/* Agenda para tejedoras: Lista de compras → Inventario de lanas (E34, 12-nov-2026; idea tomada de comparar con otra agenda, textos y diseño propios).
   Al marcar «Comprado» en un material de la Lista de compras que trae cantidad:
   · si coincide con UNA lana del inventario (su marca y su color están en el material y el color), suma esos ovillos como «Compré» (queda en los movimientos con «Lista de compras») y avisa con «Deshacer»;
   · si no coincide (o es otra cosa, como relleno u ojos), no toca nada: en la ficha sale «Pasar al inventario» para hacerlo a propósito (crea la lana nueva o suma a la que se parezca).
   No anota gasto por su cuenta. Cada compra pasa una sola vez: queda en `datos._compraInv['cN'] = { n, lana, mov }` (copias, nube y Drive). Desmarcar «Comprado» no quita nada: se usa «Deshacer».
   Necesita inventario-mov.js (window.lrInvMov). */
(function () {
  'use strict';
  var N = window.lrAgendaNucleo, tc = document.getElementById('tabla-compras');
  if (!N || !tc || !N.tablas['tabla-compras'] || !N.tablas['tabla-lanas']) return;
  var CP = N.tablas['tabla-compras'], IT = N.tablas['tabla-lanas'], avisoTimer = 0;
  function el(tag, cls, t) { var e = document.createElement(tag); if (cls) e.className = cls; if (t != null) e.textContent = t; return e; }
  function T(t) { return window.lrI18n && window.lrI18n.t ? window.lrI18n.t(t) : t; }
  function sin(t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim(); }
  function num(n) { return String(Math.round(n * 10) / 10).replace('.', ','); }
  function vc(k, c) { var e = document.getElementById(CP.prefijo + k + '-' + c); return e ? (e.type === 'checkbox' ? (e.checked ? '1' : '') : e.value.trim()) : ''; }
  function vi(k, c) { var e = document.getElementById(IT.prefijo + k + '-' + c); return e ? e.value.trim() : ''; }
  function cantidad(t) { var m = /(\d+(?:[.,]\d+)?)/.exec(String(t || '')); var n = m ? parseFloat(m[1].replace(',', '.')) : 0; return n > 0 ? n : 0; }
  function mapa() { var d = N.datos(); if (!d._compraInv || typeof d._compraInv !== 'object' || Array.isArray(d._compraInv)) d._compraInv = {}; return d._compraInv; }
  function refrescar() { N.guardar(); if (window.lrFichas && window.lrFichas.refrescar) window.lrFichas.refrescar(); }

  /* lanas del inventario cuya marca y color aparecen en el material y el color de la compra */
  function parecidas(k) {
    if (!window.lrInvMov) return [];
    var txt = sin(vc(k, 'material') + ' ' + vc(k, 'color'));
    return window.lrInvMov.lanas().filter(function (l) {
      var marca = sin(vi(l.k, 'marca')), color = sin(vi(l.k, 'color')), tok = [marca, color].filter(Boolean);
      return tok.length && tok.every(function (t) { return txt.indexOf(t) >= 0; });
    });
  }
  function sumar(k, lana, n) {
    var e = window.lrInvMov.registrar(lana.k, 'c', n, 'Lista de compras', false); if (e) return e;
    mapa()['c' + k] = { n: n, lana: lana.nombre, mov: window.lrInvMov.ultimoId() }; refrescar(); return '';
  }
  function nuevaLana(k, n) {
    var f = 0, r; for (r = 1; r <= IT.n; r++) if (!vi(r, 'marca') && !vi(r, 'color') && !vi(r, 'ovillos')) { f = r; break; }
    if (!f) { if (!N.agregarRenglon('tabla-lanas')) return null; f = IT.n; }
    var marca = vc(k, 'material').replace(/^lana\s+/i, '').slice(0, 40), color = vc(k, 'color').slice(0, 40);
    [['marca', marca], ['color', color]].forEach(function (p) { var e = document.getElementById(IT.prefijo + f + '-' + p[0]); if (e) { e.value = p[1]; N.datos()[e.id] = p[1]; } });
    var lana = { k: f, nombre: window.lrInvMov.nombre(f) };
    return lana.nombre ? lana : null;
  }
  function aviso(texto) {
    var hoja = document.getElementById('lista-compras') || tc.closest('article, section') || document.body, p = hoja.querySelector('.compras-inv-ok');
    if (!p) { p = el('p', 'compras-inv-ok aviso-cal no-imprimir'); p.setAttribute('role', 'status'); var ref = hoja.querySelector('header'); if (ref) ref.insertAdjacentElement('afterend', p); else hoja.insertBefore(p, hoja.firstChild); }
    p.textContent = '✔ ' + texto; clearTimeout(avisoTimer); avisoTimer = setTimeout(function () { p.remove(); }, 8000);
  }

  /* al marcar «Comprado» */
  tc.addEventListener('change', function (e) {
    var m = /-c(\d+)-comprado$/.exec(e.target.id || ''); if (!m || !e.target.checked || !window.lrInvMov) return;
    var k = +m[1], n = cantidad(vc(k, 'cantidad')); if (mapa()['c' + k] || !vc(k, 'material') || !n) return;
    var cand = parecidas(k); if (cand.length !== 1) return;   // sin coincidencia clara no se toca nada: queda el botón «Pasar al inventario»
    var err = sumar(k, cand[0], n); if (!err) aviso('Sumé ' + num(n) + ' ovillo(s) a ' + cand[0].nombre + ' en tu inventario.');
  });

  /* en la ficha del material */
  function pintar() {
    tc.querySelectorAll('tr.ficha').forEach(function (tr) {
      var k = +tr.getAttribute('data-fila'), td = tr.querySelector('td.cp-inv'), hecho = mapa()['c' + k], comprado = !!vc(k, 'comprado'), n = cantidad(vc(k, 'cantidad'));
      if (!vc(k, 'material') || (!hecho && !(comprado && n)) || !window.lrInvMov) { if (td) td.remove(); return; }
      if (!td) { td = el('td', 'cp-inv no-imprimir'); td.setAttribute('data-col', 'inventario'); tr.insertBefore(td, tr.querySelector('td.celda-cal') || tr.querySelector('td.ficha-acciones')); }
      var ac = document.activeElement; if (ac && ac.tagName === 'INPUT' && td.contains(ac)) return;
      td.textContent = '';
      var msg = el('p', 'iv-aviso mal'); msg.setAttribute('role', 'alert'); msg.hidden = true;
      if (hecho) {
        var p = el('p', 'iv-aviso bien', T('✔ Ya entró al inventario: +' + num(hecho.n) + ' de ' + hecho.lana + '.')); p.setAttribute('data-no-traducir', ''); td.appendChild(p);
        var u = el('button', 'enlace-copia', 'Deshacer'); u.type = 'button';
        u.addEventListener('click', function () { window.lrInvMov.deshacerId(hecho.mov); delete mapa()['c' + k]; refrescar(); });
        td.appendChild(u); return;
      }
      var cand = parecidas(k), b = el('button', 'boton-secundario boton-chico', '🧶 Pasar al inventario'); b.type = 'button';
      td.appendChild(el('p', 'pl-t', 'Inventario de lanas'));
      td.appendChild(el('p', 'cp-nota', cand.length ? 'Esta compra se parece a «' + cand[0].nombre + '». Súmala a esa lana.' : 'Si es una lana, pásala al inventario como lana nueva con ' + num(n) + ' ovillo(s).'));
      b.addEventListener('click', function () {
        var lana = cand[0] || nuevaLana(k, n); if (!lana) { msg.textContent = T('No pude crear la lana. Revisa que el material tenga nombre.'); msg.hidden = false; return; }
        var e2 = sumar(k, lana, n); if (e2) { msg.textContent = e2; msg.hidden = false; } else aviso('Sumé ' + num(n) + ' ovillo(s) a ' + lana.nombre + ' en tu inventario.');
      });
      td.appendChild(b); td.appendChild(msg);
    });
  }
  var espera = 0;
  function programar() { clearTimeout(espera); espera = setTimeout(pintar, 300); }
  document.addEventListener('agenda-guardada', programar);
  new MutationObserver(programar).observe(tc, { childList: true });
  var h = document.getElementById('lista-compras'); if (h) new MutationObserver(programar).observe(h, { attributes: true, attributeFilter: ['class'] });
  programar();
  window.lrComprasInv = { pintar: pintar };
})();
