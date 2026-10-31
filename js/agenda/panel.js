/* Agenda para tejedoras: «Mi panel» (lo primero que se ve) y vista de sección (30-oct-2026, pedido de Sara).
   - #panel-agenda: saludo, 4 números del mes (ventas, gastos, «Te quedó», pedidos activos), próximas fechas, proyectos en curso, acciones rápidas.
     Todo sale de lo que la persona ya escribió en las otras hojas (mismos datos de siempre; no guarda nada propio).
   - window.lrSeccion.abrir(i): al tocar una sección del menú lateral se ven sus hojas como tarjetas (#vista-seccion); cerrar() la oculta. */
(function () {
  'use strict';
  var N = window.lrAgendaNucleo, hoja = document.getElementById('panel-agenda'), cont = document.getElementById('panel-contenido');
  if (!N || !hoja || !cont) return;
  var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  var DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  var TIPOS = { pedido: 'Entrega', pedidoEnvio: 'Envío', ficha: 'Entrega', proyecto: 'Proyecto', fecha: 'Fecha', feria: 'Feria', clienta: 'Cumpleaños' };
  var HOJA_DE = { pedido: 'control-pedidos', pedidoEnvio: 'control-pedidos', ficha: 'ficha-proyecto', proyecto: 'proyectos-fila', fecha: 'fechas-especiales', feria: 'ferias-mercados', clienta: 'mis-clientas' };
  var ACCIONES = [['Anotar pedido', 'control-pedidos', 'tabla-pedidos'], ['Nuevo proyecto', 'proyectos-fila', 'tabla-fila'], ['Anotar venta', 'ventas-mes', 'tabla-ventas'], ['Anotar gasto', 'gastos-negocio', 'tabla-gastos']];
  function el(id) { return document.getElementById(id); }
  function dd(n) { return ('0' + n).slice(-2); }
  function iso(d) { return d.getFullYear() + '-' + dd(d.getMonth() + 1) + '-' + dd(d.getDate()); }
  function pesos(t) { var n = parseInt(String(t || '').replace(/[^0-9]/g, ''), 10); return isFinite(n) ? n : 0; }
  function fm(x) { return (x < 0 ? '−$ ' : '$ ') + Math.abs(Math.round(x)).toLocaleString('es-CO'); }
  function txt(tag, cls, t) { var e = document.createElement(tag); if (cls) e.className = cls; if (t != null) e.textContent = t; return e; }
  function filas(tabla, cols) {
    var T = N.tablas[tabla], out = []; if (!T) return out;
    for (var r = 1; r <= T.n; r++) {
      var o = {}, alguno = false;
      cols.forEach(function (c) { var e = document.getElementById(T.prefijo + r + '-' + c); var v = e ? (e.type === 'checkbox' ? e.checked : String(e.value || '').trim()) : ''; o[c] = v; if (v) alguno = true; });
      if (alguno) out.push(o);
    }
    return out;
  }
  function ir(id) { if (window.lrIrAHoja) window.lrIrAHoja(id); }
  function icono(nombre) { return window.lrIconos ? window.lrIconos(nombre) : null; }

  function saludo(hoy) {
    var h = hoy.getHours(), s = h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
    var nombre = String(N.datos()['ag-duena'] || '').trim().split(/\s+/)[0];
    return s + (nombre ? ', ' + nombre : '');
  }
  function proximas(hoy, max) {
    var evs = (window.lrAgenda && window.lrAgenda.eventos) ? window.lrAgenda.eventos() : [], out = [], lim = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 45);
    evs.forEach(function (e) {
      var p = String(e.fecha).split('-'); if (p.length !== 3) return;
      var f = new Date(+p[0], +p[1] - 1, +p[2]);
      if (e.anual) { f = new Date(hoy.getFullYear(), +p[1] - 1, +p[2]); if (f < hoy) f = new Date(hoy.getFullYear() + 1, +p[1] - 1, +p[2]); }
      if (f < hoy || f > lim) return;
      out.push({ f: f, tipo: String(e.clave || '').split(':')[0], titulo: e.titulo, det: String(e.detalle || '').split('\n')[0] });
    });
    out.sort(function (a, b) { return a.f - b.f; });
    return out.slice(0, max);
  }
  // Iniciales de lunes a domingo según el idioma elegido (js/agenda/idioma.js)
  function INICIALES() { var l = window.lrI18n ? window.lrI18n.lang : 'es'; return l === 'en' ? ['M', 'T', 'W', 'T', 'F', 'S', 'S'] : l === 'pt' ? ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'] : ['L', 'M', 'M', 'J', 'V', 'S', 'D']; }
  // Mes abreviado en el idioma elegido (no pasa por el diccionario: «mar» sería a la vez marzo y martes)
  function MES3(i) { var l = window.lrI18n ? window.lrI18n.lang : 'es', A = { en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], pt: ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'] }; return A[l] ? A[l][i] : MESES[i].slice(0, 3); }
  var FRASES = ['Tejer es mi terapia', 'Una vuelta más y lo logras', 'Tú puedes con este proyecto', 'Hecho a mano, con amor', 'Hoy también cuenta: una vuelta a la vez', 'Tu talento tiene valor'];
  var ESTADOS = [['Terminado', 'Terminados', '#4F7A57'], ['Tejiendo', 'Tejiendo', '#E74E96'], ['Por empezar', 'Por empezar', '#9EA2F9']];
  var SVGNS = 'http://www.w3.org/2000/svg';
  function sv(tag, attrs) { var e = document.createElementNS(SVGNS, tag); Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); }); return e; }
  function ic(nombre) { return window.lrIconos && window.lrIconos.por ? window.lrIconos.por(nombre) : document.createComment(''); }
  function tarjeta(titulo, valor, sub, clase, icon) {
    var c = txt('div', 'pn-card pn-kpi' + (clase ? ' ' + clase : '')), i = txt('span', 'pn-kpi-ic'), kimg = { k1: 'ventas', k2: 'gastos', k3: 'quedo', k4: 'pedidos' }[(clase || '').split(' ')[0]];
    if (kimg) { var im = document.createElement('img'); im.src = '/img/agenda/ui/kpi-' + kimg + '.webp?v=1'; im.alt = ''; im.className = 'pn-kpi-img'; im.width = 48; im.height = 48; im.setAttribute('aria-hidden', 'true'); i.appendChild(im); } else i.appendChild(ic(icon));
    c.appendChild(i);
    var d = txt('div', 'pn-kpi-t'); d.appendChild(txt('small', '', titulo)); d.appendChild(txt('strong', '', valor)); d.appendChild(txt('span', '', sub)); c.appendChild(d); return c;
  }
  function cabecera(titulo, enlaceTxt, hojaId) {
    var h = txt('h4', '', titulo); if (enlaceTxt) { var v = txt('button', 'pn-enlace', enlaceTxt); v.type = 'button'; v.addEventListener('click', function () { ir(hojaId); }); h.appendChild(v); } return h;
  }
  function donut(cuentas, total) {
    var s = sv('svg', { viewBox: '0 0 42 42', 'class': 'pn-donut', role: 'img', 'aria-label': total + (total === 1 ? ' proyecto' : ' proyectos') + ': ' + ESTADOS.map(function (e, i) { return cuentas[i] + ' ' + e[1].toLowerCase(); }).join(', ') });
    s.appendChild(sv('circle', { cx: 21, cy: 21, r: 15.9, fill: 'none', stroke: '#FBE4EF', 'stroke-width': 6 }));
    var acum = 0;
    cuentas.forEach(function (n, i) {
      if (!n || !total) return; var pct = n / total * 100;
      s.appendChild(sv('circle', { cx: 21, cy: 21, r: 15.9, fill: 'none', stroke: ESTADOS[i][2], 'stroke-width': 6, 'stroke-dasharray': pct + ' ' + (100 - pct), 'stroke-dashoffset': 25 - acum }));
      acum += pct;
    });
    var t1 = sv('text', { x: 21, y: 23, 'text-anchor': 'middle', 'font-size': 9, 'font-weight': 800, fill: '#8E1457' }); t1.textContent = String(total); s.appendChild(t1);
    var t2 = sv('text', { x: 21, y: 29, 'text-anchor': 'middle', 'font-size': 3.4, fill: '#6B5560' }); t2.textContent = total === 1 ? 'proyecto' : 'proyectos'; s.appendChild(t2);
    return s;
  }
  function semanaVentas(hoy, ventas) {
    var lun = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - ((hoy.getDay() + 6) % 7)), v = [0, 0, 0, 0, 0, 0, 0];
    ventas.forEach(function (f) {
      var d = N.leerFecha ? N.leerFecha(f.fecha) : null; if (!d || d.sinAnio) return;
      var i = Math.round((new Date(d.a, d.m - 1, d.d) - lun) / 86400000); if (i >= 0 && i < 7) v[i] += pesos(f.precio);
    });
    return { v: v, hoy: (hoy.getDay() + 6) % 7 };
  }
  function calendarioMini(hoy, evs) {
    var a = hoy.getFullYear(), m = hoy.getMonth(), marcados = {};
    evs.forEach(function (e) {
      var p = String(e.fecha).split('-'); if (p.length !== 3) return;
      if (e.anual ? +p[1] - 1 === m : +p[0] === a && +p[1] - 1 === m) marcados[+p[2]] = 1;
    });
    var g = txt('div', 'pn-cal'), ini = (new Date(a, m, 1).getDay() + 6) % 7, n = new Date(a, m + 1, 0).getDate(), con = Object.keys(marcados);
    g.setAttribute('role', 'img'); g.setAttribute('aria-label', MESES[m] + ' ' + a + (con.length ? ': hay algo agendado los días ' + con.join(', ') : ': nada agendado este mes'));
    INICIALES().forEach(function (d) { g.appendChild(txt('span', 'pn-cal-t', d)); });
    for (var i = 0; i < ini; i++) g.appendChild(txt('span', ''));
    for (var d = 1; d <= n; d++) g.appendChild(txt('span', (d === hoy.getDate() ? 'hoy ' : '') + (marcados[d] ? 'ev' : ''), String(d)));
    return g;
  }
  var avisosTodos = false, diaPintado = '';
  function pintar() {
    var hoy = new Date(); hoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()); diaPintado = iso(hoy);
    var enMes = function (t) { var f = N.leerFecha ? N.leerFecha(t) : null; return !!f && f.a === hoy.getFullYear() && f.m === hoy.getMonth() + 1; };
    var todasVentas = filas('tabla-ventas', ['fecha', 'precio']);
    var ventas = todasVentas.filter(function (f) { return enMes(f.fecha); }), vend = ventas.reduce(function (s, f) { return s + pesos(f.precio); }, 0);
    var gastos = filas('tabla-gastos', ['fecha', 'valor']).filter(function (f) { return enMes(f.fecha); }), gas = gastos.reduce(function (s, f) { return s + pesos(f.valor); }, 0);
    var ped = filas('tabla-pedidos', ['cliente', 'entrega', 'estado', 'precio', 'totalcompra', 'abono']);
    var activos = ped.filter(function (p) { return !/entreg|cancel|despachad|terminad/i.test(p.estado); });
    var semana = activos.filter(function (p) { var f = N.leerFecha ? N.leerFecha(p.entrega) : null; if (!f || f.sinAnio) return false; var d = Math.round((new Date(f.a, f.m - 1, f.d) - hoy) / 86400000); return d >= 0 && d <= 7; }).length;
    var cobrar = activos.reduce(function (s, p) { return s + Math.max(0, (pesos(p.totalcompra) || pesos(p.precio)) - pesos(p.abono)); }, 0);
    var todosProy = filas('tabla-fila', ['proyecto', 'para', 'fecha', 'estado']).filter(function (p) { return p.proyecto; });
    var proy = todosProy.filter(function (p) { return p.estado !== 'Terminado'; });
    proy.sort(function (a, b) { return (a.estado === 'Tejiendo' ? 0 : 1) - (b.estado === 'Tejiendo' ? 0 : 1); });
    var tejiendo = proy.filter(function (p) { return p.estado === 'Tejiendo'; }).length;
    var prox = proximas(hoy, 5), evs = (window.lrAgenda && window.lrAgenda.eventos) ? window.lrAgenda.eventos() : [];

    cont.textContent = '';
    /* Saludo con Rosina */
    var hero = txt('section', 'pn-hero'); hero.appendChild(txt('span', 'pn-bola b1')); hero.appendChild(txt('span', 'pn-bola b2')); hero.appendChild(txt('span', 'pn-bola b3'));
    var tx = txt('div', 'pn-hero-t'); tx.appendChild(txt('h4', '', saludo(new Date())));
    var partes = [];
    partes.push(semana ? 'Tienes ' + semana + (semana === 1 ? ' entrega' : ' entregas') + ' esta semana' : 'No tienes entregas esta semana');
    partes.push(tejiendo ? tejiendo + (tejiendo === 1 ? ' proyecto' : ' proyectos') + ' en el gancho' : 'ningún proyecto tejiéndose ahora');
    tx.appendChild(txt('p', '', DIAS[hoy.getDay()].replace(/^./, function (c) { return c.toUpperCase(); }) + ' ' + hoy.getDate() + ' de ' + MESES[hoy.getMonth()] + ' · ' + partes.join(' y ') + '.'));
    var dia = Math.floor((hoy - new Date(hoy.getFullYear(), 0, 0)) / 86400000); tx.appendChild(txt('span', 'pn-frase', FRASES[dia % FRASES.length]));
    hero.appendChild(tx); var im = document.createElement('img'); im.className = 'pn-rosina'; im.src = '/img/agenda/rosina/tejiendo.webp'; im.alt = ''; im.width = 260; im.height = 260; hero.appendChild(im);
    cont.appendChild(hero);

    /* Avisos de hoy y consejo de Rosina (Plus, etapa 1, 31-oct-2026): solo leen lo ya escrito; no guardan nada (salvo el «Entendido» del consejo) */
    var dif = function (t) { var f = N.leerFecha ? N.leerFecha(t) : null; return (!f || f.sinAnio) ? null : Math.round((new Date(f.a, f.m - 1, f.d) - hoy) / 86400000); };
    var av = [], quien = function (p) { return p.cliente || p.pedido || 'pedido'; };
    var saldoDe = function (p) { return Math.max(0, (pesos(p.totalcompra) || pesos(p.precio)) - pesos(p.abono)); };
    /* av: [prioridad, nivel, texto, hoja, días, grupo]; dentro de cada prioridad, primero el más atrasado / el que vence antes */
    activos.forEach(function (p) {
      var d = dif(p.entrega); if (d === null || d > 3) return;
      var sal = saldoDe(p), extra = sal ? ' · saldo ' + fm(sal) : '';
      if (d < 0) av.push([0, 'mal', 'Entrega atrasada: ' + quien(p) + extra, 'control-pedidos', d, 'atr']);
      else if (d === 0) av.push([1, 'alerta', 'Entrega de hoy: ' + quien(p) + extra, 'control-pedidos', d, 'prox']);
      else if (d === 1) av.push([2, 'alerta', 'Entrega mañana: ' + quien(p) + extra, 'control-pedidos', d, 'prox']);
      else av.push([3, 'alerta', 'Entrega en ' + d + ' días: ' + quien(p) + extra, 'control-pedidos', d, 'prox']);
    });
    ped.filter(function (p) { return /entreg/i.test(p.estado) && saldoDe(p) > 0; }).forEach(function (p) { av.push([4, 'alerta', 'Saldo pendiente de ' + quien(p) + ': ' + fm(saldoDe(p)), 'control-pedidos', dif(p.entrega) || 0, 'cob']); });
    todosProy.filter(function (p) { var d = dif(p.fecha); return p.estado !== 'Terminado' && d !== null && d < 0; }).forEach(function (p) { av.push([5, 'mal', 'El proyecto «' + p.proyecto + '» ya pasó su fecha', 'proyectos-fila', dif(p.fecha), 'proy']); });
    av.sort(function (a, b) { return a[0] - b[0] || a[4] - b[4]; });
    if (av.length) {
      var ta = txt('div', 'pn-card pn-avisos'); ta.setAttribute('role', 'region'); ta.setAttribute('aria-label', 'Avisos de hoy'); ta.appendChild(txt('h4', '', 'Avisos de hoy'));
      var cuenta = { atr: 0, prox: 0, cob: 0, proy: 0 }; av.forEach(function (a) { cuenta[a[5]]++; });
      var resumen = txt('div', 'pn-av-resumen');
      [['atr', 'atrasadas', 'mal'], ['prox', 'próximas (3 días)', ''], ['cob', 'por cobrar', ''], ['proy', 'proyectos vencidos', 'mal']].forEach(function (c) {
        if (!cuenta[c[0]]) return; var ch = txt('span', 'pn-av-chip ' + c[2]); ch.appendChild(txt('b', '', String(cuenta[c[0]]))); ch.appendChild(txt('span', '', ' ' + c[1])); resumen.appendChild(ch);
      });
      ta.appendChild(resumen);
      var ver = avisosTodos ? av : av.slice(0, 5);
      ver.forEach(function (a) {
        var fila = txt('button', 'pn-fila pn-aviso ' + a[1]); fila.type = 'button'; fila.addEventListener('click', function () { ir(a[3]); });
        var i = txt('span', 'pn-aviso-ic'); i.setAttribute('aria-hidden', 'true'); i.appendChild(ic(a[1] === 'mal' ? 'alerta' : 'reloj')); fila.appendChild(i); fila.appendChild(txt('span', 'pn-t', a[2])); ta.appendChild(fila);
      });
      if (av.length > 5) {
        var mas = txt('button', 'pn-accion sec pn-av-mas', avisosTodos ? 'Ver menos' : 'Ver todos los avisos (' + av.length + ')'); mas.type = 'button'; mas.setAttribute('aria-expanded', avisosTodos ? 'true' : 'false');
        mas.addEventListener('click', function () { avisosTodos = !avisosTodos; pintar(); }); ta.appendChild(mas);
      }
      cont.appendChild(ta);
    }
    var off = {}; try { off = JSON.parse(localStorage.getItem('lrAgendaConsejos') || '{}') || {}; } catch (e) { off = {}; }
    var CONSEJOS = [
      ['abono', activos.some(function (p) { return pesos(p.totalcompra) && !pesos(p.abono); }), 'Tienes pedidos activos sin abono. Pedir un anticipo antes de tejer cuida tus materiales y tu tiempo.', 'control-pedidos'],
      ['gastos', activos.length >= 3 && !gastos.length, 'Ya tienes varios pedidos y ningún gasto anotado este mes. Anota lo que gastas en materiales para saber cuánto te queda por cada pedido.', 'gastos-negocio'],
      ['fechas', activos.some(function (p) { return !String(p.entrega || '').trim(); }), 'Algunos pedidos activos no tienen fecha de entrega. Con la fecha, la agenda te avisa a tiempo.', 'control-pedidos'],
      ['gancho', tejiendo >= 4, 'Tienes muchos proyectos en el gancho a la vez. Terminar uno antes de empezar otro ayuda a cumplir las fechas.', 'proyectos-fila']
    ].filter(function (c) { return c[1] && !off[c[0]]; })[0];
    if (CONSEJOS) {
      var cr = txt('div', 'pn-card pn-consejo'); cr.appendChild(txt('h4', '', 'Consejo de Rosina'));
      cr.appendChild(txt('p', '', CONSEJOS[2]));
      var bs = txt('div', 'pn-acciones');
      var b1 = txt('button', 'pn-accion', 'Ir a la hoja'); b1.type = 'button'; b1.addEventListener('click', function () { ir(CONSEJOS[3]); });
      var b2 = txt('button', 'pn-accion sec', 'Entendido'); b2.type = 'button'; b2.addEventListener('click', function () { off[CONSEJOS[0]] = 1; try { localStorage.setItem('lrAgendaConsejos', JSON.stringify(off)); } catch (e) { /* sin almacenamiento: vuelve a salir */ } pintar(); });
      bs.appendChild(b1); bs.appendChild(b2); cr.appendChild(bs); cont.appendChild(cr);
    }

    if (!ped.length && !todasVentas.length && !filas('tabla-gastos', ['valor']).length && !proy.length && window.lrEmpiezaAqui) cont.appendChild(window.lrEmpiezaAqui());
    var k = txt('div', 'pn-kpis'); k.setAttribute('role', 'group'); k.setAttribute('aria-label', 'Números de ' + MESES[hoy.getMonth()]);
    k.appendChild(tarjeta('Ventas de ' + MESES[hoy.getMonth()], fm(vend), ventas.length + (ventas.length === 1 ? ' venta anotada' : ' ventas anotadas'), 'k1', 'grafica'));
    k.appendChild(tarjeta('Gastos del mes', fm(gas), gastos.length + (gastos.length === 1 ? ' gasto anotado' : ' gastos anotados'), 'k2', 'recibo'));
    k.appendChild(tarjeta('Te quedó', fm(vend - gas), vend || gas ? (vend - gas >= 0 ? 'Ganancia del mes' : 'Este mes gastaste más de lo que vendiste') : 'Aparece cuando anotes ventas y gastos', 'k3 ' + (vend - gas > 0 ? 'bien' : vend - gas < 0 ? 'mal' : ''), 'tendencia'));
    k.appendChild(tarjeta('Pedidos activos', String(activos.length), activos.length ? (cobrar ? 'Por cobrar ' + fm(cobrar) : 'Todo cobrado') : 'Anota tu primer pedido', 'k4', 'bolsa'));
    cont.appendChild(k);

    /* Punto de equilibrio del mes, en gráfica (solo si ya hay gastos fijos y margen; Plus, 31-oct-2026) */
    if (window.lrGraficas) {
      var pe = txt('div', 'pn-card pn-equilibrio'); pe.appendChild(cabecera('Punto de equilibrio del mes', 'Ver finanzas', 'fin-resumen'));
      var cuerpo = txt('div', 'pn-pe-cuerpo'); pe.appendChild(cuerpo);
      if (window.lrGraficas.equilibrio(cuerpo)) cont.appendChild(pe);
    }
    /* Tres tarjetas con gráficos: proyectos, ventas de la semana y calendario del mes */
    var gr = txt('div', 'pn-graf');
    var cp = txt('div', 'pn-card'); cp.appendChild(cabecera('Mis proyectos', 'Ver todos', 'proyectos-fila'));
    if (!todosProy.length) { var vp = txt('div', 'pn-vacio-rosina'); var ii = document.createElement('img'); ii.src = '/img/agenda/rosina/idea.webp'; ii.alt = ''; ii.width = 86; ii.height = 86; vp.appendChild(ii); vp.appendChild(txt('p', 'pn-vacio', 'Aquí verás tus proyectos terminados, tejiéndose y por empezar. Agrega el primero con «Nuevo proyecto».')); cp.appendChild(vp); }
    else {
      var cuentas = ESTADOS.map(function (e, i) { return todosProy.filter(function (p) { return i === 2 ? (p.estado !== 'Terminado' && p.estado !== 'Tejiendo') : p.estado === e[0]; }).length; });
      var dn = txt('div', 'pn-donut-caja'); dn.appendChild(donut(cuentas, todosProy.length));
      var ley = txt('div', 'pn-leyenda'); ESTADOS.forEach(function (e, i) { var s = txt('span', '', e[1] + ' · ' + cuentas[i]); var pt = txt('i'); pt.style.background = e[2]; s.insertBefore(pt, s.firstChild); ley.appendChild(s); });
      dn.appendChild(ley); cp.appendChild(dn);
      proy.slice(0, 3).forEach(function (p) {
        var fila = txt('button', 'pn-fila'); fila.type = 'button'; fila.addEventListener('click', function () { ir('proyectos-fila'); });
        var t = txt('span', 'pn-t'); t.appendChild(txt('b', '', p.proyecto)); var sub = [p.para ? 'Para ' + p.para : '', p.fecha ? 'Fecha: ' + p.fecha : ''].filter(Boolean).join(' · '); if (sub) t.appendChild(txt('small', '', sub));
        fila.appendChild(t); fila.appendChild(txt('span', 'pn-chip' + (p.estado === 'Tejiendo' ? ' av' : ''), p.estado || 'Por empezar')); cp.appendChild(fila);
      });
    }
    gr.appendChild(cp);
    var cv = txt('div', 'pn-card'); cv.appendChild(cabecera('Ventas de la semana', 'Ver ventas', 'ventas-mes'));
    var sw = semanaVentas(hoy, todasVentas), mx = Math.max.apply(null, sw.v), tot = sw.v.reduce(function (a, b) { return a + b; }, 0);
    if (!tot) cv.appendChild(txt('p', 'pn-vacio', 'Cuando anotes ventas con fecha en «Mis ventas del mes», aquí verás cómo te fue cada día de esta semana.'));
    else {
      var ba = txt('div', 'pn-barras'); ba.setAttribute('role', 'img'); ba.setAttribute('aria-label', 'Ventas de esta semana, de lunes a domingo: ' + sw.v.map(function (x) { return fm(x); }).join(', '));
      INICIALES().forEach(function (d, i) {
        var c = txt('div', i === sw.hoy ? 'hoy' : ''), b = txt('b'); b.style.height = Math.max(6, Math.round(sw.v[i] / mx * 120)) + 'px'; b.title = fm(sw.v[i]); c.appendChild(b); c.appendChild(txt('span', '', d)); ba.appendChild(c);
      });
      cv.appendChild(ba); cv.appendChild(txt('p', 'pn-total', 'Esta semana: ' + fm(tot)));
    }
    gr.appendChild(cv);
    var cc = txt('div', 'pn-card'); cc.appendChild(cabecera(MESES[hoy.getMonth()].replace(/^./, function (c) { return c.toUpperCase(); }) + ' ' + hoy.getFullYear(), 'Ver calendario', 'calendario-anual')); cc.appendChild(calendarioMini(hoy, evs)); gr.appendChild(cc);
    cont.appendChild(gr);

    var dos = txt('div', 'pn-dos');
    var cf = txt('div', 'pn-card'); cf.appendChild(cabecera('Próximas fechas', 'Ver calendario', 'calendario-anual'));
    if (!prox.length) cf.appendChild(txt('p', 'pn-vacio', 'Todavía no hay fechas. Escribe la entrega de un pedido, una feria o un cumpleaños y aparecen aquí.'));
    prox.forEach(function (e) {
      var fila = txt('button', 'pn-fila'); fila.type = 'button'; fila.addEventListener('click', function () { ir(HOJA_DE[e.tipo] || 'calendario-anual'); });
      var fe = txt('span', 'pn-fecha'); fe.appendChild(txt('small', '', MES3(e.f.getMonth()))); fe.appendChild(txt('b', '', dd(e.f.getDate())));
      var t = txt('span', 'pn-t'); t.appendChild(txt('b', '', e.titulo)); if (e.det) t.appendChild(txt('small', '', e.det));
      fila.appendChild(fe); fila.appendChild(t); fila.appendChild(txt('span', 'pn-chip', TIPOS[e.tipo] || 'Fecha')); cf.appendChild(fila);
    });
    dos.appendChild(cf);
    var ch = txt('div', 'pn-card'); ch.appendChild(cabecera('Para hacer hoy', 'Planeador', 'planeador-dia'));
    var reg = (N.datos()._dias || {})[iso(hoy)], tareas = reg && reg.t ? reg.t : [];
    if (!tareas.length) ch.appendChild(txt('p', 'pn-vacio', 'Anota tus tareas del día en el Planeador y aparecen aquí.'));
    tareas.slice(0, 5).forEach(function (t) {
      var b = txt('button', 'pn-tarea' + (t.ok ? ' ok' : '')); b.type = 'button'; b.addEventListener('click', function () { ir('planeador-dia'); });
      b.appendChild(txt('span', 'pn-tarea-m', t.ok ? '✓' : '')); b.appendChild(txt('span', '', String(t.x || ''))); ch.appendChild(b);
    });
    dos.appendChild(ch); cont.appendChild(dos);

    var ca = txt('div', 'pn-card'); ca.appendChild(txt('h4', '', 'Acciones rápidas'));
    var ac = txt('div', 'pn-acciones');
    ACCIONES.forEach(function (a) {
      var b = txt('button', 'pn-accion', '+ ' + a[0]); b.type = 'button';
      b.addEventListener('click', function () { ir(a[1]); setTimeout(function () { if (window.lrFichas) window.lrFichas.agregar(a[2]); else if (N.agregarRenglon) N.agregarRenglon(a[2]); }, 80); });
      ac.appendChild(b);
    });
    ca.appendChild(ac); cont.appendChild(ca);

    var mas = txt('div', 'pn-card'); mas.appendChild(txt('h4', '', 'Más en Inicio'));
    var lm = txt('div', 'pn-acciones');
    [['Planeador del día', 'planeador-dia'], ['Portada', 'portada-agenda'], ['Aprende y compra', 'aprende-compra'], ['Índice de hojas', 'indice-agenda']].forEach(function (a) {
      var b = txt('button', 'pn-accion sec', a[0]); b.type = 'button'; b.addEventListener('click', function () { ir(a[1]); }); lm.appendChild(b);
    });
    mas.appendChild(lm); cont.appendChild(mas);
    cont.appendChild(txt('p', 'pn-nota', 'Estos números salen de lo que escribes en tus hojas: Mis ventas, Gastos del negocio, Control de pedidos, Proyectos por tejer y el Planeador.'));
  }
  window.lrPintarPanel = pintar;
  /* Si la página queda abierta de un día para otro (o se vuelve a ella), los avisos se renuevan con la fecha de hoy */
  function nuevoDia() { if (hoja.classList.contains('abierta') && diaPintado && diaPintado !== iso(new Date())) pintar(); }
  document.addEventListener('visibilitychange', function () { if (!document.hidden) nuevoDia(); });
  setInterval(nuevoDia, 60000);
  document.addEventListener('agenda-guardada', function () { if (hoja.classList.contains('abierta')) pintar(); });
  pintar();

  /* ---------- Vista de sección: las hojas de una sección como tarjetas ---------- */
  var POSES = [[/proyect/i, 'gancho'], [/material/i, 'ovillo'], [/emprend/i, 'cartel'], [/finanz/i, 'calculadora'], [/fecha|bienestar/i, 'flor']];   // la pose de Rosina de cada sección
  var DESC = { 'semana-tejiendo': 'Qué vas a tejer cada día de la semana.' };   // hojas cuyo subtítulo lleva un campo y no sirve como descripción
  var vista = null;
  function crearVista() {
    vista = txt('section', 'vista-seccion no-imprimir'); vista.id = 'vista-seccion'; vista.hidden = true; vista.setAttribute('aria-labelledby', 'vs-titulo');
    var padre = document.querySelector('.hojas-contenido'); padre.insertBefore(vista, padre.querySelector('.selector-hoja') ? padre.querySelector('.selector-hoja').nextSibling : padre.firstChild);
  }
  function limpio(t) { return String(t || '').replace(/^[^\p{L}\p{N}]+/u, '').trim(); }
  window.lrSeccion = {
    abrir: function (titulo, enlaces, bloqueo) {
      if (!vista) crearVista();
      vista.textContent = '';
      document.querySelectorAll('#agenda .hoja-agenda.abierta').forEach(function (h) { h.classList.remove('abierta'); });
      var cab = txt('div', 'vs-cab'), ct = txt('div', 'vs-cab-t'); var h = txt('h2', '', titulo); h.id = 'vs-titulo'; h.tabIndex = -1; ct.appendChild(h);
      ct.appendChild(txt('p', '', enlaces.length + (enlaces.length === 1 ? ' hoja' : ' hojas') + '. Toca una para abrirla.')); cab.appendChild(ct);
      var pose = POSES.filter(function (x) { return x[0].test(titulo); })[0];
      if (pose) { var im = document.createElement('img'); im.className = 'vs-rosina'; im.src = '/img/agenda/rosina/' + pose[1] + '.webp'; im.alt = ''; im.width = 120; im.height = 120; cab.appendChild(im); }
      vista.appendChild(cab);
      var db = txt('div', 'vs-dash'); db.setAttribute('role', 'region'); db.setAttribute('aria-label', 'Cómo vas en ' + titulo); vista.appendChild(db);
      if (window.lrDashboards) window.lrDashboards.pintar(titulo, db);
      var g = txt('div', 'vs-hojas');
      enlaces.forEach(function (a) {
        var id = a.dataset.hoja, src = document.getElementById(id), p = src ? src.querySelector(':scope > header p') : null, bl = src && src.classList.contains('sin-membresia');
        var b = txt('button', 'pn-card vs-hoja' + (bl ? ' bloq' : '')); b.type = 'button';
        var top = txt('span', 'vs-top'), ic = window.lrIconos && window.lrIconos.hoja ? window.lrIconos.hoja(id, a.textContent) : null;
        if (ic) { var ins = txt('span', 'vs-ic'); ins.appendChild(ic); top.appendChild(ins); }
        top.appendChild(txt('b', '', limpio(a.textContent))); b.appendChild(top); if (DESC[id]) b.appendChild(txt('small', '', DESC[id])); else if (p) b.appendChild(txt('small', '', p.textContent));
        if (bl) b.appendChild(txt('span', 'pn-chip', 'Con membresía'));
        b.addEventListener('click', function () { ir(id); }); g.appendChild(b);
      });
      vista.appendChild(g); vista.hidden = false;
      var sel = el('selector-hoja'); if (sel) sel.hidden = true;
      h.focus({ preventScroll: true });
      if (window.innerWidth < 900) vista.scrollIntoView({ block: 'start' });
    },
    cerrar: function () { if (vista) vista.hidden = true; },
    abierta: function () { return !!vista && !vista.hidden; }
  };
})();
