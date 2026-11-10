/* Modo claro / oscuro de la agenda (E19 + E25 + E26, 5-nov-2026, pedido de Jennifer).
   Tres opciones en Configuración: «Claro», «Oscuro» y «Como el celular» (sigue el ajuste del aparato y cambia solo). Se guarda en este aparato
   (`localStorage.lrAgendaModo` = 'claro' | 'oscuro' | 'auto'; sin dato = como el celular, decisión de Jennifer 10-nov-2026). Un script del <head> de agenda-rosina.html pone
   `<html data-modo="oscuro">` antes de pintar; los colores oscuros están en css/agenda-oscuro.css (generado por herramientas/agenda-oscuro/generar_oscuro.py).
   Este módulo guarda la elección, mantiene el atributo, cambia el color de la barra del navegador y avisa con el evento `lrmodo` (config.js recalcula el color elegido).
   La impresión siempre sale en claro (el css oscuro va dentro de @media screen). */
(function () {
  'use strict';
  var KEY = 'lrAgendaModo', raiz = document.documentElement, mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  var meta = document.querySelector('meta[name="theme-color"]'), metaClaro = meta ? meta.getAttribute('content') : '';
  /* sin elección guardada: como el celular (decisión de Jennifer, 10-nov-2026) */
  function elegido() { try { var m = localStorage.getItem(KEY); return m === 'oscuro' || m === 'claro' ? m : 'auto'; } catch (e) { return 'claro'; } }
  function esOscuro() { var m = elegido(); return m === 'oscuro' || (m === 'auto' && !!mq && mq.matches); }
  function aplicar() {
    var o = esOscuro();
    if (o) raiz.setAttribute('data-modo', 'oscuro'); else raiz.removeAttribute('data-modo');
    if (meta) meta.setAttribute('content', o ? '#16131A' : metaClaro);
    try { document.dispatchEvent(new CustomEvent('lrmodo', { detail: { oscuro: o, modo: elegido() } })); } catch (e) {}
    marcar();
  }
  function poner(m) { try { localStorage.setItem(KEY, m); } catch (e) {} aplicar(); }
  function marcar() {
    var m = elegido(), grupo = document.getElementById('modo-opciones');
    if (!grupo) return;
    Array.prototype.forEach.call(grupo.querySelectorAll('input[name="agenda-modo"]'), function (r) { r.checked = r.value === m; });
  }
  if (mq) { var f = function () { if (elegido() === 'auto') aplicar(); }; if (mq.addEventListener) mq.addEventListener('change', f); else if (mq.addListener) mq.addListener(f); }
  window.lrModo = { elegido: elegido, esOscuro: esOscuro, poner: poner };
  function arrancar() {
    var grupo = document.getElementById('modo-opciones');
    if (grupo) grupo.addEventListener('change', function (e) { var r = e.target; if (r && r.name === 'agenda-modo') poner(r.value); });
    aplicar();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar); else arrancar();
})();
