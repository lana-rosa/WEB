/* Agenda para tejedoras: gráficas del negocio (Plus para emprendedoras, 31-oct-2026, pedido de Sara: «el punto de equilibrio de forma gráfica en el dashboard
   y gráficos en el módulo de finanzas»). Solo leen lo escrito en las otras hojas; no guardan nada.
   - Punto de equilibrio del mes (barra de ventas con la raya del punto de equilibrio y la de la meta): en Mi panel y en «Mi negocio en números».
   - Utilidad de cada mes (últimos 6 meses: ingresos − gastos de «Ingresos y gastos del negocio»): en «Mi negocio en números».
   - Ventas del mes contra tu meta (acumulado por día, con el ritmo ideal): en «Mi negocio en números».
   Los textos largos van en HTML (el traductor no entra en los SVG); dentro del SVG solo van números y meses. Depende de metas-ventas.js (lrMetasVentas.calcular). */
(function () {
  'use strict';
  var N = window.lrAgendaNucleo, SVGNS = 'http://www.w3.org/2000/svg';
  if (!N) return;
  var VERDE = '#4F8A5B', ROSA = '#C81B6D', LILA = '#6C70E8', GRIS = '#8A7A82', FONDO = '#F4E6EC';
  function T(t) { return window.lrI18n && window.lrI18n.t ? window.lrI18n.t(t) : t; }
  function lang() { return window.lrI18n ? window.lrI18n.lang : 'es'; }
  function el(tag, cls, t) { var e = document.createElement(tag); if (cls) e.className = cls; if (t != null) e.textContent = t; return e; }
  function sv(tag, a, t) { var e = document.createElementNS(SVGNS, tag); Object.keys(a || {}).forEach(function (k) { e.setAttribute(k, a[k]); }); if (t != null) e.textContent = t; return e; }
  function plata(x) { return (x < 0 ? '−' : '') + '$ ' + Math.abs(Math.round(x)).toLocaleString('es-CO'); }
  function corto(x) {   // $850 mil · $1,2 M (en inglés: $850k · $1.2M)
    x = Math.round(x); var en = lang() === 'en', dec = function (n) { return String(Math.round(n * 10) / 10).replace('.', en ? '.' : ','); };
    if (x >= 1000000) return '$' + dec(x / 1000000) + (en ? 'M' : ' M');
    if (x >= 1000) return '$' + Math.round(x / 1000) + (en ? 'k' : ' mil');
    return '$' + x;
  }
  function MES3(i) { var A = { en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], pt: ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'], es: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'] }; return (A[lang()] || A.es)[i]; }
  function num(t) { var n = parseInt(String(t == null ? '' : t).replace(/[^0-9]/g, ''), 10); return isFinite(n) ? n : 0; }
  function datos() { return window.lrMetasVentas ? window.lrMetasVentas.calcular() : null; }
  function bloqueada() { var h = document.getElementById('fin-presupuesto'); return !!h && h.classList.contains('sin-membresia'); }
  function leyenda(items) { var l = el('div', 'gr-leyenda'); items.forEach(function (i) { var s = el('span'); var p = el('i'); p.style.background = i[1]; if (i[2]) p.className = i[2]; s.appendChild(p); s.appendChild(document.createTextNode(i[0])); l.appendChild(s); }); return l; }

  /* ---- 1. Punto de equilibrio: barra con rayas ---- */
  function equilibrio(c) {
    var d = datos(); c.textContent = '';
    if (!d || !d.eq) { c.appendChild(el('p', 'fin-vacio', 'Para ver esta gráfica agrega tus pagos en «Gastos fijos y deudas del negocio» y anota el costo en «Mis ventas del mes» (o escribe tu margen en «Presupuesto y metas del negocio»).')); return false; }
    var W = 600, H = 96, pad = 8, tope = Math.max(d.ventas, d.eq, d.meta || 0, d.eqCuotas && d.cuotas ? d.eqCuotas : 0) * 1.12 || 1, x = function (v) { return pad + (W - 2 * pad) * v / tope; };
    var s = sv('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'class': 'gr-svg' });
    var supera = d.ventas >= d.eq, pct = Math.round(d.ventas / d.eq * 100);
    s.setAttribute('aria-label', T('Punto de equilibrio del mes') + ': ' + plata(d.ventas) + ' / ' + plata(d.eq) + ' (' + pct + ' %)' + (d.meta ? ' · ' + T('Tu meta') + ': ' + plata(d.meta) : ''));
    s.appendChild(sv('rect', { x: pad, y: 38, width: W - 2 * pad, height: 26, rx: 13, fill: FONDO }));
    if (d.ventas > 0) s.appendChild(sv('rect', { x: pad, y: 38, width: Math.max(26, x(d.ventas) - pad), height: 26, rx: 13, fill: supera ? VERDE : ROSA }));
    s.appendChild(sv('line', { x1: x(d.eq), x2: x(d.eq), y1: 24, y2: 78, stroke: '#45454A', 'stroke-width': 3, 'stroke-dasharray': '5 4' }));
    s.appendChild(sv('text', { x: x(d.eq), y: 18, 'text-anchor': 'middle', 'class': 'gr-t' }, corto(d.eq)));
    if (d.meta) { s.appendChild(sv('line', { x1: x(d.meta), x2: x(d.meta), y1: 24, y2: 78, stroke: LILA, 'stroke-width': 3 })); s.appendChild(sv('text', { x: Math.min(W - 24, x(d.meta)), y: 92, 'text-anchor': 'middle', 'class': 'gr-t gr-lila' }, corto(d.meta))); }
    s.appendChild(sv('text', { x: pad + 2, y: 92, 'class': 'gr-t' }, '$0'));
    if (d.ventas > 0) s.appendChild(sv('text', { x: Math.min(W - 8, Math.max(pad + 40, x(d.ventas) - 8)), y: 56, 'text-anchor': 'end', 'class': 'gr-t gr-blanco' }, corto(d.ventas)));
    c.appendChild(s);
    c.appendChild(leyenda([['Ventas del mes', supera ? VERDE : ROSA], ['Punto de equilibrio', '#45454A', 'gr-raya'], d.meta ? ['Tu meta', LILA] : null].filter(Boolean)));
    c.appendChild(el('p', 'gr-resumen', supera ? 'Ya superaste tu punto de equilibrio: lo que vendes de aquí en adelante empieza a dejarte ganancia.' : 'Llevas ' + plata(d.ventas) + ' de los ' + plata(d.eq) + ' que necesitas para no perder este mes (' + pct + ' %).'));
    return true;
  }

  /* ---- 2. Utilidad de cada mes (últimos 6) ---- */
  function utilidad(c) {
    c.textContent = '';
    var f = (N.datos()._fin || {}), movs = f.movs || [], hoy = new Date(), meses = [];
    for (var i = 5; i >= 0; i--) { var d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1); meses.push({ y: d.getFullYear(), m: d.getMonth(), ing: 0, gas: 0 }); }
    movs.forEach(function (x) { if (!x || (x.t !== 'i' && x.t !== 'g')) return; var k = String(x.f || '').slice(0, 7); meses.forEach(function (ms) { if (k === ms.y + '-' + ('0' + (ms.m + 1)).slice(-2)) { if (x.t === 'i') ms.ing += num(x.v); else ms.gas += num(x.v); } }); });
    meses.forEach(function (ms) { ms.u = ms.ing - ms.gas; });
    if (!meses.some(function (ms) { return ms.ing || ms.gas; })) { c.appendChild(el('p', 'fin-vacio', 'Cuando anotes ingresos y gastos del negocio verás aquí cuánto te queda cada mes.')); return false; }
    var W = 600, H = 210, base = 90, mx = Math.max.apply(null, meses.map(function (ms) { return Math.abs(ms.u); })) || 1, bw = 52, gap = (W - 6 * bw) / 7;
    var s = sv('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'class': 'gr-svg' });
    s.setAttribute('aria-label', T('Utilidad de cada mes') + ': ' + meses.map(function (ms) { return MES3(ms.m) + ' ' + plata(ms.u); }).join(', '));
    s.appendChild(sv('line', { x1: 0, x2: W, y1: base, y2: base, stroke: '#CFC3C9', 'stroke-width': 1 }));
    meses.forEach(function (ms, i) {
      var h = Math.max(ms.u ? 3 : 0, Math.abs(ms.u) / mx * 62), x = gap + i * (bw + gap), pos = ms.u >= 0;
      s.appendChild(sv('rect', { x: x, y: pos ? base - h : base, width: bw, height: h, rx: 6, fill: pos ? VERDE : ROSA }));
      s.appendChild(sv('text', { x: x + bw / 2, y: pos ? base - h - 6 : base + h + 14, 'text-anchor': 'middle', 'class': 'gr-t' }, ms.u ? (pos ? '' : '−') + corto(Math.abs(ms.u)) : '$0'));
      s.appendChild(sv('text', { x: x + bw / 2, y: 198, 'text-anchor': 'middle', 'class': 'gr-t gr-mes' }, MES3(ms.m)));
    });
    c.appendChild(s);
    c.appendChild(leyenda([['Te quedó', VERDE], ['Perdiste', ROSA]]));
    return true;
  }

  /* ---- 3. Ventas del mes contra la meta (acumulado por día) ---- */
  function acumulado(c) {
    var d = datos(); c.textContent = '';
    if (!d || !d.meta) { c.appendChild(el('p', 'fin-vacio', 'Escribe tu meta de ventas en «Presupuesto y metas del negocio» y aquí verás cómo vas día a día.')); return false; }
    var W = 600, H = 220, L = 46, R = 12, top = 16, bot = 28, tope = Math.max(d.meta, d.ventas, d.eq || 0) * 1.1, n = d.dias;
    var x = function (dia) { return L + (W - L - R) * (dia - 1) / Math.max(1, n - 1); }, y = function (v) { return H - bot - (H - bot - top) * v / tope; };
    var s = sv('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'class': 'gr-svg' });
    s.setAttribute('aria-label', T('Ventas del mes contra tu meta') + ': ' + plata(d.ventas) + ' / ' + plata(d.meta));
    [0, 0.5, 1].forEach(function (p) { var v = d.meta * p; s.appendChild(sv('line', { x1: L, x2: W - R, y1: y(v), y2: y(v), stroke: '#EADDE3', 'stroke-width': 1 })); s.appendChild(sv('text', { x: L - 6, y: y(v) + 4, 'text-anchor': 'end', 'class': 'gr-t' }, corto(v))); });
    s.appendChild(sv('line', { x1: x(1), y1: y(0), x2: x(n), y2: y(d.meta), stroke: GRIS, 'stroke-width': 2, 'stroke-dasharray': '2 5' }));
    if (d.eq) s.appendChild(sv('line', { x1: L, x2: W - R, y1: y(d.eq), y2: y(d.eq), stroke: '#45454A', 'stroke-width': 2, 'stroke-dasharray': '5 4' }));
    var acc = 0, pts = [];
    for (var i = 1; i <= d.hoyDia; i++) { acc += d.porDia[i] || 0; pts.push(x(i).toFixed(1) + ',' + y(acc).toFixed(1)); }
    var ok = d.ventas >= d.meta * (d.hoyDia / n);
    if (pts.length > 1) s.appendChild(sv('polyline', { points: pts.join(' '), fill: 'none', stroke: ok ? VERDE : ROSA, 'stroke-width': 3.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
    s.appendChild(sv('circle', { cx: x(d.hoyDia), cy: y(d.ventas), r: 5, fill: ok ? VERDE : ROSA }));
    [1, Math.round(n / 2), n].forEach(function (dia) { s.appendChild(sv('text', { x: x(dia), y: H - 8, 'text-anchor': dia === 1 ? 'start' : dia === n ? 'end' : 'middle', 'class': 'gr-t gr-mes' }, String(dia))); });
    var c1 = el('div', 'gr-svg-wrap'); c1.appendChild(s); c.appendChild(c1);
    c.appendChild(leyenda([['Ventas del mes', ok ? VERDE : ROSA], ['Ritmo ideal para tu meta', GRIS, 'gr-punteada'], d.eq ? ['Punto de equilibrio', '#45454A', 'gr-raya'] : null].filter(Boolean)));
    c.appendChild(el('p', 'gr-resumen', ok ? 'Vas al día o adelantada con tu meta.' : 'Vas por debajo del ritmo que necesitas para llegar a tu meta.'));
    return true;
  }

  /* ---- colocar y repintar ---- */
  function tarjeta(id, titulo, extra) { var d = el('div', 'fin-caja gr-caja no-imprimir'); d.id = id; var h = el('h4', 'sub-hoja', titulo); d.appendChild(h); var c = el('div', 'gr-cuerpo'); d.appendChild(c); return d; }
  function enFinanzas() {
    var h = document.getElementById('fin-resumen'); if (!h || bloqueada()) return;
    var ref = h.querySelector('.fin-dos'); if (!ref) return;
    var specs = [['gr-equilibrio', 'Punto de equilibrio del mes', equilibrio], ['gr-acumulado', 'Ventas del mes contra tu meta', acumulado], ['gr-utilidad', 'Utilidad de cada mes', utilidad]];
    var dos = h.querySelector('#gr-fila'); if (!dos) { dos = el('div', 'fin-dos gr-fila no-imprimir'); dos.id = 'gr-fila'; ref.parentNode.insertBefore(dos, ref); }
    specs.forEach(function (sp) { var caja = document.getElementById(sp[0]); if (!caja) { caja = tarjeta(sp[0], sp[1]); dos.appendChild(caja); } sp[2](caja.querySelector('.gr-cuerpo')); });
  }
  function enPanel(cont) {
    cont.textContent = '';
    if (bloqueada()) return false;
    var c = el('div', 'gr-cuerpo'); if (!equilibrio(c)) return false;
    cont.appendChild(c); return true;
  }
  var pendiente = false;
  function repintar() { if (pendiente) return; pendiente = true; setTimeout(function () { pendiente = false; var h = document.getElementById('fin-resumen'); if (h && h.classList.contains('abierta')) enFinanzas(); if (window.lrPintarPanel && document.getElementById('panel-agenda').classList.contains('abierta')) window.lrPintarPanel(); }, 120); }
  document.addEventListener('agenda-guardada', repintar);
  var fr = document.getElementById('fin-resumen'); if (fr) new MutationObserver(function () { if (fr.classList.contains('abierta')) enFinanzas(); }).observe(fr, { attributes: true, attributeFilter: ['class'] });
  window.lrGraficas = { equilibrio: enPanel, finanzas: enFinanzas };
  if (window.lrPintarPanel) window.lrPintarPanel();
  if (fr && fr.classList.contains('abierta')) enFinanzas();
})();
