/* Lana Rosa — aviso de cookies y consentimiento (Modo de consentimiento de Google).
   - La decisión se guarda en este navegador (localStorage "lrConsent": versión, analítica sí/no, fecha).
   - Hasta que la persona acepte, la analítica (GA4 dentro de GTM) queda en "denegado": el snippet de cada página
     fija el valor inicial; aquí solo se muestra el aviso y se actualiza el consentimiento.
   - Si la política cambia, se sube VERSION y el aviso vuelve a aparecer.
   - Cualquier enlace con data-abrir-cookies (p. ej. "Configurar cookies" del pie) abre el panel de opciones. */
(function () {
  'use strict';
  var CLAVE = 'lrConsent', VERSION = 1;
  var dl = (window.dataLayer = window.dataLayer || []);
  function gtag() { dl.push(arguments); }

  function leer() {
    try { var c = JSON.parse(localStorage.getItem(CLAVE) || 'null'); return c && c.v === VERSION ? c : null; } catch (e) { return null; }
  }
  function guardar(analitica) {
    var c = { v: VERSION, a: !!analitica, t: new Date().toISOString() };
    try { localStorage.setItem(CLAVE, JSON.stringify(c)); } catch (e) {}
    gtag('consent', 'update', { analytics_storage: c.a ? 'granted' : 'denied' });
    dl.push({ event: 'consentimiento_actualizado', analitica: c.a ? 'si' : 'no', pagina: location.pathname });
    return c;
  }

  var css = '' +
    '.lr-ck{position:fixed;left:16px;right:16px;bottom:16px;z-index:2600;max-width:520px;margin:0 auto;background:#fff;color:#45454A;border:2px solid #FBE4EF;border-radius:20px;box-shadow:0 12px 36px rgba(58,42,46,.22);padding:18px 18px 16px;font-family:"Hanken Grotesk",system-ui,sans-serif;font-size:.95rem;line-height:1.5}' +
    '.lr-ck h2{font-family:"DynaPuff","Hanken Grotesk",sans-serif;font-weight:600;font-size:1.1rem;margin:0 0 6px;color:#B0246C}' +
    '.lr-ck p{margin:0 0 12px}.lr-ck a{color:#B0246C;font-weight:700}' +
    '.lr-ck-fila{display:flex;flex-wrap:wrap;gap:8px}' +
    '.lr-ck button{font:inherit;font-weight:700;min-height:44px;padding:10px 18px;border-radius:999px;cursor:pointer;border:2px solid #E74E96;background:#fff;color:#B0246C}' +
    '.lr-ck button.lr-ck-si{background:#E74E96;color:#fff}' +
    '.lr-ck button:focus-visible,.lr-ck a:focus-visible,.lr-ck input:focus-visible{outline:3px solid #9EA2F9;outline-offset:2px}' +
    '.lr-ck-op{display:flex;gap:12px;align-items:flex-start;padding:10px 12px;border-radius:14px;background:#FBF7F4;margin:0 0 8px}' +
    '.lr-ck-op input{width:22px;height:22px;margin-top:2px;accent-color:#E74E96;flex-shrink:0}' +
    '.lr-ck-op strong{display:block}.lr-ck-op span{font-size:.88rem;color:#6B6B72}' +
    '@media (max-width:560px){.lr-ck{left:10px;right:10px;bottom:10px;padding:16px}.lr-ck button{flex:1 1 auto}}';

  var caja = null, previo = null;

  function cerrar() {
    if (caja && caja.parentNode) caja.parentNode.removeChild(caja);
    caja = null;
    if (previo && previo.focus) { try { previo.focus(); } catch (e) {} }
    previo = null;
  }
  function crear(titulo) {
    cerrar();
    var estilo = document.getElementById('lr-ck-css');
    if (!estilo) { estilo = document.createElement('style'); estilo.id = 'lr-ck-css'; estilo.textContent = css; document.head.appendChild(estilo); }
    caja = document.createElement('div');
    caja.className = 'lr-ck'; caja.setAttribute('role', 'dialog'); caja.setAttribute('aria-labelledby', 'lr-ck-t');
    caja.innerHTML = '<h2 id="lr-ck-t">' + titulo + '</h2>';
    document.body.appendChild(caja);
    return caja;
  }

  function aviso() {
    var c = crear('Cookies, sin enredos');
    c.insertAdjacentHTML('beforeend',
      '<p>Usamos lo necesario para que el carrito y tu cuenta funcionen. Si nos dejas, también medimos de forma anónima qué páginas te sirven para mejorar la web. Tú decides y puedes cambiarlo cuando quieras. <a href="/politicas.html#cookies">Política de cookies</a></p>' +
      '<div class="lr-ck-fila"><button type="button" class="lr-ck-si" data-ck="si">Aceptar</button><button type="button" data-ck="no">Rechazar</button><button type="button" data-ck="cfg">Configurar</button></div>');
    c.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('button[data-ck]'); if (!b) return;
      var a = b.getAttribute('data-ck');
      if (a === 'si') { guardar(true); cerrar(); } else if (a === 'no') { guardar(false); cerrar(); } else panel();
    });
  }

  function panel() {
    var actual = leer();
    var c = crear('Tus opciones de cookies');
    c.insertAdjacentHTML('beforeend',
      '<label class="lr-ck-op"><input type="checkbox" checked disabled><span><strong>Necesarias</strong>Carrito, cuenta y preferencias. Siempre activas, porque sin ellas la tienda no funciona.</span></label>' +
      '<label class="lr-ck-op"><input type="checkbox" id="lr-ck-an"' + (actual && actual.a ? ' checked' : '') + '><span><strong>Analítica</strong>Google Analytics: nos cuenta de forma anónima qué páginas se visitan. No usamos cookies de publicidad.</span></label>' +
      '<p style="margin-top:12px"><a href="/politicas.html#cookies">Política de cookies</a> · <a href="/politicas.html#datos">Datos personales</a></p>' +
      '<div class="lr-ck-fila"><button type="button" class="lr-ck-si" data-ck="guardar">Guardar mis opciones</button><button type="button" data-ck="cerrar">Cancelar</button></div>');
    c.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('button[data-ck]'); if (!b) return;
      if (b.getAttribute('data-ck') === 'guardar') { guardar(document.getElementById('lr-ck-an').checked); cerrar(); }
      else { cerrar(); if (!leer()) aviso(); }
    });
    c.addEventListener('keydown', function (e) { if (e.key === 'Escape') { cerrar(); if (!leer()) aviso(); } });
    var primero = c.querySelector('#lr-ck-an'); if (primero) primero.focus();
  }

  window.lrAbrirCookies = function () { previo = document.activeElement; panel(); };

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-abrir-cookies]');
    if (a) { e.preventDefault(); window.lrAbrirCookies(); }
  });

  function iniciar() {
    // la decisión ya tomada se vuelve a aplicar (el snippet de la página ya lo hace antes de GTM; aquí por si acaso)
    var c = leer();
    if (c) gtag('consent', 'update', { analytics_storage: c.a ? 'granted' : 'denied' });
    else aviso();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
