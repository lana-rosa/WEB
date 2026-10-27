/* Agenda para tejedoras: escribir hablando (27-oct-2026).
   Usa el reconocimiento de voz del navegador (Web Speech API). El audio lo procesa el servicio de voz del navegador (Google en Chrome,
   Apple en Safari): Lana Rosa no recibe ni guarda el audio. Antes de la primera vez se le avisa a la persona. */
(function () {
  'use strict';
  var N = window.lrAgendaNucleo, zona = document.getElementById('agenda');
  if (!N || !zona) return;
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  var botones = Array.prototype.slice.call(document.querySelectorAll('[data-voz="dictar"]'));
  var ultimo = null, rec = null, activo = false, destino = null, base = '', estados = Array.prototype.slice.call(document.querySelectorAll('.voz-estado'));
  var AVISO = 'lrVozAviso';

  function decir(t) { estados.forEach(function (e) { e.textContent = t || ''; }); }
  function poner(b, on) { b.textContent = on ? '⏹️ Dejar de escuchar' : (b.dataset.texto || '🎤 Hablar para escribir'); b.setAttribute('aria-pressed', String(!!on)); }
  botones.forEach(function (b) { b.dataset.texto = b.textContent; b.setAttribute('aria-pressed', 'false'); });
  var SELECTOR = 'textarea[data-guardar], input[data-guardar]:not([type="checkbox"]):not([type="hidden"])';
  zona.addEventListener('focusin', function (e) { var el = e.target; if (el.matches && el.matches(SELECTOR)) ultimo = el; });

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
    try { if (!localStorage.getItem(AVISO)) { if (!confirm('Al dictar, el audio lo procesa el servicio de voz de tu navegador (Google en Chrome, Apple en Safari). Lana Rosa no recibe ni guarda el audio.\n\n¿Quieres continuar?')) return; localStorage.setItem(AVISO, '1'); } } catch (e) {}
    base = destino.value; activo = true; botones.forEach(function (b) { poner(b, b === boton); });
    destino.focus({ preventScroll: true });
    function iniciar() {
      rec = new SR(); rec.lang = 'es-CO'; rec.continuous = true; rec.interimResults = true;
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
