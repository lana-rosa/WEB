// Página pública de una pieza (/p/?i=<id>), la que abre el código QR de la etiqueta o de la tarjeta del pedido (Etapa 3).
// Muestra solo lo que la tienda ya publica más lo que el taller aprobó (historia y cuidados validados). Sin cuentas ni datos personales.
import { CONFIG } from './config.js';
import { cargarPieza } from './datos.js';

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const ORIGENES = ['etiqueta', 'tarjeta', 'estanteria'];
// Cuidados que el sitio ya publica para todas las piezas (guías de la Revista: «Cómo cuidar y lavar tus prendas y peluches tejidos»
// y «Cómo cuidar tu amigurumi para que dure toda la vida»). No se agrega nada nuevo.
export const CUIDADOS_GENERALES = [
  ['secadora', 'No uses secadora.'],
  ['sombra', 'Sécala a la sombra, lejos del sol directo.'],
  ['humedad', 'Guárdala limpia y seca, lejos de la humedad.'],
  ['hilito', 'Si se suelta un hilito, no tires de él: escríbenos por WhatsApp y lo revisamos.'],
];
export const GUIA_CUIDADOS = '/revista.html#cuidar-lavar-tejidos';
export const RESENAS = 'https://share.google/n6K8HLUVxId3Km0k4';

const sinTildes = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const nodo = (tag, clase, texto) => { const e = document.createElement(tag); if (clase) e.className = clase; if (texto != null) e.textContent = texto; return e; };
function evento(nombre, datos) { try { (window.dataLayer = window.dataLayer || []).push(Object.assign({ event: nombre }, datos || {})); } catch (e) { /* sin medición */ } }

// Función pura (se prueba aparte): los cuidados de la pieza y los generales que no repiten lo que ya dice la pieza.
export function cuidadosParaMostrar(cuidadosPieza) {
  const propios = (Array.isArray(cuidadosPieza) ? cuidadosPieza : []).map((x) => String(x).trim()).filter(Boolean);
  const dichos = sinTildes(propios.join(' '));
  const generales = CUIDADOS_GENERALES.filter(([clave]) => dichos.indexOf(clave) < 0).map((x) => x[1]);
  return { propios, generales };
}

export function leerParametros(busqueda) {
  const q = new URLSearchParams(busqueda || '');
  const i = q.get('i') || '';
  const o = q.get('o') || '';
  return { id: UUID.test(i) ? i.toLowerCase() : '', origen: ORIGENES.indexOf(o) >= 0 ? o : 'qr' };
}

export async function iniciarPieza(raiz) {
  if (!raiz) return;
  const { id, origen } = leerParametros(location.search);
  let pieza = null; let noEncontrada = false;
  if (CONFIG.QR_ACTIVO && id) {
    try { pieza = await cargarPieza(id); if (!pieza) noEncontrada = true; } catch (e) { pieza = null; }
  }
  evento('qr_visita', { item_id: pieza ? pieza.id : 'generico', origen });
  pintar(raiz, pieza, noEncontrada);
}

function pintar(raiz, pieza, noEncontrada) {
  const marco = nodo('div', 'pz-marco');
  const cab = nodo('header', 'pz-cab');
  const av = document.createElement('img'); av.src = '/img/mini/rosina-abrazo.webp'; av.alt = ''; av.width = 96; av.height = 96; av.className = 'pz-rosina';
  const tx = nodo('div', 'pz-cab-texto');
  tx.append(nodo('p', 'pz-eyebrow', pieza ? 'Tu pieza de Lana Rosa' : 'Lana Rosa Crochet'));
  tx.append(nodo('h1', null, pieza ? pieza.nombre : 'Cuida tu pieza de Lana Rosa'));
  tx.append(nodo('p', 'pz-sub', 'Tejida a mano en Villamaría, Caldas. Con estos cuidados te acompañará por mucho tiempo.'));
  cab.append(av, tx); marco.append(cab);
  if (noEncontrada) marco.append(nodo('p', 'pz-aviso', 'No encontramos esa pieza en el catálogo, pero estos cuidados sirven para todas nuestras piezas.'));

  if (pieza) {
    const prod = nodo('section', 'pz-prod'); prod.setAttribute('aria-label', 'Tu pieza');
    if (pieza.foto_url) { const f = document.createElement('img'); f.src = '/img/productos/' + encodeURIComponent(pieza.foto_url); f.alt = pieza.nombre; f.width = 400; f.height = 500; f.decoding = 'async'; f.addEventListener('error', () => { f.style.visibility = 'hidden'; }); prod.append(f); }
    const datos = nodo('div', 'pz-datos');
    if (pieza.categoria_web) datos.append(nodo('p', 'pz-cat', pieza.categoria_web));
    const specs = Array.isArray(pieza.especificaciones_web) ? pieza.especificaciones_web : [];
    if (specs.length || pieza.material_notas) {
      const ul = nodo('ul', 'pz-specs'); specs.forEach((s) => ul.append(nodo('li', null, String(s)))); if (pieza.material_notas) ul.append(nodo('li', null, 'Material: ' + pieza.material_notas));
      datos.append(ul);
    }
    prod.append(datos); marco.append(prod);
  }

  const { propios, generales } = cuidadosParaMostrar(pieza ? pieza.cuidados : []);
  const cu = nodo('section', 'pz-bloque'); cu.setAttribute('aria-labelledby', 'pz-cuidados');
  cu.append(Object.assign(nodo('h2', null, 'Cuidados'), { id: 'pz-cuidados' }));
  if (pieza && pieza.cuidados_validados) cu.append(nodo('p', 'pz-sello', '✔ Revisados por el taller para esta pieza'));
  const ul = nodo('ul', 'pz-lista'); propios.concat(generales).forEach((c) => ul.append(nodo('li', null, c))); cu.append(ul);
  const guia = nodo('a', 'pz-enlace', 'Ver la guía completa de cuidados →'); guia.href = GUIA_CUIDADOS; cu.append(guia);
  marco.append(cu);

  if (pieza && pieza.historia) {
    const hi = nodo('section', 'pz-bloque'); hi.setAttribute('aria-labelledby', 'pz-historia');
    hi.append(Object.assign(nodo('h2', null, 'Su historia'), { id: 'pz-historia' }), nodo('p', 'pz-historia', pieza.historia));
    marco.append(hi);
  }

  const ac = nodo('section', 'pz-acciones'); ac.setAttribute('aria-label', 'Qué más puedes hacer');
  const wa = nodo('a', 'pz-boton pz-wa', 'Escríbenos por WhatsApp'); wa.target = '_blank'; wa.rel = 'noopener';
  wa.href = 'https://wa.me/' + CONFIG.WHATSAPP + '?text=' + encodeURIComponent('Hola Lana Rosa 💕 Tengo una pregunta sobre ' + (pieza ? 'mi pieza «' + pieza.nombre + '».' : 'los cuidados de mi pieza.'));
  const re = nodo('a', 'pz-boton', 'Cuéntanos cómo te fue'); re.href = RESENAS; re.target = '_blank'; re.rel = 'noopener';
  const rg = nodo('a', 'pz-boton', 'Regala o consiéntete otra pieza'); rg.href = '/universo-rosina.html#regalar';
  const pe = nodo('a', 'pz-boton', 'Personaliza el tuyo'); pe.href = '/personaliza.html';
  ac.append(wa, re, rg, pe); marco.append(ac);
  marco.append(nodo('p', 'pz-pie', 'Gracias por llevarte un pedacito de nuestro taller 🐑'));
  raiz.replaceChildren(marco);
}
