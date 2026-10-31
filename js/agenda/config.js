/* Agenda para tejedoras: Configuración (29-oct-2026, pedido de Sara: «toda la información del inicio en un apartado de configuración, con un engranaje»).
   El botón ⚙️ abre/cierra el panel `#agenda-config`, que guarda lo que antes se veía arriba: nombre de la dueña, imprimir y borrar, copias, Google Calendar y el color.
   Se cierra con el botón «✕ Cerrar» de arriba, el «Cerrar configuración» de abajo, el engranaje o la tecla Esc.
   Color (pedido de Sara, 29-oct: «todo el círculo cromático, para que escojan el color»): una rueda de colores (tono y intensidad) y una barra de claridad. Del color elegido se
   calculan las variables de color de la agenda (principal, botón con texto blanco legible, tintes suaves, texto oscuro) y se guardan en este dispositivo
   (`localStorage.lrAgendaTema = 'libre'`, `lrAgendaColor`, `lrAgendaColorVars`; un script del <head> de agenda-rosina.html las pone antes de pintar). Los temas fijos de antes
   (esmeralda, bosque… en css/agenda-fichas.css) siguen funcionando para quien ya los tenía elegidos. «Volver al rosa de Lana Rosa» quita todo.
   `window.lrAgendaConfig.abrir()` lo usan otros módulos (por ejemplo, la vuelta de Google Calendar) para mostrar el panel. */
