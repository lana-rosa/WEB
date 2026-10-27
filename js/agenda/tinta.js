/* Agenda para tejedoras: lápiz (27-oct-2026).
   Con el botón «Lápiz» se escribe y se dibuja a mano sobre la hoja abierta (lápiz digital, dedo opcional o mouse). Los trazos se guardan con la agenda
   (datos._tinta, por hoja) y salen al imprimir. Con lápiz digital la mano apoyada no dibuja: el dedo solo mueve la página, salvo que se active «Dibujar con el dedo». */
(function () {
  'use strict';
  var N = window.lrAgendaNucleo, zona = document.getElementById('agenda');
  if (!N || !zona) return;
  var COLORES = ['#2B2B30', '#E74E96', '#4C9BEA', '#3FAE73', '#F0933B'], NOMBRES = ['negro', 'rosa', 'azul', 'verde', 'naranja'], ANCHOS = [1.6, 3, 6], NOM_ANCHO = ['fino', 'medio', 'grueso'];
  var MAX_PUNTOS = 150000;   // unos 1,5 MB de tinta en total; la copia en la cuenta admite 3 MB
  var est = { modo: false, color: 0, ancho: 1, herr: 'pluma', dedo: false, hoja: null };
  var canvas = document.createElement('canvas'); canvas.className = 'tinta-canvas'; canvas.setAttribute('aria-hidden', 'true');
  var ctx = canvas.getContext('2d'), dpr = Math.min(2, window.devicePixelRatio || 1), ro = null;
  var pila = [], dibujando = null, borrando = false, desplazando = null, aviso = null;

  function tinta() { var d = N.datos(); return d._tinta || (d._tinta = {}); }
  function lista(crear) { if (!est.hoja) return []; var t = tinta(); if (!t[est.hoja.id] && crear) t[est.hoja.id] = []; return t[est.hoja.id] || []; }
  function totalPuntos() { var n = 0, t = N.datos()._tinta || {}; Object.keys(t).forEach(function (k) { (t[k] || []).forEach(function (s) { n += (s.length - 2) / 2; }); }); return n; }
  function unidad() { return canvas.clientWidth / 1000 || 1; }

  function ajustar() {
    if (!est.hoja) return;
    var w = est.hoja.clientWidth, h = est.hoja.clientHeight;
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    pintar();
  }
  function trazo(s, hasta) {
    var u = unidad(), p = s.slice(2), n = hasta == null ? p.length / 2 : hasta;
    ctx.strokeStyle = COLORES[s[0]] || COLORES[0]; ctx.fillStyle = ctx.strokeStyle; ctx.lineWidth = ANCHOS[s[1]] || ANCHOS[1];
    if (n <= 1) { ctx.beginPath(); ctx.arc(p[0] * u, p[1] * u, ctx.lineWidth / 2, 0, Math.PI * 2); ctx.fill(); return; }
    ctx.beginPath(); ctx.moveTo(p[0] * u, p[1] * u);
    for (var i = 1; i < n; i++) ctx.lineTo(p[i * 2] * u, p[i * 2 + 1] * u);
    ctx.stroke();
  }
  function pintar() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    lista(false).forEach(function (s) { trazo(s); });
  }
  function guardar() { N.guardar(); if (window.lrAgenda && window.lrAgenda.alCambiar) window.lrAgenda.alCambiar(); }

  function adoptar(hoja) {
    if (est.hoja === hoja) return;
    if (ro) ro.disconnect(); est.hoja = hoja; pila = [];
    if (!hoja) { if (canvas.parentNode) canvas.remove(); return; }
    hoja.appendChild(canvas);
    if (window.ResizeObserver) { ro = new ResizeObserver(ajustar); ro.observe(hoja); }
    ajustar();
  }
  function hojaAbierta() { return zona.querySelector('.hoja-agenda.abierta'); }
  var mo = new MutationObserver(function () { adoptar(hojaAbierta()); });
  zona.querySelectorAll('.hoja-agenda').forEach(function (h) { mo.observe(h, { attributes: true, attributeFilter: ['class'] }); });

  /* barra de herramientas */
  var boton = document.getElementById('tinta-modo'), barra = document.createElement('div');
  barra.className = 'tinta-barra no-imprimir'; barra.hidden = true; barra.setAttribute('role', 'toolbar'); barra.setAttribute('aria-label', 'Herramientas del lápiz');
  barra.innerHTML = '<button type="button" data-h="pluma" aria-pressed="true" title="Escribir">✏️</button><button type="button" data-h="borrar" aria-pressed="false" title="Borrar un trazo">🧽</button><span class="tb-sep"></span>' +
    COLORES.map(function (c, i) { return '<button type="button" class="tb-color" data-c="' + i + '" aria-label="Color ' + NOMBRES[i] + '" style="--c:' + c + '" aria-pressed="' + (i === 0) + '"></button>'; }).join('') + '<span class="tb-sep"></span>' +
    ANCHOS.map(function (a, i) { return '<button type="button" class="tb-ancho" data-a="' + i + '" aria-label="Línea ' + NOM_ANCHO[i] + '" aria-pressed="' + (i === 1) + '"><i style="height:' + Math.max(2, a) + 'px"></i></button>'; }).join('') + '<span class="tb-sep"></span>' +
    '<button type="button" data-acc="deshacer" title="Deshacer">↩️</button><button type="button" data-acc="limpiar" title="Borrar toda la tinta de esta hoja">🗑️</button>' +
    '<label class="tb-dedo"><input type="checkbox" id="tinta-dedo"> Dedo</label><button type="button" class="tb-listo" data-acc="listo">Listo</button><span class="tb-aviso" role="status" aria-live="polite"></span>';
  document.body.appendChild(barra); aviso = barra.querySelector('.tb-aviso');
  function decir(t) { aviso.textContent = t || ''; if (t) setTimeout(function () { if (aviso.textContent === t) aviso.textContent = ''; }, 4000); }
  function marcar() {
    barra.querySelectorAll('[data-h]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.h === est.herr)); });
    barra.querySelectorAll('[data-c]').forEach(function (b) { b.setAttribute('aria-pressed', String(+b.dataset.c === est.color)); });
    barra.querySelectorAll('[data-a]').forEach(function (b) { b.setAttribute('aria-pressed', String(+b.dataset.a === est.ancho)); });
  }
  function modo(on) {
    est.modo = !!on; barra.hidden = !on; canvas.classList.toggle('activo', !!on); if (boton) { boton.setAttribute('aria-pressed', String(!!on)); boton.textContent = on ? '✏️ Lápiz activo' : '✏️ Lápiz'; }
    document.body.classList.toggle('tinta-activa', !!on);
    if (on) { adoptar(hojaAbierta()); ajustar(); }
  }
  if (boton) boton.addEventListener('click', function () { modo(!est.modo); });
  barra.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.h) est.herr = b.dataset.h; else if (b.dataset.c) est.color = +b.dataset.c; else if (b.dataset.a) est.ancho = +b.dataset.a;
    else if (b.dataset.acc === 'deshacer') deshacer(); else if (b.dataset.acc === 'limpiar') limpiar(); else if (b.dataset.acc === 'listo') modo(false);
    marcar();
  });
  barra.querySelector('#tinta-dedo').addEventListener('change', function (e) { est.dedo = e.target.checked; decir(est.dedo ? 'Ahora el dedo también dibuja.' : 'Solo dibuja el lápiz digital o el mouse; el dedo mueve la página.'); });
  document.addEventListener('keydown', function (e) { if (est.modo && e.key === 'Escape') modo(false); });

  function deshacer() {
    var a = pila.pop(); if (!a) { decir('No hay nada que deshacer.'); return; }
    var l = lista(true);
    if (a.t === 'add') { var i = l.lastIndexOf(a.s); if (i >= 0) l.splice(i, 1); } else a.s.forEach(function (x) { l.push(x[1]); });
    if (!l.length) delete tinta()[est.hoja.id];
    pintar(); guardar();
  }
  function limpiar() {
    var l = lista(false); if (!l.length) { decir('Esta hoja no tiene tinta.'); return; }
    if (!confirm('¿Borrar toda la tinta de esta hoja? Lo escrito en las casillas no se toca.')) return;
    pila = []; delete tinta()[est.hoja.id]; pintar(); guardar();
  }

  /* dibujar */
  function punto(e) { var r = canvas.getBoundingClientRect(), u = r.width / 1000; return [Math.round((e.clientX - r.left) / u), Math.round((e.clientY - r.top) / u)]; }
  function borrarEn(e) {
    var u = unidad(), r = canvas.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, quitar = [], l = lista(false);
    l.forEach(function (s, idx) {
      for (var i = 2; i < s.length; i += 2) {
        var a = s[i] * u, b = s[i + 1] * u, ax = i > 2 ? s[i - 2] * u : a, ay = i > 2 ? s[i - 1] * u : b;
        var dx = a - ax, dy = b - ay, t = dx || dy ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy))) : 0;
        if (Math.hypot(x - (ax + t * dx), y - (ay + t * dy)) < 14) { quitar.push([idx, s]); break; }
      }
    });
    if (!quitar.length) return;
    quitar.reverse().forEach(function (q) { l.splice(q[0], 1); });
    pila.push({ t: 'del', s: quitar.slice().reverse() });
    if (!l.length) delete tinta()[est.hoja.id];
    pintar();
  }
  function sumar(e) {
    var p = punto(e), s = dibujando, n = s.length;
    if (n >= 4 && Math.hypot(p[0] - s[n - 2], p[1] - s[n - 1]) < 1.2 / unidad()) return;
    s.push(p[0], p[1]);
    var u = unidad(); ctx.strokeStyle = COLORES[s[0]]; ctx.lineWidth = ANCHOS[s[1]]; ctx.beginPath();
    ctx.moveTo((n >= 4 ? s[n - 2] : p[0]) * u, (n >= 4 ? s[n - 1] : p[1]) * u); ctx.lineTo(p[0] * u, p[1] * u); ctx.stroke();
  }
  canvas.addEventListener('pointerdown', function (e) {
    if (!est.modo) return;
    try { canvas.setPointerCapture(e.pointerId); } catch (x) {}
    if (e.pointerType === 'touch' && !est.dedo) { desplazando = e.clientY; e.preventDefault(); return; }   // el dedo mueve la página
    e.preventDefault();
    if (est.herr === 'borrar') { borrando = true; borrarEn(e); return; }
    if (totalPuntos() > MAX_PUNTOS) { decir('Ya hay mucha tinta guardada. Borra algo de tinta o guarda una copia para seguir.'); return; }
    var p = punto(e); dibujando = [est.color, est.ancho, p[0], p[1]];
    var u = unidad(); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; trazo(dibujando);
  });
  canvas.addEventListener('pointermove', function (e) {
    if (desplazando !== null) { window.scrollBy(0, desplazando - e.clientY); desplazando = e.clientY; return; }
    if (borrando) { borrarEn(e); return; }
    if (!dibujando) return;
    var ev = e.getCoalescedEvents ? e.getCoalescedEvents() : [e]; (ev.length ? ev : [e]).forEach(sumar);
  });
  function soltar() {
    if (desplazando !== null) { desplazando = null; return; }
    if (borrando) { borrando = false; guardar(); return; }
    if (!dibujando) return;
    var s = dibujando; dibujando = null;
    lista(true).push(s); pila.push({ t: 'add', s: s }); if (pila.length > 60) pila.shift(); guardar();
  }
  canvas.addEventListener('pointerup', soltar); canvas.addEventListener('pointercancel', soltar);

  window.lrTinta = {
    reiniciar: function () { pila = []; pintar(); },
    activar: modo, trazos: function () { return lista(false).length; },
    alRecargar: function () { pintar(); }
  };
  document.addEventListener('agenda-guardada', function () { if (est.hoja) pintar(); });
  adoptar(hojaAbierta());
})();
