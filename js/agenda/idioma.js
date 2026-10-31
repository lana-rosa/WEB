/* Agenda para tejedoras: idiomas (español, inglés y portugués; etapa 1, 31-oct-2026, pedido de Sara).
   El texto de la agenda sigue escrito en español en el HTML y en los módulos; este motor lo traduce en pantalla con un diccionario
   (/js/agenda/i18n/en.js y pt.js: «texto en español» → traducción). Lo que no está en el diccionario se queda en español, nunca se rompe.
   - Nunca toca lo que escribe la persona: casillas, áreas de texto, títulos de fichas (.ficha-cab) ni nada marcado con data-no-traducir.
   - El menú oculto #menu-hojas-lista se deja en español porque otros módulos leen de ahí los nombres de las hojas; lo que se pinta a partir
     de él (lista «Hojas de…», tarjetas de sección) sí se traduce.
   - Cambiar de idioma guarda la elección (localStorage.lrAgendaIdioma) y recarga la página. ?idioma=en|pt|es la fija para esa visita.
   - Entradas con {a}, {b}… son plantillas: «Hojas de {a} · {b} de {c}». Lo capturado también se traduce si está en el diccionario.
   API: window.lrI18n = { lang, t(texto), add(idioma, objeto), faltan() }. */
(function () {
  'use strict';
  var CLAVE = 'lrAgendaIdioma', PERMITIDOS = { es: 'es-CO', en: 'en', pt: 'pt-BR' };
  var ATRIBUTOS = ['aria-label', 'title', 'placeholder', 'alt', 'data-label', 'data-titulo'];   // data-label lo pinta el CSS (content: attr(data-label)); data-titulo es el nombre de los pasos de «Diseña tu patrón»
  var SALTAR = 'script, style, noscript, svg, textarea, [contenteditable], [data-no-traducir], #menu-hojas-lista, .ficha-titulo:not(.vacia), .agenda-idioma';
  var lang = 'es';
  try {
    var q = new URLSearchParams(location.search).get('idioma');
    if (q && PERMITIDOS[q]) { localStorage.setItem(CLAVE, q); }
    var g = localStorage.getItem(CLAVE); if (g && PERMITIDOS[g]) lang = g;
  } catch (e) { /* sin almacenamiento: queda en español */ }
  var dic = {}, plantillas = [];
  var original = new WeakMap(), originalAttr = new WeakMap();

  function norm(s) { return String(s).replace(/\s+/g, ' ').trim(); }
  // Se parte «⚙️ Configuración:» en prefijo (símbolos), núcleo y sufijo para buscar solo el núcleo.
  function partir(s) {
    var m = /^([^\p{L}\p{N}¿¡«"“(]*)([\s\S]*?)([\s:·|]*)$/u.exec(s);
    return m ? [m[1], m[2], m[3]] : ['', s, ''];
  }
  function buscar(core) {
    var d = dic;
    if (Object.prototype.hasOwnProperty.call(d, core)) return d[core];
    for (var i = 0; i < plantillas.length; i++) {
      var m = plantillas[i].re.exec(core);
      if (m) {
        var out = plantillas[i].to;
        for (var k = 1; k < m.length; k++) out = out.split('{' + plantillas[i].nombres[k - 1] + '}').join(tr(m[k]));
        return out;
      }
    }
    return null;
  }
  function tr(s) {
    if (lang === 'es' || s == null) return s;
    var txt = String(s); if (!/\p{L}/u.test(txt)) return txt;
    var p = partir(norm(txt)), r = buscar(p[1]);
    if (r == null) return txt;
    var ini = /^\s/.test(txt) ? ' ' : '', fin = /\s$/.test(txt) ? ' ' : '';
    return ini + p[0] + r + p[2] + fin;
  }
  function agregar(idioma, obj) {
    if (idioma !== lang) return;
    Object.keys(obj).forEach(function (k) {
      if (k.indexOf('{') < 0) { dic[norm(k)] = obj[k]; return; }
      // {x} = cualquier texto, {x#} = número, {x=a|b|c} = una de esas palabras (sin distinguir mayúsculas)
      var nombres = [], partes = norm(k).split(/(\{\w+(?:#|=[^}]*)?\})/), re = partes.map(function (t) {
        var m = /^\{(\w+)(#|=([^}]*))?\}$/.exec(t);
        if (!m) return t.replace(/[.*+?^$()|[\]\\{}]/g, '\\$&');
        nombres.push(m[1]); return m[2] === '#' ? '(\\d[\\d.,]*)' : m[3] ? '(' + m[3] + ')' : '(.+?)';
      }).join('');
      var to = obj[k];
      plantillas.push({ re: new RegExp('^' + re + '$', 'i'), nombres: nombres, to: to });
    });
    if (listo) pasar(document.body);
  }

  var observador = null, listo = false, pendiente = false, cola = [];
  function saltar(el) { return !el || (el.closest && el.closest(SALTAR)); }
  function textoNodo(n) {
    var padre = n.parentElement; if (saltar(padre)) return;
    var ant = original.get(n);
    if (ant && n.data === ant.out) return;           // ya está traducido y nadie lo tocó
    var src = n.data, out = tr(src);
    original.set(n, { es: src, out: out });
    // Una opción sin atributo value toma su valor del texto: se fija en español para que lo guardado no cambie con el idioma
    if (out !== src && padre.tagName === 'OPTION' && !padre.hasAttribute('value')) padre.setAttribute('value', norm(src));
    if (out !== src) n.data = out;
  }
  function atributos(el) {
    if (el.nodeType !== 1 || saltar(el)) return;
    for (var i = 0; i < ATRIBUTOS.length; i++) {
      var a = ATRIBUTOS[i]; if (!el.hasAttribute(a)) continue;
      var v = el.getAttribute(a), reg = originalAttr.get(el) || {}, ant = reg[a];
      if (ant && v === ant.out) continue;
      var out = tr(v); reg[a] = { es: v, out: out }; originalAttr.set(el, reg);
      if (out !== v) el.setAttribute(a, out);
    }
  }
  function pasar(raiz) {
    if (!raiz || lang === 'es') return;
    if (raiz.nodeType === 3) { textoNodo(raiz); return; }
    if (raiz.nodeType !== 1) return;
    if (saltar(raiz) && raiz !== document.body) return;
    atributos(raiz);
    var w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, null), n;
    while ((n = w.nextNode())) { if (n.nodeType === 3) textoNodo(n); else atributos(n); }
  }
  function vaciar() {
    pendiente = false; var c = cola; cola = [];
    c.forEach(function (n) { if (n.isConnected) pasar(n); });
    if (observador) observador.takeRecords();
  }
  function encolar(n) { cola.push(n); if (!pendiente) { pendiente = true; setTimeout(vaciar, 30); } }
  function observar() {
    observador = new MutationObserver(function (recs) {
      recs.forEach(function (r) {
        if (r.type === 'childList') r.addedNodes.forEach(function (n) { encolar(n); });
        else if (r.type === 'characterData') encolar(r.target);
        else if (r.type === 'attributes') encolar(r.target);
      });
    });
    observador.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATRIBUTOS });
  }

  // Selector de idioma junto al engranaje de Configuración
  function selector() {
    var ref = document.getElementById('agenda-config-btn'); if (!ref || document.getElementById('agenda-idioma')) return;
    var l = document.createElement('label'); l.className = 'agenda-idioma no-imprimir';
    l.innerHTML = '<span class="agenda-idioma-ic" aria-hidden="true"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/></svg></span>' +
      '<select id="agenda-idioma" aria-label="Idioma / Language / Idioma" title="Idioma / Language / Idioma"><option value="es">ES</option><option value="en">EN</option><option value="pt">PT</option></select>';
    ref.parentNode.insertBefore(l, ref);
    var s = l.querySelector('select'); s.value = lang;
    s.addEventListener('change', function () { try { localStorage.setItem(CLAVE, s.value); } catch (e) { /* sin almacenamiento */ } location.reload(); });
  }

  // Lo que queda sin traducir (para completar el diccionario). Solo se usa al preparar la traducción.
  // raiz: elemento donde buscar (por defecto, la página); todo: true = incluye lo que está oculto (fichas cerradas, ventanas)
  function faltan(raiz, todo) {
    var vistos = {}, lista = [], hecho = {}; Object.keys(dic).forEach(function (k) { hecho[norm(dic[k])] = 1; });
    raiz = raiz || document.body;
    var w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, null), n;
    function anota(txt, donde) {
      var t = norm(txt); if (!t || !/\p{L}/u.test(t)) return; var p = partir(t);
      if (!/\p{L}/u.test(p[1]) || buscar(p[1]) != null || hecho[p[1]] || vistos[p[1]]) return; vistos[p[1]] = 1; lista.push([p[1], donde]);
    }
    while ((n = w.nextNode())) {
      if (n.nodeType === 3) {
        var el = n.parentElement; if (saltar(el)) continue;
        if (!el || (!todo && !el.getClientRects().length)) continue;
        var rg = original.get(n); if (rg && rg.out !== rg.es && n.data === rg.out) continue;   // ya traducido
        anota(n.data, el.tagName.toLowerCase() + (el.id ? '#' + el.id : el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : ''));
      } else if (!saltar(n) && (todo || n.getClientRects().length)) {
        ATRIBUTOS.forEach(function (a) { if (!n.hasAttribute(a)) return; var r = (originalAttr.get(n) || {})[a]; if (r && r.out !== r.es && n.getAttribute(a) === r.out) return; anota(n.getAttribute(a), a); });
      }
    }
    return lista;
  }

  // Ventanas del navegador (alert, confirm, prompt): no son parte de la página, por eso se traducen aquí antes de mostrarlas
  if (lang !== 'es') {
    ['alert', 'confirm', 'prompt'].forEach(function (nombre) {
      var orig = window[nombre]; if (!orig) return;
      window[nombre] = function (msg) { var a = Array.prototype.slice.call(arguments); if (typeof a[0] === 'string') a[0] = tr(a[0]); return orig.apply(window, a); };
    });
  }
  // Idioma del dictado por voz (js/agenda/voz.js lo lee)
  var VOZ = { es: 'es-CO', en: 'en-US', pt: 'pt-BR' };

  window.lrI18n = { lang: lang, voz: VOZ[lang], t: tr, add: agregar, faltan: faltan, permitidos: PERMITIDOS };
  document.documentElement.setAttribute('lang', PERMITIDOS[lang]);

  function iniciar() {
    selector();
    if (lang === 'es') { listo = true; return; }
    var s = document.createElement('script'); s.src = '/js/agenda/i18n/' + lang + '.js?v=4';
    s.onload = s.onerror = function () { listo = true; pasar(document.body); observar(); document.title = tr(document.title); };
    document.head.appendChild(s);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
