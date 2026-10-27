/* Agenda para tejedoras: hojas de una sola ficha (27-oct-2026).
   1) Cada casilla de texto es un renglón que se puede ampliar (textarea que crece).
   2) Algunas hojas (prioridades del mes, ficha de proyecto, mi semana tejiendo y ferias y mercados) guardan cada mes, proyecto, semana
      o feria como una ficha con su nombre, en una lista desplegable, y permiten agregar la siguiente.
   Los datos de la ficha que se está viendo siguen en los nombres de siempre (ag-nombre, ag-pm-mes…); las demás se guardan en datos._ver. */
(function () {
  'use strict';
  var N = window.lrAgendaNucleo;
  if (!N) return;

  var MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  var CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  function dos(n) { return ('0' + n).slice(-2); }
  function fechaTxt(d) { return dos(d.getDate()) + '/' + dos(d.getMonth() + 1) + '/' + d.getFullYear(); }
  function lunes(d) { var x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; }
  function mesAnio(a, m) { return MESES[m] + ' ' + a; }
  function leerMes(t) {
    t = String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    var m = -1, i; for (i = 0; i < 12; i++) if (t.indexOf(CORTOS[i]) !== -1) { m = i; break; }
    var y = (t.match(/(20\d\d)/) || [])[1];
    return m < 0 ? null : { m: m, y: y ? +y : new Date().getFullYear() };
  }

  /* qué hoja tiene versiones, cómo se llama cada una, qué se ve a la derecha y cómo se propone la siguiente */
  var HOJAS = {
    'prioridades-mes': {
      nuevo: '➕ Agregar el mes siguiente', unidad: 'mes', vacio: 'Mes sin nombre',
      nombre: function (c) { return String(c['ag-pm-mes'] || '').trim() || 'Mes sin nombre'; },
      chips: function (c) { var t = 0, ok = 0; [1, 2, 3].forEach(function (j) { if (String(c['ag-pm-p' + j] || '').trim()) { t++; if (c['ag-pm-ok' + j]) ok++; } }); return t ? [[ok + ' de ' + t + ' prioridades', ok === t ? 'ok' : '']] : []; },
      inicial: function () { var h = new Date(); return { 'ag-pm-mes': mesAnio(h.getFullYear(), h.getMonth()) }; },
      siguiente: function (c) {
        var m = leerMes(c['ag-pm-mes']), h = new Date(), a = m ? m.y : h.getFullYear(), mm = m ? m.m + 1 : h.getMonth() + 1;
        if (mm > 11) { mm = 0; a++; } return { 'ag-pm-mes': mesAnio(a, mm) };
      }
    },
    'ficha-proyecto': {
      nuevo: '➕ Agregar otro proyecto', unidad: 'proyecto', vacio: 'Proyecto sin nombre',
      nombre: function (c) { return String(c['ag-nombre'] || '').trim() || 'Proyecto sin nombre'; },
      chips: function (c) { var x = []; if (String(c['ag-para'] || '').trim()) x.push(['Para ' + String(c['ag-para']).trim().slice(0, 20), '']); if (String(c['ag-fin'] || '').trim()) x.push([String(c['ag-fin']).trim().slice(0, 14), '']); return x; },
      inicial: function () { return {}; }, siguiente: function () { return {}; }
    },
    'semana-tejiendo': {
      nuevo: '➕ Agregar la semana siguiente', unidad: 'semana', vacio: 'Semana sin fecha',
      nombre: function (c) { var t = String(c['ag-semana'] || '').trim(); return t ? 'Semana del ' + t : 'Semana sin fecha'; },
      chips: function (c) { return String(c['ag-meta'] || '').trim() ? [[String(c['ag-meta']).trim().slice(0, 24), '']] : []; },
      inicial: function () { return { 'ag-semana': fechaTxt(lunes(new Date())) }; },
      siguiente: function (c) {
        var f = N.leerFecha ? N.leerFecha(c['ag-semana']) : null, d = f ? new Date(f.a, f.m - 1, f.d + 7) : new Date(lunes(new Date()).getTime() + 7 * 86400000);
        return { 'ag-semana': fechaTxt(d) };
      }
    },
    'disena-patron': {
      nuevo: '➕ Diseñar otro patrón', unidad: 'patrón', vacio: 'Patrón sin nombre',
      nombre: function (c) { return String(c['ag-dp-nombre'] || '').trim() || 'Patrón sin nombre'; },
      chips: function (c) { var x = []; if (c['ag-dp-nivel']) x.push([c['ag-dp-nivel'], '']); if (c['ag-dp-probado']) x.push(['✓ Probado', 'ok']); return x; },
      inicial: function () { return {}; }, siguiente: function () { return {}; }
    },
    'ferias-mercados': {
      nuevo: '➕ Agregar otra feria o mercado', unidad: 'feria', vacio: 'Feria sin nombre',
      nombre: function (c) { return String(c['ag-fr-nombre'] || '').trim() || 'Feria sin nombre'; },
      chips: function (c) { return String(c['ag-fr-fecha'] || '').trim() ? [[String(c['ag-fr-fecha']).trim().slice(0, 16), '']] : []; },
      inicial: function () { return {}; }, siguiente: function () { return {}; }
    }
  };

  function hojaEl(id) { return document.getElementById(id); }
  function camposDe(id) { return Array.prototype.slice.call(hojaEl(id).querySelectorAll('[data-guardar]')).filter(function (e) { return e.type !== 'hidden'; }); }
  function leer(e) { return e.type === 'checkbox' ? e.checked : e.value; }
  function poner(e, v) { if (e.type === 'checkbox') e.checked = !!v; else e.value = v == null ? '' : v; }
  function captura(id) { var o = {}; camposDe(id).forEach(function (e) { var v = leer(e); if (v !== '' && v !== false) o[e.id] = v; }); return o; }
  function crece(e) { if (!(window.CSS && CSS.supports && CSS.supports('field-sizing', 'content')) && e && e.scrollHeight) { e.style.height = 'auto'; e.style.height = (e.scrollHeight + 2) + 'px'; } }

  /* 1) casillas de texto ampliables */
  function ampliables() {
    document.querySelectorAll('#agenda .linea > input[data-guardar], #agenda .prioridad > input[data-guardar]').forEach(function (inp) {
      if (inp.type === 'checkbox') return;
      if (inp.type && inp.type !== 'text') return;
      var ta = document.createElement('textarea'); ta.rows = 1; ta.className = 'una-linea';
      Array.prototype.forEach.call(inp.attributes, function (a) { if (a.name !== 'type' && a.name !== 'style') ta.setAttribute(a.name, a.value); });
      ta.value = inp.value; ta.style.cssText = inp.style.cssText;
      inp.replaceWith(ta);
    });
  }

  /* 2) versiones */
  var UI = {};   // por hoja: { lista }
  function ver(id) {
    var d = N.datos(); d._ver = d._ver || {};
    var V = d._ver[id];
    if (!V || !V.orden || !V.orden.length || !V.v) { V = d._ver[id] = { orden: ['k1'], actual: 'k1', v: { k1: captura(id) }, sig: 2 }; }
    if (!V.v[V.actual]) V.v[V.actual] = captura(id);
    return V;
  }
  function sincronizar(id) { var V = ver(id); V.v[V.actual] = captura(id); }
  function nuevaClave(V) { var k; do { k = 'k' + (V.sig++); } while (V.v[k]); return k; }

  function pintar(id) {
    var H = HOJAS[id], V = ver(id), U = UI[id], cuerpo = U.cuerpo, lista = U.lista;
    hojaEl(id).appendChild(cuerpo);   // se saca de la lista antes de vaciarla para no perder los campos
    lista.textContent = '';
    V.orden.forEach(function (k) {
      var abierta = k === V.actual, c = abierta ? captura(id) : (V.v[k] || {});
      var it = document.createElement('section'); it.className = 'vers-item' + (abierta ? ' abierta' : ''); it.dataset.k = k;
      var b = document.createElement('button'); b.type = 'button'; b.className = 'ficha-cab vers-cab'; b.setAttribute('aria-expanded', abierta ? 'true' : 'false');
      b.innerHTML = '<span class="ficha-flecha" aria-hidden="true">▸</span><span class="ficha-titulo"></span><span class="ficha-meta"></span>';
      b.querySelector('.ficha-titulo').textContent = H.nombre(c);
      var meta = b.querySelector('.ficha-meta'); H.chips(c).forEach(function (x) { var s = document.createElement('span'); s.className = 'ficha-chip' + (x[1] ? ' ' + x[1] : ''); s.textContent = x[0]; meta.appendChild(s); });
      it.appendChild(b);
      var cu = document.createElement('div'); cu.className = 'vers-body'; it.appendChild(cu);
      if (abierta) {
        cu.appendChild(cuerpo);
        var ac = document.createElement('p'); ac.className = 'vers-acciones no-imprimir';
        ac.innerHTML = '<button type="button" class="vers-borrar boton-secundario boton-chico">🗑️ Borrar este ' + H.unidad + '</button>'; cu.appendChild(ac);
      }
      lista.appendChild(it);
    });
    cuerpo.querySelectorAll('textarea').forEach(crece);
  }
  function actualizarCabecera(id) {
    var H = HOJAS[id], V = ver(id), it = UI[id].lista.querySelector('.vers-item.abierta'); if (!it) return;
    var c = captura(id), t = it.querySelector('.ficha-titulo'), n = H.nombre(c);
    if (t.textContent !== n) t.textContent = n;
    var meta = it.querySelector('.ficha-meta'), firma = JSON.stringify(H.chips(c));
    if (meta.dataset.firma !== firma) { meta.dataset.firma = firma; meta.textContent = ''; H.chips(c).forEach(function (x) { var s = document.createElement('span'); s.className = 'ficha-chip' + (x[1] ? ' ' + x[1] : ''); s.textContent = x[0]; meta.appendChild(s); }); }
    V.v[V.actual] = c;
  }
  function cargar(id, valores) {
    var d = N.datos();
    camposDe(id).forEach(function (e) {
      var v = valores[e.id]; poner(e, v);
      d[e.id] = e.type === 'checkbox' ? !!v : (v == null ? '' : v);
    });
    N.guardar();
    if (window.lrAgenda && window.lrAgenda.alCambiar) window.lrAgenda.alCambiar();
  }
  function cambiar(id, k) {
    var V = ver(id); if (!V.v[k] || k === V.actual) return;
    sincronizar(id); V.actual = k; cargar(id, V.v[k]); pintar(id); avisar(id);
  }
  function agregar(id) {
    var H = HOJAS[id], V = ver(id); sincronizar(id);
    var k = nuevaClave(V); V.orden.push(k); V.actual = k; V.v[k] = H.siguiente(V.v[V.orden[V.orden.length - 2]] || {});
    cargar(id, V.v[k]); pintar(id); avisar(id);
    var it = UI[id].lista.querySelector('.vers-item.abierta'); if (it) it.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function borrar(id) {
    var H = HOJAS[id], V = ver(id), i = V.orden.indexOf(V.actual);
    if (!confirm('¿Borrar «' + H.nombre(captura(id)) + '»?\n\nSe elimina de inmediato y no se puede recuperar (solo si guardaste una copia de tu agenda).')) return;
    var dib = N.datos()._dib; if (dib) delete dib[id + ':' + V.actual];   // el dibujo de esa ficha también se va
    delete V.v[V.actual]; V.orden.splice(i, 1);
    if (!V.orden.length) { var k = nuevaClave(V); V.orden = [k]; V.v[k] = H.inicial(); V.actual = k; }
    else V.actual = V.orden[Math.max(0, i - 1)];
    cargar(id, V.v[V.actual]); pintar(id); avisar(id);
  }
  function avisar(id) { document.dispatchEvent(new CustomEvent('version-cambiada', { detail: { hoja: id, k: ver(id).actual } })); }

  /* El mes o la semana se ponen solos, pero solo se ven: no se guardan hasta que la persona escribe algo */
  function prellenar(id) {
    var ini = HOJAS[id].inicial(), V = ver(id);
    camposDe(id).forEach(function (e) { if (ini[e.id] !== undefined && !e.value) e.value = ini[e.id]; });
    V.v[V.actual] = captura(id);
  }

  function montar(id) {
    var art = hojaEl(id), cuerpo = art.querySelector('.vers-cuerpo'); if (!cuerpo) return;
    var H = HOJAS[id], barra = document.createElement('div'); barra.className = 'vers-barra no-imprimir';
    barra.innerHTML = '<button type="button" class="vers-nueva boton-secundario boton-chico"></button>'; barra.firstChild.textContent = H.nuevo;
    var lista = document.createElement('div'); lista.className = 'vers-lista';
    cuerpo.parentNode.insertBefore(lista, cuerpo); cuerpo.parentNode.insertBefore(barra, lista);
    UI[id] = { cuerpo: cuerpo, lista: lista };
    /* la primera vez que se abre la hoja sin nada escrito, el mes o la semana se ponen solos */
    var ini = H.inicial(), V = ver(id);
    V.v[V.actual] = captura(id);   // lo que se ve en pantalla (los nombres de siempre) manda sobre la copia guardada
    if (Object.keys(V.v[V.actual]).length === 0) prellenar(id);
    pintar(id);
    art.addEventListener('click', function (e) {
      var cab = e.target.closest('.vers-cab');
      if (cab) { var k = cab.closest('.vers-item').dataset.k; if (k !== ver(id).actual) cambiar(id, k); return; }
      if (e.target.closest('.vers-nueva')) agregar(id);
      else if (e.target.closest('.vers-borrar')) borrar(id);
    });
    var cambio = function (e) { if (e.target.matches && e.target.matches('[data-guardar]')) { crece(e.target); actualizarCabecera(id); } };
    art.addEventListener('input', cambio); art.addEventListener('change', cambio);
  }

  /* Excel: una fila por mes, proyecto, semana o feria */
  function etiqueta(e) {
    var l = document.querySelector('label[for="' + e.id + '"]');
    var t = l ? l.textContent : (e.getAttribute('aria-label') || e.getAttribute('placeholder') || e.id);
    return String(t).replace(/\s+/g, ' ').trim();
  }
  function paraExcel() {
    var salida = [];
    Object.keys(HOJAS).forEach(function (id) {
      if (!UI[id]) return;
      sincronizar(id);
      var V = ver(id), cs = camposDe(id), filas = [];
      V.orden.forEach(function (k) {
        var c = V.v[k] || {}; if (!Object.keys(c).length) return;
        filas.push([HOJAS[id].nombre(c)].concat(cs.map(function (e) { var v = c[e.id]; return v === true ? 'Sí' : (v == null ? '' : v); })));
      });
      if (filas.length) salida.push({ nombre: hojaEl(id).querySelector('header h3').textContent.trim(), columnas: ['Nombre'].concat(cs.map(etiqueta)), filas: filas });
    });
    return salida;
  }
  /* Para el calendario: valor de un campo en cualquier versión de la hoja */
  function valor(id, k, campo) {
    var V = ver(id); if (!k || k === V.actual) { var e = document.getElementById(campo); return e ? String(e.value || '').trim() : ''; }
    return String((V.v[k] || {})[campo] || '').trim();
  }
  function claves(id) { return ver(id).orden.slice(); }

  ampliables();
  Object.keys(HOJAS).forEach(montar);
  window.lrVersiones = {
    paraExcel: paraExcel, valor: valor, claves: claves, actual: function (id) { return ver(id).actual; },
    alGuardar: function () { Object.keys(UI).forEach(function (id) { var V = ver(id); V.v[V.actual] = captura(id); }); },
    reiniciar: function () { Object.keys(UI).forEach(function (id) { camposDe(id).forEach(function (e) { poner(e, ''); }); N.datos()._ver = {}; ver(id); prellenar(id); pintar(id); }); }
  };
})();
