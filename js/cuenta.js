// Cuenta de clientes de Lana Rosa: sesión, carrito guardado y aviso en el encabezado.
// Se carga en todas las páginas. Si la persona no tiene sesión, no descarga nada más.
const SUPABASE_URL = 'https://ngjoognzvehwjtpqwrqe.supabase.co';
const SUPABASE_KEY = 'sb_publishable_2TQ_piaHlSMHa79zjmOOXg_6bEwgkKD';
const CLAVE_SESION = 'sb-ngjoognzvehwjtpqwrqe-auth-token';
const CLAVE_CARRITO = 'carritoLanaRosa';

export function haySesionGuardada() {
  try { return !!localStorage.getItem(CLAVE_SESION); } catch (e) { return false; }
}

let promesaCliente = null;
export function obtenerCliente() {
  if (!promesaCliente) {
    promesaCliente = import('/js/vendor/supabase.js?v=1')
      .then(function (m) { return m.createClient(SUPABASE_URL, SUPABASE_KEY); });
  }
  return promesaCliente;
}

export async function obtenerPerfil() {
  const sb = await obtenerCliente();
  const { data } = await sb.rpc('mi_cuenta');
  return data || null;
}

/* ---------- Carrito guardado en la cuenta ---------- */
function leerLocal() {
  try { const c = JSON.parse(localStorage.getItem(CLAVE_CARRITO)); return Array.isArray(c) ? c : []; } catch (e) { return []; }
}
const guardarOriginal = Storage.prototype.setItem;
function escribirLocal(items) {
  guardarOriginal.call(localStorage, CLAVE_CARRITO, JSON.stringify(items));
  const contador = document.getElementById('contador-carrito');
  if (contador) contador.textContent = items.reduce(function (s, i) { return s + (Number(i.cantidad) || 0); }, 0);
}
function fusionar(a, b) {
  const mapa = new Map();
  a.concat(b).forEach(function (i) {
    const previo = mapa.get(i.id);
    if (!previo || (Number(i.cantidad) || 0) > (Number(previo.cantidad) || 0)) mapa.set(i.id, Object.assign({}, i));
  });
  return Array.from(mapa.values());
}
function igual(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

let usuarioId = null;
let sincronizando = false;
let temporizador = null;
const claveMarca = function () { return 'lrCarritoSync-' + usuarioId; };

async function enviarCarrito() {
  if (!usuarioId) return;
  const sb = await obtenerCliente();
  const ahora = new Date().toISOString();
  const { error } = await sb.from('carritos_web').upsert({ user_id: usuarioId, items: leerLocal(), updated_at: ahora });
  if (!error) { try { guardarOriginal.call(localStorage, claveMarca(), ahora); } catch (e) {} }
}

export async function iniciarSincronizacion() {
  if (sincronizando) return;
  const sb = await obtenerCliente();
  const { data: sesion } = await sb.auth.getSession();
  if (!sesion || !sesion.session) return;
  sincronizando = true;
  usuarioId = sesion.session.user.id;

  const { data: remotoFila } = await sb.from('carritos_web').select('items, updated_at').eq('user_id', usuarioId).maybeSingle();
  const remoto = remotoFila && Array.isArray(remotoFila.items) ? remotoFila.items : [];
  const local = leerLocal();
  let ultimaMarca = null;
  try { ultimaMarca = localStorage.getItem(claveMarca()); } catch (e) {}

  let resultado;
  if (!ultimaMarca) {
    // Primera vez en este dispositivo: se juntan el carrito de invitado y el guardado.
    resultado = fusionar(remoto, local);
  } else if (remotoFila && remotoFila.updated_at > ultimaMarca) {
    // Se cambió desde otro dispositivo: manda el guardado.
    resultado = remoto;
  } else {
    resultado = local;
  }
  if (!igual(resultado, local)) escribirLocal(resultado);
  if (!igual(resultado, remoto) || !ultimaMarca) await enviarCarrito();
  else if (remotoFila) { try { guardarOriginal.call(localStorage, claveMarca(), remotoFila.updated_at); } catch (e) {} }

  // Desde ahora, cada cambio del carrito se guarda en la cuenta.
  Storage.prototype.setItem = function (clave) {
    guardarOriginal.apply(this, arguments);
    if (this === localStorage && clave === CLAVE_CARRITO) {
      clearTimeout(temporizador);
      temporizador = setTimeout(enviarCarrito, 700);
    }
  };
  document.dispatchEvent(new CustomEvent('cuenta:carrito-listo'));
}

// Número de compras por calificar, en el ícono de la cuenta de cualquier página (se recuerda 10 min por pestaña).
const CLAVE_PENDIENTES = 'lrPendResenas';
export function actualizarInsigniaCuenta(n) {
  try { sessionStorage.setItem(CLAVE_PENDIENTES, JSON.stringify({ n: n, t: Date.now() })); } catch (e) {}
  if (!document.getElementById('estilo-insignia-cuenta')) {
    const st = document.createElement('style'); st.id = 'estilo-insignia-cuenta';
    st.textContent = '.insignia-cuenta{position:absolute;bottom:-4px;right:-4px;min-width:18px;height:18px;padding:0 4px;border-radius:999px;background:#E74E96;color:#fff;font-size:.68rem;font-weight:700;display:flex;align-items:center;justify-content:center;border:2px solid #fff;line-height:1}';
    document.head.append(st);
  }
  document.querySelectorAll('.boton-cuenta-header').forEach(function (a) {
    let b = a.querySelector('.insignia-cuenta');
    if (!n) { if (b) b.remove(); a.setAttribute('title', 'Mi cuenta'); return; }
    if (!b) { b = document.createElement('span'); b.className = 'insignia-cuenta'; b.setAttribute('aria-hidden', 'true'); a.append(b); }
    b.textContent = n > 9 ? '9+' : String(n);
    a.setAttribute('title', 'Mi cuenta · te falta calificar ' + n + (n === 1 ? ' compra' : ' compras'));
  });
}
async function revisarPendientes() {
  try {
    const c = JSON.parse(sessionStorage.getItem(CLAVE_PENDIENTES) || 'null');
    if (c && Date.now() - c.t < 600000) return actualizarInsigniaCuenta(c.n);
  } catch (e) {}
  const sb = await obtenerCliente();
  const { data, error } = await sb.rpc('mis_resenas');
  if (error) return;
  actualizarInsigniaCuenta(((data && data.pendientes) || []).length);
}

export function marcarEncabezado() {
  document.querySelectorAll('.boton-cuenta-header').forEach(function (a) {
    a.classList.add('con-sesion');
    a.setAttribute('title', 'Mi cuenta');
  });
}

if (haySesionGuardada()) {
  const arrancar = function () {
    marcarEncabezado();
    iniciarSincronizacion().catch(function (e) { console.warn('Carrito de la cuenta:', e); });
    revisarPendientes().catch(function () {});
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar); else arrancar();
}
