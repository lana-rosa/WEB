/* Agenda para tejedoras: presupuesto en PDF por WhatsApp (E34, 12-nov-2026; idea tomada de comparar con otra agenda, textos y diseño propios).
   En «Precio y pago» de cada pedido con total, el botón «Presupuesto» arma una hoja (cliente, producto, detalles, cantidad, envío, total, entrega y, si ya hay, abono y saldo)
   y muestra una vista previa con «Enviar por WhatsApp» y «Descargar PDF». No guarda nada ni cambia el pedido: solo lee sus campos.
   El PDF se arma aquí mismo (sin librerías ni red): la hoja se dibuja en un lienzo con las fuentes de la agenda y se pone como imagen JPEG en una página A4.
   En el celular se abre «Compartir» con el PDF (ahí se elige WhatsApp); en el computador se baja el PDF y se abre el chat de la clienta con el mensaje escrito para adjuntarlo.
   El documento va siempre en español (es para la clienta). API: window.lrPresupuesto.armar(fila) → Promise<{ pdf: Blob, imagen: dataURL, mensaje, telefono }>. */
(function () {
  'use strict';
  var N = window.lrAgendaNucleo, tp = document.getElementById('tabla-pedidos');
  if (!N || !tp || !N.tablas['tabla-pedidos']) return;
  var PD = N.tablas['tabla-pedidos'], W = 1240, H = 1754;   // A4 a 150 puntos por pulgada
  var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  function el(tag, cls, t) { var e = document.createElement(tag); if (cls) e.className = cls; if (t != null) e.textContent = t; return e; }
  function T(t) { return window.lrI18n && window.lrI18n.t ? window.lrI18n.t(t) : t; }
  function val(k, c) { var e = document.getElementById(PD.prefijo + k + '-' + c); return e ? e.value.trim() : ''; }
  function num(t) { var n = parseInt(String(t == null ? '' : t).replace(/[^0-9-]/g, ''), 10); return isFinite(n) ? n : null; }
  function pesos(n) { return '$' + Math.round(n).toLocaleString('es-CO'); }
  function total(k) { var t = num(val(k, 'totalcompra')); return t !== null ? t : num(val(k, 'precio')); }
  function fechaLarga(f) { return f.getDate() + ' de ' + MESES[f.getMonth()] + ' de ' + f.getFullYear(); }
  function entrega(k) { var t = val(k, 'entrega'), f = t && N.leerFecha ? N.leerFecha(t) : null; return f && !f.sinAnio ? fechaLarga(new Date(f.a, f.m - 1, f.d)) : t; }
  function telefono(k) { var d = val(k, 'telefono').replace(/\D/g, ''); return d.length >= 10 ? (d.length === 10 ? '57' + d : d) : ''; }
  function primerNombre(t) { return String(t || '').trim().split(/\s+/)[0] || ''; }

  function datos(k) {
    var tot = total(k), cant = num(val(k, 'cantidad')), vu = num(val(k, 'valorunidad')), env = num(val(k, 'costoenvio')) || 0, abon = num(val(k, 'abono')) || 0;
    return { cliente: val(k, 'cliente'), producto: val(k, 'pedido'), detalles: val(k, 'obs'), cantidad: cant, valorUnidad: vu, envio: env, total: tot, abono: abon, falta: tot === null ? null : Math.max(0, tot - abon), entrega: entrega(k), de: (document.getElementById('ag-duena') || {}).value || '' };
  }
  function mensaje(d) {
    var l = ['Hola' + (primerNombre(d.cliente) ? ' ' + primerNombre(d.cliente) : '') + ', te comparto el presupuesto' + (d.producto ? ' de ' + d.producto : '') + '.'];
    l.push('Total: ' + pesos(d.total) + (d.abono > 0 ? ' (ya abonado ' + pesos(d.abono) + ', falta ' + pesos(d.falta) + ')' : '') + '.');
    if (d.entrega) l.push('Entrega estimada: ' + d.entrega + '.');
    l.push('Cualquier duda, me escribes.');
    return l.join('\n');
  }

  /* ---- la hoja, dibujada en un lienzo ---- */
  function cargarImagen(src) { return new Promise(function (ok) { var i = new Image(); i.onload = function () { ok(i); }; i.onerror = function () { ok(null); }; i.src = src; }); }
  function fuentes() { var f = document.fonts; if (!f || !f.load) return Promise.resolve(); return Promise.all([f.load("700 40px 'DynaPuff'"), f.load("400 30px 'Hanken Grotesk'"), f.load("700 30px 'Hanken Grotesk'")]).catch(function () {}); }
  function envolver(c, texto, ancho, maxLineas) {
    var out = [], parrafos = String(texto || '').split(/\n+/);
    parrafos.forEach(function (p) { var pal = p.split(/\s+/).filter(Boolean), lin = ''; pal.forEach(function (w) { var t = lin ? lin + ' ' + w : w; if (c.measureText(t).width > ancho && lin) { out.push(lin); lin = w; } else lin = t; }); if (lin) out.push(lin); });
    if (maxLineas && out.length > maxLineas) { out = out.slice(0, maxLineas); out[maxLineas - 1] = out[maxLineas - 1].replace(/\s*\S{0,3}$/, '') + '…'; }
    return out;
  }
  function rect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  var TITULO = "'DynaPuff', 'Hanken Grotesk', sans-serif", TEXTO = "'Hanken Grotesk', 'Helvetica Neue', Arial, sans-serif";
  function dibujar(d) {
    return Promise.all([fuentes(), cargarImagen('/img/agenda/rosina/tejiendo.webp')]).then(function (r) {
      var cv = document.createElement('canvas'); cv.width = W; cv.height = H; var c = cv.getContext('2d'), M = 90, y;
      c.fillStyle = '#FFFFFF'; c.fillRect(0, 0, W, H);
      var g = c.createLinearGradient(0, 0, W, 330); g.addColorStop(0, '#C81B6D'); g.addColorStop(1, '#E74E96'); c.fillStyle = g; c.fillRect(0, 0, W, 330);
      c.fillStyle = 'rgba(255,255,255,.12)'; c.beginPath(); c.arc(W - 140, 60, 170, 0, 7); c.fill(); c.beginPath(); c.arc(330, 330, 110, 0, 7); c.fill();
      c.fillStyle = '#FFFFFF'; c.textBaseline = 'alphabetic'; c.font = "700 96px " + TITULO; c.fillText('Presupuesto', M, 175);
      c.font = "400 38px " + TEXTO; c.fillStyle = 'rgba(255,255,255,.92)'; c.fillText(d.de ? 'de ' + d.de : 'hecho a mano, con amor', M, 245);
      if (r[1]) { var s = 270, ar = r[1].width / r[1].height; c.drawImage(r[1], W - M - s * ar + 20, 40, s * ar, s); }
      y = 410;
      c.fillStyle = '#8E1457'; c.font = "700 30px " + TEXTO; c.fillText('PARA', M, y); c.fillText('FECHA', W / 2 + 20, y);
      c.fillStyle = '#2A2328'; c.font = "400 44px " + TEXTO; c.fillText(envolver(c, d.cliente || '—', W / 2 - M - 30, 1)[0], M, y + 58); c.fillText(fechaLarga(new Date()), W / 2 + 20, y + 58);
      if (d.entrega) { y += 130; c.fillStyle = '#8E1457'; c.font = "700 30px " + TEXTO; c.fillText('ENTREGA ESTIMADA', M, y); c.fillStyle = '#2A2328'; c.font = "400 44px " + TEXTO; c.fillText(d.entrega, M, y + 58); }
      y += 120;
      c.strokeStyle = '#F5C2DB'; c.lineWidth = 3; c.setLineDash([14, 10]); c.beginPath(); c.moveTo(M, y); c.lineTo(W - M, y); c.stroke(); c.setLineDash([]); y += 60;
      /* cuentas: se calculan primero para saber cuánto espacio queda para el producto y los detalles */
      var filas = [];
      if (d.cantidad !== null && d.valorUnidad !== null && d.cantidad > 0) filas.push([d.cantidad + (d.cantidad === 1 ? ' unidad' : ' unidades') + ' × ' + pesos(d.valorUnidad), pesos(d.cantidad * d.valorUnidad)]);
      if (d.envio > 0) filas.push(['Envío', pesos(d.envio)]);
      var alto = 150 + filas.length * 60 + (d.abono > 0 ? 140 : 0), cajaY = H - 200 - (alto + 60), libre = cajaY - 50 - y;   // «libre»: espacio para producto + detalles
      c.font = "700 56px " + TITULO; var lp = envolver(c, d.producto || 'Pedido', W - 2 * M, 2), cfg = null, ld = [], cand = [[38, 52], [32, 44], [28, 38]];
      for (var q = 0; q < cand.length && d.detalles; q++) {
        c.font = '400 ' + cand[q][0] + 'px ' + TEXTO; var t = envolver(c, d.detalles, W - 2 * M, 14);
        if (50 + lp.length * 66 + 70 + t.length * cand[q][1] <= libre || q === cand.length - 1) { cfg = cand[q]; ld = t; if (50 + lp.length * 66 + 70 + t.length * cand[q][1] <= libre) break; }
      }
      if (d.detalles && cfg && 50 + lp.length * 66 + 70 + ld.length * cfg[1] > libre) {   // aun así no cabe: se recorta con puntos suspensivos
        var maxL = Math.max(1, Math.floor((libre - 50 - lp.length * 66 - 70) / cfg[1])); c.font = '400 ' + cfg[0] + 'px ' + TEXTO; ld = envolver(c, d.detalles, W - 2 * M, maxL);
      }
      c.fillStyle = '#8E1457'; c.font = "700 30px " + TEXTO; c.fillText('PRODUCTO', M, y);
      c.fillStyle = '#2A2328'; c.font = "700 56px " + TITULO; y += 20; lp.forEach(function (t) { y += 66; c.fillText(t, M, y); });
      if (d.detalles && ld.length) {
        y += 60; c.fillStyle = '#8E1457'; c.font = "700 30px " + TEXTO; c.fillText('DETALLES', M, y); c.fillStyle = '#4A4249'; c.font = '400 ' + cfg[0] + 'px ' + TEXTO;
        ld.forEach(function (t) { y += cfg[1]; c.fillText(t, M, y); });
      }
      y = cajaY;
      c.fillStyle = '#FDF0F6'; rect(c, M, y, W - 2 * M, alto + 60, 36); c.fill();
      var cy = y + 40; c.font = "400 40px " + TEXTO;
      filas.forEach(function (f) { cy += 60; c.fillStyle = '#4A4249'; c.textAlign = 'left'; c.fillText(f[0], M + 50, cy); c.textAlign = 'right'; c.fillText(f[1], W - M - 50, cy); });
      cy += 100; c.textAlign = 'left'; c.fillStyle = '#C81B6D'; c.font = "700 56px " + TITULO; c.fillText('Total', M + 50, cy); c.textAlign = 'right'; c.fillText(pesos(d.total), W - M - 50, cy);
      if (d.abono > 0) {
        cy += 70; c.font = "400 40px " + TEXTO; c.fillStyle = '#2E7D52'; c.textAlign = 'left'; c.fillText('Ya abonado', M + 50, cy); c.textAlign = 'right'; c.fillText(pesos(d.abono), W - M - 50, cy);
        cy += 64; c.font = "700 44px " + TEXTO; c.fillStyle = '#2A2328'; c.textAlign = 'left'; c.fillText(d.falta > 0 ? 'Saldo por pagar' : 'Pagado completo', M + 50, cy); c.textAlign = 'right'; c.fillText(pesos(d.falta), W - M - 50, cy);
      }
      c.textAlign = 'left';
      c.fillStyle = '#4A4249'; c.font = "400 40px " + TEXTO; c.textAlign = 'center'; c.fillText('Gracias por tu confianza', W / 2, H - 120);
      c.fillStyle = '#9A8F96'; c.font = "400 28px " + TEXTO; c.fillText('Hecho con la agenda de Lana Rosa · lanarosacrochet.com', W / 2, H - 70); c.textAlign = 'left';
      return cv;
    });
  }

  /* ---- PDF de una página con la imagen (sin librerías) ---- */
  function aBytes(t) { var a = new Uint8Array(t.length); for (var i = 0; i < t.length; i++) a[i] = t.charCodeAt(i) & 255; return a; }
  function pdfDeJpeg(jpeg, w, h) {
    var partes = [], pos = 0, offs = [];
    function poner(x) { var b = typeof x === 'string' ? aBytes(x) : x; partes.push(b); pos += b.length; }
    function obj(n, cuerpo) { offs[n] = pos; poner(n + ' 0 obj\n' + cuerpo + '\nendobj\n'); }
    poner('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
    obj(1, '<< /Type /Catalog /Pages 2 0 R >>'); obj(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
    obj(3, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>');
    offs[4] = pos; poner('4 0 obj\n<< /Type /XObject /Subtype /Image /Width ' + w + ' /Height ' + h + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + jpeg.length + ' >>\nstream\n'); poner(jpeg); poner('\nendstream\nendobj\n');
    var cont = 'q 595.28 0 0 841.89 0 0 cm /Im0 Do Q'; obj(5, '<< /Length ' + cont.length + ' >>\nstream\n' + cont + '\nendstream');
    var xref = pos, x = 'xref\n0 6\n0000000000 65535 f \n'; for (var i = 1; i <= 5; i++) x += ('0000000000' + offs[i]).slice(-10) + ' 00000 n \n';
    poner(x + 'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF');
    return new Blob(partes, { type: 'application/pdf' });
  }
  function armar(k) {
    var d = datos(k); if (!(d.total > 0)) return Promise.reject(new Error('sin total'));
    return dibujar(d).then(function (cv) {
      return new Promise(function (ok, mal) {
        cv.toBlob(function (jp) { if (!jp) return mal(new Error('sin imagen')); jp.arrayBuffer().then(function (ab) { ok({ pdf: pdfDeJpeg(new Uint8Array(ab), W, H), imagen: cv.toDataURL('image/jpeg', 0.8), mensaje: mensaje(d), telefono: telefono(k), cliente: d.cliente, producto: d.producto }); }, mal); }, 'image/jpeg', 0.92);
      });
    });
  }

  /* ---- ventana con vista previa ---- */
  var abierta = null;
  function nombreArchivo(r) { var b = (r.cliente || r.producto || 'pedido').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase(); return 'presupuesto-' + (b || 'pedido') + '.pdf'; }
  function cerrar() { if (!abierta) return; document.removeEventListener('keydown', abierta.tecla); abierta.f.remove(); document.documentElement.classList.remove('pp-abierto'); if (abierta.volver && abierta.volver.focus) abierta.volver.focus(); abierta = null; }
  function descargar(r) { var u = URL.createObjectURL(r.pdf), a = document.createElement('a'); a.href = u; a.download = nombreArchivo(r); document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 4000); }
  function mostrar(r, volver) {
    cerrar();
    var f = el('div', 'pp-fondo'); f.setAttribute('role', 'dialog'); f.setAttribute('aria-modal', 'true'); f.setAttribute('aria-labelledby', 'pp-titulo');
    var caja = el('div', 'pp-caja'), h = el('h2', '', 'Presupuesto listo'); h.id = 'pp-titulo';
    var im = el('img', 'pp-vista'); im.src = r.imagen; im.alt = T('Vista previa del presupuesto'); im.width = 310; im.height = 438;
    var bs = el('div', 'pp-botones'), wa = el('button', 'boton-primario', 'Enviar por WhatsApp'), dl = el('button', 'boton-secundario', 'Descargar PDF'), ce = el('button', 'boton-secundario', 'Cerrar');
    wa.type = dl.type = ce.type = 'button';
    var msg = el('p', 'pp-msg'); msg.setAttribute('role', 'status');
    var archivo = null; try { archivo = new File([r.pdf], nombreArchivo(r), { type: 'application/pdf' }); } catch (e) { archivo = null; }
    var puedeCompartir = !!(archivo && navigator.canShare && navigator.share && navigator.canShare({ files: [archivo] }));
    wa.addEventListener('click', function () {
      if (puedeCompartir) { navigator.share({ files: [archivo], text: r.mensaje }).then(function () { msg.textContent = T('Listo. Elige WhatsApp en la lista para mandarlo.'); }, function (e) { if (e && e.name !== 'AbortError') msg.textContent = T('No pude abrir «Compartir». Usa «Descargar PDF» y adjúntalo en el chat.'); }); return; }
      descargar(r); window.open('https://wa.me/' + (r.telefono || '') + '?text=' + encodeURIComponent(r.mensaje), '_blank', 'noopener');
      msg.textContent = T('Se descargó el PDF y se abrió WhatsApp con el mensaje. Adjunta el PDF en el chat.');
    });
    dl.addEventListener('click', function () { descargar(r); msg.textContent = T('Se descargó el PDF.'); });
    ce.addEventListener('click', cerrar); f.addEventListener('click', function (e) { if (e.target === f) cerrar(); });
    bs.appendChild(wa); bs.appendChild(dl); bs.appendChild(ce);
    caja.appendChild(h); caja.appendChild(im); caja.appendChild(bs); caja.appendChild(msg);
    if (!r.telefono) caja.appendChild(el('p', 'pp-nota', 'Este pedido no tiene WhatsApp de la clienta: en el computador tendrás que elegir el chat.'));
    f.appendChild(caja); document.body.appendChild(f); document.documentElement.classList.add('pp-abierto'); wa.focus();
    var tecla = function (e) {
      if (e.key === 'Escape') { cerrar(); return; }
      if (e.key !== 'Tab') return; var b = [wa, dl, ce], i = b.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); b[b.length - 1].focus(); } else if (!e.shiftKey && (i === b.length - 1 || i < 0)) { e.preventDefault(); b[0].focus(); }
    };
    document.addEventListener('keydown', tecla); abierta = { f: f, tecla: tecla, volver: volver };
  }

  /* ---- botón en cada pedido ---- */
  function pintar() {
    tp.querySelectorAll('tr.ficha').forEach(function (tr) {
      var k = +tr.getAttribute('data-fila'), td = tr.querySelector('td.pd-presup'), tot = total(k);
      if (!(tot > 0) || (!val(k, 'cliente') && !val(k, 'pedido'))) { if (td) td.remove(); return; }
      if (td) return;   // el botón no cambia: lee los campos al hacer clic
      td = el('td', 'pd-presup no-imprimir'); td.setAttribute('data-col', 'presupuesto');
      var ref = tr.querySelector('td.pd-abonos') || tr.querySelector('td[data-col="saldo"]'); tr.insertBefore(td, ref ? ref.nextSibling : tr.querySelector('td.celda-cal'));
      td.appendChild(el('p', 'pl-t', 'Presupuesto para la clienta'));
      var b = el('button', 'boton-secundario boton-chico', '📄 Armar presupuesto'); b.type = 'button';
      var msg = el('p', 'iv-aviso mal'); msg.setAttribute('role', 'alert'); msg.hidden = true;
      b.addEventListener('click', function () {
        msg.hidden = true; b.disabled = true;
        armar(k).then(function (r) { b.disabled = false; mostrar(r, b); }, function () { b.disabled = false; msg.textContent = T('No pude armar el presupuesto. Revisa que el pedido tenga el total.'); msg.hidden = false; });
      });
      td.appendChild(b); td.appendChild(msg);
    });
  }
  var espera = 0;
  function programar() { clearTimeout(espera); espera = setTimeout(pintar, 300); }
  document.addEventListener('agenda-guardada', programar);
  new MutationObserver(programar).observe(tp, { childList: true });
  new MutationObserver(programar).observe(document.getElementById('control-pedidos') || tp, { attributes: true, attributeFilter: ['class'] });
  programar();
  window.lrPresupuesto = { armar: armar, pintar: pintar };
})();
