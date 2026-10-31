/* Agenda para tejedoras: mezcla de dos versiones de la agenda sin perder datos (Plus para emprendedoras, etapa 7, 31-oct-2026).
   Se usa en la sincronización con Google Drive (drive-sync.js): cuando el celular y el computador cambiaron cosas distintas desde la última sincronización,
   se mezclan los cambios de los dos en lugar de que uno borre al otro. Es lógica pura (sin página ni red) para poder probarla con Node.
   Mezcla de tres vías: «base» = la última versión que los dos aparatos tenían igual; «local» = esta; «remoto» = la de Drive.
   · Listas de fichas (pedidos, clientas, ventas…): cada ficha se trata como una pieza. Si un aparato agregó una y el otro otra, quedan las dos; si uno borró una que el otro no tocó,
     se borra; si los dos cambiaron la misma ficha de forma distinta, quedan las dos versiones (nunca se pierde una: la persona borra la que sobre) y se avisa.
   · Datos sueltos: lo que cambió en un solo aparato se conserva; objetos y listas con «id» (movimientos de dinero, pagos fijos…) se mezclan por dentro;
     si la misma casilla cambió distinto en los dos, gana este aparato y la otra versión se avisa para guardarla en las versiones anteriores.
   · Sin «base» (primera sincronización) se juntan las dos sin duplicar lo que sea idéntico.
   API: lrDriveMerge.fusionar(base, local, remoto, tablas) -> { resultado, conflictos:[{ruta, local, remoto}], duplicadas:[{tabla, fila}] }
        tablas = [{ id, prefijo, cols:[ 'cliente', {id:'estado'}, … ] }]  (las mismas de window.lrAgendaNucleo.tablas) */
