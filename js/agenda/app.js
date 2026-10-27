/* Agenda para tejedoras: tarjeta «Instala tu agenda como app» (28-oct-2026).
   Usa el instalador del navegador (Chrome, Edge, Samsung Internet…); en iPhone y iPad explica cómo añadirla a la pantalla de inicio.
   No aparece si ya está instalada ni durante 14 días después de «Ahora no». No guarda nada más. */
(function () {
  'use strict';
  var caja = document.getElementById('instalar-agenda');
  if (!caja) return;
  var CLAVE = 'lrAgendaInstalarLuego', DIAS = 14 * 86400000, ofrecido = null;
  var enApp = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone;
  function silenciada() { try { var t = parseInt(localStorage.getItem(CLAVE), 10); return t && Date.now() - t < DIAS; } catch (e) { return false; } }
  function medir(e) { (window.dataLayer = window.dataLayer || []).push({ event: e, app: 'agenda', pagina: location.pathname }); }
  if (enApp || silenciada()) return;
  var ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var boton = document.getElementById('ia-instalar'), ayuda = document.getElementById('ia-ayuda');
  function mostrar() { caja.hidden = false; }
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); ofrecido = e; mostrar(); });
  window.addEventListener('appinstalled', function () { caja.hidden = true; });
  if (ios) { boton.textContent = 'Cómo instalar'; mostrar(); }
  boton.addEventListener('click', function () {
    medir('clic_instalar_app');
    if (ofrecido) { var o = ofrecido; ofrecido = null; try { o.prompt(); o.userChoice.then(function (r) { if (r && r.outcome === 'accepted') caja.hidden = true; }); } catch (e) {} }
    else ayuda.hidden = !ayuda.hidden;
  });
  document.getElementById('ia-luego').addEventListener('click', function () { caja.hidden = true; try { localStorage.setItem(CLAVE, String(Date.now())); } catch (e) {} });
})();
