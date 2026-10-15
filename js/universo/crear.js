// «Rosina te ayuda a crear»: asistente guiado de personalizados (Etapa 2). Vive dentro del formulario de Personaliza (personaliza.html)
// como una de las dos formas de pedir (la otra es diligenciar el formulario directo) y reemplaza solo la parte «tu idea»: las fotos y
// los datos de contacto se piden una sola vez, abajo. Arma una ficha con las opciones elegidas; no calcula precios ni promete fechas:
// muestra el precio base de los «Amigurumi personalizado N cm» reales (los pasa la página) y deja que el taller confirme lo demás.
import { CONFIG, IDEAS_CREAR, TAMANOS_CREAR, DETALLES_CREAR, OCASIONES_CREAR } from './config.js';

const pesos = (n) => '$' + Math.round(Number(n)).toLocaleString('es-CO');
const nodo = (tag, clase, texto) => { const e = document.createElement(tag); if (clase) e.className = clase; if (texto != null) e.textContent = texto; return e; };
function evento(nombre, datos) { try { (window.dataLayer = window.dataLayer || []).push(Object.assign({ event: nombre }, datos || {})); } catch (e) { /* sin medición */ } }

export function fechaLegible(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  return m ? m[3] + '/' + m[2] + '/' + m[1] : '';
}

// Función pura (se prueba aparte): de las opciones elegidas a la ficha. `falta` lista lo obligatorio que no está.
export function armarFicha(e, precios) {
  const idea = IDEAS_CREAR.find((x) => x[0] === e.idea);
  const texto = String(e.texto || '').trim();
  const falta = [];
  if (!idea) falta.push('idea');
  if (!idea || (TAMANOS_CREAR[idea[2]] || []).indexOf(e.tamano) < 0) falta.push('tamano');
  if (!texto) falta.push('texto');
  if (!idea) return { falta };
  const base = idea[2] === 'Amigurumi' && precios && precios[e.tamano] ? precios[e.tamano] : null;
  const detalles = DETALLES_CREAR.filter((d) => e.detalles && Object.prototype.hasOwnProperty.call(e.detalles, d[0]))
    .map((d) => { const t = String(e.detalles[d[0]] || '').trim(); return d[1] + (t ? ' (' + t + ')' : ''); });
  const colores = String(e.colores || '').trim();
  const tarjeta = String(e.tarjeta || '').trim();
  const ocasion = OCASIONES_CREAR.find((x) => x[0] === e.ocasion);
  const fecha = fechaLegible(e.fecha);

  const desc = ['Quiero tejer: ' + idea[1].toLowerCase() + '.'];
  if (detalles.length) desc.push('Detalles que quiero: ' + detalles.join('; ') + '.');
  if (colores) desc.push('Colores importantes: ' + colores + '.');
  desc.push('Mi idea: ' + texto);
  const msg = [];
  if (ocasion && ocasion[0] !== 'sin_ocasion') msg.push('Ocasión: ' + ocasion[1] + '.');
  if (fecha) msg.push('Fecha en la que lo necesito: ' + fecha + ' (confírmenme si es posible).');
  if (tarjeta) msg.push('Mensaje para la tarjeta: «' + tarjeta + '»');
  msg.push('(Ficha armada con «Rosina te ayuda a crear».)');

  const cuando = [ocasion && ocasion[0] !== 'sin_ocasion' ? ocasion[1] : '', fecha ? 'para el ' + fecha : ''].filter(Boolean).join(' · ');
  const filas = [
    ['Qué', idea[1]],
    ['Tamaño', e.tamano ? e.tamano + (base ? ' · precio base ' + pesos(base) : ' · te lo cotizamos') : ''],
    ['Detalles', detalles.join(', ')],
    ['Colores', colores],
    ['Ocasión y fecha', cuando],
    ['Mensaje de la tarjeta', tarjeta],
    ['Tu idea', texto],
  ];
  return { falta, tipo: idea[2], tamano: e.tamano, descripcion: desc.join('\n'), mensaje: msg.join('\n'), filas, base };
}

export function textoWhatsApp(f) {
  return 'Hola Lana Rosa 💕 Quiero cotizar un personalizado con la ficha de «Rosina te ayuda a crear»:\n\n[' + f.tipo + ' — ' + f.tamano + ']\n' + f.descripcion + '\n' + f.mensaje.replace('\n(Ficha armada con «Rosina te ayuda a crear».)', '').replace('(Ficha armada con «Rosina te ayuda a crear».)', '') + '\n\nTe envío las fotos de referencia por aquí.';
}

