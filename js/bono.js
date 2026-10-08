// Pop-up del bono de bienvenida (10 % en la primera compra). Sale una sola vez por visitante, en la casa por la que entra,
// con el mensaje y los colores de esa casa (los colores salen de html[data-casa]).
(function () {
  'use strict';
  var CLAVE_VISTO = 'bonoBienvenidaVisto';
  try { if (localStorage.getItem(CLAVE_VISTO)) return; } catch (e) {}

  var casa = document.documentElement.getAttribute('data-casa') || 'crochet';
  var URL_RPC = 'https://ngjoognzvehwjtpqwrqe.supabase.co/rest/v1/rpc/registrar_bono_bienvenida';
  var KEY = 'sb_publishable_2TQ_piaHlSMHa79zjmOOXg_6bEwgkKD';
  var TEXTOS = {
    crochet: {
      titulo: '¡Bienvenida a Lana Rosa!',
      intro: 'Regístrate y recibe un bono del 10% para tu primera compra en la <a href="/tienda.html">tienda de amigurumis</a> o en la <a href="/merceria/">mercería</a>.',
      lugar: 'la tienda de amigurumis o la mercería',
      cta: ['/tienda.html', 'Ir a la tienda de amigurumis'], cta2: ['/merceria/catalogo/', 'Ver la mercería']
    },
    merceria: {
      titulo: '¡Bienvenida a la Mercería Lana Rosa!',
      intro: 'Regístrate y recibe un bono del 10% para tu primera compra de lanas, hilos, agujas y accesorios en la <a href="/merceria/catalogo/">mercería</a> o en la <a href="/tienda.html">tienda de amigurumis</a>.',
      lugar: 'la mercería o la tienda de amigurumis',
      cta: ['/merceria/catalogo/', 'Ir al catálogo de la mercería'], cta2: ['/tienda.html', 'Ver la tienda de amigurumis']
    },
    academy: {
      titulo: '¡Bienvenida a Lana Rosa Academy!',
      intro: 'Aprende con nosotras y estrena con descuento: regístrate y recibe un bono del 10% para tu primera compra en la <a href="/merceria/">mercería</a> (lanas, hilos y agujas) o en la <a href="/tienda.html">tienda de amigurumis</a>.',
      lugar: 'la mercería o la tienda de amigurumis',
      cta: ['/merceria/catalogo/', 'Ir a la mercería'], cta2: ['/tienda.html', 'Ver la tienda de amigurumis']
    }
  };
  var T = TEXTOS[casa] || TEXTOS.crochet;

  var estilo = document.createElement('style');
  estilo.textContent = `.modal-bono { max-height: 92vh; overflow-y: auto; }
.modal-bono h2 { color: var(--tinta); font-family: var(--fuente-titulo); line-height: 1.25; }
.modal-bono .boton-bono { display: block; width: 100%; background: var(--rosa-principal); color: #fff; border: none; border-radius: 999px; padding: 13px 24px; font-family: var(--fuente-titulo); font-size: 1rem; font-weight: 600; cursor: pointer; text-align: center; box-shadow: 0 4px 12px rgba(var(--rosa-rgb),0.25); }
.modal-bono .boton-bono:hover { background: var(--rosa-hover); }
.overlay-bono { position: fixed; inset: 0; background: rgba(0,0,0,0.55); z-index: 1002; display: none; align-items: center; justify-content: center; padding: 20px; }
.overlay-bono.abierto { display: flex; }
.modal-bono { background: var(--blanco-hueso); border-radius: var(--radio-suave); max-width: 420px; width: 100%; padding: 34px 28px; position: relative; text-align: center; box-shadow: 0 20px 50px rgba(0,0,0,0.3); }
.modal-bono-cerrar { position: absolute; top: 6px; right: 6px; width: 44px; height: 44px; background: none; border: none; font-size: 1.8rem; line-height: 1; cursor: pointer; color: var(--tinta); border-radius: 50%; }
.modal-bono-cerrar:hover { background: var(--rosa-suave); }
.modal-bono .etiqueta-bono { display: inline-block; background: var(--rosa-principal); color: #fff; font-weight: 700; padding: 6px 16px; border-radius: 999px; font-size: 0.85rem; margin-bottom: 14px; }
.modal-bono h2 { font-size: 1.4rem; margin-bottom: 8px; }
.modal-bono p.intro-bono { color: var(--tinta-suave); margin-bottom: 6px; font-size: 0.95rem; }
.modal-bono p.intro-bono a { color: var(--rosa-principal); font-weight: 600; }
.modal-bono p.nota-bono { color: var(--tinta-suave); font-size: 0.8rem; margin: 0 0 18px; }
.modal-bono .campo-bono { margin-bottom: 12px; text-align: left; }
.modal-bono .campo-bono input { width: 100%; padding: 11px 14px; border-radius: 12px; border: 1.5px solid var(--rosa-suave); font-family: var(--fuente-cuerpo); font-size: 0.92rem; }
.modal-bono .campo-checkbox { display: flex; align-items: flex-start; gap: 8px; text-align: left; font-size: 0.8rem; color: var(--tinta-suave); margin: 14px 0; }
.modal-bono .campo-checkbox input { margin-top: 3px; }
.modal-bono .campo-checkbox a { color: var(--rosa-principal); }
.modal-bono .resultado-bono { display: none; background: var(--rosa-suave); border-radius: 14px; padding: 20px; margin-top: 10px; }
.modal-bono .codigo-bono { font-size: 1.3rem; font-weight: 700; color: var(--rosa-principal); letter-spacing: 0.03em; margin: 8px 0; }`;
  document.head.appendChild(estilo);

  var overlay = document.createElement('div');
  overlay.className = 'overlay-bono'; overlay.id = 'overlay-bono';
  overlay.innerHTML =
    '<div class="modal-bono" role="dialog" aria-modal="true" aria-labelledby="bono-titulo">' +
    '<button class="modal-bono-cerrar" id="cerrar-modal-bono" aria-label="Cerrar">&times;</button>' +
    '<span class="etiqueta-bono">🎁 10% de descuento</span>' +
    '<h2 id="bono-titulo">' + T.titulo + '</h2>' +
    '<p class="intro-bono">' + T.intro + '</p>' +
    '<p class="nota-bono">No aplica para amigurumis personalizados, talleres ni patrones digitales.</p>' +
    '<form id="form-bono">' +
    '<div class="campo-bono"><input type="text" id="bono-nombre" placeholder="Tu nombre" required></div>' +
    '<div class="campo-bono"><input type="email" id="bono-correo" placeholder="Tu correo electrónico" required></div>' +
    '<div class="campo-bono"><input type="tel" id="bono-whatsapp" placeholder="Tu WhatsApp" required></div>' +
    '<label class="campo-checkbox"><input type="checkbox" id="bono-acepta" required><span>Acepto la <a href="/politicas.html#datos" target="_blank" rel="noopener">política de tratamiento de datos</a> de Lana Rosa Crochet.</span></label>' +
    '<button type="submit" class="boton-bono">Obtener mi bono</button>' +
    '<p id="bono-error" style="display:none; color:#c62828; font-size:0.85rem; margin-top:10px;"></p>' +
    '</form>' +
    '<div class="resultado-bono" id="resultado-bono">' +
    '<p style="margin:0; font-weight:700;">¡Listo! Tu descuento del 10% ya está reservado 🎉</p>' +
    '<p style="font-size:0.9rem; color:var(--tinta-suave); margin:8px 0 0;">Se aplica <strong>solo, en tu primera compra</strong>: cuando pagues en línea con este correo, lo verás en tu carrito, sin escribir ningún código.</p>' +
    '<a id="bono-cta" href="' + T.cta[0] + '" class="boton-bono" style="display:inline-block; margin-top:14px; width:auto; text-decoration:none;">' + T.cta[1] + ' →</a>' +
    '<p style="margin:12px 0 0; font-size:0.85rem;"><a href="' + T.cta2[0] + '" style="color:var(--rosa-principal); font-weight:600;">' + T.cta2[1] + '</a></p>' +
    '<p style="font-size:0.78rem; color:var(--tinta-suave); margin:14px 0 0;">Tu código de respaldo: <strong id="codigo-bono-texto"></strong><br>Solo lo necesitas si compras en la tienda física.</p>' +
    '</div></div>';
  document.body.appendChild(overlay);

  var form = document.getElementById('form-bono'), error = document.getElementById('bono-error');
  var resultado = document.getElementById('resultado-bono'), codigo = document.getElementById('codigo-bono-texto');

  // Aparece una sola vez: a los 20 segundos o al bajar media página (nunca antes de los 8 segundos), lo que ocurra primero.
  // Si la persona está haciendo otra cosa (menú, carrito, chat de Rosina o escribiendo), espera a que termine.
  var mostrado = false, inicio = Date.now(), previo = null;
  function ocupada() {
    var a = document.activeElement;
    return !!document.querySelector('.lr-ck, .panel-carrito.abierto, .nav-movil-panel.abierto, .rc-panel.abierto, .rc-ventana.abierto, .panel-buscar-header.abierto') ||
      (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) && !overlay.contains(a));
  }
  function mostrar() {
    if (mostrado) return;
    if (Date.now() - inicio < 8000 || ocupada()) { setTimeout(mostrar, 4000); return; }
    mostrado = true;
    window.removeEventListener('scroll', revisarScroll);
    previo = document.activeElement;
    overlay.classList.add('abierto');
    document.getElementById('cerrar-modal-bono').focus();
  }
  function revisarScroll() {
    var total = document.documentElement.scrollHeight - window.innerHeight;
    if (total > 0 && window.scrollY / total > 0.5) mostrar();
  }
  setTimeout(mostrar, 20000);
  window.addEventListener('scroll', revisarScroll, { passive: true });

  function visto() { try { localStorage.setItem(CLAVE_VISTO, '1'); } catch (e) {} }
  function cerrar() { overlay.classList.remove('abierto'); visto(); if (previo && previo.focus) { try { previo.focus(); } catch (e) {} } }
  document.getElementById('cerrar-modal-bono').addEventListener('click', cerrar);
  overlay.addEventListener('click', function (e) { if (e.target === overlay) cerrar(); });
  document.addEventListener('keydown', function (e) {
    if (!overlay.classList.contains('abierto')) return;
    if (e.key === 'Escape') { cerrar(); return; }
    if (e.key !== 'Tab') return; // el foco se queda dentro del cuadro mientras está abierto
    var f = Array.prototype.filter.call(overlay.querySelectorAll('a[href], button, input'), function (x) { return x.offsetParent !== null && !x.disabled; });
    if (!f.length) return;
    var p = f[0], u = f[f.length - 1];
    if (e.shiftKey && document.activeElement === p) { e.preventDefault(); u.focus(); }
    else if (!e.shiftKey && document.activeElement === u) { e.preventDefault(); p.focus(); }
  });

  form.addEventListener('submit', function (ev) {
    ev.preventDefault(); error.style.display = 'none';
    fetch(URL_RPC, {
      method: 'POST',
      headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        p_nombre: document.getElementById('bono-nombre').value,
        p_correo: document.getElementById('bono-correo').value,
        p_telefono: document.getElementById('bono-whatsapp').value,
        p_acepta_politicas: document.getElementById('bono-acepta').checked
      })
    }).then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (x) {
        if (!x.ok) throw new Error((x.d && x.d.message) || 'intenta de nuevo');
        form.style.display = 'none'; resultado.style.display = 'block'; codigo.textContent = x.d;
        try { localStorage.setItem('lrBonoCorreo', document.getElementById('bono-correo').value.trim().toLowerCase()); localStorage.setItem('lrBonoNombre', document.getElementById('bono-nombre').value.trim()); localStorage.setItem('lrBonoTelefono', document.getElementById('bono-whatsapp').value.trim()); } catch (e) {}
        visto();
      })
      .catch(function (e) { error.textContent = 'No pudimos registrar tu bono: ' + e.message; error.style.display = 'block'; });
  });
})();
