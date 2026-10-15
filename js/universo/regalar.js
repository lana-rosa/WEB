// «Rosina te ayuda a regalar»: recomendador por reglas sobre el catálogo real (RPC obtener_regalos_web).
// Sin IA y sin datos inventados: cada resultado sale de un producto del catálogo; el precio y la disponibilidad son los del ERP.
import { CONFIG, OCASIONES, DESTINATARIOS, TIPOS, PRESUPUESTOS, TAMANOS, DISPONIBILIDAD } from './config.js';

const entre = (v, lista, id) => { const x = lista.find((r) => r[0] === id); return !x || (v >= x[2] && v <= x[3]); };

// Función pura (se prueba aparte): devuelve los productos por sección según lo elegido.
export function recomendar(productos, sel, opciones) {
  const o = Object.assign({ usarEtiquetas: false, modoPropuestas: false }, opciones || {});
  const valida = (p) => o.modoPropuestas || p.etiquetas_revisadas;
  const ok = (p) => {
    if (p.personalizable_base || p.categoria_web === 'Complementos') return false;
    if (sel.tipo) { const t = TIPOS.find((x) => x[0] === sel.tipo); if (!t || t[2].indexOf(p.categoria_web) < 0) return false; }
    if (sel.presupuesto && !entre(Number(p.precio), PRESUPUESTOS, sel.presupuesto)) return false;
    if (sel.tamano && (p.tamano_cm == null || !entre(Number(p.tamano_cm), TAMANOS, sel.tamano))) return false;
    if (o.usarEtiquetas && sel.ocasion && !(valida(p) && p.ocasiones.indexOf(sel.ocasion) >= 0)) return false;
    if (o.usarEtiquetas && sel.destinatario && !(valida(p) && p.destinatarios.indexOf(sel.destinatario) >= 0)) return false;
    return true;
  };
  const lista = productos.filter(ok);
  const disponibles = lista.filter((p) => p.en_existencia);
  const encargo = sel.disponibilidad === 'ya' ? [] : lista.filter((p) => !p.en_existencia);
  // Ideas para personalizar: los tres «Amigurumi personalizado N cm» reales que cumplen presupuesto y tamaño elegidos.
  let ideas = [];
  if (sel.disponibilidad !== 'ya' && (!sel.tipo || sel.tipo === 'amigurumi')) {
    ideas = productos.filter((p) => p.personalizable_base
      && (!sel.presupuesto || entre(Number(p.precio), PRESUPUESTOS, sel.presupuesto))
      && (!sel.tamano || (p.tamano_cm != null && entre(Number(p.tamano_cm), TAMANOS, sel.tamano))));
  }
  return { disponibles, encargo, ideas };
}

export function puedeUsarEtiquetas(productos) {
  return productos.filter((p) => p.etiquetas_revisadas && (p.ocasiones.length || p.destinatarios.length)).length >= CONFIG.MIN_ETIQUETADOS;
}

const pesos = (n) => '$' + Math.round(Number(n)).toLocaleString('es-CO');
const nodo = (tag, clase, texto) => { const e = document.createElement(tag); if (clase) e.className = clase; if (texto != null) e.textContent = texto; return e; };
function evento(nombre, datos) { try { (window.dataLayer = window.dataLayer || []).push(Object.assign({ event: nombre }, datos || {})); } catch (e) { /* sin medición */ } }

