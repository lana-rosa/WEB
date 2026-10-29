/* Agenda para tejedoras: tutorial de bienvenida (29-oct-2026, pedido de Sara: «cuando alguien ingrese por primera vez le hacemos un tour»; desde el 29-oct se llama «tutorial» en lo que se ve; el archivo, las clases y `?tour=` conservan el nombre técnico).
   8 pasos: bienvenida, configuración, copias, Google Calendar, instalar la app, pestañas y hojas, dictar/lápiz/buscador y funciones avanzadas.
   Sale solo la primera vez (se recuerda en `localStorage.lrAgendaTour`) y se repite con «Ver el tour de bienvenida» en Configuración o con `?tour=1`; `?tour=0` lo omite.
   No sale si el navegador es automático (`navigator.webdriver`: las pruebas) salvo con `?tour=1`. Un foco recorta la pantalla alrededor del elemento y una tarjeta explica el paso. */
(function () {
  'use strict';
  var PASOS = [
    { t: '¡Bienvenida a tu agenda! 🌿', x: 'Te muestro en un minuto lo más importante. Puedes saltar el tutorial cuando quieras y volver a verlo desde ⚙️ Configuración.' },
    { t: 'Configuración ⚙️', x: 'Personaliza tu agenda con tu nombre y tu color favorito. También puedes imprimir tu agenda o borrar lo que has escrito.', sel: ['#agenda-config'], abrir: true },
    { t: 'Copias de seguridad', x: 'Tu agenda se guarda en este dispositivo. Puedes descargar una copia de seguridad, importarla en otro dispositivo o vincularla a tu cuenta para recuperar tus escritos si borras el historial del navegador.', sel: ['.agenda-config .copia-agenda'], abrir: true },
    { t: 'Google Calendar 📅', x: 'Conecta tu cuenta de Google para sincronizar tus entregas, proyectos, ferias y cumpleaños con un calendario independiente llamado «Agenda para tejedoras». Recibe recordatorios para que no olvides ninguna fecha importante.\nLa conexión es gratuita y opcional. Solo necesitas tu cuenta de Google.', sel: ['#calendario-sync'], abrir: true },
    { t: 'Instala la app 📲', x: 'Añade la agenda a tu dispositivo para abrirla desde su propio ícono y acceder a ella incluso sin conexión a internet.\n💻 Computador y Android: busca la opción «Instalar» en la barra de direcciones o en el menú del navegador.\n📱 iPhone: pulsa «Compartir» y selecciona «Añadir a pantalla de inicio».\n¡Ten tu agenda siempre a mano!', sel: ['#instalar-agenda'] },
    { t: 'Pestañas y hojas 📑', x: 'Las pestañas de la derecha (Inicio, Tablero, Proyectos…) organizan tu agenda por secciones. Selecciona una pestaña y elige la hoja que quieras consultar en la lista «Hojas de…». ¿Quieres verlas todas? Encuéntralas en el Índice de Inicio.\n💎 Tienes 7 días gratis con todas las hojas. Después, Inicio, Tablero y Proyectos siguen gratis y las demás pestañas son con membresía desde $5.000 al mes.', sel: ['#pestanas-agenda', '#selector-hoja'] },
    { t: 'Dictado, escritura a mano y búsqueda ✍️', x: '🎤 Dictado por voz: selecciona una casilla y pulsa «Dictar» para convertir tu voz en texto. El audio lo procesa el servicio de voz de tu navegador y Lana Rosa no lo guarda.\n✏️ Lápiz digital: escribe o dibuja sobre la hoja con un lápiz digital o el mouse. Por defecto, el dedo sirve para desplazarte por la página; activa la opción «Dedo» si quieres escribir con él.\n🔍 Buscador: encuentra rápidamente cualquier texto que hayas escrito en tu agenda.', sel: ['.buscar-fijo'] },
    { t: 'Funciones avanzadas ✨', x: 'Organiza tu día, visualiza tus números en el tablero y lleva el control de tus pedidos, saldos y ventas. Registra gastos mensuales, escribe por WhatsApp a tus clientas con un toque y exporta tus datos a Excel.\nAdemás, puedes diseñar tus propios patrones, crear prendas a medida con ayuda del maniquí y explorar la mercería y las clases en «Aprende y compra».\n¿Necesitas más espacio? Usa la opción «Agregar ficha» en cada hoja para añadir todas las que necesites.', final: true }
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
    var cab = el('p', 'tour-paso', 'Paso ' + (paso + 1) + ' de ' + PASOS.length), h = el('h2', 'tour-titulo', P.t), p = el('div', 'tour-texto');
    P.x.split('\n').forEach(function (linea) { p.appendChild(el('p', null, linea)); });
    h.id = 'tour-titulo'; p.id = 'tour-texto';
    var fila = el('div', 'tour-botones'), salt = el('button', 'tour-saltar', P.final ? 'Cerrar' : 'Saltar tutorial'), at = el('button', 'tour-atras', '← Atrás'), sig = el('button', 'tour-siguiente', P.final ? '¡Listo!' : 'Siguiente →');
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
