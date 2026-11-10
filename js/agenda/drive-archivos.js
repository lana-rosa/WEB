/* Agenda para tejedoras: guardar el Excel y las copias de seguridad en una carpeta VISIBLE del Google Drive de la persona (Conexiones e integraciones, etapa 4, 10-nov-2026).
   Es una conexión APARTE de la sincronización de Drive (drive-sync.js, carpeta oculta `drive.appdata`): permiso `drive.file` (la app solo ve lo que ella misma crea, no el resto del Drive),
   su propia función de Supabase (`google-drive-archivos`, solo consigue el permiso y entrega una llave de ~1 hora) y su propio aviso antes de conectar (aviso-conexion.js, servicio «archivos»).
   Los archivos van directo del navegador al Drive de la persona: no pasan por Lana Rosa. Solo se sube cuando la persona toca un botón; nunca solo, y nunca se borra ni se sobrescribe nada
   (cada archivo lleva fecha y hora en el nombre). Carpeta: «Agenda para tejedoras» en «Mi unidad»; si la persona la borra, se vuelve a crear. «Desconectar» quita el permiso; lo ya guardado se queda (es suyo).
   La tarjeta `#drive-archivos` solo aparece si la función responde `configurado:true` (mientras no esté desplegada no se ve). Prueba: herramientas/pruebas/probar_agenda_drive_archivos.py. */
