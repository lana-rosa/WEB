/* Agenda para tejedoras: escritor de PDF mínimo, sin librerías (10-nov-2026; lo usa informe-pdf.js para «Guardar el informe del mes en tu Drive»).
   Solo texto (Helvetica estándar, que todo lector de PDF trae; sin incrustar fuentes): títulos, filas «etiqueta … valor», notas con salto de línea, varias páginas A4 y un pie.
   Codificación WinAnsi (cp1252): tildes, ñ, «», comillas y puntos suspensivos salen bien; lo que no existe en esa tabla (emoji, símbolos raros) se reemplaza por «?».
   API: window.lrPdf.crear({ titulo, subtitulo, pie, bloques: [{ t: 'h1'|'h2'|'fila'|'nota'|'espacio', a, b }] }) → Blob application/pdf. También se puede cargar con require() para probarlo con Node (devuelve bytes). */
(function (raiz) {
  'use strict';
  var A4 = [595.28, 841.89], MARGEN = 50, PIE = 36;
  // Anchos de Helvetica (milésimas de em) de ' ' a '~'
  var W = [278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584];
  var ESPECIAL = { 8220: 0x93, 8221: 0x94, 8216: 0x91, 8217: 0x92, 8211: 0x96, 8212: 0x97, 8230: 0x85, 8226: 0x95, 8364: 0x80, 8722: 45, 183: 0xB7 };
  function aByte(c) { if (c < 128) return c; if (ESPECIAL[c]) return ESPECIAL[c]; if (c >= 160 && c <= 255) return c; return 63; }
  function bytes(s) { var o = []; s = String(s == null ? '' : s).normalize('NFC'); for (var i = 0; i < s.length; i++) { var c = s.charCodeAt(i); if (c >= 0xD800 && c <= 0xDBFF) { i++; o.push(63); continue; } if (c < 32) continue; o.push(aByte(c)); } return o; }
  function anchoCar(b) { if (b >= 32 && b <= 126) return W[b - 32]; if (b >= 192 && b <= 255) { var base = String.fromCharCode(b).normalize('NFD').charCodeAt(0); return base >= 32 && base <= 126 ? W[base - 32] : 556; } return 556; }
  function ancho(s, tam, neg) { var t = 0, b = bytes(s); for (var i = 0; i < b.length; i++) t += anchoCar(b[i]); return t * tam / 1000 * (neg ? 1.06 : 1); }
  function partir(s, tam, neg, max) {   // líneas que caben en `max` puntos
    var pal = String(s == null ? '' : s).split(/\s+/).filter(Boolean), lin = [], act = '';
    pal.forEach(function (p) {
      var prueba = act ? act + ' ' + p : p;
      if (ancho(prueba, tam, neg) <= max || !act) act = prueba; else { lin.push(act); act = p; }
    });
    if (act) lin.push(act); return lin.length ? lin : [''];
  }
  function esc(b) { var o = []; b.forEach(function (x) { if (x === 40 || x === 41 || x === 92) o.push(92); o.push(x); }); return o; }
  function txt(x, y, tam, fuente, s, color) {
    var o = (color ? color + ' rg ' : '0 g ') + 'BT /' + fuente + ' ' + tam.toFixed(1) + ' Tf ' + x.toFixed(2) + ' ' + y.toFixed(2) + ' Td (';
    return { pre: o, cuerpo: esc(bytes(s)), post: ') Tj ET\n' };
  }
  function crear(doc) {
    var util = A4[0] - 2 * MARGEN, paginas = [[]], y = A4[1] - MARGEN;
    function nueva() { paginas.push([]); y = A4[1] - MARGEN; }
    function sitio(alto) { if (y - alto < MARGEN + PIE) nueva(); }
    function poner(x, yy, tam, f, s, color) { paginas[paginas.length - 1].push(txt(x, yy, tam, f, s, color)); }
    function raya(yy) { paginas[paginas.length - 1].push({ pre: '0.85 0.85 0.88 RG 0.6 w ' + MARGEN + ' ' + yy.toFixed(2) + ' m ' + (MARGEN + util).toFixed(2) + ' ' + yy.toFixed(2) + ' l S\n', cuerpo: [], post: '' }); }
    if (doc.titulo) { poner(MARGEN, y - 18, 20, 'F2', doc.titulo, '0.91 0.31 0.59'); y -= 28; }
    if (doc.subtitulo) { partir(doc.subtitulo, 11, false, util).forEach(function (l) { poner(MARGEN, y - 11, 11, 'F1', l, '0.35 0.35 0.38'); y -= 15; }); y -= 6; }
    (doc.bloques || []).forEach(function (b) {
      if (b.t === 'espacio') { y -= 8; return; }
      if (b.t === 'h2') { sitio(40); y -= 10; poner(MARGEN, y - 13, 13, 'F2', b.a, '0.45 0.25 0.85'); y -= 20; raya(y + 3); y -= 4; return; }
      if (b.t === 'nota') { partir(b.a, 10, false, util).forEach(function (l) { sitio(14); poner(MARGEN, y - 10, 10, 'F1', l, '0.35 0.35 0.38'); y -= 14; }); y -= 2; return; }
      if (b.t === 'fila') {
        var tamB = 11, anchoB = ancho(b.b, tamB, true), lin = partir(b.a, 11, false, Math.max(120, util - anchoB - 14));
        sitio(16 * lin.length);
        lin.forEach(function (l, i) { poner(MARGEN, y - 11, 11, 'F1', l); if (i === 0 && b.b != null && b.b !== '') poner(MARGEN + util - anchoB, y - 11, tamB, 'F2', b.b); y -= 16; });
        return;
      }
      if (b.t === 'h1') { sitio(30); poner(MARGEN, y - 15, 15, 'F2', b.a); y -= 24; }
    });
    // pie con número de página
    var total = paginas.length;
    paginas.forEach(function (p, i) { p.push(txt(MARGEN, MARGEN - 8, 8, 'F1', (doc.pie || '') + (doc.pie ? ' · ' : '') + 'página ' + (i + 1) + ' de ' + total, '0.5 0.5 0.55')); });
    // armar el archivo
    var salida = [], offs = [], n = 0;
    function ponerBytes(arr) { for (var i = 0; i < arr.length; i++) salida.push(arr[i]); n += arr.length; }
    function ascii(s) { var a = []; for (var i = 0; i < s.length; i++) a.push(s.charCodeAt(i) & 255); return a; }
    function obj(num, cuerpoBytes) { offs[num] = n; ponerBytes(ascii(num + ' 0 obj\n')); ponerBytes(cuerpoBytes); ponerBytes(ascii('\nendobj\n')); }
    var nObj = 5 + total * 2;
    ponerBytes(ascii('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n'));
    obj(1, ascii('<< /Type /Catalog /Pages 2 0 R >>'));
    var kids = []; for (var p = 0; p < total; p++) kids.push((6 + p * 2) + ' 0 R');
    obj(2, ascii('<< /Type /Pages /Kids [' + kids.join(' ') + '] /Count ' + total + ' >>'));
    obj(3, ascii('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'));
    obj(4, ascii('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>'));
    obj(5, ascii('<< /Title (') .concat(esc(bytes(doc.titulo || 'Informe')), ascii(') /Creator (Agenda para tejedoras · Lana Rosa) >>')));
    paginas.forEach(function (p, i) {
      var cont = []; p.forEach(function (e) { cont = cont.concat(ascii(e.pre), e.cuerpo, ascii(e.post)); });
      obj(6 + i * 2, ascii('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + A4[0] + ' ' + A4[1] + '] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ' + (7 + i * 2) + ' 0 R >>'));
      obj(7 + i * 2, ascii('<< /Length ' + cont.length + ' >>\nstream\n').concat(cont, ascii('\nendstream')));
    });
    var xref = n, tabla = 'xref\n0 ' + (nObj + 1) + '\n0000000000 65535 f \n';
    for (var k = 1; k <= nObj; k++) tabla += ('0000000000' + offs[k]).slice(-10) + ' 00000 n \n';
    ponerBytes(ascii(tabla + 'trailer\n<< /Size ' + (nObj + 1) + ' /Root 1 0 R /Info 5 0 R >>\nstartxref\n' + xref + '\n%%EOF\n'));
    var u8 = new Uint8Array(salida.length); for (var q = 0; q < salida.length; q++) u8[q] = salida[q];
    return { bytes: u8, paginas: total };
  }
  var api = { crear: function (doc) { var r = crear(doc); return typeof Blob !== 'undefined' ? new Blob([r.bytes], { type: 'application/pdf' }) : r.bytes; }, _crear: crear, ancho: ancho };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else raiz.lrPdf = api;
})(typeof window !== 'undefined' ? window : this);
