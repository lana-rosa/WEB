/* Agenda para tejedoras: lienzos para dibujar (28-oct-2026).
   Un lienzo con lápiz, borrador, colores, deshacer, foto de fondo y descarga. Sirve para el «Dibujo del diseño» de cada proyecto
   (a mano o subiendo una foto) y para la «Hoja de puntos». Los trazos se guardan con la agenda en datos._dib[clave]:
   { s: [[color, grosor, x1, y1, x2, y2, …], …], img: 'data:image/jpeg…' } con x e y en milésimas del ancho del lienzo. */
(function () {
  'use strict';
  var N = window.lrAgendaNucleo;
  if (!N) return;
  var COLORES = ['#2B2B30', '#E74E96', '#4C9BEA', '#3FAE73', '#F0933B'], NOMBRES = ['negro', 'rosa', 'azul', 'verde', 'naranja'], ANCHOS = [1.6, 3, 6];
  var MAX_IMG_TOTAL = 1800000, MAX_PUNTOS = 150000;

  function almacen() { var d = N.datos(); return d._dib || (d._dib = {}); }
  function puntosTotales() { var n = 0, a = N.datos()._dib || {}; Object.keys(a).forEach(function (k) { ((a[k] && a[k].s) || []).forEach(function (s) { n += (s.length - 2) / 2; }); }); return n; }
  function bytesImg() { var n = 0, a = N.datos()._dib || {}; Object.keys(a).forEach(function (k) { n += ((a[k] && a[k].img) || '').length; }); return n; }

  function montar(cont, op) {
    op = op || {};
    var clave = op.clave, fondo = op.fondo || 'blanco', foto = op.foto !== false, relacion = op.relacion || 0.72;   // alto = ancho × relación
    cont.classList.add('dib-contenedor'); cont.textContent = '';
    var barra = document.createElement('div'); barra.className = 'dib-barra no-imprimir'; barra.setAttribute('role', 'toolbar'); barra.setAttribute('aria-label', 'Herramientas del dibujo');
    barra.innerHTML = '<button type="button" data-h="pluma" aria-pressed="true" title="Dibujar">✏️</button><button type="button" data-h="borrar" aria-pressed="false" title="Borrar un trazo">🧽</button>' +
      COLORES.map(function (c, i) { return '<button type="button" class="dib-color" data-c="' + i + '" aria-label="Color ' + NOMBRES[i] + '" style="--c:' + c + '" aria-pressed="' + (i === 0) + '"></button>'; }).join('') +
      ANCHOS.map(function (a, i) { return '<button type="button" class="dib-ancho" data-a="' + i + '" aria-label="Línea ' + ['fina', 'media', 'gruesa'][i] + '" aria-pressed="' + (i === 1) + '"><i style="height:' + Math.max(2, a) + 'px"></i></button>'; }).join('') +
      '<button type="button" data-acc="deshacer" title="Deshacer">↩️</button><button type="button" data-acc="limpiar" title="Borrar todo el dibujo">🗑️</button>' +
      (foto ? '<label class="dib-subir" title="Subir una foto del diseño">📷 Subir foto<input type="file" accept="image/*" hidden></label>' : '') +
      '<button type="button" data-acc="bajar" title="Bajar el dibujo como imagen">⬇️</button><label class="dib-dedo"><input type="checkbox" checked> Dedo</label><span class="dib-aviso" role="status" aria-live="polite"></span>';
    var caja = document.createElement('div'); caja.className = 'dib-caja dib-fondo-' + fondo;
    var imgFondo = document.createElement('img'); imgFondo.className = 'dib-foto'; imgFondo.alt = ''; imgFondo.hidden = true;
    var canvas = document.createElement('canvas'); canvas.className = 'dib-canvas'; canvas.setAttribute('aria-label', op.etiqueta || 'Lienzo para dibujar');
    caja.appendChild(imgFondo); caja.appendChild(canvas); cont.appendChild(barra); cont.appendChild(caja);
    var ctx = canvas.getContext('2d'), dpr = Math.min(2, window.devicePixelRatio || 1);
    var est = { herr: 'pluma', color: 0, ancho: 1, dedo: true }, actual = null, borrando = false, pila = [], aviso = barra.querySelector('.dib-aviso'), desplazando = null;
    function decir(t) { aviso.textContent = t || ''; if (t) setTimeout(function () { if (aviso.textContent === t) aviso.textContent = ''; }, 4000); }
    function reg(crear) { var a = almacen(); if (!a[clave] && crear) a[clave] = { s: [], img: '' }; return a[clave] || { s: [], img: '' }; }
    function u() { return canvas.clientWidth / 1000 || 1; }
    function ajustar() {
      var w = caja.clientWidth; if (!w) return; var h = Math.round(w * relacion);
      caja.style.height = h + 'px'; canvas.style.width = w + 'px'; canvas.style.height = h + 'px'; canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); pintar();
    }
    function trazo(s) {
      var k = u(), p = s.slice(2), n = p.length / 2; ctx.strokeStyle = ctx.fillStyle = COLORES[s[0]] || COLORES[0]; ctx.lineWidth = ANCHOS[s[1]] || ANCHOS[1];
      if (n <= 1) { ctx.beginPath(); ctx.arc(p[0] * k, p[1] * k, ctx.lineWidth / 2, 0, Math.PI * 2); ctx.fill(); return; }
      ctx.beginPath(); ctx.moveTo(p[0] * k, p[1] * k); for (var i = 1; i < n; i++) ctx.lineTo(p[i * 2] * k, p[i * 2 + 1] * k); ctx.stroke();
    }
    function pintar() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      var r = reg(false); r.s.forEach(trazo);
      if (r.img) { imgFondo.src = r.img; imgFondo.hidden = false; } else { imgFondo.hidden = true; imgFondo.removeAttribute('src'); }
    }
    function guardar() { N.guardar(); if (window.lrAgenda && window.lrAgenda.alCambiar) window.lrAgenda.alCambiar(); }
    function punto(e) { var r = canvas.getBoundingClientRect(), k = r.width / 1000; return [Math.round((e.clientX - r.left) / k), Math.round((e.clientY - r.top) / k)]; }
    function borrarEn(e) {
      var k = u(), r = canvas.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, quitar = [], l = reg(false).s;
      l.forEach(function (s, idx) {
        for (var i = 2; i < s.length; i += 2) {
          var a = s[i] * k, b = s[i + 1] * k, ax = i > 2 ? s[i - 2] * k : a, ay = i > 2 ? s[i - 1] * k : b, dx = a - ax, dy = b - ay;
          var t = dx || dy ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy))) : 0;
          if (Math.hypot(x - (ax + t * dx), y - (ay + t * dy)) < 14) { quitar.push([idx, s]); break; }
        }
      });
      if (!quitar.length) return;
      quitar.reverse().forEach(function (q) { l.splice(q[0], 1); }); pila.push({ t: 'del', s: quitar.slice().reverse() }); pintar();
    }
    function sumar(e) {
      var p = punto(e), s = actual, n = s.length;
      if (n >= 4 && Math.hypot(p[0] - s[n - 2], p[1] - s[n - 1]) < 1.2 / u()) return; s.push(p[0], p[1]);
      var k = u(); ctx.strokeStyle = COLORES[s[0]]; ctx.lineWidth = ANCHOS[s[1]]; ctx.beginPath(); ctx.moveTo((n >= 4 ? s[n - 2] : p[0]) * k, (n >= 4 ? s[n - 1] : p[1]) * k); ctx.lineTo(p[0] * k, p[1] * k); ctx.stroke();
    }
    canvas.addEventListener('pointerdown', function (e) {
      if (!clave) return; try { canvas.setPointerCapture(e.pointerId); } catch (x) {}
      if (e.pointerType === 'touch' && !est.dedo) { desplazando = e.clientY; e.preventDefault(); return; }
      e.preventDefault();
      if (est.herr === 'borrar') { borrando = true; borrarEn(e); return; }
      if (puntosTotales() > MAX_PUNTOS) { decir('Ya hay mucha tinta guardada. Borra algo o guarda una copia para seguir.'); return; }
      var p = punto(e); actual = [est.color, est.ancho, p[0], p[1]]; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; trazo(actual);
    });
    canvas.addEventListener('pointermove', function (e) {
      if (desplazando !== null) { window.scrollBy(0, desplazando - e.clientY); desplazando = e.clientY; return; }
      if (borrando) { borrarEn(e); return; } if (!actual) return;
      var ev = e.getCoalescedEvents ? e.getCoalescedEvents() : [e]; (ev.length ? ev : [e]).forEach(sumar);
    });
    function soltar() {
      if (desplazando !== null) { desplazando = null; return; }
      if (borrando) { borrando = false; limpiarVacio(); guardar(); return; }
      if (!actual) return; var s = actual; actual = null; reg(true).s.push(s); pila.push({ t: 'add', s: s }); if (pila.length > 60) pila.shift(); guardar();
    }
    function limpiarVacio() { var a = almacen(), r = a[clave]; if (r && !r.s.length && !r.img) delete a[clave]; }
    canvas.addEventListener('pointerup', soltar); canvas.addEventListener('pointercancel', soltar);
    barra.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.dataset.h) est.herr = b.dataset.h; else if (b.dataset.c) est.color = +b.dataset.c; else if (b.dataset.a) est.ancho = +b.dataset.a;
      else if (b.dataset.acc === 'deshacer') {
        var a = pila.pop(); if (!a) { decir('No hay nada que deshacer.'); return; } var l = reg(true).s;
        if (a.t === 'add') { var i = l.lastIndexOf(a.s); if (i >= 0) l.splice(i, 1); } else a.s.forEach(function (x) { l.push(x[1]); }); limpiarVacio(); pintar(); guardar();
      } else if (b.dataset.acc === 'limpiar') {
        var r = reg(false); if (!r.s.length && !r.img) { decir('El dibujo está vacío.'); return; }
        if (!confirm('¿Borrar todo el dibujo' + (r.img ? ' y la foto' : '') + '?')) return; delete almacen()[clave]; pila = []; pintar(); guardar();
      } else if (b.dataset.acc === 'bajar') bajar();
      barra.querySelectorAll('[data-h]').forEach(function (x) { x.setAttribute('aria-pressed', String(x.dataset.h === est.herr)); });
      barra.querySelectorAll('[data-c]').forEach(function (x) { x.setAttribute('aria-pressed', String(+x.dataset.c === est.color)); });
      barra.querySelectorAll('[data-a]').forEach(function (x) { x.setAttribute('aria-pressed', String(+x.dataset.a === est.ancho)); });
    });
    barra.querySelector('.dib-dedo input').addEventListener('change', function (e) { est.dedo = e.target.checked; decir(est.dedo ? 'El dedo dibuja.' : 'El dedo mueve la página; dibuja con el lápiz digital o el mouse.'); });
    /* foto del diseño: se reduce y se guarda con la agenda */
    var entrada = barra.querySelector('.dib-subir input');
    if (entrada) entrada.addEventListener('change', function () {
      var f = entrada.files && entrada.files[0]; entrada.value = ''; if (!f) return;
      var lector = new FileReader();
      lector.onload = function () {
        var im = new Image();
        im.onload = function () {
          var m = 760, esc = Math.min(1, m / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.round(im.width * esc); c.height = Math.round(im.height * esc);
          var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height);
          var url = c.toDataURL('image/jpeg', 0.62);
          if (bytesImg() - (reg(false).img || '').length + url.length > MAX_IMG_TOTAL) { decir('Ya hay muchas fotos guardadas. Borra alguna para subir otra.'); return; }
          reg(true).img = url; guardar(); pintar(); decir('Foto lista. Puedes dibujar encima.');
        };
        im.onerror = function () { decir('No pude leer esa imagen.'); }; im.src = lector.result;
      };
      lector.readAsDataURL(f);
    });
    function bajar() {
      var w = 1000, h = Math.round(w * relacion), c = document.createElement('canvas'); c.width = w; c.height = h; var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, w, h);
      function trazos() {
        x.lineCap = 'round'; x.lineJoin = 'round';
        reg(false).s.forEach(function (s) { x.strokeStyle = x.fillStyle = COLORES[s[0]] || COLORES[0]; x.lineWidth = (ANCHOS[s[1]] || 3) * (1000 / (canvas.clientWidth || 1000)); var p = s.slice(2); x.beginPath(); x.moveTo(p[0], p[1]); for (var i = 1; i < p.length / 2; i++) x.lineTo(p[i * 2], p[i * 2 + 1]); x.stroke(); });
        var a = document.createElement('a'); a.href = c.toDataURL('image/png'); a.download = (op.archivo || 'dibujo') + '.png'; document.body.appendChild(a); a.click(); a.remove();
      }
      var r = reg(false); if (r.img) { var im = new Image(); im.onload = function () { var e = Math.min(w / im.width, h / im.height); x.drawImage(im, (w - im.width * e) / 2, (h - im.height * e) / 2, im.width * e, im.height * e); trazos(); }; im.src = r.img; } else trazos();
    }
    if (window.ResizeObserver) new ResizeObserver(ajustar).observe(caja); else window.addEventListener('resize', ajustar);
    setTimeout(ajustar, 0);
    return { cambiarClave: function (k) { clave = k; pila = []; pintar(); }, repintar: function () { ajustar(); }, clave: function () { return clave; } };
  }

  /* El «Dibujo del diseño» de cada proyecto sigue a la ficha que se está viendo */
  var pads = {};
  function iniciarProyecto() {
    var cont = document.getElementById('dibujo-proyecto'); if (!cont) return;
    function clave() { var k = window.lrVersiones ? window.lrVersiones.actual('ficha-proyecto') : 'k1'; return 'ficha-proyecto:' + k; }
    pads.proyecto = montar(cont, { clave: clave(), relacion: 0.72, archivo: 'dibujo-del-diseno', etiqueta: 'Dibujo del diseño del proyecto' });
    document.addEventListener('version-cambiada', function (e) { if (e.detail.hoja === 'ficha-proyecto') pads.proyecto.cambiarClave(clave()); });
  }
  /* Hoja de puntos: varias páginas */
  function iniciarPuntos() {
    var cont = document.getElementById('puntos-lienzo'); if (!cont) return;
    var pagina = 1, pad = null, info = document.getElementById('puntos-cuenta'), ant = document.getElementById('puntos-ant'), sig = document.getElementById('puntos-sig'), nueva = document.getElementById('puntos-nueva');
    function total() { var d = N.datos(); return Math.max(1, d._puntosN || 1); }
    function pintar() {
      info.textContent = 'Página ' + pagina + ' de ' + total(); ant.disabled = pagina <= 1; sig.disabled = pagina >= total();
      if (!pad) pad = montar(cont, { clave: 'puntos:' + pagina, fondo: 'puntos', foto: false, relacion: 1.2, archivo: 'hoja-de-puntos', etiqueta: 'Hoja de puntos para dibujar' }); else pad.cambiarClave('puntos:' + pagina);
    }
    ant.addEventListener('click', function () { pagina = Math.max(1, pagina - 1); pintar(); }); sig.addEventListener('click', function () { pagina = Math.min(total(), pagina + 1); pintar(); });
    nueva.addEventListener('click', function () { var d = N.datos(); d._puntosN = total() + 1; N.guardar(); pagina = d._puntosN; pintar(); });
    pintar();
  }
  iniciarProyecto(); iniciarPuntos();
  window.lrDibujo = { montar: montar };
})();
