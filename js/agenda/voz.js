/* Agenda para tejedoras: escribir hablando (27-oct-2026).
   Usa el reconocimiento de voz del navegador (Web Speech API). El audio lo procesa el servicio de voz del navegador (Google en Chrome,
   Apple en Safari): Lana Rosa no recibe ni guarda el audio. Antes de la primera vez se le muestra el aviso de la abogada (punto 9 de herramientas/legal/RESPUESTA-ABOGADA-2026-11.md, E31, 5-nov-2026):
   una ventana propia (no la del navegador) con «Continuar» y «Ahora no»; se recuerda en `localStorage.lrVozAviso2` (el aviso anterior, `lrVozAviso`, ya no cuenta: todas las personas ven el texto nuevo una vez). */
(function () {
  'use strict';
  var N = window.lrAgendaNucleo, zona = document.getElementById('agenda');
  if (!N || !zona) return;
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  var botones = Array.prototype.slice.call(document.querySelectorAll('[data-voz="dictar"]'));
  var ultimo = null, rec = null, activo = false, destino = null, base = '', estados = Array.prototype.slice.call(document.querySelectorAll('.voz-estado'));
  var AVISO = 'lrVozAviso2';

  function decir(t) { estados.forEach(function (e) { e.textContent = t || ''; }); }
  function poner(b, on) { b.textContent = on ? '⏹️ Dejar de escuchar' : (b.dataset.texto || '🎤 Hablar para escribir'); b.setAttribute('aria-pressed', String(!!on)); }
  botones.forEach(function (b) { b.dataset.texto = b.textContent; b.setAttribute('aria-pressed', 'false'); });
  /* En computador, al escribir en una casilla aparece «Dictar» junto a ella. En celular y tableta no: el teclado ya trae el micrófono y la escritura a mano (1-nov-2026, pedido de Jennifer). */
  var chip = null;
  if (SR && window.matchMedia && window.matchMedia('(pointer: fine)').matches) {
    chip = document.createElement('button'); chip.type = 'button'; chip.className = 'voz-chip no-imprimir'; chip.dataset.voz = 'dictar'; chip.textContent = '🎤 Dictar'; chip.hidden = true;
    chip.setAttribute('aria-label', 'Dictar en esta casilla'); chip.dataset.texto = chip.textContent; chip.setAttribute('aria-pressed', 'false'); document.body.appendChild(chip); botones.push(chip);
  }
  function ubicarChip() {
    if (!chip) return; var el = ultimo;
    if (!el || !document.body.contains(el) || !(el === document.activeElement || activo) || el.offsetParent === null) { if (!activo) chip.hidden = true; return; }
    var r = el.getBoundingClientRect(); if (r.bottom < 60 || r.top > innerHeight - 40) { chip.hidden = true; return; }
    chip.hidden = false; var w = chip.offsetWidth || 96, top = r.top - 34 > 70 ? r.top - 34 : r.bottom + 4;
    chip.style.top = Math.round(top) + 'px'; chip.style.left = Math.round(Math.max(8, Math.min(innerWidth - w - 8, r.right - w))) + 'px';
  }
  if (chip) {
    zona.addEventListener('focusin', function () { setTimeout(ubicarChip, 0); });
    zona.addEventListener('focusout', function () { setTimeout(ubicarChip, 250); });
    window.addEventListener('scroll', function () { requestAnimationFrame(ubicarChip); }, true); window.addEventListener('resize', ubicarChip);
  }
  var SELECTOR = 'textarea[data-guardar], input[data-guardar]:not([type="checkbox"]):not([type="hidden"])';
  var SELECTOR_VOZ = 'textarea, input[type="text"], input:not([type])';
  zona.addEventListener('focusin', function (e) { var el = e.target; if (el.matches && (el.matches(SELECTOR) || (el.matches(SELECTOR_VOZ) && !el.readOnly && !el.disabled && el.id !== 'buscar-agenda'))) ultimo = el; });

  function comandos(t) {
    return t.replace(/\s*\b(nueva línea|salto de línea)\b\s*/gi, '\n').replace(/\s*\bpunto y aparte\b\s*/gi, '.\n').replace(/\s+\bcoma\b/gi, ',');
  }
  function mayus(base, t) { return (!base || /[.!?]\s*$|\n\s*$/.test(base)) ? t.charAt(0).toUpperCase() + t.slice(1) : t; }
  function escribir(extra) {
    destino.value = base + (extra ? (base && !/[\s\n]$/.test(base) ? ' ' : '') + extra : '');
    destino.dispatchEvent(new Event('input', { bubbles: true }));
  }
  function parar(mensaje) {
    activo = false; if (rec) { try { rec.onend = null; rec.stop(); } catch (e) {} rec = null; }
    botones.forEach(function (b) { poner(b, false); }); decir(mensaje === undefined ? 'Listo ✓' : mensaje);
  }
  function objetivo(boton) {
    var ideas = boton.closest('#mis-ideas');
    if (ideas) {
      /* en esta hoja siempre se escribe en «Mi idea o pensamiento» de la ficha que se está usando */
      var tr = ultimo && ideas.contains(ultimo) ? ultimo.closest('tr.ficha') : null;
      if (!tr || tr.hidden || !tr.classList.contains('abierta')) tr = ideas.querySelector('tr.ficha.abierta:not([hidden])');
      if (!tr && window.lrFichas) { window.lrFichas.agregar('tabla-ideas'); tr = ideas.querySelector('tr.ficha.abierta:not([hidden])'); }
      return tr ? tr.querySelector('textarea[id$="-nota"]') : null;
    }
    return ultimo && document.body.contains(ultimo) ? ultimo : null;
  }
  function empezar(boton) {
    if (!SR) { decir('Tu navegador no permite dictar aquí. Usa el micrófono del teclado de tu celular.'); return; }
    destino = objetivo(boton);
    if (!destino) { decir('Toca primero la casilla donde quieres escribir y luego «Dictar».'); return; }
    var visto = false; try { visto = !!localStorage.getItem(AVISO); } catch (e) { visto = true; }
    if (!visto) { avisar(boton, function () { try { localStorage.setItem(AVISO, '1'); } catch (e) {} continuar(boton); }); return; }
    continuar(boton);
  }
  /* Ventana de aviso (accesible, propia): la usan el aviso del micrófono (texto de la abogada, sin cambios) y el del lápiz (E31, 6-nov-2026).
     window.lrAviso({ titulo, texto, si, no, foco, alCerrar(aceptó) }): sin `no` solo lleva el botón «si» (aviso informativo). */
  function aviso(op) {
    var dlg = document.createElement('div'); dlg.className = 'mc-dlg no-imprimir voz-aviso'; dlg.setAttribute('role', 'dialog'); dlg.setAttribute('aria-modal', 'true'); dlg.setAttribute('aria-labelledby', 'voz-aviso-tit'); dlg.setAttribute('aria-describedby', 'voz-aviso-txt');
    var caja = document.createElement('div'); caja.className = 'mc-caja';
    var h = document.createElement('h2'); h.id = 'voz-aviso-tit'; h.textContent = op.titulo; caja.appendChild(h);
    var t = document.createElement('p'); t.id = 'voz-aviso-txt'; t.className = 'voz-aviso-txt'; t.textContent = op.texto; caja.appendChild(t);
    var f = document.createElement('div'); f.className = 'voz-aviso-botones';
    var no = null, si = document.createElement('button'); si.type = 'button'; si.className = 'boton-primario'; si.textContent = op.si || 'Continuar';
    if (op.no) { no = document.createElement('button'); no.type = 'button'; no.className = 'boton-secundario'; no.textContent = op.no; f.appendChild(no); }
    f.appendChild(si); caja.appendChild(f); dlg.appendChild(caja); document.body.appendChild(dlg); document.body.classList.add('mc-abierto');
    function cerrar(acepto) {
      document.removeEventListener('keydown', teclas, true); if (dlg.parentNode) dlg.parentNode.removeChild(dlg); document.body.classList.remove('mc-abierto');
      if (op.alCerrar) op.alCerrar(acepto);
      else if (!acepto && op.foco) { try { op.foco.focus({ preventScroll: true }); } catch (e) {} }
    }
    function teclas(e) {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); cerrar(!no); }
      else if (e.key === 'Tab') { e.preventDefault(); if (no) (document.activeElement === si ? no : si).focus(); else si.focus(); }
    }
    if (no) no.addEventListener('click', function () { cerrar(false); }); si.addEventListener('click', function () { cerrar(true); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) cerrar(!no); });
    document.addEventListener('keydown', teclas, true); si.focus();
  }
  window.lrAviso = aviso;
  function avisar(boton, seguir) {
    aviso({ titulo: 'Antes de dictar', si: 'Continuar', no: 'Ahora no', foco: boton, alCerrar: function (acepto) { if (acepto) seguir(); else { try { boton.focus({ preventScroll: true }); } catch (e) {} } },
      texto: 'La función «Hablar para escribir» utiliza el servicio de reconocimiento de voz disponible en su navegador o dispositivo. El audio puede ser procesado por el proveedor de dicho servicio, de acuerdo con sus propias condiciones y políticas de privacidad. Lana Rosa Crochet no recibe ni almacena directamente las grabaciones de audio. Puede utilizar esta función de manera opcional.' });
  }
  function continuar(boton) {
    base = destino.value; activo = true; botones.forEach(function (b) { poner(b, b === boton); });
    destino.focus({ preventScroll: true });
    function iniciar() {
      rec = new SR(); rec.lang = (window.lrI18n && window.lrI18n.voz) || 'es-CO'; rec.continuous = true; rec.interimResults = true;
      rec.onresult = function (ev) {
        var parcial = '';
        for (var i = ev.resultIndex; i < ev.results.length; i++) {
          var t = comandos(ev.results[i][0].transcript.trim());
          if (ev.results[i].isFinal) { base = base + (base && t && !/[\s\n]$/.test(base) && t.charAt(0) !== '\n' ? ' ' : '') + mayus(base, t); destino.value = base; } else parcial += ' ' + t;
        }
        escribir(parcial.trim());
      };
      rec.onerror = function (ev) {
        if (ev.error === 'no-speech' || ev.error === 'aborted') return;
        var m = ev.error === 'not-allowed' || ev.error === 'service-not-allowed' ? 'No tengo permiso para usar el micrófono. Actívalo en la configuración del navegador.' : (ev.error === 'network' ? 'No pude conectar con el servicio de voz del navegador. Intenta de nuevo.' : 'No pude escucharte. Intenta de nuevo.');
        parar(m);
      };
      rec.onend = function () { if (activo) { try { iniciar(); } catch (e) { parar(); } } };   // el navegador corta la escucha cada tanto: se reanuda sola
      rec.start();
    }
    try { iniciar(); decir('Escuchando… di tu idea.'); } catch (e) { parar('No pude empezar a escuchar.'); }
  }
  botones.forEach(function (b) { b.addEventListener('mousedown', function (e) { e.preventDefault(); }); b.addEventListener('click', function () { if (activo) parar(); else empezar(b); }); });
  window.addEventListener('pagehide', function () { if (activo) parar(''); });
  window.lrVoz = { activo: function () { return activo; }, soportado: !!SR };
})();
