// "Rosina y la gran aventura de la primera cadeneta" — aplicación principal (navegación por # en una sola página estática).
// Rutas:  #/ (bienvenida) · #/acompanantes · #/preparacion · #/mapa · #/mision/<id>/<etapa>/<n> · #/pasaporte · #/diploma · #/adultos · #/ayuda
// Privacidad: no hay cuentas, ni cookies, ni analítica, ni peticiones a servidores. Todo vive en este navegador (ver estado.js).
// Para cambiar textos o añadir capítulos NO hay que tocar este archivo: ver contenido/misiones.js y herramientas/aventuras-de-rosina/LEEME.md.

import { MISIONES, FUTUROS, LOGROS } from '../contenido/misiones.js?v=22';
import { PERSONAJES, POSES_ROSINA, AMIGOS, PALETA } from '../contenido/personajes.js?v=22';
import { personaje, dibujo, mapaFondo } from './dibujos.js?v=22';
import { jugar, miniBosque } from './juegos.js?v=22';
import * as E from './estado.js?v=22';
import * as voz from './voz.js?v=22';
import * as musica from './musica.js?v=22';
import { pers, sinNombre } from './nombre.js?v=22';

// Título del libro (Libro 1 de «Rosina y el Bosque Tejido», que es el nombre del mundo y del mapa).
const TITULO_LIBRO = 'Rosina y la gran aventura de la primera cadeneta';

const app = document.getElementById('app');
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const publicadas = () => MISIONES.filter((m) => m.publicada);
const porId = (id) => MISIONES.find((m) => m.id === id && m.publicada);
const hechas = () => publicadas().filter((m) => E.misionCompletada(m.id)).length;
const todasHechas = () => publicadas().length > 0 && hechas() === publicadas().length;

// Evento local para que el equipo conecte medición agregada más adelante. No hace ninguna petición de red (ver METRICAS en la documentación).
const emitir = (nombre, datos) => { try { window.dispatchEvent(new CustomEvent('aventura:evento', { detail: Object.assign({ nombre }, datos || {}) })); } catch (e) { /* sin soporte */ } };

const tej = () => { const t = E.obtener().trato; return t === 'tejedora' ? 'tejedora' : t === 'tejedor' ? 'tejedor' : 'tejedor o tejedora'; };
const miNombre = () => E.obtener().apodo || '';
const saludoNombre = () => { const a = E.obtener().apodo; return a ? `, ${esc(a)}` : ''; };

// ---------------------------------------------------------------- avisos (logros) y ayuda
let toastT = null;
function avisar(texto) {
  const t = document.getElementById('toast');
  t.textContent = texto; t.hidden = false;
  clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 5000);
}
function darLogro(id) {
  const nuevo = E.logro(id);
  if (nuevo && LOGROS[id]) { avisar(`¡Nuevo logro! ${LOGROS[id].icono} ${LOGROS[id].nombre}`); emitir('logro', { id }); }
  return nuevo ? id : null;
}

const dlgAyuda = document.getElementById('dlg-ayuda');
const dlgConfirmar = document.getElementById('dlg-confirmar');
// Navegadores viejos sin <dialog>: se abre y se cierra con el atributo «open» (el CSS lo centra).
[dlgAyuda, dlgConfirmar].forEach((d) => { if (d && typeof d.showModal !== 'function') { d.showModal = () => d.setAttribute('open', ''); d.close = () => d.removeAttribute('open'); } });
let ayudaCtx = null;

function abrirAyuda(info) {
  ayudaCtx = info;
  document.getElementById('ayuda-resp').textContent = '';
  if (!dlgAyuda.open) dlgAyuda.showModal();
  darLogro('pide-ayuda');
  emitir('ayuda_abierta');
}
dlgAyuda.addEventListener('click', (ev) => {
  if (ev.target === dlgAyuda) { dlgAyuda.close(); return; }
  const b = ev.target.closest('[data-ayuda]');
  if (!b || !ayudaCtx) return;
  const resp = document.getElementById('ayuda-resp');
  const a = b.dataset.ayuda;
  if (a === 'cerrar') dlgAyuda.close();
  else if (a === 'repetir') { dlgAyuda.close(); if (ayudaCtx.verDeNuevo) ayudaCtx.verDeNuevo(); emitir('tutorial_repetido'); }
  else if (a === 'pista') resp.innerHTML = `<strong>💡 Pista:</strong> ${esc(ayudaCtx.pista || 'Mira con calma y vuelve a intentarlo. No hay prisa.')}`;
  else if (a === 'simple') resp.innerHTML = `<strong>🧩 Algo más sencillo:</strong> ${esc(ayudaCtx.simple || 'Practica solo una parte pequeña y descansa un momento.')}`;
  else if (a === 'adulto') resp.innerHTML = `<strong>🙋 Pide ayuda a una persona adulta.</strong> Muéstrale esta pantalla y dile con tus palabras en qué necesitas ayuda.<br><span class="para-adulto"><strong>Para quien acompaña:</strong> ${esc(ayudaCtx.adulto || 'Mire la pantalla junto al niño o la niña y ayúdele sin hacerlo por él o ella.')}</span>`;
});

// ---------------------------------------------------------------- voz (opcional)
let vozListo = false;
const vozOk = () => vozListo;
// Botón de escuchar: un icono en la esquina de arriba a la derecha del texto (no después del texto).
const botonVoz = () => (vozListo ? '<button type="button" class="btn-voz" data-accion="leer" aria-label="Escuchar en voz alta" title="Escuchar">🔊</button>' : '');

// ---------------------------------------------------------------- piezas comunes
const fig = (def, alt) => `<figure class="paso-fig"><div class="paso-dib">${dibujo(def)}</div><figcaption class="paso-alt">${esc(alt)} <span class="provisional">Dibujo de ayuda (provisional)</span></figcaption></figure>`;
// Rosina en las escenas del libro: los stickers oficiales (varias poses). alt '' la marca como decorativa.
const ALT_ROSINA = {
  salto: 'Rosina salta de alegría entre confeti.', beso: 'Rosina guiña un ojo y sopla un beso.', sueno: 'Rosina bosteza con sueño, envuelta en una cobija.',
  corriendo: 'Rosina corre contenta.', aplaude: 'Rosina aplaude emocionada, con estrellitas en los ojos.',
  saludo: 'Rosina, la ovejita guía de Lana Rosa, saluda con la patita.',
  feliz: 'Rosina sonríe feliz con las manitas arriba.',
  idea: 'Rosina tiene una idea: una bombilla brilla sobre su cabeza.',
  leyendo: 'Rosina lee un libro rosado.',
  corazon: 'Rosina sentada abraza un corazón rosado.',
  sentada: 'Rosina sentada abraza un ovillo en forma de corazón.',
  cartel: 'Rosina asoma detrás de un cartel rosado.',
  animo: 'Rosina guiña un ojo y levanta el pulgar para animarte.',
  abrazo: 'Rosina sentada abraza un ovillo en forma de corazón.',
  ovillo: 'Rosina sostiene un ovillo en forma de corazón.',
  saludoSentada: 'Rosina señala con la patita.',
  flor: 'Rosina sostiene una flor.',
  gorro: 'Rosina lleva un gorro rosado y se sostiene las mejillas.',
  tejiendo: 'Rosina sentada abraza un ovillo en forma de corazón.',
  gancho: 'Rosina sostiene un ovillo en forma de corazón.',
  contando: 'Rosina piensa con una patita en la barbilla.',
  senalando: 'Rosina señala hacia un lado.',
  fuerza: 'Rosina está orgullosa, con las manos en la cintura.',
  sorpresa: 'Rosina se sorprende con las manos en las mejillas.',
  consuelo: 'Rosina te consuela con una carita tierna.',
  mapa: 'Rosina, la ovejita guía, saluda con la patita.',
  diploma: 'Rosina está orgullosa, con las manos en la cintura.',
  lupa: 'Rosina piensa con una patita en la barbilla.',
};
const imgRosina = (pose, alt, clase = 'rosina-img', tam = 220) =>
  `<img class="${clase} sticker-r" src="${POSES_ROSINA[pose] || POSES_ROSINA.saludo}" alt="${alt === '' ? '' : esc(ALT_ROSINA[pose] || ALT_ROSINA.saludo)}" width="512" height="512" style="--w:${tam}px" decoding="async">`;
