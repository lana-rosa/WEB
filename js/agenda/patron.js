/* Agenda para tejedoras: «Diseña tu patrón» (27-oct-2026).
   Guía en siete pasos para escribir un patrón propio y dejarlo listo para imprimir o bajar como texto.
   Los datos son los campos ag-dp-* de la hoja (cada patrón es una ficha; lo maneja formas.js).
   6-nov-2026 (pedido de Jennifer): las partes no tienen número fijo («Añadir parte»: empieza con 3 y crece; los campos son ag-dp-pN-nombre y ag-dp-pN-vueltas)
   y cada patrón puede llevar fotos del resultado y de los pasos: se guardan como los dibujos, en `datos._dib['disena-patron:<ficha>:f<n>'] = { s: [], img, t }`
   (IndexedDB mediante lrDibStore, entran en las copias y se borran con la ficha). */
(function () {
  'use strict';
  var hoja = document.getElementById('disena-patron'), N = window.lrAgendaNucleo;
  if (!hoja) return;
  var pasos = Array.prototype.slice.call(hoja.querySelectorAll('.dp-paso')), nav = document.getElementById('dp-pasos'), actual = 1;
  var bAtras = document.getElementById('dp-atras'), bSig = document.getElementById('dp-sig'), cuenta = document.getElementById('dp-cuenta'), vista = document.getElementById('dp-vista');
  var ABREV = ['cad = cadeneta', 'pd = punto deslizado', 'pb = punto bajo', 'mpa = medio punto alto', 'pa = punto alto', 'pad = punto alto doble', 'am = anillo mágico', 'aum = aumento (2 pb en el mismo punto)', 'dism = disminución', 'dism inv = disminución invisible', 'laz = lazada', 'hd = hebra delantera', 'ht = hebra trasera', 'V = vuelta', 'pto = punto', 'esp = espacio', 'rep = repetir', 'MP = marcador de puntos'];
  function v(id) { var e = document.getElementById(id); return e ? String(e.type === 'checkbox' ? (e.checked ? 'Sí' : '') : e.value || '').trim() : ''; }

  /* pasos */
  pasos.forEach(function (p, i) {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'dp-paso-btn'; b.dataset.i = i + 1;
    b.innerHTML = '<span class="dp-num">' + (i + 1) + '</span><span class="dp-tit"></span>'; b.querySelector('.dp-tit').textContent = p.dataset.titulo; nav.appendChild(b);
  });
  function ir(n) {
    actual = Math.max(1, Math.min(pasos.length, n));
    pasos.forEach(function (p, i) { p.classList.toggle('activo', i + 1 === actual); });
    nav.querySelectorAll('.dp-paso-btn').forEach(function (b) { b.setAttribute('aria-current', b.dataset.i == actual ? 'step' : 'false'); b.classList.toggle('hecho', b.dataset.i < actual); });
    bAtras.disabled = actual === 1; bSig.hidden = actual === pasos.length; cuenta.textContent = 'Paso ' + actual + ' de ' + pasos.length;
    if (actual === pasos.length) pintarVista();
  }
  nav.addEventListener('click', function (e) { var b = e.target.closest('.dp-paso-btn'); if (b) ir(+b.dataset.i); });
  bAtras.addEventListener('click', function () { ir(actual - 1); hoja.scrollIntoView({ block: 'start', behavior: 'smooth' }); });
  bSig.addEventListener('click', function () { ir(actual + 1); hoja.scrollIntoView({ block: 'start', behavior: 'smooth' }); });

  /* abreviaturas */
  var chips = document.getElementById('dp-chips');
  ABREV.forEach(function (t) {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'dp-chip'; b.textContent = t;
    b.addEventListener('click', function () {
      var ta = document.getElementById('ag-dp-abrev'), lineas = ta.value.split('\n').map(function (x) { return x.trim(); });
      if (lineas.indexOf(t) >= 0) return;
      ta.value = (ta.value.trim() ? ta.value.replace(/\s+$/, '') + '\n' : '') + t; ta.dispatchEvent(new Event('input', { bubbles: true }));
    });
    chips.appendChild(b);
  });

  /* vista previa y salidas */
  function datosPatron() {
    var partes = [];
    for (var n = 1; n <= totalPartes(); n++) { var nom = v('ag-dp-p' + n + '-nombre'), vu = v('ag-dp-p' + n + '-vueltas'); if (nom || vu) partes.push({ nombre: nom || ('Parte ' + n), vueltas: vu }); }
    return {
      nombre: v('ag-dp-nombre') || 'Mi patrón', tipo: v('ag-dp-tipo'), nivel: v('ag-dp-nivel'), medida: v('ag-dp-medida'), descr: v('ag-dp-descr'),
      lana: v('ag-dp-lana'), aguja: v('ag-dp-aguja'), otros: v('ag-dp-otros'), muestra: v('ag-dp-muestra'), abrev: v('ag-dp-abrev'),
      partes: partes, armado: v('ag-dp-armado'), detalles: v('ag-dp-detalles'), notas: v('ag-dp-notas'), probado: v('ag-dp-probado'), autora: v('ag-duena'), fotos: fotosDe()
    };
  }
  function el(tag, txt, cls) { var e = document.createElement(tag); if (txt != null) e.textContent = txt; if (cls) e.className = cls; return e; }
  function seccion(cont, titulo, texto, lista) {
    if (!texto) return; cont.appendChild(el('h5', titulo));
    if (lista) { var ul = el('ul'); texto.split('\n').filter(Boolean).forEach(function (l) { ul.appendChild(el('li', l)); }); cont.appendChild(ul); } else cont.appendChild(el('p', texto, 'dp-texto'));
  }
  function construir(cont, d) {
    cont.textContent = '';
    cont.appendChild(el('h4', d.nombre));
    var meta = [d.tipo, d.nivel && 'Nivel ' + d.nivel.toLowerCase(), d.medida && 'Mide ' + d.medida].filter(Boolean).join(' · ');
    if (meta) cont.appendChild(el('p', meta, 'dp-meta'));
    if (d.autora) cont.appendChild(el('p', 'Patrón de ' + d.autora, 'dp-meta'));
    seccion(cont, 'Sobre este patrón', d.descr);
    var mat = [d.lana && 'Lana o hilo: ' + d.lana, d.aguja && 'Aguja: ' + d.aguja + ' mm', d.muestra && 'Muestra: ' + d.muestra].filter(Boolean).join('\n') + (d.otros ? '\n' + d.otros : '');
    seccion(cont, 'Materiales', mat, true);
    seccion(cont, 'Abreviaturas', d.abrev, true);
    d.partes.forEach(function (p) { cont.appendChild(el('h5', p.nombre)); cont.appendChild(el('p', p.vueltas || '—', 'dp-vueltas')); });
    seccion(cont, 'Armado', d.armado); seccion(cont, 'Detalles y acabados', d.detalles); seccion(cont, 'Notas', d.notas);
    if (d.fotos && d.fotos.length) {
      cont.appendChild(el('h5', 'Fotos')); var gf = el('div', null, 'dp-fotos-vista');
      d.fotos.forEach(function (f) { var fig = el('figure'); var im = document.createElement('img'); im.src = f.img; im.alt = f.t || 'Foto del patrón'; im.style.cssText = 'max-width:100%;height:auto;border-radius:8px'; fig.appendChild(im); if (f.t) fig.appendChild(el('figcaption', f.t)); fig.style.cssText = 'margin:0 0 10px;break-inside:avoid'; gf.appendChild(fig); });
      cont.appendChild(gf);
    }
    if (d.probado) cont.appendChild(el('p', '✓ Tejido y probado siguiendo este patrón.', 'dp-meta'));
    cont.appendChild(el('p', 'Hecho con la Agenda para tejedoras · Lana Rosa Crochet · lanarosacrochet.com', 'dp-pie'));
  }
  function pintarVista() { construir(vista, datosPatron()); }
  function esc(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  document.getElementById('dp-imprimir').addEventListener('click', function () {
    var cont = document.createElement('div'); construir(cont, datosPatron());
    var w = window.open('', '_blank'); if (!w) { alert('Tu navegador bloqueó la ventana. Permite las ventanas emergentes para imprimir tu patrón.'); return; }
    w.document.write('<!doctype html><html lang="es-CO"><head><meta charset="utf-8"><title>' + esc(datosPatron().nombre) + '</title><style>body{font-family:Arial,Helvetica,sans-serif;color:#333;max-width:720px;margin:24px auto;padding:0 18px;line-height:1.5}h4{font-size:26px;margin:0 0 4px;color:#E74E96}h5{font-size:15px;text-transform:uppercase;letter-spacing:.05em;color:#E74E96;margin:20px 0 4px;border-bottom:1px solid #F28FC0;padding-bottom:3px}p{margin:4px 0}ul{margin:4px 0;padding-left:20px}.dp-meta{color:#666}.dp-texto,.dp-vueltas{white-space:pre-line}.dp-pie{margin-top:28px;font-size:12px;color:#888;border-top:1px dashed #ccc;padding-top:8px}@media print{body{margin:0}}</style></head><body>' + cont.innerHTML + '</body></html>');
    w.document.close(); w.focus(); setTimeout(function () { w.print(); }, 300);
    (window.dataLayer = window.dataLayer || []).push({ event: 'resource_use', recurso: 'agenda_patron_imprimir' });
  });
  document.getElementById('dp-txt').addEventListener('click', function () {
    var d = datosPatron(), t = d.nombre.toUpperCase() + '\n' + [d.tipo, d.nivel && 'Nivel ' + d.nivel, d.medida && 'Mide ' + d.medida].filter(Boolean).join(' · ') + '\n\n';
    if (d.descr) t += d.descr + '\n\n';
    t += 'MATERIALES\n' + [d.lana && '- Lana o hilo: ' + d.lana, d.aguja && '- Aguja: ' + d.aguja + ' mm', d.muestra && '- Muestra: ' + d.muestra, d.otros].filter(Boolean).join('\n') + '\n\n';
    if (d.abrev) t += 'ABREVIATURAS\n' + d.abrev + '\n\n';
    d.partes.forEach(function (p) { t += p.nombre.toUpperCase() + '\n' + (p.vueltas || '—') + '\n\n'; });
    if (d.armado) t += 'ARMADO\n' + d.armado + '\n\n'; if (d.detalles) t += 'DETALLES\n' + d.detalles + '\n\n'; if (d.notas) t += 'NOTAS\n' + d.notas + '\n\n';
    t += 'Hecho con la Agenda para tejedoras · Lana Rosa Crochet · lanarosacrochet.com\n';
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([t], { type: 'text/plain;charset=utf-8' }));
    a.download = (d.nombre.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'patron') + '.txt';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
  });
  window.addEventListener('beforeprint', function () { hoja.querySelectorAll('.dp-parte').forEach(function (d) { d.open = true; }); });
  hoja.addEventListener('input', function () { if (actual === pasos.length) pintarVista(); });
  document.addEventListener('agenda-guardada', function () { if (actual === pasos.length) pintarVista(); });
  /* ---------- partes sin número fijo ---------- */
  var contPartes = document.getElementById('dp-partes'), bMas = document.getElementById('dp-parte-mas');
  function partesEl() { return Array.prototype.slice.call(contPartes.querySelectorAll('.dp-parte')); }
  function totalPartes() { return partesEl().length; }
  function lleno(n) { return !!(v('ag-dp-p' + n + '-nombre') || v('ag-dp-p' + n + '-vueltas')); }
  function crearParte(n, valores) {
    var d = document.createElement('details'); d.className = 'dp-parte';
    d.innerHTML = '<summary>Parte ' + n + '</summary><div class="grid-ficha"><div class="linea ancha"><label for="ag-dp-p' + n + '-nombre">Nombre de la parte</label><input id="ag-dp-p' + n + '-nombre" data-guardar placeholder="Por ejemplo: Cola"></div>' +
      '<div class="linea ancha"><label for="ag-dp-p' + n + '-vueltas">Vueltas</label><textarea id="ag-dp-p' + n + '-vueltas" rows="6" data-guardar placeholder="V1: 6 pb en am (6)&#10;V2: aum en cada pto (12)"></textarea></div></div>';
    contPartes.appendChild(d);
    var dat = N && N.datos ? N.datos() : {};   // lo que ya estaba escrito para esa parte (al abrir la agenda o al cambiar de patrón)
    ['nombre', 'vueltas'].forEach(function (c) { var e = document.getElementById('ag-dp-p' + n + '-' + c), x = valores && valores[e.id] != null ? valores[e.id] : dat[e.id]; if (e && x != null) { e.value = x; dat[e.id] = x; } });
    return d;
  }
  /* muestra las partes que tienen algo escrito (mínimo 3) y esconde las demás hasta que se pidan con «Añadir parte» */
  function ajustarPartes(valores) {
    var max = 3, k;
    if (valores) Object.keys(valores).forEach(function (id) { var m = /^ag-dp-p(\d+)-(nombre|vueltas)$/.exec(id); if (m) max = Math.max(max, +m[1]); });
    while (totalPartes() < max) crearParte(totalPartes() + 1, valores);
    var ult = 3; partesEl().forEach(function (d, i) { if (lleno(i + 1)) ult = Math.max(ult, i + 1); });
    partesEl().forEach(function (d, i) { d.hidden = i + 1 > ult && !d.dataset.pedida; });
  }
  if (bMas) bMas.addEventListener('click', function () {
    var ps = partesEl(), oculta = ps.filter(function (d) { return d.hidden; })[0], d = oculta || crearParte(ps.length + 1);
    d.hidden = false; d.dataset.pedida = '1'; d.open = true;
    var i = d.querySelector('input'); if (i) i.focus();
  });
  /* ---------- fotos del resultado y de los pasos ---------- */
  var cajaFotos = document.getElementById('dp-fotos'), MAXF = 12;
  function fichaK() { return window.lrVersiones ? window.lrVersiones.actual('disena-patron') : 'k1'; }
  function dibs() { var d = N && N.datos ? N.datos() : {}; return d._dib || (d._dib = {}); }
  function clavesFotos() {
    var pre = 'disena-patron:' + fichaK() + ':f', a = dibs();
    return Object.keys(a).filter(function (k) { return k.indexOf(pre) === 0 && a[k] && a[k].img; }).sort(function (x, y) { return +x.slice(pre.length) - +y.slice(pre.length); });
  }
  function fotosDe() { var a = dibs(); return clavesFotos().map(function (k) { return { img: a[k].img, t: a[k].t || '' }; }); }
  function guardarTodo() { if (N) N.guardar(); if (window.lrAgenda && window.lrAgenda.alCambiar) window.lrAgenda.alCambiar(); }
  function bytesFotos() { var n = 0, a = dibs(); Object.keys(a).forEach(function (k) { n += ((a[k] && a[k].img) || '').length; }); return n; }
  function tope() { return window.lrDibStore ? window.lrDibStore.limites().img : 1800000; }
  function aviso(t) { var p = cajaFotos.querySelector('.dp-fotos-msg'); if (p) p.textContent = t; }
  function pintarFotos() {
    if (!cajaFotos) return; var claves = clavesFotos(), a = dibs();
    cajaFotos.textContent = '';
    var rej = el('div', null, 'dp-fotos-rejilla');
    claves.forEach(function (k) {
      var fig = el('figure', null, 'dp-foto'), im = document.createElement('img'); im.src = a[k].img; im.alt = a[k].t || 'Foto del patrón'; im.loading = 'lazy'; fig.appendChild(im);
      var t = document.createElement('input'); t.type = 'text'; t.maxLength = 80; t.value = a[k].t || ''; t.placeholder = 'Qué muestra (Paso 3: la cabeza)'; t.setAttribute('aria-label', 'Qué muestra esta foto'); fig.appendChild(t);
      t.addEventListener('change', function () { if (dibs()[k]) { dibs()[k].t = t.value.trim(); im.alt = t.value.trim() || 'Foto del patrón'; guardarTodo(); if (actual === pasos.length) pintarVista(); } });
      var q = el('button', 'Quitar', 'boton-secundario boton-chico'); q.type = 'button'; q.setAttribute('aria-label', 'Quitar esta foto');
      q.addEventListener('click', function () { delete dibs()[k]; guardarTodo(); pintarFotos(); if (actual === pasos.length) pintarVista(); });
      fig.appendChild(q); rej.appendChild(fig);
    });
    cajaFotos.appendChild(rej);
    var lab = el('label', null, 'dib-subir boton-secundario boton-chico'); lab.appendChild(document.createTextNode('📷 Subir fotos'));
    var inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*'; inp.multiple = true; inp.hidden = true; lab.appendChild(inp);
    if (claves.length >= MAXF) lab.hidden = true;
    cajaFotos.appendChild(lab); cajaFotos.appendChild(el('p', claves.length >= MAXF ? 'Máximo 12 fotos por patrón.' : '', 'dp-fotos-msg')); cajaFotos.lastChild.setAttribute('role', 'status');
    inp.addEventListener('change', function () { var fs = Array.prototype.slice.call(inp.files || []); inp.value = ''; subir(fs); });
  }
  function reducir(f) {
    return new Promise(function (ok, mal) {
      var lector = new FileReader();
      lector.onerror = function () { mal(); };
      lector.onload = function () {
        var im = new Image(); im.onerror = function () { mal(); };
        im.onload = function () {
          var act = window.lrDibStore && window.lrDibStore.activo, m = act ? 1600 : 760, esc = Math.min(1, m / Math.max(im.width, im.height)), c = document.createElement('canvas');
          c.width = Math.round(im.width * esc); c.height = Math.round(im.height * esc); var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height);
          ok(c.toDataURL('image/jpeg', act ? 0.82 : 0.62));
        };
        im.src = lector.result;
      };
      lector.readAsDataURL(f);
    });
  }
  function subir(fs) {
    var cadena = Promise.resolve();
    fs.forEach(function (f) {
      cadena = cadena.then(function () {
        if (clavesFotos().length >= MAXF) { aviso('Máximo 12 fotos por patrón.'); return; }
        return reducir(f).then(function (url) {
          if (bytesFotos() + url.length > tope()) { aviso('Ya hay muchas fotos guardadas. Borra alguna para subir otra.'); return; }
          var pre = 'disena-patron:' + fichaK() + ':f', n = 1; while (dibs()[pre + n]) n++;
          dibs()[pre + n] = { s: [], img: url, t: '' }; guardarTodo();
        }, function () { aviso('No pude leer esa imagen.'); });
      });
    });
    cadena.then(function () { var m = cajaFotos.querySelector('.dp-fotos-msg'), t = m && m.textContent; pintarFotos(); if (t) aviso(t); if (actual === pasos.length) pintarVista(); });
  }
  document.addEventListener('version-cambiada', function (e) {
    if (!e.detail || e.detail.hoja !== 'disena-patron') return;
    Array.prototype.forEach.call(contPartes.querySelectorAll('.dp-parte'), function (d) { delete d.dataset.pedida; });
    ajustarPartes(window.lrVersiones ? window.lrVersiones.valores('disena-patron', e.detail.k) : null); pintarFotos();
  });
  var inicial = N && N.datos ? N.datos() : {}; ajustarPartes(inicial); pintarFotos();

  ir(1);
})();
