/* Agenda para tejedoras: informe del mes para imprimir (Plus para emprendedoras, etapa 6, 31-oct-2026).
   En «Mi negocio en números» hay un botón «Informe del mes» que abre una hoja con el resumen del mes elegido (flechas para cambiar de mes):
   ingresos, gastos y lo que te quedó; ventas y lo que más vendiste; meta y punto de equilibrio; gastos por categoría; pedidos y clientas; lana en inventario.
   Desde el 2-nov-2026: compara con el mes anterior («▲ 20 % más que en octubre»), se envía por WhatsApp (resumen en texto) y «Exportar a Excel» agrega la hoja «Informe mensual» (una fila por mes).
   Se imprime o se guarda en PDF con el botón del navegador. Solo lee lo escrito en las otras hojas; no guarda nada. Es una guía, no contabilidad oficial.
   Depende de metas-ventas.js (lrMetasVentas.calcular) e inventario.js (lrInventario.resumen), pero funciona sin ellos. API: window.lrInforme.datos(y, m), .abrir(). */
(function () {
  'use strict';
  var N = window.lrAgendaNucleo, hoja = document.getElementById('fin-resumen');
  if (!N || !hoja) return;
  var MESES = { es: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    pt: ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'] };
  function lang() { return window.lrI18n && window.lrI18n.lang ? window.lrI18n.lang : 'es'; }
  function el(tag, cls, t) { var e = document.createElement(tag); if (cls) e.className = cls; if (t != null) e.textContent = t; return e; }
  function num(t) { var n = parseInt(String(t == null ? '' : t).replace(/[^0-9]/g, ''), 10); return isFinite(n) ? n : 0; }
  function plata(x) { return (x < 0 ? '−' : '') + '$ ' + Math.abs(Math.round(x)).toLocaleString('es-CO'); }
  function norm(t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim(); }
  function clave(y, m) { return y + '-' + ('0' + m).slice(-2); }
  function enMes(texto, y, m) { var f = N.leerFecha ? N.leerFecha(texto) : null; return !!f && f.a === y && f.m === m; }
  function filas(tabla, cols) {
    var T = N.tablas[tabla], out = []; if (!T) return out;
    for (var r = 1; r <= T.n; r++) {
      var o = {}, alguno = false;
      cols.forEach(function (c) { var e = document.getElementById(T.prefijo + r + '-' + c); var v = e ? String(e.value || '').trim() : ''; o[c] = v; if (v) alguno = true; });
      if (alguno) out.push(o);
    }
    return out;
  }
  function movs() { var d = N.datos(); return (d._fin && d._fin.movs) || []; }

  /* ---- los números del mes ---- */
  function datos(y, m) {
    var k = clave(y, m), ing = 0, gas = 0, cats = {}, hayMovs = false;
    movs().forEach(function (x) {
      if (!x || String(x.f || '').slice(0, 7) !== k) return; var v = num(x.v); hayMovs = true;
      if (x.t === 'i') ing += v; else if (x.t === 'g') { gas += v; var c = x.fijo ? 'Gastos fijos' : (String(x.c || 'Otros').trim() || 'Otros'); cats[c] = (cats[c] || 0) + v; }
    });
    var vts = filas('tabla-ventas', ['fecha', 'producto', 'cliente', 'precio', 'costo']).filter(function (r) { return enMes(r.fecha, y, m); });
    var vTotal = 0, conCosto = 0, gananciaCosto = 0, prod = {};
    vts.forEach(function (r) {
      var p = num(r.precio), c = num(r.costo); vTotal += p;
      if (p > 0 && c > 0) { conCosto++; gananciaCosto += p - c; }
      var nombre = r.producto || 'Sin nombre', kk = norm(nombre); if (!prod[kk]) prod[kk] = { n: nombre, v: 0, c: 0 }; prod[kk].v += p; prod[kk].c++;
    });
    var top = Object.keys(prod).map(function (x) { return prod[x]; }).sort(function (a, b) { return b.v - a.v || b.c - a.c; }).slice(0, 3);
    var porCat = Object.keys(cats).map(function (c) { return { n: c, v: cats[c] }; }).sort(function (a, b) { return b.v - a.v; });
    var ped = filas('tabla-pedidos', ['estado', 'entrega', 'totalcompra', 'abono']), entregados = 0, entTotal = 0, activos = 0, porCobrar = 0, conSaldo = 0;
    ped.forEach(function (r) {
      var e = r.estado || '';
      if (e === 'Entregado' && enMes(r.entrega, y, m)) { entregados++; entTotal += num(r.totalcompra); }
      if (e === 'Cancelado') return;
      if (e && e !== 'Entregado') activos++;
      var saldo = num(r.totalcompra) - num(r.abono); if (saldo > 0 && num(r.totalcompra) > 0) { porCobrar += saldo; conSaldo++; }
    });
    var nuevas = filas('tabla-clientas', ['nombre', 'desde']).filter(function (r) { return r.nombre && enMes(r.desde, y, m); }).length;
    var mv = window.lrMetasVentas ? window.lrMetasVentas.calcular(y, m) : null;
    var inv = window.lrInventario ? window.lrInventario.resumen() : null;
    var ventas = vTotal > 0 ? vTotal : ing;   // igual que la meta: primero «Mis ventas», si no hay, los ingresos
    return { y: y, m: m, hay: hayMovs || vts.length > 0 || entregados > 0 || nuevas > 0, ingresos: ing, gastos: gas, utilidad: ing - gas, hayMovs: hayMovs,
      nVentas: vts.length, vTotal: vTotal, ventas: ventas, promedio: vts.length ? vTotal / vts.length : 0, conCosto: conCosto, gananciaCosto: gananciaCosto, top: top, cats: porCat,
      meta: mv ? mv.meta : 0, eq: mv ? mv.eq : 0, margen: mv ? mv.margen : 0, fijos: mv ? mv.fijos : 0,
      entregados: entregados, entTotal: entTotal, activos: activos, porCobrar: porCobrar, conSaldo: conSaldo, nuevas: nuevas,
      lana: inv && inv.conCosto ? inv.valor : 0, lanasCosto: inv ? inv.conCosto : 0, porAcabar: inv ? inv.porAcabar.map(function (c) { return c.nombre; }) : [] };
  }

  /* ---- la hoja ---- */
  var caja = null, sel = { y: 0, m: 0 };
  function T(t) { return window.lrI18n && window.lrI18n.t ? window.lrI18n.t(t) : t; }
  function kpi(t, v, cls, cmp) { var d = el('div', 'inf-kpi' + (cls ? ' ' + cls : '')); d.appendChild(el('span', 'inf-k', t)); d.appendChild(el('b', 'inf-v', v)); if (cmp) { var c = el('small', 'inf-cmp ' + cmp.cls, T(cmp.texto)); c.setAttribute('data-no-traducir', ''); d.appendChild(c); } return d; }
  /* comparación con el mes anterior: «▲ 20 % más que en octubre» (en gastos, subir se pinta de alerta; en lo demás, de bien) */
  function comparar(a, p, esGasto, mes, porMonto) {
    if (!(p || p === 0) || (a === 0 && p === 0)) return null;
    var sube = a > p, igual = a === p, bien = esGasto ? !sube : sube;
    if (igual) return { texto: 'Igual que en ' + mes, cls: '' };
    var cuerpo = (porMonto || p <= 0) ? plata(Math.abs(a - p)) : Math.round(Math.abs(a - p) / p * 100) + ' %';
    return { texto: (sube ? '▲ ' : '▼ ') + cuerpo + (sube ? ' más' : ' menos') + ' que en ' + mes, cls: bien ? 'inf-bien' : 'inf-alerta' };
  }
  function mesPrevio(y, m) { m--; if (m < 1) { m = 12; y--; } return { y: y, m: m }; }
  function seccion(titulo) { var s = el('section', 'inf-sec'); s.appendChild(el('h4', 'inf-h', titulo)); return s; }
  function fila(ul, a, b, extra) { var li = el('li'); li.appendChild(el('span', '', a)); var v = el('b', extra || '', b); li.appendChild(v); ul.appendChild(li); return li; }
  function pintar() {
    var d = datos(sel.y, sel.m), cuerpo = caja.querySelector('.inf-cuerpo'); cuerpo.textContent = '';
    var mes = MESES[lang()][sel.m - 1] || MESES.es[sel.m - 1];
    caja.querySelector('.inf-mes').textContent = mes + ' ' + sel.y;
    var quien = (N.datos()['ag-duena'] || '').trim(), sub = caja.querySelector('.inf-quien'); sub.textContent = '';
    if (quien) { sub.appendChild(el('span', '', 'Negocio de ')); var n = el('b', '', quien); n.setAttribute('data-no-traducir', ''); sub.appendChild(n); }
    if (!d.hay) { cuerpo.appendChild(el('p', 'inf-vacio', 'No hay nada anotado en este mes todavía. Anota tus ventas, ingresos y gastos y aquí verás el resumen.')); return; }
    var kp = el('div', 'inf-kpis');
    var pv = mesPrevio(sel.y, sel.m), dp = datos(pv.y, pv.m), nmp = MESES[lang()][pv.m - 1] || MESES.es[pv.m - 1], hp = dp.hay;
    kp.appendChild(kpi('Entró', d.hayMovs || d.ingresos ? plata(d.ingresos) : '—', '', hp && dp.hayMovs ? comparar(d.ingresos, dp.ingresos, false, nmp) : null));
    kp.appendChild(kpi('Salió', d.hayMovs || d.gastos ? plata(d.gastos) : '—', '', hp && dp.hayMovs ? comparar(d.gastos, dp.gastos, true, nmp) : null));
    kp.appendChild(kpi(d.utilidad >= 0 ? 'Te quedó' : 'Perdiste', d.hayMovs ? plata(Math.abs(d.utilidad)) : '—', d.hayMovs ? (d.utilidad >= 0 ? 'inf-bien' : 'inf-mal') : '', hp && dp.hayMovs && d.hayMovs ? comparar(d.utilidad, dp.utilidad, false, nmp, true) : null));
    kp.appendChild(kpi('Ventas', d.ventas ? plata(d.ventas) : '—', '', hp && dp.ventas ? comparar(d.ventas, dp.ventas, false, nmp) : null));
    cuerpo.appendChild(kp);
    if (d.hayMovs && d.ingresos > 0) cuerpo.appendChild(el('p', 'inf-nota', d.utilidad >= 0 ? 'Por cada $ 100 que entraron, te quedaron $ ' + Math.round(d.utilidad / d.ingresos * 100) + '.' : 'Este mes salió más de lo que entró.'));
    /* ventas */
    if (d.nVentas) {
      var s1 = seccion('Tus ventas'), ul1 = el('ul', 'inf-lista');
      fila(ul1, 'Ventas anotadas', String(d.nVentas)); fila(ul1, 'Total vendido', plata(d.vTotal)); fila(ul1, 'Promedio por venta', plata(d.promedio));
      if (d.conCosto) fila(ul1, 'Ganancia (de las ventas con costo)', plata(d.gananciaCosto));
      s1.appendChild(ul1);
      if (d.top.length) { s1.appendChild(el('h5', 'inf-sub', 'Lo que más vendiste')); var ol = el('ul', 'inf-lista'); d.top.forEach(function (t) { var li = fila(ol, t.n, plata(t.v)); li.firstChild.setAttribute('data-no-traducir', ''); }); s1.appendChild(ol); }
      cuerpo.appendChild(s1);
    }
    /* meta y equilibrio */
    if (d.meta || d.eq) {
      var s2 = seccion('Tu meta y tu punto de equilibrio'), ul2 = el('ul', 'inf-lista');
      if (d.meta) { fila(ul2, 'Meta de ventas', plata(d.meta)); fila(ul2, 'Lo que lograste', Math.round(d.ventas / d.meta * 100) + ' %', d.ventas >= d.meta ? 'inf-bien' : ''); }
      if (d.eq) { fila(ul2, 'Para no perder necesitabas vender', plata(d.eq)); }
      s2.appendChild(ul2);
      if (d.eq) s2.appendChild(el('p', 'inf-nota', d.ventas >= d.eq ? 'Superaste tu punto de equilibrio: el negocio ganó este mes.' : 'No llegaste a tu punto de equilibrio: faltaron ' + plata(d.eq - d.ventas) + ' en ventas.'));
      cuerpo.appendChild(s2);
    }
    /* gastos */
    if (d.cats.length) {
      var s3 = seccion('En qué se fue el dinero'), ul3 = el('ul', 'inf-lista'), tot = d.cats.reduce(function (s, c) { return s + c.v; }, 0);
      d.cats.slice(0, 5).forEach(function (c) { fila(ul3, c.n, plata(c.v) + ' · ' + Math.round(c.v / tot * 100) + ' %'); });
      s3.appendChild(ul3); if (d.cats.length > 5) s3.appendChild(el('p', 'inf-nota', 'Y otras categorías más pequeñas.')); cuerpo.appendChild(s3);
    }
    /* pedidos y clientas */
    var s4 = seccion('Pedidos y clientas'), ul4 = el('ul', 'inf-lista');
    fila(ul4, 'Pedidos entregados este mes', d.entregados + (d.entTotal ? ' · ' + plata(d.entTotal) : '')); fila(ul4, 'Pedidos en marcha hoy', String(d.activos));
    fila(ul4, 'Por cobrar hoy', d.porCobrar ? plata(d.porCobrar) : '$ 0', d.porCobrar ? 'inf-alerta' : ''); fila(ul4, 'Clientas nuevas', String(d.nuevas));
    s4.appendChild(ul4); cuerpo.appendChild(s4);
    /* materiales */
    if (d.lana || d.porAcabar.length) {
      var s5 = seccion('Tus materiales hoy'), ul5 = el('ul', 'inf-lista');
      if (d.lana) fila(ul5, 'Dinero en lana', plata(d.lana)); fila(ul5, 'Lanas por acabarse', String(d.porAcabar.length));
      s5.appendChild(ul5);
      if (d.porAcabar.length) { var p = el('p', 'inf-nota'); p.setAttribute('data-no-traducir', ''); p.textContent = d.porAcabar.slice(0, 5).join(', ') + (d.porAcabar.length > 5 ? '…' : ''); s5.appendChild(p); }
      cuerpo.appendChild(s5);
    }
  }
  /* resumen corto en texto para compartir (lo lee la persona o su equipo: va en español) */
  function resumenTexto(d) {
    var mes = MESES.es[d.m - 1] + ' ' + d.y, l = ['🐑 Mi informe de ' + mes + ' (Agenda para tejedoras)'];
    if (!d.hay) return l[0] + '\nTodavía no hay nada anotado en este mes.';
    if (d.hayMovs || d.ingresos) l.push('Entró: ' + plata(d.ingresos));
    if (d.hayMovs || d.gastos) l.push('Salió: ' + plata(d.gastos));
    if (d.hayMovs) l.push((d.utilidad >= 0 ? 'Me quedó: ' : 'Perdí: ') + plata(Math.abs(d.utilidad)));
    if (d.ventas) l.push('Ventas: ' + plata(d.ventas) + (d.nVentas ? ' (' + d.nVentas + ')' : ''));
    if (d.meta) l.push('Meta de ventas: ' + plata(d.meta) + ' · logré el ' + Math.round(d.ventas / d.meta * 100) + ' %');
    if (d.top.length) l.push('Lo que más vendí: ' + d.top.map(function (t) { return t.n; }).join(', '));
    if (d.cats.length) l.push('Gasté más en: ' + d.cats.slice(0, 2).map(function (c) { return c.n + ' ' + plata(c.v); }).join(' y '));
    if (d.porCobrar) l.push('Por cobrar hoy: ' + plata(d.porCobrar));
    return l.join('\n');
  }
  /* una fila por mes con datos (últimos 12) para «Exportar a Excel» */
  function paraExcel() {
    if (hoja.classList.contains('sin-membresia')) return [];
    var hoy = new Date(), y = hoy.getFullYear(), m = hoy.getMonth() + 1, filas = [];
    for (var i = 0; i < 12; i++) {
      var d = datos(y, m);
      if (d.hay) filas.push([MESES.es[m - 1] + ' ' + y, d.ingresos, d.gastos, d.utilidad, d.vTotal, d.nVentas, d.meta || '', d.entregados, d.nuevas]);
      var p = mesPrevio(y, m); y = p.y; m = p.m;
    }
    return filas.length ? [{ nombre: 'Informe mensual', columnas: ['Mes', 'Ingresos', 'Gastos', 'Utilidad', 'Total vendido', 'Número de ventas', 'Meta de ventas', 'Pedidos entregados', 'Clientas nuevas'], filas: filas.reverse() }] : [];
  }
  function armar() {
    if (caja) return caja;
    caja = el('div', 'inf-caja'); caja.id = 'informe-mes'; caja.setAttribute('role', 'dialog'); caja.setAttribute('aria-modal', 'true'); caja.setAttribute('aria-labelledby', 'inf-titulo'); caja.hidden = true;
    var h = el('div', 'inf-hoja');
    var barra = el('div', 'inf-barra no-imprimir');
    var ant = el('button', 'boton-secundario boton-chico', '‹'); ant.type = 'button'; ant.setAttribute('aria-label', 'Mes anterior');
    var sig = el('button', 'boton-secundario boton-chico', '›'); sig.type = 'button'; sig.setAttribute('aria-label', 'Mes siguiente');
    var imp = el('button', 'boton-primario boton-chico', 'Imprimir o guardar en PDF'); imp.type = 'button';
    var wa = el('button', 'boton-secundario boton-chico', 'Enviar por WhatsApp'); wa.type = 'button';
    var cer = el('button', 'boton-secundario boton-chico', 'Cerrar'); cer.type = 'button';
    ant.addEventListener('click', function () { sel.m--; if (sel.m < 1) { sel.m = 12; sel.y--; } pintar(); });
    sig.addEventListener('click', function () { sel.m++; if (sel.m > 12) { sel.m = 1; sel.y++; } pintar(); });
    imp.addEventListener('click', function () { document.body.classList.add('imprimiendo-informe'); var f = function () { document.body.classList.remove('imprimiendo-informe'); window.removeEventListener('afterprint', f); }; window.addEventListener('afterprint', f); window.print(); });
    wa.addEventListener('click', function () { var d = datos(sel.y, sel.m); window.open('https://wa.me/?text=' + encodeURIComponent(resumenTexto(d)), '_blank', 'noopener'); });
    cer.addEventListener('click', cerrar);
    barra.appendChild(ant); barra.appendChild(sig); barra.appendChild(imp); barra.appendChild(wa); barra.appendChild(cer); h.appendChild(barra);
    var cab = el('header', 'inf-cab'); cab.appendChild(el('p', 'inf-sobre', 'Informe del mes'));
    var t = el('h3', 'inf-titulo'); t.id = 'inf-titulo'; var mm = el('span', 'inf-mes'); mm.setAttribute('data-no-traducir', ''); t.appendChild(mm); cab.appendChild(t); cab.appendChild(el('p', 'inf-quien'));
    h.appendChild(cab); h.appendChild(el('div', 'inf-cuerpo'));
    h.appendChild(el('p', 'inf-pie', 'Resumen hecho con tu Agenda para tejedoras de Lana Rosa Crochet con lo que anotaste. Es una guía para tomar decisiones, no es contabilidad oficial.'));
    caja.appendChild(h); document.body.appendChild(caja);
    caja.addEventListener('click', function (e) { if (e.target === caja) cerrar(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !caja.hidden) cerrar(); });
    document.addEventListener('agenda-guardada', function () { if (!caja.hidden) pintar(); });
    return caja;
  }
  var volverA = null;
  function abrir() {
    armar(); var hoy = new Date(); if (!sel.y) { sel.y = hoy.getFullYear(); sel.m = hoy.getMonth() + 1; }
    volverA = document.activeElement; caja.hidden = false; document.body.classList.add('informe-abierto'); pintar();
    var b = caja.querySelector('.inf-barra button:last-child'); if (b) b.focus();
  }
  function cerrar() { if (!caja) return; caja.hidden = true; document.body.classList.remove('informe-abierto'); if (volverA && volverA.focus) volverA.focus(); }

  /* botón en «Mi negocio en números» */
  (function () {
    var ref = hoja.querySelector('.fin-mes'); if (!ref || hoja.querySelector('#inf-boton')) return;
    var c = el('div', 'inf-acceso no-imprimir');
    c.appendChild(el('span', 'inf-acceso-t', 'Para imprimir o guardar en PDF: el resumen del mes con tus ventas, gastos y metas.'));
    var b = el('button', 'boton-secundario boton-chico', 'Ver el informe del mes'); b.type = 'button'; b.id = 'inf-boton'; b.addEventListener('click', abrir);
    c.appendChild(b); ref.insertAdjacentElement('afterend', c);
  })();
  window.lrInforme = { datos: datos, abrir: abrir, cerrar: cerrar, paraExcel: paraExcel, resumenTexto: resumenTexto };
})();
