/* Agenda para tejedoras: promociones del ecosistema Lana Rosa (28-oct-2026).
   Cada bloque .promo-eco muestra tarjetas de la Tienda, la Mercería, Academy, Rosina o YouTube. Es publicidad propia: sin servicios externos ni datos de la persona.
   data-hoja = hoja donde está (para medir y variar), data-cuantas = cuántas tarjetas (por defecto 2), data-modo="todas" muestra todo el catálogo.
   Las tarjetas cambian cada día y según la hoja. Cada clic se mide como `promo_agenda_click` en Tag Manager (solo con consentimiento). */
(function () {
  'use strict';
  var WA = 'https://wa.me/573205072801?text=';
  var PROMOS = [
    { id: 'tienda', ic: '🧸', t: 'Amigurumis hechos a mano', x: 'Piezas únicas tejidas en crochet por Lana Rosa, listas para regalar.', u: '/tienda.html', b: 'Ver la Tienda' },
    { id: 'personaliza', ic: '💝', t: 'Tu historia en crochet', x: 'Cuéntanos tu idea y la tejemos: amigurumis personalizados a partir de tu foto.', u: '/personaliza.html', b: 'Personalizar el mío' },
    { id: 'merceria', ic: '🧶', t: 'Mercería Lana Rosa', x: 'Lanas, hilos y agujas elegidos para tejer sin sorpresas.', u: '/merceria/', b: 'Ir a la Mercería' },
    { id: 'paleta', ic: '🎨', t: 'Mira los colores reales', x: 'La paleta de la Mercería con la foto exacta de cada ovillo, su marca y su metraje.', u: '/merceria/paleta-de-colores/', b: 'Ver la paleta' },
    { id: 'clases', ic: '👩‍🏫', t: 'Clases personalizadas', x: 'Aprende crochet con acompañamiento, a tu ritmo y cuando tú quieras, en Villamaría.', hoja: 'aprende-compra', b: 'Pedir mi clase' },
    { id: 'taller', ic: '🎓', t: 'Taller «Desconecta para Conectar»', x: 'Tres horas para tejer acompañada y salir con tu pieza terminada. Sin experiencia previa.', u: '/academy/talleres/', b: 'Ver el taller' },
    { id: 'patrones', ic: '📚', t: 'Patrones en PDF', x: 'Compra un patrón, descárgalo desde tu cuenta y encuéntralo en tu agenda.', hoja: 'aprende-compra', b: 'Ver los patrones' },
    { id: 'youtube', ic: '▶️', t: 'Clases gratis en YouTube', x: 'Aprende puntos y proyectos paso a paso en el canal de Lana Rosa Academy.', u: 'https://www.youtube.com/@LanaRosaAcademy', b: 'Ver el canal', ext: true },
    { id: 'rosina', ic: '🐑', t: 'Rosina te ayuda a regalar', x: 'Dile a Rosina para quién es el regalo y te muestra ideas reales de la Tienda.', u: '/universo-rosina.html', b: 'Hablar con Rosina' },
    { id: 'recursos', ic: '🎁', t: 'Material gratis de Rosina', x: 'Glosario, paletas, calculadoras y fondos de pantalla para tejedoras.', u: '/recursos-rosina.html', b: 'Ver el material' },
    { id: 'revista', ic: '📰', t: 'La Revista de Lana Rosa', x: 'Tips de tejido, cuidado de tus piezas y ideas para tu emprendimiento.', u: '/revista.html', b: 'Leer la Revista' }
  ];
  function hash(t) { var h = 7; for (var i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) % 100003; return h; }
  function diaDelAnio() { var h = new Date(), ini = new Date(h.getFullYear(), 0, 0); return Math.floor((h - ini) / 86400000); }
  function ir(hoja) { var a = document.querySelector('#menu-hojas-lista a[data-hoja="' + hoja + '"]'); if (a) a.click(); else location.hash = '#' + hoja; }
  function medir(p, hoja) { (window.dataLayer = window.dataLayer || []).push({ event: 'promo_agenda_click', promo: p.id, hoja: hoja || '' }); }

  function tarjeta(p, hoja) {
    var a = document.createElement(p.hoja ? 'button' : 'a'); a.className = 'promo-tarjeta';
    if (p.hoja) a.type = 'button'; else { a.href = p.u; if (p.ext) { a.target = '_blank'; a.rel = 'noopener'; } }
    a.dataset.promo = p.id;
    var ic = document.createElement('span'); ic.className = 'promo-ic'; ic.setAttribute('aria-hidden', 'true'); ic.textContent = p.ic;
    var c = document.createElement('span'); c.className = 'promo-txt';
    var t = document.createElement('strong'); t.textContent = p.t; var x = document.createElement('small'); x.textContent = p.x;
    var b = document.createElement('span'); b.className = 'promo-btn'; b.textContent = p.b + ' →';
    c.appendChild(t); c.appendChild(x); c.appendChild(b); a.appendChild(ic); a.appendChild(c);
    a.addEventListener('click', function () { medir(p, hoja); if (p.hoja) ir(p.hoja); });
    return a;
  }
  function montar(caja) {
    var hoja = caja.dataset.hoja || '', modo = caja.dataset.modo, n = parseInt(caja.dataset.cuantas || '2', 10);
    var excluir = (caja.dataset.excluir || '').split(',');
    var lista = PROMOS.filter(function (p) { return excluir.indexOf(p.id) < 0 && p.hoja !== hoja; });
    var elegidas;
    if (modo === 'todas') elegidas = lista;
    else { var ini = (diaDelAnio() + hash(hoja)) % lista.length; elegidas = []; for (var i = 0; i < n && i < lista.length; i++) elegidas.push(lista[(ini + i) % lista.length]); }
    caja.textContent = '';
    if (modo !== 'todas') { var e = document.createElement('p'); e.className = 'promo-etq'; e.textContent = 'Del mundo Lana Rosa'; caja.appendChild(e); }
    var g = document.createElement('div'); g.className = 'promo-grid';
    elegidas.forEach(function (p) { g.appendChild(tarjeta(p, hoja)); }); caja.appendChild(g);
  }
  document.querySelectorAll('.promo-eco').forEach(montar);
  window.lrPromos = { catalogo: PROMOS, wa: WA, ir: ir };
})();
