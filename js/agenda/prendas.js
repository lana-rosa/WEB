/* Agenda para tejedoras: prendas a medida (28-oct-2026).
   Con la prenda, la talla (XS a XL) y las medidas de la clienta calcula puntos y vueltas según la muestra, y dibuja la prenda en un maniquí y el esquema
   de sus piezas con las medidas en cm. Son cálculos de referencia (hay que tejer y medir la muestra). Los datos son los campos ag-pr-* de la hoja
   (cada prenda es una ficha; lo maneja formas.js). */
(function () {
  'use strict';
  var hoja = document.getElementById('prendas-medida');
  if (!hoja) return;
  function el(id) { return document.getElementById(id); }
  function num(id) { var e = el(id), v = e ? parseFloat(String(e.value).replace(',', '.')) : NaN; return isFinite(v) && v > 0 ? v : null; }
  function txt(id) { var e = el(id); return e ? String(e.value || '').trim() : ''; }
  function esc(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function r1(x) { return Math.round(x * 10) / 10; }
  function f(x) { return String(r1(x)).replace('.', ','); }

  /* Medidas de referencia por talla (cm). Son generales: la persona las cambia por las de su clienta */
  var TALLAS = {
    XS: { busto: 80, cintura: 62, cadera: 88, hombros: 36, manga: 41, brazo: 26, puno: 15, cabeza: 54 },
    S:  { busto: 86, cintura: 68, cadera: 94, hombros: 37.5, manga: 42, brazo: 28, puno: 15.5, cabeza: 55 },
    M:  { busto: 92, cintura: 74, cadera: 100, hombros: 39, manga: 43, brazo: 30, puno: 16, cabeza: 56 },
    L:  { busto: 98, cintura: 80, cadera: 106, hombros: 40.5, manga: 44, brazo: 32, puno: 17, cabeza: 57 },
    XL: { busto: 106, cintura: 88, cadera: 114, hombros: 42, manga: 45, brazo: 35, puno: 18, cabeza: 58 }
  };
  var LARGOS = { 'Suéter': [54, 56, 58, 60, 62], 'Chaleco': [52, 54, 56, 58, 60], 'Gorro': [20, 20, 20, 21, 21], 'Falda': [50, 52, 54, 56, 58], 'Bufanda': [150, 150, 150, 150, 150] };
  var ORDEN = ['XS', 'S', 'M', 'L', 'XL'];
  var HOLGURA = { 'Suéter': { Ajustado: 2, Normal: 8, Holgado: 16 }, 'Chaleco': { Ajustado: 2, Normal: 8, Holgado: 14 }, 'Gorro': { Ajustado: -4, Normal: -2, Holgado: 0 }, 'Falda': { Ajustado: 2, Normal: 6, Holgado: 12 }, 'Bufanda': { Ajustado: 0, Normal: 0, Holgado: 0 } };
  var RELEVANTES = { 'Suéter': ['busto', 'hombros', 'largo', 'manga', 'brazo', 'puno'], 'Chaleco': ['busto', 'hombros', 'largo'], 'Gorro': ['cabeza', 'largo'], 'Falda': ['cintura', 'cadera', 'largo'], 'Bufanda': ['ancho', 'largo'] };
  var ETQ_LARGO = { 'Suéter': 'Largo del suéter (del hombro al borde)', 'Chaleco': 'Largo del chaleco (del hombro al borde)', 'Gorro': 'Altura total del gorro', 'Falda': 'Largo de la falda (de la cintura al borde)', 'Bufanda': 'Largo de la bufanda' };

  function par(x) { return Math.max(2, Math.round(x / 2) * 2); }
  function mult(x, m) { return Math.max(m, Math.round(x / m) * m); }

  /* ---- cálculos por prenda: devuelven { piezas: [{nombre, ancho, alto, ...}], lineas: [[titulo, [textos]]], dibujo } ---- */
  function calcular() {
    var prenda = txt('ag-pr-prenda'), pts = num('ag-pr-pts'), vts = num('ag-pr-vts'), aj = txt('ag-pr-ajuste') || 'Normal';
    if (!prenda) return { aviso: 'Elige la prenda para empezar.' };
    var falta = RELEVANTES[prenda].filter(function (m) { return num('ag-pr-' + m) === null; });
    if (falta.length) return { aviso: 'Escribe las medidas de tu clienta (en cm) para ver cómo quedaría.' };
    var ease = HOLGURA[prenda][aj] || 0, M = {}; RELEVANTES[prenda].forEach(function (m) { M[m] = num('ag-pr-' + m); });
    var S = function (cm) { return pts ? par(cm * pts / 10) : null; }, V = function (cm) { return vts ? Math.round(cm * vts / 10) : null; };
    var L = [], piezas = [], g = { prenda: prenda, color: txt('ag-pr-color') || '#E74E96', M: M, ease: ease };
    function lin(t, a) { L.push([t, a]); }
    function sv(cm) { var s = S(cm), v = V(cm); return (s ? s + ' puntos' : '—') + ' × ' + (v ? v + ' vueltas' : '—'); }

    if (prenda === 'Suéter' || prenda === 'Chaleco') {
      var bf = M.busto + ease, ancho = bf / 2, sisa = Math.max(18, M.busto / 4), cuello = r1(M.busto * 0.19), prof = 7, recto = M.largo - sisa;
      g.bf = bf; g.sisa = sisa; g.cuello = cuello;
      piezas.push({ n: 'Espalda y frente (2 piezas iguales)', w: ancho, h: M.largo, tipo: 'cuerpo', sisa: sisa, cuello: cuello, prof: prof, hombros: M.hombros });
      lin('Espalda y frente (2 piezas)', [
        'Contorno final de la prenda: ' + f(bf) + ' cm (' + f(M.busto) + ' de busto + ' + ease + ' de holgura). Cada pieza mide ' + f(ancho) + ' cm de ancho.',
        pts ? 'Monta ' + S(ancho) + ' puntos (≈ ' + f(ancho) + ' cm).' : 'Escribe tu muestra para calcular los puntos.',
        vts ? 'Teje recto ' + V(recto) + ' vueltas (' + f(recto) + ' cm) hasta la sisa.' : '',
        vts ? 'Sisa: sigue recto ' + V(sisa) + ' vueltas más (' + f(sisa) + ' cm) hasta el hombro. Altura total: ' + V(M.largo) + ' vueltas (' + f(M.largo) + ' cm).' : '',
        pts ? 'Hombros: cada uno ≈ ' + S((M.hombros - cuello) / 2) + ' puntos; deja ' + S(cuello) + ' puntos al centro para el cuello (' + f(cuello) + ' cm).' : '',
        vts ? 'Escote del frente: empieza a ' + f(prof) + ' cm del hombro (' + V(prof) + ' vueltas antes del final); en la espalda baja solo 2,5 cm.' : ''].filter(Boolean));
      if (prenda === 'Chaleco') {
        var entre = Math.max(M.hombros - 2, cuello + 8);
        lin('Sisas del chaleco', [pts ? 'A la altura de la sisa cierra ' + par((ancho - entre) / 2 * pts / 10) + ' puntos a cada lado (para que queden ' + S(entre) + ' puntos entre los hombros, ≈ ' + f(entre) + ' cm).' : 'Escribe tu muestra para calcular las sisas.', 'Remata las orillas de las sisas con una vuelta de punto bajo.']);
      } else {
        var cu = M.puno + 2, top = M.brazo + (aj === 'Ajustado' ? 4 : (aj === 'Holgado' ? 12 : 8)), lm = M.manga;
        piezas.push({ n: 'Manga (2 piezas iguales)', w: top / 2, w2: cu / 2, h: lm, tipo: 'manga' }); g.top = top; g.cu = cu;
        var sCu = S(cu / 2), sTop = S(top / 2), rM = V(lm), inc = (sCu && sTop) ? Math.max(0, (sTop - sCu) / 2) : null;
        lin('Mangas (2 piezas)', [
          'Puño: ' + f(cu) + ' cm de contorno (' + f(M.puno) + ' de muñeca + 2). Parte alta: ' + f(top) + ' cm de contorno.',
          sCu ? 'Monta ' + sCu + ' puntos para el puño (≈ ' + f(cu / 2) + ' cm de ancho).' : '',
          (inc !== null && rM) ? 'Aumenta ' + inc + ' puntos a cada lado en total hasta llegar a ' + sTop + ' puntos' + (inc > 0 ? ' (un aumento a cada lado cada ' + Math.max(2, Math.floor(rM / inc)) + ' vueltas)' : '') + '. Largo: ' + rM + ' vueltas (' + f(lm) + ' cm).' : '',
          'Cose la manga a la sisa y cierra el costado.'].filter(Boolean));
      }
      lin('Armado', ['Une los hombros, deja abierto el cuello y teje 4 a 6 vueltas de borde alrededor.', 'Cierra los costados' + (prenda === 'Suéter' ? ' y las mangas' : '') + ' con aguja lanera.']);
    } else if (prenda === 'Gorro') {
      var cg = M.cabeza + ease, sg = pts ? mult(cg * pts / 10, 8) : null, corona = 7, tubo = Math.max(8, M.largo - corona);
      g.cg = cg; piezas.push({ n: 'Gorro (en redondo)', w: cg, h: M.largo, tipo: 'gorro', corona: corona });
      lin('Gorro en redondo', [
        'Contorno final: ' + f(cg) + ' cm (' + f(M.cabeza) + ' de cabeza ' + (ease < 0 ? '− ' + (-ease) : '+ ' + ease) + ', porque el gorro estira).',
        sg ? 'Monta ' + sg + ' puntos y cierra en redondo.' : 'Escribe tu muestra para calcular los puntos.',
        vts ? 'Teje recto ' + V(tubo) + ' vueltas (' + f(tubo) + ' cm); si quieres borde doblado, suma ' + V(5) + ' vueltas.' : '',
        sg ? 'Corona (' + f(corona) + ' cm): en ' + (sg / 8) + ' puntos de cada ' + 'sector disminuye 1 punto cada vuelta o cada dos vueltas, en 8 sectores; ' + 'quedarán ' + (sg / 8 - 1) + ' vueltas de disminución hasta cerrar con 8 puntos.' : '',
        'Pasa el hilo por los puntos restantes, aprieta y remata.'].filter(Boolean));
    } else if (prenda === 'Falda') {
      var cf = M.cintura + ease / 2 + 2, hf = M.cadera + ease, prHip = 20, sc = S(cf), sh = S(hf), inc2 = (sc && sh) ? Math.max(0, sh - sc) : null;
      g.cf = cf; g.hf = hf; piezas.push({ n: 'Falda (en redondo, desde la cintura)', w: cf, w2: hf, h: M.largo, tipo: 'falda', hip: prHip });
      lin('Falda en redondo, desde la cintura', [
        'Contorno de la cintura: ' + f(cf) + ' cm. Contorno de la cadera: ' + f(hf) + ' cm (' + f(M.cadera) + ' + ' + ease + ' de holgura).',
        sc ? 'Monta ' + sc + ' puntos para la cintura (pasa un elástico por la pretina).' : 'Escribe tu muestra para calcular los puntos.',
        (inc2 !== null && vts) ? 'Aumenta ' + inc2 + ' puntos en total en los primeros ' + prHip + ' cm (' + V(prHip) + ' vueltas): ' + (inc2 > 0 ? 'repártelos en ' + Math.max(1, Math.ceil(inc2 / 4)) + ' vueltas de aumento, 4 puntos cada vez, cada ' + Math.max(2, Math.floor(V(prHip) / Math.max(1, Math.ceil(inc2 / 4)))) + ' vueltas.' : 'no hace falta aumentar.') : '',
        vts ? 'Sigue recto hasta ' + V(M.largo) + ' vueltas en total (' + f(M.largo) + ' cm).' : ''].filter(Boolean));
    } else if (prenda === 'Bufanda') {
      piezas.push({ n: 'Bufanda', w: M.ancho, h: M.largo, tipo: 'bufanda' });
      lin('Bufanda', [pts ? 'Monta ' + par(M.ancho * pts / 10) + ' puntos (≈ ' + f(M.ancho) + ' cm de ancho).' : 'Escribe tu muestra para calcular los puntos.', vts ? 'Teje ' + V(M.largo) + ' vueltas (' + f(M.largo) + ' cm de largo).' : '']);
    }
    return { piezas: piezas, lineas: L, g: g, ancho: !!pts && !!vts };
  }

  /* ---- maniquí (vista de frente) con la prenda encima ---- */
  var K = 2.3;   // píxeles por cm
  function maniqui(r) {
    var g = r.g, M = g.M, prenda = g.prenda, base = TALLAS[txt('ag-pr-talla')] || TALLAS.M;
    var busto = M.busto || base.busto, cintura = M.cintura || base.cintura, cadera = M.cadera || base.cadera, hombros = M.hombros || base.hombros, cabeza = M.cabeza || base.cabeza;
    var cx = 150, yH = 6, ySh = 30, yBu = 46, yCi = 63, yCa = 83, yPie = 168;
    function X(c) { return (cx + c * K).toFixed(1); } function Y(c) { return (c * K + 8).toFixed(1); }
    var hs = hombros / 2, bu = busto * 0.155, ci = cintura * 0.15, ca = cadera * 0.155, sv = '';
    var piel = '#E9DCD3', cuerpo = '#D9D3CF';
    sv += '<ellipse cx="' + cx + '" cy="' + Y(14) + '" rx="' + (cabeza / (2 * Math.PI) * K * 1.05).toFixed(1) + '" ry="' + (11.5 * K).toFixed(1) + '" fill="' + piel + '"/>';
    sv += '<rect x="' + X(-4.2) + '" y="' + Y(24) + '" width="' + (8.4 * K).toFixed(1) + '" height="' + (7 * K).toFixed(1) + '" fill="' + piel + '"/>';
    sv += '<path d="M' + X(-5) + ',' + Y(ySh - 1) + ' L' + X(-hs) + ',' + Y(ySh) + ' L' + X(-bu) + ',' + Y(yBu) + ' L' + X(-ci) + ',' + Y(yCi) + ' L' + X(-ca) + ',' + Y(yCa) + ' L' + X(ca) + ',' + Y(yCa) + ' L' + X(ci) + ',' + Y(yCi) + ' L' + X(bu) + ',' + Y(yBu) + ' L' + X(hs) + ',' + Y(ySh) + ' L' + X(5) + ',' + Y(ySh - 1) + ' Z" fill="' + cuerpo + '"/>';
    var br = (M.brazo || base.brazo) / Math.PI * K;
    [-1, 1].forEach(function (d) { sv += '<path d="M' + X(d * hs) + ',' + Y(ySh + 1) + ' L' + X(d * (hs + 6)) + ',' + Y(ySh + 30) + ' L' + X(d * (hs + 9)) + ',' + Y(ySh + 55) + '" stroke="' + piel + '" stroke-width="' + (br * 0.85).toFixed(1) + '" stroke-linecap="round" fill="none"/>'; });
    sv += '<rect x="' + X(-ca + 1) + '" y="' + Y(yCa) + '" width="' + (2 * (ca - 1) * K / 2 - 3).toFixed(1) + '" height="' + ((yPie - yCa) * K).toFixed(1) + '" fill="' + cuerpo + '"/><rect x="' + (cx + 3) + '" y="' + Y(yCa) + '" width="' + (2 * (ca - 1) * K / 2 - 3).toFixed(1) + '" height="' + ((yPie - yCa) * K).toFixed(1) + '" fill="' + cuerpo + '"/>';
    var c = g.color, o = 0.9;
    if (prenda === 'Suéter' || prenda === 'Chaleco') {
      var wf = g.bf * 0.155 + 0.5, yFin = ySh + M.largo * 0.92 - 4;
      if (prenda === 'Suéter') {
        var mt = (g.top / Math.PI) * K, mc = (g.cu / Math.PI) * K;
        [-1, 1].forEach(function (d) {
          var x0 = d * (hs + 1), y0 = ySh + 1, x1 = d * (hs + 9.5), y1 = ySh + 55, dx = x1 - x0, dy = y1 - y0, ln = Math.hypot(dx, dy), nx = -dy / ln, ny = dx / ln;
          var a1 = [x0 + nx * mt / K / 2, y0 + ny * mt / K / 2], a2 = [x0 - nx * mt / K / 2, y0 - ny * mt / K / 2], b1 = [x1 + nx * mc / K / 2, y1 + ny * mc / K / 2], b2 = [x1 - nx * mc / K / 2, y1 - ny * mc / K / 2];
          sv += '<path d="M' + X(a1[0]) + ',' + Y(a1[1]) + ' L' + X(b1[0]) + ',' + Y(b1[1]) + ' L' + X(b2[0]) + ',' + Y(b2[1]) + ' L' + X(a2[0]) + ',' + Y(a2[1]) + ' Z" fill="' + c + '" fill-opacity="' + o + '" stroke="rgba(0,0,0,.18)"/>';
        });
      }
      sv += '<path d="M' + X(-g.cuello / 2) + ',' + Y(ySh - 0.5) + ' Q' + X(0) + ',' + Y(ySh + 7) + ' ' + X(g.cuello / 2) + ',' + Y(ySh - 0.5) + ' L' + X(hs + 1) + ',' + Y(ySh) + ' L' + X(wf) + ',' + Y(yBu) + ' L' + X(wf) + ',' + Y(yFin) + ' L' + X(-wf) + ',' + Y(yFin) + ' L' + X(-wf) + ',' + Y(yBu) + ' L' + X(-hs - 1) + ',' + Y(ySh) + ' Z" fill="' + c + '" fill-opacity="' + o + '" stroke="rgba(0,0,0,.18)"/>';
    } else if (prenda === 'Falda') {
      var wC = g.cf * 0.155, wH = g.hf * 0.155 + 0.5, yF = yCi + M.largo * 0.95;
      sv += '<path d="M' + X(-wC) + ',' + Y(yCi - 1) + ' L' + X(wC) + ',' + Y(yCi - 1) + ' L' + X(wH) + ',' + Y(yCa) + ' L' + X(wH + 1) + ',' + Y(yF) + ' L' + X(-wH - 1) + ',' + Y(yF) + ' L' + X(-wH) + ',' + Y(yCa) + ' Z" fill="' + c + '" fill-opacity="' + o + '" stroke="rgba(0,0,0,.18)"/>';
    } else if (prenda === 'Gorro') {
      var rx = (g.cg / (2 * Math.PI)) * K * 1.12, top = 14 - 11.5;
      sv += '<path d="M' + (cx - rx).toFixed(1) + ',' + Y(13) + ' Q' + (cx - rx).toFixed(1) + ',' + Y(top - 7) + ' ' + cx + ',' + Y(top - 8) + ' Q' + (cx + rx).toFixed(1) + ',' + Y(top - 7) + ' ' + (cx + rx).toFixed(1) + ',' + Y(13) + ' Z" fill="' + c + '" fill-opacity="' + o + '" stroke="rgba(0,0,0,.18)"/>';
      sv += '<rect x="' + (cx - rx - 2).toFixed(1) + '" y="' + Y(10) + '" width="' + (2 * rx + 4).toFixed(1) + '" height="' + (4 * K).toFixed(1) + '" rx="4" fill="' + c + '" stroke="rgba(0,0,0,.25)"/>';
    } else if (prenda === 'Bufanda') {
      sv += '<path d="M' + X(-8) + ',' + Y(25) + ' L' + X(8) + ',' + Y(25) + ' L' + X(10) + ',' + Y(ySh + 4) + ' L' + X(-10) + ',' + Y(ySh + 4) + ' Z" fill="' + c + '" fill-opacity="' + o + '" stroke="rgba(0,0,0,.18)"/><rect x="' + X(1) + '" y="' + Y(ySh + 2) + '" width="' + (g.M.ancho * K).toFixed(1) + '" height="' + (Math.min(60, g.M.largo * 0.4) * K).toFixed(1) + '" fill="' + c + '" fill-opacity="' + o + '" stroke="rgba(0,0,0,.18)"/>';
    }
    return '<svg viewBox="0 0 300 410" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' + sv + '</svg>';
  }

  /* ---- esquema de piezas con medidas ---- */
  function esquema(r) {
    var piezas = r.piezas, esc2 = 1.6, x = 14, y = 34, sv = '', anchoMax = 0;
    piezas.forEach(function (p) {
      var w = Math.max(40, p.w * esc2), h = Math.min(260, Math.max(40, p.h * esc2));
      if (p.tipo === 'bufanda') { h = Math.min(220, h / 4); w = Math.max(40, Math.min(200, p.w * esc2)); }
      var cxp = x + (p.w2 && p.tipo === 'manga' ? Math.max(w, p.w2 * esc2) / 2 : w / 2);
      var tt = p.n.split(' ('); sv += '<text x="' + x + '" y="' + (y - 19) + '" font-size="11" font-weight="700" fill="#555">' + esc(tt[0]) + '</text>' + (tt[1] ? '<text x="' + x + '" y="' + (y - 8) + '" font-size="10" fill="#777">(' + esc(tt[1]) + '</text>' : '');
      if (p.tipo === 'cuerpo') {
        var sx = (p.hombros ? (w - Math.min(w, p.hombros * esc2)) / 2 : 0) * 0, sis = p.sisa * esc2, cu = p.cuello * esc2, pr = p.prof * esc2;
        sv += '<path d="M' + x + ',' + (y + h) + ' L' + x + ',' + (y + sis * 0.15) + ' L' + (x + w / 2 - cu / 2) + ',' + y + ' Q' + (x + w / 2) + ',' + (y + pr) + ' ' + (x + w / 2 + cu / 2) + ',' + y + ' L' + (x + w) + ',' + (y + sis * 0.15) + ' L' + (x + w) + ',' + (y + h) + ' Z" fill="#FBE4EF" stroke="#E74E96" stroke-width="1.6"/>';
        sv += '<line x1="' + x + '" y1="' + (y + sis) + '" x2="' + (x + 10) + '" y2="' + (y + sis) + '" stroke="#999" stroke-dasharray="3 2"/><text x="' + (x + 14) + '" y="' + (y + sis + 4) + '" font-size="10" fill="#777">sisa ' + f(p.sisa) + '</text>';
      } else if (p.tipo === 'manga') {
        var w2 = p.w2 * esc2, wm = Math.max(w, w2);
        sv += '<path d="M' + (x + (wm - w) / 2) + ',' + y + ' L' + (x + (wm + w) / 2) + ',' + y + ' L' + (x + (wm + w2) / 2) + ',' + (y + h) + ' L' + (x + (wm - w2) / 2) + ',' + (y + h) + ' Z" fill="#E6E7FD" stroke="#6D72E0" stroke-width="1.6"/>';
        sv += '<text x="' + (x + wm / 2) + '" y="' + (y + h + 14) + '" text-anchor="middle" font-size="10" fill="#555">puño ' + f(p.w2) + '</text><text x="' + (x + wm / 2) + '" y="' + (y + 12) + '" text-anchor="middle" font-size="10" fill="#555">arriba ' + f(p.w) + '</text>';
        w = wm;
      } else if (p.tipo === 'falda') {
        var w2f = p.w2 * esc2, wmf = Math.max(w, w2f), hh = Math.min(h, 230);
        sv += '<path d="M' + (x + (wmf - w) / 2) + ',' + y + ' L' + (x + (wmf + w) / 2) + ',' + y + ' L' + (x + wmf) + ',' + (y + p.hip * esc2) + ' L' + (x + wmf) + ',' + (y + hh) + ' L' + x + ',' + (y + hh) + ' L' + x + ',' + (y + p.hip * esc2) + ' Z" fill="#DDF3E4" stroke="#3FAE73" stroke-width="1.6"/>';
        sv += '<text x="' + (x + wmf / 2) + '" y="' + (y + 12) + '" text-anchor="middle" font-size="10" fill="#555">cintura ' + f(p.w) + '</text>'; w = wmf; h = hh;
      } else if (p.tipo === 'gorro') {
        var rr = Math.min(80, w / 2);
        sv += '<path d="M' + x + ',' + (y + h) + ' L' + x + ',' + (y + p.corona * esc2 * 1.2) + ' Q' + x + ',' + y + ' ' + (x + w / 2) + ',' + y + ' Q' + (x + w) + ',' + y + ' ' + (x + w) + ',' + (y + p.corona * esc2 * 1.2) + ' L' + (x + w) + ',' + (y + h) + ' Z" fill="#FFF0E1" stroke="#F0933B" stroke-width="1.6"/>';
      } else {
        sv += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="#E8F2FF" stroke="#4C9BEA" stroke-width="1.6"/>';
      }
      if (p.tipo !== 'manga') sv += '<text x="' + (x + w / 2) + '" y="' + (y + h + 26) + '" text-anchor="middle" font-size="11" font-weight="700" fill="#333">' + (p.tipo === 'gorro' ? 'contorno ' + f(p.w) + ' cm' : (p.tipo === 'falda' ? 'cadera ' + f(p.w2) + ' cm' : 'ancho ' + f(p.w) + ' cm')) + '</text>';
      sv += '<text x="' + (x + w + 6) + '" y="' + (y + h / 2) + '" font-size="11" font-weight="700" fill="#333">' + f(p.h) + ' cm</text>';
      x += w + 56; anchoMax = Math.max(anchoMax, x);
    });
    var alto = 34 + Math.max.apply(null, piezas.map(function (p) { var h = Math.min(260, Math.max(40, p.h * esc2)); if (p.tipo === 'bufanda') h = Math.min(220, h / 4); return h; })) + 44;
    return '<svg viewBox="0 0 ' + Math.max(300, anchoMax) + ' ' + alto + '" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="font-family:Arial,sans-serif">' + sv + '</svg>';
  }

  var ultimo = null;
  function pintar() {
    var r = calcular(), aviso = el('pr-aviso'), calc = el('pr-calculos');
    ultimo = r;
    if (r.aviso) { aviso.textContent = r.aviso; aviso.hidden = false; el('pr-maniqui').innerHTML = ''; el('pr-esquema').innerHTML = ''; calc.textContent = ''; return; }
    aviso.hidden = !!r.ancho; aviso.textContent = r.ancho ? '' : 'Escribe tu muestra (puntos y vueltas en 10 cm) para ver también cuántos puntos y vueltas necesitas.';
    el('pr-maniqui').innerHTML = maniqui(r); el('pr-esquema').innerHTML = esquema(r);
    calc.textContent = '';
    r.lineas.forEach(function (l) {
      var d = document.createElement('div'); d.className = 'pr-bloque'; var h = document.createElement('h5'); h.textContent = l[0]; d.appendChild(h);
      var ul = document.createElement('ul'); l[1].forEach(function (t) { var li = document.createElement('li'); li.textContent = t; ul.appendChild(li); }); d.appendChild(ul); calc.appendChild(d);
    });
  }
  /* medidas relevantes según la prenda; las demás se esconden */
  function mostrarMedidas() {
    var prenda = txt('ag-pr-prenda'), rel = RELEVANTES[prenda] || [];
    el('pr-medidas').querySelectorAll('[data-m]').forEach(function (d) { d.hidden = !!prenda && rel.indexOf(d.dataset.m) < 0; });
    el('pr-etq-largo').textContent = ETQ_LARGO[prenda] || 'Largo de la prenda';
  }
  /* al elegir la talla se llenan las medidas de referencia (la persona las puede cambiar) */
  function llenarPorTalla() {
    var t = txt('ag-pr-talla'), prenda = txt('ag-pr-prenda'), base = TALLAS[t]; if (!base) return;
    Object.keys(base).forEach(function (m) { var e = el('ag-pr-' + m); if (e && !e.dataset.manual) { e.value = String(base[m]); e.dispatchEvent(new Event('input', { bubbles: true })); } });
    var i = ORDEN.indexOf(t); if (prenda && LARGOS[prenda] && !el('ag-pr-largo').dataset.manual) { el('ag-pr-largo').value = String(LARGOS[prenda][i]); el('ag-pr-largo').dispatchEvent(new Event('input', { bubbles: true })); }
    if (prenda === 'Bufanda' && !el('ag-pr-ancho').value) { el('ag-pr-ancho').value = '20'; el('ag-pr-ancho').dispatchEvent(new Event('input', { bubbles: true })); }
  }
  /* lo que la persona escribe a mano no se vuelve a pisar con la talla */
  hoja.addEventListener('input', function (e) { if (e.isTrusted && e.target.id && /^ag-pr-(busto|cintura|cadera|hombros|largo|manga|brazo|puno|cabeza|ancho)$/.test(e.target.id)) e.target.dataset.manual = '1'; });
  hoja.addEventListener('change', function (e) {
    if (e.target.id === 'ag-pr-talla') { hoja.querySelectorAll('#pr-medidas [data-manual]').forEach(function (x) { delete x.dataset.manual; }); llenarPorTalla(); }
    if (e.target.id === 'ag-pr-prenda') { mostrarMedidas(); if (txt('ag-pr-talla')) { var l = el('ag-pr-largo'); delete l.dataset.manual; llenarPorTalla(); } }
    pintar();
  });
  hoja.addEventListener('input', function () { clearTimeout(pintar.t); pintar.t = setTimeout(pintar, 120); });
  document.addEventListener('version-cambiada', function (e) { if (e.detail.hoja === 'prendas-medida') { mostrarMedidas(); pintar(); } });
  document.addEventListener('agenda-guardada', function () { if (hoja.classList.contains('abierta')) { clearTimeout(pintar.t); pintar.t = setTimeout(pintar, 150); } });
  new MutationObserver(function () { if (hoja.classList.contains('abierta')) { mostrarMedidas(); pintar(); } }).observe(hoja, { attributes: true, attributeFilter: ['class'] });

  el('pr-imprimir').addEventListener('click', function () {
    var r = ultimo; if (!r || r.aviso) { alert('Primero elige la prenda y escribe las medidas.'); return; }
    var w = window.open('', '_blank'); if (!w) { alert('Tu navegador bloqueó la ventana. Permite las ventanas emergentes para imprimir.'); return; }
    var nombre = [txt('ag-pr-cliente'), txt('ag-pr-prenda'), txt('ag-pr-talla') && txt('ag-pr-talla') !== 'A medida' ? 'talla ' + txt('ag-pr-talla') : ''].filter(Boolean).join(' · ') || 'Prenda a medida';
    var medidas = RELEVANTES[txt('ag-pr-prenda')].map(function (m) { var e = el('ag-pr-' + m), l = document.querySelector('label[for="ag-pr-' + m + '"]'); return '<li>' + esc(l ? l.textContent : m) + ': <b>' + esc(e.value) + ' cm</b></li>'; }).join('');
    var calc = r.lineas.map(function (l) { return '<h3>' + esc(l[0]) + '</h3><ul>' + l[1].map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>'; }).join('');
    w.document.write('<!doctype html><html lang="es-CO"><head><meta charset="utf-8"><title>' + esc(nombre) + '</title><style>body{font-family:Arial,Helvetica,sans-serif;color:#333;max-width:780px;margin:24px auto;padding:0 18px;line-height:1.45}h1{color:#E74E96;font-size:24px;margin:0 0 4px}h3{font-size:14px;text-transform:uppercase;letter-spacing:.05em;color:#E74E96;border-bottom:1px solid #F28FC0;margin:18px 0 4px;padding-bottom:3px}ul{margin:4px 0;padding-left:20px}.fig{display:flex;gap:16px;flex-wrap:wrap;align-items:flex-start}.fig svg{max-width:340px;height:auto}.pie{margin-top:24px;font-size:12px;color:#888;border-top:1px dashed #ccc;padding-top:8px}@media print{body{margin:0}}</style></head><body><h1>' + esc(nombre) + '</h1><p>Muestra: ' + esc(txt('ag-pr-pts') || '—') + ' puntos y ' + esc(txt('ag-pr-vts') || '—') + ' vueltas en 10 cm · ' + esc(txt('ag-pr-ajuste') || 'Normal') + '</p><h3>Medidas de la clienta</h3><ul>' + medidas + '</ul><div class="fig">' + el('pr-maniqui').innerHTML + el('pr-esquema').innerHTML + '</div>' + calc + '<p class="pie">Cálculos de referencia. Hecho con la Agenda para tejedoras · Lana Rosa Crochet · lanarosacrochet.com</p></body></html>');
    w.document.close(); w.focus(); setTimeout(function () { w.print(); }, 300);
    (window.dataLayer = window.dataLayer || []).push({ event: 'resource_use', recurso: 'agenda_prenda_imprimir' });
  });
  mostrarMedidas(); pintar();
  window.lrPrendas = { calcular: calcular, TALLAS: TALLAS };
})();
