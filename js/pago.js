// Pago en línea con Wompi desde el carrito. Se carga en todas las páginas con carrito.
// El navegador solo manda los ids y las cantidades; los precios y el envío los calcula la función
// "crear-pago-wompi" de Supabase con los datos del ERP. Las llaves de Wompi viven solo en Supabase.
import { haySesionGuardada, obtenerCliente } from './cuenta.js';

// El botón "Pagar en línea" está habilitado en el código, pero el servidor decide si se muestra:
// solo aparece para el público cuando las llaves guardadas en Supabase (Edge Functions → Secrets) son de
// PRODUCCIÓN (pub_prod_…). Con llaves de pruebas (pub_test_…) solo lo ve quien abre ?pagosprueba=1.
export const PAGOS_ACTIVOS = true;

const SUPABASE_URL = 'https://ngjoognzvehwjtpqwrqe.supabase.co';
const SUPABASE_KEY = 'sb_publishable_2TQ_piaHlSMHa79zjmOOXg_6bEwgkKD';
const CLAVE_CARRITO = 'carritoLanaRosa';
const WHATSAPP = '573205072801';

const pesos = (n) => '$' + Math.round(Number(n) || 0).toLocaleString('es-CO');
function leerCarrito() {
  try { const c = JSON.parse(localStorage.getItem(CLAVE_CARRITO)); return Array.isArray(c) ? c : []; } catch (e) { return []; }
}
function nodo(tag, clase, texto) {
  const e = document.createElement(tag);
  if (clase) e.className = clase;
  if (texto != null) e.textContent = texto;
  return e;
}

const CSS = `
.pago-overlay { position: fixed; inset: 0; z-index: 3000; background: rgba(0,0,0,0.55); display: flex; align-items: flex-start; justify-content: center; padding: 16px; overflow-y: auto; }
.pago-overlay[hidden] { display: none; }
.pago-modal { position: relative; background: #fff; border-radius: 22px; width: 100%; max-width: 520px; margin: 24px 0; padding: 26px 22px 22px; box-shadow: 0 12px 40px rgba(0,0,0,0.3); }
.pago-modal h2 { margin: 0 0 12px; font-size: 1.3rem; }
.pago-cerrar { position: absolute; top: 10px; right: 12px; background: none; border: none; font-size: 1.8rem; line-height: 1; cursor: pointer; color: #45454A; }
.pago-resumen { background: #FBE4EF; border-radius: 14px; padding: 12px 14px; margin: 0 0 16px; font-size: 0.95rem; }
.pago-resumen div { display: flex; justify-content: space-between; gap: 10px; padding: 2px 0; }
.pago-resumen .total { font-weight: 800; border-top: 1px solid rgba(231,78,150,0.35); margin-top: 6px; padding-top: 6px; }
.pago-resumen .descuento { color: #B83E78; font-weight: 700; }
.pago-resumen .pista { color: #6E6E73; font-size: 0.85rem; }
.pago-campo { display: flex; flex-direction: column; gap: 5px; margin-bottom: 12px; }
.pago-campo[hidden] { display: none; }
.pago-campo label { font-weight: 700; font-size: 0.88rem; }
.pago-campo input, .pago-campo select, .pago-campo textarea { font: inherit; padding: 10px 12px; border-radius: 12px; border: 1.5px solid rgba(69,69,74,0.2); background: #FAFAF7; color: #45454A; width: 100%; box-sizing: border-box; }
.pago-campo textarea { min-height: 64px; resize: vertical; }
.pago-fila { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
@media (max-width: 480px) { .pago-fila { grid-template-columns: 1fr; gap: 0; } }
.pago-acepto { display: flex; gap: 10px; align-items: flex-start; font-size: 0.88rem; margin: 4px 0 14px; }
.pago-acepto input { margin-top: 3px; accent-color: #E74E96; width: 18px; height: 18px; flex-shrink: 0; }
.pago-enviar { width: 100%; font: inherit; font-weight: 700; padding: 14px; border-radius: 999px; border: none; background: #E74E96; color: #fff; cursor: pointer; }
.pago-enviar:disabled { opacity: 0.6; cursor: wait; }
.pago-aviso { margin: 12px 0 0; padding: 11px 14px; border-radius: 12px; background: #fdecea; color: #a12a20; font-weight: 600; font-size: 0.92rem; }
.pago-aviso[hidden] { display: none; }
.pago-aviso a { color: inherit; }
.pago-nota { color: #6E6E73; font-size: 0.82rem; margin: 10px 0 0; text-align: center; }
.nota-pago-carrito { color: #6E6E73; font-size: 0.8rem; text-align: center; margin: -4px 0 10px; }
`;

