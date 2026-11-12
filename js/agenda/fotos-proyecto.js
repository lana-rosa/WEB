/* Agenda para tejedoras: fotos de cada proyecto, antes, durante y después (E34, 12-nov-2026; idea tomada de comparar con otra agenda, textos y diseño propios).
   En la «Ficha de proyecto», debajo del «Dibujo del diseño», sale «Fotos del proyecto»: hasta 8 fotos por ficha, con «Antes», «Durante» o «Después» (o lo que la persona escriba),
   «Quitar» y una vista grande al tocar la foto. Los DATOS son del chat 1: todo pasa por `window.lrDibStore.fotos` (clave `ficha-proyecto:<k>:f<n>`, copias, cuenta y Drive); aquí no se escribe
   `_dib` a mano. Sigue a la ficha que se está viendo (evento `version-cambiada`). Si cambian las fotos desde otro lado (copia, Drive), se repinta al guardar. */
(function () {
  'use strict';
  var F = window.lrDibStore && window.lrDibStore.fotos, base = document.getElementById('dibujo-proyecto'), HOJA = 'ficha-proyecto';
  if (!F || !base) return;
  var caja = null, firma = '', visor = null;
  function el(tag, cls, t) { var e = document.createElement(tag); if (cls) e.className = cls; if (t != null) e.textContent = t; return e; }
  function T(t) { return window.lrI18n && window.lrI18n.t ? window.lrI18n.t(t) : t; }
  function ficha() { return window.lrVersiones ? window.lrVersiones.actual(HOJA) : 'k1'; }
  function max() { return F.maximo(HOJA); }

  function cerrarVisor() { if (!visor) return; document.removeEventListener('keydown', visor.tecla); visor.f.remove(); document.documentElement.classList.remove('pp-abierto'); if (visor.volver && visor.volver.focus) visor.volver.focus(); visor = null; }
  function abrirVisor(foto, volver) {
    cerrarVisor();
    var f = el('div', 'pp-fondo'); f.setAttribute('role', 'dialog'); f.setAttribute('aria-modal', 'true'); f.setAttribute('aria-labelledby', 'fp-titulo');
    var c = el('div', 'pp-caja fp-visor'), h = el('h2', '', foto.t || 'Foto del proyecto'); h.id = 'fp-titulo'; h.setAttribute('data-no-traducir', '');
    var im = el('img', 'fp-grande'); im.src = foto.img; im.alt = foto.t || T('Foto del proyecto');
    var b = el('button', 'boton-secundario', 'Cerrar'); b.type = 'button'; b.addEventListener('click', cerrarVisor); f.addEventListener('click', function (e) { if (e.target === f) cerrarVisor(); });
    c.appendChild(h); c.appendChild(im); c.appendChild(b); f.appendChild(c); document.body.appendChild(f); document.documentElement.classList.add('pp-abierto'); b.focus();
    var tecla = function (e) { if (e.key === 'Escape') cerrarVisor(); else if (e.key === 'Tab') { e.preventDefault(); b.focus(); } };
    document.addEventListener('keydown', tecla); visor = { f: f, tecla: tecla, volver: volver };
  }

  function mensaje(txt) { var p = caja && caja.querySelector('.fp-msg'); if (p) p.textContent = txt || ''; }
  function motivoTxt(m) {
    return m === 'maximo' ? 'Ya tienes ' + max() + ' fotos en este proyecto. Quita alguna para agregar otra.'
      : m === 'espacio' ? 'Ya hay muchas fotos guardadas en tu agenda. Quita alguna para subir otra.'
      : m === 'imagen' ? 'No pude leer esa imagen.' : 'No pude guardar la foto.';
  }
  function subir(archivos) {
    var k = ficha(), cadena = Promise.resolve(), aviso = '';
    archivos.forEach(function (a) {
      cadena = cadena.then(function () {
        var p = F.puedeAgregar(HOJA, k, 0); if (!p.ok && p.motivo === 'maximo') { aviso = motivoTxt('maximo'); return; }
        return F.reducir(a).then(function (url) { var r = F.agregar(HOJA, k, url, ''); if (!r.ok) aviso = motivoTxt(r.motivo); }, function () { aviso = motivoTxt('imagen'); });
      });
    });
    cadena.then(function () { pintar(true); if (aviso) mensaje(aviso); });
  }

  var ETIQUETAS = ['Antes', 'Durante', 'Después'];
  function pintar(forzar) {
    if (!caja) return;
    var k = ficha(), lista = F.lista(HOJA, k), nueva = k + '|' + lista.map(function (x) { return x.clave + ':' + x.t + ':' + x.img.length; }).join(',');
    if (!forzar && nueva === firma) return;
    var ac = document.activeElement; if (!forzar && ac && ac.tagName === 'INPUT' && caja.contains(ac)) return;
    firma = nueva; caja.textContent = '';
    caja.appendChild(el('label', 'fp-titulo', 'Fotos del proyecto (antes, durante y después)'));
    var rej = el('div', 'fp-rejilla');
    lista.forEach(function (x) {
      var fig = el('figure', 'fp-foto'), ver = el('button', 'fp-ver'); ver.type = 'button'; ver.setAttribute('aria-label', T('Ver la foto más grande') + (x.t ? ': ' + x.t : ''));
      var im = el('img'); im.src = x.img; im.alt = x.t || T('Foto del proyecto'); im.loading = 'lazy'; ver.appendChild(im); ver.addEventListener('click', function () { abrirVisor(x, ver); }); fig.appendChild(ver);
      var chips = el('div', 'fp-chips no-imprimir'); chips.setAttribute('role', 'group'); chips.setAttribute('aria-label', T('Qué muestra esta foto'));
      ETIQUETAS.forEach(function (e) {
        var b = el('button', 'fp-chip' + (x.t === e ? ' activo' : ''), e); b.type = 'button'; b.setAttribute('aria-pressed', x.t === e ? 'true' : 'false');
        b.addEventListener('click', function () { F.etiquetar(x.clave, x.t === e ? '' : e); pintar(true); }); chips.appendChild(b);
      });
      fig.appendChild(chips);
      var t = el('input', 'fp-t no-imprimir'); t.type = 'text'; t.maxLength = 80; t.value = x.t; t.placeholder = T('O escribe qué muestra'); t.setAttribute('aria-label', T('Qué muestra esta foto'));
      t.addEventListener('change', function () { F.etiquetar(x.clave, t.value.trim()); pintar(true); }); fig.appendChild(t);
      if (x.t) { var cap = el('figcaption', 'fp-cap', x.t); cap.setAttribute('data-no-traducir', ''); fig.appendChild(cap); }
      var q = el('button', 'enlace-copia fp-quitar no-imprimir', 'Quitar'); q.type = 'button'; q.setAttribute('aria-label', T('Quitar esta foto'));
      q.addEventListener('click', function () { F.quitar(x.clave); pintar(true); }); fig.appendChild(q);
      rej.appendChild(fig);
    });
    caja.appendChild(rej);
    var barra = el('div', 'fp-barra no-imprimir');
    var lab = el('label', 'dib-subir boton-secundario boton-chico', '📷 Agregar fotos'), inp = el('input'); inp.type = 'file'; inp.accept = 'image/*'; inp.multiple = true; inp.hidden = true; lab.appendChild(inp);
    inp.addEventListener('change', function () { var fs = Array.prototype.slice.call(inp.files || []); inp.value = ''; if (fs.length) subir(fs); });
    var n = el('span', 'fp-cuenta', lista.length + ' de ' + max()); n.setAttribute('data-no-traducir', '');
    if (lista.length < max()) barra.appendChild(lab);   // con el máximo, el botón no se muestra (un [hidden] no basta: el estilo del botón lo pisa)
    barra.appendChild(n); caja.appendChild(barra);
    var m = el('p', 'fp-msg no-imprimir'); m.setAttribute('role', 'status'); caja.appendChild(m);
  }

  function montar() {
    var linea = base.closest('.linea') || base.parentNode; caja = el('div', 'linea ancha fp-caja'); linea.parentNode.insertBefore(caja, linea.nextSibling);
    pintar(true);
    document.addEventListener('version-cambiada', function (e) { if (e.detail && e.detail.hoja === HOJA) { cerrarVisor(); pintar(true); } });
    var espera = 0; document.addEventListener('agenda-guardada', function () { clearTimeout(espera); espera = setTimeout(function () { pintar(false); }, 400); });
  }
  montar();
  if (window.lrDibStore.listo && window.lrDibStore.listo.then) window.lrDibStore.listo.then(function () { pintar(true); }, function () {});   // las fotos viven en IndexedDB: se pintan cuando el almacén termina de abrir
  window.lrFotosProyecto = { pintar: function () { pintar(true); } };
})();
