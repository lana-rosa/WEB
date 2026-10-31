/* Agenda para tejedoras: inventario de lanas con costo y mínimo (Plus para emprendedoras, etapa 5, 31-oct-2026).
   En «Inventario de lanas e hilos» cada ficha lleva ahora «Costo por ovillo ($)» y «Avísame si quedan menos de (ovillos)».
   Arriba de la lista sale un resumen: cuánto dinero tienes en lana (ovillos × costo), cuántos ovillos hay y qué lanas se están acabando.
   En cada ficha se ve el valor de esa lana y un aviso si llegó a su mínimo. Solo lee lo escrito: lo que la persona anota (costo y mínimo) queda en las casillas de siempre.
   La conexión con la Lista de compras está en conexiones.js (lanas en 0 o por debajo de su mínimo). API: window.lrInventario.resumen(). */
(function () {
  'use strict';
  var N = window.lrAgendaNucleo, hoja = document.getElementById('inventario-lanas');
  if (!N || !hoja || !N.tablas['tabla-lanas']) return;
  var IT = N.tablas['tabla-lanas'];
  function el(tag, cls, t) { var e = document.createElement(tag); if (cls) e.className = cls; if (t != null) e.textContent = t; return e; }
  function plata(x) { return '$ ' + Math.round(x).toLocaleString('es-CO'); }
  function dinero(t) { var n = parseInt(String(t == null ? '' : t).replace(/[^0-9]/g, ''), 10); return isFinite(n) ? n : 0; }
  function cant(t) { var s = String(t == null ? '' : t).trim(); if (!s) return null; var m = /(\d+(?:[.,]\d+)?)/.exec(s); return m ? parseFloat(m[1].replace(',', '.')) : null; }
  function campo(k, c) { return document.getElementById(IT.prefijo + k + '-' + c); }
  function v(k, c) { var e = campo(k, c); return e ? e.value.trim() : ''; }
  function nombre(k) { return [v(k, 'marca'), v(k, 'color')].filter(Boolean).join(' · '); }

  function de(k) {
    var marca = v(k, 'marca'), color = v(k, 'color'), ov = cant(v(k, 'ovillos')), costo = dinero(v(k, 'costo')), min = cant(v(k, 'minimo'));
    if (!marca && !color && ov == null && !costo) return null;
    var cero = ov != null && ov === 0, bajo = ov != null && min != null && min > 0 && ov <= min;
    return { k: k, nombre: nombre(k) || 'Lana sin nombre', ov: ov, costo: costo, min: min, valor: (ov != null && costo) ? ov * costo : 0,
      tieneValor: ov != null && costo > 0, sinCosto: ov != null && ov > 0 && !costo, cero: cero, bajo: bajo && !cero, porAcabar: cero || bajo };
  }
  function todas() { var out = []; for (var k = 1; k <= IT.n; k++) { var c = de(k); if (c) out.push(c); } return out; }
  function resumen() {
    var l = todas(), valor = 0, ovillos = 0, conCosto = 0, ovConCosto = 0;
    l.forEach(function (c) { if (c.ov) ovillos += c.ov; if (c.tieneValor) { valor += c.valor; conCosto++; ovConCosto += c.ov; } });
    return { lanas: l, valor: valor, ovillos: ovillos, conCosto: conCosto, sinCosto: l.filter(function (c) { return c.sinCosto; }).length,
      promedio: ovConCosto ? valor / ovConCosto : 0, porAcabar: l.filter(function (c) { return c.porAcabar; }) };
  }

  /* ---- resumen arriba de la lista ---- */
  var tarjeta = null;
  function asegurarTarjeta() {
    if (tarjeta && tarjeta.isConnected) return tarjeta;
    tarjeta = el('section', 'iv-resumen no-imprimir'); tarjeta.id = 'inv-resumen'; tarjeta.setAttribute('aria-label', 'Resumen de tu inventario');
    var ref = hoja.querySelector('.tabla-scroll'); if (!ref) return null; ref.parentNode.insertBefore(tarjeta, ref); return tarjeta;
  }
  function kpi(t, valor, nota, cls) { var d = el('div', 'iv-kpi' + (cls ? ' ' + cls : '')); d.appendChild(el('span', 'iv-k', t)); d.appendChild(el('b', 'iv-v', valor)); if (nota) d.appendChild(el('small', 'iv-n', nota)); return d; }
  function pintarResumen() {
    var t = asegurarTarjeta(); if (!t) return;
    var r = resumen(); t.textContent = '';
    if (!r.lanas.length) { t.hidden = true; return; }
    t.hidden = false;
    t.appendChild(el('h4', 'cl-titulo', 'Tu inventario en números'));
    var fila = el('div', 'iv-fila');
    fila.appendChild(kpi('Dinero en lana', r.conCosto ? plata(r.valor) : '—', r.conCosto ? (r.sinCosto ? 'Sin contar ' + r.sinCosto + (r.sinCosto === 1 ? ' lana sin costo' : ' lanas sin costo') : 'Ovillos × costo de cada uno') : 'Anota el costo de cada ovillo'));
    fila.appendChild(kpi('Ovillos', String(Math.round(r.ovillos * 10) / 10), r.lanas.length + (r.lanas.length === 1 ? ' lana distinta' : ' lanas distintas')));
    fila.appendChild(kpi('Costo promedio por ovillo', r.promedio ? plata(r.promedio) : '—', r.promedio ? '' : 'Aparece cuando anotas costos'));
    fila.appendChild(kpi('Por acabarse', String(r.porAcabar.length), r.porAcabar.length ? 'Mira cuáles abajo' : 'Todo con existencias', r.porAcabar.length ? 'iv-alerta' : ''));
    t.appendChild(fila);
    if (r.porAcabar.length) {
      var ul = el('ul', 'iv-lista');
      r.porAcabar.slice(0, 6).forEach(function (c) {
        var li = el('li'); var n = el('span', 'iv-nombre', c.nombre); n.setAttribute('data-no-traducir', ''); li.appendChild(n);
        li.appendChild(el('b', '', c.cero ? 'Se acabó' : (c.ov === 1 ? 'Queda 1' : 'Quedan ' + c.ov)));
        ul.appendChild(li);
      });
      t.appendChild(ul);
      if (r.porAcabar.length > 6) t.appendChild(el('p', 'iv-mas', 'Y ' + (r.porAcabar.length - 6) + ' más.'));
    }
    if (!r.conCosto) t.appendChild(el('p', 'iv-nota', 'Si anotas lo que pagaste por cada ovillo, la agenda te dice cuánto dinero tienes guardado en lana. Y con «Avísame si quedan menos de», te avisa antes de que se acabe.'));
  }

  /* ---- cálculo dentro de cada ficha ---- */
  function pintarFichas() {
    hoja.querySelectorAll('#tabla-lanas tr.ficha').forEach(function (tr) {
      var k = +tr.getAttribute('data-fila'), c = de(k), td = tr.querySelector('td.iv-calculo');
      if (!c || (!c.costo && !c.min && !c.porAcabar)) { if (td) td.remove(); return; }
      if (!td) { td = el('td', 'iv-calculo no-imprimir'); td.setAttribute('data-col', 'calculo'); var acc = tr.querySelector('td.celda-cal') || tr.querySelector('td.ficha-acciones'); tr.insertBefore(td, acc); }
      td.textContent = '';
      if (c.tieneValor) { var p = el('p', 'iv-linea'); p.appendChild(el('span', '', 'Valor de esta lana')); p.appendChild(el('b', '', plata(c.valor))); td.appendChild(p); }
      else if (c.costo && c.ov == null) td.appendChild(el('p', 'iv-aviso info', 'Anota cuántos ovillos tienes para ver su valor.'));
      if (c.cero) td.appendChild(el('p', 'iv-aviso mal', 'Se acabó. Puedes pasarla a tu Lista de compras con el aviso de arriba.'));
      else if (c.bajo) td.appendChild(el('p', 'iv-aviso alerta', (c.ov === 1 ? 'Te queda 1 ovillo' : 'Te quedan ' + c.ov + ' ovillos') + ' y tu mínimo es ' + c.min + '. ¿La compras?'));
      else if (c.min && c.ov != null) td.appendChild(el('p', 'iv-aviso bien', 'Tienes más de tu mínimo (' + c.min + ').'));
    });
  }
  function pintarTodo() { pintarResumen(); pintarFichas(); }
  var espera = 0;
  function programar() { clearTimeout(espera); espera = setTimeout(function () { if (hoja.classList.contains('abierta')) pintarTodo(); }, 150); }
  document.addEventListener('agenda-guardada', programar);
  new MutationObserver(function () { if (hoja.classList.contains('abierta')) programar(); }).observe(hoja, { attributes: true, attributeFilter: ['class'] });
  var tb = document.getElementById('tabla-lanas'); if (tb) new MutationObserver(function (r) { if (r.some(function (x) { return [].some.call(x.addedNodes, function (n) { return n.nodeName === 'TR'; }); })) programar(); }).observe(tb, { childList: true });
  if (hoja.classList.contains('abierta')) programar();
  window.lrInventario = { resumen: resumen, pintar: pintarTodo };
  document.dispatchEvent(new Event('inventario-listo'));
})();
