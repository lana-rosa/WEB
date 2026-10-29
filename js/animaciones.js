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

  // Carrito accesible (auditoría 360, ACC-03 y ACC-04). El panel lateral se comporta como un diálogo modal: al abrirlo el foco pasa a él y se queda
  // dentro (Tab), Esc lo cierra y el foco vuelve al botón del carrito; cerrado, no se puede alcanzar con el teclado (inert). El botón del carrito dice
  // cuántos productos hay y así su nombre contiene el número que se ve. Funciona con cualquier página que tenga #panel-carrito, sin tocar su código.
  try {
    var panelC = document.getElementById('panel-carrito'), botonC = document.getElementById('boton-carrito'), contadorC = document.getElementById('contador-carrito');
    if (botonC && contadorC) {
      var etiquetaC = function () { var n = parseInt(contadorC.textContent, 10) || 0; botonC.setAttribute('aria-label', 'Ver carrito de compras, ' + n + (n === 1 ? ' producto' : ' productos')); };
      etiquetaC(); new MutationObserver(etiquetaC).observe(contadorC, { childList: true, characterData: true, subtree: true });
    }
    if (panelC && botonC) {
      panelC.setAttribute('role', 'dialog'); panelC.setAttribute('aria-modal', 'true'); panelC.setAttribute('aria-label', 'Tu carrito');
      var previoC = null, estabaAbierto = false;
      var enfocablesC = function () {
        return Array.prototype.filter.call(panelC.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'),
          function (e) { return e.offsetParent !== null || e === document.activeElement; });
      };
      var sincronizarC = function () {
        var abierto = panelC.classList.contains('abierto');
        panelC.inert = !abierto;
        if (abierto && !estabaAbierto) {
          previoC = document.activeElement;
          setTimeout(function () { var c = document.getElementById('cerrar-carrito') || panelC; try { c.focus({ preventScroll: true }); } catch (e) {} }, 0);
        } else if (!abierto && estabaAbierto) {
          var v = previoC, ahora = document.activeElement; previoC = null;
          // solo se devuelve el foco si nadie más lo tomó (por ejemplo, la ventana de pago que se abre justo después)
          if (!ahora || ahora === document.body || panelC.contains(ahora)) { try { (v && v !== document.body && document.contains(v) ? v : botonC).focus({ preventScroll: true }); } catch (e) {} }
        }
        estabaAbierto = abierto;
      };
      sincronizarC();
      new MutationObserver(sincronizarC).observe(panelC, { attributes: true, attributeFilter: ['class'] });
      document.addEventListener('keydown', function (e) {
        if (!panelC.classList.contains('abierto')) return;
        if (e.key === 'Escape' && panelC.contains(document.activeElement)) {
          e.preventDefault(); var x = document.getElementById('cerrar-carrito'); if (x) x.click(); return;
        }
        if (e.key !== 'Tab') return;
        var l = enfocablesC(); if (!l.length) return;
        var primero = l[0], ultimo = l[l.length - 1];
        if (!panelC.contains(document.activeElement)) { e.preventDefault(); primero.focus(); }
        else if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
        else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
      });
    }
  } catch (e) { /* si algo falla, el carrito sigue funcionando como antes */ }


  // Medición (Google Tag Manager): eventos limpios en dataLayer. No cambia nada visible.
  try {
    var dl = (window.dataLayer = window.dataLayer || []);
    var ev = function (nombre, datos) { var o = { event: nombre, pagina: location.pathname }; for (var k in datos) o[k] = datos[k]; dl.push(o); };
    var casaDe = function (ruta) { return /\/merceria(\/|\.html)/.test(ruta) ? 'merceria' : /\/academy(\/|$)|aprende|rosina|recursos|glosario|paletas|calculadoras|agenda/.test(ruta) ? 'academy' : /tienda|personaliza/.test(ruta) ? 'tienda' : ''; };
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href], button');
      if (!a) return;
      var h = a.getAttribute('href') || '';
      if (/wa\.me|api\.whatsapp\.com/.test(h)) ev('clic_whatsapp', { ubicacion: a.closest('.whatsapp-flotante') ? 'flotante' : (a.closest('footer, .pie-rico') ? 'pie' : 'pagina') });
      else if (/personaliza/.test(h)) ev('clic_personalizar', { destino: h });
      else if (/(^|\/)academy\//.test(h) && !/\/academy\//.test(location.pathname)) ev('clic_academy', { destino: h });
      else if (/(^|\/)merceria\//.test(h) && !/\/merceria\//.test(location.pathname)) ev('clic_merceria', { destino: h });
      else if (/(^|\/)tienda\.html/.test(h) && !/tienda\.html/.test(location.pathname)) ev('clic_tienda', { destino: h });
      if (a.id === 'boton-pagar-wompi' || /pagar/i.test(a.id || '')) ev('begin_checkout', {});
    }, true);
    // clics con significado de negocio: tienda física, taller, recursos, descargas, reseñas, contacto de la Mercería
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a) return;
      var h = a.getAttribute('href') || '';
      var enMerceria = /^\/merceria\//.test(location.pathname);
      if (/\/merceria\/tienda-fisica|maps\.app\.goo|google\.com\/maps|g\.page|goo\.gl\/maps/.test(h)) ev('store_physical_click', { destino: h.slice(0, 80) });
      if (/\/academy\/talleres/.test(h) || (/wa\.me/.test(h) && /taller/i.test(decodeURIComponent(h)))) ev('academy_taller_click', { destino: h.slice(0, 80) });
      if (/(glosario|paletas|calculadoras|agenda|recursos)-rosina\.html/.test(h)) ev('resource_use', { recurso: (h.match(/(glosario|paletas|calculadoras|agenda|recursos)-rosina/) || [])[1] });
      // las descargas de recursos pasan por la puerta de la cuenta (js/suscripcion.js): solo se miden cuando la descarga empieza de verdad
      var tras = !(a.hasAttribute('data-puerta') && a.dataset.libre !== '1');
      if (tras && (a.hasAttribute('download') || /\/img\/(fondos|stickers)\/|\.pdf(\?|$)/i.test(h))) ev('resource_download', { archivo: h.split('/').pop().slice(0, 60) });
      if (/share\.google|g\.page\/r|search\.google\.com\/local\/(write)?review/.test(h)) ev('review_click', {});
      if (enMerceria && /wa\.me|api\.whatsapp\.com/.test(h)) ev('merceria_contacto', {});
    }, true);
    // personalizados: primera vez que alguien empieza a llenar el formulario
    var iniciado = false;
    document.addEventListener('focusin', function (e) {
      if (iniciado || !/personaliza/.test(location.pathname)) return;
      var f = e.target.closest && e.target.closest('form');
      if (f && f.id === 'form-personalizado') { iniciado = true; ev('personalizacion_inicio', {}); }
    });
    // agregar al carrito (tienda y mercería): se detecta cuando sube la cantidad del carrito guardado
    var setItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) {
      try {
        if (k === 'carritoLanaRosa' && this === window.localStorage) {
          var antes = JSON.parse(this.getItem(k) || '[]'), nuevo = JSON.parse(v || '[]');
          var cant = function (l) { return l.reduce(function (s, i) { return s + (i.cantidad || 0); }, 0); };
          if (cant(nuevo) > cant(antes)) {
            var it = nuevo.filter(function (n) { var o = antes.filter(function (x) { return x.id === n.id; })[0]; return !o || n.cantidad > o.cantidad; })[0] || {};
            ev('add_to_cart', { producto: it.nombre || '', valor: it.precio || 0, area: casaDe(location.pathname) });
          }
          else if (cant(nuevo) < cant(antes)) {
            var q = antes.filter(function (o) { var n = nuevo.filter(function (x) { return x.id === o.id; })[0]; return !n || n.cantidad < o.cantidad; })[0] || {};
            ev('remove_from_cart', { producto: q.nombre || '', valor: q.precio || 0, area: casaDe(location.pathname) });
          }
        }
      } catch (er) {}
      return setItem.apply(this, arguments);
    };
    // búsqueda y filtros
    var tBus;
    document.addEventListener('input', function (e) {
      var t = e.target; if (!t || t.tagName !== 'INPUT' || !/busca/i.test(t.id + ' ' + (t.name || ''))) return;
      clearTimeout(tBus); tBus = setTimeout(function () { if (t.value && t.value.length > 2) ev('search', { termino: t.value.slice(0, 60), area: casaDe(location.pathname) }); }, 1200);
    });
    document.addEventListener('change', function (e) {
      var t = e.target; if (!t || !t.closest || !t.closest('.filtros, .filtros-desplegables, .buscador-productos, .filtro-categoria, #filtros-merceria')) return;
      ev('filtro_producto', { filtro: t.id || t.name || '', valor: String(t.value).slice(0, 40) });
    });
    // formularios enviados (contacto, reseñas, cuenta, personalizados)
    document.addEventListener('submit', function (e) { var f = e.target; if (f && f.tagName === 'FORM') ev('form_enviado', { formulario: f.id || f.getAttribute('aria-label') || 'form' }); }, true);
    // ficha de producto abierta (clic en la foto o el nombre de una tarjeta)
    document.addEventListener('click', function (e) {
      var c = e.target.closest && e.target.closest('.producto-card');
      if (!c || e.target.closest('.boton-agregar-carrito, button')) return;
      var im = c.querySelector('img[data-id]'), p = (window.DATOS_PRODUCTOS || {})[im && im.dataset.id];
      ev('select_item', { producto: p ? p.nombre : (im && im.alt) || '', area: casaDe(location.pathname) });
      ev('view_item', { producto: p ? p.nombre : (im && im.alt) || '', valor: p ? p.precio : 0 });
    }, true);
  } catch (e) {}



  // App instalable: servicio mínimo (pantalla sin conexión) y botón discreto "Instalar app" del pie
  try {
    if ('serviceWorker' in navigator) window.addEventListener('load', function () { navigator.serviceWorker.register('/sw.js').catch(function () {}); });
    var bi = document.querySelector('[data-instalar]');
    var enApp = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone;
    if (bi && !enApp) {
      var ayudaIn = document.querySelector('.instalar-ayuda'), ofrecido = null, dlI = (window.dataLayer = window.dataLayer || []);
      window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); ofrecido = e; bi.hidden = false; });
      window.addEventListener('appinstalled', function () { bi.hidden = true; if (ayudaIn) ayudaIn.hidden = true; dlI.push({ event: 'app_instalada', pagina: location.pathname }); });
      if (/iphone|ipad|ipod/i.test(navigator.userAgent)) bi.hidden = false;   // iPhone no avisa: se muestra la indicación manual
      bi.addEventListener('click', function () {
        dlI.push({ event: 'clic_instalar_app', pagina: location.pathname });
        if (ofrecido) { ofrecido.prompt(); ofrecido.userChoice.then(function () { ofrecido = null; bi.hidden = true; }); }
        else if (ayudaIn) ayudaIn.hidden = !ayudaIn.hidden;
      });
    }
  } catch (e) {}

  // botones "Hablar con Rosina": abren el chat; si no cargó, siguen el enlace
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest && ev.target.closest('[data-abrir-rosina]');
    if (b && window.abrirRosinaChat) { ev.preventDefault(); window.abrirRosinaChat(); }
  });

  if (quieto) return;

  // aparición al hacer scroll: solo lo que está debajo de la pantalla y dentro del ancho visible
  if ('IntersectionObserver' in window) {
    var SEL = 'main section .contenedor > *, main .ed-historia, main .ed-tejer-item, main .ed-tienda > a, main .faq-item, .pie-rico .pie-grid > div, main .cat-merceria, main .puente, main .razon, main .banda-apertura, main .aviso-personalizado, main .puerta, main .herramienta, main .mat-pasos li, main .rosina-academy, main .materiales-academy, main .seccion-merceria > h2, main .seccion-academy > h2';
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('rev-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    var vh = window.innerHeight, vw = window.innerWidth, n = 0;
    document.querySelectorAll(SEL).forEach(function (el) {
      if (el.closest('.ed-hero, .franja-casas, .encabezado, [data-sin-anim]')) return;
      var r = el.getBoundingClientRect();
      if (r.top < vh || r.left < 0 || r.right > vw + 1) return; // ya visible o en una fila deslizable
      var h = el.parentElement; // escalonar hermanos (máx. 4)
      el.style.setProperty('--rev-d', Math.min(n % 4, 3) * 40 + 'ms'); n++;
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
        var a = document.createElement('a'); a.className = 'saludo-rosina'; a.href = '/universo-rosina.html#regalar';
        a.addEventListener('click', function (ev) { if (window.abrirRosinaChat) { ev.preventDefault(); window.abrirRosinaChat(); } });
        a.innerHTML = '<img src="/img/mini/rosina-saludo.webp" alt="" width="46" height="46"><span><b>¡Hola!</b> Soy Rosina, la asistente de Lana Rosa. ¿Te ayudo?</span><button type="button" class="saludo-cerrar" aria-label="Cerrar">×</button>';
        a.querySelector('button').addEventListener('click', function (ev) { ev.preventDefault(); ev.stopPropagation(); a.remove(); });
        document.body.appendChild(a);
        setTimeout(function () { if (a.parentNode) a.remove(); }, 9000);
      }, 6000);
    }
  } catch (e) {}

  // Logo animado del pie (Tienda): arranca cuando se ve; con «reducir movimiento» queda quieto y completo.
  try {
    var logoAnim = document.querySelector('.pie-logo-anim');
    if (logoAnim && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      logoAnim.classList.add('la-lista');
      if ('IntersectionObserver' in window) {
        var obsLogo = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { logoAnim.classList.add('la-va'); obsLogo.disconnect(); } }, { threshold: 0.4 });
        obsLogo.observe(logoAnim);
      } else { logoAnim.classList.add('la-va'); }
    }
  } catch (e) {}

  // Menú móvil (las tres rayitas): con el menú abierto la página de atrás no se desplaza (antes, al llegar al final del menú, la página se movía y el primer renglón parecía saltar).
  try {
    var panelM = document.getElementById('nav-movil-panel');
    if (panelM && 'MutationObserver' in window) {
      new MutationObserver(function () { document.documentElement.classList.toggle('menu-bloqueado', panelM.classList.contains('abierto')); })
        .observe(panelM, { attributes: true, attributeFilter: ['class'] });
    }
  } catch (e) {}

  // chat de ayuda de Rosina (botón flotante)
  try { var sc = document.createElement('script'); sc.src = '/js/rosina-chat.js?v=11'; sc.defer = true; document.body.appendChild(sc); } catch (e) {}
})();