export function montarGuia(raiz, opciones) {
  const o = Object.assign({ alCambiar: null }, opciones);
  let precios = {};
  const e = { detalles: {} };
  let empezo = false;
  const empezar = () => { if (!empezo) { empezo = true; evento('crear_inicio'); } };

  const marco = nodo('div', 'uc-marco');
  const form = nodo('div', 'uc-form');   // no es un <form>: va dentro del formulario de Personaliza
  form.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' && ev.target.tagName === 'INPUT') ev.preventDefault(); });   // Enter no debe enviar el formulario a medias
  const campos = {};
  const hoy = new Date(); const minFecha = hoy.getFullYear() + '-' + String(hoy.getMonth() + 1).padStart(2, '0') + '-' + String(hoy.getDate()).padStart(2, '0');

  function paso(n) {
    const s = nodo('div', 'uc-paso');
    s.append(nodo('span', 'uc-num', String(n)));
    const cuerpo = nodo('div', 'uc-cuerpo'); s.append(cuerpo);
    form.append(s); return cuerpo;
  }
  function lista(id, etiqueta, sinOpcion, opcionesLista, clave, ayuda) {
    const g = nodo('div', 'ur-grupo');
    const l = nodo('label', null, etiqueta); l.htmlFor = id;
    const s = nodo('select', 'ur-select'); s.id = id;
    s.append(Object.assign(nodo('option', null, sinOpcion), { value: '' }));
    opcionesLista.forEach(([v, t]) => s.append(Object.assign(nodo('option', null, t), { value: v })));
    s.addEventListener('change', () => { empezar(); s.classList.toggle('ur-elegido', !!s.value); evento('crear_paso', { paso: clave }); actualizar(clave); });
    g.append(l, s); if (ayuda) g.append(nodo('p', 'uc-ayuda', ayuda));
    campos[clave] = s; return g;
  }

  // 1 · qué
  paso(1).append(lista('uc-idea', '¿Qué quieres crear?*', 'Elige una opción', IDEAS_CREAR.map((x) => [x[0], x[1]]), 'idea'));
  // 2 · tamaño
  paso(2).append(lista('uc-tamano', '¿De qué tamaño?*', 'Primero elige qué quieres crear', [], 'tamano', 'El precio base es el de una pieza con detalle normal. Si tu diseño necesita más detalle, te lo confirmamos antes de empezar.'));
  campos.tamano.disabled = true;
  // 3 · detalles
  const fs = nodo('fieldset', 'uc-detalles'); fs.append(nodo('legend', null, '¿Qué detalles quieres incluir? (opcional)'));
  DETALLES_CREAR.forEach(([id, texto, pregunta]) => {
    const fila = nodo('div', 'uc-detalle');
    const lab = nodo('label', 'uc-check'); const cb = nodo('input'); cb.type = 'checkbox'; cb.value = id; lab.append(cb, ' ' + texto);
    const tx = nodo('input', 'uc-detalle-texto'); tx.type = 'text'; tx.maxLength = 120; tx.hidden = true; tx.placeholder = pregunta + ' (opcional)'; tx.setAttribute('aria-label', pregunta);
    cb.addEventListener('change', () => {
      empezar(); tx.hidden = !cb.checked;
      if (cb.checked) { e.detalles[id] = tx.value; tx.focus(); } else { delete e.detalles[id]; tx.value = ''; }
      evento('crear_paso', { paso: 'detalles', detalle: id, marcado: cb.checked }); actualizar('detalles');
    });
    tx.addEventListener('input', () => { e.detalles[id] = tx.value; actualizar('detalles'); });
    fila.append(lab, tx); fs.append(fila); campos['detalle_' + id] = { cb, tx };
  });
  paso(3).append(fs);
  // 4 · idea y colores
  const pIdea = paso(4);
  const gT = nodo('div', 'ur-grupo'); const lT = nodo('label', null, 'Cuéntanos tu idea*'); lT.htmlFor = 'uc-texto';
  const ta = nodo('textarea', 'uc-texto'); ta.id = 'uc-texto'; ta.maxLength = 800; ta.rows = 4; ta.placeholder = 'Cuéntanos a quién o qué quieres crear y cómo es.';
  ta.addEventListener('input', () => { empezar(); actualizar('texto'); }); ta.addEventListener('change', () => evento('crear_paso', { paso: 'texto' }));
  gT.append(lT, ta); campos.texto = ta;
  const gC = nodo('div', 'ur-grupo'); const lC = nodo('label', null, 'Colores importantes (opcional)'); lC.htmlFor = 'uc-colores';
  const ic = nodo('input', 'uc-input'); ic.type = 'text'; ic.id = 'uc-colores'; ic.maxLength = 160; ic.placeholder = 'Ej: cabello castaño, camiseta azul, zapatos blancos';
  ic.addEventListener('input', () => { empezar(); actualizar('colores'); });
  gC.append(lC, ic, nodo('p', 'uc-ayuda', 'Si los colores no se ven bien en tus fotos, cuéntanos cuáles son.')); campos.colores = ic;
  pIdea.append(gT, gC);
  // 5 · ocasión, fecha y mensaje de la tarjeta
  const pOc = paso(5);
  // Todo es opcional: va plegado para que el asistente se vea corto («Ocasión, fecha y mensaje»).
  const mas = nodo('details', 'uc-mas'); mas.append(nodo('summary', null, 'Ocasión, fecha y mensaje de la tarjeta (opcional)'));
  mas.append(lista('uc-ocasion', '¿Es para alguna ocasión? (opcional)', 'Sin ocasión especial', OCASIONES_CREAR.filter((x) => x[0] !== 'sin_ocasion'), 'ocasion'));
  const gF = nodo('div', 'ur-grupo'); const lF = nodo('label', null, '¿Para qué fecha lo necesitas? (opcional)'); lF.htmlFor = 'uc-fecha';
  const fe = nodo('input', 'uc-input'); fe.type = 'date'; fe.id = 'uc-fecha'; fe.min = minFecha;
  fe.addEventListener('change', () => { empezar(); evento('crear_paso', { paso: 'fecha' }); actualizar('fecha'); });
  gF.append(lF, fe, nodo('p', 'uc-ayuda', 'Te confirmamos si alcanzamos esa fecha antes de empezar; no prometemos plazos sin ver tu diseño.')); campos.fecha = fe;
  const gM = nodo('div', 'ur-grupo'); const lM = nodo('label', null, 'Mensaje para la tarjeta (opcional)'); lM.htmlFor = 'uc-tarjeta';
  const it = nodo('input', 'uc-input'); it.type = 'text'; it.id = 'uc-tarjeta'; it.maxLength = 200; it.placeholder = 'Ej: Feliz cumpleaños, mamá. Te quiero mucho.';
  it.addEventListener('input', () => { empezar(); actualizar('tarjeta'); });
  gM.append(lM, it, nodo('p', 'uc-ayuda', 'Tu pedido incluye una tarjeta con el mensaje que quieras.')); campos.tarjeta = it;
  mas.append(gF, gM); pOc.append(mas);

  // Ficha (resumen en vivo)
  const ficha = nodo('aside', 'uc-ficha'); ficha.setAttribute('aria-labelledby', 'uc-ficha-titulo');
  ficha.append(Object.assign(nodo('h3', null, 'Tu ficha'), { id: 'uc-ficha-titulo' }));
  const dl = nodo('dl', 'uc-lista'); dl.setAttribute('aria-live', 'polite');
  ficha.append(dl);
  const error = nodo('p', 'uc-error'); error.setAttribute('role', 'alert'); error.hidden = true;
  const wa = nodo('button', 'uc-whatsapp', 'Enviarla por WhatsApp'); wa.type = 'button';
  const reiniciar = nodo('button', 'ur-reiniciar', 'Empezar de nuevo'); reiniciar.type = 'button';
  ficha.append(error, nodo('p', 'uc-siguiente', 'Cuando termines, sube tus fotos y completa tus datos aquí abajo, y envía tu solicitud.'), wa, reiniciar,
    nodo('p', 'uc-nota', 'Sin compromiso: el taller revisa tu ficha, te cotiza y te confirma el precio final y la fecha antes de empezar.'));
  marco.append(form, ficha);
  raiz.replaceChildren(marco);

  function estadoActual() {
    return { idea: campos.idea.value, tamano: campos.tamano.value, detalles: Object.assign({}, e.detalles), texto: campos.texto.value, colores: campos.colores.value, ocasion: campos.ocasion.value, fecha: campos.fecha.value >= minFecha ? campos.fecha.value : '', tarjeta: campos.tarjeta.value };
  }
  function pintarTamanos() {
    const idea = IDEAS_CREAR.find((x) => x[0] === campos.idea.value);
    const previo = campos.tamano.value;
    campos.tamano.replaceChildren(Object.assign(nodo('option', null, idea ? 'Elige un tamaño' : 'Primero elige qué quieres crear'), { value: '' }));
    campos.tamano.disabled = !idea;
    if (!idea) return;
    TAMANOS_CREAR[idea[2]].forEach((t) => {
      const base = idea[2] === 'Amigurumi' ? precios[t] : null;
      campos.tamano.append(Object.assign(nodo('option', null, t + (base ? ' · precio base ' + pesos(base) : '')), { value: t }));
    });
    if (previo && TAMANOS_CREAR[idea[2]].indexOf(previo) >= 0) campos.tamano.value = previo;
    campos.tamano.classList.toggle('ur-elegido', !!campos.tamano.value);
  }
  function actualizar(cambio) {
    if (cambio === 'idea') {
      pintarTamanos();
      const idea = IDEAS_CREAR.find((x) => x[0] === campos.idea.value);
      campos.texto.placeholder = idea ? idea[3] : 'Cuéntanos a quién o qué quieres crear y cómo es.';
    }
    const f = armarFicha(estadoActual(), precios);
    dl.replaceChildren();
    (f.filas || [['Qué', ''], ['Tamaño', ''], ['Detalles', ''], ['Colores', ''], ['Ocasión y fecha', ''], ['Mensaje de la tarjeta', ''], ['Tu idea', '']]).forEach(([k, v]) => {
      dl.append(nodo('dt', null, k), nodo('dd', v ? null : 'uc-vacio', v || 'Aún sin elegir'));
    });
    error.hidden = true;
    Object.keys(campos).forEach((k) => { const c = campos[k]; if (c && c.removeAttribute) c.removeAttribute('aria-invalid'); });
    if (o.alCambiar) o.alCambiar({ tipo: f.tipo || '', tamano: campos.tamano.value, idea: campos.idea.value });
  }
  function validar() {
    const f = armarFicha(estadoActual(), precios);
    if (!f.falta.length) { error.hidden = true; return f; }
    const msj = { idea: 'Elige qué quieres que tejamos.', tamano: 'Elige un tamaño.', texto: 'Cuéntanos tu idea con unas palabras.' };
    error.textContent = f.falta.map((k) => msj[k]).join(' '); error.hidden = false;
    Object.keys(msj).forEach((k) => { const c = campos[k]; if (c) c.setAttribute('aria-invalid', f.falta.indexOf(k) >= 0 ? 'true' : 'false'); });
    campos[f.falta[0]].focus();
    if (campos[f.falta[0]].scrollIntoView) campos[f.falta[0]].scrollIntoView({ block: 'center' });
    return null;
  }
  function limpiar() {
    Object.keys(e.detalles).forEach((k) => delete e.detalles[k]);
    Object.keys(campos).forEach((k) => {
      const c = campos[k];
      if (c.cb) { c.cb.checked = false; c.tx.value = ''; c.tx.hidden = true; }
      else if (c.tagName === 'SELECT') { c.value = ''; c.classList.remove('ur-elegido'); }
      else { c.value = ''; }
    });
    actualizar('idea');
  }
  function preseleccionar(ideaId) {
    if (!IDEAS_CREAR.some((x) => x[0] === ideaId)) return false;
    campos.idea.value = ideaId; campos.idea.classList.add('ur-elegido'); actualizar('idea'); return true;
  }

  wa.addEventListener('click', () => {
    const f = validar(); if (!f) return;
    evento('crear_whatsapp', { tipo: f.tipo, tamano: f.tamano, n_detalles: Object.keys(e.detalles).length });
    window.open('https://wa.me/' + CONFIG.WHATSAPP + '?text=' + encodeURIComponent(textoWhatsApp(f)), '_blank', 'noopener');
  });
  reiniciar.addEventListener('click', () => { limpiar(); });

  actualizar('idea');
  return {
    ficha: () => armarFicha(estadoActual(), precios),
    validar, preseleccionar, reiniciar: limpiar, estado: estadoActual, evento,
    nDetalles: () => Object.keys(e.detalles).length,
    fijarPrecios(mapa) { precios = mapa || {}; pintarTamanos(); actualizar(); },
  };
}
