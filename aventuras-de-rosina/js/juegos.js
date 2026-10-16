// Motor de juegos de "Rosina y la gran aventura de la primera cadeneta".
// Tipos de ronda: elegir (detective de puntadas), contar (cuenta y construye), ordenar (pasos en secuencia) y colores (laboratorio de colores).
// Reglas de diseño: sin tiempo, sin vidas, sin puntaje que compare ni sonidos. Un error siempre recibe una pista amable y se puede
// reintentar sin límite; tras dos errores se ofrece ver la respuesta y seguir, para que un juego nunca bloquee a nadie.

import { dibujo } from './dibujos.js?v=21';
import { conNombre } from './nombre.js?v=21';
import { PALETA, POSES_ROSINA } from '../contenido/personajes.js?v=21';

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** Mini bosque que cambia de color según lo elegido en el Laboratorio de colores (río, flores y camino). */
let nBosque = 0;
const mezclar = (hex, con, k) => { // mezcla un color #rrggbb con blanco o negro (k de 0 a 1)
  const n = parseInt(hex.slice(1), 16), t = con === 'b' ? 255 : 0;
  const c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.round(v + (t - v) * k));
  return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
};
export function miniBosque(c) {
  const hex = (v) => { const q = PALETA.find((x) => x.id === v || x.hex === v); return q ? q.hex : null; };
  const rio = hex(c.rio) || '#D3DAE6', flores = hex(c.flores) || '#CFC9D3', camino = hex(c.camino) || '#DDD5CB';
  const id = 'mb' + (++nBosque);
  // una flor: tallo con hojas, 6 pétalos con brillo y centro amarillo
  const flor = (x, y, r, rot) => {
    const petalos = [0, 60, 120, 180, 240, 300].map((a) => `<ellipse cx="0" cy="${-r * 0.62}" rx="${r * 0.42}" ry="${r * 0.62}" transform="rotate(${a + rot})" fill="${flores}" stroke="${mezclar(flores, 'n', 0.28)}" stroke-width="1.1"/>`).join('');
    const brillo = [0, 120, 240].map((a) => `<ellipse cx="0" cy="${-r * 0.78}" rx="${r * 0.15}" ry="${r * 0.28}" transform="rotate(${a + rot})" fill="#fff" opacity=".45"/>`).join('');
    return `<g transform="translate(${x} ${y})"><path d="M0,${r * 0.2} C${r * 0.2},${r * 1.4} ${-r * 0.1},${r * 2.2} 0,${r * 3}" fill="none" stroke="#3E9B63" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M0,${r * 1.9} q${r * 0.9},${-r * 0.5} ${r * 1.2},${-r * 0.1} q${-r * 0.6},${r * 0.7} ${-r * 1.2},${r * 0.1}z" fill="#58B878" stroke="#3E9B63" stroke-width=".8"/>
      <path d="M0,${r * 2.3} q${-r * 0.9},${-r * 0.5} ${-r * 1.1},${-r * 0.1} q${r * 0.6},${r * 0.7} ${r * 1.1},${r * 0.1}z" fill="#58B878" stroke="#3E9B63" stroke-width=".8"/>
      ${petalos}${brillo}<circle r="${r * 0.36}" fill="#FFD23F" stroke="#D9A400" stroke-width="1"/><circle cx="${-r * 0.1}" cy="${-r * 0.1}" r="${r * 0.12}" fill="#FFF3A8"/></g>`;
  };
  const arbol = (x, y, k) => `<g transform="translate(${x} ${y}) scale(${k})"><rect x="-4" y="0" width="8" height="26" rx="3" fill="#A87B4F"/><rect x="-4" y="0" width="3" height="26" rx="1.5" fill="#C99A68"/>
    <circle cx="0" cy="-8" r="19" fill="#6FC38A"/><circle cx="-13" cy="2" r="13" fill="#5DB87C"/><circle cx="13" cy="2" r="13" fill="#5DB87C"/><circle cx="-6" cy="-14" r="9" fill="#8AD6A2" opacity=".8"/>
    ${[[-8, -8], [6, -2], [-14, 4], [12, 6], [0, -18]].map(([a, b]) => `<path d="M${a - 3},${b} q3,-4 6,0" fill="none" stroke="#3E9B63" stroke-width="1.2" opacity=".7"/>`).join('')}</g>`;
  const hierba = (x, y) => `<path d="M${x},${y} q-3,-9 -6,-12 M${x},${y} q0,-10 1,-14 M${x},${y} q3,-8 7,-11" fill="none" stroke="#3E9B63" stroke-width="1.6" stroke-linecap="round"/>`;
  return `<svg class="mini-bosque" viewBox="0 0 320 200" role="img" aria-label="Mini bosque con el río de color ${esc(nombreColor(c.rio))}, las flores de color ${esc(nombreColor(c.flores))} y el camino de color ${esc(nombreColor(c.camino))}">
    <defs>
      <linearGradient id="${id}c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#BFE3FF"/><stop offset="1" stop-color="#F3FAFF"/></linearGradient>
      <linearGradient id="${id}r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${mezclar(rio, 'b', 0.35)}"/><stop offset=".5" stop-color="${rio}"/><stop offset="1" stop-color="${mezclar(rio, 'n', 0.22)}"/></linearGradient>
      <linearGradient id="${id}p" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${mezclar(camino, 'b', 0.3)}"/><stop offset="1" stop-color="${mezclar(camino, 'n', 0.15)}"/></linearGradient>
      <linearGradient id="${id}h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#A9DDB6"/><stop offset="1" stop-color="#78C690"/></linearGradient>
      <clipPath id="${id}k"><rect width="320" height="200" rx="18"/></clipPath>
    </defs>
    <g clip-path="url(#${id}k)">
      <rect width="320" height="200" fill="url(#${id}c)"/>
      <circle cx="262" cy="34" r="22" fill="#FFE98A" opacity=".45"/><circle cx="262" cy="34" r="14" fill="#FFD23F"/>
      <g fill="#fff" opacity=".95"><ellipse cx="62" cy="32" rx="26" ry="9"/><ellipse cx="78" cy="26" rx="16" ry="9"/><ellipse cx="160" cy="46" rx="22" ry="7"/><ellipse cx="172" cy="41" rx="12" ry="7"/></g>
      <path d="M0,92 Q60,58 120,84 T240,72 T320,80 V200 H0z" fill="#A5D9B0"/>
      <path d="M0,104 Q80,76 160,100 T320,92 V200 H0z" fill="url(#${id}h)"/>
      ${arbol(36, 66, 0.9)}${arbol(280, 72, 1)}${arbol(250, 60, 0.7)}
      <path d="M-10,128 C50,104 110,148 180,122 C236,102 280,116 330,106 V160 C280,170 236,150 180,166 C110,190 50,148 -10,172z" fill="#66B77F"/>
      <path d="M-10,132 C50,110 110,152 180,126 C236,106 280,120 330,110 L330,150 C280,160 236,142 180,156 C110,178 50,140 -10,160z" fill="url(#${id}r)"/>
      <path d="M-10,132 C50,110 110,152 180,126 C236,106 280,120 330,110" fill="none" stroke="#fff" stroke-width="2" opacity=".6"/>
      <g fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".7"><path d="M30,136 q10,-4 20,0"/><path d="M100,142 q12,-4 24,0"/><path d="M150,134 q10,-4 20,0"/><path d="M220,128 q10,-4 20,0"/><path d="M270,124 q8,-3 16,0"/><path d="M70,126 q8,-3 14,0"/></g>
      <g fill="#fff" opacity=".85"><circle cx="124" cy="136" r="1.8"/><circle cx="198" cy="130" r="1.6"/><circle cx="48" cy="130" r="1.5"/></g>
      <ellipse cx="14" cy="150" rx="9" ry="5" fill="#B9B3AE"/><ellipse cx="300" cy="118" rx="8" ry="4.5" fill="#C4BEB8"/><ellipse cx="204" cy="162" rx="7" ry="4" fill="#B9B3AE"/>
      <path d="M52,204 C86,168 40,150 118,126 C178,108 200,88 210,66" fill="none" stroke="${mezclar(camino, 'n', 0.25)}" stroke-width="24" stroke-linecap="round" opacity=".55"/>
      <path d="M52,204 C86,168 40,150 118,126 C178,108 200,88 210,66" fill="none" stroke="url(#${id}p)" stroke-width="20" stroke-linecap="round"/>
      <path d="M52,204 C86,168 40,150 118,126 C178,108 200,88 210,66" fill="none" stroke="#fff" stroke-width="2.2" stroke-dasharray="7 9" opacity=".85"/>
      ${hierba(18, 186)}${hierba(100, 176)}${hierba(150, 186)}${hierba(300, 182)}${hierba(224, 192)}
      ${flor(30, 168, 8, 10)}${flor(52, 184, 6.5, 30)}${flor(14, 178, 5.5, 0)}${flor(266, 156, 8.5, 20)}${flor(292, 172, 7, 40)}${flor(240, 176, 6, 5)}${flor(176, 188, 5.5, 25)}
    </g>
  </svg>`;
}
const nombreColor = (id) => { const c = PALETA.find((p) => p.id === id || p.hex === id); return c ? c.nombre : 'sin color todavía'; };

