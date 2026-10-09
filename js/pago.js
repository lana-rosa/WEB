// Pago en línea con Wompi desde el carrito. Se carga en todas las páginas con carrito.
// El navegador solo manda los ids y las cantidades; los precios y el envío los calcula la función
// "crear-pago-wompi" de Supabase con los datos del ERP. Las llaves de Wompi viven solo en Supabase.
import { haySesionGuardada, obtenerCliente } from './cuenta.js';

// El botón "Pagar en línea" está habilitado en el código, pero el servidor decide si se muestra:
// solo aparece para el público cuando las llaves guardadas en Supabase (Edge Functions → Secrets) son de
// PRODUCCIÓN (pub_prod_…). Con llaves de pruebas (pub_test_…) solo lo ve quien abre ?pagosprueba=1.
export const PAGOS_ACTIVOS = true;

// Materiales de la Mercería (lanas, hilos…): crear-pago-wompi (v30) los cobra por ovillo completo y solo los productos; a domicilio el envío
// lo paga la clienta a la transportadora al recibir (Términos de venta de la Mercería). Poner en false para volver a pedirlos solo por
// WhatsApp (el botón de Wompi se oculta en los carritos con materiales).
export const PAGO_EN_LINEA_MERCERIA = true;
const hayMateriales = () => leerCarrito().some((i) => i && i.merceria);
const hayOtros = () => leerCarrito().some((i) => i && !i.merceria);
const esMateriales = () => { const c = leerCarrito(); return c.length > 0 && c.every((i) => i && i.merceria); };
// Wompi no cobra materiales mezclados con productos de la Tienda (o con patrones), ni materiales si el pago en línea está apagado.
const soloWhatsApp = () => hayMateriales() && (hayOtros() || !PAGO_EN_LINEA_MERCERIA);

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
.pago-overlay { position: fixed; inset: 0; z-index: 3000; background: #FDFCFA; overflow-y: auto; -webkit-overflow-scrolling: touch; color: #45454A; }
.pago-overlay[hidden] { display: none; }
.pg-cab { position: relative; background: #fff; border-bottom: 1px solid rgba(69,69,74,0.12); display: flex; align-items: center; justify-content: center; min-height: 62px; }
.pg-cab img { height: 42px; width: auto; border-radius: 8px; display: block; }
.pg-volver { position: absolute; left: max(14px, calc(50% - 590px)); top: 50%; transform: translateY(-50%); background: none; border: none; font-size: 1.6rem; line-height: 1; cursor: pointer; color: #45454A; padding: 6px 10px; }
.pg-cont { max-width: 1180px; margin: 0 auto; padding: 18px 16px 40px; }
.pg-pasos { display: flex; align-items: flex-start; margin: 4px 0 22px; position: relative; }
.pg-paso { flex: 1; background: none; border: none; font: inherit; display: flex; flex-direction: column; align-items: center; gap: 6px; cursor: default; color: #9a9aa0; font-size: 0.8rem; position: relative; padding: 0; }
.pg-paso::before { content: ''; position: absolute; top: 15px; left: -50%; width: 100%; height: 2px; background: #dcdce0; z-index: 0; }
.pg-paso:first-child::before { display: none; }
.pg-paso .pg-num { width: 30px; height: 30px; border-radius: 50%; border: 2px solid #dcdce0; background: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.85rem; position: relative; z-index: 1; }
.pg-paso.hecho, .pg-paso.activo { color: #45454A; }
.pg-paso.hecho::before, .pg-paso.activo::before { background: #E74E96; }
.pg-paso.activo .pg-num { border-color: #E74E96; color: #E74E96; }
.pg-paso.hecho .pg-num { background: #E74E96; border-color: #E74E96; color: #fff; }
.pg-paso.hecho { cursor: pointer; }
.pg-grid { display: grid; grid-template-columns: 1fr; gap: 18px; align-items: start; }
@media (min-width: 880px) { .pg-grid { grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr); gap: 26px; } .pg-grid > form { order: 1; } .pg-grid > .pg-resumen-movil { order: 2; } }
.pg-tarjeta { background: #fff; border: 1px solid rgba(69,69,74,0.1); border-radius: 16px; overflow: hidden; }
.pg-tarjeta > header, .pg-sec > header { display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; border-bottom: 1px solid rgba(69,69,74,0.1); font-weight: 700; font-size: 0.85rem; letter-spacing: 0.06em; text-transform: uppercase; background: #FBF7F8; }
.pg-atras { background: none; border: none; font: inherit; font-size: 0.85rem; text-transform: none; letter-spacing: 0; color: #45454A; text-decoration: underline; cursor: pointer; padding: 0; }
.pg-cuerpo { padding: 18px 20px 20px; }
.pg-sec[hidden] { display: none; }
.pg-badge { background: #E74E96; color: #fff; border-radius: 999px; padding: 3px 11px; font-size: 0.72rem; font-weight: 700; letter-spacing: 0; text-transform: none; }
.pg-item { display: flex; gap: 12px; padding: 14px 20px; border-bottom: 1px solid rgba(69,69,74,0.08); }
.pg-foto { flex: 0 0 auto; width: 72px; height: 72px; border-radius: 12px; background: #FBE4EF; overflow: hidden; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }
.pg-foto img { width: 100%; height: 100%; object-fit: cover; }
.pg-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; font-size: 0.92rem; }
.pg-info strong { line-height: 1.25; }
.pg-info .pg-quitar { align-self: flex-start; background: none; border: none; font: inherit; font-size: 0.82rem; color: #6E6E73; text-decoration: underline; cursor: pointer; padding: 0; }
.pg-precio { font-weight: 700; white-space: nowrap; }
.pg-cant { display: inline-flex; align-items: center; border: 1.5px solid rgba(69,69,74,0.2); border-radius: 10px; overflow: hidden; align-self: flex-start; }
.pg-cant button { width: 30px; height: 30px; border: none; background: #fff; font-size: 1.05rem; cursor: pointer; color: #E74E96; font-weight: 700; }
.pg-cant button:disabled { opacity: .35; cursor: default; }
.pg-cant span { min-width: 30px; text-align: center; font-weight: 700; font-size: 0.9rem; }
.pg-totales { padding: 14px 20px 6px; font-size: 0.92rem; }
.pg-totales div { display: flex; justify-content: space-between; gap: 10px; padding: 4px 0; }
.pg-totales div span:last-child { white-space: nowrap; text-align: right; }
.pg-totales .total { font-weight: 800; font-size: 1.02rem; border-top: 1px solid rgba(69,69,74,0.12); margin-top: 6px; padding-top: 10px; }
.pg-totales .descuento { color: #B83E78; font-weight: 700; }
.pg-totales .pista { color: #6E6E73; font-size: 0.82rem; }
.pg-confianza { margin: 14px 20px 20px; border: 1px solid rgba(69,69,74,0.12); border-radius: 12px; padding: 12px 14px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 0.8rem; background: #F4F9FE; }
.pg-confianza div { display: flex; gap: 8px; align-items: flex-start; }
.pg-confianza b { display: block; font-size: 0.82rem; }
.pg-confianza small { color: #6E6E73; }
@media (max-width: 480px) { .pg-confianza { grid-template-columns: 1fr; } }
.pg-resumen-movil > summary { list-style: none; cursor: pointer; background: #fff; border: 1px solid rgba(69,69,74,0.12); border-radius: 14px; padding: 13px 16px; font-weight: 700; display: flex; justify-content: space-between; gap: 10px; }
.pg-resumen-movil > summary::-webkit-details-marker { display: none; }
.pg-resumen-movil[open] > summary { border-radius: 14px 14px 0 0; border-bottom: none; }
@media (min-width: 880px) { .pg-resumen-movil > summary { display: none; } }
@media (max-width: 879px) { .pg-resumen-movil[open] .pg-tarjeta { border-radius: 0 0 16px 16px; border-top: none; } }
.pago-opcion { display: flex; gap: 12px; align-items: flex-start; border: 1.5px solid rgba(69,69,74,0.18); border-radius: 12px; padding: 13px 14px; cursor: pointer; margin-bottom: 10px; background: #fff; }
.pago-opcion[hidden] { display: none; }
.pago-opcion:has(input:checked) { background: #FBE4EF; border-color: #E74E96; }
.pago-opcion input { margin-top: 3px; accent-color: #E74E96; width: 18px; height: 18px; flex-shrink: 0; }
.pago-opcion > span { flex: 1; display: block; }
.pago-opcion small { display: block; color: #6E6E73; font-size: 0.82rem; margin-top: 2px; }
.pago-opcion .pg-valor { float: right; font-weight: 700; margin-left: 10px; white-space: nowrap; }
.pago-campo { display: flex; flex-direction: column; gap: 5px; margin-bottom: 13px; }
.pago-campo[hidden] { display: none; }
.pago-campo label { font-weight: 700; font-size: 0.86rem; }
.pago-campo input, .pago-campo select, .pago-campo textarea { font: inherit; padding: 11px 12px; border-radius: 10px; border: 1.5px solid rgba(69,69,74,0.2); background: #fff; color: #45454A; width: 100%; box-sizing: border-box; }
.pago-campo input:focus, .pago-campo select:focus, .pago-campo textarea:focus { outline: none; border-color: #E74E96; }
.pago-campo textarea { min-height: 64px; resize: vertical; }
.pago-fila { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
@media (max-width: 480px) { .pago-fila { grid-template-columns: 1fr; gap: 0; } }
.pago-acepto { display: flex; gap: 10px; align-items: flex-start; font-size: 0.86rem; margin: 4px 0 12px; }
.pago-acepto[hidden] { display: none; }
.pago-acepto input { margin-top: 3px; accent-color: #E74E96; width: 18px; height: 18px; flex-shrink: 0; }
.pg-btn { width: 100%; font: inherit; font-weight: 700; padding: 14px; border-radius: 999px; border: none; background: #E74E96; color: #fff; cursor: pointer; margin-top: 6px; }
.pg-btn:hover { background: #B83E78; }
.pg-btn:disabled { opacity: 0.6; cursor: wait; }
.pg-enlace { background: none; border: none; font: inherit; font-size: 0.86rem; color: #E74E96; text-decoration: underline; cursor: pointer; padding: 4px 0; margin: 2px 0 10px; font-weight: 600; }
.pago-aviso { margin: 12px 0 0; padding: 11px 14px; border-radius: 12px; background: #fdecea; color: #a12a20; font-weight: 600; font-size: 0.9rem; }
.pago-aviso[hidden] { display: none; }
.pago-aviso a { color: inherit; }
.pago-nota { color: #6E6E73; font-size: 0.82rem; margin: 12px 0 0; text-align: center; }
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

let overlay = null, pasoActual = 1, pasoMaximo = 1, carritoCambiado = false;
const PASOS = ['Contacto', 'Direcciones', 'Envío', 'Pago'];
function construirModal() {
  const st = document.createElement('style'); st.textContent = CSS; document.head.append(st);
  overlay = nodo('div', 'pago-overlay'); overlay.hidden = true;
  overlay.setAttribute('role', 'dialog'); overlay.setAttribute('aria-modal', 'true'); overlay.setAttribute('aria-label', 'Continuar compra');
  overlay.innerHTML =
    '<div class="pg-cab"><button type="button" class="pg-volver" aria-label="Volver a la tienda" title="Volver">&#8249;</button><img src="/img/logo-lana-rosa.jpg" alt="Lana Rosa Crochet"></div>' +
    '<div class="pg-cont">' +
      '<div class="pg-pasos" id="pg-pasos"></div>' +
      '<div class="pg-grid">' +
        '<details class="pg-resumen-movil" id="pg-resumen-movil"><summary><span id="pg-resumen-titulo">Mi carrito</span><span id="pg-resumen-total"></span></summary>' +
          '<div class="pg-tarjeta"><header>Mi carrito <span class="pg-badge" id="pg-badge"></span></header><div id="pg-items"></div><div class="pg-totales" id="pago-resumen"></div>' +
          '<div class="pg-confianza">' +
            '<div><span>🔒</span><span><b>Pago seguro</b><small>Pagas en el sitio seguro de Wompi</small></span></div>' +
            '<div><span>💗</span><span><b>Hecho a mano en Colombia</b><small>Cada pieza, tejida con amor</small></span></div>' +
            '<div><span>🚚</span><span><b>Envíos a toda Colombia</b><small>Entregas a nivel nacional</small></span></div>' +
          '</div></div></details>' +
        '<form id="pago-form" novalidate class="pg-tarjeta">' +
          '<section class="pg-sec" data-paso="1"><header>Contacto</header><div class="pg-cuerpo">' +
            '<div class="pago-campo"><label for="pg-correo">Correo electrónico*</label><input id="pg-correo" type="email" autocomplete="email" maxlength="120"></div>' +
            '<p class="nota-pago-carrito" style="margin:-6px 0 10px;text-align:left">Si no terminas tu compra, te escribiremos un recordatorio a este correo. Puedes darte de baja desde el mismo correo.</p>' +
            '<div class="pago-fila">' +
              '<div class="pago-campo"><label for="pg-nombre">Tu nombre*</label><input id="pg-nombre" autocomplete="name" maxlength="120"></div>' +
              '<div class="pago-campo"><label for="pg-telefono">WhatsApp*</label><input id="pg-telefono" type="tel" autocomplete="tel" maxlength="20" placeholder="Ej: 3001234567"></div>' +
            '</div>' +
            '<button type="button" class="pg-btn" data-ir="2">Continuar →</button>' +
            '<p class="pago-aviso" role="alert" hidden></p>' +
          '</div></section>' +
          '<section class="pg-sec" data-paso="2" hidden><header>Direcciones <button type="button" class="pg-atras" data-ir="1">← Atrás</button></header><div class="pg-cuerpo">' +
            '<div class="pago-campo" id="pg-pais-caja" hidden><label for="pg-pais">País de envío*</label><select id="pg-pais"><option value="Colombia">Colombia</option></select></div>' +
            '<div class="pago-campo" id="pg-ciudad-caja"><label for="pg-ciudad">Ciudad de envío*</label><select id="pg-ciudad"></select></div>' +
            '<div class="pago-campo" id="pg-ciudad-intl-caja" hidden><label for="pg-ciudad-intl">Ciudad y estado o provincia*</label><input id="pg-ciudad-intl" maxlength="80" autocomplete="address-level2"></div>' +
            '<div class="pago-campo" id="pg-otra-caja" hidden><label for="pg-otra">¿Cuál ciudad o municipio?*</label><input id="pg-otra" maxlength="60" autocomplete="address-level2"></div>' +
            '<div class="pago-campo"><label for="pg-direccion">Dirección*</label><input id="pg-direccion" autocomplete="street-address" maxlength="200" placeholder="Calle, número, barrio"></div>' +
            '<div class="pago-campo"><label for="pg-notas">Indicaciones o notas (opcional)</label><textarea id="pg-notas" maxlength="400" placeholder="Ej: portería, apartamento, mensaje para la tarjeta"></textarea></div>' +
            '<button type="button" class="pg-enlace" id="pg-ir-recoger">¿Prefieres recoger en tienda? Saltar la dirección</button>' +
            '<button type="button" class="pg-btn" data-ir="3">Continuar →</button>' +
            '<p class="pago-aviso" role="alert" hidden></p>' +
          '</div></section>' +
          '<section class="pg-sec" data-paso="3" hidden><header>Envío <button type="button" class="pg-atras" data-ir="2">← Atrás</button></header><div class="pg-cuerpo">' +
            '<div role="radiogroup" aria-label="¿Cómo quieres recibir tu pedido?">' +
              '<label class="pago-opcion" id="pg-opc-dom"><input type="radio" name="pg-entrega" value="domicilio" checked><span><span class="pg-valor" id="pg-env-valor"></span><strong>Envío a domicilio</strong><small id="pg-env-detalle">Lo llevamos a tu dirección.</small></span></label>' +
              '<label class="pago-opcion" id="pg-opc-rec"><input type="radio" name="pg-entrega" value="recogida"><span><span class="pg-valor">Gratis</span><strong>Recoger en tienda</strong><small>Te escribimos por WhatsApp para acordar cuándo y dónde recogerlo.</small></span></label>' +
            '</div>' +
            '<div class="pago-opcion" id="pg-opc-intl" hidden style="cursor:default;background:#FBE4EF;border-color:#E74E96;"><span><span class="pg-valor" id="pg-intl-valor"></span><strong>Envío internacional</strong><small id="pg-intl-detalle">Lo enviamos a tu dirección.</small></span></div>' +
            '<button type="button" class="pg-btn" data-ir="4">Continuar →</button>' +
            '<p class="pago-aviso" role="alert" hidden></p>' +
          '</div></section>' +
          '<section class="pg-sec" data-paso="4" hidden><header>Método de pago <button type="button" class="pg-atras" data-ir="3">← Atrás</button></header><div class="pg-cuerpo">' +
            '<label class="pago-opcion" id="pg-met-wompi"><input type="radio" name="pg-metodo" value="wompi" checked><span><strong>Wompi</strong><small>Tarjeta crédito o débito, PSE, Nequi, Bancolombia y más. Pagas en el sitio seguro de Wompi.</small></span></label>' +
            '<label class="pago-opcion" id="pg-met-paypal" hidden><input type="radio" name="pg-metodo" value="paypal"><span><strong>PayPal</strong><small>Pagas en dólares (US$) con tu cuenta de PayPal o con tarjeta, en el sitio seguro de PayPal. Para pedidos fuera de Colombia.</small></span></label>' +
            '<label class="pago-acepto"><input type="checkbox" id="pg-acepto"><span>Acepto la <a href="/politicas.html#datos" target="_blank" rel="noopener">política de tratamiento de datos</a> y la <a href="/politicas.html" target="_blank" rel="noopener">política de envíos y cambios</a>.</span></label>' +
            '<label class="pago-acepto" id="pg-confirma-caja"><input type="checkbox" id="pg-confirma"><span id="pg-confirma-texto">Confirmo que mi dirección de envío es correcta y, en caso de errores, asumiré los posibles costos de transporte adicionales.</span></label>' +
            '<label class="pago-acepto" id="pg-cuenta-caja"><input type="checkbox" id="pg-cuenta" checked><span>Crear mi cuenta con este correo para ver el estado de mi pedido. Sin contraseña: te enviamos un correo para activarla cuando pagues.</span></label>' +
            '<label class="pago-acepto" id="pg-promos-caja"><input type="checkbox" id="pg-promos"><span>Quiero recibir información de Lana Rosa: promociones, nuevos productos y novedades. Puedes darte de baja cuando quieras.</span></label>' +
            '<p class="pago-aviso" id="pago-aviso" role="alert" hidden></p>' +
            '<button type="submit" class="pg-btn" id="pago-enviar">Completar mi pedido →</button>' +
            '<p class="pago-nota">🔒 Nosotras no guardamos los datos de tu tarjeta.</p>' +
          '</div></section>' +
        '</form>' +
      '</div>' +
    '</div>';
  document.body.append(overlay);
  overlay.querySelector('.pg-volver').addEventListener('click', cerrar);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !overlay.hidden) cerrar(); });
  overlay.querySelectorAll('[data-ir]').forEach((b) => b.addEventListener('click', () => irAPaso(Number(b.dataset.ir))));
  overlay.querySelector('#pg-ir-recoger').addEventListener('click', () => { overlay.querySelector('input[name="pg-entrega"][value="recogida"]').checked = true; actualizarResumen(); cotClave = ''; cotizarDescuento(); irAPaso(4, true); });
  overlay.querySelector('#pg-ciudad').addEventListener('change', actualizarResumen);
  overlay.querySelector('#pg-direccion').addEventListener('input', actualizarResumen);
  overlay.querySelector('#pg-pais').addEventListener('change', () => { actualizarResumen(); cotClave = ''; cotizarDescuento(); });
  overlay.querySelector('#pg-ciudad-intl').addEventListener('input', actualizarResumen);
  overlay.querySelector('#pg-otra').addEventListener('input', () => {
    const c = ciudadConocida($('pg-otra').value);
    if (c) { $('pg-ciudad').value = c; $('pg-otra').value = ''; actualizarResumen(); $('pg-direccion').focus(); } else actualizarResumen();
  });
  overlay.querySelectorAll('input[name="pg-metodo"]').forEach((r) => r.addEventListener('change', actualizarResumen));
  overlay.querySelectorAll('input[name="pg-entrega"]').forEach((r) => r.addEventListener('change', () => { actualizarResumen(); cotClave = ''; cotizarDescuento(); }));
  ['pg-correo', 'pg-telefono'].forEach((id) => { const c = overlay.querySelector('#' + id); if (id === 'pg-correo') c.addEventListener('change', guardarCarritoAbandonado); c.addEventListener('input', cotizarDescuento); c.addEventListener('change', cotizarDescuento); });
  overlay.querySelector('#pago-form').addEventListener('submit', enviar);
  const mq = window.matchMedia('(min-width: 880px)');
  const ajustar = () => { overlay.querySelector('#pg-resumen-movil').open = mq.matches; };
  ajustar(); (mq.addEventListener ? mq.addEventListener('change', ajustar) : mq.addListener(ajustar));
}
function cerrar() {
  if (overlay) overlay.hidden = true;
  document.body.style.overflow = '';
  if (carritoCambiado) { carritoCambiado = false; location.reload(); }
}
const $ = (id) => overlay.querySelector('#' + id);
// Patrones digitales (los marca la Mercería con digital: true en el carrito): sin dirección ni envío. El servidor lo vuelve a comprobar.
const esDigital = () => { const c = leerCarrito(); return c.length > 0 && c.every((i) => i.digital); };

// ----- Pasos: Contacto → Direcciones → Envío → Pago -----
function pintarPasos() {
  const cont = $('pg-pasos'); cont.replaceChildren();
  const dig = esDigital();
  PASOS.forEach((t, i) => {
    const n = i + 1;
    if (dig && (n === 2 || n === 3)) return;
    const mostrado = dig && n === 4 ? 2 : n;
    const b = nodo('button', 'pg-paso' + (n < pasoActual ? ' hecho' : n === pasoActual ? ' activo' : '')); b.type = 'button';
    b.append(nodo('span', 'pg-num', n < pasoActual ? '✓' : String(mostrado)), nodo('span', null, t));
    if (n < pasoActual) b.addEventListener('click', () => irAPaso(n));
    cont.append(b);
  });
  overlay.querySelectorAll('.pg-sec').forEach((sec) => { sec.hidden = Number(sec.dataset.paso) !== pasoActual; });
}
function validarPaso(n) {
  if (esDigital() && (n === 2 || n === 3)) return '';
  if (n === 1) {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test($('pg-correo').value.trim())) return 'Escribe un correo válido.';
    if ($('pg-nombre').value.trim().length < 2) return 'Escribe tu nombre.';
    if ($('pg-telefono').value.replace(/\D/g, '').length < 10) return 'Escribe un WhatsApp de 10 dígitos.';
  }
  if (n === 2 && esIntl()) {
    if (!zonaPais()) return 'Elige tu país de envío.';
    if ($('pg-ciudad-intl').value.trim().length < 2) return 'Escribe tu ciudad y estado o provincia.';
    if ($('pg-direccion').value.trim().length < 6) return 'Escribe tu dirección completa.';
  } else if (n === 2 && entregaElegida() !== 'recogida') {
    if (!$('pg-ciudad').value) return 'Elige tu ciudad de envío.';
    if ($('pg-ciudad').value === 'Otro (nacional)' && $('pg-otra').value.trim().length < 2) return 'Escribe tu ciudad o municipio.';
    if ($('pg-direccion').value.trim().length < 6) return 'Escribe tu dirección completa.';
  }
  return '';
}
function avisoPaso(n, msg) {
  const sec = overlay.querySelector('.pg-sec[data-paso="' + n + '"]'); const a = sec && sec.querySelector('.pago-aviso');
  if (!a) return;
  a.replaceChildren(); if (msg) { a.append(msg); a.hidden = false; } else a.hidden = true;
}
// Carrito abandonado: al escribir el correo se guarda el carrito para poder mandar un recordatorio (a las 3 y a las 24 horas, sin descuento).
async function guardarCarritoAbandonado() {
  try {
    if (modoPrueba()) return;
    const correo = ($('pg-correo') ? $('pg-correo').value : '').trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo)) return;
    const items = leerCarrito().map((i) => ({ id: i.id, nombre: i.nombre, precio: i.precio, cantidad: i.cantidad }));
    if (!items.length) return;
    await fetch(SUPABASE_URL + '/rest/v1/rpc/registrar_carrito_abandonado', {
      method: 'POST', headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY }, keepalive: true,
      body: JSON.stringify({ p_correo: correo, p_nombre: ($('pg-nombre') ? $('pg-nombre').value : '').trim(), p_items: items })
    });
  } catch (e) {}
}
// Enlace del correo (?retomar=...): vuelve a cargar el carrito y lo abre.
async function retomarCarrito() {
  try {
    const t = new URLSearchParams(location.search).get('retomar');
    if (!t || !/^[0-9a-f-]{36}$/i.test(t)) return;
    const r = await fetch(SUPABASE_URL + '/rest/v1/rpc/obtener_carrito_abandonado', {
      method: 'POST', headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY }, body: JSON.stringify({ p_token: t })
    });
    const items = r.ok ? await r.json() : [];
    const u = new URL(location.href); u.searchParams.delete('retomar'); history.replaceState(null, '', u.pathname + u.search + u.hash);
    if (!Array.isArray(items) || !items.length) return;
    const actual = leerCarrito();
    items.forEach((it) => { if (!actual.some((x) => String(x.id) === String(it.id))) actual.push({ id: it.id, nombre: it.nombre, precio: Number(it.precio) || 0, cantidad: Number(it.cantidad) || 1 }); });
    localStorage.setItem(CLAVE_CARRITO, JSON.stringify(actual));
    const ct = document.getElementById('contador-carrito'); if (ct) ct.textContent = actual.reduce((n, x) => n + (Number(x.cantidad) || 0), 0);
    const abrir = document.querySelector('.boton-carrito-header'); if (abrir) abrir.click();
  } catch (e) {}
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', retomarCarrito); else retomarCarrito();
function irAPaso(destino, saltarDireccion) {
  if (esDigital() && (destino === 2 || destino === 3)) destino = destino > pasoActual ? 4 : 1;
  if (destino > pasoActual) {
    for (let n = pasoActual; n < destino; n++) {
      if (saltarDireccion && n === 2) continue;
      const m = validarPaso(n);
      if (m) { pasoActual = n; pintarPasos(); avisoPaso(n, m); return; }
    }
  }
  pasoActual = destino; pasoMaximo = Math.max(pasoMaximo, destino);
  if (destino > 1) guardarCarritoAbandonado();
  overlay.querySelectorAll('.pago-aviso').forEach((a) => { a.hidden = true; });
  pintarPasos(); actualizarResumen();
  overlay.scrollTo({ top: 0, behavior: 'smooth' });
}
// PayPal (pedidos fuera de Colombia): el servidor dice si está activo, la tasa USD→COP y el envío por zona.
let pp = null;
async function cargarPaypal() {
  try {
    const r = await fetch(SUPABASE_URL + '/functions/v1/paypal-pagos', { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY }, body: JSON.stringify({ accion: 'estado' }) });
    const d = await r.json();
    pp = r.ok && d && d.activo && (d.modo === 'live' || modoPrueba()) ? d : null;
  } catch (e) { pp = null; }
}
const esIntl = () => !!pp && ($('pg-pais').value || 'Colombia') !== 'Colombia';
const zonaPais = () => { if (!pp) return null; const f = pp.paises.find((x) => x.pais === $('pg-pais').value); return f ? pp.zonas.find((z) => z.zona === f.zona) || null : null; };
const entregaElegida = () => esIntl() ? 'internacional' : ((overlay.querySelector('input[name="pg-entrega"]:checked') || {}).value || 'domicilio');
// Compara ciudades sin tildes ni mayúsculas ("Villamaria", "villamaría, Caldas" → Villamaría) para aplicar la tarifa correcta.
const normCiudad = (t) => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\bcaldas\b/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
function ciudadConocida(texto) {
  const n = normCiudad(texto); if (!n) return '';
  const t = (tarifas || []).find((x) => x.ciudad !== 'Otro (nacional)' && normCiudad(x.ciudad) === n);
  return t ? t.ciudad : '';
}
// PayPal solo para direcciones fuera de Colombia: PayPal no permite pagos entre dos cuentas colombianas, así que Colombia paga con Wompi.
const metodoElegido = () => esIntl() ? 'paypal' : 'wompi';
const textoBoton = () => (metodoElegido() === 'paypal' ? 'Pagar con PayPal →' : 'Completar mi pedido →');
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
      const res = await fetch(SUPABASE_URL + '/functions/v1/crear-pago-wompi', { method: 'POST', headers, body: JSON.stringify({ accion: 'cotizar', correo, telefono, entrega: entregaElegida(), items }) });
      const d = await res.json().catch(() => null);
      if (clave !== cotClave) return;
      cot = res.ok && d && d.primera ? d : null;
    } catch (e) { cot = null; }
    actualizarResumen();
  }, 500);
}
function fotoProducto(id) {
  let mapa = {}; try { mapa = JSON.parse(localStorage.getItem('lrFotosCarrito')) || {}; } catch (e) {}
  const img = document.querySelector('img[data-id="' + id + '"]');
  if (img && img.currentSrc) { mapa[id] = img.currentSrc; try { localStorage.setItem('lrFotosCarrito', JSON.stringify(mapa)); } catch (e) {} }
  return mapa[id] || '';
}
function cambiarCantidad(i, d) {
  const c = leerCarrito();
  if (!c[i]) return;
  c[i].cantidad = Math.max(1, Math.min(20, (Number(c[i].cantidad) || 1) + d));
  guardarCarrito(c);
}
function quitarProducto(i) {
  const c = leerCarrito(); c.splice(i, 1); guardarCarrito(c);
  if (!c.length) {
    carritoCambiado = true;
    const cont = overlay.querySelector('.pg-cont'); cont.replaceChildren();
    cont.append(nodo('p', null, 'No hay más artículos en tu carrito.'));
    const b = nodo('button', 'pg-enlace', '‹ Continuar comprando'); b.type = 'button'; b.addEventListener('click', cerrar);
    cont.append(b);
  }
}
function guardarCarrito(c) {
  try { localStorage.setItem(CLAVE_CARRITO, JSON.stringify(c)); } catch (e) {}
  carritoCambiado = true;
  const ct = document.getElementById('contador-carrito'); if (ct) ct.textContent = c.reduce((s, x) => s + (Number(x.cantidad) || 0), 0);
  cotClave = ''; cotizarDescuento(); actualizarResumen();
}
function actualizarResumen() {
  const carrito = leerCarrito();
  const sub = carrito.reduce((s, i) => s + (Number(i.precio) || 0) * (Number(i.cantidad) || 0), 0);
  const desc = cot && cot.descuento > 0 ? Number(cot.descuento) : 0;
  const materiales = esMateriales();   // materiales de la Mercería: solo Colombia y el envío se paga al recibir
  if (materiales && pp && $('pg-pais').value !== 'Colombia') $('pg-pais').value = 'Colombia';
  const intl = esIntl();
  const digital = esDigital();
  const recoge = digital || entregaElegida() === 'recogida';
  $('pg-pais-caja').hidden = !pp || materiales;
  $('pg-ciudad-caja').hidden = intl; $('pg-ciudad-intl-caja').hidden = !intl;
  $('pg-otra-caja').hidden = intl || $('pg-ciudad').value !== 'Otro (nacional)';
  $('pg-ir-recoger').hidden = intl;
  $('pg-opc-dom').hidden = intl; $('pg-opc-rec').hidden = intl; $('pg-opc-intl').hidden = !intl;
  // Método de pago: Colombia solo Wompi; otros países solo PayPal.
  $('pg-met-wompi').hidden = intl; $('pg-met-paypal').hidden = !intl;
  overlay.querySelector('input[name="pg-metodo"][value="' + (intl ? 'paypal' : 'wompi') + '"]').checked = true;
  const conPaypal = metodoElegido() === 'paypal';
  $('pago-enviar').textContent = textoBoton();
  // El envío se muestra cuando ya hay ciudad y dirección (o $0 si recoge en tienda).
  const hayDireccion = $('pg-direccion').value.trim().length >= 6 && (intl ? $('pg-ciudad-intl').value.trim().length >= 2 : (($('pg-ciudad').value !== 'Otro (nacional)') || $('pg-otra').value.trim().length >= 2));
  const zona = intl ? zonaPais() : null;
  const envio = intl ? (hayDireccion && zona ? Math.round(zona.valor_usd * pp.tasa) : null) : (recoge ? 0 : (hayDireccion ? tarifaElegida() : null));
  const alRecibir = materiales && !recoge && !intl;                   // el envío NO se cobra en línea
  const estimado = alRecibir && hayDireccion ? tarifaElegida() : null;  // solo se muestra como referencia
  const textoAlRecibir = 'Lo pagas a la transportadora al recibir' + (estimado != null ? ' (aprox. ' + pesos(estimado) + ')' : '');

  // Productos
  const items = $('pg-items'); items.replaceChildren();
  let unidades = 0;
  carrito.forEach((it, idx) => {
    unidades += Number(it.cantidad) || 0;
    const fila = nodo('div', 'pg-item');
    const foto = nodo('div', 'pg-foto'); const src = fotoProducto(it.id);
    if (src) { const im = document.createElement('img'); im.src = src; im.alt = ''; im.addEventListener('error', () => { im.remove(); foto.textContent = '🧶'; }); foto.append(im); } else foto.textContent = '🧶';
    const info = nodo('div', 'pg-info');
    info.append(nodo('strong', null, it.nombre || 'Producto'));
    const cant = nodo('div', 'pg-cant');
    const menos = nodo('button', null, '−'); menos.type = 'button'; menos.disabled = (Number(it.cantidad) || 1) <= 1; menos.setAttribute('aria-label', 'Una menos');
    const mas = nodo('button', null, '+'); mas.type = 'button'; mas.setAttribute('aria-label', 'Una más');
    menos.addEventListener('click', () => cambiarCantidad(idx, -1)); mas.addEventListener('click', () => cambiarCantidad(idx, 1));
    cant.append(menos, nodo('span', null, String(it.cantidad || 1)), mas);
    const quitar = nodo('button', 'pg-quitar', 'Eliminar'); quitar.type = 'button'; quitar.addEventListener('click', () => quitarProducto(idx));
    info.append(cant, quitar);
    fila.append(foto, info, nodo('span', 'pg-precio', pesos((Number(it.precio) || 0) * (Number(it.cantidad) || 0))));
    items.append(fila);
  });
  $('pg-badge').textContent = unidades + (unidades === 1 ? ' producto' : ' productos');

  // Totales
  const r = $('pago-resumen'); r.replaceChildren();
  const fila = (clase, t, v) => { const f = nodo('div', clase); f.append(nodo('span', null, t), nodo('span', null, v)); r.append(f); };
  fila('subtotal', 'Valor del pedido', pesos(sub));
  if (desc) fila('descuento', '🎁 Descuento aplicado por primera compra (' + cot.pct + '%)', '−' + pesos(desc));
  else if (!cotClave && !digital) fila('pista', '🎁 Primera compra: 10% de descuento', 'Escribe tu correo');
  const textoEnvio = alRecibir ? textoAlRecibir : digital ? 'Sin envío (descarga digital)' : recoge ? 'Gratis (recoges en tienda)' : (envio == null ? (hayDireccion ? 'Elige tu ciudad' : 'Se calcula con tu dirección') : pesos(envio) + (intl && zona ? ' (US$ ' + Number(zona.valor_usd).toFixed(2) + ')' : ''));
  fila('', digital ? 'Entrega' : (recoge ? 'Recoger en tienda' : 'Envío'), textoEnvio);
  const total = alRecibir ? pesos(sub - desc) : (envio == null ? pesos(sub - desc) + ' + envío' : pesos(sub - desc + envio));
  fila('total', alRecibir ? 'Pagas ahora en línea' : 'Valor total', total + (conPaypal ? ' COP' : ''));
  if (conPaypal && envio != null) fila('pista', 'Se cobra en dólares con PayPal', 'US$ ' + (Math.round(((sub - desc + envio) / pp.tasa) * 100) / 100).toFixed(2));
  $('pg-resumen-titulo').textContent = 'Mi carrito (' + unidades + ')';
  $('pg-resumen-total').textContent = total;

  // Paso 3: envío internacional
  if (intl) {
    $('pg-intl-valor').textContent = zona ? 'US$ ' + Number(zona.valor_usd).toFixed(2) : '';
    const pa = $('pg-pais').value, ci = $('pg-ciudad-intl').value.trim(), di = $('pg-direccion').value.trim();
    $('pg-intl-detalle').textContent = (zona ? zona.etiqueta + '. ' : '') + (di ? 'Lo enviamos a: ' + di + (ci ? ', ' + ci : '') + ', ' + pa + '.' : 'Lo enviamos a tu dirección.');
  }
  // Paso 3: valor del envío a domicilio
  $('pg-env-valor').textContent = envio == null || recoge ? (hayDireccion ? '' : '') : pesos(envio);
  if (!recoge || envio === 0) {
    const ev = $('pg-env-valor'); const t = tarifaElegida();
    ev.textContent = hayDireccion && t != null ? pesos(t) : 'Según tu dirección';
  }
  const dir = $('pg-direccion').value.trim(), ciu = $('pg-ciudad').value === 'Otro (nacional)' ? $('pg-otra').value.trim() : $('pg-ciudad').value;
  $('pg-env-detalle').textContent = (dir ? 'Lo llevamos a: ' + dir + (ciu ? ', ' + ciu : '') + '.' : 'Lo llevamos a tu dirección.') + (alRecibir ? ' ' + textoAlRecibir + '.' : '');
  if (alRecibir) $('pg-env-valor').textContent = 'Al recibir';
  { // Aceptación: con materiales de la Mercería se enlazan sus términos de venta y su política de cambios.
    const sp = $('pg-acepto').parentNode.querySelector('span');
    if (sp) {
      if (sp.dataset.base === undefined) sp.dataset.base = sp.innerHTML;
      sp.innerHTML = materiales
        ? 'Acepto la <a href="/politicas.html#datos" target="_blank" rel="noopener">política de tratamiento de datos</a>, los <a href="/merceria/terminos-de-venta/" target="_blank" rel="noopener">términos de venta de la Mercería</a> y su <a href="/merceria/cambios-y-devoluciones/" target="_blank" rel="noopener">política de cambios, devoluciones y garantías</a>.'
        : sp.dataset.base;
    }
  }
  $('pg-confirma-caja').hidden = recoge;
  const ciuTxt = intl ? $('pg-ciudad-intl').value.trim() + ', ' + $('pg-pais').value : ciu;
  $('pg-confirma-texto').textContent = 'Confirmo que mi dirección de envío' + (dir ? ' (' + dir + (ciuTxt ? ', ' + ciuTxt : '') + ')' : '') + ' es correcta y, en caso de errores, asumiré los posibles costos de transporte adicionales.' + (intl ? ' Entiendo que los impuestos o aranceles de importación de mi país, si aplican, corren por mi cuenta.' : '');
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
  if (soloWhatsApp()) return;
  if (!overlay) construirModal();
  aviso(null);
  carritoCambiado = false; pasoActual = 1; pasoMaximo = 1;
  overlay.querySelector('input[name="pg-entrega"][value="domicilio"]').checked = true;
  const lista = await cargarTarifas();
  await cargarPaypal();
  const selPais = $('pg-pais'); selPais.replaceChildren();
  const oc = document.createElement('option'); oc.value = 'Colombia'; oc.textContent = 'Colombia'; selPais.append(oc);
  if (pp) pp.paises.forEach((x) => { const o = document.createElement('option'); o.value = x.pais; o.textContent = x.pais; selPais.append(o); });
  selPais.value = 'Colombia';
  const sel = $('pg-ciudad'); sel.replaceChildren();
  const vacia = document.createElement('option'); vacia.value = ''; vacia.textContent = 'Selecciona tu ciudad'; sel.append(vacia);
  lista.forEach((t) => { const o = document.createElement('option'); o.value = t.ciudad; o.textContent = t.ciudad === 'Otro (nacional)' ? 'Otra ciudad de Colombia' : t.ciudad; sel.append(o); });
  overlay.hidden = false; document.body.style.overflow = 'hidden';
  $('pg-cuenta-caja').hidden = haySesionGuardada();
  pintarPasos(); actualizarResumen();
  overlay.scrollTo(0, 0);
  const d = await datosCuenta();
  const poner = (id, v) => { if (v && !$(id).value) $(id).value = v; };
  const bono = datosBono();
  poner('pg-nombre', d.nombre || bono.nombre); poner('pg-correo', d.correo || bono.correo); poner('pg-telefono', d.telefono || bono.telefono); poner('pg-direccion', d.direccion); poner('pg-notas', d.indicaciones);
  if (d.ciudad && !sel.value) {
    const conocida = ciudadConocida(d.ciudad) || d.ciudad;
    const hay = Array.from(sel.options).some((o) => o.value === conocida);
    if (hay) sel.value = conocida; else if (Array.from(sel.options).some((o) => o.value === 'Otro (nacional)')) { sel.value = 'Otro (nacional)'; poner('pg-otra', d.ciudad); }
  }
  actualizarResumen();
  cot = null; cotClave = ''; cotizarDescuento();
  $('pg-correo').focus({ preventScroll: true });
}

async function enviar(e) {
  e.preventDefault();
  if (pasoActual < 4) return irAPaso(pasoActual + 1);
  const nombre = $('pg-nombre').value.trim(), correo = $('pg-correo').value.trim(), telefono = $('pg-telefono').value.trim();
  const digital = esDigital();
  const recoge = digital || entregaElegida() === 'recogida';
  let ciudad = $('pg-ciudad').value; const otra = $('pg-otra').value.trim();
  let direccion = $('pg-direccion').value.trim(); const notas = $('pg-notas').value.trim();
  for (let n = 1; n <= 3; n++) { const m = validarPaso(n); if (m) { pasoActual = n; pintarPasos(); avisoPaso(n, m); return; } }
  const intl = !digital && esIntl();
  const conPaypal = !digital && metodoElegido() === 'paypal';
  if (!recoge && !intl && ciudad === 'Otro (nacional)') direccion = otra + ' — ' + direccion;
  if (!$('pg-acepto').checked) return aviso('Para continuar, acepta la política de datos y de envíos.');
  if (!recoge && !$('pg-confirma').checked) return aviso('Confirma que tu dirección de envío es correcta.');
  aviso(null);
  const boton = $('pago-enviar'); boton.disabled = true; boton.textContent = 'Preparando tu pago…';
  const restaurar = () => { boton.disabled = false; boton.textContent = textoBoton(); };
  try {
    const token = await tokenSesion();
    const headers = { 'Content-Type': 'application/json', apikey: SUPABASE_KEY };
    if (token) headers.Authorization = 'Bearer ' + token;
    const items = leerCarrito().map((i) => ({ id: i.id, cantidad: i.cantidad }));
    const cuerpo = intl
      ? { cliente: { nombre, correo, telefono, pais: $('pg-pais').value, ciudad: $('pg-ciudad-intl').value.trim(), direccion, notas }, items }
      : { cliente: { nombre, correo, telefono, ciudad, direccion, notas, entrega: digital ? 'digital' : (recoge ? 'recogida' : 'domicilio') }, items };
    const res = await fetch(SUPABASE_URL + (conPaypal ? '/functions/v1/paypal-pagos' : '/functions/v1/crear-pago-wompi'), {
      method: 'POST', headers, body: JSON.stringify(conPaypal ? { accion: 'crear', ...cuerpo } : cuerpo)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.url) {
      if (res.status === 503) aviso(avisoConWhatsApp(conPaypal ? 'El pago con PayPal estará listo muy pronto.' : 'Los pagos en línea estarán listos muy pronto.'));
      else if (res.status === 409) aviso(avisoConWhatsApp((data.error || 'Algún producto ya no está disponible.') + ' Revisa tu carrito o'));
      else aviso(data.error ? document.createTextNode(data.error) : avisoConWhatsApp('No pudimos preparar tu pago.'));
      restaurar();
      return;
    }
    // Si marcó recibir promociones, se registra (solo se guarda con la referencia y el correo de este pedido).
    if ($('pg-promos').checked && data.referencia) {
      try { await fetch(SUPABASE_URL + '/rest/v1/rpc/registrar_promos_pedido', { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY }, body: JSON.stringify({ p_referencia: data.referencia, p_correo: correo }) }); } catch (e) {}
    }
    // Solo queda en este navegador: sirve para rellenar el formulario si después crea su cuenta (gracias.html).
    try { localStorage.setItem('lrPrefillCuenta', JSON.stringify({ nombre, correo, telefono, ciudad: recoge ? '' : (intl ? $('pg-ciudad-intl').value.trim() : (ciudad === 'Otro (nacional)' ? otra : ciudad)), crear: !haySesionGuardada() && $('pg-cuenta').checked })); } catch (e) {}
    carritoCambiado = false;
    window.location.href = data.url;
  } catch (err) {
    aviso(avisoConWhatsApp('No pudimos conectar con el pago.'));
    restaurar();
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

// Datos que la persona dejó al pedir su bono de bienvenida (js/bono.js): sirven para mostrar el descuento de primera compra sin escribir nada.
function datosBono() {
  try { return { correo: localStorage.getItem('lrBonoCorreo') || '', nombre: localStorage.getItem('lrBonoNombre') || '', telefono: localStorage.getItem('lrBonoTelefono') || '' }; }
  catch (e) { return { correo: '', nombre: '', telefono: '' }; }
}
// Aviso del descuento de primera compra dentro del carrito. Con correo conocido (sesión o bono) calcula el valor exacto; si ya compró antes, se oculta.
let bonoCarritoId = 0;
async function pintarBonoCarrito() {
  const el = document.getElementById('carrito-bono'); if (!el) return;
  const yo = ++bonoCarritoId;
  const items = leerCarrito().map((i) => ({ id: i.id, cantidad: i.cantidad }));
  if (!items.length || esDigital()) { el.hidden = true; return; }   // los patrones digitales no llevan el descuento de primera compra
  if (soloWhatsApp()) { el.hidden = true; return; }   // el descuento automático solo aplica al pagar en línea
  const bono = datosBono(), cuenta = haySesionGuardada() ? await datosCuenta() : {};
  const correo = String(cuenta.correo || bono.correo || '').toLowerCase(), telefono = cuenta.telefono || bono.telefono || '';
  el.hidden = false;
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo)) { el.replaceChildren(nodo('span', null, '🎁 Primera compra: 10 % de descuento. Se aplica solo al pagar, con tu correo.')); return; }
  try {
    const token = await tokenSesion();
    const headers = { 'Content-Type': 'application/json', apikey: SUPABASE_KEY };
    if (token) headers.Authorization = 'Bearer ' + token;
    const res = await fetch(SUPABASE_URL + '/functions/v1/crear-pago-wompi', { method: 'POST', headers, body: JSON.stringify({ accion: 'cotizar', correo, telefono, entrega: 'recogida', items }) });
    const d = await res.json().catch(() => null);
    if (yo !== bonoCarritoId) return;
    if (res.ok && d && d.primera && d.descuento > 0) el.replaceChildren(nodo('span', null, '🎁 Descuento de primera compra (' + d.pct + ' %): '), nodo('b', null, '−' + pesos(Number(d.descuento))), nodo('span', null, ' · se aplica al pagar'));
    else if (res.ok && d && !d.primera) el.hidden = true;
  } catch (e) { /* si no se pudo calcular, queda el aviso general */ }
}
function vigilarCarrito() {
  const panel = document.getElementById('panel-carrito'); if (!panel || panel.dataset.bonoVigilado) return;
  panel.dataset.bonoVigilado = '1';
  const total = panel.querySelector('.carrito-total'); if (!total) return;
  if (!document.getElementById('estilo-bono-carrito')) { const st = document.createElement('style'); st.id = 'estilo-bono-carrito'; st.textContent = '.carrito-bono{background:#FBE4EF;color:#8E2A5F;border-radius:12px;padding:10px 14px;margin:0 0 12px;font-size:.88rem;line-height:1.35;text-align:center}'; document.head.appendChild(st); }
  const el = nodo('p', 'carrito-bono'); el.id = 'carrito-bono'; el.hidden = true; total.before(el);
  const mirar = () => { if (panel.classList.contains('abierto')) pintarBonoCarrito(); };
  new MutationObserver(mirar).observe(panel, { attributes: true, attributeFilter: ['class'] });
  const lista = document.getElementById('items-carrito'); if (lista) new MutationObserver(mirar).observe(lista, { childList: true });
  mirar();
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
  const aviso = nodo('p', 'nota-pago-carrito', '');
  aviso.hidden = true; wa.before(aviso);
  const estiloWa = 'display:block;box-sizing:border-box;width:100%;text-align:center;text-decoration:none;border-radius:999px;padding:12px 20px;font-weight:700;';
  const ajustar = () => {
    const soloWa = soloWhatsApp();
    b.hidden = soloWa; nota.hidden = soloWa; aviso.hidden = !soloWa;
    aviso.textContent = hayOtros()
      ? 'Los materiales de la Mercería se pagan por separado de los productos de la Tienda. Haz una compra y luego la otra, o pídelo todo por WhatsApp.'
      : 'Los materiales de la Mercería se piden por WhatsApp: confirmamos la disponibilidad, el envío y el pago (Nequi o Bre-B).';
    nota.textContent = esMateriales() ? '🔒 Pago seguro con Wompi. El envío lo pagas al recibir.' : '🔒 Pago seguro con Wompi: tarjeta, PSE, Nequi y más.';
    wa.textContent = 'Pedir por WhatsApp';
    wa.style.cssText = estiloWa + (soloWa ? 'background:#E74E96;color:#fff;border:2px solid #E74E96;' : 'background:#fff;color:#E74E96;border:2px solid #E74E96;box-shadow:none;');
  };
  ajustar();
  const panelC = document.getElementById('panel-carrito'), listaC = document.getElementById('items-carrito');
  if (panelC) new MutationObserver(ajustar).observe(panelC, { attributes: true, attributeFilter: ['class'] });
  if (listaC) new MutationObserver(ajustar).observe(listaC, { childList: true });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { iniciar(); vigilarCarrito(); }); else { iniciar(); vigilarCarrito(); }
