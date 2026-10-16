// Llamar a la persona por su nombre o apodo (el que escribió en su pasaporte; solo vive en su dispositivo).
// En los textos del libro, {nombre} se cambia por el nombre; si no hay, se quita sin dejar comas ni espacios sueltos.
// La voz grabada usa siempre el texto SIN nombre (así los audios no dependen de cada niño).

export function pers(t, nombre) {
  const n = String(nombre || '').trim();
  const s = String(t);
  if (n) return s.replace(/\{nombre\}/g, n);
  return s.replace(/,\s*\{nombre\}/g, '').replace(/\{nombre\},\s*/g, '').replace(/\s*\{nombre\}/g, '').replace(/\s+([!?.,])/g, '$1');
}

export const sinNombre = (t) => pers(t, '');

/** Retroalimentación del juego: «¡Muy bien!» → «¡Muy bien, Ana!» (si ya tiene {nombre}, se respeta). */
export function conNombre(t, nombre) {
  const n = String(nombre || '').trim();
  const s = String(t);
  if (!n || s.includes('{nombre}')) return pers(s, n);
  return s.replace(/^(¡[^!]+)!/, `$1, ${n}!`);
}
