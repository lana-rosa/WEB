/* Agenda para tejedoras: un tablero gráfico al abrir cada sección (Plus, 31-oct-2026, pedido de Sara: «en cada sección un dashboard que muestre cómo estamos»).
   Se pinta arriba de las tarjetas de la vista de sección (panel.js llama a lrDashboards.pintar). Solo lee las hojas; no guarda nada ni se imprime.
   Mis proyectos · Mis materiales · Mi emprendimiento · Finanzas del negocio · Fechas y bienestar (Mi panel y Mi tablero ya son tableros).
   Las secciones de membresía no muestran su tablero cuando sus hojas están bloqueadas (el candado no se filtra). Los textos largos van en HTML para que el traductor los alcance;
   dentro de los SVG solo van números. Los nombres que escribe la persona llevan data-no-traducir. */
(function () {
  'use strict';
  var N = window.lrAgendaNucleo; if (!N) return;
  var VERDE = '#4F8A5B', ROSA = '#C81B6D', AMBAR = '#D9A441', LILA = '#6C70E8', AZUL = '#3F7FD4', GRIS = '#B9AAB2', SVGNS = 'http://www.w3.org/2000/svg';
  function lang() { return window.lrI18n ? window.lrI18n.lang : 'es'; }
  function el(tag, cls, t) { var e = document.createElement(tag); if (cls) e.className = cls; if (t != null) e.textContent = t; return e; }
  function sv(tag, a, t) { var e = document.createElementNS(SVGNS, tag); Object.keys(a || {}).forEach(function (k) { e.setAttribute(k, a[k]); }); if (t != null) e.textContent = t; return e; }
  function num(t) { var n = parseInt(String(t == null ? '' : t).replace(/[^0-9]/g, ''), 10); return isFinite(n) ? n : 0; }
  function plata(x) { return (x < 0 ? '−' : '') + '$ ' + Math.abs(Math.round(x)).toLocaleString('es-CO'); }
  function corto(x) { x = Math.round(x); var en = lang() === 'en', dec = function (n) { return String(Math.round(n * 10) / 10).replace('.', en ? '.' : ','); }; if (x >= 1000000) return '$' + dec(x / 1000000) + (en ? 'M' : ' M'); if (x >= 1000) return '$' + Math.round(x / 1000) + (en ? 'k' : ' mil'); return '$' + x; }
  function MES3(i) { var A = { en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], pt: ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'], es: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'] }; return (A[lang()] || A.es)[i]; }
  function filas(tabla, cols) {
    var T = N.tablas[tabla], out = []; if (!T) return out;
    for (var r = 1; r <= T.n; r++) {
      var o = {}, alguno = false;
      cols.forEach(function (c) { var e = document.getElementById(T.prefijo + r + '-' + c); var v = e ? (e.type === 'checkbox' ? e.checked : String(e.value || '').trim()) : ''; o[c] = v; if (v) alguno = true; });
      if (alguno) out.push(o);
    }
    return out;
  }
  function bloqueada(id) { var h = document.getElementById(id); return !!h && h.classList.contains('sin-membresia'); }
  function ir(id) { if (window.lrIrAHoja) window.lrIrAHoja(id); }

  /* ---- piezas ---- */
  function tarjeta(titulo, hojaId, enlace) {
    var c = el('div', 'pn-card db-card'), h = el('h4', '', titulo);
    if (hojaId) { var b = el('button', 'pn-enlace', enlace || 'Ver'); b.type = 'button'; b.addEventListener('click', function () { ir(hojaId); }); h.appendChild(b); }
    c.appendChild(h); return c;
  }
  function vacio(txt) { return el('p', 'pn-vacio', txt); }
  function kpis(lista) {
    var g = el('div', 'db-kpis');
    lista.forEach(function (k) { var d = el('div', 'db-kpi' + (k[3] ? ' ' + k[3] : '')); d.appendChild(el('span', '', k[0])); d.appendChild(el('b', '', String(k[1]))); if (k[2]) d.appendChild(el('small', '', k[2])); g.appendChild(d); });
    return g;
  }
  function leyenda(items) { var l = el('div', 'gr-leyenda'); items.forEach(function (i) { var s = el('span'); var p = el('i'); p.style.background = i[1]; s.appendChild(p); s.appendChild(document.createTextNode(i[0])); if (i[2] != null) s.appendChild(document.createTextNode(' · ' + i[2])); l.appendChild(s); }); return l; }
  function donut(items, centro, aria) {
    var total = items.reduce(function (s, i) { return s + i.v; }, 0), s = sv('svg', { viewBox: '0 0 42 42', 'class': 'db-donut', role: 'img' });
    s.setAttribute('aria-label', aria + ': ' + items.map(function (i) { return i.n + ' ' + i.v; }).join(', '));
    s.appendChild(sv('circle', { cx: 21, cy: 21, r: 15.9155, fill: 'none', stroke: '#F4E6EC', 'stroke-width': 6 }));
    var acc = 0; items.forEach(function (i) { if (!i.v) return; var pc = i.v / total * 100; s.appendChild(sv('circle', { cx: 21, cy: 21, r: 15.9155, fill: 'none', stroke: i.c, 'stroke-width': 6, 'stroke-dasharray': pc + ' ' + (100 - pc), 'stroke-dashoffset': 25 - acc })); acc += pc; });
    s.appendChild(sv('text', { x: 21, y: 24.5, 'text-anchor': 'middle', 'class': 'db-donut-n' }, String(centro)));
    return s;
  }
  function barrasMeses(valores, color, aria, fmt) {   // 6 meses, [{m,v}]
    var W = 600, H = 190, mx = Math.max.apply(null, valores.map(function (x) { return Math.abs(x.v); }).concat([1])), bw = 54, gap = (W - 6 * bw) / 7, base = 150;
    var s = sv('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'class': 'gr-svg' }); s.setAttribute('aria-label', aria + ': ' + valores.map(function (x) { return MES3(x.m) + ' ' + (fmt ? fmt(x.v) : x.v); }).join(', '));
    s.appendChild(sv('line', { x1: 0, x2: W, y1: base, y2: base, stroke: '#CFC3C9', 'stroke-width': 1 }));
    valores.forEach(function (x, i) { var h = x.v ? Math.max(4, x.v / mx * 110) : 0, px = gap + i * (bw + gap); s.appendChild(sv('rect', { x: px, y: base - h, width: bw, height: h, rx: 6, fill: i === valores.length - 1 ? color : color, opacity: i === valores.length - 1 ? 1 : 0.55 })); s.appendChild(sv('text', { x: px + bw / 2, y: base - h - 6, 'text-anchor': 'middle', 'class': 'gr-t' }, x.v ? (fmt ? fmt(x.v) : String(x.v)) : '')); s.appendChild(sv('text', { x: px + bw / 2, y: 172, 'text-anchor': 'middle', 'class': 'gr-t gr-mes' }, MES3(x.m))); });
    return s;
  }
  function barrasH(items, color, formato) {   // [{n, v, c?}]
    var mx = Math.max.apply(null, items.map(function (i) { return i.v; }).concat([1])), g = el('div', 'ct-barras');
    items.forEach(function (i) { var f = el('div', 'ct-barra'), nom = el('span', 'ct-nom', i.n); nom.setAttribute('data-no-traducir', ''); var pista = el('div', 'ct-pista'), rel = el('i', 'ct-rel'); rel.style.background = i.c || color; rel.style.width = Math.max(3, i.v / mx * 100) + '%'; pista.appendChild(rel); f.appendChild(nom); f.appendChild(pista); f.appendChild(el('span', 'ct-pct', formato ? formato(i.v) : String(i.v))); g.appendChild(f); });
    return g;
  }
  function seisMeses() { var h = new Date(), out = []; for (var i = 5; i >= 0; i--) { var d = new Date(h.getFullYear(), h.getMonth() - i, 1); out.push({ y: d.getFullYear(), m: d.getMonth(), v: 0 }); } return out; }
  function enMes(texto, y, m) { var f = N.leerFecha ? N.leerFecha(texto) : null; return !!f && f.a === y && f.m === m + 1; }
  function dif(texto) { var f = N.leerFecha ? N.leerFecha(texto) : null; if (!f || f.sinAnio) return null; var h = new Date(); h = new Date(h.getFullYear(), h.getMonth(), h.getDate()); return Math.round((new Date(f.a, f.m - 1, f.d) - h) / 86400000); }

  /* ---- tableros ---- */
  var T = {};
  T['Mis proyectos'] = function (c) {
    var pr = filas('tabla-fila', ['proyecto', 'fecha', 'estado']).filter(function (p) { return p.proyecto; });
    var term = pr.filter(function (p) { return p.estado === 'Terminado'; }).length, teje = pr.filter(function (p) { return p.estado === 'Tejiendo'; }).length, resto = pr.length - term - teje;
    var k = tarjeta('Tus proyectos', 'proyectos-fila', 'Ver proyectos');
    if (!pr.length) k.appendChild(vacio('Cuando anotes proyectos en «Proyectos por tejer» verás aquí cuántos tienes terminados, tejiéndose y por empezar.'));
    else { var w = el('div', 'db-donut-wrap'); w.appendChild(donut([{ n: 'Terminados', v: term, c: VERDE }, { n: 'Tejiendo', v: teje, c: ROSA }, { n: 'Por empezar', v: resto, c: GRIS }], pr.length, 'Tus proyectos')); w.appendChild(leyenda([['Terminados', VERDE, term], ['Tejiendo', ROSA, teje], ['Por empezar', GRIS, resto]])); k.appendChild(w);
      var prox = pr.map(function (p) { return { p: p, d: dif(p.fecha) }; }).filter(function (x) { return x.d !== null && x.d >= 0 && x.p.estado !== 'Terminado'; }).sort(function (a, b) { return a.d - b.d; })[0];
      if (prox) { var f = el('p', 'gr-resumen', 'Tu próxima fecha: '); var n = el('span', '', prox.p.proyecto); n.setAttribute('data-no-traducir', ''); f.appendChild(n); f.appendChild(document.createTextNode(prox.d === 0 ? ' · hoy' : ' · en ' + prox.d + (prox.d === 1 ? ' día' : ' días'))); k.appendChild(f); } }
    c.appendChild(k);
    var id = filas('tabla-ideas', ['tema']).length, pt = filas('tabla-patrones', ['patron', 'tejido']).filter(function (p) { return p.patron; }), ap = filas('tabla-aprendi', ['tecnica', 'domino']).filter(function (p) { return p.tecnica; });
    var k2 = tarjeta('Tu creatividad en números');
    k2.appendChild(kpis([['Ideas guardadas', id], ['Patrones', pt.length, pt.filter(function (p) { return p.tejido; }).length + ' ya tejidos'], ['Técnicas aprendidas', ap.length, ap.filter(function (p) { return p.domino; }).length + ' ya dominadas']]));
    c.appendChild(k2);
  };
  T['Mis materiales'] = function (c) {
    var la = filas('tabla-lanas', ['marca', 'color', 'ovillos']).filter(function (l) { return l.marca || l.color || l.ovillos; });
    var tot = la.reduce(function (s, l) { return s + num(l.ovillos); }, 0), cero = la.filter(function (l) { return l.ovillos !== '' && num(l.ovillos) === 0; }).length;
    var k = tarjeta('Tu lana', 'inventario-lanas', 'Ver inventario');
    if (!la.length) k.appendChild(vacio('Anota tus lanas en «Inventario de lanas» y aquí verás cuántos ovillos tienes y cuáles se acabaron.'));
    else {
      var iv = window.lrInventario ? window.lrInventario.resumen() : null, bajoMin = iv ? iv.porAcabar.length : cero;
      var kp = [['Ovillos en total', tot], ['Lanas distintas', la.length], [iv ? 'Por acabarse' : 'Se acabaron', bajoMin, bajoMin ? '¿Las agregas a la lista?' : 'Todo con existencias', bajoMin ? 'db-alerta' : '']];
      if (iv && iv.conCosto) kp.splice(1, 0, ['Dinero en lana', '$ ' + Math.round(iv.valor).toLocaleString('es-CO'), iv.sinCosto ? iv.sinCosto + ' sin costo' : 'Ovillos × costo']);
      k.appendChild(kpis(kp));
      var por = {}; la.forEach(function (l) { var m = l.marca || 'Sin marca'; por[m] = (por[m] || 0) + num(l.ovillos); });
      var top = Object.keys(por).map(function (m) { return { n: m, v: por[m] }; }).sort(function (a, b) { return b.v - a.v; }).slice(0, 5);
      if (top.some(function (x) { return x.v; })) { k.appendChild(el('h5', 'cl-titulo cl-sub', 'Ovillos por marca')); k.appendChild(barrasH(top, LILA)); } }
    c.appendChild(k);
    var co = filas('tabla-compras', ['material', 'comprado']).filter(function (x) { return x.material; }), ya = co.filter(function (x) { return x.comprado; }).length, ag = filas('tabla-agujas', ['medida']).length;
    var k2 = tarjeta('Tus compras', 'lista-compras', 'Ver lista');
    if (!co.length) k2.appendChild(vacio('Tu lista de compras está vacía. Cuando anotes lo que te falta, aquí verás cuánto llevas comprado.'));
    else { var w = el('div', 'db-donut-wrap'); w.appendChild(donut([{ n: 'Comprado', v: ya, c: VERDE }, { n: 'Por comprar', v: co.length - ya, c: AMBAR }], co.length, 'Lista de compras')); w.appendChild(leyenda([['Comprado', VERDE, ya], ['Por comprar', AMBAR, co.length - ya]])); k2.appendChild(w); }
    k2.appendChild(kpis([['Agujas anotadas', ag]]));
    c.appendChild(k2);
  };
  T['Mi emprendimiento'] = function (c) {
    var ms = seisMeses(); filas('tabla-ventas', ['fecha', 'precio']).forEach(function (v) { ms.forEach(function (m) { if (enMes(v.fecha, m.y, m.m)) m.v += num(v.precio); }); });
    var kv = tarjeta('Tus ventas de los últimos 6 meses', 'ventas-mes', 'Ver ventas');
    if (!ms.some(function (m) { return m.v; })) kv.appendChild(vacio('Cuando anotes ventas con fecha en «Mis ventas del mes», aquí verás cómo van mes a mes.'));
    else { var w = el('div', 'gr-svg-wrap'); w.appendChild(barrasMeses(ms, VERDE, 'Ventas de los últimos 6 meses', corto)); kv.appendChild(w);
      var a = ms[5].v, b = ms[4].v; kv.appendChild(el('p', 'gr-resumen', a >= b ? 'Este mes vas igual o mejor que el anterior (' + plata(a) + ' contra ' + plata(b) + ').' : 'Este mes llevas ' + plata(a) + ', y el mes anterior vendiste ' + plata(b) + '.')); }
    c.appendChild(kv);
    var pe = filas('tabla-pedidos', ['cliente', 'estado', 'entrega', 'totalcompra', 'precio', 'abono']).filter(function (p) { return p.cliente || p.estado; });
    var kp = tarjeta('Tus pedidos', 'control-pedidos', 'Ver pedidos');
    if (!pe.length) kp.appendChild(vacio('Anota tus pedidos en «Control de pedidos» y aquí verás en qué estado están y cuánto te deben.'));
    else {
      var ESTADOS = [['Cotizado', GRIS], ['Pedido confirmado', LILA], ['En proceso', ROSA], ['Terminado', AMBAR], ['Despachado', AZUL], ['Entregado', VERDE]], items = ESTADOS.map(function (e) { return { n: e[0], c: e[1], v: pe.filter(function (p) { return p.estado === e[0]; }).length }; });
      var sinE = pe.filter(function (p) { return !p.estado; }).length; if (sinE) items.push({ n: 'Sin estado', c: '#E3D5DB', v: sinE });
      var w2 = el('div', 'db-donut-wrap'); w2.appendChild(donut(items, items.reduce(function (s, i) { return s + i.v; }, 0), 'Pedidos por estado'));
      w2.appendChild(leyenda(items.filter(function (i) { return i.v; }).map(function (i) { return [i.n, i.c, i.v]; }))); kp.appendChild(w2);
      var cobrar = pe.filter(function (p) { return !/entreg|cancel/i.test(p.estado); }).reduce(function (s, p) { return s + Math.max(0, (num(p.totalcompra) || num(p.precio)) - num(p.abono)); }, 0);
      var sem = pe.filter(function (p) { var d = dif(p.entrega); return d !== null && d >= 0 && d <= 7 && !/entreg|cancel/i.test(p.estado); }).length;
      kp.appendChild(kpis([['Por cobrar', plata(cobrar)], ['Entregas esta semana', sem]]));
    }
    c.appendChild(kp);
    var h = new Date(), cl = filas('tabla-clientas', ['nombre', 'desde']).filter(function (x) { return x.nombre; }), nuevas = cl.filter(function (x) { return enMes(x.desde, h.getFullYear(), h.getMonth()); }).length;
    var vt = filas('tabla-ventas', ['producto', 'precio']).filter(function (v) { return v.producto && num(v.precio); }), por = {}; vt.forEach(function (v) { var k = v.producto; por[k] = (por[k] || 0) + num(v.precio); });
    var top = Object.keys(por).map(function (n) { return { n: n, v: por[n] }; }).sort(function (a, b) { return b.v - a.v; }).slice(0, 5);
    var kc = tarjeta('Tus clientas y lo que más vendes', 'mis-clientas', 'Ver clientas');
    kc.appendChild(kpis([['Clientas', cl.length], ['Nuevas este mes', nuevas]]));
    if (top.length) { kc.appendChild(el('h5', 'cl-titulo cl-sub', 'Lo que más has vendido')); kc.appendChild(barrasH(top, ROSA, corto)); }
    c.appendChild(kc);
  };
  T['Finanzas del negocio'] = function (c) {
    var f = N.datos()._fin || {}, ms = seisMeses(), ing = ms.map(function () { return 0; }), gas = ms.map(function () { return 0; });
    (f.movs || []).forEach(function (x) { if (!x || (x.t !== 'i' && x.t !== 'g')) return; var k = String(x.f || '').slice(0, 7); ms.forEach(function (m, i) { if (k === m.y + '-' + ('0' + (m.m + 1)).slice(-2)) { if (x.t === 'i') ing[i] += num(x.v); else gas[i] += num(x.v); } }); });
    var k = tarjeta('Lo que entra y lo que sale', 'fin-resumen', 'Ver finanzas');
    if (!ing.concat(gas).some(function (v) { return v; })) k.appendChild(vacio('Cuando anotes ingresos y gastos del negocio verás aquí cómo van mes a mes.'));
    else {
      var W = 600, H = 200, mx = Math.max.apply(null, ing.concat(gas).concat([1])), bw = 28, base = 160, grupo = (W - 20) / 6, s = sv('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'class': 'gr-svg' });
      s.setAttribute('aria-label', 'Ingresos y gastos de los últimos 6 meses: ' + ms.map(function (m, i) { return MES3(m.m) + ' ' + plata(ing[i]) + ' / ' + plata(gas[i]); }).join(', '));
      s.appendChild(sv('line', { x1: 0, x2: W, y1: base, y2: base, stroke: '#CFC3C9', 'stroke-width': 1 }));
      ms.forEach(function (m, i) { var x0 = 10 + i * grupo + (grupo - 2 * bw - 6) / 2; [[ing[i], VERDE, 0], [gas[i], ROSA, bw + 6]].forEach(function (b) { var h = b[0] ? Math.max(4, b[0] / mx * 120) : 0; s.appendChild(sv('rect', { x: x0 + b[2], y: base - h, width: bw, height: h, rx: 5, fill: b[1], opacity: i === 5 ? 1 : 0.6 })); }); s.appendChild(sv('text', { x: x0 + bw + 3, y: 184, 'text-anchor': 'middle', 'class': 'gr-t gr-mes' }, MES3(m.m))); });
      var w = el('div', 'gr-svg-wrap'); w.appendChild(s); k.appendChild(w); k.appendChild(leyenda([['Ingresos', VERDE], ['Gastos', ROSA]]));
      var u = ing[5] - gas[5]; k.appendChild(el('p', 'gr-resumen', u >= 0 ? 'Este mes te quedan ' + plata(u) + ' después de los gastos.' : 'Este mes gastaste ' + plata(-u) + ' más de lo que entró.')); }
    c.appendChild(k);
    if (window.lrGraficas) [['Punto de equilibrio del mes', 'equilibrioEn', 'fin-resumen'], ['Utilidad de cada mes', 'utilidadEn', 'fin-resumen'], ['Ventas del mes contra tu meta', 'acumuladoEn', 'fin-presupuesto']].forEach(function (g) {
      var kk = tarjeta(g[0], g[2], 'Ver más'), cuerpo = el('div', 'gr-cuerpo'); kk.appendChild(cuerpo); window.lrGraficas[g[1]](cuerpo); c.appendChild(kk);
    });
  };
  T['Fechas y bienestar'] = function (c) {
    var evs = (window.lrAgenda && window.lrAgenda.eventos) ? window.lrAgenda.eventos() : [], h = new Date(); h = new Date(h.getFullYear(), h.getMonth(), h.getDate());
    var sem = [0, 0, 0, 0]; evs.forEach(function (e) { var p = String(e.fecha).split('-'), d = Math.round((new Date(+p[0], +p[1] - 1, +p[2]) - h) / 86400000); if (d >= 0 && d < 28) sem[Math.floor(d / 7)]++; });
    var k = tarjeta('Tus próximas fechas', 'calendario-anual', 'Ver calendario');
    if (!sem.some(function (v) { return v; })) k.appendChild(vacio('No hay fechas en las próximas 4 semanas. Anota entregas, ferias o cumpleaños y aquí verás cuántas hay cada semana.'));
    else { var W = 600, H = 150, mx = Math.max.apply(null, sem), s = sv('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'class': 'gr-svg' }); s.setAttribute('aria-label', 'Fechas por semana, próximas 4 semanas: ' + sem.join(', '));
      s.appendChild(sv('line', { x1: 0, x2: W, y1: 110, y2: 110, stroke: '#CFC3C9' }));
      sem.forEach(function (v, i) { var bw = 90, x = 40 + i * 140, hh = v ? Math.max(6, v / mx * 80) : 0; s.appendChild(sv('rect', { x: x, y: 110 - hh, width: bw, height: hh, rx: 6, fill: i === 0 ? ROSA : LILA, opacity: i === 0 ? 1 : 0.65 })); s.appendChild(sv('text', { x: x + bw / 2, y: 110 - hh - 6, 'text-anchor': 'middle', 'class': 'gr-t' }, v ? String(v) : '')); s.appendChild(sv('text', { x: x + bw / 2, y: 132, 'text-anchor': 'middle', 'class': 'gr-t gr-mes' }, i === 0 ? '0–6' : (i * 7) + '–' + (i * 7 + 6))); });
      var w = el('div', 'gr-svg-wrap'); w.appendChild(s); k.appendChild(w); k.appendChild(el('p', 'gr-resumen', 'Fechas por semana: la barra rosa es la de esta semana y las lilas son las siguientes. Los números de abajo son los días desde hoy.')); }
    c.appendChild(k);
    var di = filas('tabla-diario', ['fecha', 'animo', 'teji']).filter(function (x) { return enMes(x.fecha, h.getFullYear(), h.getMonth()); }), kd = tarjeta('Tu diario de tejido', 'diario-tejido', 'Ver diario');
    if (!di.length) kd.appendChild(vacio('Anota cómo te fue tejiendo y aquí verás los días del mes y cómo te sentiste.'));
    else {
      kd.appendChild(kpis([['Días anotados este mes', di.length, 'de ' + h.getDate() + ' días que van']]));
      var por = {}; di.forEach(function (x) { if (x.animo) por[x.animo] = (por[x.animo] || 0) + 1; });
      var an = Object.keys(por).map(function (n) { return { n: n, v: por[n] }; }).sort(function (a, b) { return b.v - a.v; });
      if (an.length) { kd.appendChild(el('h5', 'cl-titulo cl-sub', 'Cómo te sentiste')); kd.appendChild(barrasH(an, LILA)); } }
    c.appendChild(kd);
    var pa = 0; for (var i = 1; i <= 31; i++) { var e = document.getElementById('ag-pa' + i); if (e && e.checked) pa++; }
    var kpz = tarjeta('Tus pausas activas', 'registro-pausas', 'Ver registro'), barra = el('div', 'fin-progreso'), ii = el('i'); ii.style.width = Math.round(pa / 31 * 100) + '%'; barra.appendChild(ii);
    kpz.appendChild(kpis([['Días con pausas activas', pa, 'de 31 días del mes']])); kpz.appendChild(barra); c.appendChild(kpz);
  };
  var SECCION = { 'Mis materiales': 'inventario-lanas', 'Mi emprendimiento': 'control-pedidos', 'Finanzas del negocio': 'fin-resumen', 'Fechas y bienestar': 'calendario-anual' };

  window.lrDashboards = {
    pintar: function (titulo, cont) {
      var fn = T[titulo]; cont.textContent = ''; if (!fn) return;
      if (SECCION[titulo] && bloqueada(SECCION[titulo])) return;    // sección de membresía bloqueada: sin tablero
      var enc = el('h3', 'db-titulo', 'Cómo vas'); cont.appendChild(enc);
      var g = el('div', 'db-grid'); cont.appendChild(g);
      try { fn(g); } catch (e) { cont.textContent = ''; }
    }
  };
})();
