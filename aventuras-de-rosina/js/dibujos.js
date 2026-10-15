// Dibujos en SVG de "Rosina y la gran aventura de la primera cadeneta".
// Los diagramas de crochet y el mapa de este archivo son PROVISIONALES (dibujos esquemáticos hechos en código, no ilustraciones finales ni fotos).
// Rosina NO se dibuja aquí: usa las imágenes oficiales de /img/stickers/; los amigos, las poses de /img/aventuras/plano/ (ver personajes.js).
// Para reemplazar un dibujo por una imagen o un video final, ver herramientas/aventuras-de-rosina/LEEME.md (sección "Cambiar dibujos por fotos o videos").

import { POSES_PLANO } from '../contenido/personajes.js';

const HA = '#cc1786';   // hilo, borde (fucsia de marca)
const HB = '#ff66c4';   // hilo, relleno (rosa de marca)
const FONDO = '#FFF4F9';
const TINTA = '#3a2a2e';
const FUENTE = "font-family=\"'Hanken Grotesk', sans-serif\"";

const svg = (contenido, vb = '0 0 330 200', clase = 'dib', fondo = true) =>
  `<svg class="${clase}" viewBox="${vb}" role="presentation" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">${fondo ? `<rect width="100%" height="100%" rx="18" fill="${FONDO}"/>` : ''}${contenido}</svg>`;

