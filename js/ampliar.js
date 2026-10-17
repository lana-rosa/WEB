// Ampliar fotos al tocarlas: todo lo que esté dentro de un elemento con data-ampliar abre la foto en grande (tienda: ficha del producto;
// Personaliza: «De la foto al amigurumi», «Otros personalizados» y los tamaños). Flechas, deslizar con el dedo y Escape para cerrar.
(function () {
  var estilo = document.createElement('style');
  estilo.textContent = '[data-ampliar] img{cursor:zoom-in}'
    + '.amp-fondo{position:fixed;inset:0;background:rgba(20,12,16,.92);z-index:10000;display:flex;align-items:center;justify-content:center;touch-action:pan-y pinch-zoom}'
    + '.amp-fondo img{max-width:94vw;max-height:84vh;object-fit:contain;border-radius:12px;background:#fff;touch-action:pinch-zoom}'
    + '.amp-boton{position:absolute;border:0;border-radius:999px;background:rgba(255,255,255,.95);color:#3a2a2e;font:700 1rem/1 inherit;font-family:inherit;cursor:pointer;min-width:44px;min-height:44px;display:flex;align-items:center;justify-content:center}'
    + '.amp-boton:hover,.amp-boton:focus-visible{background:#fff;outline:3px solid #E74E96}'
    + '.amp-cerrar{top:14px;right:14px;padding:0 16px}'
    + '.amp-ant,.amp-sig{top:50%;transform:translateY(-50%);font-size:1.6rem}'
    + '.amp-ant{left:10px}.amp-sig{right:10px}'
    + '.amp-pie{position:absolute;left:0;right:0;bottom:14px;text-align:center;color:#fff;font-size:.9rem;padding:0 60px}';
  // Sin fundido de entrada: con el fundido se veía por un instante la foto pequeña de atrás junto a la ampliada (un «cuadrito»).
  document.head.appendChild(estilo);

  function fotos(contenedor) {
    var vistas = {}, lista = [];
    contenedor.querySelectorAll('img').forEach(function (i) {
      var src = i.currentSrc || i.src; if (!src || vistas[src]) return;
      vistas[src] = 1; lista.push({ src: src, alt: i.alt || '' });
    });
    return lista;
  }

  var abierto = null;
  function cerrar() {
    if (!abierto) return;
    document.removeEventListener('keydown', abierto.tecla); abierto.fondo.remove();
    var foco = abierto.foco; abierto = null; if (foco && foco.focus) try { foco.focus(); } catch (e) {}
  }
  function abrir(lista, indice, foco) {
    if (abierto) cerrar();
    var i = indice, fondo = document.createElement('div'); fondo.className = 'amp-fondo'; fondo.setAttribute('role', 'dialog'); fondo.setAttribute('aria-modal', 'true'); fondo.setAttribute('aria-label', 'Foto ampliada');
    var img = document.createElement('img');
    var pie = document.createElement('p'); pie.className = 'amp-pie';
    var bc = document.createElement('button'); bc.type = 'button'; bc.className = 'amp-boton amp-cerrar'; bc.textContent = '✕ Cerrar'; bc.setAttribute('aria-label', 'Cerrar la foto');
    var ba = document.createElement('button'), bs = document.createElement('button');
    ba.type = bs.type = 'button'; ba.className = 'amp-boton amp-ant'; bs.className = 'amp-boton amp-sig'; ba.textContent = '‹'; bs.textContent = '›'; ba.setAttribute('aria-label', 'Foto anterior'); bs.setAttribute('aria-label', 'Foto siguiente');
    fondo.append(img, pie, bc);
    if (lista.length > 1) fondo.append(ba, bs);
    function pintar() { img.src = lista[i].src; img.alt = lista[i].alt; pie.textContent = (lista.length > 1 ? (i + 1) + ' de ' + lista.length + (lista[i].alt ? ' · ' : '') : '') + lista[i].alt; }
    function mover(d) { i = (i + d + lista.length) % lista.length; pintar(); }
    function tecla(e) { if (e.key === 'Escape') cerrar(); else if (e.key === 'ArrowLeft' && lista.length > 1) mover(-1); else if (e.key === 'ArrowRight' && lista.length > 1) mover(1); }
    bc.addEventListener('click', cerrar); ba.addEventListener('click', function () { mover(-1); }); bs.addEventListener('click', function () { mover(1); });
    fondo.addEventListener('click', function (e) { if (e.target === fondo || e.target === pie) cerrar(); });
    var x0 = null;
    fondo.addEventListener('touchstart', function (e) { x0 = e.touches.length === 1 ? e.touches[0].clientX : null; }, { passive: true });
    fondo.addEventListener('touchend', function (e) { if (x0 === null || lista.length < 2) return; var dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50) mover(dx < 0 ? 1 : -1); x0 = null; }, { passive: true });
    document.addEventListener('keydown', tecla);
    document.body.appendChild(fondo); pintar(); bc.focus();
    abierto = { fondo: fondo, tecla: tecla, foco: foco };
    try { (window.dataLayer = window.dataLayer || []).push({ event: 'foto_ampliada' }); } catch (e) {}
  }

  document.addEventListener('click', function (e) {
    var im = e.target && e.target.closest && e.target.closest('[data-ampliar] img');
    if (!im || im.closest('a[href], button')) return;   // una foto que ya es enlace o botón conserva su función
    var cont = im.closest('[data-ampliar]'), lista = fotos(cont), src = im.currentSrc || im.src;
    var n = lista.findIndex(function (f) { return f.src === src; });
    if (n < 0) return;
    e.preventDefault(); abrir(lista, n, im);
  });
  // con teclado: Enter o espacio sobre una foto enfocada
  document.addEventListener('keydown', function (e) {
    if ((e.key === 'Enter' || e.key === ' ') && e.target && e.target.matches && e.target.matches('[data-ampliar] img')) { e.preventDefault(); e.target.click(); }
  });
  function preparar(raiz) {
    (raiz || document).querySelectorAll('[data-ampliar] img').forEach(function (i) {
      if (i.closest('a[href], button') || i.hasAttribute('tabindex')) return;
      i.tabIndex = 0; i.setAttribute('role', 'button'); i.setAttribute('aria-label', 'Ampliar foto' + (i.alt ? ': ' + i.alt : ''));
    });
  }
  preparar();
  new MutationObserver(function () { preparar(); }).observe(document.documentElement, { childList: true, subtree: true });
})();