(function (raiz) {
  'use strict';
  function esObj(x) { return x !== null && typeof x === 'object' && !Array.isArray(x); }
  function orden(x) {
    if (Array.isArray(x)) return x.map(orden);
    if (esObj(x)) { var o = {}; Object.keys(x).sort().forEach(function (k) { o[k] = orden(x[k]); }); return o; }
    return x;
  }
  function firma(x) { return x === undefined ? 'u' : JSON.stringify(orden(x)); }
  function igual(a, b) { return firma(a) === firma(b); }
  function vacio(v) { return v === undefined || v === null || v === '' || v === false; }
  function escapar(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function nombreCol(c) { return typeof c === 'string' ? c : c && c.id; }
  function copia(x) { return x === undefined ? undefined : JSON.parse(JSON.stringify(x)); }

  /* ---- valores sueltos (recursivo) ---- */
  function conId(l) { return Array.isArray(l) && l.every(function (e) { return esObj(e) && e.id !== undefined && e.id !== null && e.id !== ''; }); }
  function mezclarLista(b, l, r, ruta, C) {
    var mb = {}, ml = {}, mr = {}, ids = [], visto = {};
    function llenar(lista, m) { lista.forEach(function (e) { m[String(e.id)] = e; }); }
    llenar(b, mb); llenar(l, ml); llenar(r, mr);
    l.forEach(function (e) { var k = String(e.id); if (!visto[k]) { visto[k] = 1; ids.push(k); } });
    r.forEach(function (e) { var k = String(e.id); if (!visto[k]) { visto[k] = 1; ids.push(k); } });
    var sale = [];
    ids.forEach(function (k) {
      var bi = mb[k], li = ml[k], ri = mr[k], v;
      if (li && ri) v = mezclarValor(bi, li, ri, ruta + '#' + k, C);
      else if (li) v = (bi && !ri && igual(li, bi)) ? undefined : li;     // el otro aparato la borró y aquí no se tocó: se borra; si aquí se cambió, se conserva
      else v = (bi && !li && igual(ri, bi)) ? undefined : ri;
      if (v !== undefined) sale.push(v);
    });
    return sale;
  }
  function mezclarValor(b, l, r, ruta, C) {
    if (igual(l, r)) return l;
    if (igual(l, b)) return r;      // aquí no cambió: se toma lo del otro aparato
    if (igual(r, b)) return l;      // allá no cambió: se queda lo de aquí
    if (l === undefined) return r;  // uno lo borró y el otro lo cambió: se conserva lo cambiado
    if (r === undefined) return l;
    if (esObj(l) && esObj(r)) {
      var bb = esObj(b) ? b : {}, claves = {}, sale = {};
      [bb, l, r].forEach(function (o) { Object.keys(o).forEach(function (k) { claves[k] = 1; }); });
      Object.keys(claves).forEach(function (k) { var v = mezclarValor(bb[k], l[k], r[k], ruta + '.' + k, C); if (v !== undefined) sale[k] = v; });
      return sale;
    }
    if (conId(l) && conId(r) && (b === undefined || conId(b))) return mezclarLista(b || [], l, r, ruta, C);
    C.push({ ruta: ruta, local: l, remoto: r });    // la misma casilla cambió distinto en los dos aparatos: gana este aparato y se avisa
    return l;
  }

  /* ---- listas de fichas ---- */
  function filasDe(datos, T) {   // { n, filas: { 1: {col: valor}, ... }, claves: [las claves de la tabla] }
    var re = new RegExp('^' + escapar(T.prefijo) + '(\\d+)-(.+)$'), cols = {}, filas = {}, claves = [], n = 0;
    (T.cols || []).forEach(function (c) { var nc = nombreCol(c); if (nc) cols[nc] = 1; });
    Object.keys(datos || {}).forEach(function (k) {
      var m = re.exec(k); if (!m || !cols[m[2]]) return;
      claves.push(k); var r = +m[1], v = datos[k];
      if (!vacio(v)) { (filas[r] = filas[r] || {})[m[2]] = v; if (r > n) n = r; }
    });
    return { n: n, filas: filas, claves: claves };
  }
  function firmaTabla(f) { return firma(f.filas); }
  function listaFilas(f) {   // filas con algo, en orden
    return Object.keys(f.filas).map(Number).sort(function (a, b) { return a - b; }).map(function (r) { return { r: r, v: f.filas[r], h: firma(f.filas[r]) }; });
  }
  function conteo(lista) { var c = {}; lista.forEach(function (x) { c[x.h] = (c[x.h] || 0) + 1; }); return c; }
  function mezclarTabla(T, B, L, R, hayBase, salida, dup) {
    var fb = filasDe(B, T), fl = filasDe(L, T), fr = filasDe(R, T), fuente, filas;
    if (firmaTabla(fl) === firmaTabla(fr)) filas = fl.filas;
    else if (hayBase && firmaTabla(fl) === firmaTabla(fb)) filas = fr.filas;
    else if (hayBase && firmaTabla(fr) === firmaTabla(fb)) filas = fl.filas;
    else {
      var lb = listaFilas(fb), ll = listaFilas(fl), lr = listaFilas(fr), cb = conteo(lb), cl = conteo(ll), cr = conteo(lr), meta = {}, usados = {}, sale = [];
      Object.keys(cl).concat(Object.keys(cr)).forEach(function (h) {
        meta[h] = hayBase ? Math.max(0, (cl[h] || 0) + (cr[h] || 0) - (cb[h] || 0)) : Math.max(cl[h] || 0, cr[h] || 0);
      });
      function tomar(lista) { lista.forEach(function (x) { if ((usados[x.h] || 0) < (meta[x.h] || 0)) { usados[x.h] = (usados[x.h] || 0) + 1; sale.push(x); } }); }
      tomar(ll); tomar(lr);
      filas = {}; sale.forEach(function (x, i) { filas[i + 1] = x.v; });
      if (hayBase) {   // la misma ficha (misma posición) cambiada distinto en los dos aparatos: quedan las dos versiones, y se avisa
        Object.keys(fb.filas).forEach(function (r) {
          var hb = firma(fb.filas[r]), a = fl.filas[r] ? firma(fl.filas[r]) : '', c = fr.filas[r] ? firma(fr.filas[r]) : '';
          if (a && c && a !== c && a !== hb && c !== hb) dup.push({ tabla: T.id, fila: +r });
        });
      }
    }
    Object.keys(filas).forEach(function (r) { Object.keys(filas[r]).forEach(function (c) { salida[T.prefijo + r + '-' + c] = filas[r][c]; }); });
    var m = 0; Object.keys(filas).forEach(function (r) { if (+r > m) m = +r; });
    return { claves: fb.claves.concat(fl.claves, fr.claves), n: m, nl: fl.n, nr: fr.n };
  }

  /* ---- todo junto ---- */
  function fusionar(base, local, remoto, tablas) {
    var hayBase = esObj(base), B = hayBase ? base : {}, L = esObj(local) ? local : {}, R = esObj(remoto) ? remoto : {};
    var salida = {}, C = [], dup = [], usadas = {}, filasFinal = {};
    (tablas || []).forEach(function (T) {
      var t = mezclarTabla(T, B, L, R, hayBase, salida, dup);
      t.claves.forEach(function (k) { usadas[k] = 1; });
      var fl = (L._filas && L._filas[T.id]) || 0, fr = (R._filas && R._filas[T.id]) || 0;
      var previo = Math.max(+fl || 0, +fr || 0), n = Math.max(t.n, previo);
      if (n > 0 && (previo > 0 || t.n > Math.max(t.nl, t.nr))) filasFinal[T.id] = n;   // si ninguno traía «_filas» y no hubo fichas nuevas por la mezcla, no se inventa
    });
    var claves = {};
    [B, L, R].forEach(function (o) { Object.keys(o).forEach(function (k) { if (!usadas[k] && k !== '_filas') claves[k] = 1; }); });
    Object.keys(claves).forEach(function (k) { var v = mezclarValor(B[k], L[k], R[k], k, C); if (v !== undefined) salida[k] = copia(v); });
    var otras = {};   // «_filas» de tablas que esta mezcla no conoce: se conserva el mayor
    [L._filas, R._filas].forEach(function (f) { if (esObj(f)) Object.keys(f).forEach(function (id) { if (!filasFinal[id]) otras[id] = Math.max(otras[id] || 0, +f[id] || 0); }); });
    Object.keys(otras).forEach(function (id) { if (otras[id] > 0) filasFinal[id] = otras[id]; });
    if (Object.keys(filasFinal).length) salida._filas = filasFinal;
    return { resultado: salida, conflictos: C, duplicadas: dup };
  }

  var api = { fusionar: fusionar, igual: igual, firma: firma };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else raiz.lrDriveMerge = api;
})(typeof window !== 'undefined' ? window : this);