const hilo = (d, w = 7, a = HA, b = HB) =>
  `<path d="${d}" fill="none" stroke="${a}" stroke-width="${w + 3}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${b}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;

const texto = (x, y, t, tam = 14, ancla = 'middle', peso = 700, color = TINTA) =>
  `<text x="${x}" y="${y}" text-anchor="${ancla}" font-size="${tam}" font-weight="${peso}" fill="${color}" ${FUENTE}>${t}</text>`;

const flecha = (d, color = TINTA) =>
  `<path d="${d}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="5 5" marker-end="url(#pf)"/>`;
const defsFlecha = `<defs><marker id="pf" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,1 L9,5 L0,9z" fill="${TINTA}"/></marker></defs>`;

/** Gancho de crochet: la punta está en (x, y) y el mango se extiende hacia la derecha; ang gira el conjunto.
 *  Forma real de un gancho: la punta redondeada, un «labio» que sobresale, la garganta (la ranura donde entra el hilo),
 *  el cuerpo, el apoyo plano para el pulgar y el mango. (Referencia: ganchos ergonómicos de aluminio con mango.) */
const gancho = (x, y, ang = 0, s = 1) =>
  `<g transform="translate(${x} ${y}) rotate(${ang}) scale(${s})">
    <path d="M0,3 C-1,-2 0.5,-7.5 4.5,-10.5 C8,-12.5 13,-11.5 15,-8.5 L16.5,-5.5 C13,-6.2 10.6,-4.4 10.4,-1.8 C10.2,0.8 13.5,2 18.5,0.8 C25,-0.6 28,-5 35,-5 L112,-5 L112,5 L14,5 C6,5 0.5,6.6 0,3 Z" fill="#B7BCC6" stroke="#6F7683" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M40,-2.8 L96,-2.8" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity=".55"/>
    <path d="M54,-5 L76,-5 L76,5 L54,5 Z" fill="#C9CDD6" stroke="#6F7683" stroke-width="1.2" stroke-linejoin="round"/>
    <rect x="108" y="-7" width="64" height="14" rx="7" fill="#9EA2F9" stroke="#6F73C8" stroke-width="1.5"/>
  </g>`;

// ---------------------------------------------------------------- personajes (poses planas de los amigos)
/** Pose de un amigo (Luna, Tito, Pipo o Bruno) como imagen transparente; si falta la pedida se usa una parecida. */
export function personaje(id, pose = 'saludo') {
  const poses = POSES_PLANO[id];
  if (!poses) return '';
  const PARECIDAS = { feliz: ['corazon', 'flor', 'regalo', 'celebra'], animo: ['celebra', 'corazon'], celebra: ['animo'], piensa: ['piensa2'] };
  const k = [pose].concat(PARECIDAS[pose] || [], ['saludo']).find((x) => poses[x]) || Object.keys(poses)[0];
  return `<img class="personaje pj" src="/img/aventuras/plano/${id}-${k}.webp" alt="" width="${poses[k][0]}" height="${poses[k][1]}" loading="lazy" decoding="async">`;
}

// ---------------------------------------------------------------- piezas reutilizables de crochet
const V = (x, y, w = 6, alto = 12, ancho = 8) => hilo(`M${x - ancho},${y - alto} L${x},${y} L${x + ancho},${y - alto}`, w);
const lazoGancho = (x, y, rx = 14, ry = 22) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="none" stroke="${HA}" stroke-width="9" opacity=".95"/><ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="none" stroke="${HB}" stroke-width="6"/>`;
const eslabon = (x, y) => hilo(`M${x + 11},${y - 14} L${x},${y} L${x + 11},${y + 14}`, 6);

function filaCadenas(n, y = 100, x0 = 22, paso = 22) {
  let s = '';
  for (let i = 0; i < n; i++) s += eslabon(x0 + i * paso, y);
  return s;
}

const PINTORES = {
  lugar: () => svg(`
    <rect x="200" y="22" width="96" height="78" rx="8" fill="#BFE3FF" stroke="#6DB6F2" stroke-width="3"/><path d="M248,22 V100 M200,61 H296" stroke="#6DB6F2" stroke-width="3"/><circle cx="270" cy="44" r="10" fill="#FFD23F" stroke="#FFB400" stroke-width="2"/>
    <rect x="28" y="142" width="274" height="14" rx="7" fill="#C9966B" stroke="#8a5a30" stroke-width="2"/><rect x="48" y="156" width="10" height="34" rx="4" fill="#C9966B"/><rect x="272" y="156" width="10" height="34" rx="4" fill="#C9966B"/>
    <circle cx="96" cy="118" r="24" fill="${HB}" stroke="${HA}" stroke-width="3"/><path d="M78,108 q18,-12 36,2 M74,122 q22,-16 44,2 M82,136 q14,-8 28,0" fill="none" stroke="#fff" stroke-width="2.5" opacity=".6"/>
    ${gancho(150, 134, -3, .55)}
    <ellipse cx="170" cy="188" rx="46" ry="9" fill="#FBE4EF"/>`),

  ovillo: (p) => svg(`
    <circle cx="150" cy="96" r="62" fill="${HB}" stroke="${HA}" stroke-width="4"/>
    <path d="M100,70 q50,-30 100,6 M92,96 q58,-30 116,6 M98,124 q52,-24 104,4 M116,148 q34,-14 68,0" fill="none" stroke="#fff" stroke-width="3" opacity=".55" stroke-linecap="round"/>
    ${p.cola ? `${hilo('M196,136 C230,150 232,172 270,170 C292,168 300,180 306,176', 6)}${texto(262, 192, 'la cola', 14)}` : ''}`),

  gancho: () => svg(`${defsFlecha}
    ${gancho(46, 100, 0, 1.55)}
    ${texto(48, 56, 'Punta', 15)}${flecha('M50,62 L48,88')}
    ${texto(150, 160, 'Curva', 15)}${texto(150, 178, 'del gancho', 14, 'middle', 500)}${flecha('M136,146 L70,104')}
    ${texto(262, 60, 'Mango', 15)}${flecha('M262,66 L262,88')}`),

  // Tijeras de punta redonda (hoja con filo, tornillo en el centro y mangos con aros de plástico) y aguja lanera de punta roma con ojo grande.
  tijeras: () => svg(`
    <g transform="translate(104 84) rotate(-4) scale(1.05)">
      <!-- hoja y mango de abajo (la hoja va hacia arriba a la derecha) -->
      <path d="M-4,4 L-50,22" stroke="#6F7683" stroke-width="11" stroke-linecap="round"/><path d="M-4,4 L-50,22" stroke="#B7BCC6" stroke-width="7" stroke-linecap="round"/>
      <ellipse cx="-62" cy="30" rx="21" ry="14" transform="rotate(-24 -62 30)" fill="none" stroke="#6F73C8" stroke-width="12"/>
      <ellipse cx="-62" cy="30" rx="21" ry="14" transform="rotate(-24 -62 30)" fill="none" stroke="#9EA2F9" stroke-width="8"/>
      <path d="M-6,-4 L88,-25 C98,-27 101,-18 95,-13 L-6,10 Z" fill="#C9CDD6" stroke="#6F7683" stroke-width="2" stroke-linejoin="round"/>
      <!-- hoja y mango de arriba (la hoja va hacia abajo a la derecha) -->
      <path d="M-4,-4 L-50,-22" stroke="#6F7683" stroke-width="11" stroke-linecap="round"/><path d="M-4,-4 L-50,-22" stroke="#B7BCC6" stroke-width="7" stroke-linecap="round"/>
      <ellipse cx="-62" cy="-30" rx="21" ry="14" transform="rotate(24 -62 -30)" fill="none" stroke="#C93A82" stroke-width="12"/>
      <ellipse cx="-62" cy="-30" rx="21" ry="14" transform="rotate(24 -62 -30)" fill="none" stroke="#F28FC0" stroke-width="8"/>
      <path d="M-6,4 L88,25 C98,27 101,18 95,13 L-6,-10 Z" fill="#E4E7EE" stroke="#6F7683" stroke-width="2" stroke-linejoin="round"/>
      <path d="M6,-6 L82,-21" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".75"/>
      <circle cx="-2" cy="0" r="6" fill="#9AA0AD" stroke="#5F6572" stroke-width="1.8"/><circle cx="-2" cy="0" r="1.8" fill="#5F6572"/>
    </g>
    ${texto(112, 168, 'Tijeras de punta redonda', 14)}
    <g transform="translate(226 66)">
      <path d="M4,0 L84,0" stroke="#8F96A4" stroke-width="5" stroke-linecap="round"/><path d="M6,-1.2 L82,-1.2" stroke="#E7EAF0" stroke-width="1.4" stroke-linecap="round"/>
      <circle cx="87" cy="0" r="3.4" fill="#8F96A4"/>
      <ellipse cx="9" cy="0" rx="9" ry="4" fill="${FONDO}" stroke="#8F96A4" stroke-width="2.6"/>
    </g>
    ${texto(272, 98, 'Aguja lanera', 14)}${texto(272, 114, '(punta roma)', 13, 'middle', 500)}
    <rect x="206" y="140" width="104" height="30" rx="15" fill="${HA}"/>${texto(258, 161, 'Solo adultos', 14, 'middle', 700, '#fff')}`),

  nudo1: () => svg(`${defsFlecha}
    ${hilo('M60,176 C80,146 122,116 150,100 C202,64 214,16 164,22 C114,28 118,82 150,100 C176,116 222,150 268,176', 8)}
    ${texto(58, 196, 'la cola', 14, 'start')}${texto(270, 196, 'al ovillo', 14, 'end')}
    ${texto(240, 40, 'cruza los hilos', 14, 'start')}${flecha('M238,46 L170,92')}`),

  nudo2: () => svg(`${defsFlecha}
    ${gancho(60, 96, 0, 1.45)}
    ${lazoGancho(118, 96, 17, 24)}
    ${hilo('M118,120 C112,150 96,170 70,184', 6)}${hilo('M122,72 C150,40 230,44 270,70', 6)}
    ${texto(70, 196, 'la cola', 14, 'middle')}${texto(262, 40, 'al ovillo', 14, 'end')}
    ${texto(190, 150, 'bucle en el gancho', 14, 'start')}${flecha('M188,142 L138,108')}`),

  // Agarre de cuchillo: la mano que más usas toma el gancho desde arriba (el mango descansa en la palma y el índice se apoya sobre el gancho);
  // la otra mano sujeta la base del nudo entre el pulgar y el dedo medio, y el hilo pasa por el índice. Dibujo esquemático y provisional.
  manos: () => {
    const dedo = (d, w = 14) => hilo(d, w, '#c98d63', '#F6C9A6');
    return svg(`${defsFlecha}
    ${dedo('M40,164 L36,72', 17)}
    <ellipse cx="62" cy="180" rx="46" ry="26" fill="#F6C9A6" stroke="#c98d63" stroke-width="3"/>
    ${gancho(40, 104, 0, 1.3)}
    ${lazoGancho(76, 104, 10, 16)}
    ${dedo('M64,170 C68,150 72,136 76,124')}${dedo('M106,176 C112,152 100,138 90,124')}
    ${hilo('M10,22 C28,28 34,50 36,70 C38,92 56,110 70,104', 5)}
    ${dedo('M242,82 L146,96', 14)}
    ${dedo('M232,132 L198,112', 14)}
    <ellipse cx="264" cy="90" rx="38" ry="25" fill="#F6C9A6" stroke="#c98d63" stroke-width="3"/>
    ${dedo('M246,100 L246,134', 13)}${dedo('M263,102 L263,138', 13)}${dedo('M280,100 L280,132', 13)}
    ${texto(258, 46, 'agarre de cuchillo', 14)}${flecha('M258,52 L258,66')}
    ${texto(188, 164, 'pulgar y dedo medio', 13, 'middle', 700)}${texto(188, 181, 'sujetan la base del nudo', 12, 'middle', 500)}${flecha('M138,156 L104,134')}`);
  },

  cadena1: () => svg(`${defsFlecha}
    ${gancho(78, 100, 0, 1.4)}
    ${lazoGancho(132, 100, 15, 22)}
    ${hilo('M280,184 C230,158 206,54 112,76 C84,82 86,116 108,112', 6)}
    ${texto(84, 44, '1. Hilo por encima', 14, 'start')}${texto(84, 62, 'del gancho', 14, 'start')}
    ${texto(176, 160, '2. Jala por el bucle', 14, 'start')}${flecha('M170,152 L120,112')}`),

  pbPartes: () => svg(`${defsFlecha}
    ${hilo('M130,48 L165,92 L200,48', 12)}${hilo('M165,92 L165,134', 12)}
    ${hilo('M136,150 L150,164 M180,164 L194,150 M150,164 L180,164', 7)}
    ${texto(70, 54, 'V de arriba', 15)}${flecha('M96,58 L128,66')}
    ${texto(236, 116, 'base', 15, 'start')}${texto(236, 134, 'del punto', 14, 'start', 500)}${flecha('M230,140 L196,148')}`),

  pb1: () => svg(`${defsFlecha}
    ${filaCadenas(8, 140, 40, 28)}
    ${texto(264, 186, 'primera: no entra', 13, 'end', 500)}
    ${texto(264, 54, 'aquí entra el gancho', 14, 'end')}${flecha('M214,62 L204,112')}
    <circle cx="274" cy="112" r="13" fill="none" stroke="#c0392b" stroke-width="4"/><path d="M265,103 L283,121 M283,103 L265,121" stroke="#c0392b" stroke-width="4"/>
    ${lazoGancho(300, 140, 10, 16)}`),

  pb2: () => svg(`${defsFlecha}
    ${gancho(60, 100, 0, 1.45)}
    ${lazoGancho(108, 100, 13, 21)}${lazoGancho(140, 100, 13, 21)}
    ${texto(200, 62, '2 bucles', 15, 'start')}${texto(200, 80, 'en el gancho', 15, 'start')}${flecha('M198,86 L152,98')}
    ${texto(165, 170, 'Cuéntalos: 1 y 2', 14)}`),

  pb3: () => svg(`${defsFlecha}
    ${gancho(60, 100, 0, 1.45)}
    ${lazoGancho(108, 100, 13, 21)}${lazoGancho(140, 100, 13, 21)}
    ${hilo('M270,184 C230,160 210,70 120,76 C90,80 90,120 122,118', 5)}
    ${texto(176, 160, 'jala por los 2 bucles', 15, 'start')}${flecha('M170,152 L126,116')}
    ${texto(160, 44, 'queda 1 bucle', 15)}`),

  muestraLana: (p) => {
    if (p.variante === 'gruesa') return svg(`<circle cx="100" cy="100" r="62" fill="#FFD6EA" stroke="${HA}" stroke-width="4"/><path d="M52,80 q48,-22 96,6 M46,104 q54,-24 108,6 M54,128 q46,-18 92,2" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" opacity=".7"/>${hilo('M150,128 C200,150 220,110 258,128', 12, HA, '#FFD6EA')}`, '0 0 300 200');
    if (p.variante === 'fina') return svg(`<circle cx="100" cy="100" r="40" fill="#4a3a4f" stroke="#2b2430" stroke-width="3"/>${[0, 1, 2, 3, 4, 5].map((i) => `<path d="M${64 + i * 4},${84 + i * 8} q36,-14 ${72 - i * 8},2" fill="none" stroke="#7d6a82" stroke-width="1.5"/>`).join('')}${hilo('M140,124 C170,108 190,150 220,128 S250,118 276,130', 2.5, '#2b2430', '#5b4a60')}`, '0 0 300 200');
    return svg(`<circle cx="100" cy="100" r="50" fill="#e29ac0" stroke="#b86f97" stroke-width="3"/>${Array.from({ length: 36 }, (_, i) => { const a = (i / 36) * Math.PI * 2; return `<path d="M${100 + Math.cos(a) * 46},${100 + Math.sin(a) * 46} l${Math.cos(a) * 16},${Math.sin(a) * 16}" stroke="#b86f97" stroke-width="3" stroke-linecap="round"/>`; }).join('')}${hilo('M156,128 C186,112 206,150 236,128 S262,118 282,130', 12, '#b86f97', '#e29ac0')}`, '0 0 300 200');
  },

  nudoSolo: () => svg(`${hilo('M70,120 C90,40 170,50 150,110 C130,170 60,130 120,80 C180,30 250,90 200,130 C160,160 120,130 160,100', 7)}${hilo('M60,150 C30,170 40,190 80,186 M200,140 C240,160 270,150 280,176', 7)}`),

  tela: (p) => {
    let s = '';
    const filas = p.filas || 3, cols = 7;
    for (let f = 0; f < filas; f++) for (let c = 0; c < cols; c++) s += V(40 + c * 41 + (f % 2) * 8, 66 + f * 40, 7, 14, 9);
    return svg(s);
  },

  puente: (p) => {
    const total = p.total || 8, hechos = p.hechos || 0, w = 228 / total;
    let s = '<path d="M0,120 Q80,98 165,120 T330,120 V200 H0z" fill="#9AD0F5"/><path d="M0,148 Q80,126 165,148 T330,148" fill="none" stroke="#fff" stroke-width="3" opacity=".6"/>';
    s += '<rect x="18" y="86" width="40" height="64" rx="10" fill="#C8E6C9" stroke="#6faa7a" stroke-width="3"/><rect x="272" y="86" width="40" height="64" rx="10" fill="#C8E6C9" stroke="#6faa7a" stroke-width="3"/>';
    for (let i = 0; i < total; i++) {
      const x = 62 + i * w;
      s += i < hechos ? `<rect x="${x + 1}" y="98" width="${w - 3}" height="14" rx="5" fill="${HB}" stroke="${HA}" stroke-width="2.5"/>` : `<rect x="${x + 1}" y="98" width="${w - 3}" height="14" rx="5" fill="none" stroke="#7a6a70" stroke-width="2.5" stroke-dasharray="5 4"/>`;
    }
    return svg(s);
  },
};