export async function iniciarRegalar(raiz) {
  if (!raiz) return;
  if (!CONFIG.REGALAR_ACTIVO) { raiz.replaceChildren(nodo('p', 'ur-aviso', 'Muy pronto Rosina te ayudará a elegir un regalo.')); return; }
  const modoPropuestas = new URLSearchParams(location.search).get('etiquetas') === 'propuestas';
  const estado = nodo('p', 'ur-estado', 'Cargando los productos…'); estado.setAttribute('role', 'status');
  raiz.replaceChildren(estado);
  let productos = [];
  try {
    const r = await fetch(CONFIG.SUPABASE_URL + '/rest/v1/rpc/obtener_regalos_web', { method: 'POST', headers: { apikey: CONFIG.SUPABASE_KEY, Authorization: 'Bearer ' + CONFIG.SUPABASE_KEY, 'Content-Type': 'application/json' }, body: '{}' });
    if (!r.ok) throw new Error(r.status);
    productos = await r.json();
    if (!Array.isArray(productos) || !productos.length) throw new Error('vacío');
  } catch (e) { return pintarError(raiz); }
  const usarEtiquetas = modoPropuestas || puedeUsarEtiquetas(productos);
  const sel = {};
  const grupos = [
    ['tipo', '¿Qué tipo de regalo buscas?', TIPOS.map((x) => [x[0], x[1]])],
    ['presupuesto', '¿Cuánto quieres invertir?', PRESUPUESTOS.map((x) => [x[0], x[1]])],
    ['tamano', '¿De qué tamaño?', TAMANOS.map((x) => [x[0], x[1]])],
    ['disponibilidad', '¿Lo necesitas ya?', DISPONIBILIDAD],
  ];
  if (usarEtiquetas) { grupos.splice(0, 0, ['destinatario', '¿Para quién es?', DESTINATARIOS], ['ocasion', '¿Qué ocasión celebran?', OCASIONES]); }

  const marco = nodo('div', 'ur-marco');
  if (modoPropuestas) marco.append(nodo('p', 'ur-aviso', 'Vista previa: se están usando etiquetas propuestas que todavía no han sido revisadas. No es lo que ve el público.'));
  const filtros = nodo('div', 'ur-filtros');
  const botones = {};
  grupos.forEach(([clave, titulo, opciones]) => {
    const fs = nodo('fieldset', 'ur-grupo'); fs.append(nodo('legend', null, titulo));
    const fila = nodo('div', 'ur-chips');
    opciones.forEach(([id, texto]) => {
      const b = nodo('button', 'ur-chip', texto); b.type = 'button'; b.setAttribute('aria-pressed', 'false'); b.dataset.clave = clave; b.dataset.id = id;
      b.addEventListener('click', () => {
        const activo = sel[clave] === id;
        if (activo) delete sel[clave]; else sel[clave] = id;
        fila.querySelectorAll('.ur-chip').forEach((x) => x.setAttribute('aria-pressed', String(sel[clave] === x.dataset.id)));
        evento('regalar_paso', { paso: clave, valor_categoria: activo ? 'ninguno' : id });
        pintar();
      });
      (botones[clave] = botones[clave] || []).push(b); fila.append(b);
    });
    fs.append(fila); filtros.append(fs);
  });
  const reiniciar = nodo('button', 'ur-reiniciar', 'Empezar de nuevo'); reiniciar.type = 'button';
  reiniciar.addEventListener('click', () => { Object.keys(sel).forEach((k) => delete sel[k]); raiz.querySelectorAll('.ur-chip').forEach((x) => x.setAttribute('aria-pressed', 'false')); pintar(); });
  const resumen = nodo('p', 'ur-resumen'); resumen.setAttribute('role', 'status'); resumen.setAttribute('aria-live', 'polite');
  const resultados = nodo('div', 'ur-resultados');
  marco.append(filtros, reiniciar, resumen, resultados);
  raiz.replaceChildren(marco);

  const verMas = {};
  function seccion(clave, titulo, nota, items, esIdea) {
    if (!items.length) return null;
    const sec = nodo('section', 'ur-seccion'); sec.setAttribute('aria-label', titulo);
    sec.append(nodo('h3', null, titulo + ' (' + items.length + ')'), nodo('p', 'ur-nota', nota));
    const grid = nodo('div', 'ur-grid');
    const limite = verMas[clave] ? items.length : CONFIG.RESULTADOS_POR_SECCION;
    items.slice(0, limite).forEach((p) => grid.append(tarjeta(p, clave, esIdea)));
    sec.append(grid);
    if (items.length > limite) { const m = nodo('button', 'ur-mas', 'Ver los ' + (items.length - limite) + ' restantes'); m.type = 'button'; m.addEventListener('click', () => { verMas[clave] = true; pintar(); }); sec.append(m); }
    return sec;
  }
  function tarjeta(p, clave, esIdea) {
    // La ficha de la tienda (también la de los amigurumis personalizados) es la que lleva al formulario o al carrito.
    const a = nodo('a', 'ur-card'); a.href = '/tienda.html?producto=' + encodeURIComponent(p.id);
    const foto = document.createElement('img'); foto.src = '/img/productos/' + encodeURIComponent(p.foto_url); foto.alt = p.nombre; foto.loading = 'lazy'; foto.decoding = 'async'; foto.width = 400; foto.height = 500;
    foto.addEventListener('error', () => { foto.style.visibility = 'hidden'; });
    a.append(foto, nodo('span', 'ur-nombre', p.nombre), nodo('span', 'ur-precio', (esIdea ? 'Desde ' : '') + pesos(p.precio) + ' COP'));
    if (esIdea) a.append(nodo('span', 'ur-estado-prod ur-idea', 'Se teje a partir de tu foto o idea · las fotos son de referencia'));
    else a.append(nodo('span', 'ur-estado-prod ' + (p.en_existencia ? 'ur-ya' : 'ur-enc'), p.en_existencia ? 'En existencia' : 'Por encargo' + (p.tiempo_elaboracion ? ' · ' + p.tiempo_elaboracion : '')));
    if (p.es_personaje && !esIdea) a.append(nodo('span', 'ur-pj', 'Pieza artesanal inspirada en un personaje; no es un producto oficial.'));
    a.addEventListener('click', () => evento('regalar_abre_ficha', { item_id: p.id, seccion: clave }));
    return a;
  }
  let temporizador = null;
  function pintar() {
    const r = recomendar(productos, sel, { usarEtiquetas, modoPropuestas });
    const total = r.disponibles.length + r.encargo.length + r.ideas.length;
    resultados.replaceChildren();
    if (!r.disponibles.length && !r.encargo.length) {
      const vacio = nodo('div', 'ur-vacio');
      vacio.append(nodo('p', null, 'No encontré productos con esa combinación. Prueba quitar un filtro' + (r.ideas.length ? ' o mira las ideas para personalizar.' : ', o cuéntanos tu idea y la tejemos.')));
      resultados.append(vacio);
    }
    [seccion('disponibles', 'Disponibles ya', 'Hay unidades listas en nuestro taller (según el inventario).', r.disponibles, false),
     seccion('encargo', 'Por encargo', 'Los tejemos cuando los pides; el tiempo de elaboración es el que ya indica cada ficha.', r.encargo, false),
     seccion('ideas', 'Ideas para personalizar', 'Tejemos un amigurumi a partir de tu foto o tu idea. El precio es el base de una pieza con detalle normal; te confirmamos antes de empezar si necesita más.', r.ideas, true)]
      .forEach((s) => { if (s) resultados.append(s); });
    const cierre = nodo('div', 'ur-cierre');
    const p1 = nodo('p'); p1.append('¿No ves lo que imaginas? ');
    const l1 = nodo('a', null, 'Cuéntanos tu idea'); l1.href = '/personaliza.html#form-personalizado'; const l2 = nodo('a', null, 'escríbenos por WhatsApp'); l2.href = 'https://wa.me/' + CONFIG.WHATSAPP + '?text=' + encodeURIComponent('Hola Lana Rosa 💕 Estoy buscando un regalo.'); l2.target = '_blank'; l2.rel = 'noopener';
    p1.append(l1, ' o ', l2, '.'); cierre.append(p1); resultados.append(cierre);
    resumen.textContent = total ? (r.disponibles.length + ' disponibles ya, ' + r.encargo.length + ' por encargo y ' + r.ideas.length + ' ideas para personalizar.') : 'Sin resultados con esos filtros.';
    clearTimeout(temporizador);
    if (Object.keys(sel).length) temporizador = setTimeout(() => evento('regalar_resultado', { n_disponibles: r.disponibles.length, n_encargo: r.encargo.length, n_ideas: r.ideas.length, sin_resultados: !r.disponibles.length && !r.encargo.length }), 800);
  }
  evento('universo_inicio', { recorrido: 'regalar' });
  pintar();
}

function pintarError(raiz) {
  const d = nodo('div', 'ur-vacio');
  d.append(nodo('p', null, 'No pude cargar los productos ahora.'));
  const a = nodo('a', null, 'Escríbenos por WhatsApp y te ayudamos a elegir'); a.href = 'https://wa.me/' + CONFIG.WHATSAPP + '?text=' + encodeURIComponent('Hola Lana Rosa 💕 Estoy buscando un regalo.'); a.target = '_blank'; a.rel = 'noopener';
  const p = nodo('p'); p.append(a, ' o ', Object.assign(nodo('a', null, 'mira toda la tienda'), { href: '/tienda.html' }), '.');
  d.append(p); raiz.replaceChildren(d);
}
