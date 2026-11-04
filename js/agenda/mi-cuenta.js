/* Agenda para tejedoras: «Mi cuenta» (3-nov-2026, pedido de Jennifer).
   Un solo menú arriba, el de la foto de la persona (se quitan de la barra el engranaje, el idioma y el botón de cuenta, que pasan al menú),
   foto o ícono de perfil (Rosina y sus amigos) y nombre del negocio.
   Datos: `datos._perfil = { avatar: 'rosina-tejiendo' | 'animal-tortuga' | 'foto', negocio: '' }` (viaja en copias, nube y Drive con el resto de la agenda);
   la foto propia va como `datos._dib['perfil:foto'] = { s: [], img: dataURL 256 px }`, o sea por `lrDibStore` (IndexedDB), igual que los dibujos.
   No se sube a ningún servidor aparte. Los demás controles siguen en la página (ocultos) y el menú los acciona. */
(function () {
  'use strict';
  var N = window.lrAgendaNucleo; if (!N) return;
  var ROSINA = ['feliz', 'saludo', 'abrazo', 'tejiendo', 'gorro', 'leyendo', 'gancho', 'celebra', 'corazon', 'risa', 'orgullosa', 'idea', 'ovillo', 'flor', 'lupa', 'diploma'];   /* recortes de herramientas/agenda-iconos/generar_iconos_rosina.py */
  var ANIMALES = ['tortuga', 'conejo', 'gato', 'panda', 'pinguino', 'zorro', 'unicornio', 'ovejita', 'osito', 'koala', 'rana', 'pollito', 'mariquita', 'abeja', 'erizo', 'jirafa', 'ciervo', 'dinosaurio', 'hipopotamo', 'vaca'];
  var NOMBRE = { tortuga: 'Tortuga', conejo: 'Conejo', gato: 'Gato', panda: 'Panda', pinguino: 'Pingüino', zorro: 'Zorro', unicornio: 'Unicornio', ovejita: 'Ovejita', osito: 'Osito', koala: 'Koala', rana: 'Rana', pollito: 'Pollito', mariquita: 'Mariquita', abeja: 'Abeja', erizo: 'Erizo', jirafa: 'Jirafa', ciervo: 'Ciervo', dinosaurio: 'Dinosaurio', hipopotamo: 'Hipopótamo', vaca: 'Vaca' };
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function perfil() { var d = N.datos(); return d._perfil || (d._perfil = {}); }
  function src(av) {
    if (av === 'foto') { var f = (N.datos()._dib || {})['perfil:foto']; if (f && f.img) return f.img; }
    if (av && av.indexOf('animal-') === 0) return '/img/agenda/ui/animales/' + av.slice(7) + '.webp';
    if (av && av.indexOf('rosina-') === 0) return '/img/agenda/ui/rosina-iconos/' + av.slice(7) + '.webp';
    return '/img/agenda/ui/rosina-iconos/feliz.webp';
  }
  function correo() { try { var k = Object.keys(localStorage).filter(function (x) { return /^sb-.*-auth-token$/.test(x); })[0]; var j = JSON.parse(localStorage.getItem(k) || 'null'); return (j && j.user && j.user.email) || ''; } catch (e) { return ''; } }
  function primerNombre() { return String(N.datos()['ag-duena'] || '').trim(); }

  var boton, menu, dlg, abierto = false;
  function pintarAvatar() {
    var p = perfil(), s = src(p.avatar);
    [boton, menu && menu.querySelector('.mc-av'), dlg && dlg.querySelector('.mc-av-grande')].forEach(function (c) { if (c) { var i = c.querySelector('img'); if (i) i.src = s; } });
  }
  function textoIdentidad() {
    var p = perfil(), n = primerNombre(), neg = (p.negocio || '').trim(), c = correo();
    var t = menu.querySelector('.mc-nombre'), s = menu.querySelector('.mc-sub');
    t.textContent = n || neg || 'Mi agenda'; s.textContent = [n && neg ? neg : '', c].filter(Boolean).join(' · ');
    t.setAttribute('data-no-traducir', ''); s.setAttribute('data-no-traducir', '');
  }
  function cerrarMenu(volver) { if (!menu) return; menu.hidden = true; abierto = false; boton.setAttribute('aria-expanded', 'false'); if (volver) boton.focus(); }
  function abrirMenu() { textoIdentidad(); pintarEstados(); menu.hidden = false; abierto = true; boton.setAttribute('aria-expanded', 'true'); var p = menu.querySelector('.mc-item'); if (p) p.focus(); }
  function item(txt, ic, fn, extra) {
    var b = el('button', 'mc-item'); b.type = 'button'; b.setAttribute('role', 'menuitem'); b.appendChild(el('span', 'mc-ic', ic)); b.appendChild(el('span', 'mc-t', txt));
    if (extra) { var c = el('span', 'mc-chip'); c.id = extra; c.hidden = true; b.appendChild(c); }
    b.addEventListener('click', function () { cerrarMenu(false); fn(); }); return b;
  }
  function pintarEstados() {
    var m = window.lrMembresia || {}, c = menu.querySelector('#mc-chip-mem'); if (!c) return;
    var txt = ''; if (m.acceso === 'miembro') txt = 'activa'; else if (m.acceso === 'prueba' && m.prueba_hasta) { var d = Math.max(0, Math.ceil((new Date(m.prueba_hasta) - Date.now()) / 86400000)); txt = d === 1 ? 'último día' : 'quedan ' + d + ' días'; }
    c.textContent = txt; c.hidden = !txt;
    var tab = window.matchMedia && window.matchMedia('(pointer: coarse) and (min-width: 768px)').matches, lp = menu.querySelector('#mc-lapiz'); if (lp) lp.hidden = !(tab && document.getElementById('tinta-modo'));
    var ins = document.getElementById('instalar-agenda'), bi = menu.querySelector('#mc-instalar'); if (bi) bi.hidden = !(ins && !ins.hidden);
  }
  function clic(sel) { var e = document.querySelector(sel); if (e) e.click(); }

  function construirMenu() {
    menu = el('div', 'mc-menu no-imprimir'); menu.id = 'mc-menu'; menu.hidden = true; menu.setAttribute('role', 'menu'); menu.setAttribute('aria-label', 'Mi cuenta');
    var cab = el('div', 'mc-cab'), av = el('span', 'mc-av'); av.appendChild(el('img')); av.firstChild.alt = ''; av.firstChild.width = 52; av.firstChild.height = 52;
    var tx = el('div', 'mc-txt'); tx.appendChild(el('b', 'mc-nombre')); tx.appendChild(el('small', 'mc-sub')); cab.appendChild(av); cab.appendChild(tx); menu.appendChild(cab);
    menu.appendChild(item('Mi perfil y mi foto', '👤', abrirPerfil));
    menu.appendChild(item('Configuración', '⚙️', function () { if (window.lrAgendaConfig) window.lrAgendaConfig.abrir(); }));
    var idi = el('div', 'mc-item mc-idioma'); idi.appendChild(el('span', 'mc-ic', '🌐')); var l = el('label', 'mc-t', 'Idioma'); l.setAttribute('for', 'mc-idioma'); idi.appendChild(l);
    var sel = el('select'); sel.id = 'mc-idioma'; [['es', 'Español'], ['en', 'English'], ['pt', 'Português']].forEach(function (o) { var op = el('option', '', o[1]); op.value = o[0]; sel.appendChild(op); });
    var orig = document.getElementById('agenda-idioma'); sel.value = orig ? orig.value : 'es';
    sel.addEventListener('change', function () { var o = document.getElementById('agenda-idioma'); if (o) { o.value = sel.value; o.dispatchEvent(new Event('change')); } });
    idi.appendChild(sel); menu.appendChild(idi);
    var lap = item('Lápiz: escribir a mano sobre la hoja', '✏️', function () { clic('#tinta-modo'); }); lap.id = 'mc-lapiz'; lap.hidden = true; menu.appendChild(lap);   /* solo tabletas (pointer: coarse y 768 px o más) */
    menu.appendChild(item('Mi membresía', '💎', function () { clic('[data-abrir-membresia]'); }, 'mc-chip-mem'));
    menu.appendChild(item('Copias y Google', '☁️', function () { if (window.lrAgendaConfig) window.lrAgendaConfig.abrir(); setTimeout(function () { var c = document.querySelector('#agenda-config .copia-agenda'); if (c) c.scrollIntoView({ block: 'start' }); }, 80); }));
    var ins = item('Instalar la agenda', '📲', function () { clic('#ia-instalar'); }); ins.id = 'mc-instalar'; ins.hidden = true; menu.appendChild(ins);
    menu.appendChild(item('Ayuda con Rosina', '❓', function () { clic('.rc-boton'); }));
    var sal = el('a', 'mc-item mc-salir'); sal.href = '/cuenta.html'; sal.setAttribute('role', 'menuitem'); sal.appendChild(el('span', 'mc-ic', '↩')); sal.appendChild(el('span', 'mc-t', 'Mis compras y cerrar sesión')); menu.appendChild(sal);
    document.body.appendChild(menu);
    menu.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return; e.preventDefault();
      var l = [].slice.call(menu.querySelectorAll('.mc-item:not([hidden]), .mc-item:not([hidden]) select')).filter(function (x) { return x.tagName !== 'DIV'; }), i = l.indexOf(document.activeElement);
      l[(i + (e.key === 'ArrowDown' ? 1 : -1) + l.length) % l.length].focus();
    });
  }

  /* ventana «Mi perfil» */
  function abrirPerfil() {
    if (!dlg) construirPerfil();
    var p = perfil(); dlg.querySelector('#mc-negocio').value = p.negocio || ''; dlg.querySelector('#mc-nombre').value = primerNombre();
    marcar(); pintarAvatar(); dlg.hidden = false; document.body.classList.add('mc-abierto'); dlg.querySelector('.mc-cerrar').focus();
  }
  function cerrarPerfil() { if (!dlg) return; dlg.hidden = true; document.body.classList.remove('mc-abierto'); boton.focus(); }
  function marcar() { var a = perfil().avatar || 'rosina-feliz'; dlg.querySelectorAll('.mc-op').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.av === a)); }); }
  function elegir(av) { perfil().avatar = av; N.guardar(); marcar(); pintarAvatar(); }
  function reducir(file) {
    return new Promise(function (ok, mal) {
      var r = new FileReader(); r.onerror = function () { mal(); };
      r.onload = function () { var im = new Image(); im.onerror = function () { mal(); }; im.onload = function () {
        var T = 256, c = document.createElement('canvas'); c.width = c.height = T; var x = c.getContext('2d'), lado = Math.min(im.width, im.height);
        x.drawImage(im, (im.width - lado) / 2, (im.height - lado) / 2, lado, lado, 0, 0, T, T); ok(c.toDataURL('image/jpeg', 0.82)); }; im.src = r.result; };
      r.readAsDataURL(file);
    });
  }
  function construirPerfil() {
    dlg = el('div', 'mc-dlg no-imprimir'); dlg.id = 'mc-perfil'; dlg.hidden = true; dlg.setAttribute('role', 'dialog'); dlg.setAttribute('aria-modal', 'true'); dlg.setAttribute('aria-labelledby', 'mc-tit');
    var caja = el('div', 'mc-caja'); var x = el('button', 'mc-cerrar'); x.type = 'button'; x.setAttribute('aria-label', 'Cerrar'); x.textContent = '✕'; x.addEventListener('click', cerrarPerfil); caja.appendChild(x);
    var h = el('h2', '', 'Mi perfil'); h.id = 'mc-tit'; caja.appendChild(h);
    var g = el('div', 'mc-av-grande'); g.appendChild(el('img')); g.firstChild.alt = ''; g.firstChild.width = 96; g.firstChild.height = 96; caja.appendChild(g);
    caja.appendChild(el('h3', '', 'Mi foto o mi ícono'));
    var rej = el('div', 'mc-rejilla'); rej.setAttribute('role', 'group'); rej.setAttribute('aria-label', 'Elige un ícono');
    function op(av, etq, url) { var b = el('button', 'mc-op'); b.type = 'button'; b.dataset.av = av; b.setAttribute('aria-label', etq); b.title = etq; var i = el('img'); i.alt = ''; i.loading = 'lazy'; i.width = 52; i.height = 52; i.src = url; b.appendChild(i); b.addEventListener('click', function () { elegir(av); }); rej.appendChild(b); }
    ROSINA.forEach(function (n) { op('rosina-' + n, 'Rosina (' + n + ')', '/img/agenda/ui/rosina-iconos/' + n + '.webp'); });
    ANIMALES.forEach(function (n) { op('animal-' + n, NOMBRE[n], '/img/agenda/ui/animales/' + n + '.webp'); });
    caja.appendChild(rej);
    var sub = el('label', 'mc-subir boton-secundario boton-chico', '📷 Subir mi propia foto'); var f = el('input'); f.type = 'file'; f.accept = 'image/*'; f.hidden = true; sub.appendChild(f);
    f.addEventListener('change', function () { var a = f.files && f.files[0]; if (!a) return; reducir(a).then(function (u) { var d = N.datos(); (d._dib || (d._dib = {}))['perfil:foto'] = { s: [], img: u }; elegir('foto'); msg.textContent = 'Listo: tu foto se queda en este aparato y viaja en tus copias.'; }, function () { msg.textContent = 'No pude leer esa foto. Prueba con otra.'; }); f.value = ''; });
    caja.appendChild(sub); var msg = el('p', 'mc-msg'); msg.setAttribute('role', 'status'); caja.appendChild(msg);
    caja.appendChild(el('p', 'mc-nota', 'La foto no se sube a ningún servidor: se queda en tu aparato y viaja en tus copias.'));
    caja.appendChild(el('h3', '', 'Mis datos'));
    var l1 = el('label', 'mc-campo', 'Mi nombre'); var n1 = el('input'); n1.id = 'mc-nombre'; n1.maxLength = 40; n1.autocomplete = 'given-name'; l1.appendChild(n1); caja.appendChild(l1);
    var l2 = el('label', 'mc-campo', 'Nombre de mi negocio'); var n2 = el('input'); n2.id = 'mc-negocio'; n2.maxLength = 60; n2.placeholder = 'Ej.: Lanitas de Ana'; l2.appendChild(n2); caja.appendChild(l2);
    caja.appendChild(el('p', 'mc-nota', 'El nombre del negocio sale en el informe del mes.'));
    var gu = el('button', 'boton-primario'); gu.type = 'button'; gu.textContent = 'Guardar';
    gu.addEventListener('click', function () {
      var d = N.datos(); perfil().negocio = n2.value.trim(); var nom = n1.value.trim();
      if (nom !== primerNombre()) { d['ag-duena'] = nom; var cm = document.getElementById('ag-duena'); if (cm) { cm.value = nom; cm.dispatchEvent(new Event('input', { bubbles: true })); } }
      N.guardar(); cerrarPerfil();
    });
    caja.appendChild(gu); dlg.appendChild(caja); document.body.appendChild(dlg);
    dlg.addEventListener('click', function (e) { if (e.target === dlg) cerrarPerfil(); });
  }

  function iniciar() {
    var viejo = document.querySelector('.boton-cuenta-header'); if (!viejo || document.getElementById('mc-boton')) return false;
    boton = el('button', 'mc-boton no-imprimir'); boton.type = 'button'; boton.id = 'mc-boton'; boton.setAttribute('aria-haspopup', 'menu'); boton.setAttribute('aria-expanded', 'false'); boton.setAttribute('aria-controls', 'mc-menu'); boton.setAttribute('aria-label', 'Mi cuenta'); boton.title = 'Mi cuenta';
    var im = el('img'); im.alt = ''; im.width = 40; im.height = 40; boton.appendChild(im); viejo.parentNode.insertBefore(boton, viejo);
    if (viejo.classList.contains('con-sesion') || correo()) boton.classList.add('con-sesion');
    new MutationObserver(function () { boton.classList.toggle('con-sesion', viejo.classList.contains('con-sesion')); }).observe(viejo, { attributes: true, attributeFilter: ['class'] });
    construirMenu(); pintarAvatar();
    boton.addEventListener('click', function () { if (abierto) cerrarMenu(); else abrirMenu(); });
    document.addEventListener('click', function (e) { if (abierto && !menu.contains(e.target) && !boton.contains(e.target)) cerrarMenu(); });
    document.addEventListener('keydown', function (e) { if (e.key !== 'Escape') return; if (dlg && !dlg.hidden) cerrarPerfil(); else if (abierto) cerrarMenu(true); });
    document.addEventListener('agenda-guardada', function () { pintarAvatar(); });
    document.addEventListener('membresia:lista', pintarEstados);
    window.lrMiCuenta = { abrirPerfil: abrirPerfil, negocio: function () { return (perfil().negocio || '').trim(); } };
    return true;
  }
  if (!iniciar()) { var n = 0, t = setInterval(function () { if (iniciar() || ++n > 40) clearInterval(t); }, 250); }
})();