// Cadenas (V en fila) y filas de puntos bajos: se usan en tutoriales y juegos.
PINTORES.cadenas = (p) => {
  const n = p.n || 5, paso = Math.min(38, Math.floor(224 / n)), x0 = 24, y = 100;
  const final = x0 + n * paso;
  let s = filaCadenas(n, y, x0, paso);
  if (!p.sinGancho) {
    s += gancho(final + 6, y, 0, 0.42) + lazoGancho(final + 8, y, 9, 17);
    s += texto(Math.min(final + 12, 300), 62, 'bucle del gancho', 12, 'middle', 500);
    s += `<path d="M${Math.min(final + 12, 300)},68 L${final + 8},80" stroke="${TINTA}" stroke-width="2" fill="none"/>`;
  }
  if (p.numeros) for (let i = 0; i < n; i++) s += texto(x0 + i * paso + 11, y + 42, String(i + 1), 13, 'middle', 700, HA);
  return svg(s);
};

PINTORES.filaPB = (p) => {
  const base = p.base || 11, n = Math.min(p.n || 5, base - 1), paso = base > 9 ? 22 : 28, x0 = 34, yc = 142, ys = 94;
  let s = filaCadenas(base, yc, x0, paso);
  for (let k = 0; k < n; k++) {
    const j = base - 2 - k;
    if (j < 0) break;
    const x = x0 + j * paso + 8;
    s += hilo(`M${x},${ys + 24} L${x},${ys + 6}`, 6) + V(x, ys + 6, 6, 15, 7);
    if (p.numeros) s += texto(x, ys - 22, String(k + 1), 13, 'middle', 700, HA);
  }
  const xl = x0 + (base - 1 - n) * paso + 2;
  s += lazoGancho(Math.max(xl, 18), ys + 6, 9, 17);
  s += texto(Math.max(xl, 18) + 4, 188, 'bucle del gancho', 12, 'start', 500);
  return svg(s);
};

