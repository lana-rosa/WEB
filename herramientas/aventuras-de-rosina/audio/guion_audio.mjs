// Arma el guion de voz de «Rosina y la gran aventura de la primera cadeneta»: todos los textos que el libro lee en voz alta,
// con la clave (nombre del archivo de audio) que usa el reproductor. Uso: node herramientas/aventuras-de-rosina/audio/guion_audio.mjs
// Escribe herramientas/aventuras-de-rosina/audio/guion-audio.csv (se abre en Excel / Google Sheets) y guion-audio.json.
// Las fórmulas de cada texto son las MISMAS que usa app.js / juegos.js al llamar a voz.leer (la prueba probar.py lo comprueba).
import { writeFileSync } from 'node:fs';
import { clave } from '../../../aventuras-de-rosina/js/voz.js';
import { MISIONES } from '../../../aventuras-de-rosina/contenido/misiones.js';

const filas = [];
const ver = new Map();
function agregar(lugar, texto) {
  const t = String(texto || '').replace(/\s+/g, ' ').trim();
  if (!t) return;
  const k = clave(t);
  if (ver.has(k)) { ver.get(k).lugar += ' | ' + lugar; return; }
  const fila = { clave: k, lugar, texto: t };
  ver.set(k, fila); filas.push(fila);
}

agregar('pasaporte', 'Crea tu pasaporte de tejedor. Escribe un nombre o apodo, elige tu color favorito y un amigo del bosque.');
for (const m of MISIONES.filter((x) => x.publicada)) {
  (m.historia || []).forEach((p, i) => agregar(`${m.id} historia ${i + 1}`, p.texto));
  const t = m.tutorial;
  if (t) {
    agregar(`${m.id} aprende (intro)`, t.objetivo);
    t.pasos.forEach((p, i) => agregar(`${m.id} aprende paso ${i + 1}`, `${p.titulo}. ${p.texto} ${(p.lista || []).join('. ')}`));
  }
  if (m.practica) agregar(`${m.id} practica`, `${m.practica.titulo}. ${m.practica.intro} ${m.practica.reto}`);
  const j = m.juego;
  if (j) {
    agregar(`${m.id} juego (intro)`, `${j.nombre}. ${j.intro}`);
    (j.rondas || []).forEach((r, i) => agregar(`${m.id} juego ronda ${i + 1}`, r.pregunta + ' ' + (r.tipo === 'elegir' ? (r.opciones || []).map((o) => o.texto || o.alt || '').join('. ') : r.tipo === 'ordenar' ? (r.pasos || []).join('. ') : '')));
  }
  if (m.reflexion) agregar(`${m.id} reflexion`, m.reflexion.pregunta);
  if (m.fin) agregar(`${m.id} fin`, m.fin.texto);
}

const csv = '﻿clave,lugar,texto\n' + filas.map((f) => [f.clave, f.lugar, f.texto].map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n') + '\n';
const aqui = new URL('.', import.meta.url).pathname;
writeFileSync(aqui + 'guion-audio.csv', csv);
writeFileSync(aqui + 'guion-audio.json', JSON.stringify(filas, null, 1) + '\n');
console.log(filas.length + ' textos únicos, ' + filas.reduce((n, f) => n + f.texto.length, 0) + ' caracteres');
