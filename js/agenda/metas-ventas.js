/* Agenda para tejedoras: meta de ventas del mes y «¿Cuánto necesito vender al mes?» (Plus para emprendedoras, etapa 2, 31-oct-2026).
   Va en la hoja «Presupuesto y metas del negocio» (fin-presupuesto), que es de membresía.
   - Meta de ventas: la persona escribe cuánto quiere vender este mes; se guarda por mes en datos._metaVentas { 'AAAA-MM': pesos }.
     Se compara con lo anotado en «Mis ventas del mes» (si no hay nada ahí, con los ingresos de «Ingresos y gastos del negocio», para no contar dos veces)
     y se convierte en lo que falta por semana y por día, con el ritmo de hoy.
   - Punto de equilibrio simple: gastos fijos del negocio ÷ margen de ganancia. El margen sale de las ventas que tienen costo anotado en «Mis ventas del mes»
     (últimos 3 meses) o de un porcentaje que escribe la persona. Es una guía, no contabilidad.
   Solo lee las otras hojas; lo único que guarda es la meta y el margen que la persona escribe. */
(function () {
  'use strict';
  var N = window.lrAgendaNucleo, hoja = document.getElementById('fin-presupuesto');
  if (!N || !hoja) return;
  var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  function el(tag, cls, t) { var e = document.createElement(tag); if (cls) e.className = cls; if (t != null) e.textContent = t; return e; }
  function num(t) { var n = parseInt(String(t == null ? '' : t).replace(/[^0-9]/g, ''), 10); return isFinite(n) ? n : 0; }
  function plata(x) { return '$ ' + Math.round(x).toLocaleString('es-CO'); }
  function clave(y, m) { return y + '-' + ('0' + m).slice(-2); }
  function filas(tabla, cols) {
    var T = N.tablas[tabla], out = []; if (!T) return out;
    for (var r = 1; r <= T.n; r++) {
      var o = {}, alguno = false;
      cols.forEach(function (c) { var e = document.getElementById(T.prefijo + r + '-' + c); var v = e ? String(e.value || '').trim() : ''; o[c] = v; if (v) alguno = true; });
      if (alguno) out.push(o);
    }
    return out;
  }
  function fin() { var d = N.datos(); return d._fin || {}; }
  function metas() { var d = N.datos(); return d._metaVentas || (d._metaVentas = { metas: {}, margen: '' }); }
  function enMes(texto, y, m) { var f = N.leerFecha ? N.leerFecha(texto) : null; return !!f && f.a === y && f.m === m; }

  /* ---- números que se calculan ---- */
  function ventasDelMes(y, m) {
    var dm = new Date(y, m, 0).getDate(), dia = []; for (var i = 0; i <= dm; i++) dia.push(0);
    var v = filas('tabla-ventas', ['fecha', 'precio']).filter(function (r) { return enMes(r.fecha, y, m); });
    var tot = v.reduce(function (s, r) { var f = N.leerFecha(r.fecha), p = num(r.precio); if (f && f.d >= 1 && f.d <= dm) dia[f.d] += p; return s + p; }, 0);
    if (tot > 0) return { total: tot, fuente: 'ventas', n: v.length, porDia: dia };
    var ing = 0;
    (fin().movs || []).forEach(function (x) { if (x && x.t === 'i' && String(x.f || '').slice(0, 7) === clave(y, m)) { var d = parseInt(String(x.f).slice(8, 10), 10), p = num(x.v); ing += p; if (d >= 1 && d <= dm) dia[d] += p; } });
    return { total: ing, fuente: ing > 0 ? 'ingresos' : 'ventas', n: 0, porDia: dia };
  }
  function margenReal(hoy) {
    var ok = 0, venta = 0, costo = 0, n = 0;
    filas('tabla-ventas', ['fecha', 'precio', 'costo']).forEach(function (r) {
      var f = N.leerFecha ? N.leerFecha(r.fecha) : null; if (!f) return;
      var dm = (hoy.getFullYear() - f.a) * 12 + (hoy.getMonth() + 1 - f.m); if (dm < 0 || dm > 2) return;
      var p = num(r.precio), c = num(r.costo); if (p > 0 && c > 0) { venta += p; costo += c; n++; }
    });
    return venta > 0 ? { pct: Math.round((venta - costo) / venta * 100), n: n } : null;
  }
  function margenDe(hoy) {   // 1.º las ventas con costo; si no hay, el promedio de «Mi catálogo de precios»
    var mr = margenReal(hoy); if (mr) { mr.fuente = 'ventas'; return mr; }
    var c = window.lrCostos && window.lrCostos.margenPromedio ? window.lrCostos.margenPromedio() : null;
    return c && c.pct > 0 ? { pct: c.pct, n: c.n, fuente: 'catalogo' } : null;
  }
  function fijosMes() {
    var f = fin(), fijos = (f.fijos || []).filter(function (x) { return x && x.activo && (x.t === 'g' || x.t === 's'); }).reduce(function (s, x) { return s + num(x.v); }, 0);
    var cuotas = (f.deudas || []).filter(function (d) { return d && num(d.pagadas) < num(d.cuotas); }).reduce(function (s, d) { return s + num(d.cuota); }, 0);
    return { fijos: fijos, cuotas: cuotas };
  }
  function diasDelMes(y, m) { return new Date(y, m, 0).getDate(); }

  /* ---- pintar ---- */
  var cont = null;
  function asegurar() {
    if (cont && hoja.contains(cont)) return cont;
    cont = el('div', 'mv-contenedor no-imprimir'); cont.id = 'metas-ventas';
    var ref = hoja.querySelector('#fin-pres'); var h4 = ref ? ref.previousElementSibling : null;
    var destino = hoja.querySelector('.fin-metas'); var tituloAhorro = destino ? destino.previousElementSibling && destino.previousElementSibling.previousElementSibling : null;
    if (tituloAhorro && tituloAhorro.tagName === 'H4') tituloAhorro.parentNode.insertBefore(cont, tituloAhorro); else hoja.appendChild(cont);
    return cont;
  }
  function pintar(forzar) {
    var c = asegurar(), hoy = new Date(), y = hoy.getFullYear(), m = hoy.getMonth() + 1, mm = metas(), k = clave(y, m);
    var activo = document.activeElement; if (!forzar && activo && c.contains(activo) && activo.tagName === 'INPUT') return;   // no se repinta mientras la persona escribe
    c.textContent = '';
    /* 1. Meta de ventas del mes */
    c.appendChild(el('h4', 'sub-hoja', 'Meta de ventas de ' + MESES[m - 1]));
    var meta = num(mm.metas[k]), vd = ventasDelMes(y, m), tot = vd.total;
    var linea = el('div', 'linea mv-linea'); var lb = el('label', '', '¿Cuánto quieres vender este mes? ($)'); lb.setAttribute('for', 'mv-meta');
    var inp = el('input'); inp.id = 'mv-meta'; inp.setAttribute('inputmode', 'numeric'); inp.setAttribute('placeholder', '0'); inp.value = meta ? meta.toLocaleString('es-CO') : '';
    inp.addEventListener('change', function () { var v = num(inp.value); var d = metas(); if (v > 0) d.metas[k] = v; else delete d.metas[k]; N.guardar(); pintar(true); });
    linea.appendChild(lb); linea.appendChild(inp); c.appendChild(linea);
    if (!meta) c.appendChild(el('p', 'fin-vacio', 'Escribe una meta para ver cuánto vender por semana y por día. Si no sabes cuál poner, mira abajo «¿Cuánto necesito vender al mes?».'));
    else {
      var pct = Math.min(100, Math.round(tot / meta * 100)), dm = diasDelMes(y, m), dia = hoy.getDate(), quedan = dm - dia + 1, falta = Math.max(0, meta - tot);
      var barra = el('div', 'fin-progreso'); var i = el('i'); i.style.width = pct + '%'; barra.appendChild(i); barra.setAttribute('role', 'img'); barra.setAttribute('aria-label', pct + ' % de la meta'); 
      c.appendChild(el('p', 'mv-cifra', 'Llevas ' + plata(tot) + ' de ' + plata(meta) + ' (' + Math.round(tot / meta * 100) + ' %)')); c.appendChild(barra);
      c.appendChild(el('small', 'mv-fuente', vd.fuente === 'ingresos' ? 'Cuento los ingresos de «Ingresos y gastos del negocio». Si anotas tus ventas en «Mis ventas del mes», uso esas.' : 'Cuento lo que anotaste en «Mis ventas del mes» de este mes.'));
      if (falta <= 0) c.appendChild(el('p', 'mv-ok', '¡Cumpliste tu meta del mes! Todo lo que vendas ahora es de más.'));
      else {
        var semanas = Math.max(1, quedan / 7), porSem = falta / semanas, porDia = falta / quedan;
        var esperado = meta * (dia / dm), ritmo = tot >= esperado ? 'Vas al día o adelantada con tu ritmo.' : 'Vas un poco atrasada: para esta fecha lo ideal era ' + plata(esperado) + '.';
        var ul = el('ul', 'mv-lista');
        [['Te faltan', plata(falta)], ['Quedan', quedan + (quedan === 1 ? ' día' : ' días')], ['Por semana', plata(porSem)], ['Por día', plata(porDia)]].forEach(function (p) { var li = el('li'); li.appendChild(el('span', '', p[0])); li.appendChild(el('b', '', p[1])); ul.appendChild(li); });
        c.appendChild(ul); c.appendChild(el('p', 'mv-ritmo', ritmo));
      }
    }
    /* 2. ¿Cuánto necesito vender al mes? */
    c.appendChild(el('h4', 'sub-hoja', '¿Cuánto necesito vender al mes?'));
    var fj = fijosMes(), mr = margenDe(hoy), propio = num(mm.margen);
    var lm = el('div', 'linea mv-linea'); var lbm = el('label', '', 'Margen de ganancia (%), si quieres usar otro'); lbm.setAttribute('for', 'mv-margen');
    var im = el('input'); im.id = 'mv-margen'; im.setAttribute('inputmode', 'numeric'); im.setAttribute('placeholder', mr ? String(mr.pct) : 'Ej. 40'); im.value = propio ? String(propio) : '';
    im.addEventListener('change', function () { var v = Math.max(0, Math.min(95, num(im.value))); var d = metas(); d.margen = v || ''; N.guardar(); pintar(true); });
    lm.appendChild(lbm); lm.appendChild(im);
    var margen = propio > 0 ? propio : (mr && mr.pct > 0 ? mr.pct : 0);
    if (!fj.fijos && !fj.cuotas) { c.appendChild(el('p', 'fin-vacio', 'Para calcularlo, agrega tus pagos del negocio en «Gastos fijos y deudas del negocio» (arriendo, internet, programas…).')); c.appendChild(lm); return; }
    c.appendChild(el('p', 'mv-nota', 'Tus gastos fijos del negocio suman ' + plata(fj.fijos) + ' al mes' + (fj.cuotas ? ' y las cuotas de deudas, ' + plata(fj.cuotas) : '') + '.'));
    c.appendChild(lm);
    if (!margen) { c.appendChild(el('p', 'fin-vacio', 'Falta tu margen de ganancia. Anota el costo de tus productos en «Mi catálogo de precios» o el costo de tus ventas en «Mis ventas del mes», o escribe un porcentaje arriba.')); return; }
    c.appendChild(el('p', 'mv-nota', propio > 0 ? 'Uso el margen que escribiste: ' + margen + ' %.' : mr.fuente === 'catalogo' ? 'Tu margen es ' + margen + ' % (promedio de ' + mr.n + (mr.n === 1 ? ' producto' : ' productos') + ' de «Mi catálogo de precios»).' : 'Tu margen real es ' + margen + ' % (de ' + mr.n + (mr.n === 1 ? ' venta' : ' ventas') + ' con costo anotado en los últimos 3 meses).'));
    var eq = fj.fijos / (margen / 100), eqCuotas = (fj.fijos + fj.cuotas) / (margen / 100);
    var ul2 = el('ul', 'mv-lista');
    [['Para cubrir tus gastos fijos', plata(eq) + ' al mes'], ['Por semana', plata(eq / 4.345)], ['Por día de venta (30)', plata(eq / 30)]].forEach(function (p) { var li = el('li'); li.appendChild(el('span', '', p[0])); li.appendChild(el('b', '', p[1])); ul2.appendChild(li); });
    if (fj.cuotas) { var li2 = el('li'); li2.appendChild(el('span', '', 'Para cubrir también las cuotas de deudas')); li2.appendChild(el('b', '', plata(eqCuotas) + ' al mes')); ul2.appendChild(li2); }
    c.appendChild(ul2);
    c.appendChild(el('p', 'mv-nota', 'Es una guía: por debajo de eso el negocio pierde, por encima empieza a ganar. Cambia si cambian tus precios, tus costos o tus gastos fijos.'));
    var base = fj.cuotas ? eqCuotas : eq, bt = el('button', 'boton-secundario boton-chico mv-usar', 'Usar ' + plata(Math.ceil(base / 1000) * 1000) + ' como mi meta de este mes'); bt.type = 'button';
    bt.addEventListener('click', function () { metas().metas[k] = Math.ceil(base / 1000) * 1000; N.guardar(); pintar(true); }); c.appendChild(bt);
  }
  document.addEventListener('agenda-guardada', function () { if (hoja.classList.contains('abierta')) pintar(); });
  document.addEventListener('costos-listos', function () { if (hoja.classList.contains('abierta')) pintar(true); if (window.lrPintarPanel) window.lrPintarPanel(); });
  new MutationObserver(function () { if (hoja.classList.contains('abierta')) pintar(); }).observe(hoja, { attributes: true, attributeFilter: ['class'] });
  if (hoja.classList.contains('abierta')) pintar();
  /* Datos para las gráficas del panel y de Finanzas (solo lectura) */
  function calcular(y, m) {
    var hoy = new Date(); y = y || hoy.getFullYear(); m = m || hoy.getMonth() + 1;
    var mm = metas(), vd = ventasDelMes(y, m), fj = fijosMes(), mr = margenDe(hoy), propio = num(mm.margen), margen = propio > 0 ? propio : (mr && mr.pct > 0 ? mr.pct : 0);
    var eq = margen && fj.fijos ? fj.fijos / (margen / 100) : 0, eqC = margen && (fj.fijos || fj.cuotas) ? (fj.fijos + fj.cuotas) / (margen / 100) : 0;
    return { y: y, m: m, dias: new Date(y, m, 0).getDate(), hoyDia: (hoy.getFullYear() === y && hoy.getMonth() + 1 === m) ? hoy.getDate() : new Date(y, m, 0).getDate(),
      ventas: vd.total, porDia: vd.porDia, fuente: vd.fuente, meta: num(mm.metas[clave(y, m)]), fijos: fj.fijos, cuotas: fj.cuotas, margen: margen, eq: eq, eqCuotas: eqC };
  }
  window.lrMetasVentas = { pintar: pintar, calcular: calcular };
  document.dispatchEvent(new Event('metas-ventas-listas'));
})();