(function () {
  'use strict';
  var btn = document.getElementById('agenda-config-btn'), panel = document.getElementById('agenda-config');
  if (!btn || !panel) return;
  function poner(abierto) { panel.hidden = !abierto; btn.setAttribute('aria-expanded', abierto ? 'true' : 'false'); }
  btn.addEventListener('click', function () { poner(panel.hidden); if (!panel.hidden) setTimeout(function () { panel.scrollIntoView({ block: 'start', behavior: 'smooth' }); }, 30); });   // la barra de arriba es fija: al tocar el engranaje con la página más abajo, el panel se lleva a la vista
  window.lrAgendaConfig = { abrir: function () { poner(true); }, cerrar: function () { poner(false); } };
  /* Cerrar: botón de arriba, botón de abajo y Esc */
  var pie = document.createElement('p'); pie.className = 'agenda-config-pie'; pie.innerHTML = '<button type="button" class="boton-secundario" data-cerrar-config>Cerrar configuración</button>'; panel.appendChild(pie);
  panel.addEventListener('click', function (e) { if (e.target.closest('[data-cerrar-config]')) { poner(false); btn.focus({ preventScroll: true }); btn.scrollIntoView({ block: 'center', behavior: 'smooth' }); } });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden && !document.querySelector('dialog[open]')) { poner(false); btn.focus(); } });

  /* ---- Color ---- */
  var caja = document.getElementById('ac-opciones'), VERDE = '#C81B6D';
  function aHex(r, g, b) { return '#' + [r, g, b].map(function (v) { return ('0' + Math.round(v).toString(16)).slice(-2); }).join('').toUpperCase(); }
  function hsvARgb(h, s, v) { var c = v * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = v - c, r = 0, g = 0, b = 0; if (h < 60) { r = c; g = x; } else if (h < 120) { r = x; g = c; } else if (h < 180) { g = c; b = x; } else if (h < 240) { g = x; b = c; } else if (h < 300) { r = x; b = c; } else { r = c; b = x; } return [(r + m) * 255, (g + m) * 255, (b + m) * 255]; }
  function rgbAHsl(r, g, b) { r /= 255; g /= 255; b /= 255; var mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn, h = 0, s = 0; if (d) { s = d / (1 - Math.abs(2 * l - 1)); if (mx === r) h = ((g - b) / d) % 6; else if (mx === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; h *= 60; if (h < 0) h += 360; } return [h, s, l]; }
  function hslARgb(h, s, l) { var c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2, r = 0, g = 0, b = 0; if (h < 60) { r = c; g = x; } else if (h < 120) { r = x; g = c; } else if (h < 180) { g = c; b = x; } else if (h < 240) { g = x; b = c; } else if (h < 300) { r = x; b = c; } else { r = c; b = x; } return [(r + m) * 255, (g + m) * 255, (b + m) * 255]; }
  function luz(rgb) { var f = rgb.map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * f[0] + 0.7152 * f[1] + 0.0722 * f[2]; }
  function contrasteBlanco(rgb) { return 1.05 / (luz(rgb) + 0.05); }
  function hsl(h, s, l) { return aHex.apply(null, hslARgb(h, Math.max(0, Math.min(1, s)), Math.max(0, Math.min(1, l)))); }
  /* A partir de un color elegido, las variables de color de la agenda */
  function derivar(rgb) {
    var t = rgbAHsl(rgb[0], rgb[1], rgb[2]), h = t[0], s = t[1], l = t[2], cs = Math.min(s, 0.85);
    var lb = l; while (lb > 0.1 && contrasteBlanco(hslARgb(h, s, lb)) < 4.6) lb -= 0.02;     // botón con texto blanco legible
    var lt = Math.min(l, 0.3); while (lt > 0.06 && contrasteBlanco(hslARgb(h, Math.max(s, 0.25), lt)) < 7) lt -= 0.02;   // texto de color sobre fondo claro
    var v = {};
    v['--rosa-principal'] = aHex(rgb[0], rgb[1], rgb[2]);
    v['--rosa-rgb'] = Math.round(rgb[0]) + ', ' + Math.round(rgb[1]) + ', ' + Math.round(rgb[2]);
    v['--rosa-boton'] = hsl(h, s, lb); v['--rosa-boton-hover'] = hsl(h, s, Math.max(0.06, lb - 0.08)); v['--rosa-hover'] = v['--rosa-boton-hover'];
    v['--rosa-texto'] = hsl(h, Math.max(s, 0.25), lt);
    v['--rosa-medio'] = hsl(h, cs, 0.78); v['--rosa-suave'] = hsl(h, cs, 0.95); v['--tinte'] = hsl(h, cs, 0.92);
    v['--casa-t1'] = hsl(h, cs, 0.93); v['--casa-t2'] = hsl(h, cs, 0.87);
    return v;
  }
  function limpiarVars() { ['--rosa-principal', '--rosa-rgb', '--rosa-boton', '--rosa-boton-hover', '--rosa-hover', '--rosa-texto', '--rosa-medio', '--rosa-suave', '--tinte', '--casa-t1', '--casa-t2'].forEach(function (k) { document.documentElement.style.removeProperty(k); }); }
  function aplicarColor(rgb, guardar) {
    var v = derivar(rgb); document.documentElement.setAttribute('data-tema', 'libre');
    Object.keys(v).forEach(function (k) { document.documentElement.style.setProperty(k, v[k]); });
    if (guardar) { try { localStorage.setItem('lrAgendaTema', 'libre'); localStorage.setItem('lrAgendaColor', v['--rosa-principal']); localStorage.setItem('lrAgendaColorVars', JSON.stringify(v)); } catch (e) {} }
  }
  function volverAlVerde() {
    document.documentElement.removeAttribute('data-tema'); limpiarVars();
    try { localStorage.removeItem('lrAgendaTema'); localStorage.removeItem('lrAgendaColor'); localStorage.removeItem('lrAgendaColorVars'); } catch (e) {}
  }

  /* Rueda: el ángulo es el tono, la distancia al centro es la intensidad; la barra de abajo es la claridad */
  var est = { h: 340, s: 0.47, v: 0.45 };
  (function () {   // punto de partida: el color que tenga la agenda hoy
    var c = (getComputedStyle(document.documentElement).getPropertyValue('--rosa-principal') || VERDE).trim(), m = /^#([0-9a-f]{6})$/i.exec(c);
    if (m) { var r = parseInt(m[1].slice(0, 2), 16), g = parseInt(m[1].slice(2, 4), 16), b = parseInt(m[1].slice(4), 16), mx = Math.max(r, g, b), mn = Math.min(r, g, b), t = rgbAHsl(r, g, b); est = { h: t[0], s: mx ? (mx - mn) / mx : 0, v: mx / 255 }; }
  })();
  caja.innerHTML = '<div class="ac-rueda-caja"><div class="ac-rueda" id="ac-rueda" tabindex="0" role="application" aria-label="Rueda de colores. Toca o arrastra para elegir el color; con el teclado usa las flechas."><span class="ac-punto" id="ac-punto"></span></div>' +
    '<div class="ac-lado"><label class="ac-claridad">Claridad<input type="range" id="ac-claridad" min="30" max="100" step="1" aria-label="Claridad del color"></label>' +
    '<div class="ac-muestra"><i id="ac-vista" aria-hidden="true"></i><span id="ac-hex"></span></div>' +
    '<p class="ac-ayuda">Toca o arrastra sobre la rueda para elegir cualquier color. Se guarda en este dispositivo.</p>' +
    '<button type="button" class="enlace-copia" id="ac-reset">↩ Volver al rosa de Lana Rosa</button></div></div>';
  var rueda = document.getElementById('ac-rueda'), punto = document.getElementById('ac-punto'), clar = document.getElementById('ac-claridad'), vista = document.getElementById('ac-vista'), hexTxt = document.getElementById('ac-hex');
  function pintar(guardar) {
    var rgb = hsvARgb(est.h, est.s, est.v), a = est.h * Math.PI / 180, rad = est.s * 50;
    punto.style.left = (50 + Math.sin(a) * rad) + '%'; punto.style.top = (50 - Math.cos(a) * rad) + '%'; punto.style.background = aHex(rgb[0], rgb[1], rgb[2]);
    rueda.style.setProperty('--v', String(est.v)); clar.value = Math.round(est.v * 100);
    vista.style.background = aHex(rgb[0], rgb[1], rgb[2]); hexTxt.textContent = aHex(rgb[0], rgb[1], rgb[2]);
    aplicarColor(rgb, guardar);
  }
  function desdePuntero(e) {
    var r = rueda.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2), rad = Math.min(1, Math.sqrt(dx * dx + dy * dy) / (r.width / 2));
    var h = Math.atan2(dx, -dy) * 180 / Math.PI; if (h < 0) h += 360; est.h = h; est.s = rad; pintar(true);
  }
  var arrastrando = false;
  rueda.addEventListener('pointerdown', function (e) { arrastrando = true; try { rueda.setPointerCapture(e.pointerId); } catch (x) {} desdePuntero(e); e.preventDefault(); });
  rueda.addEventListener('pointermove', function (e) { if (arrastrando) desdePuntero(e); });
  rueda.addEventListener('pointerup', function () { arrastrando = false; }); rueda.addEventListener('pointercancel', function () { arrastrando = false; });
  rueda.addEventListener('keydown', function (e) {
    var k = e.key, cambio = true;
    if (k === 'ArrowRight') est.h = (est.h + 6) % 360; else if (k === 'ArrowLeft') est.h = (est.h + 354) % 360; else if (k === 'ArrowUp') est.s = Math.min(1, est.s + 0.06); else if (k === 'ArrowDown') est.s = Math.max(0, est.s - 0.06); else cambio = false;
    if (cambio) { e.preventDefault(); pintar(true); }
  });
  clar.addEventListener('input', function () { est.v = clar.value / 100; pintar(true); });
  document.getElementById('ac-reset').addEventListener('click', function () { volverAlVerde(); est = { h: 340, s: 0.47, v: 0.45 }; pintarSinAplicar(); });
  function pintarSinAplicar() {
    rueda.style.setProperty('--v', String(est.v));
    var rgb = hsvARgb(est.h, est.s, est.v), a = est.h * Math.PI / 180, rad = est.s * 50;
    punto.style.left = (50 + Math.sin(a) * rad) + '%'; punto.style.top = (50 - Math.cos(a) * rad) + '%'; punto.style.background = aHex(rgb[0], rgb[1], rgb[2]);
    clar.value = Math.round(est.v * 100); vista.style.background = VERDE; hexTxt.textContent = VERDE + ' (rosa Lana Rosa)';
  }
  /* al cargar: solo se dibuja la rueda; el color ya lo puso el script del <head> */
  rueda.style.setProperty('--v', String(est.v));
  (function () { var rgb = hsvARgb(est.h, est.s, est.v), a = est.h * Math.PI / 180, rad = est.s * 50; punto.style.left = (50 + Math.sin(a) * rad) + '%'; punto.style.top = (50 - Math.cos(a) * rad) + '%'; punto.style.background = aHex(rgb[0], rgb[1], rgb[2]); clar.value = Math.round(est.v * 100); vista.style.background = aHex(rgb[0], rgb[1], rgb[2]); hexTxt.textContent = aHex(rgb[0], rgb[1], rgb[2]); })();
})();
