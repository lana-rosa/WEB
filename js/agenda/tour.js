/* Agenda para tejedoras: tour de bienvenida (29-oct-2026, pedido de Sara: «cuando alguien ingrese por primera vez le hacemos un tour»).
   8 pasos: bienvenida, configuración, copias, Google Calendar, instalar la app, pestañas y hojas, dictar/lápiz/buscador y funciones avanzadas.
   Sale solo la primera vez (se recuerda en `localStorage.lrAgendaTour`) y se repite con «Ver el tour de bienvenida» en Configuración o con `?tour=1`; `?tour=0` lo omite.
   No sale si el navegador es automático (`navigator.webdriver`: las pruebas) salvo con `?tour=1`. Un foco recorta la pantalla alrededor del elemento y una tarjeta explica el paso. */
(function () {
  'use strict';
  var PASOS = [
    { t: '¡Bienvenida a tu agenda! 🌿', x: 'Te muestro en un minuto lo más importante. Puedes saltar el tour cuando quieras y volver a verlo desde ⚙️ Configuración.' },
    { t: 'Configuración ⚙️', x: 'Aquí escribes tu nombre, eliges el color de tu agenda entre 7 verdes y encuentras imprimir y borrar lo escrito.', sel: ['#agenda-config'], abrir: true },
    { t: 'Copias de tu agenda', x: 'Tu agenda se guarda en este dispositivo. Descarga una copia, cárgala en otro aparato o actívala en tu cuenta (gratis y opcional) para recuperarla si borras el historial del navegador.', sel: ['.agenda-config .copia-agenda'], abrir: true },
    { t: 'Google Calendar 📅', x: 'Conéctalo y tus entregas, proyectos, ferias y cumpleaños aparecen solos en un calendario aparte llamado «Agenda para tejedoras», con recordatorio. Es gratis y opcional (necesitas tu cuenta).', sel: ['#calendario-sync'], abrir: true },
    { t: 'Instala la app 📲', x: 'Instálala para abrirla desde su propio ícono y usarla aun sin internet. En computador y Android: el botón «Instalar» de la barra de direcciones o el menú del navegador. En iPhone: Compartir → «Añadir a pantalla de inicio».', sel: ['#instalar-agenda'] },
    { t: 'Pestañas y hojas', x: 'Las pestañas de la derecha (Inicio, Tablero, Proyectos…) agrupan las hojas. Al elegir una pestaña, escoge la hoja en la lista «Hojas de…». El Índice de Inicio las muestra todas.', sel: ['#pestanas-agenda', '#selector-hoja'] },
    { t: 'Escribir hablando, a mano y buscar', x: '🎤 Dictar: toca una casilla y luego «Dictar» para escribir con tu voz (el audio lo procesa tu navegador, no lo guardamos). ✏️ Lápiz: escribe o dibuja sobre la hoja con lápiz digital o mouse; el dedo solo mueve la página, salvo que actives «Dedo». 🔍 El buscador encuentra cualquier cosa que hayas escrito.', sel: ['.buscar-fijo'] },
    { t: 'Funciones avanzadas ✨', x: 'Planeador del día y tablero con tus números · pedidos con saldos y WhatsApp · ventas y gastos por mes · Diseña tu patrón · prendas a medida con maniquí · mercería y clases en «Aprende y compra» · exportar a Excel · y en cada hoja, «Agregar ficha» para sumar las que necesites.', final: true }
  ];
  var q = new URLSearchParams(location.search).get('tour'), paso = 0, capa, foco, tarjeta, abrioPanel = false, activo = false;
  function visto() { try { return !!localStorage.getItem('lrAgendaTour'); } catch (e) { return true; } }
  function marcar(como) { try { localStorage.setItem('lrAgendaTour', como + ':' + new Date().toISOString().slice(0, 10)); } catch (e) {} (window.dataLayer = window.dataLayer || []).push({ event: 'resource_use', recurso: 'agenda_tour', accion: como }); }
  function visible(el) { return el && !el.hidden && el.getClientRects().length > 0; }
  function buscar(sels) { for (var i = 0; sels && i < sels.length; i++) { var e = document.querySelector(sels[i]); if (visible(e)) return e; } return null; }
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function construir() {
    capa = el('div', 'tour-capa'); foco = el('div', 'tour-foco'); tarjeta = el('div', 'tour-tarjeta');
    tarjeta.setAttribute('role', 'dialog'); tarjeta.setAttribute('aria-modal', 'true'); tarjeta.setAttribute('aria-labelledby', 'tour-titulo'); tarjeta.setAttribute('aria-describedby', 'tour-texto');
    document.body.appendChild(capa); document.body.appendChild(foco); document.body.appendChild(tarjeta);
  }
  function cerrar(como) {
    if (!activo) return; activo = false; marcar(como);
    [capa, foco, tarjeta].forEach(function (e) { if (e && e.parentNode) e.parentNode.removeChild(e); });
    document.removeEventListener('keydown', teclas); window.removeEventListener('resize', colocar); window.removeEventListener('scroll', colocar, true);
    if (abrioPanel && window.lrAgendaConfig) window.lrAgendaConfig.cerrar(); abrioPanel = false;
    window.scrollTo({ top: 0 });
    var b = document.getElementById('agenda-config-btn'); if (b) b.focus({ preventScroll: true });
  }
  function teclas(e) { if (e.key === 'Escape') cerrar('saltado'); else if (e.key === 'ArrowRight') siguiente(); else if (e.key === 'ArrowLeft') atras(); }
  function colocar() {
    if (!activo) return; var P = PASOS[paso], objetivo = buscar(P.sel), vw = window.innerWidth, vh = window.innerHeight;
    var angosto = vw < 640;
    if (!objetivo) { foco.style.display = 'none'; capa.classList.add('tour-sin-foco'); tarjeta.style.cssText = 'left:50%;top:50%;transform:translate(-50%,-50%);width:' + Math.min(400, vw - 24) + 'px'; return; }
    capa.classList.remove('tour-sin-foco'); foco.style.display = 'block';
    var r = objetivo.getBoundingClientRect(), pad = 8, t = Math.max(6, r.top - pad), l = Math.max(6, r.left - pad), b = Math.min(vh - 6, r.bottom + pad), rr = Math.min(vw - 6, r.right + pad);
    foco.style.cssText = 'display:block;top:' + t + 'px;left:' + l + 'px;width:' + (rr - l) + 'px;height:' + Math.max(30, b - t) + 'px';
    var alto = tarjeta.offsetHeight, ancho = Math.min(380, vw - 24), libreAbajo = vh - b, libreArriba = t;
    if (angosto || (b - t) > vh * 0.55 || (libreAbajo < alto + 16 && libreArriba < alto + 16)) tarjeta.style.cssText = 'left:50%;bottom:12px;top:auto;transform:translateX(-50%);width:' + (vw - 24) + 'px;max-width:420px';
    else if (libreAbajo >= alto + 16) tarjeta.style.cssText = 'left:' + Math.max(12, Math.min(vw - ancho - 12, l)) + 'px;top:' + (b + 12) + 'px;transform:none;width:' + ancho + 'px';
    else tarjeta.style.cssText = 'left:' + Math.max(12, Math.min(vw - ancho - 12, l)) + 'px;top:' + (t - alto - 12) + 'px;transform:none;width:' + ancho + 'px';
  }
  function mostrar() {
    var P = PASOS[paso]; tarjeta.textContent = '';
    if (P.abrir && window.lrAgendaConfig) { if (document.getElementById('agenda-config').hidden) abrioPanel = true; window.lrAgendaConfig.abrir(); }
    else if (!P.abrir && abrioPanel && window.lrAgendaConfig) { window.lrAgendaConfig.cerrar(); abrioPanel = false; }
    var objetivo = buscar(P.sel);
    if (objetivo) { var y = objetivo.getBoundingClientRect().top + window.scrollY - 96; window.scrollTo({ top: Math.max(0, y) }); }
    var cab = el('p', 'tour-paso', 'Paso ' + (paso + 1) + ' de ' + PASOS.length), h = el('h2', 'tour-titulo', P.t), p = el('p', 'tour-texto', P.x);
    h.id = 'tour-titulo'; p.id = 'tour-texto';
    var fila = el('div', 'tour-botones'), salt = el('button', 'tour-saltar', P.final ? 'Cerrar' : 'Saltar tour'), at = el('button', 'tour-atras', '← Atrás'), sig = el('button', 'tour-siguiente', P.final ? '¡Listo!' : 'Siguiente →');
    [salt, at, sig].forEach(function (b) { b.type = 'button'; });
    salt.addEventListener('click', function () { cerrar(P.final ? 'completo' : 'saltado'); }); at.addEventListener('click', atras); sig.addEventListener('click', siguiente);
    if (paso === 0) at.hidden = true; if (P.final) salt.hidden = true;
    fila.appendChild(salt); fila.appendChild(at); fila.appendChild(sig);
    var puntos = el('div', 'tour-puntos'); puntos.setAttribute('aria-hidden', 'true'); PASOS.forEach(function (_, i) { puntos.appendChild(el('i', i === paso ? 'on' : '')); });
    tarjeta.appendChild(cab); tarjeta.appendChild(h); tarjeta.appendChild(p); tarjeta.appendChild(puntos); tarjeta.appendChild(fila);
    setTimeout(function () { colocar(); sig.focus({ preventScroll: true }); }, 60); colocar();
  }
  function siguiente() { if (paso >= PASOS.length - 1) { cerrar('completo'); return; } paso++; mostrar(); }
  function atras() { if (paso > 0) { paso--; mostrar(); } }
  function iniciar() {
    if (activo) return; activo = true; paso = 0; abrioPanel = false; construir();
    document.addEventListener('keydown', teclas); window.addEventListener('resize', colocar); window.addEventListener('scroll', colocar, true); mostrar();
  }
  window.lrAgendaTour = { iniciar: iniciar };
  var b = document.getElementById('agenda-tour-btn'); if (b) b.addEventListener('click', function () { if (window.lrAgendaConfig) window.lrAgendaConfig.cerrar(); iniciar(); });
  var auto = q === '1' || (q !== '0' && !visto() && !navigator.webdriver);
  if (auto) setTimeout(function () { if (document.getElementById('agenda')) iniciar(); }, 1800);
})();