let tarifas = null;
async function cargarTarifas() {
  if (tarifas) return tarifas;
  try {
    const r = await fetch(SUPABASE_URL + '/rest/v1/rpc/obtener_tarifas_envio_web', {
      method: 'POST', headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY }, body: '{}'
    });
    const d = await r.json();
    tarifas = Array.isArray(d) ? d : [];
  } catch (e) { tarifas = []; }
  return tarifas;
}

async function tokenSesion() {
  if (!haySesionGuardada()) return null;
  try {
    const sb = await obtenerCliente();
    const { data } = await sb.auth.getSession();
    return data && data.session ? data.session.access_token : null;
  } catch (e) { return null; }
}

async function datosCuenta() {
  if (!haySesionGuardada()) return {};
  try {
    const sb = await obtenerCliente();
    const { data: s } = await sb.auth.getSession();
    if (!s || !s.session) return {};
    const { data: perfil } = await sb.rpc('mi_cuenta');
    const { data: dirs } = await sb.from('direcciones_web').select('*').order('es_principal', { ascending: false }).limit(1);
    const d = dirs && dirs[0];
    return {
      nombre: (d && d.nombre_receptor) || (perfil && perfil.nombre) || '',
      correo: s.session.user.email || (perfil && perfil.email) || '',
      telefono: (d && d.telefono) || (perfil && perfil.telefono) || '',
      ciudad: (d && d.ciudad) || (perfil && perfil.ciudad) || '',
      direccion: (d && d.direccion) || '',
      indicaciones: (d && d.indicaciones) || ''
    };
  } catch (e) { return {}; }
}

let overlay = null;
function construirModal() {
  const st = document.createElement('style'); st.textContent = CSS; document.head.append(st);
  overlay = nodo('div', 'pago-overlay'); overlay.hidden = true;
  overlay.innerHTML =
    '<div class="pago-modal" role="dialog" aria-modal="true" aria-labelledby="pago-titulo">' +
      '<button type="button" class="pago-cerrar" aria-label="Cerrar">&times;</button>' +
      '<h2 id="pago-titulo">Continuar compra</h2>' +
      '<div class="pago-resumen" id="pago-resumen"></div>' +
      '<form id="pago-form" novalidate>' +
        '<div class="pago-fila">' +
          '<div class="pago-campo"><label for="pg-nombre">Tu nombre*</label><input id="pg-nombre" autocomplete="name" maxlength="120"></div>' +
          '<div class="pago-campo"><label for="pg-telefono">WhatsApp*</label><input id="pg-telefono" type="tel" autocomplete="tel" maxlength="20" placeholder="Ej: 3001234567"></div>' +
        '</div>' +
        '<div class="pago-campo"><label for="pg-correo">Correo*</label><input id="pg-correo" type="email" autocomplete="email" maxlength="120"></div>' +
        '<div class="pago-campo"><label for="pg-ciudad">Ciudad de envío*</label><select id="pg-ciudad"></select></div>' +
        '<div class="pago-campo" id="pg-otra-caja" hidden><label for="pg-otra">¿Cuál ciudad o municipio?*</label><input id="pg-otra" maxlength="60" autocomplete="address-level2"></div>' +
        '<div class="pago-campo"><label for="pg-direccion">Dirección*</label><input id="pg-direccion" autocomplete="street-address" maxlength="200" placeholder="Calle, número, barrio"></div>' +
        '<div class="pago-campo"><label for="pg-notas">Indicaciones o notas (opcional)</label><textarea id="pg-notas" maxlength="400" placeholder="Ej: portería, apartamento, mensaje para la tarjeta"></textarea></div>' +
        '<label class="pago-acepto"><input type="checkbox" id="pg-acepto"><span>Acepto la <a href="politicas.html#datos" target="_blank" rel="noopener">política de tratamiento de datos</a> y la <a href="politicas.html" target="_blank" rel="noopener">política de envíos y cambios</a>.</span></label>' +
        '<label class="pago-acepto" id="pg-cuenta-caja"><input type="checkbox" id="pg-cuenta" checked><span>Crear mi cuenta con este correo para ver el estado de mi pedido. Sin contraseña: te enviamos un correo para activarla cuando pagues.</span></label>' +
        '<button type="submit" class="pago-enviar" id="pago-enviar">Ir a pagar con Wompi</button>' +
        '<p class="pago-aviso" id="pago-aviso" role="alert" hidden></p>' +
        '<p class="pago-nota">🔒 Pagas en el sitio seguro de Wompi con tarjeta, PSE, Nequi y más. Nosotras no guardamos los datos de tu tarjeta.</p>' +
      '</form>' +
    '</div>';
  document.body.append(overlay);
  overlay.querySelector('.pago-cerrar').addEventListener('click', cerrar);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) cerrar(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !overlay.hidden) cerrar(); });
  overlay.querySelector('#pg-ciudad').addEventListener('change', actualizarResumen);
  ['pg-correo', 'pg-telefono'].forEach((id) => { const c = overlay.querySelector('#' + id); c.addEventListener('input', cotizarDescuento); c.addEventListener('change', cotizarDescuento); });
  overlay.querySelector('#pago-form').addEventListener('submit', enviar);
}
function cerrar() { if (overlay) overlay.hidden = true; document.body.style.overflow = ''; }
const $ = (id) => overlay.querySelector('#' + id);

