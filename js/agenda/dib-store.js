/* Agenda para tejedoras: los dibujos viven en IndexedDB (3-nov-2026).
   Antes los trazos y las fotos de los dibujos iban dentro de `rosinaAgenda` (localStorage, ~5 MB en total). Ahora, cuando el navegador deja usar IndexedDB,
   `datos._dib` sigue existiendo EN MEMORIA (dibujo.js y formas.js no cambian) pero se guarda aparte, en la base `lrAgendaDib`, y NO se escribe en localStorage.
   Reglas de seguridad (aquí se pierden datos si algo falla):
   - Migración: lo que haya en localStorage se copia a IndexedDB, se verifica leyéndolo de vuelta y SOLO después se quita de localStorage; antes se guarda un respaldo
     del texto original en IndexedDB (`meta/respaldoAntes`).
   - Si IndexedDB no abre o falla, todo sigue como antes (los dibujos van en localStorage). `activo` es verdadero solo si todo salió bien.
   - Todo lo que lee `rosinaAgenda` directo (copia en la cuenta, Google Drive, copias de seguridad, dueno.js) debe pasar por `completos`, `escribirDatos`,
     `serializar`, `hayDib` y `borrarTodo` de este módulo; si no, vería la agenda sin dibujos. */
(function () {
  'use strict';
  var BD = 'lrAgendaDib', CLAVE = 'rosinaAgenda', FLAG = 'lrDibIdb', CONT = 'lrDibN';
  var S = window.lrDibStore = { activo: false, fallo: false, version: 0, listo: null };
  var db = null, congelado = false, cache = {}, obtener = function () { return null }, temporizador = null, cola = Promise.resolve();

  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
  function lsDel(k) { try { localStorage.removeItem(k); } catch (e) {} }
  function pedir(req) { return new Promise(function (ok, mal) { req.onsuccess = function () { ok(req.result); }; req.onerror = function () { mal(req.error || new Error('idb')); }; }); }
  function terminar(tx) { return new Promise(function (ok, mal) { tx.oncomplete = function () { ok(); }; tx.onerror = function () { mal(tx.error || new Error('idb')); }; tx.onabort = function () { mal(tx.error || new Error('idb-abort')); }; }); }
  function abrir() {
    return new Promise(function (ok, mal) {
      var r = indexedDB.open(BD, 1);
      r.onupgradeneeded = function () { var d = r.result; if (!d.objectStoreNames.contains('dib')) d.createObjectStore('dib'); if (!d.objectStoreNames.contains('meta')) d.createObjectStore('meta'); };
      r.onsuccess = function () { ok(r.result); }; r.onerror = function () { mal(r.error || new Error('idb')); }; r.onblocked = function () { mal(new Error('idb-bloqueada')); };
    });
  }
  async function leerTodo() {
    var tx = db.transaction('dib', 'readonly'), st = tx.objectStore('dib'), claves = await pedir(st.getAllKeys()), valores = await pedir(st.getAll()), o = {};
    claves.forEach(function (k, i) { o[k] = valores[i]; }); return o;
  }
  async function leerMeta(k) { var tx = db.transaction('meta', 'readonly'); return pedir(tx.objectStore('meta').get(k)); }
  async function ponerMeta(k, v) { var tx = db.transaction('meta', 'readwrite'); tx.objectStore('meta').put(v, k); return terminar(tx); }
  async function borrarMeta(k) { var tx = db.transaction('meta', 'readwrite'); tx.objectStore('meta').delete(k); return terminar(tx); }
  function contar(dib) { var n = 0; Object.keys(dib || {}).forEach(function (k) { var r = dib[k]; if (r && ((r.s && r.s.length) || r.img)) n++; }); return n; }
  function anotarContador(dib) { var n = contar(dib); if (n) lsSet(CONT, String(n)); else lsDel(CONT); }
  function enCola(f) { var p = cola.then(f, f); cola = p.catch(function () {}); return p; }
  /* Deja en IndexedDB exactamente `dib` (borra lo demás). */
  async function reemplazarEnBD(dib) {
    dib = dib || {}; var tx = db.transaction('dib', 'readwrite'), st = tx.objectStore('dib'), nuevo = {};
    st.clear(); Object.keys(dib).forEach(function (k) { st.put(dib[k], k); nuevo[k] = JSON.stringify(dib[k]); });
    await terminar(tx); cache = nuevo; S.version++; anotarContador(dib);
  }
  async function guardarAhora() {
    if (!S.activo || !db || congelado) return;   // congelado: llegó una agenda de fuera y la página se va a recargar; lo de memoria ya es viejo
    var d = obtener(), mem = (d && d._dib) || {}, cambios = [], quitar = [];
    Object.keys(mem).forEach(function (k) { var t = JSON.stringify(mem[k]); if (cache[k] !== t) cambios.push([k, t]); });
    Object.keys(cache).forEach(function (k) { if (!(k in mem)) quitar.push(k); });
    if (!cambios.length && !quitar.length) return;
    var tx = db.transaction('dib', 'readwrite'), st = tx.objectStore('dib');
    cambios.forEach(function (c) { st.put(mem[c[0]], c[0]); }); quitar.forEach(function (k) { st.delete(k); });
    await terminar(tx);
    cambios.forEach(function (c) { cache[c[0]] = c[1]; }); quitar.forEach(function (k) { delete cache[k]; });
    S.version++; anotarContador(mem);
  }
  function avisarError() { try { document.dispatchEvent(new CustomEvent('dib-error')); } catch (e) {} }

  /* La agenda llama a esto una vez, con una función que devuelve el objeto `datos` actual (la página lo reemplaza al borrar). */
  S.iniciar = function (getter) {
    obtener = getter || obtener;
    S.listo = (async function () {
      try {
        if (!window.indexedDB) throw new Error('sin-idb');
        db = await abrir();
        var d = obtener() || {}, enLS = d._dib && contar(d._dib) ? d._dib : null, migrado = lsGet(FLAG) === '1';
        if (!migrado) {
          if (enLS) {
            await ponerMeta('respaldoAntes', { fecha: new Date().toISOString(), texto: lsGet(CLAVE) });
            await reemplazarEnBD(enLS);
            var vuelta = await leerTodo(), ok = true;
            Object.keys(enLS).forEach(function (k) { if (JSON.stringify(vuelta[k]) !== JSON.stringify(enLS[k])) ok = false; });
            if (!ok) throw new Error('verificacion');
          } else {
            var ya = await leerTodo(); d._dib = d._dib || {}; Object.keys(ya).forEach(function (k) { d._dib[k] = ya[k]; });
            cache = {}; Object.keys(ya).forEach(function (k) { cache[k] = JSON.stringify(ya[k]); });
          }
          if (!lsSet(FLAG, '1')) throw new Error('bandera');
        } else if (enLS) {
          await reemplazarEnBD(enLS);                  // llegó una agenda completa (copia, cuenta o Drive): manda lo que trae
        } else {
          var todo = await leerTodo(); d._dib = d._dib || {};
          Object.keys(todo).forEach(function (k) { d._dib[k] = todo[k]; });
          cache = {}; Object.keys(todo).forEach(function (k) { cache[k] = JSON.stringify(todo[k]); });
        }
        S.activo = true; anotarContador(obtener() && obtener()._dib);
        lsSet(CLAVE, S.serializar(obtener() || {}));   // ya con los dibujos a salvo en IndexedDB, se quitan de localStorage (libera espacio)
      } catch (e) { S.activo = false; S.fallo = true; }
      return S.activo;
    })();
    return S.listo;
  };
  /* Texto para localStorage: sin `_dib` si IndexedDB está activo. */
  S.serializar = function (d) {
    if (!S.activo || !d || !d._dib) return JSON.stringify(d);
    var o = {}; Object.keys(d).forEach(function (k) { if (k !== '_dib') o[k] = d[k]; }); return JSON.stringify(o);
  };
  S.alGuardar = function () {
    if (!S.activo) return;
    clearTimeout(temporizador); temporizador = setTimeout(function () { enCola(guardarAhora).catch(avisarError); }, 300);
  };
  S.guardarYa = function () { clearTimeout(temporizador); return enCola(guardarAhora); };
  /* Agenda completa que llega de fuera (copia, cuenta, Drive): deja los dibujos en IndexedDB y devuelve el texto que va a localStorage. */
  S.escribirDatos = async function (d) {
    await S.listo;
    if (S.activo) { congelado = true; await enCola(function () { return reemplazarEnBD((d && d._dib) || {}); }); }
    return S.serializar(d);
  };
  /* Lo que está guardado más lo de memoria, para subirlo a la cuenta o a Drive. */
  S.completos = async function (d) {
    await S.listo; if (!S.activo) return d;
    await S.guardarYa().catch(function () {});
    var o = {}, m = obtener() || {}; Object.keys(d || {}).forEach(function (k) { o[k] = d[k]; });
    if (m._dib && Object.keys(m._dib).length) o._dib = m._dib; return o;
  };
  S.hayDib = function () { var n = Number(lsGet(CONT) || 0); if (n > 0) return true; var d = obtener(); return !!(d && d._dib && contar(d._dib)); };
  S.borrarTodo = async function (recargar) {
    await S.listo; if (recargar) congelado = true;
    lsDel(CONT);
    if (!db) return;
    try { await enCola(function () { return reemplazarEnBD({}); }); await borrarMeta('driveBaseDib'); await borrarMeta('respaldoAntes'); } catch (e) {}
  };
  S.limites = function () { return S.activo ? { img: 40000000, puntos: 2000000 } : { img: 1800000, puntos: 150000 }; };
  S.respaldoAntes = async function () { await S.listo; return db ? leerMeta('respaldoAntes') : null; };
  /* La base de la mezcla con Google Drive (lo último que se compartió) también lleva dibujos: se guardan aquí y no en localStorage. */
  S.leerBaseDib = async function () { await S.listo; if (!S.activo) return null; try { return (await leerMeta('driveBaseDib')) || null; } catch (e) { return null; } };
  S.guardarBaseDib = async function (dib) { await S.listo; if (!S.activo) return false; try { if (dib && Object.keys(dib).length) await ponerMeta('driveBaseDib', dib); else await borrarMeta('driveBaseDib'); return true; } catch (e) { return false; } };
  S.borrarBaseDib = async function () { await S.listo; if (db) { try { await borrarMeta('driveBaseDib'); } catch (e) {} } };

  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') S.guardarYa().catch(function () {}); });
  window.addEventListener('pagehide', function () { S.guardarYa().catch(function () {}); });
})();
