// Aviso "Producto agregado a tu carrito" (tienda y mercería): aparece apenas se toca Agregar / Añadir al carrito,
// con la opción de ir a pagar de una vez o seguir agregando productos. Se lee el carrito de localStorage
// (mismo formato que usa cada página: [{ id, nombre, precio, cantidad }]).
(function () {
  var CLAVE = 'carritoLanaRosa';
  var hoja = null, item = null, deFicha = false;

  function leer() { try { return JSON.parse(localStorage.getItem(CLAVE)) || []; } catch (e) { return []; } }
  function guardar(carrito) {
    localStorage.setItem(CLAVE, JSON.stringify(carrito));
    var n = carrito.reduce(function (s, i) { return s + i.cantidad; }, 0);
    var c = document.getElementById('contador-carrito'); if (c) c.textContent = n;
  }
  function pesos(v) { return '$' + Math.round(Number(v) || 0).toLocaleString('es-CO'); }
  function el(tag, clase, texto) { var e = document.createElement(tag); if (clase) e.className = clase; if (texto != null) e.textContent = texto; return e; }

  var CSS =
    '.lr-ag-fondo{position:fixed;inset:0;z-index:3500;background:rgba(0,0,0,.45);display:flex;align-items:flex-end;justify-content:center;opacity:0;transition:opacity .2s}' +
    '.lr-ag-fondo[hidden]{display:none}' +
    '.lr-ag-fondo.abierto{opacity:1}' +
    '.lr-ag{background:#fff;width:100%;max-width:480px;border-radius:22px 22px 0 0;padding:10px 20px calc(20px + env(safe-area-inset-bottom,0px));box-shadow:0 -8px 30px rgba(0,0,0,.2);transform:translateY(100%);transition:transform .25s ease;position:relative;font-family:inherit;color:#45454A}' +
    '.lr-ag-fondo.abierto .lr-ag{transform:translateY(0)}' +
    '@media(min-width:700px){.lr-ag-fondo{align-items:center}.lr-ag{border-radius:22px;padding-bottom:22px}}' +
    '@media(prefers-reduced-motion:reduce){.lr-ag,.lr-ag-fondo{transition:none}}' +
    '.lr-ag-asa{width:44px;height:5px;border-radius:99px;background:#d8d8dc;margin:0 auto 10px}' +
    '.lr-ag-x{position:absolute;top:12px;right:14px;background:none;border:none;font-size:1.7rem;line-height:1;cursor:pointer;color:#45454A;padding:4px 8px}' +
    '.lr-ag-titulo{display:flex;align-items:center;gap:12px;padding:10px 0 14px;border-bottom:1px solid rgba(69,69,74,.12);margin-right:30px}' +
    '.lr-ag-check{flex:0 0 auto;width:34px;height:34px;border-radius:50%;border:2px solid #2e7d32;color:#2e7d32;display:flex;align-items:center;justify-content:center;font-weight:700}' +
    '.lr-ag-titulo h2{margin:0;font-size:1.1rem;font-weight:700}' +
    '.lr-ag-item{display:flex;gap:14px;align-items:center;padding:16px 0 6px}' +
    '.lr-ag-foto{flex:0 0 auto;width:78px;height:78px;border-radius:12px;background:#FBE4EF;overflow:hidden;display:flex;align-items:center;justify-content:center;font-size:1.6rem}' +
    '.lr-ag-foto img{width:100%;height:100%;object-fit:cover}' +
    '.lr-ag-info{min-width:0;display:flex;flex-direction:column;gap:2px}' +
    '.lr-ag-marca{font-size:.7rem;letter-spacing:.08em;text-transform:uppercase;color:#6E6E73;font-weight:600}' +
    '.lr-ag-nombre{font-size:1rem;font-weight:600;line-height:1.25}' +
    '.lr-ag-precio{color:#E74E96;font-weight:700}' +
    '.lr-ag-cant{display:flex;align-items:center;justify-content:center;gap:16px;padding:10px 0}' +
    '.lr-ag-cant button{width:36px;height:36px;border-radius:50%;border:1.5px solid #E74E96;background:#fff;color:#E74E96;font-size:1.2rem;font-weight:700;cursor:pointer;line-height:1}' +
    '.lr-ag-cant button:disabled{opacity:.35;cursor:default}' +
    '.lr-ag-cant span{min-width:28px;text-align:center;font-weight:700;font-size:1.05rem}' +
    '.lr-ag-total{margin:0 0 14px;text-align:center;font-size:.88rem;color:#6E6E73}' +
    '.lr-ag-pagar{display:block;width:100%;background:#E74E96;color:#fff;border:none;border-radius:999px;padding:14px;font:inherit;font-size:1.05rem;font-weight:700;cursor:pointer}' +
    '.lr-ag-pagar:hover{background:#B83E78}' +
    '.lr-ag-mas{display:block;margin:12px auto 0;background:none;border:none;font:inherit;font-size:.98rem;color:#45454A;text-decoration:underline;cursor:pointer;padding:6px 10px}';

  function construir() {
    var st = document.createElement('style'); st.textContent = CSS; document.head.append(st);
    var fondo = el('div', 'lr-ag-fondo'); fondo.hidden = true;
    var h = el('div', 'lr-ag'); h.setAttribute('role', 'dialog'); h.setAttribute('aria-modal', 'true'); h.setAttribute('aria-labelledby', 'lr-ag-titulo');
    var x = el('button', 'lr-ag-x', '×'); x.type = 'button'; x.setAttribute('aria-label', 'Cerrar');
    var tit = el('div', 'lr-ag-titulo'); var t2 = el('h2', null, 'Producto agregado a tu carrito'); t2.id = 'lr-ag-titulo';
    tit.append(el('span', 'lr-ag-check', '✓'), t2);
    var fila = el('div', 'lr-ag-item'); var foto = el('div', 'lr-ag-foto'); var info = el('div', 'lr-ag-info');
    info.append(el('span', 'lr-ag-marca'), el('span', 'lr-ag-nombre'), el('span', 'lr-ag-precio'));
    fila.append(foto, info);
    var cant = el('div', 'lr-ag-cant'); var menos = el('button', null, '−'); menos.type = 'button'; menos.setAttribute('aria-label', 'Una menos');
    var num = el('span', null, '1'); var mas = el('button', null, '+'); mas.type = 'button'; mas.setAttribute('aria-label', 'Una más');
    cant.append(menos, num, mas);
    var total = el('p', 'lr-ag-total');
    var pagar = el('button', 'lr-ag-pagar', 'Continuar compra'); pagar.type = 'button';
    var masProd = el('button', 'lr-ag-mas', 'Agregar más productos'); masProd.type = 'button';
    h.append(el('div', 'lr-ag-asa'), x, tit, fila, cant, total, pagar, masProd);
    fondo.append(h); document.body.append(fondo);

    x.addEventListener('click', cerrar);
    fondo.addEventListener('click', function (e) { if (e.target === fondo) cerrar(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !fondo.hidden) cerrar(); });
    masProd.addEventListener('click', function () { cerrar(); cerrarFicha(); });
    menos.addEventListener('click', function () { cambiar(-1); });
    mas.addEventListener('click', function () { cambiar(1); });
    pagar.addEventListener('click', irAPagar);
    hoja = { fondo: fondo, foto: foto, marca: info.children[0], nombre: info.children[1], precio: info.children[2], num: num, menos: menos, total: total, pagar: pagar };
  }

  function cerrarFicha() {
    var ov = document.getElementById('overlay-modal-producto');
    if (ov && ov.classList.contains('abierto')) { var c = ov.querySelector('.modal-producto-cerrar'); if (c) c.click(); }
  }
  function cerrar() {
    if (!hoja || hoja.fondo.hidden) return;
    hoja.fondo.classList.remove('abierto');
    setTimeout(function () { hoja.fondo.hidden = true; }, 220);
  }
  function irAPagar() {
    cerrar();
    var pagar = document.getElementById('boton-pagar-wompi');
    if (pagar) { pagar.click(); return; }
    cerrarFicha();
    var carrito = document.getElementById('boton-carrito'); if (carrito) carrito.click();
  }
  function pintar() {
    var carrito = leer();
    var actual = carrito.find(function (i) { return (item.id && i.id === item.id) || i.nombre === item.nombre; });
    if (!actual) return cerrar();
    item.id = actual.id;
    hoja.nombre.textContent = actual.nombre;
    hoja.precio.textContent = pesos(actual.precio);
    hoja.num.textContent = actual.cantidad;
    hoja.menos.disabled = actual.cantidad <= 1;
    var n = carrito.reduce(function (s, i) { return s + i.cantidad; }, 0);
    var suma = carrito.reduce(function (s, i) { return s + i.cantidad * i.precio; }, 0);
    hoja.total.textContent = 'Tu carrito: ' + n + (n === 1 ? ' producto' : ' productos') + ' · ' + pesos(suma) + ' (el envío se calcula al pagar)';
    hoja.pagar.textContent = document.getElementById('boton-pagar-wompi') ? 'Continuar compra' : 'Ir al carrito';
  }
  function cambiar(d) {
    var carrito = leer();
    var actual = carrito.find(function (i) { return i.id === item.id; });
    if (!actual) return;
    actual.cantidad = Math.max(1, actual.cantidad + d);
    guardar(carrito); pintar();
  }
  function mostrar(boton) {
    var esFicha = boton.id === 'modal-boton-carrito';
    var tarjeta = esFicha ? null : boton.closest('.producto-card');
    var img = esFicha ? document.getElementById('modal-foto-principal') : (tarjeta && tarjeta.querySelector('img'));
    var nombre = esFicha ? (document.getElementById('modal-nombre') || {}).textContent : (tarjeta && tarjeta.dataset.nombre);
    if (!nombre) return;
    item = { id: img && img.dataset && img.dataset.id && !esFicha ? img.dataset.id : null, nombre: nombre.trim() };
    if (!hoja) construir();
    hoja.foto.replaceChildren();
    if (img && img.src) { var im = document.createElement('img'); im.src = img.src; im.alt = ''; im.addEventListener('error', function () { im.remove(); hoja.foto.textContent = '🧶'; }); hoja.foto.append(im); } else hoja.foto.textContent = '🧶';
    var marca = tarjeta && tarjeta.querySelector('.producto-marca');
    hoja.marca.textContent = marca ? marca.textContent : '';
    hoja.marca.hidden = !hoja.marca.textContent;
    deFicha = esFicha;
    pintar();
    hoja.fondo.hidden = false;
    requestAnimationFrame(function () { hoja.fondo.classList.add('abierto'); hoja.pagar.focus({ preventScroll: true }); });
  }

  // Se escucha en el documento: corre después del controlador propio del botón, cuando el carrito ya se actualizó.
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.boton-agregar-carrito, #modal-boton-carrito');
    if (!b || b.disabled) return;
    setTimeout(function () { mostrar(b); }, 0);
  });
})();