const rutaMision = (id, etapa, n) => `#/mision/${id}/${etapa}${n != null ? '/' + n : ''}`;

function etapasDe(m) {
  const l = [{ k: 'historia', t: 'Historia' }, { k: 'tutorial', t: 'Aprende' }, { k: 'practica', t: 'Practica' }, { k: 'juego', t: 'Juega' }];
  if (m.id === 'm1') l.push({ k: 'pasaporte', t: 'Pasaporte' });
  l.push({ k: 'reflexion', t: 'Reflexiona' }, { k: 'fin', t: '¡Listo!' });
  return l;
}
const siguienteEtapa = (m, k) => { const l = etapasDe(m); const i = l.findIndex((e) => e.k === k); return l[i + 1] ? l[i + 1].k : 'fin'; };
const hechaEtapa = (m, k) => k === 'fin' ? E.misionCompletada(m.id) : !!E.obtener().misiones[m.id] && !!E.obtener().misiones[m.id].etapas[k];

function navEtapas(m, actual) {
  return `<nav class="etapas" aria-label="Etapas de la misión ${m.numero}"><ol>${etapasDe(m).map((e) => {
    const h = hechaEtapa(m, e.k);
    return `<li><a href="${rutaMision(m.id, e.k, e.k === 'tutorial' ? 0 : 1)}" ${e.k === actual ? 'aria-current="step"' : ''} class="${h ? 'hecha' : ''}"><span class="etapa-marca" aria-hidden="true">${h ? '✓' : ''}</span>${e.t}${h ? '<span class="solo-lectores"> (hecha)</span>' : ''}</a></li>`;
  }).join('')}</ol></nav>`;
}

const cabeceraMision = (m) => `<p class="mision-sup"><a href="#/mapa">← Mapa</a> · Misión ${m.numero}: ${esc(m.titulo)}</p>`;

// ---------------------------------------------------------------- pantallas
function bienvenida() {
  const e = E.obtener();
  const hay = publicadas().some((m) => e.misiones[m.id]) || e.logros.length > 0;
  return {
    titulo: TITULO_LIBRO,
    html: `<section class="pantalla bienvenida">
      ${imgRosina('saludo', 'x', 'heroe-rosina', 210)}
      <h1>${TITULO_LIBRO}</h1>
      <p class="subtitulo">Pequeñas puntadas, grandes aventuras</p>
      <div class="burbuja"><p>¡Hola, ${tej()}! Soy Rosina. En mi bosque han desaparecido algunos colores y necesito una persona creativa que me ayude a recuperarlos. ¿Te gustaría vivir esta aventura conmigo?</p></div>
      <div class="acciones">
        <button type="button" class="btn btn-principal btn-grande" data-ir="acompanantes" data-logro="primer-paso" data-evento="aventura_iniciada">¡Comenzar aventura!</button>
        ${hay ? `<button type="button" class="btn btn-suave btn-grande" data-ir="${esc((e.ultima || 'mapa').replace(/^#?\/?/, ''))}">Continuar mi aventura</button>` : ''}
      </div>
      <p class="nota">Para niños de 6 a 8 años, con una persona adulta cerca. <a href="#/adultos">Guía para adultos</a></p>
    </section>`,
  };
}

function acompanantes() {
  return {
    titulo: 'Para quien acompaña',
    html: `<section class="pantalla">
      <h1>Para quien acompaña</h1>
      <div class="tarjeta">
        <p>Esta es una aventura para aprender crochet con las manos. La pantalla cuenta la historia y explica; <strong>el aprendizaje ocurre cuando el niño o la niña teje con lana y gancho de verdad.</strong></p>
        <ul class="lista-simple">
          <li><strong>Esté cerca</strong>, sobre todo en el nudo inicial y las primeras puntadas.</li>
          <li><strong>No hay tiempo ni puntajes.</strong> Cada quien avanza a su ritmo y puede repetir todo.</li>
          <li><strong>Materiales sugeridos:</strong> lana suave, gruesa y clara, y un gancho de 5 a 6 mm.</li>
          <li><strong>Privacidad:</strong> no pedimos cuenta ni datos personales. El progreso se guarda solo en este navegador.</li>
        </ul>
        <p class="nota">Esta actividad no es un juguete certificado ni promete resultados educativos o terapéuticos.</p>
      </div>
      <div class="acciones">
        <button type="button" class="btn btn-principal btn-grande" data-ir="preparacion" data-accion="adulto-visto">Entendido, continuar</button>
        <button type="button" class="btn btn-suave" data-ir="adultos">Ver la guía completa para adultos</button>
      </div>
    </section>`,
  };
}

function preparacion() {
  return {
    titulo: 'Prepara tu aventura',
    html: `<section class="pantalla">
      ${imgRosina('gancho', 'Rosina muestra su gancho de crochet y un ovillo de lana.', 'rosina-lado', 150)}
      <h1>Prepara tu aventura</h1>
      <p class="intro">Antes de entrar al bosque, revisa estas cosas. Si todavía no tienes algo, ¡no pasa nada! Puedes empezar con la historia.</p>
      <ul class="checks">
        <li><label><input type="checkbox"> <span>Hay una persona adulta cerca de mí</span></label></li>
        <li><label><input type="checkbox"> <span>Estoy en un lugar cómodo y con buena luz</span></label></li>
        <li><label><input type="checkbox"> <span>Tengo lana y un gancho (o los voy a conseguir)</span></label></li>
      </ul>
      <div class="acciones"><button type="button" class="btn btn-principal btn-grande" data-ir="mapa">Ir al mapa</button></div>
    </section>`,
  };
}

function estadoMision(m) {
  if (E.misionCompletada(m.id)) return 'completada';
  const mm = E.obtener().misiones[m.id];
  return mm && Object.keys(mm.etapas).length ? 'en-curso' : 'nueva';
}
const textoEstado = { completada: 'Completada', 'en-curso': 'En curso', nueva: 'Por empezar' };

