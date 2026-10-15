// Progreso local de "Rosina y la gran aventura de la primera cadeneta".
// Todo se guarda SOLO en este navegador (localStorage, clave lrAventuraRosina). No se envía a ningún servidor ni se pide cuenta.
// Si el navegador bloquea el almacenamiento, la aventura funciona igual pero sin recordar el progreso (se avisa con almacenamientoOk()).

const CLAVE = 'lrAventuraRosina';
const VERSION = 1;

const nuevo = () => ({
  v: VERSION, apodo: '', trato: '', color: '', amigo: '', ultima: '',
  misiones: {},      // { m1: { etapas: { historia, tutorial, practica: 'hecho'|'despues', juego, reflexion, pasaporte }, completada, fecha } }
  logros: [],        // ids de LOGROS
  colores: {},       // { m1: { rio, flores, camino } } elecciones del Laboratorio de colores
  reflexiones: {},   // { m1: 'preguntar' }
  prefs: { voz: false, adultos: false },
});

let memoria = nuevo();
let ok = true;

function leer() {
  try {
    const t = window.localStorage.getItem(CLAVE);
    if (t) {
      const o = JSON.parse(t);
      if (o && o.v === VERSION) return Object.assign(nuevo(), o, { prefs: Object.assign(nuevo().prefs, o.prefs || {}) });
    }
  } catch (e) { ok = false; }
  return nuevo();
}

try { window.localStorage.setItem(CLAVE + '-prueba', '1'); window.localStorage.removeItem(CLAVE + '-prueba'); } catch (e) { ok = false; }
memoria = leer();

function guardar() {
  try { window.localStorage.setItem(CLAVE, JSON.stringify(memoria)); } catch (e) { ok = false; }
}

export const almacenamientoOk = () => ok;
export const obtener = () => memoria;

export function cambiar(fn) { fn(memoria); guardar(); }

export function mision(id) {
  if (!memoria.misiones[id]) memoria.misiones[id] = { etapas: {}, completada: false, fecha: '' };
  return memoria.misiones[id];
}

export function marcarEtapa(id, etapa, valor = true) {
  cambiar((e) => { if (!e.misiones[id]) e.misiones[id] = { etapas: {}, completada: false, fecha: '' }; e.misiones[id].etapas[etapa] = valor; });
}

export function etapaHecha(id, etapa) {
  const m = memoria.misiones[id];
  return !!(m && m.etapas[etapa]);
}

export function completar(id) {
  cambiar((e) => {
    const m = e.misiones[id] || (e.misiones[id] = { etapas: {}, completada: false, fecha: '' });
    if (!m.completada) { m.completada = true; m.fecha = new Date().toISOString().slice(0, 10); }
  });
}

export const misionCompletada = (id) => !!(memoria.misiones[id] && memoria.misiones[id].completada);

/** Devuelve true si el logro es nuevo. */
export function logro(id) {
  if (memoria.logros.indexOf(id) >= 0) return false;
  cambiar((e) => { e.logros.push(id); });
  return true;
}

export function reiniciar() {
  memoria = nuevo();
  try { window.localStorage.removeItem(CLAVE); } catch (e) { /* nada que borrar */ }
}
