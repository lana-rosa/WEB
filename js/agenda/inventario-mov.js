/* Agenda para tejedoras: movimientos del inventario de lanas (Plus para emprendedoras, etapa 8, 2-nov-2026).
   En «Inventario de lanas e hilos», cada ficha tiene «Compré» y «Usé»: suman o restan ovillos de la casilla «Ovillos» y dejan anotado el movimiento
   (fecha, cantidad y para qué) en `datos._lanaMovs` (entra solo en copias, nube, Drive y Excel de respaldo). Se ve el historial de esa lana, se puede deshacer el último
   movimiento y arriba, en «Tu inventario en números», sale lo que se compró y se usó este mes. Conexión con proyectos: en «Proyectos» (hoja de la fila), al marcar un
   proyecto como terminado sale «¿Gastaste lana en este proyecto?», que abre el inventario con el nombre del proyecto ya escrito en «¿Para qué?» (no descuenta nada solo:
   la persona dice cuánto usó). La lana se reconoce por «marca · color» (sin tildes ni mayúsculas): si se cambia el nombre, el historial viejo queda en el mes pero no en la ficha. */
(function () {
  'use strict';
  var N = window.lrAgendaNucleo, hoja = document.getElementById('inventario-lanas');
  if (!N || !hoja || !N.tablas['tabla-lanas']) return;
  var IT = N.tablas['tabla-lanas'], sugerido = '';
  function el(tag, cls, t) { var e = document.createElement(tag); if (cls) e.className = cls; if (t != null) e.textContent = t; return e; }
  function sin(t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim(); }
  function plata(x) { return '$ ' + Math.round(x).toLocaleString('es-CO'); }
  function campo(k, c) { return document.getElementById(IT.prefijo + k + '-' + c); }
  function v(k, c) { var e = campo(k, c); return e ? e.value.trim() : ''; }
  function cant(t) { var s = String(t == null ? '' : t).trim(); if (!s) return null; var m = /(\d+(?:[.,]\d+)?)/.exec(s); return m ? parseFloat(m[1].replace(',', '.')) : null; }
  function dinero(t) { var n = parseInt(String(t == null ? '' : t).replace(/[^0-9]/g, ''), 10); return isFinite(n) ? n : 0; }
  function nombre(k) { return [v(k, 'marca'), v(k, 'color')].filter(Boolean).join(' · '); }
  function hoy() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function lista() { var d = N.datos(); if (!Array.isArray(d._lanaMovs)) d._lanaMovs = []; return d._lanaMovs; }
  function fmt(f) { var p = String(f || '').split('-'); return p.length === 3 ? p[2] + '/' + p[1] : ''; }
  function T(t) { return window.lrI18n && window.lrI18n.t ? window.lrI18n.t(t) : t; }
  function num(n) { return String(Math.round(n * 10) / 10).replace('.', ','); }

  function ponerOvillos(k, valor) {
    var e = campo(k, 'ovillos'); if (!e) return false;
    e.value = String(Math.round(valor * 10) / 10).replace(',', '.'); e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); return true;
  }
  function registrar(k, tipo, n, para) {
    var nom = nombre(k); if (!nom) return T('Escribe primero la marca o el color de esta lana.');
    if (!(n > 0)) return T('Escribe cuántos ovillos (un número mayor que 0).');
    var actual = cant(v(k, 'ovillos')); if (actual == null) actual = 0;
    if (tipo === 'u' && n > actual) return T('Solo tienes ' + num(actual) + ' ovillo(s) de esta lana.');
    var nuevo = tipo === 'c' ? actual + n : actual - n;
    if (!ponerOvillos(k, nuevo)) return T('No pude cambiar los ovillos.');
    lista().push({ id: 'm' + Date.now().toString(36) + Math.floor(Math.random() * 1000), f: hoy(), t: tipo, n: n, lana: nom, para: String(para || '').slice(0, 60), costo: dinero(v(k, 'costo')) });
    N.guardar(); return '';
  }
  function deshacer(k) {
    var nom = sin(nombre(k)), l = lista(), i = -1;
    for (var j = l.length - 1; j >= 0; j--) if (sin(l[j].lana) === nom) { i = j; break; }
    if (i < 0) return;
    var m = l[i], actual = cant(v(k, 'ovillos')) || 0;
    ponerOvillos(k, m.t === 'c' ? Math.max(0, actual - m.n) : actual + m.n); l.splice(i, 1); N.guardar();
  }

  function pintarFichas() {
    hoja.querySelectorAll('#tabla-lanas tr.ficha').forEach(function (tr) {
      var k = +tr.getAttribute('data-fila'), nom = nombre(k), td = tr.querySelector('td.iv-mov');
      if (!nom) { if (td) td.remove(); return; }
      if (!td) { td = el('td', 'iv-mov no-imprimir'); td.setAttribute('data-col', 'movimientos'); var acc = tr.querySelector('td.celda-cal') || tr.querySelector('td.ficha-acciones'); tr.insertBefore(td, acc); }
      var ac = document.activeElement; if (ac && ac.tagName === 'INPUT' && td.contains(ac)) return;   // no se rehace mientras la persona escribe
      td.textContent = '';
      td.appendChild(el('p', 'iv-mov-t', 'Compré o usé ovillos'));
      var f = el('div', 'iv-mov-fila');
      var cantEl = el('input', 'iv-mov-n'); cantEl.type = 'number'; cantEl.min = '0.5'; cantEl.step = '0.5'; cantEl.value = '1'; cantEl.inputMode = 'decimal'; cantEl.setAttribute('aria-label', 'Cuántos ovillos');
      var paraEl = el('input', 'iv-mov-para'); paraEl.type = 'text'; paraEl.maxLength = 60; paraEl.placeholder = '¿Para qué? (opcional)'; paraEl.setAttribute('aria-label', '¿Para qué?'); if (sugerido) paraEl.value = sugerido;
      var bc = el('button', 'boton-secundario boton-chico', '➕ Compré'), bu = el('button', 'boton-secundario boton-chico', '➖ Usé'); bc.type = bu.type = 'button';
      var msg = el('p', 'iv-aviso mal'); msg.setAttribute('role', 'alert'); msg.hidden = true;
      function hacer(t) { var e = registrar(k, t, parseFloat(String(cantEl.value).replace(',', '.')), paraEl.value); if (e) { msg.textContent = e; msg.hidden = false; } else sugerido = ''; }
      bc.addEventListener('click', function () { hacer('c'); }); bu.addEventListener('click', function () { hacer('u'); });
      f.appendChild(cantEl); f.appendChild(bc); f.appendChild(bu); td.appendChild(f); td.appendChild(paraEl); td.appendChild(msg);
      var mios = lista().filter(function (m) { return sin(m.lana) === sin(nom); }).slice(-4).reverse();
      if (mios.length) {
        var ul = el('ul', 'iv-mov-lista'); ul.setAttribute('data-no-traducir', '');
        mios.forEach(function (m) { ul.appendChild(el('li', m.t === 'c' ? 'c' : 'u', fmt(m.f) + ' · ' + (m.t === 'c' ? '+' : '−') + num(m.n) + (m.t === 'c' ? ' compré' : ' usé') + (m.para ? ' · ' + m.para : ''))); });
        td.appendChild(ul);
        var un = el('button', 'enlace-copia', 'Deshacer el último movimiento'); un.type = 'button'; un.addEventListener('click', function () { deshacer(k); }); td.appendChild(un);
      }
    });
  }

  /* resumen del mes (lo pide inventario.js para «Tu inventario en números») */
  function resumenMes() {
    var d = new Date(), pref = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2), c = 0, u = 0, gasto = 0, usos = 0;
    lista().forEach(function (m) { if (String(m.f).slice(0, 7) !== pref) return; if (m.t === 'c') { c += m.n; gasto += m.n * (m.costo || 0); } else { u += m.n; usos++; } });
    if (!c && !u) return null;
    var p = el('p', 'iv-mov-mes'); p.setAttribute('data-no-traducir', '');
    p.textContent = T('Este mes compraste ' + num(c) + ' ovillo(s)' + (gasto ? ' (≈ ' + plata(gasto) + ')' : '') + ' y usaste ' + num(u) + ' ovillo(s).');
    return p;
  }

  /* desde un proyecto terminado: abre el inventario con el nombre del proyecto en «¿Para qué?» */
  var tf = document.getElementById('tabla-fila');
  function avisoProyecto() {
    if (!tf) return;
    tf.querySelectorAll('tr.ficha').forEach(function (tr) {
      var k = +tr.getAttribute('data-fila'), est = document.getElementById('ag-f' + k + '-estado'), nom = (document.getElementById('ag-f' + k + '-proyecto') || {}).value || '';
      var aviso = tr.querySelector('.iv-proy'), terminado = est && /terminad/i.test(est.value) && nom.trim();
      if (!terminado) { if (aviso) aviso.remove(); return; }
      if (aviso) return;
      var cuerpo = tr.querySelector('td.ficha-acciones') || tr.lastElementChild;
      var b = el('button', 'boton-secundario boton-chico iv-proy no-imprimir', '🧶 ¿Gastaste lana en este proyecto?'); b.type = 'button';
      b.addEventListener('click', function () { sugerido = nom.trim().slice(0, 60); if (window.lrIrAHoja) window.lrIrAHoja('inventario-lanas'); setTimeout(pintarFichas, 200); });
      (cuerpo.parentNode === tr ? tr : cuerpo).insertBefore(b, cuerpo.parentNode === tr ? cuerpo : cuerpo.firstChild);
    });
  }

  var espera = 0;
  function programar() { clearTimeout(espera); espera = setTimeout(function () { if (hoja.classList.contains('abierta')) pintarFichas(); avisoProyecto(); }, 200); }
  document.addEventListener('agenda-guardada', programar);
  new MutationObserver(function () { if (hoja.classList.contains('abierta')) programar(); }).observe(hoja, { attributes: true, attributeFilter: ['class'] });
  var tb = document.getElementById('tabla-lanas'); if (tb) new MutationObserver(function (r) { if (r.some(function (x) { return [].some.call(x.addedNodes, function (n) { return n.nodeName === 'TR'; }); })) programar(); }).observe(tb, { childList: true });
  if (tf) new MutationObserver(programar).observe(tf, { childList: true });
  programar();
  window.lrInvMov = { resumenMes: resumenMes, registrar: registrar, pintar: pintarFichas };
})();
