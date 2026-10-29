// Rosina en la web: botón flotante + chat de ayuda para dudas de uso de la página.
(function () {
  'use strict';
  var URL_CHAT = 'https://ngjoognzvehwjtpqwrqe.supabase.co/functions/v1/rosina-web';
  var KEY = 'sb_publishable_2TQ_piaHlSMHa79zjmOOXg_6bEwgkKD';
  var pag = location.pathname.split('/').filter(Boolean).pop() || '';
  // El chat sale en todas las páginas, también en las de Rosina (hubs, glosario, paletas, Conoce a Rosina…), salvo gracias y 404.
  if (/^(gracias|404)(\.html)?$/.test(pag)) return;

  var css = document.createElement('style');
  css.textContent =
    '.rc-boton{position:fixed;right:calc(24px + env(safe-area-inset-right,0px));bottom:calc(94px + env(safe-area-inset-bottom,0px));z-index:996;width:58px;height:58px;border-radius:50%;border:3px solid #fff;background:var(--rosa-suave,#FBE4EF);box-shadow:0 6px 18px rgba(0,0,0,.2);padding:0;cursor:pointer;overflow:hidden}' +
    '.rc-boton img{width:100%;height:100%;object-fit:cover;display:block}' +
    '@media(max-width:600px){.rc-boton{right:calc(16px + env(safe-area-inset-right,0px));bottom:calc(72px + env(safe-area-inset-bottom,0px));width:46px;height:46px}}' +
    '.rc-panel{position:fixed;z-index:1001;left:0;right:0;bottom:0;top:0;display:none;flex-direction:column;background:#fff;font-family:"Hanken Grotesk",system-ui,sans-serif;color:#45454A}' +
    '.rc-panel.abierto{display:flex}' +
    '.rc-cab{display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--rosa-principal,#E74E96);color:#fff}' +
    '.rc-cab img{width:40px;height:40px;border-radius:50%;object-fit:cover;background:#fff}' +
    '.rc-cab b{font-family:"DynaPuff",system-ui,sans-serif;font-size:1.05rem;display:block;line-height:1.1}' +
    '.rc-cab small{opacity:.9;font-size:.78rem}' +
    '.rc-cab button{margin-left:auto;background:none;border:none;color:#fff;font-size:1.8rem;line-height:1;cursor:pointer;padding:4px 8px}' +
    '.rc-msgs{flex:1;overflow-y:auto;padding:14px;background:var(--rosa-suave,#FBE4EF);-webkit-overflow-scrolling:touch}' +
    '.rc-m{display:flex;margin-bottom:10px}.rc-m.yo{justify-content:flex-end}' +
    '.rc-m div{max-width:86%;padding:9px 12px;border-radius:14px;background:#fff;white-space:pre-wrap;line-height:1.4;font-size:.95rem;word-wrap:break-word}' +
    '.rc-m.yo div{background:var(--rosa-principal,#E74E96);color:#fff}' +
    '.rc-m a{color:inherit;text-decoration:underline}' +
    '.rc-cards{display:flex;flex-direction:column;gap:8px;margin:-2px 0 12px}' +
    '.rc-card{display:flex;gap:10px;align-items:center;background:#fff;border-radius:14px;padding:8px;text-decoration:none;color:inherit;border:2px solid transparent;box-shadow:0 1px 4px rgba(0,0,0,.08)}' +
    '.rc-card:hover,.rc-card:focus-visible{border-color:var(--rosa-principal,#E74E96);outline:none}' +
    '.rc-card img{width:56px;height:70px;object-fit:cover;border-radius:10px;background:var(--rosa-suave,#FBE4EF);flex:none}' +
    '.rc-card span{display:block;min-width:0}.rc-card b{display:block;font-size:.92rem;line-height:1.2}' +
    '.rc-card .rc-p{color:#B3175F;font-weight:700;font-size:.9rem;margin-top:2px}' +
    '.rc-card .rc-e{display:inline-block;font-size:.74rem;padding:2px 8px;border-radius:8px;background:#E8F5E9;margin-top:3px}.rc-card .rc-e.enc{background:var(--rosa-suave,#FBE4EF)}' +
    '.rc-card .rc-pj{font-size:.7rem;color:#64646A;margin-top:3px}' +
    '.rc-wa{display:inline-block;margin:-2px 0 12px;padding:9px 16px;border-radius:999px;background:#25D366;color:#073B1B;font-weight:700;font-size:.88rem;text-decoration:none}' +
    '.rc-wa:focus-visible{outline:3px solid var(--lila,#9EA2F9);outline-offset:2px}' +
    '.rc-sug{display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 10px}' +
    '.rc-sug button{border:1px solid var(--rosa-principal,#E74E96);background:#fff;color:var(--rosa-principal,#E74E96);border-radius:999px;padding:6px 11px;font-size:.84rem;cursor:pointer;font-family:inherit}' +
    '.rc-aviso{margin:0;padding:6px 14px 0;font-size:12px;line-height:1.35;color:#6b6b72;background:#fff}.rc-aviso a{color:inherit;text-decoration:underline}' +
    '.rc-form{display:flex;gap:8px;padding:10px 12px calc(10px + env(safe-area-inset-bottom,0px));border-top:1px solid #eee;background:#fff}' +
    '.rc-form input{flex:1;min-width:0;border:1px solid #ddd;border-radius:999px;padding:10px 14px;font-size:16px;font-family:inherit}' +
    '.rc-form button{border:none;border-radius:999px;background:var(--rosa-principal,#E74E96);color:#fff;padding:0 18px;font-weight:600;cursor:pointer;font-family:inherit}' +
    '.rc-form button:disabled{opacity:.5}' +
    '@media(min-width:700px){.rc-panel{right:16px;left:auto;top:auto;bottom:20px;width:380px;height:min(600px,calc(100vh - 40px));border-radius:18px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,.28)}}';
  document.head.appendChild(css);

  var dc = document.documentElement.getAttribute('data-casa');
  var casa = /^\/merceria(\/|$)/.test(location.pathname) ? 'merceria' : /^\/academy(\/|$)/.test(location.pathname) ? 'academy' : (dc === 'agenda' || /^\/agenda-rosina(\.html)?$/.test(location.pathname) ? 'agenda' : dc === 'academy' ? 'academy' : dc === 'merceria' ? 'merceria' : 'tienda');
  var SUG = {
    tienda: ['¿Qué amigurumi me recomiendan de regalo?', '¿Cómo funciona Personaliza?', '¿Cómo hago un pedido?', '¿Cómo pago?'],
    merceria: ['¿Qué lana usar para un amigurumi?', '¿Qué aguja uso con cada hilo?', '¿Qué necesito para empezar a tejer?', '¿Cuál es el horario de la tienda?'],
    agenda: ['¿Cómo hago una copia de mi agenda?', '¿Cómo conecto Google Calendar?', '¿Dónde encuentro cada hoja?', '¿Cómo uso el lápiz o dicto?'],
    academy: ['¿Cómo empiezo a tejer crochet?', '¿Cómo leo un patrón?', '¿Qué talleres tienen?', '¿Qué es el anillo mágico?']
  };
  var hist = [], ocupado = false, panel, msgs, input, enviar;
  function esc(t) { return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
  function formato(t) {
    return esc(t).replace(/\*\*([^*\n]+)\*\*/g, '<b>$1</b>')
      .replace(/(https?:\/\/[^\s<)]+[^\s<).,;:!?])/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
  }
  function burbuja(rol, texto) {
    var m = document.createElement('div'); m.className = 'rc-m ' + (rol === 'user' ? 'yo' : '');
    var d = document.createElement('div');
    if (rol === 'user') d.textContent = texto; else d.innerHTML = formato(texto);
    m.appendChild(d); msgs.appendChild(m); msgs.scrollTop = msgs.scrollHeight; return m;
  }
  function evento(nombre, datos) { try { (window.dataLayer = window.dataLayer || []).push(Object.assign({ event: nombre }, datos || {})); } catch (e) { /* sin medición */ } }
  var pesos = function (n) { return '$' + Math.round(Number(n) || 0).toLocaleString('es-CO'); };
  // Tarjetas de producto: el servidor solo manda ids que existen en el catálogo; aquí se arma todo con textContent (nada se inserta como HTML)
  // y el enlace se construye con el id, no con una dirección que venga en la respuesta.
  function tarjetas(lista) {
    if (!Array.isArray(lista) || !lista.length) return;
    function nombreSinMedida(n) { n = String(n == null ? '' : n); if (/^Amigurumi personalizado \d+ cm$/.test(n)) return n; return n.replace(/\s*\(\s*\d+(?:[.,]\d+)?\s*cm\s*\)/gi, '').replace(/\s*\d+(?:[.,]\d+)?\s*cm(?:\s*[*x×]\s*\d+(?:[.,]\d+)?\s*cm)?/gi, '').replace(/\s{2,}/g, ' ').trim(); }
  var cont = document.createElement('div'); cont.className = 'rc-cards';
    lista.filter(function (p) { return p && typeof p.id === 'string' && typeof p.nombre === 'string'; }).slice(0, 3).forEach(function (p, i) {
      var a = document.createElement('a'); a.className = 'rc-card'; a.href = '/tienda.html?producto=' + encodeURIComponent(p.id); a.target = '_blank'; a.rel = 'noopener';
      var img = document.createElement('img'); img.alt = ''; img.width = 56; img.height = 70; img.loading = 'lazy'; img.decoding = 'async';
      img.src = '/img/productos/' + encodeURIComponent(p.foto || ''); img.addEventListener('error', function () { img.style.visibility = 'hidden'; });
      img.addEventListener('load', function () { msgs.scrollTop = msgs.scrollHeight; });
      var txt = document.createElement('span');
      var nombre = document.createElement('b'); nombre.textContent = nombreSinMedida(p.nombre);
      var precio = document.createElement('span'); precio.className = 'rc-p'; precio.textContent = (p.estado === 'personalizado' ? 'Desde ' : '') + pesos(p.precio) + ' COP';
      var est = document.createElement('span'); est.className = 'rc-e' + (p.estado === 'existencia' ? '' : ' enc');
      est.textContent = p.estado === 'existencia' ? 'En existencia' : p.estado === 'personalizado' ? 'Se teje a partir de tu foto o idea' : 'Por encargo' + (typeof p.elaboracion === 'string' && p.elaboracion ? ' · ' + p.elaboracion : '');
      txt.append(nombre, precio, est);
      if (p.personaje && p.estado !== 'personalizado') { var pj = document.createElement('span'); pj.className = 'rc-pj'; pj.textContent = 'Pieza artesanal inspirada en un personaje; no es un producto oficial.'; txt.append(pj); }
      a.append(img, txt);
      a.addEventListener('click', function () { evento('rosina_tarjeta_clic', { item_id: p.id, posicion: i + 1 }); });
      cont.appendChild(a);
    });
    if (cont.children.length) { msgs.appendChild(cont); msgs.scrollTop = msgs.scrollHeight; evento('rosina_tarjetas', { n_tarjetas: cont.children.length }); }
  }
  // Cuando Rosina no tiene el dato, un botón lleva al equipo por WhatsApp (sin enviar lo que escribió la persona).
  function botonWhatsApp() {
    var a = document.createElement('a'); a.className = 'rc-wa'; a.target = '_blank'; a.rel = 'noopener';
    a.href = 'https://wa.me/573205072801?text=' + encodeURIComponent('Hola Lana Rosa 💕 Tengo una pregunta que no pude resolver en la página.');
    a.textContent = 'Escribir al equipo por WhatsApp';
    a.addEventListener('click', function () { evento('rosina_whatsapp'); });
    msgs.appendChild(a); msgs.scrollTop = msgs.scrollHeight; evento('rosina_sin_respuesta');
  }
  function construir() {
    panel = document.createElement('div'); panel.className = 'rc-panel';
    panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'Chat con Rosina');
    panel.innerHTML = '<div class="rc-cab"><img src="/img/mini/rosina-saludo.webp" alt="" width="40" height="40"><div><b>Rosina</b><small>Asistente de Lana Rosa</small></div><button type="button" aria-label="Cerrar chat">×</button></div>' +
      '<div class="rc-msgs"></div><p class="rc-aviso">No escribas datos personales (cédula, dirección, teléfono). Tu mensaje lo procesa un proveedor de inteligencia artificial. <a href="/politicas.html#ia-chat">Más información</a></p><form class="rc-form"><input type="text" maxlength="500" placeholder="Escribe tu pregunta…" aria-label="Tu pregunta" autocomplete="off"><button type="submit">Enviar</button></form>';
    document.body.appendChild(panel);
    msgs = panel.querySelector('.rc-msgs'); input = panel.querySelector('input'); enviar = panel.querySelector('.rc-form button');
    panel.querySelector('.rc-cab button').addEventListener('click', cerrar);
    panel.querySelector('form').addEventListener('submit', function (e) { e.preventDefault(); mandar(input.value); });
    burbuja('assistant', casa === 'agenda'
      ? '¡Hola! Soy Rosina 🌸 Te cuento cómo usar tu agenda: dónde está cada hoja, cómo configurarla, hacer copias, conectar Google Calendar y más. ¿Qué quieres saber?'
      : '¡Hola! Soy Rosina, la asistente de Lana Rosa 🌸 Te ayudo con nuestros productos, pedidos, envíos, talleres y dudas de la página. ¿Qué necesitas?');
    var s = document.createElement('div'); s.className = 'rc-sug';
    SUG[casa].forEach(function (q) {
      var b = document.createElement('button'); b.type = 'button'; b.textContent = q;
      b.addEventListener('click', function () { s.remove(); mandar(q); }); s.appendChild(b);
    });
    msgs.appendChild(s);
  }
  function abrir() {
    if (!panel) construir();
    panel.classList.add('abierto'); boton.style.display = 'none';
    var g = document.querySelector('.saludo-rosina'); if (g) g.remove();
    if (matchMedia('(min-width:700px)').matches) setTimeout(function () { input.focus(); }, 50);
  }
  function cerrar() { panel.classList.remove('abierto'); boton.style.display = ''; }
  function mandar(texto) {
    texto = (texto || '').trim(); if (!texto || ocupado) return;
    input.value = ''; burbuja('user', texto); hist.push({ role: 'user', content: texto });
    ocupado = true; enviar.disabled = true;
    var pens = burbuja('assistant', 'Pensando…');
    fetch(URL_CHAT, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: KEY }, body: JSON.stringify({ mensajes: hist.slice(-8), casa: casa }) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (x) {
        pens.remove();
        var t = x.ok && x.d.respuesta ? x.d.respuesta : (x.d.error || 'No pude responder ahora. Escríbenos por WhatsApp: https://wa.me/573205072801');
        burbuja('assistant', t); if (x.ok && x.d.respuesta) hist.push({ role: 'assistant', content: t }); else hist.pop();
        if (x.ok && x.d.respuesta) { tarjetas(x.d.productos); if (x.d.sin_dato === true) botonWhatsApp(); }
      })
      .catch(function () { pens.remove(); hist.pop(); burbuja('assistant', 'No pude conectarme. Escríbenos por WhatsApp: https://wa.me/573205072801'); })
      .then(function () { ocupado = false; enviar.disabled = false; });
  }

  var boton = document.createElement('button'); boton.type = 'button'; boton.className = 'rc-boton';
  boton.setAttribute('aria-label', 'Chatear con Rosina');
  boton.innerHTML = '<img src="/img/mini/rosina-saludo.webp" alt="" width="58" height="58">';
  boton.addEventListener('click', abrir);
  document.body.appendChild(boton);
  window.abrirRosinaChat = abrir;
})();
