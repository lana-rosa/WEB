/* Agenda para tejedoras: cronómetro por proyecto (E34, 11-nov-2026; idea tomada de comparar con otra agenda, textos y diseño propios).
   En la hoja de la fila de proyectos, cada proyecto con nombre tiene «Tiempo tejido»: «Empezar a tejer» / «Parar», y «Sumar» o «Restar» minutos a mano.
   Los datos viven en `datos._proyTiempo[nombre del proyecto sin tildes ni mayúsculas] = { seg: segundos sumados, desde: marca de tiempo (ms) si está corriendo, dias: { 'AAAA-MM-DD': seg } }`
   (empieza con «_»: entra solo en copias, nube y Drive; no son campos `ag-*`). Solo corre un cronómetro a la vez. Una sesión se corta sola a las 12 horas (por si se olvidó parar).
   Si se cambia el nombre del proyecto, el tiempo queda con el nombre viejo (igual que la lana por proyecto).
   API: window.lrCrono.resumen() → { totalSeg, semanaSeg, enMarcha: nombre|null, porProyecto: [{ nombre, seg }] }, window.lrCrono.formato(seg). */
(function () {
  'use strict';
  var N = window.lrAgendaNucleo, tf = document.getElementById('tabla-fila');
  if (!N || !tf || !N.tablas['tabla-fila']) return;
  var PR = N.tablas['tabla-fila'], TOPE = 12 * 3600 * 1000, avisos = {};
  function el(tag, cls, t) { var e = document.createElement(tag); if (cls) e.className = cls; if (t != null) e.textContent = t; return e; }
  function sin(t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim(); }
  function T(t) { return window.lrI18n && window.lrI18n.t ? window.lrI18n.t(t) : t; }
  function v(k, c) { var e = document.getElementById(PR.prefijo + k + '-' + c); return e ? e.value.trim() : ''; }
  function datos() { var d = N.datos(); if (!d._proyTiempo || typeof d._proyTiempo !== 'object' || Array.isArray(d._proyTiempo)) d._proyTiempo = {}; return d._proyTiempo; }
  function reg(nom) { var d = datos(), k = sin(nom); if (!d[k] || typeof d[k] !== 'object') d[k] = { seg: 0, desde: 0, dias: {} }; if (!d[k].dias || typeof d[k].dias !== 'object') d[k].dias = {}; return d[k]; }
  function dos(n) { return (n < 10 ? '0' : '') + n; }
  function hoyTxt(f) { f = f || new Date(); return f.getFullYear() + '-' + dos(f.getMonth() + 1) + '-' + dos(f.getDate()); }
  function formato(seg, conSeg) {
    seg = Math.max(0, Math.round(seg)); var h = Math.floor(seg / 3600), m = Math.floor(seg % 3600 / 60), s = seg % 60;
    return conSeg ? h + ':' + dos(m) + ':' + dos(s) : (h ? h + ' h ' + dos(m) + ' min' : m + ' min');
  }
  function corrido(r) { if (!r.desde) return 0; var ms = Date.now() - r.desde; return ms > 0 ? Math.min(ms, TOPE) / 1000 : 0; }
  function sumarDia(r, seg, fecha) { var f = fecha || hoyTxt(); r.dias[f] = Math.max(0, (r.dias[f] || 0) + seg); if (!r.dias[f]) delete r.dias[f]; }
  function parar(r, auto) {
    if (!r.desde) return; var s = corrido(r), fin = new Date(Math.min(Date.now(), r.desde + TOPE));
    r.seg = (r.seg || 0) + s; sumarDia(r, s, hoyTxt(fin)); r.desde = 0; return s;
  }
  function empezar(nom) {
    var d = datos(), k; for (k in d) if (d[k] && d[k].desde) { parar(d[k]); }
    var r = reg(nom); r.desde = Date.now(); delete avisos[sin(nom)]; N.guardar();
  }
  function ajustar(nom, min) {
    var r = reg(nom), s = min * 60, antes = r.seg || 0, nuevo = Math.max(0, antes + s), real = nuevo - antes;
    r.seg = nuevo; sumarDia(r, real); N.guardar();
  }

  /* resumen para Mi panel y otras hojas */
  function resumen() {
    var d = datos(), tot = 0, sem = 0, marcha = null, lista = [], lim = new Date(); lim.setHours(0, 0, 0, 0); lim.setDate(lim.getDate() - ((lim.getDay() + 6) % 7));   // lunes de esta semana
    var desde = hoyTxt(lim);
    Object.keys(d).forEach(function (k) {
      var r = d[k]; if (!r || typeof r !== 'object') return; var viva = corrido(r), seg = (r.seg || 0) + viva; if (r.desde) marcha = nombreDe(k);
      var s = 0; Object.keys(r.dias || {}).forEach(function (f) { if (f >= desde) s += r.dias[f]; }); sem += s + (r.desde && hoyTxt() >= desde ? viva : 0);
      tot += seg; if (seg > 0) lista.push({ nombre: nombreDe(k), seg: seg });
    });
    lista.sort(function (a, b) { return b.seg - a.seg; });
    return { totalSeg: tot, semanaSeg: sem, enMarcha: marcha, porProyecto: lista };
  }
  function nombreDe(clave) {   // el nombre tal como está escrito hoy en la hoja (si ya no está, la clave)
    for (var k = 1; k <= PR.n; k++) { var n = v(k, 'proyecto'); if (n && sin(n) === clave) return n; } return clave;
  }

  function pintar() {
    tf.querySelectorAll('tr.ficha').forEach(function (tr) {
      var k = +tr.getAttribute('data-fila'), nom = v(k, 'proyecto'), td = tr.querySelector('td.pl-tiempo');
      if (!nom) { if (td) td.remove(); return; }
      if (!td) { td = el('td', 'pl-tiempo no-imprimir'); td.setAttribute('data-col', 'tiempo'); var ant = tr.querySelector('td.pl-lana') || tr.querySelector('td.celda-cal') || tr.querySelector('td.ficha-acciones'); tr.insertBefore(td, ant); }
      var ac = document.activeElement; if (ac && ac.tagName === 'INPUT' && td.contains(ac)) return;
      td.textContent = '';
      var r = reg(nom), corre = !!r.desde, clave = sin(nom);
      td.appendChild(el('p', 'pl-t', 'Tiempo tejido'));
      var rel = el('p', 'ct-reloj' + (corre ? ' corre' : '')); rel.setAttribute('data-no-traducir', '');
      var tx = el('span', 'ct-tiempo', formato((r.seg || 0) + corrido(r), corre)); tx.setAttribute('data-crono', clave); tx.setAttribute('role', 'timer'); rel.appendChild(tx); td.appendChild(rel);
      var b = el('button', corre ? 'boton-secundario boton-chico ct-parar' : 'boton-primario boton-chico ct-empezar', corre ? '⏸ Parar' : '▶ Empezar a tejer'); b.type = 'button';
      b.addEventListener('click', function () { if (corre) { parar(reg(nom)); N.guardar(); } else empezar(nom); });
      td.appendChild(b);
      if (avisos[clave]) { var av = el('p', 'iv-aviso info', avisos[clave]); av.setAttribute('role', 'status'); td.appendChild(av); }
      var f = el('div', 'pl-fila ct-ajuste');
      var c = el('input', 'pl-n ct-min'); c.type = 'number'; c.min = '1'; c.max = '1440'; c.step = '1'; c.value = '15'; c.inputMode = 'numeric'; c.setAttribute('aria-label', 'Minutos');
      var mas = el('button', 'boton-secundario boton-chico', '＋ Sumar'), menos = el('button', 'boton-secundario boton-chico', '－ Restar'); mas.type = menos.type = 'button';
      function leer() { var n = Math.round(parseFloat(String(c.value).replace(',', '.'))); return n > 0 && n <= 1440 ? n : 0; }
      mas.addEventListener('click', function () { var n = leer(); if (n) ajustar(nom, n); });
      menos.addEventListener('click', function () { var n = leer(); if (n) ajustar(nom, -n); });
      f.appendChild(c); f.appendChild(el('span', 'ct-min-t', 'min')); f.appendChild(mas); f.appendChild(menos); td.appendChild(f);
    });
  }
  /* cada segundo solo cambia el texto del reloj que está corriendo (sin repintar la hoja) */
  function tic() {
    var d = datos();
    Object.keys(d).forEach(function (k) {
      var r = d[k]; if (!r || !r.desde) return;
      if (Date.now() - r.desde >= TOPE) { parar(r); avisos[k] = T('El cronómetro se paró solo a las 12 horas. Si hace falta, ajusta los minutos.'); N.guardar(); }
    });
    document.querySelectorAll('[data-crono]').forEach(function (s) { var r = d[s.getAttribute('data-crono')]; if (r && r.desde) s.textContent = formato((r.seg || 0) + corrido(r), true); });
    document.querySelectorAll('[data-crono-semana]').forEach(function (s) { s.textContent = formato(resumen().semanaSeg); });
  }
  var espera = 0;
  function programar() { clearTimeout(espera); espera = setTimeout(pintar, 250); }
  document.addEventListener('agenda-guardada', programar);
  new MutationObserver(programar).observe(tf, { childList: true });
  new MutationObserver(programar).observe(document.getElementById('proyectos-fila') || tf, { attributes: true, attributeFilter: ['class'] });
  setInterval(tic, 1000);
  programar();
  window.lrCrono = { resumen: resumen, formato: formato, pintar: pintar };
  document.dispatchEvent(new Event('cronometro-listo'));
})();
