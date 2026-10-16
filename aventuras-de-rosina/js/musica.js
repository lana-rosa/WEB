// Música de fondo OPCIONAL: una cajita de música original (archivo del propio sitio, sin servicios externos).
// Empieza apagada; la persona la enciende con el botón y queda guardado en prefs.musica.
const RUTA = '/aventuras-de-rosina/audio/musica-fondo.mp3';
let audio = null;
let boton = null;
let sonando = false;

function crear() {
  if (audio) return audio;
  audio = new Audio(RUTA);
  audio.loop = true; audio.volume = 0.25; audio.preload = 'none';
  return audio;
}

function pintar() {
  if (!boton) return;
  boton.setAttribute('aria-pressed', String(sonando));
  boton.title = sonando ? 'Apagar la música' : 'Encender la música';
  boton.setAttribute('aria-label', boton.title);
}

export function encender() {
  const p = crear().play();
  sonando = true; pintar();
  if (p && p.catch) p.catch(() => { sonando = false; pintar(); }); // el navegador exige un toque antes de sonar
}
export function apagar() { if (audio) audio.pause(); sonando = false; pintar(); }

export function iniciar(querida, alCambiar) {
  boton = document.createElement('button');
  boton.type = 'button'; boton.className = 'btn-musica'; boton.textContent = '🎵';
  boton.addEventListener('click', () => { if (sonando) apagar(); else encender(); if (alCambiar) alCambiar(sonando); });
  document.body.appendChild(boton);
  pintar();
  // Si la persona la dejó encendida, suena con el primer toque (los navegadores no dejan sonar solos).
  if (querida) {
    const primero = () => { document.removeEventListener('pointerdown', primero, true); if (!sonando) encender(); };
    document.addEventListener('pointerdown', primero, true);
  }
  document.addEventListener('visibilitychange', () => { if (audio && document.hidden) audio.pause(); else if (audio && sonando) audio.play().catch(() => {}); });
}
