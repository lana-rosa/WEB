/* Agenda para tejedoras: sincronización opcional con el Google Drive de la persona (Plus para emprendedoras, etapa 7, 31-oct-2026; gratis con la cuenta).
   La misma agenda en el celular, la tablet y el computador SIN pasar por los servidores de Lana Rosa: la agenda se guarda en la carpeta oculta de esta app en el Drive de la persona
   (permiso `drive.appdata`, no sensible: solo ve los archivos que creó esta app, no el resto del Drive). La función `google-drive` de Supabase solo consigue ese permiso y le entrega al
   navegador una llave de acceso de ~1 hora; el navegador habla directo con Drive (la función nunca ve la agenda).
   Cómo no se pierden datos: cada aparato recuerda la última versión que sincronizó («base»). En cada sincronización se mezclan tres versiones (base, la de aquí y la de Drive) con drive-merge.js:
   lo que cambió en un solo aparato se conserva, las fichas agregadas en los dos se juntan y, si la misma casilla cambió distinto, gana este aparato y la otra versión queda guardada en
   «Versiones anteriores» (las últimas 5). Los cambios de otro aparato se aplican solos al abrir la página; mientras la persona escribe, aparece un aviso «Actualizar» para no interrumpirla.
   Si se acaba de abrir con otra cuenta en el mismo navegador (dueno.js), no sincroniza. La agenda sigue funcionando sin internet: lo escrito siempre se guarda primero en el dispositivo.
   Piezas: herramientas/google-drive/google-drive.ts (función), migracion-40 (tabla del permiso), drive-merge.js (mezcla). API: window.lrDrive. */
