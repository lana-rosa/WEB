/* Agenda para tejedoras: aviso ANTES de conectar Google Calendar o Google Drive (encargo E30, punto 8 de herramientas/legal/RESPUESTA-ABOGADA-2026-11.md; 5-nov-2026).
   Una ventana propia, aparte de la aceptación general de la cuenta, que dice: qué datos se consultan, qué se crea o guarda, para qué, qué permisos pide, cómo desconectar y qué pasa después,
   más el texto sobre el acceso del equipo (literal de la abogada). El botón «Conectar» solo se activa al marcar la casilla; «Cancelar» o cerrar no conecta nada.
   Uso: `window.lrAvisoConexion.pedir('calendar' | 'drive')` devuelve una promesa con true (autorizó) o false. Los botones «Conectar» de google-calendar.js y drive-sync.js lo piden SIEMPRE
   antes de abrir Google y, si este módulo no está, NO conectan. Texto solo en español (como la autorización de la copia en la nube): `data-no-traducir`. TEXTO EN BORRADOR hasta que lo apruebe la abogada.
   Si cambia lo que la función sincroniza, actualizar estos textos y `politicas.html#datos` (chat 6). Prueba: herramientas/pruebas/probar_agenda_aviso_conexion.py. */
(function () {
  'use strict';
  var ACCESO = 'El acceso del equipo de Lana Rosa Crochet a la información sincronizada con Google está restringido. Esta información no se consulta para fines comerciales ni publicitarios. El acceso excepcional solo podrá producirse cuando sea necesario para atender una solicitud de soporte autorizada por el usuario o para cumplir una obligación legal, de acuerdo con las medidas de seguridad aplicables.';
  var SERVICIOS = {
    calendar: {
      titulo: 'Antes de conectar Google Calendar',
      filas: [
        ['Qué datos se consultan', 'Solo la dirección de tu cuenta de Google, para mostrarte con qué cuenta conectaste. No leemos tus calendarios, tus eventos ni el contenido de tu correo.'],
        ['Qué se crea o se guarda', 'Se crea en tu Google un calendario aparte llamado «Agenda para tejedoras» y se escriben en él las fechas de tu agenda: entregas y envíos de pedidos, proyectos, fichas de proyecto, fechas especiales, ferias y cumpleaños de clientas (con títulos y detalles como cliente, pedido o total). Esos textos pasan por nuestro servidor solo para llegar a Google y no los guardamos. En Lana Rosa guardamos tu permiso de acceso (cifrado), la dirección de tu cuenta de Google, el identificador del calendario y una lista de lo ya enviado para actualizar sin duplicar.'],
        ['Para qué', 'Para que veas tus fechas en tu Google Calendar y recibas el recordatorio, y para actualizarlas sola cuando cambies tu agenda.'],
        ['Qué permiso pide', 'Crear un calendario propio y escribir solo en él, y ver la dirección de tu cuenta de Google. No puede leer ningún calendario, evento ni mensaje tuyo, ni usar tu cuenta para nada más.'],
        ['Cómo desconectar', 'Cuando quieras, con el botón «Desconectar» de la tarjeta de Google Calendar en ⚙️ Configuración. También puedes quitar el permiso en los permisos de tu cuenta de Google.'],
        ['Qué pasa después', 'Al desconectar se borra de tu Google el calendario «Agenda para tejedoras» con sus fechas, retiramos el permiso y borramos lo que guardábamos de tu conexión. Tu agenda en la web no se toca.']
      ],
      acepto: 'Entiendo lo anterior y autorizo conectar mi Google Calendar con mi agenda.',
      boton: 'Conectar Google Calendar'
    },
    drive: {
      titulo: 'Antes de conectar Google Drive',
      filas: [
        ['Qué datos se consultan', 'Solo la dirección de tu cuenta de Google y el archivo de tu agenda que esta app guardó en su carpeta oculta. No leemos ningún otro archivo de tu Drive.'],
        ['Qué se crea o se guarda', 'En una carpeta oculta de tu Drive se guarda un archivo con tu agenda, un archivo aparte por cada foto de tus dibujos y hasta 5 versiones anteriores de la agenda. Los datos van directo de tu navegador a tu Drive: no pasan por Lana Rosa. En Lana Rosa guardamos solo tu permiso de acceso (cifrado) y la dirección de tu cuenta de Google.'],
        ['Para qué', 'Para ver la misma agenda en tu celular, tu tablet y tu computador, con copias para volver atrás si algo se mezcla mal.'],
        ['Qué permiso pide', 'Usar solo la carpeta oculta de esta app en tu Drive. No puede ver, abrir ni borrar tus otros archivos, y tampoco verás esa carpeta para abrirla.'],
        ['Cómo desconectar', 'Cuando quieras, con «Desconectar» (quita el permiso) o «Borrar mi agenda de Drive» (borra la copia y las versiones y desconecta), en la tarjeta de Google Drive de ⚙️ Configuración. También puedes quitar el permiso en los permisos de tu cuenta de Google.'],
        ['Qué pasa después', 'Con «Desconectar» tu agenda sigue funcionando en este aparato y lo guardado en tu Drive se queda ahí hasta que lo borres. Con «Borrar mi agenda de Drive» se borra todo lo guardado en tu Drive. En ambos casos retiramos el permiso y borramos lo que guardábamos de tu conexión.']
      ],
      acepto: 'Entiendo lo anterior y autorizo guardar mi agenda en la carpeta oculta de mi Google Drive.',
      boton: 'Conectar Google Drive'
    }
  };
  function el(tag, cls, texto) { var e = document.createElement(tag); if (cls) e.className = cls; if (texto != null) e.textContent = texto; return e; }
  var dlg = null;
  function armar() {
    dlg = el('dialog', 'modal-membresia no-imprimir'); dlg.id = 'modal-conexion'; dlg.setAttribute('data-no-traducir', ''); dlg.setAttribute('aria-labelledby', 'mc-titulo');
    var x = el('button', 'mm-cerrar', '✕'); x.type = 'button'; x.id = 'mc-cerrar'; x.setAttribute('aria-label', 'Cerrar');
    var h = el('h2'); h.id = 'mc-titulo';
    var est = el('p', 'mm-estado', 'Es gratis y opcional: tú decides si lo conectas. Esta autorización es aparte de la que diste al crear tu cuenta.');
    var ul = el('ul', 'mn-lista'); ul.id = 'mc-lista';
    var acc = el('p', 'mc-acceso'); acc.id = 'mc-acceso';
    var lab = el('label', 'mm-acepto'), chk = el('input'); chk.type = 'checkbox'; chk.id = 'mc-acepto'; var sp = el('span'); sp.id = 'mc-acepto-texto'; lab.appendChild(chk); lab.appendChild(sp);
    var ok = el('button', 'boton-primario'); ok.type = 'button'; ok.id = 'mc-conectar'; ok.disabled = true;
    var no = el('button', 'enlace-copia', 'Cancelar'); no.type = 'button'; no.id = 'mc-cancelar';
    var pol = el('p', 'nota-pie'); pol.appendChild(document.createTextNode('Más información en la ')); var a = el('a', null, 'política de datos'); a.href = '/politicas.html#datos'; a.target = '_blank'; a.rel = 'noopener'; pol.appendChild(a); pol.appendChild(document.createTextNode('.'));
    [x, h, est, ul, acc, lab, ok, no, pol].forEach(function (n) { dlg.appendChild(n); });
    document.body.appendChild(dlg);
    chk.addEventListener('change', function () { ok.disabled = !chk.checked; });
    return dlg;
  }
  var estilo = document.createElement('style');
  estilo.textContent = '.mc-acceso { margin: 0 0 12px; padding: 10px 12px; border-left: 4px solid var(--rosa-medio); background: var(--rosa-suave); border-radius: 8px; font-size: 0.82rem; line-height: 1.45; }';
  document.head.appendChild(estilo);
  function pedir(servicio) {
    var S = SERVICIOS[servicio]; if (!S) return Promise.resolve(false);
    var d = dlg || armar(), lista = d.querySelector('#mc-lista'), chk = d.querySelector('#mc-acepto'), ok = d.querySelector('#mc-conectar');
    d.querySelector('#mc-titulo').textContent = S.titulo; lista.textContent = '';
    S.filas.forEach(function (f) { var li = el('li'); li.appendChild(el('strong', null, f[0] + ': ')); li.appendChild(document.createTextNode(f[1])); lista.appendChild(li); });
    d.querySelector('#mc-acceso').textContent = ACCESO;
    d.querySelector('#mc-acepto-texto').textContent = S.acepto; ok.textContent = S.boton; chk.checked = false; ok.disabled = true;
    return new Promise(function (resolver) {
      var hecho = false;
      function fin(v) { if (hecho) return; hecho = true; limpiar(); if (d.close) d.close(); else d.removeAttribute('open'); resolver(v); }
      function alOk() { if (chk.checked) fin(true); }
      function alNo() { fin(false); }
      function alFondo(e) { if (e.target === d) fin(false); }
      function alCerrar() { fin(false); }
      function limpiar() { ok.removeEventListener('click', alOk); d.querySelector('#mc-cancelar').removeEventListener('click', alNo); d.querySelector('#mc-cerrar').removeEventListener('click', alNo); d.removeEventListener('click', alFondo); d.removeEventListener('close', alCerrar); }
      ok.addEventListener('click', alOk); d.querySelector('#mc-cancelar').addEventListener('click', alNo); d.querySelector('#mc-cerrar').addEventListener('click', alNo); d.addEventListener('click', alFondo); d.addEventListener('close', alCerrar);
      if (d.showModal) d.showModal(); else d.setAttribute('open', '');
      d.scrollTop = 0;
    });
  }
  window.lrAvisoConexion = { pedir: pedir };
})();