/**
 * Ejecuta un juego dentro de `raiz`.
 * ctx: { ayuda(info), leer(texto), vozOk(), alTerminar(resumen), guardarColores(obj), coloresIniciales }
 */
export function jugar(raiz, juego, ctx) {
  const nombre = () => (ctx.nombre ? ctx.nombre() : '');
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
        <div class="juego-cabeza con-voz">
          ${ctx.vozOk() ? '<button type="button" class="btn-voz" data-j="leer" aria-label="Escuchar en voz alta" title="Escuchar">🔊</button>' : ''}
          <img class="juego-rosina" src="${POSES_ROSINA[pose]}" alt="" width="96" height="96">
          <h2 class="juego-pregunta" id="juego-pregunta" tabindex="-1">${esc(r.pregunta)}</h2>
        </div>
        ${r.tipo === 'elegir' ? cuerpoElegir(r) : r.tipo === 'contar' ? cuerpoContar(r) : r.tipo === 'ordenar' ? cuerpoOrdenar(r) : cuerpoColores(r)}
        <div class="retro" role="status" aria-live="polite" id="retro"></div>
        <div class="juego-pie">
          <button type="button" class="btn btn-suave" data-j="ayuda">🤝 Necesito ayuda</button>
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
      <ol class="ord-elegidos" id="ord-elegidos" aria-label="Tu orden">${r.pasos.map((_, n) => `<li class="vacio">Paso ${n + 1}</li>`).join('')}</ol>
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
    retro(`<strong>${esc(conNombre(r.bien, nombre()))}</strong>`, 'bien');
    mostrarSeguir();
  }
  function fallo() {
    const r = ronda();
    intentos++;
    let extra = '';
    if (intentos >= 1) extra += `<br><span class="pista">💡 ${esc(r.pista)}</span>`;
    if (intentos >= 2) extra += '<br><button type="button" class="btn btn-suave" data-j="respuesta">Ver la respuesta</button>';
    retro(`<strong>${esc(conNombre(r.mal, nombre()))}</strong>${extra}`, 'mal');
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
      retro(`<strong>${esc(conNombre(r.bien, nombre()))}</strong>`, 'bien'); mostrarSeguir();
    }
  };

  function actualizarValor() {
    const o = document.getElementById('valor');
    if (o) { o.textContent = String(valor); o.setAttribute('aria-label', 'Tu respuesta: ' + valor); }
  }
  function actualizarOrden(r) {
    const ol = document.getElementById('ord-elegidos');
    ol.innerHTML = r.pasos.map((_, n) => (n < secuencia.length ? `<li class="lleno">${esc(r.pasos[secuencia[n]])}</li>` : `<li class="vacio">Paso ${n + 1}</li>`)).join('');
    const c = raiz.querySelector('[data-j="comprobar"]'); if (c) c.disabled = secuencia.length !== r.pasos.length;
    if (secuencia.length === r.pasos.length) { const retroEl = document.getElementById('retro'); if (retroEl && !retroEl.textContent) retro('Cuando estés listo o lista, toca “Comprobar”.', ''); }
  }
  function pintarColores(r) {
    raiz.querySelector('.juego .colores').outerHTML = cuerpoColores(r);
    const prev = raiz.querySelector('[data-j="color"]:not(:disabled)'); if (!parteSel && prev) prev.focus();
  }

  pintar();
}