function tarifaElegida() {
  const ciudad = $('pg-ciudad').value;
  const t = (tarifas || []).find((x) => x.ciudad === ciudad);
  return t ? Number(t.valor) : null;
}
// Descuento de primera compra: lo decide el servidor (por correo/teléfono); aquí solo se consulta y se muestra.
let cot = null, cotClave = '', cotTimer = null;
function cotizarDescuento() {
  clearTimeout(cotTimer);
  cotTimer = setTimeout(async () => {
    const correo = $('pg-correo').value.trim().toLowerCase(), telefono = $('pg-telefono').value.trim();
    const items = leerCarrito().map((i) => ({ id: i.id, cantidad: i.cantidad }));
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo) || !items.length) { if (cot) { cot = null; cotClave = ''; actualizarResumen(); } return; }
    const clave = correo + '|' + telefono + '|' + JSON.stringify(items);
    if (clave === cotClave) return;
    cotClave = clave;
    try {
      const token = await tokenSesion();
      const headers = { 'Content-Type': 'application/json', apikey: SUPABASE_KEY };
      if (token) headers.Authorization = 'Bearer ' + token;
      const res = await fetch(SUPABASE_URL + '/functions/v1/crear-pago-wompi', { method: 'POST', headers, body: JSON.stringify({ accion: 'cotizar', correo, telefono, items }) });
      const d = await res.json().catch(() => null);
      if (clave !== cotClave) return;
      cot = res.ok && d && d.primera ? d : null;
    } catch (e) { cot = null; }
    actualizarResumen();
  }, 500);
}
function actualizarResumen() {
  const carrito = leerCarrito();
  const sub = carrito.reduce((s, i) => s + (Number(i.precio) || 0) * (Number(i.cantidad) || 0), 0);
  const desc = cot && cot.descuento > 0 ? Number(cot.descuento) : 0;
  const envio = tarifaElegida();
  $('pg-otra-caja').hidden = $('pg-ciudad').value !== 'Otro (nacional)';
  const r = $('pago-resumen'); r.replaceChildren();
  carrito.forEach((i) => { const f = nodo('div'); f.append(nodo('span', null, (i.cantidad || 1) + ' × ' + (i.nombre || 'Producto')), nodo('span', null, pesos((Number(i.precio) || 0) * (Number(i.cantidad) || 0)))); r.append(f); });
  const fila = (clase, t, v) => { const f = nodo('div', clase); f.append(nodo('span', null, t), nodo('span', null, v)); r.append(f); };
  fila('subtotal', 'Valor del pedido', pesos(sub));
  if (desc) fila('descuento', '🎁 Descuento aplicado por primera compra (' + cot.pct + '%)', '−' + pesos(desc));
  else if (!cotClave) fila('pista', '🎁 Primera compra: 10% de descuento', 'Escribe tu correo');
  fila('', 'Envío', envio == null ? 'Elige tu ciudad' : pesos(envio));
  fila('total', 'Valor total', envio == null ? pesos(sub - desc) + ' + envío' : pesos(sub - desc + envio));
}
function aviso(html) {
  const a = $('pago-aviso');
  a.replaceChildren();
  if (!html) { a.hidden = true; return; }
  a.append(html); a.hidden = false;
}
function avisoConWhatsApp(texto) {
  const f = document.createDocumentFragment();
  f.append(texto + ' ');
  const a = document.createElement('a'); a.href = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent('Hola Lana Rosa, quiero hacer un pedido y no pude pagar en línea.'); a.target = '_blank'; a.rel = 'noopener'; a.textContent = 'Escríbenos por WhatsApp';
  f.append(a, '.');
  return f;
}

