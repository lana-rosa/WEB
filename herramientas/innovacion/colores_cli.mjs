// Calcula el perfil de colores de imágenes ya reducidas, con el MISMO código que usa el navegador (js/universo/colores.js).
// Entrada (stdin): [{ "id": "foto.jpg", "ancho": 48, "alto": 60, "rgba": "<base64 de ancho*alto*4 bytes>" }]
// Salida (stdout): [{ "id": "foto.jpg", "principal": "rosa", "colores": ["rosa", "amarillo"], "pct": { ... } }]
import { perfilColores } from '../../js/universo/colores.js';

let texto = '';
process.stdin.setEncoding('utf8');
for await (const parte of process.stdin) texto += parte;
const entrada = JSON.parse(texto);
const salida = entrada.map((im) => {
  const bytes = new Uint8ClampedArray(Buffer.from(im.rgba, 'base64'));
  if (bytes.length !== im.ancho * im.alto * 4) throw new Error('tamaño inesperado en ' + im.id);
  return Object.assign({ id: im.id }, perfilColores(bytes, im.ancho, im.alto));
});
process.stdout.write(JSON.stringify(salida));
