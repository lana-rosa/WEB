// Lectura en voz alta OPCIONAL con la voz del propio dispositivo (Web Speech API, solo síntesis).
// Privacidad: solo se ofrecen voces locales (localService) para que el texto no salga del dispositivo;
// si no hay una voz local en español, el botón no aparece. No hay reconocimiento de voz ni micrófono.

let voz = null;
let listo = false;

function elegir() {
  const s = window.speechSynthesis;
  if (!s) return null;
  const todas = s.getVoices() || [];
  const es = todas.filter((v) => /^es(-|_|$)/i.test(v.lang) && v.localService);
  return es.find((v) => /CO|419|MX|US/i.test(v.lang)) || es[0] || null;
}

export function iniciar(alCambiar) {
  if (!('speechSynthesis' in window)) return;
  const probar = () => { voz = elegir(); listo = !!voz; if (alCambiar) alCambiar(listo); };
  probar();
  window.speechSynthesis.addEventListener && window.speechSynthesis.addEventListener('voiceschanged', probar);
}

export const disponible = () => listo;

export function leer(texto) {
  if (!listo || !texto) return;
  const s = window.speechSynthesis;
  s.cancel();
  const u = new SpeechSynthesisUtterance(String(texto));
  u.voice = voz; u.lang = voz.lang; u.rate = 0.9; u.pitch = 1.05;
  s.speak(u);
}

export function parar() { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); }
