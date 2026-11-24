/* Agenda para tejedoras: pausa guiada «Tejer con responsabilidad» (23-nov-2026).
   Rutina corta paso a paso (respirar, cuello, hombros, manos y muñecas, descanso visual, celebrar), con cuenta regresiva en cada paso.
   Al terminar ofrece marcar el día de hoy en «Registro de pausas activas» (casilla `ag-pa<día>`, el mismo dato de siempre; no guarda nada nuevo).
   Se abre desde esa hoja y desde el aviso de pausa de los ciclos de tejido (cronometro.js). Los ejercicios son los de la Revista («Pausas activas para tejedoras»).
   API: window.lrPausas.abrir(). */
(function () {
  'use strict';
  var hoja = document.getElementById('registro-pausas'); if (!hoja) return;
  var PASOS = [
    ['🌬️', 'Respira', 'Siéntate cómoda, cierra los ojos y respira profundo por la nariz 5 veces, soltando el aire despacio por la boca.', 30],
    ['🙆‍♀️', 'Cuello', 'Pon una mano sobre la cabeza e inclina la oreja hacia el hombro, sin forzar. Sostén 15 segundos y cambia de lado.', 30],
    ['💪', 'Hombros', 'Cruza un brazo por delante del pecho y sostenlo con la otra mano, sin subir los hombros. 15 segundos por lado.', 30],
    ['🤲', 'Manos y muñecas', 'Estira los brazos al frente, entrelaza los dedos y empuja suavemente las palmas hacia afuera. Tus manos trabajan mucho al tejer: ¡consiéntelas!', 30],
    ['👀', 'Descanso visual', 'Mira un punto lejano, por la ventana si puedes, durante 20 segundos y parpadea despacio varias veces.', 20],
    ['🎉', '¡Celebra!', 'Sube los brazos, sacude suavemente las manos y sonríe. Ya estás lista para volver a tu tejido.', 10]
  ];
  var caja = null, paso = 0, resto = 0, reloj = 0, previo = null;
  function T(t) { return window.lrI18n && window.lrI18n.t ? window.lrI18n.t(t) : t; }
  function el(tag, cls, t) { var e = document.createElement(tag); if (cls) e.className = cls; if (t != null) e.textContent = t; return e; }
  function boton(txt, cls, fn) { var b = el('button', 'boton-chico ' + cls, T(txt)); b.type = 'button'; b.addEventListener('click', fn); return b; }
  function cerrar() { clearInterval(reloj); if (caja) { caja.remove(); caja = null; } document.removeEventListener('keydown', tecla); if (previo && previo.focus) { try { previo.focus(); } catch (e) {} } }
  function tecla(e) {
    if (e.key === 'Escape') { cerrar(); return; }
    if (e.key === 'Tab' && caja) { var f = caja.querySelectorAll('button'); if (!f.length) return; var a = f[0], z = f[f.length - 1]; if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); } }
  }
  function marcarHoy() { var c = document.getElementById('ag-pa' + new Date().getDate()); if (c && !c.checked) { c.checked = true; c.dispatchEvent(new Event('change', { bubbles: true })); } return !!c; }
  function pintar() {
    var cu = caja.querySelector('.pg-cuerpo'); cu.textContent = ''; clearInterval(reloj);
    if (paso >= PASOS.length) {
      var ya = marcarHoy();
      cu.appendChild(el('p', 'pg-ic', '🌸')); cu.appendChild(el('h3', 'pg-t', T('¡Pausa terminada!')));
      cu.appendChild(el('p', 'pg-tx', T(ya ? 'Marcamos el día de hoy en tu registro de pausas activas.' : 'Cuidar tus manos también es parte de tejer.')));
      var fin = el('div', 'pg-bot'); fin.appendChild(boton('Volver al tejido', 'boton-primario', cerrar)); cu.appendChild(fin); fin.firstChild.focus(); return;
    }
    var p = PASOS[paso]; resto = p[3];
    cu.appendChild(el('p', 'pg-cont', (paso + 1) + ' / ' + PASOS.length));
    cu.appendChild(el('p', 'pg-ic', p[0])); cu.appendChild(el('h3', 'pg-t', T(p[1]))); cu.appendChild(el('p', 'pg-tx', T(p[2])));
    var rel = el('p', 'pg-reloj', resto + ' s'); rel.setAttribute('role', 'timer'); rel.setAttribute('data-no-traducir', ''); cu.appendChild(rel);
    var bot = el('div', 'pg-bot'), sig = boton(paso === PASOS.length - 1 ? 'Terminar' : 'Siguiente', 'boton-primario', function () { paso++; pintar(); });
    if (paso > 0) bot.appendChild(boton('Atrás', 'boton-secundario', function () { paso--; pintar(); }));
    bot.appendChild(sig); cu.appendChild(bot); sig.focus();
    reloj = setInterval(function () { resto--; if (resto <= 0) { clearInterval(reloj); rel.textContent = T('¡Listo!'); try { if (navigator.vibrate) navigator.vibrate(150); } catch (e) {} } else rel.textContent = resto + ' s'; }, 1000);
  }
  function abrir() {
    if (caja) return; previo = document.activeElement; paso = 0;
    caja = el('div', 'pg-fondo no-imprimir'); var d = el('div', 'pg-caja'); d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-label', T('Pausa guiada'));
    var x = el('button', 'pg-x', '✕'); x.type = 'button'; x.setAttribute('aria-label', T('Cerrar')); x.addEventListener('click', cerrar); d.appendChild(x);
    d.appendChild(el('p', 'pg-tit', T('Tejer con responsabilidad')));
    d.appendChild(el('div', 'pg-cuerpo'));
    d.appendChild(el('p', 'pg-aviso', T('Muévete despacio, sin rebotar y sin llegar al dolor. Si tienes alguna lesión o molestia, consulta primero con un profesional de la salud.')));
    caja.appendChild(d); document.body.appendChild(caja); document.addEventListener('keydown', tecla); pintar();
  }
  /* botón dentro de la hoja del registro */
  var enc = hoja.querySelector('.dias-pausas'), tarj = el('div', 'pg-tarjeta no-imprimir');
  tarj.appendChild(el('p', 'pg-tarjeta-t', 'Pausa guiada de 3 minutos')); tarj.appendChild(el('p', 'pg-tarjeta-s', 'Respira, estira cuello, hombros y manos, y descansa la vista.'));
  tarj.appendChild(boton('Empezar mi pausa guiada', 'boton-primario', abrir));
  if (enc) enc.parentNode.insertBefore(tarj, enc.previousElementSibling && enc.previousElementSibling.tagName === 'P' ? enc.previousElementSibling : enc);
  window.lrPausas = { abrir: abrir };
})();