/** Devuelve el SVG de un dibujo descrito en los datos: { tipo, ...parametros }. */
export function dibujo(def) {
  const f = PINTORES[def && def.tipo];
  return f ? f(def) : '';
}

// ---------------------------------------------------------------- mapa del Bosque Tejido
const GRIS = '#CFC9D3';  // flores sin color
const GRIS_RIO = '#D3DAE6', GRIS_CAMINO = '#DDD5CB';

/** Fondo del mapa. colores: { rio, flores, camino } con un color (recuperado) o null (todavía sin color). */
export function mapaFondo(colores) {
  const rio = colores.rio || GRIS_RIO, flores = colores.flores || GRIS, camino = colores.camino || GRIS_CAMINO;
  const flor = (x, y, r = 9) => `<g><circle cx="${x}" cy="${y}" r="${r}" fill="${flores}" stroke="#fff" stroke-width="2"/><circle cx="${x}" cy="${y}" r="${r / 3}" fill="#FFD23F"/><path d="M${x},${y + r} v${r * 1.6}" stroke="#6faa7a" stroke-width="3"/></g>`;
  const arbol = (x, y, r = 24) => `<g><rect x="${x - 4}" y="${y + r - 6}" width="8" height="22" rx="3" fill="#a8774d"/><circle cx="${x}" cy="${y}" r="${r}" fill="#9fd4aa" stroke="#6faa7a" stroke-width="3"/><path d="M${x - r / 2},${y - 4} q${r / 2},-${r / 3} ${r},0 M${x - r / 2},${y + 8} q${r / 2},-${r / 3} ${r},0" fill="none" stroke="#fff" stroke-width="2.5" opacity=".55"/></g>`;
  return `<svg class="mapa-svg" viewBox="0 0 400 520" role="presentation" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
    <rect width="400" height="520" fill="#EAF6FF"/>
    <circle cx="332" cy="52" r="26" fill="#FFE27A" stroke="#FFC400" stroke-width="3"/>
    <path d="M0,150 Q100,90 200,140 T400,120 V520 H0z" fill="#CBE8D2"/>
    <path d="M0,230 Q120,190 230,236 T400,210 V520 H0z" fill="#B4DEBD"/>
    ${arbol(50, 150, 22)}${arbol(350, 180, 26)}${arbol(300, 128, 18)}
    <path d="M-10,300 C80,270 150,330 240,296 C320,268 360,300 420,282" fill="none" stroke="${rio}" stroke-width="44" stroke-linecap="round"/>
    <path d="M-10,300 C80,270 150,330 240,296 C320,268 360,300 420,282" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="2 14" stroke-linecap="round" opacity=".6"/>
    <path d="M70,500 C110,440 40,400 130,350 C200,310 250,300 260,300 C330,270 230,210 160,170 C130,150 140,120 150,112" fill="none" stroke="${camino}" stroke-width="26" stroke-linecap="round"/>
    <path d="M70,500 C110,440 40,400 130,350 C200,310 250,300 260,300 C330,270 230,210 160,170 C130,150 140,120 150,112" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="7 9" stroke-linecap="round" opacity=".8"/>
    <g opacity=".55"><circle cx="318" cy="86" r="11" fill="#fff" stroke="#c9c3cc" stroke-width="2"/><circle cx="352" cy="108" r="9" fill="#fff" stroke="#c9c3cc" stroke-width="2"/><circle cx="296" cy="112" r="8" fill="#fff" stroke="#c9c3cc" stroke-width="2"/></g>
    ${flor(40, 440)}${flor(70, 470, 8)}${flor(24, 482, 8)}${flor(110, 456, 7)}${flor(330, 420, 8)}${flor(360, 450, 9)}${flor(300, 470, 7)}
    ${arbol(340, 380, 22)}${arbol(36, 360, 20)}
    <path d="M110,112 L150,70 L190,112z" fill="#CFC9E8" stroke="#9EA2F9" stroke-width="3"/>
  </svg>`;
}