function mapa() {
  const e = E.obtener();
  const c1 = e.colores.m1 || {};
  const colores = {
    flores: E.misionCompletada('m1') ? (c1.flores ? PALETA.find((p) => p.id === c1.flores).hex : '#ff66c4') : null,
    rio: E.misionCompletada('m2') ? (c1.rio ? PALETA.find((p) => p.id === c1.rio).hex : '#6DB6F2') : null,
    camino: E.misionCompletada('m3') ? (c1.camino ? PALETA.find((p) => p.id === c1.camino).hex : '#FFD23F') : null,
  };
  const pos = { m1: [24, 83], m2: [60, 56], m3: [38, 25] };
  const siguiente = publicadas().find((m) => !E.misionCompletada(m.id));
  const actualId = (e.ultima.match(/mision\/(m\d)/) || [])[1] || (siguiente && siguiente.id);
  const nodos = publicadas().map((m) => {
    const est = estadoMision(m);
    const [x, y] = pos[m.id] || [50, 50];
    const aqui = m.id === actualId;
    return `<a class="nodo nodo-${est}${aqui ? ' nodo-aqui' : ''}" style="left:${x}%;top:${y}%" href="${rutaMision(m.id, 'historia', 1)}" aria-label="Misión ${m.numero}: ${esc(m.titulo)}. ${textoEstado[est]}${aqui ? '. Estás aquí' : ''}">
      <span class="nodo-n" aria-hidden="true">${est === 'completada' ? '✓' : m.numero}</span>${aqui ? `<img class="nodo-rosina" src="${POSES_ROSINA.saludo}" alt="" width="64" height="64">` : ''}
    </a>`;
  }).join('');
  const lista = publicadas().map((m) => {
    const est = estadoMision(m);
    return `<li class="mision-item mision-${est}"><a href="${rutaMision(m.id, 'historia', 1)}">
      <span class="mision-num" aria-hidden="true">${est === 'completada' ? '✓' : m.numero}</span>
      <span class="mision-txt"><strong>${esc(m.titulo)}</strong><span>${esc(m.resumen)}</span></span>
      <span class="mision-est">${textoEstado[est]}</span></a></li>`;
  }).join('');
  return {
    titulo: 'Mapa del Bosque Tejido',
    html: `<section class="pantalla pantalla-mapa">
      ${imgRosina('mapa', 'Rosina exploradora lleva una mochila y un mapa enrollado.', 'rosina-lado', 130)}
      <h1>El mapa del Bosque Tejido</h1>
      <p class="intro">${hechas() ? `¡Vas recuperando los colores${saludoNombre()}!` : 'Toca un lugar para empezar a recuperar los colores.'} ${siguiente ? `Te recomendamos la misión ${siguiente.numero}, pero puedes ir a la que quieras.` : '¡Completaste las 3 primeras misiones!'}</p>
      <div class="mapa">${mapaFondo(colores)}${nodos}</div>
      <ul class="misiones" aria-label="Misiones">${lista}</ul>
      <div class="proximamente"><h2>Muy pronto</h2><p>Hay ${FUTUROS.length} misiones más en camino: ${FUTUROS.map((f) => esc(f.titulo)).join(', ')}.</p></div>
      <div class="acciones">
        <a class="btn btn-suave" href="#/pasaporte">📒 Mi pasaporte y logros (${e.logros.length} de ${Object.keys(LOGROS).length})</a>
        ${todasHechas() ? '<a class="btn btn-principal" href="#/diploma">🎓 Ver mi diploma</a>' : ''}
      </div>
    </section>`,
  };
}

// ---- misiones
function vistaHistoria(m, n) {
  const pags = m.historia;
  n = Math.min(Math.max(n || 1, 1), pags.length);
  const p = pags[n - 1];
  const ultima = n === pags.length;
  let arte;
  if (p.quien === 'amigos') arte = `<div class="equipo">${['rosina'].concat(AMIGOS).map((a) => `<figure>${a === 'rosina' ? imgRosina('saludo', '', 'sticker-equipo', 130) : personaje(a, 'saludo')}<figcaption>${PERSONAJES[a].nombre}</figcaption></figure>`).join('')}</div>`;
  else if (p.quien === 'rosina') arte = imgRosina(p.pose || 'saludo', `Rosina, la ovejita guía, en la pose “${p.pose || 'saludo'}”.`, 'rosina-img', 220);
  else arte = `<figure class="solo-personaje">${personaje(p.quien, p.pose || 'saludo')}<figcaption class="solo-lectores">${PERSONAJES[p.quien].nombre}, ${PERSONAJES[p.quien].especie}</figcaption></figure>`;
  const quien = p.quien === 'amigos' ? 'Rosina' : PERSONAJES[p.quien].nombre;
  return {
    titulo: `${m.titulo} · Historia`,
    voz: sinNombre(p.texto),
    html: `<section class="pantalla">${cabeceraMision(m)}${navEtapas(m, 'historia')}
      <h1 class="h1-mision">${n === 1 ? esc(m.titulo) : 'Historia'}</h1>
      ${escenaHtml(p.escena)}
      <div class="historia">
        <div class="historia-arte">${arte}</div>
        <div class="burbuja con-voz">${botonVoz()}<p class="burbuja-quien">${esc(quien)} dice:</p><p>${esc(pers(p.texto, miNombre()))}</p></div>
      </div>
      <p class="progreso-txt" aria-live="polite">Parte ${n} de ${pags.length}</p>
      <div class="acciones">
        ${n > 1 ? `<a class="btn btn-suave" href="${rutaMision(m.id, 'historia', n - 1)}">← Antes</a>` : ''}
        ${ultima ? `<a class="btn btn-principal btn-grande" href="${rutaMision(m.id, 'tutorial', 0)}" data-marca="historia">¡A aprender!</a>` : `<a class="btn btn-principal btn-grande" href="${rutaMision(m.id, 'historia', n + 1)}">Siguiente →</a>`}
      </div>
    </section>`,
  };
}

/** Ilustración de escena opcional (16:9): { src, alt }. */
const escenaHtml = (e) => (e ? `<figure class="escena"><img src="${esc(e.src)}" alt="${esc(e.alt)}" width="1200" height="${e.alto || 675}" loading="lazy" decoding="async"></figure>` : '');

