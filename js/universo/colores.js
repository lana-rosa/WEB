// Búsqueda por color (Etapa 4 del universo de Rosina). Sin IA, sin servicios externos y sin subir nada:
// todo son reglas de color que corren en el navegador (para la foto de referencia de la persona) y, con este mismo archivo
// ejecutado con Node (herramientas/innovacion/colores.py), para calcular los colores de las fotos de los productos.
// Un solo código para los dos casos: así una foto de referencia y un producto se comparan con las mismas reglas.

// [id, nombre que ve la persona, color de la muestra]
export const COLORES = [
  ['rosa', 'Rosa', '#F28FC0'], ['rojo', 'Rojo', '#D62839'], ['naranja', 'Naranja', '#F28C28'], ['amarillo', 'Amarillo', '#F7D23E'],
  ['verde', 'Verde', '#4CAF50'], ['azul', 'Azul o celeste', '#4C9BE8'], ['morado', 'Morado o lila', '#9B6FD1'], ['cafe', 'Café', '#8B5A3C'],
  ['crema', 'Blanco o crema', '#F5EBDC'], ['gris', 'Gris', '#9A9A9F'], ['negro', 'Negro', '#2B2B2E'],
];
export const IDS_COLOR = COLORES.map((c) => c[0]);

// Convierte un color RGB (0-255) en uno de los 11 colores de la lista.
export function nombreColor(r, g, b) {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  const v = mx / 255, s = mx === 0 ? 0 : d / mx;
  let h = 0;
  if (d > 0) {
    if (mx === r) h = ((g - b) / d) % 6; else if (mx === g) h = (b - r) / d + 2; else h = (r - g) / d + 4;
    h *= 60; if (h < 0) h += 360;
  }
  if (v < 0.2) return 'negro';
  if (s < 0.13) return v > 0.78 ? 'crema' : v > 0.28 ? 'gris' : 'negro';
  // Tonos claros y poco saturados: blanco, crema o beige (se agrupan en «Blanco o crema»)
  if (s < 0.3 && v > 0.8 && (h < 70 || h > 330)) return h > 330 || h < 12 ? 'rosa' : 'crema';
  if (h >= 345 || h < 12) return s < 0.55 && v > 0.7 ? 'rosa' : 'rojo';
  if (h < 42) {
    if (v < 0.62) return 'cafe';
    if (s < 0.45) return 'crema';
    return v < 0.78 && s < 0.7 ? 'cafe' : 'naranja';
  }
  if (h < 70) return s < 0.3 ? 'crema' : v < 0.5 ? 'cafe' : 'amarillo';
  if (h < 170) return 'verde';
  if (h < 255) return 'azul';
  if (h < 300) return 'morado';
  return 'rosa';
}

// Perfil de colores de una imagen reducida (rgba: Uint8ClampedArray/arreglo de ancho*alto*4).
// Cuenta el color de cada píxel del centro y le resta lo que ya aparece en el borde (la mesa, la pared o el fondo de la foto),
// para que gane el color de la pieza y no el del fondo. Devuelve { principal, colores: [ids, de mayor a menor], pct: {id: 0..1} }.
export function perfilColores(rgba, ancho, alto, opciones) {
  const o = Object.assign({ minimo: 0.15, maximo: 3, descuentoBorde: 1.4 }, opciones || {});
  const centro = {}, borde = {}; let nc = 0, nb = 0;
  for (let y = 0; y < alto; y++) {
    for (let x = 0; x < ancho; x++) {
      const i = (y * ancho + x) * 4;
      if (rgba[i + 3] < 128) continue;
      const r = rgba[i], g = rgba[i + 1], b = rgba[i + 2];
      if (r > 247 && g > 247 && b > 247) continue; // blanco puro: márgenes de la foto, no la pieza
      const c = nombreColor(r, g, b);
      const fx = x / ancho, fy = y / alto;
      if (fx < 0.12 || fx > 0.88 || fy < 0.1 || fy > 0.9) { borde[c] = (borde[c] || 0) + 1; nb++; }
      else if (fx > 0.18 && fx < 0.82 && fy > 0.1 && fy < 0.85) { centro[c] = (centro[c] || 0) + 1; nc++; }
    }
  }
  const frac = (m, n) => { const r = {}; IDS_COLOR.forEach((c) => { r[c] = n ? (m[c] || 0) / n : 0; }); return r; };
  const fc = frac(centro, nc), fb = frac(borde, nb);
  let ajust = {}, total = 0;
  IDS_COLOR.forEach((c) => { const a = Math.max(0, fc[c] - o.descuentoBorde * fb[c]); ajust[c] = a; total += a; });
  if (total < 0.05) { ajust = fc; total = IDS_COLOR.reduce((s, c) => s + fc[c], 0); } // todo parecía fondo: se usa el centro tal cual
  if (!total) return { principal: null, colores: [], pct: {} };
  const pct = {}; IDS_COLOR.forEach((c) => { pct[c] = Math.round(ajust[c] / total * 1000) / 1000; });
  const orden = IDS_COLOR.slice().sort((a, b) => pct[b] - pct[a]);
  const colores = orden.filter((c) => pct[c] >= o.minimo).slice(0, o.maximo);
  return { principal: colores[0] || orden[0], colores: colores.length ? colores : [orden[0]], pct };
}

// Reduce una imagen del navegador a unos 64 px y calcula su perfil. Todo ocurre en el dispositivo: la imagen no se envía a ningún sitio.
export async function perfilDeArchivo(archivo, lado) {
  const L = lado || 64;
  const bmp = await createImageBitmap(archivo);
  const k = Math.min(1, L / Math.max(bmp.width, bmp.height));
  const w = Math.max(8, Math.round(bmp.width * k)), h = Math.max(8, Math.round(bmp.height * k));
  const lienzo = document.createElement('canvas'); lienzo.width = w; lienzo.height = h;
  const ctx = lienzo.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(bmp, 0, 0, w, h);
  if (bmp.close) bmp.close();
  const datos = ctx.getImageData(0, 0, w, h).data;
  return perfilColores(datos, w, h, { minimo: 0.1, maximo: 4 });
}

// Orden de resultados: primero las piezas cuyo color principal es el elegido, luego las que lo llevan como detalle.
export function puntajeColor(colores, id) {
  if (!colores || !id) return 0;
  const i = colores.indexOf(id);
  return i < 0 ? 0 : i === 0 ? 2 : 1;
}