import { haySesionGuardada, obtenerCliente } from '/js/cuenta.js';
(async function () {
  var caja = document.getElementById('drive-archivos');
  if (!caja || !haySesionGuardada()) return;
  var txt = document.getElementById('da-texto'), av = document.getElementById('da-aviso');
  var bCon = document.getElementById('da-conectar'), bXls = document.getElementById('da-excel'), bCop = document.getElementById('da-copia'), bAbrir = document.getElementById('da-abrir'), bDes = document.getElementById('da-desconectar');
  var API = 'https://www.googleapis.com/drive/v3/files', SUBIR = 'https://www.googleapis.com/upload/drive/v3/files', CARPETA = 'Agenda para tejedoras', MIME_CARPETA = 'application/vnd.google-apps.folder';
  var MAX_MULTIPARTE = 4 * 1024 * 1024;
  var sb = null, estado = null, acceso = null, ocupado = false, carpeta = null;
  function aviso(t) { av.textContent = t || ''; }
  function abrirConfig() { if (window.lrAgendaConfig) window.lrAgendaConfig.abrir(); }
  function fechaHora(iso) { var f = new Date(iso).toLocaleString((window.lrI18n && window.lrI18n.lang === 'en') ? 'en-US' : (window.lrI18n && window.lrI18n.lang === 'pt') ? 'pt-BR' : 'es-CO', { dateStyle: 'medium', timeStyle: 'short' }); return f + (/\.$/.test(f) ? '' : '.'); }
  async function llamar(accion) {
    var r = await sb.functions.invoke('google-drive-archivos', { body: { accion: accion } });
    if (r.error) { var d = null; try { d = await r.error.context.json(); } catch (e) {} return d || { error: 'No pudimos conectar con el servicio. Inténtalo de nuevo.' }; }
    return r.data || {};
  }
  async function llave(forzar) {
    if (!forzar && acceso && acceso.hasta - Date.now() > 120000) return acceso.token;
    var r = await llamar('token');
    if (r.reconectar) { var e = new Error('reconectar'); e.mensaje = r.error; throw e; }
    if (!r.access_token) throw new Error('sin_llave');
    acceso = { token: r.access_token, hasta: Date.now() + (r.expires_in || 3000) * 1000 }; return acceso.token;
  }
  async function drive(url, op, reintento) {
    op = op || {}; op.headers = Object.assign({ Authorization: 'Bearer ' + await llave(!!reintento) }, op.headers || {});
    var r = await fetch(url, op);
    if (r.status === 401 && !reintento) return drive(url, op, true);
    return r;
  }
  function fallo(r, que) { var e = new Error(que + ' ' + r.status); e.estado = r.status; return e; }
  async function asegurarCarpeta() {   // la carpeta «Agenda para tejedoras» creada por esta app (con drive.file solo se ven las propias); si no existe, se crea
    var q = "name = '" + CARPETA + "' and mimeType = '" + MIME_CARPETA + "' and trashed = false";
    var r = await drive(API + '?pageSize=10&q=' + encodeURIComponent(q) + '&fields=' + encodeURIComponent('files(id,webViewLink)')); if (!r.ok) throw fallo(r, 'buscar carpeta');
    var f = ((await r.json()).files || [])[0];
    if (!f) {
      var c = await drive(API + '?fields=' + encodeURIComponent('id,webViewLink'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: CARPETA, mimeType: MIME_CARPETA }) });
      if (!c.ok) throw fallo(c, 'crear carpeta'); f = await c.json();
    }
    carpeta = f; return f;
  }
  async function subirArchivo(nombre, tipo, blob, idCarpeta) {   // hasta 4 MB de una vez; más grande, por partes (resumible)
    var meta = { name: nombre, parents: [idCarpeta] };
    if (blob.size <= MAX_MULTIPARTE) {
      var b = 'lr' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      var cuerpo = new Blob(['--' + b + '\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n' + JSON.stringify(meta) + '\r\n--' + b + '\r\nContent-Type: ' + tipo + '\r\n\r\n', blob, '\r\n--' + b + '--']);
      var r = await drive(SUBIR + '?uploadType=multipart&fields=id,name', { method: 'POST', headers: { 'Content-Type': 'multipart/related; boundary=' + b }, body: cuerpo });
      if (!r.ok) throw fallo(r, 'subir'); return r.json();
    }
    var ini = await drive(SUBIR + '?uploadType=resumable&fields=id,name', { method: 'POST', headers: { 'Content-Type': 'application/json; charset=UTF-8', 'X-Upload-Content-Type': tipo }, body: JSON.stringify(meta) });
    if (!ini.ok) throw fallo(ini, 'iniciar subida'); var url = ini.headers.get('Location'); if (!url) throw new Error('sin_ubicacion');
    var r2 = await fetch(url, { method: 'PUT', headers: { 'Content-Type': tipo }, body: blob }); if (!r2.ok) throw fallo(r2, 'subir'); return r2.json();
  }
  function marca() { var d = new Date(), z = function (n) { return ('0' + n).slice(-2); }; return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()) + '-' + z(d.getHours()) + z(d.getMinutes()); }
  async function guardar(que) {
    if (ocupado || !estado || !estado.conectado) return;
    ocupado = true; pintar();
    try {
      var blob, nombre, tipo;
      if (que === 'excel') {
        blob = window.lrExportar && window.lrExportar.crearBlob ? window.lrExportar.crearBlob() : null;
        if (!blob) { aviso('Todavía no hay nada escrito para exportar. Llena alguna hoja de tu agenda y vuelve a intentarlo.'); return; }
        nombre = 'agenda-para-tejedoras-' + marca() + '.xlsx'; tipo = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      } else {
        blob = await window.lrAgendaCopia.crear(); nombre = 'agenda-rosina-' + marca() + '.json'; tipo = 'application/json';
      }
      aviso('Guardando en tu Drive…');
      var c = await asegurarCarpeta(), f = await subirArchivo(nombre, tipo, blob, c.id);
      try { await llamar('guardado'); } catch (e) {}
      estado.ultimo = new Date().toISOString();
      (window.dataLayer = window.dataLayer || []).push({ event: 'resource_use', recurso: 'agenda_drive_archivos', tipo: que });
      aviso('Listo: guardé «' + f.name + '» en la carpeta «' + CARPETA + '» de tu Drive.');
    } catch (e) { manejarError(e); }
    finally { ocupado = false; pintar(); }
  }
  function manejarError(e) {
    if (e && e.message === 'reconectar') { estado.conectado = false; aviso(e.mensaje || 'El permiso de Drive venció. Vuelve a conectarlo.'); return; }
    if (e && (e.estado === 403 || e.estado === 400)) { aviso('Google no dejó guardar en tu Drive. Desconecta y vuelve a conectar, y acepta el permiso.'); return; }
    aviso(navigator.onLine ? 'No pudimos guardar en tu Drive ahora. Inténtalo otra vez.' : 'Sin conexión: no se guardó nada. Inténtalo cuando vuelva.');
  }
  function pintar() {
    var c = !!(estado && estado.conectado);
    bCon.hidden = c; bXls.hidden = !c; bCop.hidden = !c; bAbrir.hidden = !(c && carpeta && carpeta.webViewLink); bDes.hidden = !c;
    bXls.disabled = bCop.disabled = ocupado;
    if (!c) txt.textContent = 'Guarda tu Excel y tus copias de seguridad en una carpeta de tu propio Google Drive, que tú puedes abrir, mover y compartir. Solo se guarda cuando tú lo pides. Es gratis y opcional.';
    else {
      txt.textContent = '';
      [estado.correo ? ('Conectado como ' + estado.correo + '.') : 'Conectado.', estado.ultimo ? ('Último guardado: ' + fechaHora(estado.ultimo)) : 'Todavía no has guardado nada.'].forEach(function (x, i) {
        var sp = document.createElement('span'); sp.textContent = x; if (i) txt.appendChild(document.createTextNode(' ')); txt.appendChild(sp);
      });
    }
  }
  try { sb = await obtenerCliente(); } catch (e) { return; }
  var e0 = await llamar('estado');
  if (!e0 || e0.configurado !== true) return;           // la función todavía no está desplegada o activa: la tarjeta no aparece
  estado = e0; caja.hidden = false; pintar();
  bCon.addEventListener('click', async function () {
    if (!window.lrAvisoConexion || !(await window.lrAvisoConexion.pedir('archivos'))) return;   // aviso aparte antes de conectar; sin el aviso no se conecta
    bCon.disabled = true; aviso('Abriendo Google…');
    (window.dataLayer = window.dataLayer || []).push({ event: 'resource_use', recurso: 'agenda_drive_archivos_conectar' });
    var r = await llamar('conectar');
    if (r.url) { location.href = r.url; return; }
    bCon.disabled = false; aviso(r.error || 'No pudimos iniciar la conexión.');
  });
  bXls.addEventListener('click', function () { guardar('excel'); });
  bCop.addEventListener('click', function () { guardar('copia'); });
  bAbrir.addEventListener('click', function () { if (carpeta && carpeta.webViewLink) window.open(carpeta.webViewLink, '_blank', 'noopener'); });
  bDes.addEventListener('click', async function () {
    if (!confirm('¿Desconectar? Dejaremos de poder guardar en tu Drive. Lo que ya guardaste se queda en tu carpeta «' + CARPETA + '» (es tuyo y lo puedes borrar cuando quieras).')) return;
    await llamar('desconectar'); estado = { configurado: true, conectado: false }; acceso = null; carpeta = null; pintar(); aviso('Desconectado.');
  });
  var q = new URLSearchParams(location.search).get('driveArchivos');
  var mensajes = { cancelado: 'No se conectó: cancelaste el permiso de Google.', sin_permiso: 'Google no entregó el permiso de Drive. Inténtalo otra vez y deja marcado el acceso a Drive.', error: 'Algo salió mal al conectar con Google. Inténtalo otra vez.', no_configurado: 'El guardado en tu Drive todavía no está activo.' };
  if (q === 'conectado') { estado = await llamar('estado'); pintar(); abrirConfig(); caja.scrollIntoView({ block: 'center' }); aviso('Conectado. Ya puedes guardar tu Excel o una copia en tu Drive.'); history.replaceState(null, '', location.pathname + location.hash); }
  else if (mensajes[q]) { aviso(mensajes[q]); abrirConfig(); caja.scrollIntoView({ block: 'center' }); history.replaceState(null, '', location.pathname + location.hash); }
  window.lrDriveArchivos = { estado: function () { return estado; } };
})();
