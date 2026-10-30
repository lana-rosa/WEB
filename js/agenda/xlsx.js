/* Escritor mínimo de archivos Excel (.xlsx) sin librerías: un libro con varias hojas de texto y números.
   window.lrXlsx.crear([{ nombre, columnas: [..], filas: [[..], ..] }]) devuelve un Blob. Una celda puede ser un texto, un número, o { n: número, f: 'peso' | 'fecha' } (número con formato de pesos o fecha de Excel; 30-oct-2026). El archivo es un ZIP sin compresión. */
(function () {
  'use strict';
  var TABLA = (function () { var t = [], c, n, k; for (n = 0; n < 256; n++) { c = n; for (k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(b) { var c = 0xFFFFFFFF; for (var i = 0; i < b.length; i++) c = TABLA[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  var enc = new TextEncoder();
  function esc(t) { return String(t).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function letra(i) { var s = ''; i++; while (i > 0) { var m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; }
  function nombreHoja(n, usados) {
    var b = String(n || 'Hoja').replace(/[\[\]:*?\/\\]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 31) || 'Hoja', x = b, i = 2;
    while (usados.indexOf(x.toLowerCase()) >= 0) x = b.slice(0, 28) + ' ' + (i++);
    usados.push(x.toLowerCase()); return x;
  }
  function celda(v, r, c, estilo) {
    var ref = letra(c) + r, s = estilo ? ' s="1"' : '';
    if (v && typeof v === 'object' && isFinite(v.n)) return '<c r="' + ref + '" s="' + (v.f === 'fecha' ? 3 : 2) + '"><v>' + v.n + '</v></c>';
    if (typeof v === 'number' && isFinite(v)) return '<c r="' + ref + '"' + s + '><v>' + v + '</v></c>';
    if (v === true) v = 'Sí'; else if (v === false || v == null) v = '';
    v = String(v); if (v === '') return '';
    return '<c r="' + ref + '"' + s + ' t="inlineStr"><is><t xml:space="preserve">' + esc(v) + '</t></is></c>';
  }
  function hojaXml(h) {
    var filas = [h.columnas].concat(h.filas), cols = h.columnas.length, ancho = [];
    filas.forEach(function (f) { f.forEach(function (v, i) { var l = String(v == null ? '' : (v && typeof v === 'object' ? (v.f === 'fecha' ? '00/00/0000' : '$ 000.000.000') : v)).split('\n').reduce(function (m, x) { return Math.max(m, x.length); }, 0); ancho[i] = Math.min(60, Math.max(ancho[i] || 10, l + 2)); }); });
    var x = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>';
    for (var i = 0; i < cols; i++) x += '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + (ancho[i] || 12) + '" customWidth="1"/>';
    x += '</cols><sheetData>';
    filas.forEach(function (f, ri) { x += '<row r="' + (ri + 1) + '">' + f.map(function (v, ci) { return celda(v, ri + 1, ci, ri === 0); }).join('') + '</row>'; });
    return x + '</sheetData></worksheet>';
  }
  function zip(archivos) {
    var partes = [], central = [], pos = 0;
    archivos.forEach(function (a) {
      var nombre = enc.encode(a.n), datos = enc.encode(a.c), crc = crc32(datos);
      var lh = new DataView(new ArrayBuffer(30)); lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, 0, true);
      lh.setUint16(10, 0, true); lh.setUint16(12, 0x21, true); lh.setUint32(14, crc, true); lh.setUint32(18, datos.length, true); lh.setUint32(22, datos.length, true); lh.setUint16(26, nombre.length, true); lh.setUint16(28, 0, true);
      var ch = new DataView(new ArrayBuffer(46)); ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(10, 0, true);
      ch.setUint16(12, 0, true); ch.setUint16(14, 0x21, true); ch.setUint32(16, crc, true); ch.setUint32(20, datos.length, true); ch.setUint32(24, datos.length, true); ch.setUint16(28, nombre.length, true); ch.setUint32(42, pos, true);
      partes.push(lh.buffer, nombre, datos); central.push(ch.buffer, nombre);
      pos += 30 + nombre.length + datos.length;
    });
    var tamC = 0; central.forEach(function (b) { tamC += b.byteLength !== undefined ? b.byteLength : b.length; });
    var fin = new DataView(new ArrayBuffer(22)); fin.setUint32(0, 0x06054b50, true); fin.setUint16(8, archivos.length, true); fin.setUint16(10, archivos.length, true); fin.setUint32(12, tamC, true); fin.setUint32(16, pos, true);
    return new Blob(partes.concat(central, [fin.buffer]), { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }
  function crear(hojas) {
    var usados = [], nombres = hojas.map(function (h) { return nombreHoja(h.nombre, usados); }), a = [];
    var ct = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>';
    hojas.forEach(function (h, i) { ct += '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'; });
    a.push({ n: '[Content_Types].xml', c: ct + '</Types>' });
    a.push({ n: '_rels/.rels', c: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>' });
    var wb = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>', rel = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">';
    hojas.forEach(function (h, i) { wb += '<sheet name="' + esc(nombres[i]) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>'; rel += '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>'; a.push({ n: 'xl/worksheets/sheet' + (i + 1) + '.xml', c: hojaXml(h) }); });
    rel += '<Relationship Id="rId' + (hojas.length + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>';
    a.push({ n: 'xl/workbook.xml', c: wb + '</sheets></workbook>' }); a.push({ n: 'xl/_rels/workbook.xml.rels', c: rel });
    a.push({ n: 'xl/styles.xml', c: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="2"><numFmt numFmtId="164" formatCode="&quot;$&quot;#,##0"/><numFmt numFmtId="165" formatCode="dd/mm/yyyy"/></numFmts><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFE74E96"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="4"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>' });
    return zip(a);
  }
  window.lrXlsx = { crear: crear };
})();
