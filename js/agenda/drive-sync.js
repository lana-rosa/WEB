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

  /* ---------- versiones anteriores ---------- */
  async function guardarVersion(datos, motivo) {
    var ts = new Date().toISOString().replace(/[:.]/g, '-');
    await guardarArchivo(null, PREFIJO_ANT + ts + '.json', sobre(datos), { tipo: 'anterior', motivo: motivo });
    lsSet(K_SNAP, String(Date.now()));
    try { var todas = await buscar("name contains '" + PREFIJO_ANT + "'", 'createdTime desc', 'id,name,createdTime'); for (var i = MAX_ANTERIORES; i < todas.length; i++) await borrarArchivo(todas[i].id); } catch (e) { /* limpiar es opcional */ }
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
  function aplicarLocal(datos, rev) {
    var N = window.lrAgendaNucleo, mem = N && N.datos ? N.datos() : null;
    if (mem) { Object.keys(mem).forEach(function (k) { delete mem[k]; }); Object.keys(datos).forEach(function (k) { mem[k] = datos[k]; }); }   // lo que la página tiene en memoria queda igual, así no pisa lo mezclado
    lsSet(CLAVE, JSON.stringify(datos)); lsSet(K_BASE, JSON.stringify(datos)); lsSet(K_REV, rev);
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
      var L = leerLocal(), textoLocal = lsGet(CLAVE) || '', base = leerBase(), revVisto = lsGet(K_REV), tb = tablas();
      var archivos = await buscar("name = '" + NOMBRE + "'");
      var meta = archivos[0] || null, ahora = new Date().toISOString();
      if (!meta) {   // Drive todavía no tiene la agenda
        if (!hayDatos(L)) { estado.ultima = ahora; pintar(); aviso(manual ? 'Todo listo. Tu agenda está vacía; se guardará en Drive cuando escribas.' : ''); return; }
        var rev0 = nuevaRev(); await guardarArchivo(null, NOMBRE, sobre(L), { rev: rev0 });
        lsSet(K_BASE, JSON.stringify(L)); lsSet(K_REV, rev0); await terminar(manual, 'Tu agenda quedó guardada en tu Google Drive.'); return;
      }
      var revRemoto = (meta.appProperties || {}).rev || '', R;
      if (base && revRemoto && revRemoto === revVisto) R = base;           // Drive no cambió desde la última vez: no hace falta bajarla
      else { var sob = await leerArchivo(meta.id); R = sob && sob.datos && typeof sob.datos === 'object' ? sob.datos : {}; }
      var f = M.fusionar(base, L, R, tb), Mx = f.resultado;
      var igualRemoto = M.igual(Mx, R), igualLocal = M.igual(Mx, L);
      if (igualRemoto && igualLocal) {   // todo igual en los dos lados
        lsSet(K_BASE, JSON.stringify(L)); if (revRemoto) lsSet(K_REV, revRemoto); await terminar(manual, 'Tu agenda ya está al día.'); mostrarBanner(false); return;
      }
      var cambiaLocal = !igualLocal, aplicarAhora = cambiaLocal && (!!opc.forzarAplicar || ocioso());
      var rev = revRemoto;
      if (!igualRemoto) {   // subir lo mezclado (antes, una versión anterior de Drive si hubo choque o hace tiempo que no se guarda una)
        var haceMucho = Date.now() - Number(lsGet(K_SNAP) || 0) > HORAS_ENTRE_VERSIONES * 3600000;
        if (Object.keys(R).length && (f.conflictos.length || f.duplicadas.length)) await guardarVersion(R, MOTIVOS.conflicto);
        else if (Object.keys(R).length && haceMucho) await guardarVersion(R, cambiaLocal ? MOTIVOS.mezcla : MOTIVOS.periodica);
        rev = nuevaRev(); await guardarArchivo(meta.id, NOMBRE, sobre(Mx), { rev: rev });
        var ver = await buscar("name = '" + NOMBRE + "'");
        if (!ver[0] || (ver[0].appProperties || {}).rev !== rev) { otraVez = true; aviso(manual ? 'Otro aparato guardó al mismo tiempo; vuelvo a intentarlo.' : ''); return; }   // alguien escribió justo en medio: la base no cambia y se mezcla de nuevo
      }
      var avisos = [];
      if (f.conflictos.length) avisos.push('Cambiaste ' + f.conflictos.length + (f.conflictos.length === 1 ? ' casilla' : ' casillas') + ' de forma distinta en dos aparatos. Dejé la de este aparato; la otra quedó en «Versiones anteriores».');
      if (f.duplicadas.length) avisos.push(f.duplicadas.length + (f.duplicadas.length === 1 ? ' ficha se cambió' : ' fichas se cambiaron') + ' distinto en dos aparatos: quedaron las dos versiones. Borra la que sobre.');
      if (cambiaLocal && !aplicarAhora) {   // la persona está escribiendo: lo suyo ya quedó en Drive y lo del otro aparato espera su aviso «Actualizar» (la base es lo que ya compartimos: lo de aquí)
        lsSet(K_BASE, JSON.stringify(L)); lsSet(K_REV, ''); pendiente = true; mostrarBanner(true);
        aviso('Hay cambios de otro aparato; toca «Actualizar» cuando termines de escribir.'); return;
      }
      if (cambiaLocal) {
        if (lsGet(CLAVE) !== textoLocal) {   // la persona escribió mientras sincronizábamos: no se pisa; la base es lo que ya está en Drive de lo nuestro y se vuelve a mezclar
          lsSet(K_BASE, JSON.stringify(L)); lsSet(K_REV, ''); otraVez = true; return;
        }
        aplicarLocal(Mx, rev); mostrarBanner(false); pendiente = false;
        try { await llamar('sincronizada'); } catch (e) {}
        estado.ultima = ahora; pintar();
        if (avisos.length) lsSet('lrDriveAvisos', JSON.stringify(avisos));
        recargarSiSeguro(); return;
      }
      lsSet(K_BASE, JSON.stringify(Mx)); lsSet(K_REV, rev);
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
      await guardarVersion(leerLocal(), MOTIVOS.restaurar);
      var rev = nuevaRev(); await guardarArchivo(meta ? meta.id : null, NOMBRE, sobre(datos), { rev: rev });
      aplicarLocal(datos, rev); recargarSiSeguro();
    } catch (e) { aviso('No pudimos restaurar esa versión. Inténtalo otra vez.'); }
  }
  function olvidarLocal() { [K_BASE, K_REV, K_UID, K_SNAP, 'lrDriveAvisos'].forEach(lsDel); }

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
    try { var todos = await buscar("trashed = false", 'createdTime desc', 'id'); for (var i = 0; i < todos.length; i++) await borrarArchivo(todos[i].id); }
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
