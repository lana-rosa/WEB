// Motor de juegos de "Rosina y la gran aventura de la primera cadeneta".
// Tipos de ronda: elegir (detective de puntadas), contar (cuenta y construye), ordenar (pasos en secuencia) y colores (laboratorio de colores).
// Reglas de diseño: sin tiempo, sin vidas, sin puntaje que compare ni sonidos. Un error siempre recibe una pista amable y se puede
// reintentar sin límite; tras dos errores se ofrece ver la respuesta y seguir, para que un juego nunca bloquee a nadie.

import { dibujo } from './dibujos.js';
import { PALETA, POSES_ROSINA } from '../contenido/personajes.js';

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** Mini bosque que cambia de color según lo elegido en el Laboratorio de colores. */
export function miniBosque(c) {
  const hex = (v) => { const q = PALETA.find((x) => x.id === v || x.hex === v); return q ? q.hex : null; };
  const rio = hex(c.rio) || '#D3DAE6', flores = hex(c.flores) || '#CFC9D3', camino = hex(c.camino) || '#DDD5CB';
  return `<svg class="mini-bosque" viewBox="0 0 300 180" role="img" aria-label="Mini bosque con el río de color ${esc(nombreColor(c.rio))}, las flores de color ${esc(nombreColor(c.flores))} y el camino de color ${esc(nombreColor(c.camino))}">
    <rect width="300" height="180" rx="18" fill="#EAF6FF"/><path d="M0,70 Q80,40 160,66 T300,56 V180 H0z" fill="#CBE8D2"/>
    <path d="M-10,104 C60,84 120,124 190,100 C240,84 280,100 310,92" fill="none" stroke="${rio}" stroke-width="30" stroke-linecap="round"/>
    <path d="M60,176 C90,140 50,128 120,108 C180,92 190,70 200,56" fill="none" stroke="${camino}" stroke-width="18" stroke-linecap="round"/>
    <path d="M60,176 C90,140 50,128 120,108 C180,92 190,70 200,56" fill="none" stroke="#fff" stroke-width="2.5" stroke-dasharray="6 8" opacity=".8"/>
    ${[[34, 150], [58, 164], [250, 140], [272, 158]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9" fill="${flores}" stroke="#fff" stroke-width="2"/><circle cx="${x}" cy="${y}" r="3" fill="#FFD23F"/>`).join('')}
  </svg>`;
}
const nombreColor = (id) => { const c = PALETA.find((p) => p.id === id || p.hex === id); return c ? c.nombre : 'sin color todavía'; };

/**
 * Ejecuta un juego dentro de `raiz`.
 * ctx: { ayuda(info), leer(texto), vozOk(), alTerminar(resumen), guardarColores(obj), coloresIniciales }
 */
export function jugar(raiz, juego, ctx) {
  let i = 0;
  let intentos = 0;
  let verRespuesta = false;
  const resumen = { rondas: juego.rondas.length, intentos: [], respuestas: 0, colores: null };
  let secuencia = [];
  let valor = 0;
  let colorSel = {};
  let parteSel = null;

  const ronda = () => juego.rondas[i];

  function pintar() {
    const r = ronda();
    const pose = verRespuesta ? 'idea' : (juego.pose && POSES_ROSINA[juego.pose] ? juego.pose : 'saludo');
    raiz.innerHTML = `
      <div class="juego" data-ronda="${i}">
        <p class="juego-progreso"><span class="punticos" aria-hidden="true">${juego.rondas.map((_, k) => `<i class="${k < i ? 'listo' : k === i ? 'actual' : ''}"></i>`).join('')}</span> Reto ${i + 1} de ${juego.rondas.length}</p>
        <div class="juego-cabeza">
          <img class="juego-rosina" src="${POSES_ROSINA[pose]}" alt="" width="96" height="96">
          <h2 class="juego-pregunta" id="juego-pregunta" tabindex="-1">${esc(r.pregunta)}</h2>
        </div>
        ${r.tipo === 'elegir' ? cuerpoElegir(r) : r.tipo === 'contar' ? cuerpoContar(r) : r.tipo === 'ordenar' ? cuerpoOrdenar(r) : cuerpoColores(r)}
        <div class="retro" role="status" aria-live="polite" id="retro"></div>
        <div class="juego-pie">
          <button type="button" class="btn btn-suave" data-j="ayuda">🤝 Necesito ayuda</button>
          ${ctx.vozOk() ? '<button type="button" class="btn btn-suave" data-j="leer">🔊 Escuchar</button>' : ''}
          <button type="button" class="btn btn-principal" data-j="seguir" hidden>Seguir</button>
        </div>
      </div>`;
    const t = document.getElementById('juego-pregunta');
    if (t && i > 0) t.focus({ preventScroll: false });
  }

  // ---- cuerpos de cada tipo
  function cuerpoElegir(r) {
    return `<div class="opciones ${r.opciones.some((o) => o.dibujo) ? 'opciones-dibujo' : ''}" role="group" aria-labelledby="juego-pregunta">
      ${r.opciones.map((o) => `<button type="button" class="opcion" data-j="elegir" data-id="${esc(o.id)}">${o.dibujo ? `<span class="opcion-dib">${dibujo(o.dibujo)}</span><span class="solo-lectores">${esc(o.alt || '')}</span>` : `<span class="opcion-txt">${esc(o.texto)}</span>`}</button>`).join('')}
    </div>`;
  }
  function cuerpoContar(r) {
    return `<figure class="juego-fig">${dibujo(r.dibujo)}<figcaption class="solo-lectores">${esc(r.alt || '')}</figcaption></figure>
      <div class="contador" role="group" aria-label="Tu respuesta">
        <button type="button" class="btn-redondo" data-j="menos" aria-label="Quitar uno">−</button>
        <output class="contador-valor" id="valor" aria-live="polite" aria-label="Tu respuesta: ${valor}">${valor}</output>
        <button type="button" class="btn-redondo" data-j="mas" aria-label="Sumar uno">+</button>
      </div>
      <div class="centrado"><button type="button" class="btn btn-principal" data-j="comprobar">Comprobar</button></div>`;
  }
  function cuerpoOrdenar(r) {
    const orden = r.mezcla || r.pasos.map((_, k) => k);
    return `<div class="ordenar">
      <ol class="ord-elegidos" id="ord-elegidos" aria-label="Tu orden"></ol>
      <div class="ord-opciones" role="group" aria-label="Pasos para ordenar">
        ${orden.map((k) => `<button type="button" class="opcion opcion-paso" data-j="paso" data-k="${k}">${esc(r.pasos[k])}</button>`).join('')}
      </div>
      <div class="centrado"><button type="button" class="btn btn-suave" data-j="deshacer">↩ Quitar el último</button> <button type="button" class="btn btn-principal" data-j="comprobar" disabled>Comprobar</button></div>
    </div>`;
  }
  function cuerpoColores(r) {
    const c = Object.assign({}, ctx.coloresIniciales || {}, colorSel);
    colorSel = c;
    return `<div class="colores">
      <div class="colores-vista" id="colores-vista">${miniBosque(c)}</div>
      <div class="colores-partes" role="group" aria-label="Partes del bosque">
        ${r.partes.map((p) => `<button type="button" class="chip-parte" data-j="parte" data-id="${p.id}" aria-pressed="${parteSel === p.id}">${esc(p.nombre)}${c[p.id] ? `: ${esc(nombreColor(c[p.id]))}` : ''}</button>`).join('')}
      </div>
      <p class="colores-ayuda" id="colores-ayuda">${parteSel ? 'Ahora elige un color:' : 'Primero toca una parte del bosque.'}</p>
      <div class="paleta" role="group" aria-label="Colores">
        ${PALETA.map((p) => `<button type="button" class="muestra" data-j="color" data-id="${p.id}" style="--c:${p.hex}" aria-label="${esc(p.nombre)}" ${parteSel ? '' : 'disabled'}><span>${esc(p.nombre)}</span></button>`).join('')}
      </div>
      <div class="centrado"><button type="button" class="btn btn-principal" data-j="listo" ${r.partes.every((p) => colorSel[p.id]) ? '' : 'disabled'}>¡Listo!</button></div>
    </div>`;
  }

  // ---- retroalimentación
  const retro = (html, tipo) => { const e = document.getElementById('retro'); if (e) { e.className = `retro ${tipo || ''}`; e.innerHTML = html; } };
  const mostrarSeguir = () => { const b = raiz.querySelector('[data-j="seguir"]'); if (b) { b.hidden = false; b.focus(); } };

  function acierto() {
    const r = ronda();
    resumen.intentos.push(intentos + 1);
    raiz.querySelectorAll('.opcion, [data-j="comprobar"], [data-j="mas"], [data-j="menos"]').forEach((b) => { b.disabled = true; });
    const img = raiz.querySelector('.juego-rosina'); if (img) img.src = POSES_ROSINA.feliz;
    retro(`<strong>${esc(r.bien)}</strong>`, 'bien');
    mostrarSeguir();
  }
  function fallo() {
    const r = ronda();
    intentos++;
    let extra = '';
    if (intentos >= 1) extra += `<br><span class="pista">💡 ${esc(r.pista)}</span>`;
    if (intentos >= 2) extra += '<br><button type="button" class="btn btn-suave" data-j="respuesta">Ver la respuesta</button>';
    retro(`<strong>${esc(r.mal)}</strong>${extra}`, 'mal');
    const img = raiz.querySelector('.juego-rosina'); if (img) img.src = intentos >= 2 ? POSES_ROSINA.fuerza : POSES_ROSINA.consuelo;   // consuelo al primer error; ánimo después
  }
  function mostrarRespuesta() {
    const r = ronda();
    verRespuesta = true; resumen.respuestas++;
    resumen.intentos.push(intentos);
    raiz.querySelectorAll('.opcion, [data-j="comprobar"], [data-j="mas"], [data-j="menos"], [data-j="deshacer"]').forEach((b) => { b.disabled = true; });
    if (r.tipo === 'elegir') raiz.querySelectorAll('.opcion').forEach((b) => { if (b.dataset.id === r.correcta) b.classList.add('es-correcta'); });
    retro(`<strong>Aquí te lo muestro:</strong> ${esc(r.explicacion)} ¡Sigamos juntos!`, 'ayuda');
    mostrarSeguir();
  }

  function siguiente() {
    i++; intentos = 0; verRespuesta = false; secuencia = []; valor = 0; parteSel = null;
    if (i >= juego.rondas.length) {
      raiz.innerHTML = `<div class="juego juego-fin"><img class="juego-rosina grande" src="${POSES_ROSINA.animo}" alt="" width="160" height="160">
        <h2 id="juego-pregunta" tabindex="-1">¡Terminaste ${esc(juego.nombre)}!</h2>
        <p>Completaste ${juego.rondas.length} retos${resumen.respuestas ? ' y viste cómo se resolvían algunos. ¡Así también se aprende!' : '.'}</p>
        <button type="button" class="btn btn-principal" data-j="terminar">Continuar</button></div>`;
      const t = document.getElementById('juego-pregunta'); if (t) t.focus();
      return;
    }
    pintar();
  }

  // ---- eventos
  raiz.onclick = (ev) => {
    const b = ev.target.closest('[data-j]');
    if (!b || b.disabled) return;
    const a = b.dataset.j, r = ronda ? ronda() : null;
    if (a === 'elegir') {
      raiz.querySelectorAll('.opcion').forEach((o) => o.classList.remove('elegida'));
      b.classList.add('elegida');
      if (b.dataset.id === r.correcta) acierto(); else fallo();
    } else if (a === 'mas') { valor = Math.min(valor + 1, r.max || 20); actualizarValor(); }
    else if (a === 'menos') { valor = Math.max(valor - 1, 0); actualizarValor(); }
    else if (a === 'comprobar') {
      if (r.tipo === 'contar') { if (valor === r.correcta) acierto(); else fallo(); }
      else if (r.tipo === 'ordenar') { if (secuencia.every((k, n) => k === n)) acierto(); else fallo(); }
    } else if (a === 'paso') {
      secuencia.push(Number(b.dataset.k)); b.disabled = true; actualizarOrden(r);
    } else if (a === 'deshacer') {
      const k = secuencia.pop(); if (k != null) { const bb = raiz.querySelector(`[data-j="paso"][data-k="${k}"]`); if (bb) bb.disabled = false; actualizarOrden(r); }
    } else if (a === 'respuesta') { mostrarRespuesta(); }
    else if (a === 'seguir') { siguiente(); }
    else if (a === 'terminar') { ctx.alTerminar(resumen); }
    else if (a === 'ayuda') {
      ctx.ayuda({
        pista: r.pista || 'Mira con calma. Puedes intentarlo otra vez cuantas veces quieras.',
        verDeNuevo: () => { pintar(); },
        simple: r.tipo === 'contar' ? 'Cuenta con el dedo, tocando cada V una sola vez, en voz baja.' : r.tipo === 'ordenar' ? 'Piensa en lo que haces primero con tu hilo y tu gancho, y elige ese paso.' : r.tipo === 'colores' ? 'Elige solo una parte y un color. Después sigues con las otras.' : 'Descarta primero lo que sabes que no es, y elige entre lo que queda.',
        adulto: 'Puede leer la pregunta en voz alta, mirar la imagen juntos y dejar que el niño o la niña responda. No hay tiempo ni penalización.',
      });
    } else if (a === 'leer') {
      ctx.leer(r.pregunta + ' ' + (r.tipo === 'elegir' ? r.opciones.map((o) => o.texto || o.alt || '').join('. ') : r.tipo === 'ordenar' ? r.pasos.join('. ') : ''));
    } else if (a === 'parte') {
      parteSel = b.dataset.id; pintarColores(r);
    } else if (a === 'color') {
      if (parteSel) { colorSel[parteSel] = PALETA.find((p) => p.id === b.dataset.id).id; pintarColores(r); }
    } else if (a === 'listo') {
      resumen.colores = Object.assign({}, colorSel); resumen.intentos.push(1);
      ctx.guardarColores(resumen.colores);
      raiz.querySelectorAll('button').forEach((x) => { if (x.dataset.j !== 'ayuda' && x.dataset.j !== 'leer' && x.dataset.j !== 'seguir') x.disabled = true; });
      const img = raiz.querySelector('.juego-rosina'); if (img) img.src = POSES_ROSINA.feliz;
      retro(`<strong>${esc(r.bien)}</strong>`, 'bien'); mostrarSeguir();
    }
  };

  function actualizarValor() {
    const o = document.getElementById('valor');
    if (o) { o.textContent = String(valor); o.setAttribute('aria-label', 'Tu respuesta: ' + valor); }
  }
  function actualizarOrden(r) {
    const ol = document.getElementById('ord-elegidos');
    ol.innerHTML = secuencia.map((k) => `<li>${esc(r.pasos[k])}</li>`).join('');
    const c = raiz.querySelector('[data-j="comprobar"]'); if (c) c.disabled = secuencia.length !== r.pasos.length;
    if (secuencia.length === r.pasos.length) { const retroEl = document.getElementById('retro'); if (retroEl && !retroEl.textContent) retro('Cuando estés listo o lista, toca “Comprobar”.', ''); }
  }
  function pintarColores(r) {
    raiz.querySelector('.juego .colores').outerHTML = cuerpoColores(r);
    const prev = raiz.querySelector('[data-j="color"]:not(:disabled)'); if (!parteSel && prev) prev.focus();
  }

  pintar();
}
