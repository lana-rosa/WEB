/* Agenda para tejedoras: sincronización opcional con Google Calendar (29-oct-2026, pedido de Sara: «hagamos lo de Google Calendar»; gratis con la cuenta).
   La tarjeta `#calendario-sync` (en agenda-rosina.html) solo aparece si la persona tiene sesión y la función `google-calendar` de Supabase responde que está configurada.
   Desde el 29-oct-2026 usa el permiso NO sensible `calendar.app.created` (crea el calendario aparte «Agenda para tejedoras» y solo escribe en él), así que no necesita la verificación de Google.
   Las fechas salen de `window.lrAgenda.eventos()` (pedidos, envíos, proyectos, fechas especiales, cumpleaños de clientas, fichas y ferias). La función crea, actualiza y borra solo
   los eventos que la agenda generó. Seguros: no se sincroniza sola con una agenda sin fechas, y si habría que quitar de golpe más de 3 fechas de Google Calendar (por ejemplo, una
   agenda vacía en otro dispositivo) la función no borra nada y la persona decide con un botón. Piezas anteriores (apagadas el 13-oct): herramientas/google-calendar/agenda-apagada/. */
import { haySesionGuardada, obtenerCliente } from '/js/cuenta.js';
(async function () {
  var ABIERTO = true;                  // false = solo la ven quienes entran una vez con /agenda-rosina.html?gcal=1 (queda en ese navegador; ?gcal=0 lo quita)
  var AVISO_NO_VERIFICADA = false;     // true = avisa que puede salir «Google no ha verificado esta app» (solo haría falta si se vuelve a pedir un permiso sensible, como calendar.events)
  var caja = document.getElementById('calendario-sync');
  if (!caja || !haySesionGuardada()) return;
  try { var q0 = new URLSearchParams(location.search).get('gcal'); if (q0 === '1') localStorage.setItem('lrGcal', '1'); else if (q0 === '0') localStorage.removeItem('lrGcal'); } catch (e) {}
  var visible = ABIERTO; try { visible = visible || localStorage.getItem('lrGcal') === '1'; } catch (e) {}
  if (!visible) return;
  var txt = document.getElementById('cs-texto'), av = document.getElementById('cs-aviso'), nota = document.getElementById('cs-nota-verif');
  var bCon = document.getElementById('cs-conectar'), bSin = document.getElementById('cs-sincronizar'), bDes = document.getElementById('cs-desconectar'), bQuitar = document.getElementById('cs-quitar');
  function abrirConfig() { if (window.lrAgendaConfig) window.lrAgendaConfig.abrir(); }
  var sb, estado = null, temporizador = null, ocupado = false, retenidos = 0;
  function aviso(t) { av.textContent = t || ''; }
  function eventos() { return window.lrAgenda && window.lrAgenda.eventos ? window.lrAgenda.eventos() : []; }
  async function llamar(accion, extra) {
    var r = await sb.functions.invoke('google-calendar', { body: Object.assign({ accion: accion }, extra || {}) });
    if (r.error) {
      var d = null; try { d = await r.error.context.json(); } catch (e) {}
      return d || { error: 'No pudimos conectar con el servicio. Inténtalo de nuevo.' };
    }
    return r.data || {};
  }
  function fechaHora(iso) { var f = new Date(iso).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' }); return f + (/\.$/.test(f) ? '' : '.'); }
  function pintar() {
    var conectado = !!(estado && estado.conectado);
    bCon.hidden = conectado; bSin.hidden = !conectado; bDes.hidden = !conectado; bQuitar.hidden = !(conectado && retenidos > 0);
    if (nota) nota.hidden = !(AVISO_NO_VERIFICADA && !conectado);
    if (!conectado) txt.textContent = 'Conecta tu Google Calendar y tus entregas, proyectos, fechas especiales, ferias y cumpleaños aparecen solos en un calendario aparte llamado «Agenda para tejedoras», con un recordatorio la tarde anterior. Es gratis y opcional.';
    else txt.textContent = 'Conectado' + (estado.correo ? ' como ' + estado.correo : '') + '. ' + (estado.ultima ? 'Última sincronización: ' + fechaHora(estado.ultima) + ' Si no ves las fechas, en Google Calendar marca «Agenda para tejedoras» en «Mis calendarios».' : 'Todavía no se ha sincronizado.');
    if (conectado && retenidos > 0) txt.textContent += ' Hay ' + retenidos + ' fechas en tu Google Calendar que ya no están en esta agenda.';
  }
  async function sincronizar(manual, confirmarBorrado) {
    if (ocupado || !estado || !estado.conectado) return;
    var lista = eventos();
    if (!manual && !lista.length) return;      // una agenda sin fechas nunca sincroniza sola (por ejemplo, la de otro dispositivo)
    ocupado = true; if (manual) aviso('Sincronizando…');
    var r = await llamar('sincronizar', confirmarBorrado ? { eventos: lista, confirmarBorrado: true } : { eventos: lista });
    ocupado = false;
    if (r.reconectar) { estado.conectado = false; retenidos = 0; pintar(); aviso(r.error); return; }
    if (r.error) { aviso(r.error); return; }
    estado.ultima = new Date().toISOString(); retenidos = r.retenidos || 0; pintar();
    if (r.fallos) aviso('Algunas fechas no se pudieron sincronizar. Inténtalo otra vez.');
    else if (retenidos) aviso('No quité nada de tu Google Calendar: ' + retenidos + ' fechas ya no están en esta agenda. Si es lo que quieres, toca «Quitar esas fechas».');
    else aviso(manual ? '¡Listo! ' + (r.creados + r.actualizados + r.borrados) + ' cambio(s) en tu calendario.' : '');
  }
  try { sb = await obtenerCliente(); } catch (e) { return; }
  var e0 = await llamar('estado');
  if (!e0 || e0.configurado !== true) return;           // todavía no está activo: la tarjeta no aparece
  estado = e0; caja.hidden = false; pintar();
  bCon.addEventListener('click', async function () {
    bCon.disabled = true; aviso('Abriendo Google…');
    (window.dataLayer = window.dataLayer || []).push({ event: 'resource_use', recurso: 'agenda_google_conectar' });
    var r = await llamar('conectar');
    if (r.url) { location.href = r.url; return; }
    bCon.disabled = false; aviso(r.error || 'No pudimos iniciar la conexión.');
  });
  bSin.addEventListener('click', function () { sincronizar(true); });
  bQuitar.addEventListener('click', function () {
    if (!confirm('¿Quitar de tu Google Calendar las ' + retenidos + ' fechas que ya no están en esta agenda? Solo se quitan las que creó la agenda; tus otros eventos no se tocan.')) return;
    sincronizar(true, true);
  });
  bDes.addEventListener('click', async function () {
    if (!confirm('¿Desconectar Google Calendar? Se borrará de tu Google Calendar el calendario «Agenda para tejedoras» con sus fechas. Tu agenda en la web no se toca.')) return;
    await llamar('desconectar'); estado = { conectado: false }; retenidos = 0; pintar(); aviso('Desconectado.');
  });
  document.addEventListener('agenda-guardada', function () {     // 4 segundos después del último cambio
    if (!estado || !estado.conectado) return;
    clearTimeout(temporizador); temporizador = setTimeout(function () { sincronizar(false); }, 4000);
  });
  var q = new URLSearchParams(location.search).get('calendario');
  var mensajes = { cancelado: 'No se conectó: cancelaste el permiso de Google.', sin_permiso: 'Google no entregó el permiso. Inténtalo otra vez y acepta el acceso al calendario.', error: 'Algo salió mal al conectar con Google. Inténtalo otra vez.', no_configurado: 'La sincronización todavía no está activa.' };
  if (q === 'conectado') { estado = await llamar('estado'); pintar(); abrirConfig(); caja.scrollIntoView({ block: 'center' }); await sincronizar(true); history.replaceState(null, '', location.pathname + location.hash); }
  else if (mensajes[q]) { aviso(mensajes[q]); abrirConfig(); caja.scrollIntoView({ block: 'center' }); history.replaceState(null, '', location.pathname + location.hash); }
})();
