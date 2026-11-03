/* Agenda para tejedoras: «Conexiones e integraciones», etapa 1 (3-nov-2026, aprobada por Jennifer).
   Un resumen al inicio de la tarjeta de Configuración con una fila por servicio (Google Calendar, Google Drive y la copia en la cuenta de Lana Rosa): estado, cuenta conectada,
   última sincronización, último aviso y un botón para ir a administrarla. SOLO LEE lo que ya existe (las tarjetas `#calendario-sync` y `#drive-sync`, `window.lrGcal`,
   `window.lrDrive` y `window.lrNube`); no conecta, no desconecta, no pide permisos ni toca datos. Los textos de las filas son cortos y fijos para que el diccionario ES/EN/PT los traduzca.
   Etapa 2: también dice qué tipos de fechas envía Calendar (`window.lrGcal.tiposApagados()`). Se actualiza solo cuando cambian esas tarjetas (MutationObserver). Prueba: herramientas/pruebas/probar_agenda_centro_conexiones.py. */
(function () {
  'use strict';
  var lista = document.getElementById('cx-resumen');
  if (!lista) return;
  function el(tag, cls, texto, noTraducir) { var e = document.createElement(tag); if (cls) e.className = cls; if (texto != null) e.textContent = texto; if (noTraducir) e.setAttribute('data-no-traducir', ''); return e; }
  function idioma() { var l = window.lrI18n && window.lrI18n.lang; return l === 'en' ? 'en-US' : l === 'pt' ? 'pt-BR' : 'es-CO'; }
  function fechaHora(iso) { try { return new Date(iso).toLocaleString(idioma(), { dateStyle: 'medium', timeStyle: 'short' }); } catch (e) { return ''; } }
  function visible(id) { var c = document.getElementById(id); return !!c && !c.hidden; }
  function textoDe(id) { var c = document.getElementById(id); return c ? (c.textContent || '').trim() : ''; }

  function google(nombre, idCaja, idAviso, estado, idBoton) {
    var f = { nombre: nombre, idCaja: idCaja, boton: idBoton };
    if (!visible(idCaja)) { f.estado = 'No disponible'; f.clase = ''; f.detalle = [['Aparece cuando inicias sesión y el servicio está activo.']]; return f; }
    var e = estado && estado();
    if (e && e.conectado) {
      f.estado = 'Conectado'; f.clase = 'cx-si'; f.detalle = [];
      if (e.correo) f.detalle.push(['Cuenta:'], [e.correo, true]);
      if (e.ultima) { if (e.correo) f.detalle.push(['·', true]); f.detalle.push(['Última sincronización:'], [fechaHora(e.ultima), true]); }
      else f.detalle.push(['Todavía no se ha sincronizado.']);
    } else { f.estado = 'No conectado'; f.clase = ''; f.detalle = [['Opcional: tú decides si lo conectas.']]; }
    f.aviso = textoDe(idAviso);
    if (e && e.conectado && idCaja === 'calendario-sync' && window.lrGcal && window.lrGcal.tiposApagados) {   // qué tipos de fechas envía (etapa 2)
      var off = window.lrGcal.tiposApagados();
      if (!off.length) f.detalle.push(['Envía todos los tipos de fechas.']);
      else {
        var ids = ['entregas', 'envios', 'proyectos', 'fechas', 'ferias', 'cumples'].filter(function (x) { return off.indexOf(x) < 0; });
        f.detalle.push(['Envía:'], [ids.length ? ids.map(window.lrGcal.etiquetaTipo).join(', ') : 'nada por ahora', !ids.length ? false : true]);
      }
    }
    return f;
  }
  function filas() {
    var out = [];
    out.push(google('Google Calendar', 'calendario-sync', 'cs-aviso', function () { return window.lrGcal && window.lrGcal.estado(); }, 'cs-conectar'));
    out.push(google('Google Drive', 'drive-sync', 'ds-aviso', function () { return window.lrDrive && window.lrDrive.estado(); }, 'ds-conectar'));
    var n = { nombre: 'Copia en tu cuenta de Lana Rosa', idCaja: 'nube-activar' };
    if (!window.lrNube) { n.estado = 'No disponible'; n.clase = ''; n.detalle = [['Aparece cuando inicias sesión.']]; }
    else if (window.lrNube.activa) { n.estado = 'Activada'; n.clase = 'cx-si'; n.detalle = [['Tu agenda también se guarda en tu cuenta de Lana Rosa.']]; }
    else { n.estado = 'No activada'; n.clase = ''; n.detalle = [['Opcional: guarda tu agenda en tu cuenta para recuperarla.']]; }
    n.aviso = textoDe('nube-estado');
    out.push(n);
    return out;
  }
  function pintar() {
    var previo = document.activeElement && document.activeElement.getAttribute && document.activeElement.getAttribute('data-cx-ir');
    lista.textContent = '';
    filas().forEach(function (f) {
      var li = el('li', 'cx-fila'); li.setAttribute('data-cx', f.nombre);
      li.appendChild(el('span', 'cx-nombre', f.nombre));
      li.appendChild(el('span', 'cx-estado ' + f.clase, f.estado));
      var d = el('span', 'cx-detalle');
      f.detalle.forEach(function (x, i) { if (i) d.appendChild(document.createTextNode(' ')); d.appendChild(el('span', null, x[0], x[1])); });
      li.appendChild(d);
      if (f.aviso) { var a = el('span', 'cx-error'); a.appendChild(el('span', null, 'Último aviso:')); a.appendChild(document.createTextNode(' ')); a.appendChild(el('span', null, f.aviso)); li.appendChild(a); }
      if (f.estado !== 'No disponible') {
        var b = el('button', 'enlace-copia cx-ir', 'Ver y administrar'); b.type = 'button'; b.setAttribute('data-cx-ir', f.nombre);
        b.addEventListener('click', function () {
          var c = document.getElementById(f.idCaja) || document.getElementById('nube-activar');
          if (c && c.hidden && f.idCaja === 'nube-activar') c = document.getElementById('nube-borrar') || c;
          if (!c) return; c.scrollIntoView({ block: 'center' });
          var foco = c.querySelector('button:not([hidden])') || (c.tagName === 'BUTTON' ? c : null); if (foco) foco.focus({ preventScroll: true });
        });
        li.appendChild(b);
      }
      lista.appendChild(li);
    });
    if (previo) { var otra = lista.querySelector('[data-cx-ir="' + previo.replace(/"/g, '') + '"]'); if (otra) otra.focus({ preventScroll: true }); }
  }
  var pendiente = null;
  function pronto() { clearTimeout(pendiente); pendiente = setTimeout(pintar, 60); }
  pintar();
  var obs = new MutationObserver(pronto);
  ['calendario-sync', 'drive-sync', 'nube-estado', 'nube-activar', 'nube-borrar'].forEach(function (id) {
    var e = document.getElementById(id); if (e) obs.observe(e, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['hidden'] });
  });
  [800, 2500, 6000].forEach(function (ms) { setTimeout(pintar, ms); });   // las tarjetas se arman después de consultar a Supabase
  document.addEventListener('agenda-guardada', pronto); document.addEventListener('conexiones-cambio', pronto);
  window.lrCentroConexiones = { actualizar: pintar };
})();
