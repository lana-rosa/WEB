/* Agenda para tejedoras: fichas desplegables (27-oct-2026).
   Cada renglón de una tabla de la agenda es una ficha. Se ve solo la que se está llenando; las que ya tienen datos quedan
   cerradas como una lista (con su título) y se abren al tocarlas. «Agregar ficha» suma una nueva. Los datos siguen guardándose
   con los mismos nombres (ag-p1-cliente…), así el calendario, el tablero, las copias y las importaciones no cambian.
   El código de la agenda (en agenda-rosina.html) lo conecta con window.lrAgendaNucleo. */
(function () {
  'use strict';
  var N = window.lrAgendaNucleo;
  if (!N) return;

  /* titulo: campos que forman el título de la ficha cerrada; resumen: datos cortos que se ven a la derecha;
     estado: lista desplegable que se ve como etiqueta; check: casilla que se ve como «listo»; fecha/cerrados: para las alarmas */
  var LISTAS = {
    'tabla-pedidos': { vacio: 'Pedido nuevo', agregar: '➕ Agregar pedido', titulo: ['pedido', 'cliente'], resumen: ['entrega'], estado: 'estado', fecha: 'entrega', cerrados: ['Entregado', 'Cancelado'], alarmas: 'entrega' },
    'tabla-lanas': { vacio: 'Lana nueva', agregar: '➕ Agregar lana o hilo', titulo: ['marca', 'color'], resumen: ['grosor', 'ovillos'] },
    'tabla-compras': { vacio: 'Material nuevo', agregar: '➕ Agregar material', titulo: ['material', 'color'], resumen: ['cantidad'], check: 'comprado', checkTexto: 'Comprado' },
    'tabla-fila': { vacio: 'Proyecto nuevo', agregar: '➕ Agregar proyecto', titulo: ['proyecto', 'para'], resumen: ['fecha'], estado: 'estado', fecha: 'fecha', cerrados: ['Terminado'], alarmas: 'fecha' },
    'tabla-patrones': { vacio: 'Patrón nuevo', agregar: '➕ Agregar patrón', titulo: ['patron'], resumen: ['dificultad'], check: 'tejido', checkTexto: 'Ya lo tejí' },
    'tabla-fechas': { vacio: 'Fecha nueva', agregar: '➕ Agregar fecha', titulo: ['ocasion', 'para'], resumen: ['fecha'], check: 'listo', checkTexto: 'Listo' },
    'tabla-clientas': { vacio: 'Clienta nueva', agregar: '➕ Agregar clienta', titulo: ['nombre'], resumen: ['whatsapp'] },
    'tabla-ventas': { vacio: 'Venta nueva', agregar: '➕ Agregar venta', titulo: ['producto', 'cliente'], resumen: ['fecha', 'precio'] },
    'tabla-catalogo': { vacio: 'Producto nuevo', agregar: '➕ Agregar producto', titulo: ['producto', 'tamano'], resumen: ['precio'] },
    'tabla-diario': { vacio: 'Día nuevo', agregar: '➕ Agregar día', titulo: ['fecha', 'teji'], resumen: [], estado: 'animo' },
    'tabla-aprendi': { vacio: 'Punto o técnica nueva', agregar: '➕ Agregar lo que aprendí', titulo: ['tecnica'], resumen: ['fecha'], check: 'domino', checkTexto: 'Ya lo domino', cumplida: 'domino' }
  };
  var estado = {};
  var autoCrece = !(window.CSS && CSS.supports && CSS.supports('field-sizing', 'content'));

  function est(tabla) { return estado[tabla] || (estado[tabla] = { abiertas: {}, mostradas: {} }); }
  function T(tabla) { return N.tablas[tabla]; }
  function fila(tabla, r) { return T(tabla).cuerpo.querySelector('tr[data-fila="' + r + '"]'); }
  function campo(tabla, r, col) { return document.getElementById(T(tabla).prefijo + r + '-' + col); }
  function colsDe(tabla) { return T(tabla).cols.map(function (c) { return typeof c === 'string' ? c : c.id; }).filter(function (c) { return c !== 'cal'; }); }
  function valor(tabla, r, col) { var e = campo(tabla, r, col); if (!e) return ''; return e.type === 'checkbox' ? e.checked : String(e.value || '').trim(); }
  function tieneDatos(tabla, r) { return colsDe(tabla).some(function (c) { var v = valor(tabla, r, c); return v === true || (typeof v === 'string' && v !== ''); }); }
  function corto(t, n) { t = String(t || '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n - 1) + '…' : t; }
  function crece(e) { if (!autoCrece || !e || e.tagName !== 'TEXTAREA') return; e.style.height = 'auto'; if (e.scrollHeight) e.style.height = (e.scrollHeight + 2) + 'px'; }
  function creceFila(tr) { if (autoCrece) tr.querySelectorAll('textarea').forEach(crece); }

  /* Días que faltan para una fecha escrita a mano (null si no se entiende) */
  function diasPara(texto) {
    var f = N.leerFecha ? N.leerFecha(texto) : null; if (!f) return null;
    var hoy = new Date(), h0 = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()), d = new Date(f.a, f.m - 1, f.d);
    return Math.round((d - h0) / 86400000);
  }
  function chip(texto, clase) { var s = document.createElement('span'); s.className = 'ficha-chip' + (clase ? ' ' + clase : ''); s.textContent = texto; return s; }

  function pintarCab(tabla, r) {
    var L = LISTAS[tabla], tr = fila(tabla, r); if (!tr) return;
    var partes = L.titulo.map(function (c) { return corto(valor(tabla, r, c), 40); }).filter(Boolean);
    var tit = tr.querySelector('.ficha-titulo'), nuevo = partes.length ? partes.join(' · ') : L.vacio;
    if (tit.textContent !== nuevo) tit.textContent = nuevo;
    tit.classList.toggle('vacia', !partes.length);
    var chips = [], cerrada = false;   // [texto, clase]
    if (L.estado) {
      var ev = valor(tabla, r, L.estado);
      if (ev) {
        chips.push([ev, /^(Entregado|Terminado|Despachado)$/.test(ev) ? 'ok' : (/^(En proceso|Tejiendo|Pedido confirmado)$/.test(ev) ? 'curso' : (ev === 'Cancelado' ? 'gris' : ''))]);
        cerrada = (L.cerrados || []).indexOf(ev) >= 0;
      }
    }
    if (L.alarmas && !cerrada && tieneDatos(tabla, r)) {
      var dias = diasPara(valor(tabla, r, L.fecha));
      if (dias !== null && dias < 0) chips.push(['⏰ Atrasado ' + (-dias) + (dias === -1 ? ' día' : ' días'), 'alarma']);
      else if (dias === 0) chips.push(['⏰ Es hoy', 'alarma']);
      else if (dias !== null && dias <= 3) chips.push(['⏰ En ' + dias + (dias === 1 ? ' día' : ' días'), 'aviso']);
    }
    L.resumen.forEach(function (c) { var v = valor(tabla, r, c); if (v) chips.push([corto(v, 18), '']); });
    if (L.check && valor(tabla, r, L.check) === true) chips.push(['✓ ' + L.checkTexto, 'ok']);
    /* Solo se vuelven a dibujar las etiquetas si cambiaron: así un clic que empieza sobre una etiqueta no se pierde */
    var meta = tr.querySelector('.ficha-meta'), firma = JSON.stringify(chips);
    if (meta.dataset.firma !== firma) { meta.dataset.firma = firma; meta.textContent = ''; chips.forEach(function (c) { meta.appendChild(chip(c[0], c[1])); }); }
    tr.classList.toggle('cumplida', !!(L.cumplida && valor(tabla, r, L.cumplida) === true));
  }

  function aplicar(tabla) {
    var S = est(tabla), n = T(tabla).n, visibles = 0, r;
    for (r = 1; r <= n; r++) if (S.abiertas[r]) S.mostradas[r] = true;
    for (r = 1; r <= n; r++) if (tieneDatos(tabla, r) || S.mostradas[r]) visibles++;
    if (!visibles) { S.mostradas[1] = true; S.abiertas[1] = true; }
    for (r = 1; r <= n; r++) {
      var tr = fila(tabla, r); if (!tr) continue;
      var mostrar = tieneDatos(tabla, r) || !!S.mostradas[r];
      tr.hidden = !mostrar;
      var abierta = mostrar && !!S.abiertas[r];
      tr.classList.toggle('abierta', abierta);
      tr.querySelector('.ficha-cab').setAttribute('aria-expanded', abierta ? 'true' : 'false');
      if (mostrar) pintarCab(tabla, r);
      if (abierta) creceFila(tr);
    }
  }

  var avisoEspera = null;
  function aplicarTodo() { Object.keys(LISTAS).forEach(function (t) { if (T(t)) aplicar(t); }); avisoEntregas(); }
  function alGuardar() { clearTimeout(avisoEspera); avisoEspera = setTimeout(aplicarTodo, 60); }

  /* Aviso de entregas próximas, arriba de la hoja de pedidos y de proyectos */
  function avisoEntregas() {
    [['tabla-pedidos', 'control-pedidos', 'entregas'], ['tabla-fila', 'proyectos-fila', 'fechas límite']].forEach(function (x) {
      var tabla = x[0], hoja = document.getElementById(x[1]); if (!hoja || !T(tabla)) return;
      var L = LISTAS[tabla], atrasadas = 0, proximas = 0;
      for (var r = 1; r <= T(tabla).n; r++) {
        if (!tieneDatos(tabla, r)) continue;
        if ((L.cerrados || []).indexOf(valor(tabla, r, L.estado)) >= 0) continue;
        var d = diasPara(valor(tabla, r, L.fecha)); if (d === null) continue;
        if (d < 0) atrasadas++; else if (d <= 3) proximas++;
      }
      var p = hoja.querySelector('.aviso-alarma');
      if (!p) { p = document.createElement('p'); p.className = 'aviso-alarma no-imprimir'; p.setAttribute('role', 'status'); hoja.querySelector('header').insertAdjacentElement('afterend', p); }
      var txt = [];
      if (atrasadas) txt.push(atrasadas + (atrasadas === 1 ? ' atrasada' : ' atrasadas'));
      if (proximas) txt.push(proximas + (proximas === 1 ? ' llega' : ' llegan') + ' en los próximos 3 días');
      p.hidden = !txt.length; p.textContent = txt.length ? '⏰ ' + (x[2].charAt(0).toUpperCase() + x[2].slice(1)) + ': ' + txt.join(' y ') + '.' : '';
      p.classList.toggle('roja', atrasadas > 0);
    });
  }

  function agregar(tabla) {
    var S = est(tabla), n = T(tabla).n, r, elegida = 0;
    for (r = 1; r <= n; r++) if (!tieneDatos(tabla, r) && S.mostradas[r]) { elegida = r; break; }   // ya hay una ficha nueva sin llenar
    if (!elegida) { for (r = 1; r <= n; r++) if (!tieneDatos(tabla, r)) { elegida = r; break; } }
    if (!elegida) { var nueva = N.agregarRenglon(tabla); if (nueva) elegida = T(tabla).n; }
    if (!elegida) return;
    S.mostradas[elegida] = true; S.abiertas[elegida] = true;
    aplicar(tabla);
    var tr = fila(tabla, elegida), primero = tr && tr.querySelector('textarea, select');
    if (primero) { primero.focus({ preventScroll: true }); tr.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  }

  function ponerValor(e, v) {
    if (e.type === 'checkbox') { e.checked = !!v; return; }
    if (e.tagName === 'SELECT' && v && !Array.prototype.some.call(e.options, function (o) { return o.value === v; })) { var op = document.createElement('option'); op.textContent = v; e.appendChild(op); }
    e.value = v == null ? '' : v;
  }
  /* Borra una ficha y sube las que vienen después, para que no queden huecos */
  function borrar(tabla, r) {
    var n = T(tabla).n, cols = colsDe(tabla), d = N.datos(), S = est(tabla), k;
    for (k = r; k <= n; k++) {
      cols.forEach(function (c) {
        var e = campo(tabla, k, c), sig = campo(tabla, k + 1, c);
        ponerValor(e, k < n && sig ? (sig.type === 'checkbox' ? sig.checked : sig.value) : (e.type === 'checkbox' ? false : ''));
        d[e.id] = e.type === 'checkbox' ? e.checked : e.value;
      });
      if (k < n) { S.abiertas[k] = S.abiertas[k + 1]; S.mostradas[k] = S.mostradas[k + 1]; } else { S.abiertas[k] = false; S.mostradas[k] = false; }
    }
    N.guardar();
    if (window.lrAgenda && window.lrAgenda.alCambiar) window.lrAgenda.alCambiar();
    aplicar(tabla);
  }

  function abrirDe(el) {
    var tr = el && el.closest && el.closest('tr.ficha'); if (!tr) return;
    var tabla = tr.closest('tbody').id, r = +tr.dataset.fila, S = est(tabla);
    S.mostradas[r] = true; S.abiertas[r] = true; aplicar(tabla);
  }

  function iniciar() {
    Object.keys(LISTAS).forEach(function (tabla) {
      if (!T(tabla)) return;
      var b = T(tabla).cuerpo.closest('.tabla-scroll').parentNode.querySelector('.agregar-renglon[data-tabla="' + tabla + '"]');
      if (b) b.textContent = LISTAS[tabla].agregar;
    });
    var zona = document.getElementById('agenda');
    zona.addEventListener('click', function (e) {
      var cab = e.target.closest('tr.ficha .ficha-cab');
      if (cab) {
        var tr = cab.closest('tr.ficha'), tabla = tr.closest('tbody').id, r = +tr.dataset.fila, S = est(tabla);
        S.abiertas[r] = !tr.classList.contains('abierta'); S.mostradas[r] = true; aplicar(tabla);
        if (S.abiertas[r]) { var p = tr.querySelector('textarea, select'); if (p && e.detail === 0) p.focus(); }
        return;
      }
      var bo = e.target.closest('.ficha-borrar');
      if (bo) {
        var tr2 = bo.closest('tr.ficha'), tabla2 = tr2.closest('tbody').id;
        var nombre = tr2.querySelector('.ficha-titulo').textContent;
        if (confirm('¿Borrar la ficha «' + nombre + '»?\n\nSe elimina de inmediato y no se puede recuperar (solo si guardaste una copia de tu agenda).')) borrar(tabla2, +tr2.dataset.fila);
      }
    });
    var enTabla = function (e) {
      var tr = e.target.closest && e.target.closest('tr.ficha'); if (!tr) return;
      var tabla = tr.closest('tbody').id; if (!LISTAS[tabla]) return;
      crece(e.target); pintarCab(tabla, +tr.dataset.fila); avisoEntregas();
    };
    zona.addEventListener('input', enTabla);
    zona.addEventListener('change', enTabla);
    window.addEventListener('resize', function () { if (autoCrece) document.querySelectorAll('#agenda tr.ficha.abierta').forEach(creceFila); });
    /* Sin field-sizing: al mostrar una hoja se recalcula la altura de sus renglones */
    if (autoCrece && window.MutationObserver) {
      var mo = new MutationObserver(function (m) { m.forEach(function (x) { if (x.target.classList.contains('abierta')) x.target.querySelectorAll('tr.ficha.abierta').forEach(creceFila); }); });
      document.querySelectorAll('#agenda .hoja-agenda').forEach(function (h) { mo.observe(h, { attributes: true, attributeFilter: ['class'] }); });
    }
    aplicarTodo();
  }

  window.lrFichas = {
    LISTAS: LISTAS, agregar: agregar, abrirDe: abrirDe, alGuardar: alGuardar, refrescar: aplicarTodo,
    reiniciar: function () { estado = {}; aplicarTodo(); }
  };
  iniciar();
})();