import { haySesionGuardada, obtenerCliente } from '/js/cuenta.js';
(async function () {
  var caja = document.getElementById('drive-sync');
  if (!caja || !haySesionGuardada()) return;
  var CLAVE = 'rosinaAgenda', K_BASE = 'lrDriveBase', K_REV = 'lrDriveRev', K_UID = 'lrDriveUid', K_SNAP = 'lrDriveSnap', DUENO = 'lrAgendaDueno';
  var NOMBRE = 'agenda.json', PREFIJO_ANT = 'agenda-anterior-', MAX_ANTERIORES = 5, HORAS_ENTRE_VERSIONES = 6;
  var M = window.lrDriveMerge;
  var txt = document.getElementById('ds-texto'), av = document.getElementById('ds-aviso'), lista = document.getElementById('ds-lista');
  var bCon = document.getElementById('ds-conectar'), bSin = document.getElementById('ds-sincronizar'), bVer = document.getElementById('ds-versiones'), bDes = document.getElementById('ds-desconectar'), bBor = document.getElementById('ds-borrar');
  var sb = null, uid = null, estado = null, acceso = null, ocupado = false, otraVez = false, temporizador = null, ultimoCiclo = 0, pendiente = false, ultimaEscritura = 0;
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function lsDel(k) { try { localStorage.removeItem(k); } catch (e) {} }
  function aviso(t) {
    av.textContent = '';
    (Array.isArray(t) ? t : [t || '']).forEach(function (x, i) { if (!x) return; var d = document.createElement('span'); d.className = 'ds-linea'; d.textContent = x; d.style.display = 'block'; if (i) d.style.marginTop = '4px'; av.appendChild(d); });
  }
  function abrirConfig() { if (window.lrAgendaConfig) window.lrAgendaConfig.abrir(); }
  function fechaHora(iso) { var f = new Date(iso).toLocaleString((window.lrI18n && window.lrI18n.lang === 'en') ? 'en-US' : (window.lrI18n && window.lrI18n.lang === 'pt') ? 'pt-BR' : 'es-CO', { dateStyle: 'medium', timeStyle: 'short' }); return f + (/\.$/.test(f) ? '' : '.'); }
  function leerLocal() { try { return JSON.parse(lsGet(CLAVE)) || {}; } catch (e) { return {}; } }
  function leerBase() { try { var b = lsGet(K_BASE); return b ? JSON.parse(b) : null; } catch (e) { return null; } }
  /* Los dibujos viven en IndexedDB (dib-store.js): lo que se lee de localStorage no los trae, y la mezcla los borraría de Drive si no se suman aquí. */
  function dibStore() { return window.lrDibStore || null; }
  async function leerLocalC() { var L = leerLocal(), S = dibStore(); return S ? await S.completos(L) : L; }
  async function leerBaseC() {
    var b = leerBase(), S = dibStore(); if (!b || !S) return b;
    await S.listo; if (!S.activo || b._dib) return b;
    var dib = await S.leerBaseDib(); if (dib) b._dib = dib; return b;
  }
  async function guardarBase(obj) {   // lo último compartido con Drive; los dibujos de la base van a IndexedDB y no ocupan localStorage
    var S = dibStore(); await (S && S.listo);
    if (S && S.activo && await S.guardarBaseDib(obj && obj._dib)) { var o = {}; Object.keys(obj || {}).forEach(function (k) { if (k !== '_dib') o[k] = obj[k]; }); lsSet(K_BASE, JSON.stringify(o)); }
    else lsSet(K_BASE, JSON.stringify(obj));
  }
  function hayDatos(d) { return Object.keys(d || {}).some(function (k) { return k !== 'ag-anio' && k !== '_anios' && k !== '_filas'; }); }
  function tablas() {
    var N = window.lrAgendaNucleo, t = N && N.tablas ? N.tablas : {};
    return Object.keys(t).map(function (id) { return { id: id, prefijo: t[id].prefijo, cols: t[id].cols }; });
  }
  async function llamar(accion, extra) {
    var r = await sb.functions.invoke('google-drive', { body: Object.assign({ accion: accion }, extra || {}) });
    if (r.error) { var d = null; try { d = await r.error.context.json(); } catch (e) {} return d || { error: 'No pudimos conectar con el servicio. Inténtalo de nuevo.' }; }
    return r.data || {};
  }

  /* ---------- Drive ---------- */
  async function llave(forzar) {
    if (!forzar && acceso && acceso.hasta > Date.now() + 120000) return acceso.token;
    var r = await llamar('token');
    if (!r.access_token) { var e = new Error(r.reconectar ? 'reconectar' : 'sin_llave'); e.mensaje = r.error; throw e; }
    acceso = { token: r.access_token, hasta: Date.now() + (r.expires_in || 3000) * 1000 };
    return acceso.token;
  }
  async function drive(url, op, reintento) {
    op = op || {}; op.headers = Object.assign({ Authorization: 'Bearer ' + await llave(!!reintento) }, op.headers || {});
    var r = await fetch(url, op);
    if (r.status === 401 && !reintento) return drive(url, op, true);
    return r;
  }
  var API = 'https://www.googleapis.com/drive/v3/files', SUBIR = 'https://www.googleapis.com/upload/drive/v3/files';
  function fallo(r, que) { var e = new Error(que + ' ' + r.status); e.estado = r.status; return e; }
  async function buscar(q, orden, campos) {
    var u = API + '?spaces=appDataFolder&pageSize=20&q=' + encodeURIComponent(q) + '&orderBy=' + encodeURIComponent(orden || 'modifiedTime desc') + '&fields=' + encodeURIComponent('files(' + (campos || 'id,name,modifiedTime,appProperties') + ')');
    var r = await drive(u); if (!r.ok) throw fallo(r, 'buscar'); return (await r.json()).files || [];
  }
  async function leerArchivo(id) { var r = await drive(API + '/' + id + '?alt=media'); if (!r.ok) throw fallo(r, 'leer'); return JSON.parse(await r.text()); }
  function multiparte(meta, obj) {
    var b = 'lr' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    return { tipo: 'multipart/related; boundary=' + b, body: '--' + b + '\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n' + JSON.stringify(meta) + '\r\n--' + b + '\r\nContent-Type: application/json\r\n\r\n' + JSON.stringify(obj) + '\r\n--' + b + '--' };
  }
  async function guardarArchivo(id, nombre, obj, props) {
    var meta = { appProperties: props || {} }, m;
    if (!id) { meta.name = nombre; meta.parents = ['appDataFolder']; m = multiparte(meta, obj); var r = await drive(SUBIR + '?uploadType=multipart&fields=id', { method: 'POST', headers: { 'Content-Type': m.tipo }, body: m.body }); if (!r.ok) throw fallo(r, 'crear'); return (await r.json()).id; }
    m = multiparte(meta, obj); var r2 = await drive(SUBIR + '/' + id + '?uploadType=multipart&fields=id', { method: 'PATCH', headers: { 'Content-Type': m.tipo }, body: m.body }); if (!r2.ok) throw fallo(r2, 'actualizar'); return id;
  }
  async function borrarArchivo(id) { var r = await drive(API + '/' + id, { method: 'DELETE' }); if (!r.ok && r.status !== 404) throw fallo(r, 'borrar'); }
  function sobre(datos) { return { v: 1, app: 'agenda-tejedoras', guardado: new Date().toISOString(), datos: datos }; }
  function nuevaRev() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

  /* ---------- fotos de los dibujos en archivos propios (6-nov-2026) ----------
     Las fotos de los dibujos (hasta 12 por patrón, a 1600 px) hacían crecer agenda.json por encima de lo que aguanta la subida «multipart» (~5 MB) y se resubían completas en cada cambio.
     Ahora, en Drive, cada foto va en su propio archivo `foto-<huella>.json` ({ img }) con nombre por contenido (SHA-256), y agenda.json lleva en su lugar `imgRef: <huella>` (y img vacía).
     La mezcla se hace SIEMPRE en esa «forma Drive»; lo local sigue con las fotos completas. Reglas de seguridad: (1) antes de escribir agenda.json (o una versión anterior) se suben los archivos
     de las fotos que cita; (2) al bajar, si falta una foto NO se aplica nada (se reintenta); (3) un agenda.json viejo con las fotos dentro se entiende igual y se migra solo en la siguiente subida;
     (4) los archivos de fotos que ya nadie cita (ni agenda.json ni las 5 versiones) se limpian, solo los de más de un día; (5) «Borrar mi agenda de Drive» borra también las fotos.
     Si el navegador no tiene `crypto.subtle`, todo sigue como antes (fotos dentro de agenda.json). */
  var PREFIJO_FOTO = 'foto-', GRACIA_FOTOS = 24 * 3600000;
  var CRIPTO = !!(window.crypto && window.crypto.subtle && window.TextEncoder);
  async function huellaFoto(txt) {
    var buf = new Uint8Array(await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(txt)));
    var h = ''; for (var i = 0; i < 16; i++) h += ('0' + buf[i].toString(16)).slice(-2); return h;
  }
  function nombreFoto(h) { return PREFIJO_FOTO + h + '.json'; }
  async function aFormaDrive(datos, pool) {   // copia de los datos con las fotos reemplazadas por su huella; `pool` guarda huella → foto para poder subirlas
    if (!CRIPTO || !datos || !datos._dib) return datos;
    var o = {}; Object.keys(datos).forEach(function (k) { o[k] = datos[k]; }); o._dib = {};
    var claves = Object.keys(datos._dib);
    for (var i = 0; i < claves.length; i++) {
      var e = datos._dib[claves[i]];
      if (e && typeof e === 'object' && typeof e.img === 'string' && e.img) {
        var h = await huellaFoto(e.img), c = {}; pool[h] = e.img;
        Object.keys(e).forEach(function (f) { c[f] = e[f]; }); c.img = ''; c.imgRef = h; o._dib[claves[i]] = c;
      } else o._dib[claves[i]] = e;
    }
    return o;
  }
  function huellasDe(datos) { var r = {}; if (datos && datos._dib) Object.keys(datos._dib).forEach(function (k) { var e = datos._dib[k]; if (e && typeof e.imgRef === 'string' && e.imgRef) r[e.imgRef] = 1; }); return Object.keys(r); }
  async function listarFotos() {   // { huella: {id, createdTime} } de lo que ya hay en Drive (con páginas)
    var r = {}, token = '';
    for (var vuelta = 0; vuelta < 50; vuelta++) {
      var u = API + '?spaces=appDataFolder&pageSize=1000&q=' + encodeURIComponent("name contains '" + PREFIJO_FOTO + "'") + '&fields=' + encodeURIComponent('nextPageToken,files(id,name,createdTime)') + (token ? '&pageToken=' + encodeURIComponent(token) : '');
      var resp = await drive(u); if (!resp.ok) throw fallo(resp, 'listar fotos'); var j = await resp.json();
      (j.files || []).forEach(function (a) { var m = /^foto-([0-9a-f]{32})\.json$/.exec(a.name || ''); if (m && !r[m[1]]) r[m[1]] = { id: a.id, createdTime: a.createdTime }; });
      token = j.nextPageToken || ''; if (!token) break;
    }
    return r;
  }
  async function subirFotos(datos, pool) {   // sube las fotos que cita `datos` y que Drive todavía no tiene; si alguna no se puede subir, falla (y no se escribe agenda.json)
    var citadas = huellasDe(datos); if (!citadas.length) return;
    var hay = await listarFotos();
    for (var i = 0; i < citadas.length; i++) {
      var h = citadas[i]; if (hay[h]) continue;
      if (typeof pool[h] !== 'string') continue;   // ni aquí ni en Drive: ya no se puede recuperar; no se bloquea la sincronización por eso
      await guardarArchivo(null, nombreFoto(h), { img: pool[h] }, { tipo: 'foto' });
    }
  }
  async function bajarFoto(h) {
    var f = (await buscar("name = '" + nombreFoto(h) + "'", 'createdTime desc', 'id'))[0]; if (!f) throw new Error('foto_no_esta');
    var o = await leerArchivo(f.id); if (!o || typeof o.img !== 'string' || o.img.indexOf('data:image/') !== 0) throw new Error('foto_invalida');
    return o.img;
  }
  async function aFormaLocal(datos, pool) {   // lo contrario: devuelve los datos con las fotos completas (las que no estén a mano se bajan; si falta una, falla y no se aplica nada)
    if (!datos || !datos._dib) return datos;
    var o = {}; Object.keys(datos).forEach(function (k) { o[k] = datos[k]; }); o._dib = {};
    var claves = Object.keys(datos._dib);
    for (var i = 0; i < claves.length; i++) {
      var e = datos._dib[claves[i]];
      if (e && typeof e === 'object' && typeof e.imgRef === 'string' && e.imgRef && !e.img) {
        var h = e.imgRef, c = {};
        if (typeof pool[h] !== 'string') { try { pool[h] = await bajarFoto(h); } catch (x) { if (!x || (x.message !== 'foto_no_esta' && x.message !== 'foto_invalida')) throw x; pool[h] = null; } }   // un fallo de red o de permiso se reintenta; si el archivo de verdad no existe, esa foto ya se perdió y se sigue sin ella
        Object.keys(e).forEach(function (f) { if (f !== 'imgRef' || pool[h] === null) c[f] = e[f]; }); c.img = pool[h] || ''; o._dib[claves[i]] = c;
      } else o._dib[claves[i]] = e;
    }
    return o;
  }
  async function limpiarFotos() {   // borra los archivos de fotos que ya no cita agenda.json ni ninguna versión anterior (y tienen más de un día)
    var hay = await listarFotos(), hs = Object.keys(hay); if (!hs.length) return;
    var citadas = {}, principal = (await buscar("name = '" + NOMBRE + "'"))[0];
    if (!principal) return;   // sin agenda no se borra nada
    var lista = [principal].concat(await buscar("name contains '" + PREFIJO_ANT + "'", 'createdTime desc', 'id'));
    for (var i = 0; i < lista.length; i++) { var sb2 = await leerArchivo(lista[i].id); huellasDe(sb2 && sb2.datos).forEach(function (h) { citadas[h] = 1; }); }
    for (var j = 0; j < hs.length; j++) {
      var h = hs[j]; if (citadas[h]) continue;
      if (Date.now() - new Date(hay[h].createdTime).getTime() < GRACIA_FOTOS) continue;
      await borrarArchivo(hay[h].id);
    }
  }

  /* ---------- versiones anteriores ---------- */
  async function guardarVersion(datos, motivo) {
    var ts = new Date().toISOString().replace(/[:.]/g, '-');
    await guardarArchivo(null, PREFIJO_ANT + ts + '.json', sobre(datos), { tipo: 'anterior', motivo: motivo });
    lsSet(K_SNAP, String(Date.now()));
    try { var todas = await buscar("name contains '" + PREFIJO_ANT + "'", 'createdTime desc', 'id,name,createdTime'); for (var i = MAX_ANTERIORES; i < todas.length; i++) await borrarArchivo(todas[i].id); } catch (e) { /* limpiar es opcional */ }
    try { if (CRIPTO) await limpiarFotos(); } catch (e) { /* limpiar las fotos viejas también es opcional */ }
  }
  var MOTIVOS = { conflicto: 'Antes de mezclar dos cambios en la misma casilla', periodica: 'Copia automática', restaurar: 'Antes de restaurar otra versión', mezcla: 'Antes de juntar cambios de otro aparato' };

  /* ---------- el ciclo de sincronización ---------- */
  function ocioso() {
    var a = document.activeElement, escribiendo = a && /^(TEXTAREA|INPUT|SELECT)$/.test(a.tagName);
    return !escribiendo && Date.now() - ultimaEscritura > 8000;
  }
  document.addEventListener('agenda-guardada', function () { ultimaEscritura = Date.now(); });
  function bloqueado() {   // otra cuenta usó este navegador: no se mezcla ni se sube nada hasta que la persona decida (dueno.js)
    if (document.documentElement.classList.contains('dueno-abierto')) return true;
    var d = lsGet(DUENO); return !!(d && uid && d !== uid);
  }
  async function aplicarLocal(datos, rev) {
    var N = window.lrAgendaNucleo, mem = N && N.datos ? N.datos() : null, S = dibStore();
    if (mem) { Object.keys(mem).forEach(function (k) { delete mem[k]; }); Object.keys(datos).forEach(function (k) { mem[k] = datos[k]; }); }   // lo que la página tiene en memoria queda igual, así no pisa lo mezclado
    if (S) { await S.listo; if (S.activo) await S.guardarYa(); }   // los dibujos mezclados quedan a salvo en IndexedDB antes de recargar
    lsSet(CLAVE, S ? S.serializar(datos) : JSON.stringify(datos)); await guardarBase(datos); lsSet(K_REV, rev);
  }
  function recargarSiSeguro() {
    var t = 0, n = 0;
    try { t = Number(sessionStorage.getItem('lrDriveRecargasT') || 0); n = Number(sessionStorage.getItem('lrDriveRecargas') || 0); } catch (e) {}
    if (Date.now() - t > 60000) { n = 0; t = Date.now(); }
    if (n >= 3) return;   // freno: nunca más de 3 recargas por minuto
    try { sessionStorage.setItem('lrDriveRecargas', String(n + 1)); sessionStorage.setItem('lrDriveRecargasT', String(t)); } catch (e) {}
    location.reload();
  }
  function mostrarBanner(si) {
    var b = document.getElementById('drive-banner');
    if (!si) { if (b) b.remove(); return; }
    if (b) return;
    b = document.createElement('div'); b.id = 'drive-banner'; b.className = 'drive-banner no-imprimir'; b.setAttribute('role', 'status');
    var t = document.createElement('span'); t.textContent = 'Hay cambios de otro aparato en tu agenda.';
    var bt = document.createElement('button'); bt.type = 'button'; bt.className = 'boton-primario boton-chico'; bt.textContent = 'Actualizar';
    bt.addEventListener('click', function () { bt.disabled = true; ciclo({ forzarAplicar: true }); });
    b.appendChild(t); b.appendChild(bt); document.body.appendChild(b);
  }
  async function ciclo(opc) {
    opc = opc || {};
    if (!estado || !estado.conectado || !M || !sb) return;
    if (bloqueado()) { aviso('Esta agenda es de otra cuenta; no se sincroniza hasta que lo confirmes.'); return; }
    if (ocupado) { otraVez = true; return; }
    ocupado = true; otraVez = false; ultimoCiclo = Date.now();
    var manual = !!opc.manual;
    if (manual) aviso('Sincronizando…');
    try {
      var L = await leerLocalC(), textoLocal = lsGet(CLAVE) || '', vDib = dibStore() ? dibStore().version : 0, base = await leerBaseC(), revVisto = lsGet(K_REV), tb = tablas();
      var pool = {}, Lr = await aFormaDrive(L, pool), Br = base ? await aFormaDrive(base, pool) : base;   // la mezcla se hace en la «forma Drive» (fotos aparte)
      var archivos = await buscar("name = '" + NOMBRE + "'");
      var meta = archivos[0] || null, ahora = new Date().toISOString();
      if (!meta) {   // Drive todavía no tiene la agenda
        if (!hayDatos(L)) { estado.ultima = ahora; pintar(); aviso(manual ? 'Todo listo. Tu agenda está vacía; se guardará en Drive cuando escribas.' : ''); return; }
        var rev0 = nuevaRev(); await subirFotos(Lr, pool); await guardarArchivo(null, NOMBRE, sobre(Lr), { rev: rev0 });
        await guardarBase(L); lsSet(K_REV, rev0); await terminar(manual, 'Tu agenda quedó guardada en tu Google Drive.'); return;
      }
      var revRemoto = (meta.appProperties || {}).rev || '', R;
      if (base && revRemoto && revRemoto === revVisto) R = Br;           // Drive no cambió desde la última vez: no hace falta bajarla
      else { var sob = await leerArchivo(meta.id); R = sob && sob.datos && typeof sob.datos === 'object' ? sob.datos : {}; }
      var Rr = await aFormaDrive(R, pool);   // un agenda.json viejo (fotos dentro) se entiende igual; como R no cambia, igualRemoto será falso y se migra solo
      var f = M.fusionar(Br, Lr, Rr, tb), Mx = f.resultado;
      var igualRemoto = M.igual(Mx, R), igualLocal = M.igual(Mx, Lr);
      if (igualRemoto && igualLocal) {   // todo igual en los dos lados
        await guardarBase(L); if (revRemoto) lsSet(K_REV, revRemoto); await terminar(manual, 'Tu agenda ya está al día.'); mostrarBanner(false); return;
      }
      var cambiaLocal = !igualLocal, aplicarAhora = cambiaLocal && (!!opc.forzarAplicar || ocioso());
      var rev = revRemoto;
      if (!igualRemoto) {   // subir lo mezclado (antes, una versión anterior de Drive si hubo choque o hace tiempo que no se guarda una)
        var haceMucho = Date.now() - Number(lsGet(K_SNAP) || 0) > HORAS_ENTRE_VERSIONES * 3600000;
        if (Object.keys(R).length && (f.conflictos.length || f.duplicadas.length)) await guardarVersion(R, MOTIVOS.conflicto);
        else if (Object.keys(R).length && haceMucho) await guardarVersion(R, cambiaLocal ? MOTIVOS.mezcla : MOTIVOS.periodica);
        rev = nuevaRev(); await subirFotos(Mx, pool); await guardarArchivo(meta.id, NOMBRE, sobre(Mx), { rev: rev });
        var ver = await buscar("name = '" + NOMBRE + "'");
        if (!ver[0] || (ver[0].appProperties || {}).rev !== rev) { otraVez = true; aviso(manual ? 'Otro aparato guardó al mismo tiempo; vuelvo a intentarlo.' : ''); return; }   // alguien escribió justo en medio: la base no cambia y se mezcla de nuevo
      }
      var avisos = [];
      if (f.conflictos.length) avisos.push('Cambiaste ' + f.conflictos.length + (f.conflictos.length === 1 ? ' casilla' : ' casillas') + ' de forma distinta en dos aparatos. Dejé la de este aparato; la otra quedó en «Versiones anteriores».');
      if (f.duplicadas.length) avisos.push(f.duplicadas.length + (f.duplicadas.length === 1 ? ' ficha se cambió' : ' fichas se cambiaron') + ' distinto en dos aparatos: quedaron las dos versiones. Borra la que sobre.');
      if (cambiaLocal && !aplicarAhora) {   // la persona está escribiendo: lo suyo ya quedó en Drive y lo del otro aparato espera su aviso «Actualizar» (la base es lo que ya compartimos: lo de aquí)
        await guardarBase(L); lsSet(K_REV, ''); pendiente = true; mostrarBanner(true);
        aviso('Hay cambios de otro aparato; toca «Actualizar» cuando termines de escribir.'); return;
      }
      if (cambiaLocal) {
        var Mfull = await aFormaLocal(Mx, pool);   // fotos completas (si falta alguna, falla aquí y no se aplica nada)
        if (lsGet(CLAVE) !== textoLocal || (dibStore() && dibStore().version !== vDib)) {   // la persona escribió mientras sincronizábamos: no se pisa; la base es lo que ya está en Drive de lo nuestro y se vuelve a mezclar
          await guardarBase(L); lsSet(K_REV, ''); otraVez = true; return;
        }
        await aplicarLocal(Mfull, rev); mostrarBanner(false); pendiente = false;
        try { await llamar('sincronizada'); } catch (e) {}
        estado.ultima = ahora; pintar();
        if (avisos.length) lsSet('lrDriveAvisos', JSON.stringify(avisos));
        recargarSiSeguro(); return;
      }
      await guardarBase(L); lsSet(K_REV, rev);   // lo local ya es igual a lo mezclado
      await terminar(manual, avisos.length ? avisos : 'Tu agenda quedó guardada en tu Google Drive.');
    } catch (e) { manejarError(e, manual); }
    finally { ocupado = false; if (otraVez) { otraVez = false; setTimeout(function () { ciclo({}); }, 1500); } }
  }
  async function terminar(manual, mensaje) {
    try { await llamar('sincronizada'); } catch (e) {}
    estado.ultima = new Date().toISOString(); pintar(); aviso(manual || Array.isArray(mensaje) ? mensaje : '');
  }
  function manejarError(e, manual) {
    if (e && e.message === 'reconectar') { estado.conectado = false; pintar(); aviso(e.mensaje || 'El permiso de Drive venció. Vuelve a conectarlo.'); return; }
    if (e && (e.estado === 403 || e.estado === 400)) { aviso('Google no dejó usar tu Drive. Desconecta y vuelve a conectar, y acepta el permiso de Drive.'); return; }
    if (manual || !navigator.onLine) aviso('Sin conexión con Drive: tu agenda sigue guardada en este aparato y se sincroniza cuando vuelva.');
  }

  /* ---------- tarjeta ---------- */
  function pintar() {
    var c = !!(estado && estado.conectado);
    bCon.hidden = c; bSin.hidden = !c; bVer.hidden = !c; bDes.hidden = !c; bBor.hidden = !c; if (!c) lista.hidden = true;
    if (!c) txt.textContent = 'Guarda tu agenda en tu propio Google Drive y ábrela igual en tu celular, tu tablet y tu computador. Tus datos van a una carpeta oculta de TU Drive: no pasan por Lana Rosa y nadie del equipo puede verlos. Es gratis y opcional.';
    else {
      txt.textContent = '';
      [estado.correo ? ('Conectado como ' + estado.correo + '.') : 'Conectado.', estado.ultima ? ('Última sincronización: ' + fechaHora(estado.ultima)) : 'Todavía no se ha sincronizado.', 'Se actualiza sola unos segundos después de cada cambio.'].forEach(function (x, i) {
        var sp = document.createElement('span'); sp.textContent = x; if (i) txt.appendChild(document.createTextNode(' ')); txt.appendChild(sp);
      });
    }
  }
  async function verVersiones() {
    lista.hidden = false; lista.textContent = ''; var cargando = document.createElement('li'); cargando.textContent = 'Buscando versiones anteriores…'; lista.appendChild(cargando);
    try {
      var v = await buscar("name contains '" + PREFIJO_ANT + "'", 'createdTime desc', 'id,name,createdTime,appProperties');
      lista.textContent = '';
      if (!v.length) { var vacio = document.createElement('li'); vacio.textContent = 'Todavía no hay versiones anteriores. Se guardan solas cuando se mezclan cambios de dos aparatos.'; lista.appendChild(vacio); return; }
      v.forEach(function (a) {
        var li = document.createElement('li'), s = document.createElement('span'), b = document.createElement('button');
        var mot = MOTIVOS[(a.appProperties || {}).motivo], f1 = document.createElement('span'), f2 = document.createElement('span');
        f1.textContent = fechaHora(a.createdTime); f1.setAttribute('data-no-traducir', ''); s.appendChild(f1);
        if (mot) { s.appendChild(document.createTextNode(' · ')); f2.textContent = mot; s.appendChild(f2); }
        b.type = 'button'; b.className = 'boton-secundario boton-chico'; b.textContent = 'Restaurar';
        b.addEventListener('click', function () { restaurar(a); });
        li.appendChild(s); li.appendChild(b); lista.appendChild(li);
      });
    } catch (e) { lista.textContent = ''; var m = document.createElement('li'); m.textContent = 'No pudimos ver las versiones ahora. Inténtalo otra vez.'; lista.appendChild(m); }
  }
  async function restaurar(a) {
    if (!confirm('¿Restaurar esta versión de tu agenda? Lo que tienes ahora se guarda antes como otra versión anterior, así puedes volver.')) return;
    aviso('Restaurando…');
    try {
      var sob = await leerArchivo(a.id), datos = sob && sob.datos; if (!datos || typeof datos !== 'object') throw new Error('vacio');
      var meta = (await buscar("name = '" + NOMBRE + "'"))[0];
      var poolR = {}, completos = await aFormaLocal(datos, poolR);   // fotos completas de esa versión (si falta alguna, no se restaura)
      var actual = await aFormaDrive(await leerLocalC(), poolR); await subirFotos(actual, poolR);
      await guardarVersion(actual, MOTIVOS.restaurar);
      var nuevo = await aFormaDrive(completos, poolR); await subirFotos(nuevo, poolR);
      var rev = nuevaRev(); await guardarArchivo(meta ? meta.id : null, NOMBRE, sobre(nuevo), { rev: rev });
      await aplicarLocal(completos, rev); recargarSiSeguro();
    } catch (e) { aviso('No pudimos restaurar esa versión. Inténtalo otra vez.'); }
  }
  function olvidarLocal() { [K_BASE, K_REV, K_UID, K_SNAP, 'lrDriveAvisos'].forEach(lsDel); if (dibStore()) dibStore().borrarBaseDib(); }

  /* ---------- arranque ---------- */
  try { sb = await obtenerCliente(); var ses = await sb.auth.getSession(); uid = ses && ses.data && ses.data.session && ses.data.session.user && ses.data.session.user.id; } catch (e) { return; }
  var e0 = await llamar('estado');
  if (!e0 || e0.configurado !== true) return;          // todavía no está activo: la tarjeta no aparece
  estado = e0; caja.hidden = false;
  if (lsGet(K_UID) && lsGet(K_UID) !== uid) olvidarLocal();   // la base de otra cuenta no sirve aquí
  if (uid) lsSet(K_UID, uid);
  pintar();
  var guardados = lsGet('lrDriveAvisos'); if (guardados) { try { aviso(JSON.parse(guardados)); } catch (e) {} lsDel('lrDriveAvisos'); }

  bCon.addEventListener('click', async function () {
    if (!window.lrAvisoConexion || !(await window.lrAvisoConexion.pedir('drive'))) return;   // aviso aparte antes de conectar (E30); sin el aviso no se conecta
    bCon.disabled = true; aviso('Abriendo Google…');
    (window.dataLayer = window.dataLayer || []).push({ event: 'resource_use', recurso: 'agenda_drive_conectar' });
    var r = await llamar('conectar');
    if (r.url) { location.href = r.url; return; }
    bCon.disabled = false; aviso(r.error || 'No pudimos iniciar la conexión.');
  });
  bSin.addEventListener('click', function () { ciclo({ manual: true, forzarAplicar: true }); });
  bVer.addEventListener('click', function () { if (!lista.hidden && lista.children.length) { lista.hidden = true; return; } verVersiones(); });
  bDes.addEventListener('click', async function () {
    if (!confirm('¿Desconectar tu Google Drive? Tu agenda se queda en este aparato y también la copia que ya está en tu Drive (puedes borrarla con el otro botón). Dejará de sincronizarse.')) return;
    await llamar('desconectar'); estado = { conectado: false }; acceso = null; olvidarLocal(); pintar(); aviso('Desconectado.');
  });
  bBor.addEventListener('click', async function () {
    if (!confirm('¿Borrar tu agenda de tu Google Drive y desconectar? Se borran la copia y las versiones anteriores que hay en tu Drive. Tu agenda en este aparato no se toca.')) return;
    aviso('Borrando de tu Drive…');
    try {
      for (var vuelta = 0; vuelta < 100; vuelta++) {   // la búsqueda devuelve de a 20: se repite hasta que no quede nada (con las fotos en archivos propios puede haber muchos)
        var todos = await buscar("trashed = false", 'createdTime desc', 'id'); if (!todos.length) break;
        for (var i = 0; i < todos.length; i++) await borrarArchivo(todos[i].id);
      }
    }
    catch (e) { aviso('No pudimos borrar todo de tu Drive. Inténtalo otra vez.'); return; }
    await llamar('desconectar'); estado = { conectado: false }; acceso = null; olvidarLocal(); pintar(); aviso('Listo: borramos tu agenda de tu Drive y desconectamos.');
  });
  document.addEventListener('agenda-guardada', function () {
    if (!estado || !estado.conectado) return;
    clearTimeout(temporizador); temporizador = setTimeout(function () { ciclo({}); }, 6000);
  });
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible' && estado && estado.conectado && Date.now() - ultimoCiclo > 20000) ciclo({}); });
  window.addEventListener('online', function () { ciclo({}); });
  setInterval(function () { if (document.visibilityState === 'visible' && estado && estado.conectado && Date.now() - ultimoCiclo > 80000) ciclo({}); }, 30000);

  var q = new URLSearchParams(location.search).get('drive');
  var mensajes = { cancelado: 'No se conectó: cancelaste el permiso de Google.', sin_permiso: 'Google no entregó el permiso de Drive. Inténtalo otra vez y deja marcado el acceso a Drive.', error: 'Algo salió mal al conectar con Google. Inténtalo otra vez.', no_configurado: 'La sincronización con Drive todavía no está activa.' };
  if (q === 'conectado') { estado = await llamar('estado'); pintar(); abrirConfig(); caja.scrollIntoView({ block: 'center' }); history.replaceState(null, '', location.pathname + location.hash); await ciclo({ manual: true, forzarAplicar: true }); }
  else if (mensajes[q]) { aviso(mensajes[q]); abrirConfig(); caja.scrollIntoView({ block: 'center' }); history.replaceState(null, '', location.pathname + location.hash); }
  else if (estado.conectado) setTimeout(function () { ciclo({}); }, 1200);
  window.lrDrive = { ciclo: ciclo, estado: function () { return estado; }, pendiente: function () { return pendiente; } };
})();