function vistaTutorial(m, n) {
  const t = m.tutorial, pasos = t.pasos;
  n = Math.min(Math.max(n || 0, 0), pasos.length);
  if (n === 0) {
    return {
      titulo: `${m.titulo} · Aprende`,
      voz: `${t.objetivo}`,
      html: `<section class="pantalla">${cabeceraMision(m)}${navEtapas(m, 'tutorial')}
        <h1>Vamos a aprender</h1>
        ${escenaHtml(t.escena)}
        <div class="tarjeta con-voz">${botonVoz()}<h2>Lo que vas a lograr</h2><p>${esc(t.objetivo)}</p>
          <h2>Lo que necesitas</h2><ul class="lista-simple">${t.materiales.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
        <p class="progreso-txt">${pasos.length} pasos cortos</p>
        <div class="acciones"><a class="btn btn-principal btn-grande" href="${rutaMision(m.id, 'tutorial', 1)}">Empezar el paso 1 →</a></div>
      </section>`,
    };
  }
  const p = pasos[n - 1];
  const ultimo = n === pasos.length;
  const video = p.video ? `<video class="paso-video" controls preload="none" ${p.video.poster ? `poster="${esc(p.video.poster)}"` : ''}><source src="${esc(p.video.src)}">${p.video.subtitulos ? `<track kind="captions" srclang="es" label="Español" src="${esc(p.video.subtitulos)}" default>` : ''}</video><div class="video-vel" role="group" aria-label="Velocidad del video"><span>Velocidad:</span>${[['0.5','🐢 Lento'],['0.75','Despacio'],['1','Normal']].map(([v, t]) => `<button type="button" class="btn-vel" data-vel="${v}" aria-pressed="${v === '1'}">${t}</button>`).join('')}</div>` : '';
  return {
    titulo: `${m.titulo} · Paso ${n}`,
    voz: `${p.titulo}. ${p.texto} ${(p.lista || []).join('. ')}`,
    verDeNuevo: true,
    ayuda: { pista: p.pista, simple: p.simple, adulto: p.adulto },
    html: `<section class="pantalla">${cabeceraMision(m)}${navEtapas(m, 'tutorial')}
      <p class="progreso-txt" aria-live="polite">Paso ${n} de ${pasos.length}</p>
      <div class="barra" role="presentation"><span style="width:${(n / pasos.length) * 100}%"></span></div>
      <h1>${esc(p.titulo)}</h1>
      ${escenaHtml(p.escena)}
      ${video || fig(p.dibujo, p.alt)}
      <div class="tarjeta paso-texto con-voz">${botonVoz()}<p>${esc(p.texto)}</p>${p.lista ? `<ul class="lista-simple">${p.lista.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}</div>
      <div class="acciones acciones-paso">
        <a class="btn btn-suave" href="${n > 1 ? rutaMision(m.id, 'tutorial', n - 1) : rutaMision(m.id, 'tutorial', 0)}">← Paso anterior</a>
        <button type="button" class="btn btn-suave" data-accion="repetir">🔁 Ver de nuevo</button>
        <button type="button" class="btn btn-suave" data-accion="ayuda">🤝 Necesito ayuda</button>
        ${ultimo ? `<a class="btn btn-principal btn-grande" href="${rutaMision(m.id, 'practica', 1)}" data-marca="tutorial">¡Vamos a practicar!</a>` : `<a class="btn btn-principal btn-grande" href="${rutaMision(m.id, 'tutorial', n + 1)}">Siguiente paso →</a>`}
      </div>
    </section>`,
  };
}

function vistaPractica(m) {
  const p = m.practica;
  const v = (E.obtener().misiones[m.id] || { etapas: {} }).etapas.practica;
  return {
    titulo: `${m.titulo} · Practica`,
    voz: `${p.titulo}. ${p.intro} ${p.reto}`,
    ayuda: { pista: 'Hazlo despacio y una parte a la vez. Puedes volver al tutorial cuando quieras.', simple: 'Haz solo el primer paso de la lista y descansa. Mañana sigues.', adulto: p.adulto },
    html: `<section class="pantalla">${cabeceraMision(m)}${navEtapas(m, 'practica')}
      ${imgRosina('tejiendo', 'Rosina teje una cadeneta con su gancho y lana rosada.', 'rosina-lado', 150)}
      <h1>${esc(p.titulo)}</h1>
      <p class="intro con-voz">${botonVoz()}${esc(p.intro)}</p>
      <ul class="checks">${p.lista.map((x) => `<li><label><input type="checkbox"> <span>${esc(x)}</span></label></li>`).join('')}</ul>
      ${p.descanso ? `<p class="descanso"><span aria-hidden="true">🌙</span> ${esc(p.descanso)}</p>` : ''}
      <div class="tarjeta reto"><h2>Tu reto con hilo real</h2><p>${esc(p.reto)}</p></div>
      <div class="tarjeta para-adulto-caja"><p><strong>Para quien acompaña:</strong> ${esc(p.adulto)}</p></div>
      <div id="practica-resp" class="retro ${v ? 'bien' : ''}" role="status" aria-live="polite">${v === 'hecho' ? '¡Qué bien! Practicaste con tu hilo real.' : v === 'despues' ? esc(p.sinMateriales) : ''}</div>
      <div class="acciones">
        <button type="button" class="btn btn-principal" data-accion="practica-hecha">✓ Lo hice con mi lana</button>
        <button type="button" class="btn btn-suave" data-accion="practica-despues">Lo intentaré después</button>
        <button type="button" class="btn btn-suave" data-accion="ayuda">🤝 Necesito ayuda</button>
      </div>
      <div class="acciones"><a class="btn btn-principal btn-grande" id="ir-juego" href="${rutaMision(m.id, 'juego', 1)}" ${v ? '' : 'hidden'}>Ir al juego →</a></div>
    </section>`,
  };
}

function vistaJuego(m) {
  const j = m.juego;
  return {
    titulo: `${m.titulo} · Juego`,
    voz: `${j.nombre}. ${j.intro}`,
    html: `<section class="pantalla">${cabeceraMision(m)}${navEtapas(m, 'juego')}
      <h1>${esc(j.nombre)}</h1>
      <div id="zona-juego"><div class="tarjeta con-voz">${botonVoz()}<p class="intro">${esc(j.intro)}</p><p class="nota">Juego tipo “${esc(j.tipo)}”: sin tiempo y sin vidas. Puedes pedir ayuda cuando quieras.</p>
      <div class="acciones"><button type="button" class="btn btn-principal btn-grande" data-accion="iniciar-juego">¡Empezar!</button></div></div></div>
    </section>`,
    montar: () => {
      document.querySelector('[data-accion="iniciar-juego"]').addEventListener('click', () => {
        emitir('juego_iniciado', { mision: m.id });
        jugar(document.getElementById('zona-juego'), j, {
          ayuda: (info) => abrirAyuda(info),
          leer: (t) => { if (!E.obtener().prefs.voz) E.cambiar((s) => { s.prefs.voz = true; }); voz.leer(t); },
          vozOk,
          nombre: miNombre,
          coloresIniciales: (E.obtener().colores[m.id] || {}),
          guardarColores: (c) => E.cambiar((e) => { e.colores[m.id] = c; }),
          alTerminar: () => {
            E.marcarEtapa(m.id, 'juego', true);
            if (m.logros && m.logros.juego) darLogro(m.logros.juego);
            if (m.id === 'm1') darLogro('mochila');
            emitir('juego_terminado', { mision: m.id });
            ir(rutaMision(m.id, siguienteEtapa(m, 'juego'), 1));
          },
        });
      });
    },
  };
}

function vistaPasaporteMision(m) {
  const e = E.obtener();
  return {
    titulo: `${m.titulo} · Tu pasaporte`,
    voz: 'Crea tu pasaporte de tejedor. Escribe un nombre o apodo, elige tu color favorito y un amigo del bosque.',
    html: `<section class="pantalla">${cabeceraMision(m)}${navEtapas(m, 'pasaporte')}
      ${imgRosina('cartel', 'Rosina asoma detrás de un cartel rosado.', 'rosina-lado', 150)}
      <h1>Crea tu pasaporte de ${tej()}</h1>
      <form class="tarjeta formulario" id="form-pasaporte" autocomplete="off">
        <p class="nota">Todo lo que escribas aquí se queda solo en este dispositivo. Usa solo un nombre o un apodo; no escribas apellidos, colegio ni datos de contacto.</p>
        <label for="apodo">¿Cómo quieres que te llame en el bosque? <span class="opcional">(opcional)</span></label>
        <input id="apodo" name="apodo" maxlength="20" value="${esc(e.apodo)}" placeholder="Un nombre o un apodo">
        <fieldset><legend>¿Cómo prefieres que te digamos?</legend>
          <div class="radios">
            ${[['tejedor', 'Tejedor'], ['tejedora', 'Tejedora'], ['', 'Solo mi nombre']].map(([v, t]) => `<label class="radio"><input type="radio" name="trato" value="${v}" ${e.trato === v ? 'checked' : ''}><span>${t}</span></label>`).join('')}
          </div>
        </fieldset>
        <fieldset><legend>Tu color favorito</legend>
          <div class="paleta">${PALETA.map((p) => `<label class="muestra"><input type="radio" name="color" value="${p.id}" ${e.color === p.id ? 'checked' : ''}><span style="--c:${p.hex}">${esc(p.nombre)}</span></label>`).join('')}</div>
        </fieldset>
        <fieldset><legend>Tu amigo del bosque</legend>
          <div class="amigos amigos-elegir">${AMIGOS.map((a) => `<label class="amigo-op"><input type="radio" name="amigo" value="${a}" ${e.amigo === a ? 'checked' : ''}><span>${personaje(a)}<b>${PERSONAJES[a].nombre}</b></span></label>`).join('')}</div>
        </fieldset>
        <div class="acciones"><button type="submit" class="btn btn-principal btn-grande">Guardar mi pasaporte</button></div>
      </form>
    </section>`,
    montar: () => {
      document.getElementById('form-pasaporte').addEventListener('submit', (ev) => {
        ev.preventDefault();
        const f = new FormData(ev.target);
        E.cambiar((s) => {
          s.apodo = String(f.get('apodo') || '').replace(/[<>]/g, '').trim().slice(0, 20);
          s.trato = String(f.get('trato') || '');
          s.color = String(f.get('color') || '');
          s.amigo = String(f.get('amigo') || '');
        });
        E.marcarEtapa(m.id, 'pasaporte', true);
        darLogro('pasaporte');
        ir(rutaMision(m.id, siguienteEtapa(m, 'pasaporte'), 1));
      });
    },
  };
}

function vistaReflexion(m) {
  const r = m.reflexion;
  const previa = E.obtener().reflexiones[m.id];
  return {
    titulo: `${m.titulo} · Reflexiona`,
    voz: r.pregunta,
    html: `<section class="pantalla">${cabeceraMision(m)}${navEtapas(m, 'reflexion')}
      ${imgRosina('corazon', 'Rosina sonríe con un corazón rosado.', 'rosina-lado', 150)}
      <h1>Un momento para pensar</h1>
      <div class="con-voz">${botonVoz()}<p class="intro" id="reflexion-q">${esc(r.pregunta)}</p></div>
      <div class="opciones opciones-reflexion" role="group" aria-labelledby="reflexion-q">
        ${r.opciones.map((o) => `<button type="button" class="opcion ${previa === o.id ? 'elegida' : ''}" data-accion="reflexion" data-id="${esc(o.id)}" aria-pressed="${previa === o.id}"><span class="opcion-txt">${esc(o.texto)}</span></button>`).join('')}
      </div>
      <div id="reflexion-resp" class="retro ${previa ? 'bien' : ''}" role="status" aria-live="polite">${previa ? esc(r.respuesta) : ''}</div>
      <p class="nota">No hay respuestas buenas ni malas. Lo que elijas se guarda solo en este dispositivo.</p>
      <div class="acciones"><a class="btn btn-principal btn-grande" href="${rutaMision(m.id, 'fin', 1)}" id="ir-fin">${previa ? 'Continuar →' : 'Continuar sin elegir →'}</a></div>
    </section>`,
  };
}

let nuevosLogros = [];
function vistaFin(m) {
  const e = E.obtener();
  const faltan = [['historia', 'la historia'], ['tutorial', 'el tutorial'], ['practica', 'la práctica'], ['juego', 'el juego']].filter(([k]) => !hechaEtapa(m, k));
  if (faltan.length && !E.misionCompletada(m.id)) {
    return {
      titulo: `${m.titulo} · Casi listo`,
      html: `<section class="pantalla">${cabeceraMision(m)}${navEtapas(m, 'fin')}
        ${imgRosina('idea', 'Rosina tiene una idea.', 'rosina-lado', 150)}
        <h1>¡Casi lo logras!</h1>
        <p class="intro">Para terminar esta misión todavía puedes visitar: ${faltan.map(([k, t]) => `<a href="${rutaMision(m.id, k, k === 'tutorial' ? 0 : 1)}">${t}</a>`).join(', ')}. Hazlo a tu ritmo.</p>
        <div class="acciones"><a class="btn btn-suave" href="#/mapa">Volver al mapa</a></div></section>`,
    };
  }
  if (!E.misionCompletada(m.id)) {
    E.completar(m.id);
    nuevosLogros = [];
    const l1 = darLogro(m.logros.mision); if (l1) nuevosLogros.push(l1);
    if (todasHechas()) { const l2 = darLogro('tejedor-bosque'); if (l2) nuevosLogros.push(l2); }
    emitir('mision_completada', { mision: m.id });
  }
  const sig = publicadas().find((x) => !E.misionCompletada(x.id));
  const ganados = nuevosLogros.length ? nuevosLogros : [];
  return {
    titulo: `${m.titulo} · ¡Misión completada!`,
    voz: sinNombre(m.fin.texto),
    html: `<section class="pantalla fin">${cabeceraMision(m)}
      ${imgRosina(m.fin.pose || 'feliz', 'x', 'heroe-rosina', 210)}
      <h1>¡Misión completada!</h1>
      <div class="burbuja"><p>${esc(pers(m.fin.texto, miNombre()))}</p></div>
      ${ganados.length ? `<div class="logros-nuevos"><h2>Logros nuevos</h2><ul>${ganados.map((id) => `<li><span aria-hidden="true">${LOGROS[id].icono}</span> <strong>${esc(LOGROS[id].nombre)}</strong> — ${esc(LOGROS[id].texto)}</li>`).join('')}</ul></div>` : ''}
      <div class="acciones">
        ${sig ? `<a class="btn btn-principal btn-grande" href="#/mapa">Volver al mapa</a><a class="btn btn-suave" href="${rutaMision(sig.id, 'historia', 1)}">Ir a la misión ${sig.numero}</a>` : `<a class="btn btn-principal btn-grande" href="#/diploma">🎓 Ver mi diploma</a><a class="btn btn-suave" href="#/mapa">Volver al mapa</a>`}
        <a class="btn btn-suave" href="#/pasaporte">📒 Mi pasaporte</a>
      </div>
    </section>`,
  };
}

function vistaMision(id, etapa, n) {
  const m = porId(id);
  if (!m) return noEncontrada();
  switch (etapa) {
    case 'tutorial': return vistaTutorial(m, n);
    case 'practica': return vistaPractica(m);
    case 'juego': return vistaJuego(m);
    case 'pasaporte': return m.id === 'm1' ? vistaPasaporteMision(m) : vistaHistoria(m, 1);
    case 'reflexion': return vistaReflexion(m);
    case 'fin': return vistaFin(m);
    default: return vistaHistoria(m, n);
  }
}

// ---- pasaporte, diploma, adultos, ayuda
function pasaporte() {
  const e = E.obtener();
  const col = PALETA.find((p) => p.id === e.color);
  const sellos = publicadas().map((m) => `<li class="sello ${E.misionCompletada(m.id) ? 'ganado' : ''}"><span class="sello-n" aria-hidden="true">${E.misionCompletada(m.id) ? '✓' : m.numero}</span><span>${esc(m.titulo)}<span class="solo-lectores">${E.misionCompletada(m.id) ? ' (completada)' : ' (por completar)'}</span></span></li>`).join('');
  const logros = Object.entries(LOGROS).map(([id, l]) => {
    const g = e.logros.indexOf(id) >= 0;
    return `<li class="logro ${g ? 'ganado' : ''}"><span class="logro-ic" aria-hidden="true">${g ? l.icono : '·'}</span><span><strong>${esc(l.nombre)}</strong><br><small>${esc(l.texto)}${g ? '' : ' <span class="solo-lectores">(todavía no)</span>'}</small></span></li>`;
  }).join('');
  return {
    titulo: 'Mi pasaporte',
    html: `<section class="pantalla">
      <h1>Mi pasaporte</h1>
      ${E.almacenamientoOk() ? '' : '<div class="aviso" role="alert"><strong>Tu navegador no deja guardar el progreso.</strong> Puedes jugar, pero al cerrar la página empezarás desde cero.</div>'}
      <div class="tarjeta pasaporte-carta" ${col ? `style="--c:${col.hex}"` : ''}>
        <div class="pasaporte-izq">${e.amigo ? personaje(e.amigo) : imgRosina('saludo', '', 'rosina-lado', 120)}</div>
        <div><p class="pasaporte-rol">Pasaporte de ${e.trato === 'tejedora' ? 'tejedora' : e.trato === 'tejedor' ? 'tejedor' : 'persona tejedora'}</p>
          <p class="pasaporte-nombre">${esc(e.apodo || 'Sin nombre todavía')}</p>
          <p>${col ? `Color favorito: <strong>${esc(col.nombre)}</strong>` : 'Color favorito: sin elegir'}${e.amigo ? ` · Amigo: <strong>${esc(PERSONAJES[e.amigo].nombre)}</strong>` : ''}</p>
          <a href="${rutaMision('m1', 'pasaporte', 1)}">${e.apodo || e.amigo ? 'Cambiar mi pasaporte' : 'Crear mi pasaporte'}</a></div>
      </div>
      <h2>Mis sellos</h2><ul class="sellos">${sellos}${FUTUROS.map((f) => `<li class="sello futuro" aria-hidden="true"><span class="sello-n">${f.numero}</span><span>${esc(f.titulo)}</span></li>`).join('')}</ul>
      <p class="nota">Las misiones 4 a 8 llegarán muy pronto.</p>
      <h2>Mis logros (${e.logros.length} de ${Object.keys(LOGROS).length})</h2><ul class="logros">${logros}</ul>
      ${E.obtener().colores.m1 ? `<h2>Mi bosque de colores</h2><div class="mi-bosque">${miniBosque(E.obtener().colores.m1)}</div>` : ''}
      <div class="tarjeta"><h2>¿Dónde se guarda mi progreso?</h2>
        <p>Solo en este navegador de este dispositivo. Si borras los datos del navegador o usas otro aparato, empezarás desde cero. No hay cuentas ni se envía nada a internet.</p>
        ${vozListo ? `<label class="check-simple"><input type="checkbox" id="pref-voz" ${e.prefs.voz ? 'checked' : ''}> Mostrar lectura en voz alta (usa la voz de tu dispositivo)</label>` : ''}
        <div class="acciones"><button type="button" class="btn btn-peligro" data-accion="reiniciar">Borrar mi progreso y empezar de nuevo</button></div>
      </div>
      <div class="acciones">${todasHechas() ? '<a class="btn btn-principal" href="#/diploma">🎓 Ver mi diploma</a>' : ''}<a class="btn btn-suave" href="#/mapa">Volver al mapa</a></div>
    </section>`,
    montar: () => {
      const c = document.getElementById('pref-voz');
      if (c) c.addEventListener('change', () => E.cambiar((s) => { s.prefs.voz = c.checked; }));
    },
  };
}

function diploma() {
  const e = E.obtener();
  if (!todasHechas()) {
    const f = publicadas().filter((m) => !E.misionCompletada(m.id));
    return {
      titulo: 'Diploma',
      html: `<section class="pantalla">${imgRosina('idea', 'Rosina tiene una idea.', 'rosina-lado', 150)}<h1>Tu diploma te espera</h1>
        <p class="intro">Se desbloquea al completar las 3 primeras misiones. Te faltan: ${f.map((m) => `<a href="${rutaMision(m.id, 'historia', 1)}">${esc(m.titulo)}</a>`).join(', ')}.</p>
        <div class="acciones"><a class="btn btn-principal btn-grande" href="#/mapa">Ir al mapa</a></div></section>`,
    };
  }
  const fecha = new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
  const quien = e.apodo || 'Persona tejedora';
  return {
    titulo: 'Mi diploma',
    html: `<section class="pantalla pantalla-diploma">
      <h1 class="solo-lectores">Mi diploma</h1>
      <div class="diploma" role="img" aria-label="Diploma de explorador del Bosque Tejido para ${esc(quien)}">
        <div class="diploma-marco">
          <p class="diploma-marca">Lana Rosa Crochet</p>
          <p class="diploma-sub">${TITULO_LIBRO}</p>
          <p class="diploma-t">Diploma de ${e.trato === 'tejedora' ? 'exploradora' : e.trato === 'tejedor' ? 'explorador' : 'explorador o exploradora'} del Bosque Tejido</p>
          <p class="diploma-para">Se entrega a</p>
          <p class="diploma-nombre">${esc(quien)}</p>
          <p class="diploma-txt">por ayudar a Rosina a recuperar los colores del bosque, tejer sus primeras cadenetas y su primera fila de puntos bajos. Una puntada a la vez.</p>
          <div class="diploma-pie">${imgRosina('diploma', '', 'diploma-rosina', 120)}<p>${esc(fecha)}<br><small>Misiones 1 a 3 completadas</small></p></div>
        </div>
      </div>
      <div class="acciones no-imprimir"><button type="button" class="btn btn-principal btn-grande" data-accion="imprimir">🖨️ Imprimir o guardar como PDF</button><a class="btn btn-suave" href="#/mapa">Volver al mapa</a></div>
      <p class="nota no-imprimir">En el cuadro de impresión elige “Guardar como PDF” para descargarlo. Este diploma es un recuerdo de la actividad; no es una certificación oficial.</p>
    </section>`,
  };
}

function adultos() {
  return {
    titulo: 'Guía para adultos',
    html: `<section class="pantalla pantalla-texto">
      <h1>Guía para adultos</h1>
      <p class="intro">“${TITULO_LIBRO}” es una aventura web para que niños de 6 a 8 años aprendan crochet con las manos, acompañados. Estas son las claves para sacarle provecho y hacerlo con seguridad.</p>
      <details open class="det"><summary>Cómo acompañar</summary>
        <ul class="lista-simple"><li>Siéntese al lado, sobre todo en el nudo inicial y las primeras puntadas. Muestre y deje que el niño o la niña intente.</li>
        <li>Sesiones cortas (10 a 15 minutos). Se puede parar y seguir otro día.</li>
        <li>Celebre el esfuerzo, no la perfección: las primeras puntadas casi siempre quedan desiguales.</li>
        <li>Los botones “Necesito ayuda” ofrecen ver de nuevo, una pista, algo más sencillo y pedirle ayuda a usted.</li>
        <li><strong>Si es zurdo o zurda:</strong> puede hacer los mismos pasos con la otra mano, como en un espejo. Ayúdele a colocar el hilo de la forma que le resulte más cómoda: lo importante es que se sienta cómodo y mantenga una tensión constante en el hilo.</li></ul></details>
      <details class="det"><summary>Palabras que usamos</summary>
        <ul class="lista-simple"><li><strong>Cadeneta:</strong> el primer punto, la cadena base.</li>
        <li><strong>Punto bajo:</strong> el punto compacto que forma el tejido.</li>
        <li><strong>Hilo sobre (lazada):</strong> pasar el hilo por encima del gancho.</li>
        <li><strong>Bucle:</strong> el hilo que queda puesto en el gancho (o el espacio por donde entra).</li>
        <li><strong>Base del punto:</strong> la cadeneta de abajo donde entra el gancho.</li>
        <li><strong>V:</strong> la forma que se ve arriba de cada puntada y que usamos para contar.</li>
        <li>Para que todos entiendan igual, la aventura evita “garganta” (decimos <em>curva del gancho</em>), “pie del punto” (decimos <em>base del punto</em>) y “mano fuerte” (decimos <em>la mano que más usas</em>).</li></ul></details>
      <details class="det"><summary>Materiales recomendados</summary>
        <ul class="lista-simple"><li><strong>Lana:</strong> suave, gruesa o media, lisa y de color claro (acrílico suave o algodón). Evite pelusa, hilos metálicos y colores muy oscuros al empezar.</li>
        <li><strong>Gancho:</strong> de 5 a 6 mm, con mango cómodo y punta lisa. Revise que no tenga rebabas.</li>
        <li><strong>Tijeras:</strong> de punta redonda, solo para adultos. <strong>Aguja lanera</strong> de punta roma para esconder hilos más adelante.</li>
        <li>Una mesa despejada, buena luz y un estuche para guardar todo al terminar.</li></ul></details>
      <details class="det"><summary>Seguridad</summary>
        <ul class="lista-simple"><li>Supervisión adulta cercana, en especial con ganchos, agujas y tijeras.</li>
        <li>No enrollar el hilo apretado en dedos ni cuello; no llevarse hilo, gancho ni accesorios a la boca.</li>
        <li>Los accesorios pequeños (ojos de seguridad, botones, marcadores) no son adecuados para menores que se llevan objetos a la boca. Esta actividad no los usa.</li>
        <li>Esta actividad no es un juguete certificado ni sustituye el criterio del adulto sobre el material adecuado para cada niño o niña.</li></ul></details>
      <details class="det"><summary>Privacidad y datos</summary>
        <ul class="lista-simple"><li>No hay cuentas, chat, anuncios, cookies de seguimiento ni analítica en esta página.</li>
        <li>El nombre o apodo (opcional), los colores y el progreso se guardan <strong>solo en este navegador</strong>; no se envían a ningún servidor. Se pierden si se borran los datos del navegador o se cambia de dispositivo.</li>
        <li>Pedimos al niño o niña no escribir apellidos, colegio ni datos de contacto; el pasaporte solo admite un nombre o apodo corto.</li>
        <li>La lectura en voz alta, si aparece, usa los audios de Rosina que vienen con el libro o, cuando falta alguno, la voz del propio dispositivo (solo voces locales); ningún texto sale del dispositivo.</li>
        <li>Más información: <a href="/aventuras-de-rosina/privacidad.html">política de privacidad de las familias</a>.</li></ul></details>
      <details class="det"><summary>Qué se aprende en estas 3 misiones</summary>
        <ol class="lista-simple">${publicadas().map((m) => `<li><strong>${esc(m.titulo)}</strong> (${esc(m.habilidad)}): ${m.objetivos.map(esc).join('; ')}.</li>`).join('')}</ol>
        <p class="nota">Los pasos de crochet están redactados para principiantes y pendientes de revisión final por la experta de Lana Rosa. No prometemos beneficios clínicos ni resultados educativos medidos.</p></details>
      <details class="det"><summary>Contacto</summary><p>¿Dudas o ideas? Escríbanos por <a href="https://wa.me/573205072801" target="_blank" rel="noopener">WhatsApp</a> o visite <a href="/academy/">Lana Rosa Academy</a>.</p></details>
      <div class="acciones"><a class="btn btn-principal btn-grande" href="#/">Volver al inicio</a></div>
    </section>`,
  };
}

function ayudaPagina() {
  return {
    titulo: 'Ayuda',
    html: `<section class="pantalla">${imgRosina('abrazo', 'Rosina abraza un ovillo en forma de corazón.', 'rosina-lado', 150)}<h1>¿Cómo funciona la aventura?</h1>
      <ol class="pasos-ayuda">
        <li><strong>Mapa:</strong> toca una misión. Puedes ir a cualquiera.</li>
        <li><strong>Historia, aprende, practica, juega y reflexiona:</strong> cada misión tiene esos momentos. Tú tejes con lana y gancho de verdad.</li>
        <li><strong>Necesito ayuda:</strong> te ofrece ver de nuevo, una pista, algo más sencillo o pedirle ayuda a una persona adulta.</li>
        <li><strong>Pasaporte:</strong> guarda tus logros. Se guarda solo en este dispositivo.</li>
      </ol>
      <div class="acciones"><button type="button" class="btn btn-principal btn-grande" data-accion="ayuda-general">🤝 Necesito ayuda ahora</button><a class="btn btn-suave" href="#/mapa">Ir al mapa</a></div></section>`,
  };
}

function noEncontrada() {
  return { titulo: 'No encontrada', html: `<section class="pantalla">${imgRosina('sorpresa', 'Rosina se sorprende con las manos en las mejillas.', 'rosina-lado', 150)}<h1>Esa página no existe en el bosque</h1><div class="acciones"><a class="btn btn-principal btn-grande" href="#/mapa">Ir al mapa</a><a class="btn btn-suave" href="#/">Inicio</a></div></section>` };
}

// ---------------------------------------------------------------- navegación
function ir(ruta) { location.hash = '#/' + String(ruta).replace(/^#?\/?/, ''); }
let vistaActual = null;
let primeraCarga = true;
let ultimoTexto = '';

function render(opc) {
  opc = opc || {};
  const p = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  voz.parar();
  let v;
  switch (p[0]) {
    case undefined: v = bienvenida(); break;
    case 'acompanantes': v = acompanantes(); break;
    case 'preparacion': v = preparacion(); break;
    case 'mapa': v = mapa(); break;
    case 'mision': v = vistaMision(p[1], p[2] || 'historia', p[3] != null ? parseInt(p[3], 10) : undefined); break;
    case 'pasaporte': v = pasaporte(); break;
    case 'diploma': v = diploma(); break;
    case 'adultos': v = adultos(); break;
    case 'ayuda': v = ayudaPagina(); break;
    default: v = noEncontrada();
  }
  vistaActual = v;
  ultimoTexto = v.voz || '';
  app.innerHTML = v.html;
  document.title = v.titulo === TITULO_LIBRO ? `${v.titulo} — Lana Rosa Crochet` : `${v.titulo} — ${TITULO_LIBRO}`;
  if (p[0] === 'mision' && p[2] !== 'fin') E.cambiar((s) => { s.ultima = location.hash.replace(/^#\/?/, ''); });
  else if (p[0] === 'mapa') E.cambiar((s) => { if (!s.ultima) s.ultima = 'mapa'; });
  if (v.montar) v.montar();
  // Al cambiar de pantalla el foco pasa al título (lectores de pantalla); en la primera carga no, para que el Tab empiece por "Saltar al contenido".
  const foco = app.querySelector('h1');
  if (foco && !primeraCarga && !opc.silencioso) { foco.setAttribute('tabindex', '-1'); foco.focus({ preventScroll: true }); }
  primeraCarga = false;
  if (!opc.silencioso) window.scrollTo(0, 0);
  document.querySelectorAll('.cab-nav a').forEach((a) => { if (a.getAttribute('href') === '#/' + (p[0] || '')) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  const aviso = document.getElementById('aviso-almacen');
  if (aviso) aviso.hidden = E.almacenamientoOk();
}

// Acciones por delegación
document.addEventListener('click', (ev) => {
  const vb = ev.target.closest('[data-vel]');
  if (vb) {
    const grupo = vb.closest('.video-vel'), vid = grupo && grupo.previousElementSibling;
    if (vid && vid.tagName === 'VIDEO') { vid.playbackRate = parseFloat(vb.dataset.vel); grupo.querySelectorAll('[data-vel]').forEach((x) => x.setAttribute('aria-pressed', String(x === vb))); }
    return;
  }
  const b = ev.target.closest('[data-ir],[data-accion],[data-marca]');
  if (!b || !app.contains(b) && !b.closest('dialog')) return;
  if (b.dataset.marca) {
    const m = porId((location.hash.match(/mision\/(m\d)/) || [])[1]);
    if (m) E.marcarEtapa(m.id, b.dataset.marca, true);
  }
  if (b.dataset.logro) darLogro(b.dataset.logro);
  if (b.dataset.evento) emitir(b.dataset.evento);
  if (b.dataset.ir) { ir(b.dataset.ir); return; }
  const a = b.dataset.accion;
  const mid = (location.hash.match(/mision\/(m\d)/) || [])[1];
  if (a === 'ayuda') abrirAyuda(vistaActual && vistaActual.ayuda ? Object.assign({ verDeNuevo: repetirPaso }, vistaActual.ayuda) : { verDeNuevo: repetirPaso });
  else if (a === 'ayuda-general') abrirAyuda({ pista: 'Empieza por el mapa y elige una misión. Puedes cambiar de misión cuando quieras.', simple: 'Entra a la misión 1: es la más sencilla y no necesitas hilo todavía.', adulto: 'Ayude a elegir una misión y a preparar los materiales.' });
  else if (a === 'repetir') { repetirPaso(); }
  else if (a === 'leer') { if (!E.obtener().prefs.voz) E.cambiar((s) => { s.prefs.voz = true; }); voz.leer(ultimoTexto); }
  else if (a === 'adulto-visto') E.cambiar((s) => { s.prefs.adultos = true; });
  else if (a === 'practica-hecha' || a === 'practica-despues') {
    const m = porId(mid); if (!m) return;
    E.marcarEtapa(m.id, 'practica', a === 'practica-hecha' ? 'hecho' : 'despues');
    const r = document.getElementById('practica-resp');
    r.className = 'retro bien'; r.textContent = a === 'practica-hecha' ? '¡Qué bien! Practicaste con tu hilo real.' : m.practica.sinMateriales;
    const j = document.getElementById('ir-juego'); j.hidden = false; j.focus();
    emitir(a === 'practica-hecha' ? 'practica_hecha' : 'practica_despues', { mision: m.id });
  } else if (a === 'reflexion') {
    const m = porId(mid); if (!m) return;
    E.cambiar((s) => { s.reflexiones[m.id] = b.dataset.id; });
    E.marcarEtapa(m.id, 'reflexion', true);
    document.querySelectorAll('.opciones-reflexion .opcion').forEach((o) => { o.classList.toggle('elegida', o === b); o.setAttribute('aria-pressed', String(o === b)); });
    const r = document.getElementById('reflexion-resp'); r.className = 'retro bien'; r.textContent = m.reflexion.respuesta;
    const f = document.getElementById('ir-fin'); if (f) f.textContent = 'Continuar →';
  } else if (a === 'imprimir') window.print();
  else if (a === 'reiniciar') {
    document.getElementById('confirmar-titulo').textContent = '¿Borrar todo tu progreso?';
    dlgConfirmar.showModal();
  }
});

function repetirPaso() {
  const f = app.querySelector('.paso-fig');
  if (f) { f.classList.remove('repite'); void f.offsetWidth; f.classList.add('repite'); }
  else { window.scrollTo(0, 0); const h = app.querySelector('h1'); if (h) h.focus({ preventScroll: true }); }
  if (vozListo && E.obtener().prefs.voz) voz.leer(ultimoTexto);
}

dlgConfirmar.addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-confirmar]');
  if (!b) { if (ev.target === dlgConfirmar) dlgConfirmar.close(); return; }
  if (b.dataset.confirmar === 'si') { E.reiniciar(); dlgConfirmar.close(); avisar('Tu progreso se borró. ¡Podemos empezar de nuevo!'); ir(''); render(); }
  else dlgConfirmar.close();
});

// Cabecera: ayuda siempre disponible
document.addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-cab="ayuda"]');
  if (b) { ev.preventDefault(); ir('ayuda'); }
});

window.addEventListener('hashchange', render);
// Cuando el navegador termina de cargar las voces aparece el botón "Escuchar"; se repinta sin mover el foco
// y nunca en el juego ni en el pasaporte, para no borrar lo que el niño está haciendo.
voz.iniciar((ok) => {
  const antes = vozListo; vozListo = ok;
  const ruta = location.hash.replace(/^#\/?/, '').split('/');
  if (vistaActual && ok !== antes && ruta[2] !== 'juego' && ruta[2] !== 'pasaporte' && ruta[0] !== 'pasaporte') render({ silencioso: true });
});
render();
musica.iniciar(E.obtener().prefs.musica, (on) => E.cambiar((s) => { s.prefs.musica = on; }));
