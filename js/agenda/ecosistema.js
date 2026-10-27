/* Agenda para tejedoras: hoja «Aprende y compra en Lana Rosa» (28-oct-2026).
   1) Pedir una clase personalizada (se arma el mensaje de WhatsApp con lo que la persona elige; no se guarda nada en nuestros servidores).
   2) Cursos virtuales: todavía no están a la venta; si se agregan a CURSOS aparecen aquí con su botón de compra.
   3) Patrones: los que ya compró (de su cuenta, con descarga) y los que están a la venta en la Mercería.
   4) YouTube. Los precios de las clases son los de /academy/ (si cambian allá, cambian aquí). */
(function () {
  'use strict';
  var hoja = document.getElementById('aprende-compra');
  if (!hoja) return;
  var PRECIO_HORA = 25000, WA = 'https://wa.me/573205072801?text=';
  var CURSOS = [];   // { nombre, descripcion, precio, url } cuando haya cursos virtuales a la venta
  function el(id) { return document.getElementById(id); }
  function val(id) { var e = el(id); return e ? String(e.value || '').trim() : ''; }
  function pesos(x) { return '$' + Math.round(Number(x) || 0).toLocaleString('es-CO'); }
  function medir(e, o) { var d = { event: e }; for (var k in o) d[k] = o[k]; (window.dataLayer = window.dataLayer || []).push(d); }

  /* ---- 1. clase personalizada ---- */
  function total() { return PRECIO_HORA * (parseInt(val('ag-ec-horas'), 10) || 1) * (parseInt(val('ag-ec-personas'), 10) || 1); }
  function mensajeClase() {
    var h = parseInt(val('ag-ec-horas'), 10) || 1, p = parseInt(val('ag-ec-personas'), 10) || 1;
    var l = ['Hola! Quiero reservar una clase personalizada de crochet en Villamaría.'];
    if (val('ag-ec-nombre')) l.push('Nombre: ' + val('ag-ec-nombre'));
    if (val('ag-ec-tema')) l.push('Quiero aprender: ' + val('ag-ec-tema'));
    if (val('ag-ec-nivel')) l.push('Mi nivel: ' + val('ag-ec-nivel'));
    l.push('Personas: ' + p + ' · Horas: ' + h + ' (' + pesos(PRECIO_HORA * h * p) + ', sin materiales)');
    if (val('ag-ec-cuando')) l.push('Días y horarios que me sirven: ' + val('ag-ec-cuando'));
    if (val('ag-ec-notas')) l.push('Cuéntales: ' + val('ag-ec-notas'));
    return l.join('\n');
  }
  function pintarClase() {
    var h = parseInt(val('ag-ec-horas'), 10) || 1, p = parseInt(val('ag-ec-personas'), 10) || 1;
    el('ec-total').textContent = pesos(total()) + ' (' + h + (h === 1 ? ' hora' : ' horas') + ' · ' + p + (p === 1 ? ' persona' : ' personas') + ')';
    el('ec-enviar').href = WA + encodeURIComponent(mensajeClase());
  }
  hoja.addEventListener('input', pintarClase); hoja.addEventListener('change', pintarClase);
  document.addEventListener('agenda-guardada', function () { if (hoja.classList.contains('abierta')) pintarClase(); });
  el('ec-enviar').addEventListener('click', function () { medir('academy_taller_click', { tipo: 'clase_personalizada_agenda' }); });
  pintarClase();

  /* ---- 2. cursos virtuales ---- */
  (function () {
    var caja = el('ec-cursos'); if (!CURSOS.length) return;
    caja.textContent = '';
    CURSOS.forEach(function (c) {
      var d = document.createElement('div'); d.className = 'pr-bloque';
      var h = document.createElement('h5'); h.textContent = c.nombre; var p = document.createElement('p'); p.textContent = c.descripcion + ' · ' + pesos(c.precio);
      var a = document.createElement('a'); a.className = 'boton-primario boton-chico'; a.href = c.url; a.textContent = 'Comprar el curso';
      d.appendChild(h); d.appendChild(p); d.appendChild(a); caja.appendChild(d);
    });
  })();

  /* ---- 3a. patrones comprados (los trae el módulo de la cuenta de la agenda) ---- */
  function pintarComprados() {
    var caja = el('ec-comprados'), estado = window.lrComprasEstado, lista = window.lrComprasPatrones || [];
    caja.textContent = '';
    if (estado === 'sin-sesion' || !estado) {
      var p = document.createElement('p'); p.className = 'pl-vacio';
      p.appendChild(document.createTextNode('Entra a tu cuenta gratis para ver aquí los patrones que compres y descargarlos. '));
      var a = document.createElement('a'); a.href = '/cuenta.html?volver=agenda-rosina.html%23aprende-compra'; a.textContent = 'Entrar a mi cuenta →'; p.appendChild(a); caja.appendChild(p); return;
    }
    if (!lista.length) { var q = document.createElement('p'); q.className = 'pl-vacio'; q.textContent = 'Todavía no has comprado patrones. Los que compres aparecerán aquí, listos para descargar, y también en «Mis patrones».'; caja.appendChild(q); return; }
    var ul = document.createElement('ul'); ul.className = 'ec-lista';
    lista.forEach(function (it) {
      var li = document.createElement('li'), f = String(it.fecha || '').split('-');
      var s = document.createElement('span'); s.textContent = (it.nombre || 'Patrón') + (f.length === 3 ? ' · ' + f[2] + '/' + f[1] + '/' + f[0] : ''); li.appendChild(s);
      if (!it.descargable) { var sm = document.createElement('small'); sm.textContent = 'Archivo en preparación'; li.appendChild(sm); }
      else {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'boton-primario boton-chico'; b.textContent = '⬇ Descargar PDF';
        b.addEventListener('click', async function () {
          if (!window.lrDescargarPatron) return; b.disabled = true; var antes = b.textContent; b.textContent = 'Preparando…';
          var r = await window.lrDescargarPatron(it.item_id); b.disabled = false; b.textContent = antes;
          if (r.url) { medir('resource_download', { recurso: 'patron_comprado_agenda' }); window.location.href = r.url; } else alert(r.msg || 'No pudimos preparar la descarga. Inténtalo de nuevo.');
        });
        li.appendChild(b);
      }
      ul.appendChild(li);
    });
    caja.appendChild(ul);
  }
  document.addEventListener('compras-patrones', pintarComprados); pintarComprados();

  /* ---- 3b. patrones a la venta (mismos datos públicos de la Mercería) ---- */
  (function () {
    var caja = el('ec-venta');
    fetch('https://ngjoognzvehwjtpqwrqe.supabase.co/rest/v1/rpc/obtener_merceria_web', { method: 'POST', headers: { apikey: 'sb_publishable_2TQ_piaHlSMHa79zjmOOXg_6bEwgkKD', Authorization: 'Bearer sb_publishable_2TQ_piaHlSMHa79zjmOOXg_6bEwgkKD', 'Content-Type': 'application/json' }, body: '{}' })
      .then(function (r) { if (!r.ok) throw r.status; return r.json(); })
      .then(function (filas) {
        var pat = (filas || []).filter(function (p) { return p && String(p.categoria || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '') === 'patrones'; });
        if (!pat.length) return;
        caja.textContent = '';
        var ul = document.createElement('ul'); ul.className = 'ec-lista';
        pat.slice(0, 6).forEach(function (p) {
          var li = document.createElement('li'), s = document.createElement('span'); s.textContent = p.nombre + ' · ' + pesos(p.precio_gramo); li.appendChild(s);
          var a = document.createElement('a'); a.className = 'boton-secundario boton-chico'; a.href = '/merceria/catalogo/#patrones-merceria'; a.textContent = 'Comprar'; li.appendChild(a); ul.appendChild(li);
        });
        caja.appendChild(ul);
      }).catch(function () { /* sin conexión: queda el botón al catálogo */ });
  })();
})();