async function abrirPago() {
  const carrito = leerCarrito();
  if (!carrito.length) return;
  if (!overlay) construirModal();
  aviso(null);
  const lista = await cargarTarifas();
  const sel = $('pg-ciudad'); sel.replaceChildren();
  const vacia = document.createElement('option'); vacia.value = ''; vacia.textContent = 'Selecciona tu ciudad'; sel.append(vacia);
  lista.forEach((t) => { const o = document.createElement('option'); o.value = t.ciudad; o.textContent = t.ciudad === 'Otro (nacional)' ? 'Otra ciudad de Colombia' : t.ciudad; sel.append(o); });
  overlay.hidden = false; document.body.style.overflow = 'hidden';
  $('pg-cuenta-caja').hidden = haySesionGuardada();
  actualizarResumen();
  const d = await datosCuenta();
  const poner = (id, v) => { if (v && !$(id).value) $(id).value = v; };
  poner('pg-nombre', d.nombre); poner('pg-correo', d.correo); poner('pg-telefono', d.telefono); poner('pg-direccion', d.direccion); poner('pg-notas', d.indicaciones);
  if (d.ciudad && !sel.value) {
    const hay = Array.from(sel.options).some((o) => o.value === d.ciudad);
    if (hay) sel.value = d.ciudad; else if (Array.from(sel.options).some((o) => o.value === 'Otro (nacional)')) { sel.value = 'Otro (nacional)'; poner('pg-otra', d.ciudad); }
    actualizarResumen();
  }
  cot = null; cotClave = ''; cotizarDescuento();
  $('pg-nombre').focus();
}

async function enviar(e) {
  e.preventDefault();
  const nombre = $('pg-nombre').value.trim(), correo = $('pg-correo').value.trim(), telefono = $('pg-telefono').value.trim();
  let ciudad = $('pg-ciudad').value; const otra = $('pg-otra').value.trim();
  let direccion = $('pg-direccion').value.trim(); const notas = $('pg-notas').value.trim();
  if (nombre.length < 2) return aviso('Escribe tu nombre.');
  if (telefono.replace(/\D/g, '').length < 10) return aviso('Escribe un WhatsApp de 10 dígitos.');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo)) return aviso('Escribe un correo válido.');
  if (!ciudad) return aviso('Elige tu ciudad de envío.');
  if (ciudad === 'Otro (nacional)') { if (otra.length < 2) return aviso('Escribe tu ciudad o municipio.'); direccion = otra + ' — ' + direccion; }
  if (direccion.length < 6) return aviso('Escribe tu dirección completa.');
  if (!$('pg-acepto').checked) return aviso('Para continuar, acepta la política de datos y de envíos.');
  aviso(null);
  const boton = $('pago-enviar'); boton.disabled = true; boton.textContent = 'Preparando tu pago…';
  try {
    const token = await tokenSesion();
    const headers = { 'Content-Type': 'application/json', apikey: SUPABASE_KEY };
    if (token) headers.Authorization = 'Bearer ' + token;
    const items = leerCarrito().map((i) => ({ id: i.id, cantidad: i.cantidad }));
    const res = await fetch(SUPABASE_URL + '/functions/v1/crear-pago-wompi', {
      method: 'POST', headers, body: JSON.stringify({ cliente: { nombre, correo, telefono, ciudad, direccion, notas }, items })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.url) {
      if (res.status === 503) aviso(avisoConWhatsApp('Los pagos en línea estarán listos muy pronto.'));
      else if (res.status === 409) aviso(avisoConWhatsApp((data.error || 'Algún producto ya no está disponible.') + ' Revisa tu carrito o'));
      else aviso(data.error ? document.createTextNode(data.error) : avisoConWhatsApp('No pudimos preparar tu pago.'));
      boton.disabled = false; boton.textContent = 'Ir a pagar con Wompi';
      return;
    }
    // Solo queda en este navegador: sirve para rellenar el formulario si después crea su cuenta (gracias.html).
    try { localStorage.setItem('lrPrefillCuenta', JSON.stringify({ nombre, correo, telefono, ciudad: ciudad === 'Otro (nacional)' ? otra : ciudad, crear: !haySesionGuardada() && $('pg-cuenta').checked })); } catch (e) {}
    window.location.href = data.url;
  } catch (err) {
    aviso(avisoConWhatsApp('No pudimos conectar con el pago.'));
    boton.disabled = false; boton.textContent = 'Ir a pagar con Wompi';
  }
}

