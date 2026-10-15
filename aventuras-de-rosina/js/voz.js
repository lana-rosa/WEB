// Lectura en voz alta OPCIONAL con la voz del propio dispositivo (Web Speech API, solo síntesis).
// Privacidad: solo se ofrecen voces locales (localService) para que el texto no salga del dispositivo;
// si no hay una voz local en español, el botón no aparece. No hay reconocimiento de voz ni micrófono.
//
// Para que suene más natural (15-oct-2026): se elige la mejor voz local en español (femenina, latinoamericana y «natural» si existe),
// el texto se lee frase por frase, con pausas, y se pronuncian bien las medidas y las siglas.

let voz = null;
let listo = false;

// Región preferida: Colombia y Latinoamérica antes que España.
const REGION = [[/^es[-_]CO/i, 6], [/^es[-_](419|MX|US)/i, 5], [/^es[-_](AR|CL|PE|VE|UY|EC|BO|PY|GT|CR|PA|DO|PR|HN|NI|SV|CU)/i, 4], [/^es[-_]ES/i, 2], [/^es/i, 1]];
// Voces de buena calidad en cada sistema (nombres frecuentes en Android, iOS/macOS, Windows y Chrome).
const BUENAS = /natural|neural|premium|enhanced|mejorada|siri|google|paulina|monica|m[óo]nica|sabina|dalia|paloma|catalina|salome|valentina|lupe|marisol|elena|helena|laura|sofia|sof[íi]a|luciana|francisca|camila|ximena|isabela|esperanza/i;
const MASCULINAS = /jorge|diego|juan|carlos|pablo|raul|ra[úu]l|alvaro|enrique|miguel|male|hombre|alberto|andres|andr[ée]s|tomas|tom[áa]s|jaime|pedro|luis/i;

/** Puntaje de una voz (pura, se prueba aparte). Más alto = mejor. */
export function puntuar(v) {
  const nombre = v.name || '', lang = v.lang || '';
  let p = 0;
  for (const [re, pts] of REGION) { if (re.test(lang)) { p += pts; break; } }
  if (BUENAS.test(nombre)) p += 4;
  if (/natural|neural|premium|enhanced|mejorada/i.test(nombre)) p += 3;
  if (MASCULINAS.test(nombre)) p -= 5; // Rosina es una ovejita: se prefiere una voz femenina
  return p;
}

export function elegirVoz(todas) {
  const es = (todas || []).filter((v) => /^es(-|_|$)/i.test(v.lang) && v.localService);
  if (!es.length) return null;
  return es.slice().sort((a, b) => puntuar(b) - puntuar(a))[0];
}

/** Deja el texto listo para pronunciarlo: medidas, comillas y símbolos que suenan raro. */
export function prepararTexto(t) {
  return String(t)
    .replace(/(\d)\s*mm\b/g, '$1 milímetros')
    .replace(/(\d)\s*cm\b/g, '$1 centímetros')
    .replace(/\bmm\b/g, 'milímetros')
    .replace(/[“”«»"]/g, '')
    .replace(/\b([A-Z])\b(?=\s|[,.;:!?]|$)/g, (m) => (m === 'V' ? 've' : m === 'O' ? 'o' : m))
    .replace(/[→←↓↑✓✔•]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Parte el texto en frases (para leer con pausas y evitar que el navegador corte frases largas). */
export function partir(t) {
  const frases = prepararTexto(t).match(/[^.!?¡¿:;]+[.!?:;]*/g) || [];
  return frases.map((f) => f.trim()).filter((f) => /[\p{L}\p{N}]/u.test(f));
}

export function iniciar(alCambiar) {
  if (!('speechSynthesis' in window)) return;
  const probar = () => { voz = elegirVoz(window.speechSynthesis.getVoices()); listo = !!voz; if (alCambiar) alCambiar(listo); };
  probar();
  window.speechSynthesis.addEventListener && window.speechSynthesis.addEventListener('voiceschanged', probar);
}

export const disponible = () => listo;

export function leer(texto) {
  if (!listo || !texto) return;
  const s = window.speechSynthesis;
  s.cancel();
  partir(texto).forEach((frase) => {
    const u = new SpeechSynthesisUtterance(frase);
    u.voice = voz; u.lang = voz.lang;
    // Voz amable y un poco más aguda y pausada, como para hablarle a un niño; las preguntas suben un poco el tono.
    u.rate = 0.88;
    u.pitch = /\?$/.test(frase) ? 1.2 : 1.12;
    s.speak(u);
  });
}

export function parar() { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); }
