/* Agenda para tejedoras: hojas vacías con ejemplo y «Empieza aquí» (etapa 5, ola 4; 30-oct-2026).
   - Encima de cada lista de fichas, mientras no tiene nada escrito, sale una frase corta con un ejemplo (desaparece sola al escribir; no se imprime).
   - «Empieza aquí»: tres tarjetas grandes (anotar un pedido, planear un proyecto, ver cuánto ganaste) en el Índice y, si la agenda está vacía, también en Mi panel.
   No guarda nada propio. */
(function () {
  'use strict';
  var N = window.lrAgendaNucleo; if (!N) return;
  var POSE = { 'tabla-pedidos': 'cartel', 'tabla-lanas': 'ovillo', 'tabla-compras': 'lista', 'tabla-fila': 'gancho', 'tabla-diario': 'leyendo', 'tabla-aprendi': 'leyendo', 'tabla-ventas': 'dinero', 'tabla-gastos': 'frasco', 'tabla-catalogo': 'grafica', 'tabla-clientas': 'corazon', 'tabla-fechas': 'pastel', 'tabla-ideas': 'pensando', 'tabla-contactos': 'portatil' };   // pose de Rosina junto al ejemplo; las demás usan «idea»
  var EJEMPLOS = {
    'tabla-pedidos': 'Aún no hay pedidos. Toca «Agregar pedido» y anota quién lo pidió, qué producto es y cuándo lo entregas. Ejemplo: «Osito de 20 cm para María, entrega el 15 de noviembre».',
    'tabla-fila': 'Aún no hay proyectos. Anota lo que quieres tejer y para quién. Ejemplo: «Chaleco para María · Tejiendo · fecha límite 15/11».',
    'tabla-ventas': 'Aún no hay ventas. Anota cada venta con su precio y lo que gastaste en materiales: la hoja te dice cuánto te quedó. Ejemplo: «Osito · María · $ 85.000 · costo $ 20.000».',
    'tabla-gastos': 'Aún no hay gastos. Anota lo que gastas en tu negocio (lana, empaques, envíos…). Ejemplo: «Lana algodón · Materiales · $ 60.000».',
    'tabla-clientas': 'Aún no hay clientas. Se agregan solas cuando anotas un pedido, o escríbelas aquí con su WhatsApp y su cumpleaños.',
    'tabla-lanas': 'Aún no hay lanas. Anota las que tienes en casa para saber qué te alcanza. Ejemplo: «Alize · rosa · 3 ovillos».',
    'tabla-compras': 'Aún no hay nada por comprar. Anota lo que te falta. Ejemplo: «Relleno siliconado · 1 bolsa».',
    'tabla-patrones': 'Aún no hay patrones. Guarda aquí los que encuentres o compres. Ejemplo: «Osito de apego · fácil».',
    'tabla-fechas': 'Aún no hay fechas especiales. Anota cumpleaños y celebraciones para tejer con tiempo. Ejemplo: «Cumpleaños de mamá · 20 de noviembre».',
    'tabla-catalogo': 'Aún no hay productos. Anota lo que vendes con su precio para responder rápido. Ejemplo: «Llavero de oveja · $ 15.000».',
    'tabla-diario': 'Aún no hay días anotados. Cuenta cómo te fue tejiendo. Ejemplo: «Hoy terminé la cabeza del osito».',
    'tabla-agujas': 'Aún no hay agujas. Anota las que usas. Ejemplo: «3,5 mm · aluminio».',
    'tabla-ideas': 'Aún no hay ideas. Anota lo que se te ocurra, aunque sea corto. Ejemplo: «Mantas con colores del arcoíris».',
    'tabla-contactos': 'Aún no hay contactos. Guarda proveedores, colegas y maestras. Ejemplo: «Doña Luz · lanas · 300 000 0000».',
    'tabla-aprendi': 'Aún no hay técnicas anotadas. Cuenta lo que aprendes. Ejemplo: «Aro mágico · video de YouTube».'
  };
  function vacia(t) {
    var T = N.tablas[t]; if (!T) return true;
    for (var r = 1; r <= T.n; r++) {
      for (var i = 0; i < T.cols.length; i++) {
        var id = typeof T.cols[i] === 'string' ? T.cols[i] : T.cols[i].id; if (id === 'cal') continue;
        var e = document.getElementById(T.prefijo + r + '-' + id);
        if (e && (e.type === 'checkbox' ? e.checked : String(e.value || '').trim())) return false;
      }
    }
    return true;
  }
  var avisos = {};
  Object.keys(EJEMPLOS).forEach(function (t) {
    var T = N.tablas[t]; if (!T || !T.cuerpo) return;
    var tabla = T.cuerpo.closest('table') || T.cuerpo; var p = document.createElement('p'); p.className = 'vacio-ejemplo no-imprimir'; var im = document.createElement('img'); im.src = '/img/agenda/rosina/' + (POSE[t] || 'idea') + '.webp'; im.alt = ''; im.width = 56; im.height = 56; p.appendChild(im);
    p.appendChild(document.createTextNode(EJEMPLOS[t]));
    tabla.parentNode.insertBefore(p, tabla); avisos[t] = p;
  });
  var espera = 0;
  function revisar() { espera = 0; Object.keys(avisos).forEach(function (t) { avisos[t].hidden = !vacia(t); }); }
  revisar();
  document.addEventListener('agenda-guardada', revisar);
  document.getElementById('agenda').addEventListener('input', function () { if (!espera) espera = setTimeout(revisar, 300); });
  setTimeout(revisar, 1500);

  var PASOS = [['Anotar un pedido', 'Quién lo pidió, qué es y cuándo lo entregas', 'control-pedidos', 'tabla-pedidos'], ['Planear un proyecto', 'Lo que quieres tejer, para quién y para cuándo', 'proyectos-fila', 'tabla-fila'], ['Ver cuánto ganaste', 'Tus ventas y gastos del mes y lo que te quedó', 'ventas-mes', null]];
  window.lrEmpiezaAqui = function () {
    var d = document.createElement('div'); d.className = 'empieza-aqui no-imprimir';
    var enc = document.createElement('div'); enc.className = 'ea-enc'; var h = document.createElement('h4'); h.textContent = 'Empieza aquí'; enc.appendChild(h);
    var ri = document.createElement('img'); ri.src = '/img/agenda/rosina/salta2.webp'; ri.alt = ''; ri.width = 64; ri.height = 64; enc.appendChild(ri); d.appendChild(enc);
    var g = document.createElement('div'); g.className = 'ea-pasos';
    PASOS.forEach(function (p, i) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'pn-card ea-paso';
      var n = document.createElement('span'); n.className = 'ea-n'; n.textContent = String(i + 1);
      var t = document.createElement('b'); t.textContent = p[0]; var s = document.createElement('small'); s.textContent = p[1];
      b.appendChild(n); b.appendChild(t); b.appendChild(s);
      b.addEventListener('click', function () { if (window.lrIrAHoja) window.lrIrAHoja(p[2]); if (p[3]) setTimeout(function () { if (window.lrFichas && vacia(p[3])) { var T = N.tablas[p[3]]; var primero = T && T.cuerpo.querySelector('input, textarea, select'); if (primero) primero.focus(); } }, 120); });
      g.appendChild(b);
    });
    d.appendChild(g); return d;
  };
  var ind = document.getElementById('indice-agenda');
  if (ind) { var primero = ind.querySelector('.indice-grupo'); if (primero) ind.insertBefore(window.lrEmpiezaAqui(), primero); }
})();
