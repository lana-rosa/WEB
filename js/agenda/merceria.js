/* Agenda para tejedoras: la Mercería Lana Rosa siempre a la mano (27-oct-2026).
   Cada bloque .oferta-merceria (lista de compras, inventario, agujas, patrones, ficha de proyecto) muestra los materiales de la Mercería
   (con el precio del ovillo para lanas e hilos) y los agrega a la «Lista de compras» de la agenda. Si todavía no hay existencias en línea,
   lo dice y lleva al catálogo y al WhatsApp. */
(function () {
  'use strict';
  var N = window.lrAgendaNucleo;
  if (!N) return;
  var URL_RPC = 'https://ngjoognzvehwjtpqwrqe.supabase.co/rest/v1/rpc/obtener_merceria_web';
  var LLAVE = 'sb_publishable_2TQ_piaHlSMHa79zjmOOXg_6bEwgkKD';
  var WA = 'https://wa.me/573205072801?text=' + encodeURIComponent('Hola, quiero información sobre materiales de la Mercería Lana Rosa 🧶');

  function pesos(x) { return '$' + Math.round(Number(x) || 0).toLocaleString('es-CO'); }
  var promesa = null;
  function cargar() {
    if (promesa) return promesa;
    promesa = fetch(URL_RPC, { method: 'POST', headers: { apikey: LLAVE, Authorization: 'Bearer ' + LLAVE, 'Content-Type': 'application/json' }, body: '{}' })
      .then(function (r) { if (!r.ok) throw r.status; return r.json(); })
      .then(function (lista) {
        return (lista || []).filter(function (p) { return p && Number(p.stock_actual) > 0; }).map(function (p) {
          var peso = Number(p.peso_gramos) || 0;
          return { categoria: p.categoria || 'Mercería', nombre: [p.marca, p.color].filter(Boolean).join(' — ') || p.nombre,
            precio: peso ? Math.round(Number(p.precio_gramo) * peso / 100) * 100 : Math.round(Number(p.precio_gramo) || 0) };
        });
      });
    return promesa;
  }

  function agregarALista(p) {
    var t = N.tablas['tabla-compras'], d = N.datos(), fila = 0, r;
    for (r = 1; r <= t.n; r++) { if (!document.getElementById('ag-c' + r + '-material').value.trim()) { fila = r; break; } }
    if (!fila) { N.agregarRenglon('tabla-compras'); fila = t.n; }
    var campos = { material: p.nombre + (p.precio ? ' (' + pesos(p.precio) + ')' : ''), cantidad: '1' };
    Object.keys(campos).forEach(function (k) {
      var el = document.getElementById('ag-c' + fila + '-' + k);
      if (k === 'cantidad' && el.value) return;
      el.value = campos[k]; d[el.id] = el.value;
    });
    N.guardar();
    return fila;
  }

  function montar(bloque) {
    var sel = bloque.querySelector('.merc-sel'), boton = bloque.querySelector('.merc-add'), ayuda = bloque.querySelector('.merc-ayuda');
    var cats = (bloque.dataset.categorias || '').split(',').map(function (x) { return x.trim(); }).filter(Boolean), productos = [];
    var enlaces = ' <a href="/merceria/catalogo/">Ver la Mercería</a> · <a href="' + WA + '" target="_blank" rel="noopener">Preguntar por WhatsApp</a>';
    function sinExistencias(txt) {
      sel.innerHTML = '<option value="">' + txt + '</option>'; sel.disabled = true; boton.disabled = true;
      ayuda.innerHTML = 'Mientras tanto:' + enlaces + '.';
    }
    cargar().then(function (todos) {
      var grupos = {};
      todos.forEach(function (p) { if (!cats.length || cats.indexOf(p.categoria) >= 0) (grupos[p.categoria] = grupos[p.categoria] || []).push(p); });
      var html = '<option value="">Elige un material…</option>';
      Object.keys(grupos).sort().forEach(function (g) {
        html += '<optgroup label="' + g.replace(/"/g, '') + '">' + grupos[g].sort(function (a, b) { return a.nombre.localeCompare(b.nombre, 'es'); }).map(function (p) {
          productos.push(p);
          return '<option value="' + (productos.length - 1) + '">' + p.nombre.replace(/</g, '') + (p.precio ? ' — ' + pesos(p.precio) : '') + '</option>';
        }).join('') + '</optgroup>';
      });
      if (!productos.length) { sinExistencias('Pronto habrá existencias en línea'); return; }
      sel.innerHTML = html; sel.disabled = false;
      ayuda.innerHTML = enlaces.replace(/^ /, '');
    }).catch(function () { sinExistencias('No pudimos cargar la Mercería ahora'); });
    sel.addEventListener('change', function () { boton.disabled = !sel.value; ayuda.innerHTML = enlaces.replace(/^ /, ''); });
    boton.addEventListener('click', function () {
      var p = productos[sel.value]; if (!p) return;
      agregarALista(p);
      ayuda.innerHTML = '✓ Agregado a tu <a href="#lista-compras" data-ir="lista-compras">lista de compras</a>.';
      sel.value = ''; boton.disabled = true;
    });
  }
  document.querySelectorAll('.oferta-merceria').forEach(montar);
  window.lrMerceria = { cargar: cargar, agregarALista: agregarALista };
})();