// Modo de pruebas privado: abrir cualquier página con ?pagosprueba=1 muestra el botón solo en ese navegador
// (con ?pagosprueba=0 se quita). Sirve para probar con las llaves de pruebas sin que lo vea el público.
function modoPrueba() {
  try {
    const v = new URLSearchParams(location.search).get('pagosprueba');
    if (v === '1') localStorage.setItem('lrPagosPrueba', '1');
    if (v === '0') localStorage.removeItem('lrPagosPrueba');
    return localStorage.getItem('lrPagosPrueba') === '1';
  } catch (e) { return false; }
}

// El servidor dice en qué modo están los pagos según las llaves guardadas en Supabase:
// 'produccion' (llaves pub_prod_), 'pruebas' (pub_test_) o null (apagado / sin conexión).
async function modoPagos() {
  try {
    const res = await fetch(SUPABASE_URL + '/functions/v1/crear-pago-wompi', {
      method: 'POST', headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY }, body: JSON.stringify({ accion: 'estado' })
    });
    if (res.status === 503) return null; // el servidor dice: pagos apagados
    if (!res.ok) return 'produccion'; // error pasajero: se muestra el botón y el pago avisa si algo falla
    const d = await res.json();
    return d.modo === 'pruebas' ? 'pruebas' : 'produccion';
  } catch (e) { return 'produccion'; } // sin conexión al consultar: no se esconde el botón de pago
}

async function iniciar() {
  if (!PAGOS_ACTIVOS && !modoPrueba()) return;
  const wa = document.getElementById('boton-checkout-whatsapp');
  if (!wa || document.getElementById('boton-pagar-wompi')) return;
  // El público solo ve el botón con llaves de PRODUCCIÓN. Con llaves de pruebas solo lo ve quien abrió ?pagosprueba=1.
  const modo = await modoPagos();
  if (!modo || document.getElementById('boton-pagar-wompi')) return;
  if (modo === 'pruebas' && !modoPrueba()) return;
  const prueba = modo === 'pruebas';
  const b = nodo('button', 'boton-primario', prueba ? 'Continuar compra (PRUEBA)' : 'Continuar compra');
  b.type = 'button'; b.id = 'boton-pagar-wompi';
  b.style.cssText = 'text-align:center;border:none;cursor:pointer;width:100%;margin-bottom:8px;font:inherit;font-weight:700;';
  b.addEventListener('click', () => {
    const p = document.getElementById('panel-carrito'), o = document.getElementById('overlay-carrito');
    if (p) p.classList.remove('abierto'); if (o) o.classList.remove('abierto');
    abrirPago();
  });
  const nota = nodo('p', 'nota-pago-carrito', '🔒 Pago seguro con Wompi: tarjeta, PSE, Nequi y más.');
  if (!document.getElementById('estilo-pago-carrito')) { const st = document.createElement('style'); st.id = 'estilo-pago-carrito'; st.textContent = '.nota-pago-carrito{color:#6E6E73;font-size:.8rem;text-align:center;margin:0 0 10px}'; document.head.append(st); }
  wa.before(b, nota);
  wa.textContent = 'Pedir por WhatsApp';
  wa.style.cssText = 'display:block;box-sizing:border-box;width:100%;text-align:center;text-decoration:none;background:#fff;color:#E74E96;border:2px solid #E74E96;border-radius:999px;padding:12px 20px;font-weight:700;box-shadow:none;';
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
