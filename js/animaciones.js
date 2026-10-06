/* Animaciones sutiles de Lana Rosa. Si algo falla, la página se ve normal. */
(function () {
  'use strict';
  var quieto = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var enc = document.querySelector('.encabezado');

  // encabezado compacto al bajar
  if (enc) {
    var f = function () { enc.classList.toggle('compacto', window.scrollY > 40); };
    window.addEventListener('scroll', f, { passive: true }); f();
  }

  if (quieto) return;

  // aparición al hacer scroll: solo lo que está debajo de la pantalla y dentro del ancho visible
  if ('IntersectionObserver' in window) {
    var SEL = 'main section .contenedor > *, main .ed-historia, main .ed-tejer-item, main .ed-tienda > a, main .faq-item, .pie-rico .pie-grid > div';
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('rev-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    var vh = window.innerHeight, vw = window.innerWidth, n = 0;
    document.querySelectorAll(SEL).forEach(function (el) {
      if (el.closest('.ed-hero, .franja-casas, .encabezado, [data-sin-anim]')) return;
      var r = el.getBoundingClientRect();
      if (r.top < vh || r.left < 0 || r.right > vw + 1) return; // ya visible o en una fila deslizable
      var h = el.parentElement; // escalonar hermanos (máx. 4)
      el.style.setProperty('--rev-d', Math.min(n % 4, 3) * 70 + 'ms'); n++;
      el.classList.add('rev'); io.observe(el);
    });
    // red de seguridad: nunca dejar nada oculto
    setTimeout(function () { document.querySelectorAll('.rev:not(.rev-in)').forEach(function (el) { var r = el.getBoundingClientRect(); if (r.top < window.innerHeight) el.classList.add('rev-in'); }); }, 4000);
    window.addEventListener('load', function () { setTimeout(function () { document.querySelectorAll('.rev:not(.rev-in)').forEach(function (el) { io.observe(el); }); }, 50); });
  }

  // contador del carrito: rebote al cambiar
  var c = document.getElementById('contador-carrito');
  if (c && 'MutationObserver' in window) {
    var antes = c.textContent;
    new MutationObserver(function () {
      if (c.textContent === antes) return; antes = c.textContent;
      c.classList.remove('rebote'); void c.offsetWidth; c.classList.add('rebote');
    }).observe(c, { childList: true, characterData: true, subtree: true });
  }

  // saludo de Rosina (una vez por visita, solo en páginas de navegación)
  try {
    var pag = location.pathname.split('/').filter(Boolean).pop() || 'index.html';
    if (/^(index|tienda|personaliza|merceria|academy|aprende|recursos-rosina|sobre-nosotras)(\.html)?$/.test(pag) && !sessionStorage.getItem('saludo-rosina')) {
      setTimeout(function () {
        if (document.querySelector('.panel-carrito.abierto, .nav-movil-panel.abierto')) return;
        sessionStorage.setItem('saludo-rosina', '1');
        var a = document.createElement('a'); a.className = 'saludo-rosina'; a.href = 'rosina.html';
        a.addEventListener('click', function (ev) { if (window.abrirRosinaChat) { ev.preventDefault(); window.abrirRosinaChat(); } });
        a.innerHTML = '<img src="img/mini/rosina-saludo.webp" alt="" width="46" height="46"><span><b>¡Hola!</b> Soy Rosina, la asistente de Lana Rosa. ¿Te ayudo?</span><button type="button" class="saludo-cerrar" aria-label="Cerrar">×</button>';
        a.querySelector('button').addEventListener('click', function (ev) { ev.preventDefault(); ev.stopPropagation(); a.remove(); });
        document.body.appendChild(a);
        setTimeout(function () { if (a.parentNode) a.remove(); }, 9000);
      }, 6000);
    }
  } catch (e) {}

  // chat de ayuda de Rosina (botón flotante)
  try { var sc = document.createElement('script'); sc.src = '/js/rosina-chat.js?v=2'; sc.defer = true; document.body.appendChild(sc); } catch (e) {}
})();
