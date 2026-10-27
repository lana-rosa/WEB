/* Agenda para tejedoras: acceso previo a la agenda completa por cuenta (28-oct-2026, pedido de Sara).
   Mientras la agenda completa está «en construcción», quien entra con una cuenta que está en la tabla `agenda_acceso_previo` (migración 35) la ve completa.
   Los correos no están en el código: la base solo deja a cada persona ver su propia fila. La marca queda en este dispositivo (`lrAgendaAcceso`) y se vuelve a
   comprobar cada vez que se abre la agenda; si la persona sale de su cuenta o la quitan de la lista, vuelve a ver solo las hojas gratis. */
import { haySesionGuardada, obtenerCliente } from '/js/cuenta.js';
(async function () {
  var CLAVE = 'lrAgendaAcceso', RECARGA = 'lrAgendaAccesoRecarga';
  var gratis = document.documentElement.classList.contains('agenda-gratis'), tenia = false;
  try { tenia = localStorage.getItem(CLAVE) === '1'; } catch (e) {}
  function recargar(sentido) {   // una sola recarga por sentido cada 15 segundos: evita un bucle si algo sale mal
    try { var g = (sessionStorage.getItem(RECARGA) || '').split(':'); if (g[0] === sentido && Date.now() - parseInt(g[1], 10) < 15000) return; sessionStorage.setItem(RECARGA, sentido + ':' + Date.now()); } catch (e) {}
    location.reload();
  }
  if (!haySesionGuardada()) { try { localStorage.removeItem(CLAVE); } catch (e) {} return; }
  var esta = null;
  try {
    var sb = await obtenerCliente();
    var r = await sb.from('agenda_acceso_previo').select('email').limit(1);
    if (!r.error && Array.isArray(r.data)) esta = r.data.length > 0;
  } catch (e) { /* sin conexión: se deja como estaba */ }
  if (esta === true && !tenia) { try { localStorage.setItem(CLAVE, '1'); } catch (e) {} if (gratis) recargar('abrir'); }
  else if (esta === false && tenia) { try { localStorage.removeItem(CLAVE); } catch (e) {} if (!gratis) recargar('cerrar'); }
})();
