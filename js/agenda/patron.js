/* Agenda para tejedoras: «Diseña tu patrón» (27-oct-2026).
   Guía en siete pasos para escribir un patrón propio y dejarlo listo para imprimir o bajar como texto.
   Los datos son los campos ag-dp-* de la hoja (cada patrón es una ficha; lo maneja formas.js). */
(function () {
  'use strict';
  var hoja = document.getElementById('disena-patron');
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
    for (var n = 1; n <= 6; n++) { var nom = v('ag-dp-p' + n + '-nombre'), vu = v('ag-dp-p' + n + '-vueltas'); if (nom || vu) partes.push({ nombre: nom || ('Parte ' + n), vueltas: vu }); }
    return {
      nombre: v('ag-dp-nombre') || 'Mi patrón', tipo: v('ag-dp-tipo'), nivel: v('ag-dp-nivel'), medida: v('ag-dp-medida'), descr: v('ag-dp-descr'),
      lana: v('ag-dp-lana'), aguja: v('ag-dp-aguja'), otros: v('ag-dp-otros'), muestra: v('ag-dp-muestra'), abrev: v('ag-dp-abrev'),
      partes: partes, armado: v('ag-dp-armado'), detalles: v('ag-dp-detalles'), notas: v('ag-dp-notas'), probado: v('ag-dp-probado'), autora: v('ag-duena')
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
  ir(1);
})();
