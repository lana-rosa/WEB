/* Agenda para tejedoras: íconos de línea en lugar de emoji de color (etapa 5, ola 2; 30-oct-2026, decisión de Sara: estilo «elegante»).
   Cambia el emoji que abre el texto de botones, enlaces, resúmenes, subtítulos y atajos por un ícono de línea de un solo estilo (toma el color del texto).
   Lo que escribe la persona NO se toca (fichas, casillas, notas…). Si un emoji no tiene ícono se quita; el emoji del medio del texto se conserva.
   También limpia el emoji del principio de las opciones de la lista «Hojas de…». Se vuelve a aplicar solo cuando la agenda pinta botones nuevos. */
(function () {
  'use strict';
  var zona = document.getElementById('agenda'); if (!zona) return;
  var P = {
    papelera: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6', calendario: 'M3 5h18v16H3zM3 10h18M8 3v4M16 3v4', mas: 'M12 5v14M5 12h14',
    bajar: 'M12 3v12m0 0l-4-4m4 4l4-4M4 17v3h16v-3', subir: 'M12 15V3m0 0l-4 4m4-4l4 4M4 17v3h16v-3', imprimir: 'M7 9V3h10v6M7 17H4v-7h16v7h-3M7 14h10v7H7z',
    lapiz: 'M4 20l1-4L16 5l3 3L8 19l-4 1zM14 7l3 3', borrador: 'M4 16l9-9 6 6-5 5H8zM10 20h10', deshacer: 'M9 14L4 9l5-5M4 9h10a6 6 0 010 12h-3',
    nube: 'M7 18a4 4 0 010-8 5.5 5.5 0 0110.5 1A3.5 3.5 0 0117 18H7z', grafica: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
    mic: 'M12 3a3 3 0 00-3 3v6a3 3 0 006 0V6a3 3 0 00-3-3zM5 11a7 7 0 0014 0M12 18v3', recibo: 'M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6',
    libro: 'M5 4h10a3 3 0 013 3v13H8a3 3 0 01-3-3zM5 17a3 3 0 013-3h10', hoja: 'M6 3h9l4 4v14H6zM15 3v4h4M9 12h7M9 16h7',
    brujula: 'M12 3a9 9 0 100 18 9 9 0 000-18zM15.5 8.5l-2 5-5 2 2-5z', paleta: 'M12 3a9 9 0 100 18c1.5 0 2-1 1.500-2-.6-1.200.2-2.500 1.500-2.500H18a3 3 0 003-3c0-5-4-10.500-9-10.500zM7.500 11h.01M10 7.500h.01M14.500 7.500h.01',
    flor: 'M12 9a3 3 0 100 6 3 3 0 000-6zM12 3a3 3 0 010 6M12 15a3 3 0 010 6M3 12a3 3 0 016 0M15 12a3 3 0 016 0', birrete: 'M2 9l10-5 10 5-10 5zM6 11v5c0 1.500 3 3 6 3s6-1.500 6-3v-5',
    tendencia: 'M3 17l6-6 4 4 8-9M15 6h6v6', arco: 'M4 18a8 8 0 0116 0M7 18a5 5 0 0110 0M2 18h20', diana: 'M12 3a9 9 0 100 18 9 9 0 000-18zM12 8a4 4 0 100 8 4 4 0 000-8z',
    ovillo: 'M12 4a8 8 0 100 16 8 8 0 000-16zM5 9c4 1 9 1 14 0M4.500 14c5 1.500 10 1.500 15 0M9 4.500c-1 5 0 10 3 15', estrella: 'M12 3l2.700 5.600 6.100.9-4.400 4.300 1 6.100L12 17l-5.400 2.900 1-6.100L3.200 9.500l6.100-.9z',
    globo: 'M4 5h16v11H9l-5 4z', punto: 'M12 8a4 4 0 100 8 4 4 0 000-8z', camisa: 'M8 4l-5 4 3 3 2-1v10h8V10l2 1 3-3-5-4a4 4 0 01-8 0z', bolsa: 'M5 8h14l-1 12H6zM9 8V6a3 3 0 016 0v2',
    caja: 'M3 7l9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4M12 11v10', corazon: 'M12 20s-8-5-8-11a4.500 4.500 0 018-2.500A4.500 4.500 0 0120 9c0 6-8 11-8 11z',
    moneda: 'M12 3a9 9 0 100 18 9 9 0 000-18zM14.500 9c-.5-1-1.500-1.500-2.500-1.500-1.500 0-2.500.8-2.500 2s1 1.700 2.500 2 2.500.8 2.500 2-1 2-2.500 2c-1.200 0-2.200-.6-2.700-1.600M12 6v1.500M12 16.500V18',
    etiqueta: 'M3 12V4h8l10 10-8 8zM7.500 8h.01', bandera: 'M5 21V4M5 4h13l-2 4 2 4H5', contactos: 'M3 5h18v14H3zM9 11a2 2 0 100-4 2 2 0 000 4zM5.500 16c.5-2 2-3 3.500-3s3 1 3.500 3M15 9h4M15 13h4',
    calculadora: 'M5 3h14v18H5zM8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01', repetir: 'M4 11V9a3 3 0 013-3h12l-3-3M20 13v2a3 3 0 01-3 3H5l3 3',
    tarjeta: 'M3 6h18v12H3zM3 10h18M7 15h4', lupa: 'M11 4a7 7 0 100 14 7 7 0 000-14zM20 20l-4-4', regalo: 'M4 11h16v10H4zM3 7h18v4H3zM12 7v14M12 7c-2 0-4-1-4-3s3-2 4 3c1-5 4-5 4-3s-2 3-4 3',
    persona: 'M12 8a2.500 2.500 0 100-5 2.500 2.500 0 000 5zM5 20c0-4 3-6 7-6s7 2 7 6', casa: 'M3 11l9-8 9 8M5 10v10h14V10M10 20v-6h4v6', play: 'M7 4l13 8-13 8z', numeral: 'M5 9h14M5 15h14M10 4L8 20M16 4l-2 16',
    candado: 'M5 11h14v9H5zM8 11V8a4 4 0 018 0v3', portatil: 'M5 5h14v10H5zM2 19h20', camara: 'M4 8h4l2-3h4l2 3h4v12H4zM12 11a3.500 3.500 0 100 7 3.500 3.500 0 000-7z',
    camion: 'M2 6h11v10H2zM13 9h4l4 4v3h-8zM6 19a2 2 0 100-4 2 2 0 000 4zM17 19a2 2 0 100-4 2 2 0 000 4z', reloj: 'M12 3a9 9 0 100 18 9 9 0 000-18zM12 7v5l3 2', alerta: 'M12 3l10 18H2zM12 10v5M12 18h.01',
    llave: 'M14.700 6.300a4 4 0 00-5.400 5.400L3 18l3 3 6.300-6.300a4 4 0 005.400-5.400l-2.500 2.500-2.500-2.500z',
    flecha: 'M12 5v14m0 0l-5-5m5 5l5-5', sol: 'M12 8a4 4 0 100 8 4 4 0 000-8zM12 2v3M12 19v3M2 12h3M19 12h3'
  };
  var DE = { '1F5D1': 'papelera', '1F4C5': 'calendario', '1F5D3': 'calendario', '2795': 'mas', '2B07': 'bajar', '2B06': 'subir', '1F5A8': 'imprimir', '270F': 'lapiz', '1F9FD': 'borrador', '21A9': 'deshacer',
    '2601': 'nube', '1F4CA': 'grafica', '1F3A4': 'mic', '1F9FE': 'recibo', '1F4D4': 'libro', '1F4CB': 'hoja', '1F4C4': 'hoja', '1F4DA': 'libro', '1F9ED': 'brujula', '1F3A8': 'paleta', '1F338': 'flor',
    '1F393': 'birrete', '1F469': 'birrete', '1F4C8': 'tendencia', '1F308': 'arco', '1F3AF': 'diana', '1F9F5': 'ovillo', '1F9F6': 'ovillo', '2B50': 'estrella', '1F31F': 'estrella', '1F4AD': 'globo', '26AB': 'punto',
    '1F457': 'camisa', '1F6CD': 'bolsa', '1F4E6': 'caja', '1F495': 'corazon', '1F4B0': 'moneda', '1F437': 'moneda', '1F3F7': 'etiqueta', '1F3AA': 'bandera', '1F4C7': 'contactos', '1F9EE': 'calculadora',
    '1F501': 'repetir', '1F4B3': 'tarjeta', '1F50E': 'lupa', '1F50D': 'lupa', '1F381': 'regalo', '1F9D8': 'persona', '1F3E0': 'casa', '1F4AC': 'globo', '25B6': 'play', '1F522': 'numeral', '1F512': 'candado',
    '1F464': 'persona', '1F69A': 'camion', '1F4DD': 'hoja', '1F4B5': 'moneda', '1F3C6': 'estrella', '23F0': 'reloj', '26A0': 'alerta', '1F4B2': 'moneda', '2728': 'estrella', '1F369': 'grafica', '1F536': 'punto', '1F389': 'estrella', '1F382': 'regalo', '1F9F0': 'llave', '1F4D6': 'libro', '1F9F8': 'corazon', '1F4F0': 'hoja', '1F49D': 'regalo', '1F4BB': 'portatil', '1F4F7': 'camara', '1F4A1': 'sol' };
  // Emoji de adorno que se quitan sin ícono (Rosina solo va en las ilustraciones)
  var QUITAR = { '1F411': 1 };
  var RE = /^(\s*)((?:[\u{1F300}-\u{1FAFF}\u2300-\u23FF☀-➿⬀-⯿↩▶▪⚫](?:️|︎)?(?:‍[\u{1F300}-\u{1FAFF}☀-➿](?:️)?)*)+)\s*/u;
  var BLANCO = '.ficha-barra button, .agregar-renglon, .boton-primario, .boton-secundario, .boton-chico, .boton-cal, .hojas-pasos button, summary, #agenda-config button, #agenda-config a, .barra-agenda button, .barra-toggle span:first-child, .buscar-agenda > span:first-child, .ficha-seccion span, .atajo-ic, .tab-k .t, .indice-grupo h4, .tab-grupo h4, .conexion-aviso button, .tour-botones button, .tip-agenda, .hr-t, .herr-rosina a, .promo-ic, .pl-t-ic, h4.sub-hoja, .tab-lectura h4, .fin-rosina h4, .fin-rosina li > span:first-child, .tab-lectura li > span:first-child, label.dib-subir, .dib-barra button, a.boton-primario, a.boton-secundario, #menu-hojas-actual, .aviso-alarma, .resumen-pedidos, .ficha-chip.alarma, .ficha-chip.aviso, .wa-link, .ca-texto';
  var EXCLUIR = '.ficha-cab, .pestana, .tinta-barra, .vs-hoja, .pn-accion, textarea, input';

  function clave(texto) { var cp = texto.codePointAt(0); return cp.toString(16).toUpperCase(); }
  /* Íconos dibujados por Sara (31-oct-2026) para los botones de acción: si la acción tiene dibujo se usa la imagen; las demás siguen con el ícono de línea */
  var IMG = { papelera: 'eliminar', mas: 'agregar', imprimir: 'imprimir', bajar: 'descargar', subir: 'subir', calendario: 'calendario', mic: 'dictar', lapiz: 'lapiz', nube: 'nube', lupa: 'buscar', reloj: 'reloj', alerta: 'alerta', moneda: 'moneda', candado: 'candado' };
  function svg(nombre, grande) {
    if (IMG[nombre] && !grande) { var im = document.createElement('img'); im.src = '/img/agenda/menu/btn-' + IMG[nombre] + '.webp?v=3'; im.className = 'ic-l ic-img'; im.alt = ''; im.setAttribute('aria-hidden', 'true'); im.width = 28; im.height = 28; im.decoding = 'async'; return im; }
    var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('class', 'ic-l' + (grande ? ' ic-l-g' : '')); s.setAttribute('aria-hidden', 'true'); s.setAttribute('focusable', 'false');
    var p = document.createElementNS('http://www.w3.org/2000/svg', 'path'); p.setAttribute('d', P[nombre]); s.appendChild(p); return s;
  }
  function procesar(el) {
    if (el.closest(EXCLUIR) && !el.matches('.ficha-chip.alarma, .ficha-chip.aviso')) return;   // los chips de alarma son texto nuestro aunque estén dentro de la ficha   // los avisos se vuelven a escribir con textContent: se revisa cada vez si el texto empieza con un emoji
    var nodo = null; for (var i = 0; i < el.childNodes.length; i++) { if (el.childNodes[i].nodeType === 3 && el.childNodes[i].nodeValue.trim()) { nodo = el.childNodes[i]; break; } }
    if (!nodo) return;
    var m = nodo.nodeValue.match(RE); if (!m) return;
    var k = clave(m[2]), nombre = DE[k], resto = nodo.nodeValue.slice(m[0].length);
    var texto = resto.length ? document.createTextNode(resto) : null;
    if (nombre && !QUITAR[k]) {
      var icono = svg(nombre, el.classList.contains('atajo-ic')); nodo.parentNode.insertBefore(icono, nodo);
      if (texto) { icono.after(document.createTextNode(' ')); }
    }
    if (texto) nodo.parentNode.replaceChild(texto, nodo); else nodo.parentNode.removeChild(nodo);
    if (el.tagName === 'BUTTON' && !(el.textContent || '').trim() && !el.getAttribute('aria-label') && el.title) el.setAttribute('aria-label', el.title);
    if (!nombre && (el.classList.contains('atajo-ic') || el.classList.contains('promo-ic') || el.classList.contains('pl-t-ic'))) el.appendChild(svg('estrella', el.classList.contains('atajo-ic')));
    else if (nombre && !QUITAR[k] && (el.classList.contains('promo-ic') || el.classList.contains('pl-t-ic'))) { var g = el.querySelector('svg'); if (g) g.setAttribute('class', 'ic-l ic-l-m'); }
  }
  function limpiarLista() {
    var l = document.getElementById('selector-hoja-lista'); if (!l) return;
    Array.prototype.forEach.call(l.options, function (o) { var t = o.textContent.replace(RE, ''); if (t !== o.textContent) o.textContent = t; });
  }
  var espera = 0;
  function pasada() { espera = 0; zona.querySelectorAll(BLANCO).forEach(procesar); limpiarLista(); var a = document.getElementById('menu-hojas-actual'); if (a) { var t = a.textContent.replace(RE, ''); if (t !== a.textContent) a.textContent = t; } }
  new MutationObserver(function () { if (!espera) espera = setTimeout(pasada, 60); }).observe(zona, { childList: true, subtree: true });
  var lista = document.getElementById('selector-hoja-lista'); if (lista) new MutationObserver(function () { limpiarLista(); }).observe(lista, { childList: true });
  pasada();
  /* de(texto): el ícono de línea que corresponde al emoji con que empieza un texto (para las tarjetas de la vista de sección); si no hay, el de «hoja» */
  /* Íconos dibujados de las hojas (31-oct-2026, diseño de Sara): hoja(id, texto) devuelve el dibujo de la hoja o, si aún no lo tiene, el ícono de línea */
  var HOJAS_IMG = { 'indice-agenda': 1, 'planeador-dia': 1, 'portada-agenda': 1, 'aprende-compra': 1, 'panel-agenda': 1, 'tablero-agenda': 1, 'vision-anio': 1, 'prioridades-mes': 1, 'ficha-proyecto': 1, 'semana-tejiendo': 1, 'proyectos-fila': 1, 'coleccion-patrones': 1, 'anio-tejiendo': 1, 'lo-que-aprendi': 1, 'mis-ideas': 1, 'disena-patron': 1, 'prendas-medida': 1, 'hoja-puntos': 1, 'inventario-lanas': 1, 'lista-compras': 1, 'control-pedidos': 1, 'mis-clientas': 1, 'ventas-mes': 1, 'catalogo-precios': 1, 'ferias-mercados': 1, 'contactos': 1, 'fin-negocio': 1, 'fin-resumen': 1, 'fin-movimientos': 1, 'fin-presupuesto': 1, 'fin-fijos': 1, 'fin-tcredito': 1, 'fin-analisis': 1, 'calendario-anual': 1, 'fechas-especiales': 1, 'diario-tejido': 1, 'registro-pausas': 1 };
  function hoja(id, texto) { if (HOJAS_IMG[id]) { var im = document.createElement('img'); im.src = '/img/agenda/hojas/' + id + '.webp?v=2'; im.alt = ''; im.className = 'ic-hoja'; im.width = 56; im.height = 56; im.setAttribute('aria-hidden', 'true'); im.decoding = 'async'; return im; } return window.lrIconos.de(texto); }
  window.lrIconos = { hoja: hoja, pasada: pasada, por: function (n) { return svg(P[n] ? n : 'hoja', false); }, de: function (t) { var m = String(t || '').match(RE); var n = m && DE[clave(m[2])]; return svg(n && !QUITAR[clave(m[2])] ? n : 'hoja', false); } };
})();
