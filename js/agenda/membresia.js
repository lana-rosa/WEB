/* Agenda para tejedoras: prueba gratis y membresía (29-oct-2026, pedido de Sara).
   · Toda cuenta tiene la agenda completa 7 días gratis (los calcula la base: `mi_membresia()` devuelve `prueba_hasta`).
   · Pasada la prueba quedan gratis las 3 primeras pestañas (Inicio, Mi tablero y Mis proyectos); las demás hojas se bloquean con un candado
     hasta que la persona active la membresía: $5.000 al mes o $45.000 al año, pago con Wompi (`crear-pago-wompi`, accion «membresia»; el precio lo fija el servidor).
   · Es un candado de la página (la agenda es estática): sirve para ordenar el servicio, no es una caja fuerte. Lo escrito siempre sigue guardado en el dispositivo.
   · Mientras no se sabe el estado (primera visita sin red) no se bloquea nada. Sin sesión no se hace nada (la agenda ya pide cuenta).
   Interruptor: MEMBRESIA_ACTIVA. Piezas anteriores (12-oct-2026): herramientas/agenda-premium/membresia-apagada/. */
import { haySesionGuardada, obtenerCliente } from '/js/cuenta.js';
(function () {
  var MEMBRESIA_ACTIVA = true;
  var PESTANAS_GRATIS = 3;                 // Inicio, Mi tablero y Mis proyectos
  var PRECIO_MES = '$5.000', PRECIO_ANIO = '$45.000';
  var CLAVE = 'lrMembresia';
  // Versión de las condiciones que la persona acepta al pagar: debe coincidir con VERSION_CONDICIONES de la función crear-pago-wompi y con la «Fecha de actualización» de politicas.html#membresia.
  var VERSION_CONDICIONES = '2026-10-29';
  if (!MEMBRESIA_ACTIVA || !haySesionGuardada()) return;
  var $ = function (id) { return document.getElementById(id); };
  var estado = null, sb = null, TEXTOS = {
    'Mis materiales': 'Tu inventario de lanas, tus agujas y tu lista de compras.',
    'Mi emprendimiento': 'Pedidos con cuentas y saldos, clientas, ventas, catálogo de precios, ferias, gastos y resultados del negocio.',
    'Finanzas del negocio': 'Tu negocio en números: ingresos y gastos del negocio, presupuesto y metas, deudas, tarjetas y análisis, con gráficas.',
    'Fechas y bienestar': 'El calendario del año con todas tus fechas, fechas especiales, diario de tejido y pausas activas.'
  };

  /* Hojas de pago: las de las pestañas que van después de las gratis (se leen del menú de hojas, en su orden) */
  function hojasDePago() {
    var lista = [], g = -1;
    document.querySelectorAll('#menu-hojas-lista > *').forEach(function (e) {
      if (e.classList.contains('menu-grupo')) { g++; return; }
      if (e.dataset && e.dataset.hoja && g >= PESTANAS_GRATIS) lista.push({ id: e.dataset.hoja, grupo: e.parentNode.querySelectorAll('.menu-grupo')[g].textContent.trim() });
    });
    return lista;
  }
  function fecha(iso) { return new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }); }
  function leerCache() { try { var c = JSON.parse(localStorage.getItem(CLAVE)); return c && c.t && Date.now() - c.t < 30 * 86400000 ? c : null; } catch (e) { return null; } }
  function guardarCache(e) { try { localStorage.setItem(CLAVE, JSON.stringify({ t: Date.now(), activa: e.activa, vence: e.vence, plan: e.plan, prueba_hasta: e.prueba_hasta })); } catch (x) {} }
  /* 'miembro' | 'prueba' | 'gratis' | 'desconocido' */
  function acceso() {
    if (!estado) return 'desconocido';
    if (estado.activa && Date.parse(estado.vence) > Date.now()) return 'miembro';
    if (estado.prueba_hasta && Date.parse(estado.prueba_hasta) > Date.now()) return 'prueba';
    if (estado.prueba_hasta) return 'gratis';
    return 'desconocido';
  }
  function diasQue(iso) { return Math.max(1, Math.ceil((Date.parse(iso) - Date.now()) / 86400000)); }

  function textoTarjeta(a) {
    if (a === 'miembro') return '💎 <strong>Tu membresía está activa</strong> hasta el ' + fecha(estado.vence) + '. Tienes toda la agenda.';
    if (a === 'prueba') return '🎁 <strong>Prueba gratis:</strong> tienes toda la agenda hasta el ' + fecha(estado.prueba_hasta) + ' (' + (diasQue(estado.prueba_hasta) === 1 ? 'último día' : 'quedan ' + diasQue(estado.prueba_hasta) + ' días') + '). Después, Inicio, Mi tablero y Mis proyectos siguen gratis y el resto es con membresía desde ' + PRECIO_MES + ' al mes.';
    return '🔒 <strong>Tu prueba gratis terminó.</strong> Inicio, Mi tablero y Mis proyectos siguen gratis. Con la membresía recuperas Materiales, Emprendimiento, Finanzas del negocio y Fechas y bienestar desde ' + PRECIO_MES + ' al mes.';
  }
  function tarjeta(id, antes) {
    var t = $(id); if (t) return t;
    if (!antes || !antes.parentNode) return null;
    t = document.createElement('div'); t.className = 'membresia-tarjeta no-imprimir'; t.id = id; t.hidden = true;
    t.innerHTML = '<p></p><button type="button" class="boton-primario boton-chico" data-abrir-membresia>Ver planes</button>';
    antes.parentNode.insertBefore(t, antes);
    return t;
  }
  function aplicar() {
    var a = acceso(), pagas = hojasDePago(), bloquear = a === 'gratis';
    pagas.forEach(function (h) {
      var hoja = $(h.id); if (!hoja) return;
      hoja.classList.toggle('sin-membresia', bloquear);
      var c = hoja.querySelector(':scope > .candado-pago');
      if (bloquear && !c) {
        c = document.createElement('div'); c.className = 'candado-pago no-imprimir';
        c.innerHTML = '<div class="cp-ic" aria-hidden="true">💎</div><h4>Hoja de la membresía</h4><p></p><button type="button" class="boton-primario boton-chico" data-abrir-membresia>Ver planes desde ' + PRECIO_MES + ' al mes</button><small>Tus hojas gratis siguen igual y lo que ya escribiste sigue guardado en este dispositivo: puedes bajarlo en «Guardar una copia» (⚙️ Configuración).</small>';
        c.querySelector('p').textContent = (TEXTOS[h.grupo] || 'Esta hoja es parte de la agenda completa.') + ' Esta hoja es de la membresía.';
        var cab = hoja.querySelector('header'); if (cab) cab.insertAdjacentElement('afterend', c); else hoja.insertBefore(c, hoja.firstChild);
      }
      var m = document.querySelector('#menu-hojas-lista a[data-hoja="' + h.id + '"]');
      if (m) { m.textContent = m.textContent.replace(/ 💎$/, '') + (bloquear ? ' 💎' : ''); m.classList.toggle('de-pago', bloquear); }
      var at = document.querySelector('.atajo[data-ir="' + h.id + '"]'); if (at) at.classList.toggle('de-pago', bloquear);
    });
    var indice = $('indice-agenda'), cfg = $('agenda-config');
    var t1 = indice && tarjeta('membresia-tarjeta', indice.querySelector('.indice-grupo'));
    var t2 = cfg && tarjeta('membresia-config', cfg.querySelector('.copia-agenda'));
    [t1, t2].forEach(function (t) {
      if (!t) return;
      t.hidden = a === 'desconocido';
      if (!t.hidden) { t.querySelector('p').innerHTML = textoTarjeta(a); t.querySelector('button').textContent = a === 'miembro' ? 'Renovar' : 'Ver planes'; }
    });
    window.lrMembresia = { acceso: a, activa: a === 'miembro', vence: estado && estado.vence || null, prueba_hasta: estado && estado.prueba_hasta || null };
    var actual = document.querySelector('#menu-hojas-lista a.activa'); if (actual && $('menu-hojas-actual')) $('menu-hojas-actual').textContent = actual.textContent.trim();
    if (window.lrPintarPestanas && actual) window.lrPintarPestanas(actual.dataset.hoja);
    document.dispatchEvent(new CustomEvent('membresia:lista', { detail: window.lrMembresia }));
  }

  /* Ventana de planes y pago */
  var HTML = '<button type="button" class="mm-cerrar" id="mm-cerrar" aria-label="Cerrar">✕</button>' +
    '<h2 id="mm-titulo">Agenda completa 💎</h2><p class="mm-estado" id="mm-estado"></p>' +
    '<ul class="mm-lista"><li>Mis materiales: inventario de lanas, agujas y lista de compras</li><li>Mi emprendimiento: pedidos con saldos, clientas, ventas, catálogo, ferias y gastos</li><li>Finanzas del negocio: ingresos, gastos, presupuesto, deudas, tarjetas y análisis del negocio</li><li>Fechas y bienestar: calendario del año, fechas especiales, diario y pausas activas</li></ul>' +
    '<p class="mm-gratis">Siempre gratis con tu cuenta: Inicio, Mi tablero y Mis proyectos.</p>' +
    '<div class="mm-planes" role="radiogroup" aria-label="Plan de la membresía">' +
    '<label class="mm-plan"><input type="radio" name="mm-plan" value="mensual"><span><strong>Mensual</strong><em>' + PRECIO_MES + '</em><small>al mes</small></span></label>' +
    '<label class="mm-plan"><input type="radio" name="mm-plan" value="anual" checked><span><strong>Anual</strong><em>' + PRECIO_ANIO + '</em><small>al año · ahorras $15.000</small><b>3 meses gratis</b></span></label></div>' +
    '<div class="mm-aceptos">' +
    '<label class="mm-acepto"><input type="checkbox" id="mm-acepto-cond"><span>Acepto las <a href="/politicas.html#membresia" target="_blank" rel="noopener">condiciones de la membresía</a> y la <a href="/politicas.html#datos" target="_blank" rel="noopener">política de datos</a>.</span></label>' +
    '<label class="mm-acepto"><input type="checkbox" id="mm-acepto-inicio"><span>Solicito que el servicio comience inmediatamente después de aprobarse mi pago y entiendo las consecuencias que esto puede tener sobre mi derecho de retracto, en los términos legalmente aplicables (<a href="/politicas.html#membresia" target="_blank" rel="noopener">apartado 5 de las condiciones</a>).</span></label></div>' +
    '<button type="button" class="boton-primario" id="mm-pagar">Pagar con Wompi</button><p class="cs-aviso" id="mm-aviso" role="status"></p>' +
    '<small class="nota-pie">Pago seguro con Wompi (tarjeta, PSE, Nequi y más). No hay cobro automático: te avisamos antes de que venza. Tus hojas gratis y tus datos siguen siendo tuyos. Guardamos la fecha y hora en que aceptas.</small>';
  var dlg = document.createElement('dialog'); dlg.className = 'modal-membresia no-imprimir'; dlg.id = 'modal-membresia'; dlg.setAttribute('data-no-traducir', '');   /* texto legal: queda en español hasta que lo revise la abogada */ dlg.setAttribute('aria-labelledby', 'mm-titulo'); dlg.innerHTML = HTML;
  document.body.appendChild(dlg);
  function cerrar() { if (dlg.close) dlg.close(); else dlg.removeAttribute('open'); }
  function abrir() {
    if (!haySesionGuardada()) { location.href = '/cuenta.html'; return; }
    var a = acceso();
    $('mm-aviso').textContent = ''; $('mm-pagar').disabled = false; $('mm-acepto-cond').checked = false; $('mm-acepto-inicio').checked = false;
    $('mm-estado').textContent = a === 'miembro' ? 'Tu membresía está activa hasta el ' + fecha(estado.vence) + '. Si renuevas ahora, se suma al tiempo que te queda.'
      : a === 'prueba' ? 'Estás en tu prueba gratis hasta el ' + fecha(estado.prueba_hasta) + '. Puedes activar la membresía desde ya.'
      : 'Elige tu plan y recupera todas las hojas de la agenda.';
    $('mm-pagar').textContent = a === 'miembro' ? 'Renovar con Wompi' : 'Pagar con Wompi';
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
  }
  document.addEventListener('click', function (e) { if (e.target.closest('[data-abrir-membresia]')) abrir(); });
  $('mm-cerrar').addEventListener('click', cerrar);
  dlg.addEventListener('click', function (e) { if (e.target === dlg) cerrar(); });
  $('mm-pagar').addEventListener('click', async function () {
    var b = this, av = $('mm-aviso'), plan = (document.querySelector('input[name="mm-plan"]:checked') || {}).value || 'anual';
    var c1 = $('mm-acepto-cond'), c2 = $('mm-acepto-inicio');
    if (!c1.checked || !c2.checked) { av.textContent = 'Para continuar, marca las dos casillas: aceptar las condiciones y pedir que el servicio empiece de inmediato.'; (c1.checked ? c2 : c1).focus(); return; }
    b.disabled = true; av.textContent = 'Abriendo Wompi…';
    var d = null;
    try {
      sb = sb || await obtenerCliente();
      var r = await sb.functions.invoke('crear-pago-wompi', { body: { accion: 'membresia', plan: plan, acepta: { condiciones: true, inicio_inmediato: true, version: VERSION_CONDICIONES } } });
      d = r.data;
      if (r.error) { try { d = await r.error.context.json(); } catch (e) {} }
    } catch (e) {}
    if (d && d.url) { (window.dataLayer = window.dataLayer || []).push({ event: 'begin_checkout', items: [{ item_name: 'Membresía agenda ' + plan }] }); location.href = d.url; return; }
    av.textContent = (d && d.error) || 'No pudimos iniciar el pago. Inténtalo de nuevo.'; b.disabled = false;
  });

  async function consultar() {
    var c = leerCache(); if (c) estado = { activa: c.activa, vence: c.vence, plan: c.plan, prueba_hasta: c.prueba_hasta };
    aplicar();
    try {
      sb = await obtenerCliente();
      var r = await sb.rpc('mi_membresia');
      if (!r.error && r.data && r.data.prueba_hasta) { estado = { activa: !!r.data.activa, plan: r.data.plan, vence: r.data.vence, prueba_hasta: r.data.prueba_hasta }; guardarCache(estado); aplicar(); }
    } catch (e) { /* sin conexión: se usa lo recordado */ }
  }
  consultar().then(function () { if (location.hash === '#membresia') abrir(); });
})();
