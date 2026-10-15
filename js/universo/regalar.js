// «Rosina te ayuda a regalar»: recomendador por reglas sobre el catálogo real (RPC obtener_regalos_web).
// Sin IA y sin datos inventados: cada resultado sale de un producto del catálogo; el precio y la disponibilidad son los del ERP.
import { CONFIG, OCASIONES, DESTINATARIOS, TIPOS, PRESUPUESTOS, TAMANOS, DISPONIBILIDAD } from './config.js';
import { cargarCatalogo, cargarColores } from './datos.js';
import { COLORES, puntajeColor, perfilDeArchivo } from './colores.js';

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
    if (sel.color && !(p.colores && p.colores.indexOf(sel.color) >= 0)) return false;
    if (o.usarEtiquetas && sel.ocasion && !(valida(p) && p.ocasiones.indexOf(sel.ocasion) >= 0)) return false;
    if (o.usarEtiquetas && sel.destinatario && !(valida(p) && p.destinatarios.indexOf(sel.destinatario) >= 0)) return false;
    return true;
  };
  // Con un color elegido, primero las piezas cuyo color principal es ese y luego las que lo llevan como detalle (el orden del catálogo se conserva dentro de cada grupo).
  const lista = productos.filter(ok);
  if (sel.color) lista.sort((a, b) => puntajeColor(b.colores, sel.color) - puntajeColor(a.colores, sel.color));
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
    productos = await cargarCatalogo();
  } catch (e) { return pintarError(raiz); }
  // Etapa 4: colores de las fotos (si no cargan, no hay filtro de color y todo lo demás funciona igual).
  const mapaColores = await cargarColores();
  productos.forEach((p) => { p.colores = mapaColores[p.foto_url] || []; });
  const coloresHay = {}; productos.forEach((p) => p.colores.forEach((c) => { coloresHay[c] = (coloresHay[c] || 0) + 1; }));
  const coloresOfrecidos = COLORES.filter((c) => coloresHay[c[0]]);
  const usarEtiquetas = modoPropuestas || puedeUsarEtiquetas(productos);
  const sel = {};
  // Cada pregunta es una lista desplegable (con su etiqueta) y la primera opción significa «sin filtro».
  const grupos = [
    ['tipo', '¿Qué tipo de regalo buscas?', 'Todos los tipos', TIPOS.map((x) => [x[0], x[1]])],
    ['presupuesto', '¿Cuánto quieres invertir?', 'Cualquier presupuesto', PRESUPUESTOS.map((x) => [x[0], x[1]])],
    ['tamano', '¿De qué tamaño?', 'Cualquier tamaño', TAMANOS.map((x) => [x[0], x[1]])],
    ...(coloresOfrecidos.length ? [['color', '¿Qué color te gusta?', 'Cualquier color', coloresOfrecidos.map((c) => [c[0], c[1]])]] : []),
    ['disponibilidad', '¿Lo necesitas ya?', 'No es urgente', DISPONIBILIDAD],
  ];
  if (usarEtiquetas) {
    // Solo se ofrecen las opciones que al menos un producto tiene (con etiquetas revisadas; en la vista previa, también las propuestas): así ninguna lista lleva a un callejón sin salida.
    const conEtiqueta = productos.filter((p) => modoPropuestas || p.etiquetas_revisadas);
    const hay = (campo) => { const s = {}; conEtiqueta.forEach((p) => p[campo].forEach((x) => { s[x] = true; })); return (par) => !!s[par[0]]; };
    grupos.splice(0, 0, ['destinatario', '¿Para quién es?', 'Para cualquiera', DESTINATARIOS.filter(hay('destinatarios'))], ['ocasion', '¿Qué ocasión celebran?', 'Cualquier ocasión', OCASIONES.filter(hay('ocasiones'))]);
  }

  const marco = nodo('div', 'ur-marco');
  if (modoPropuestas) marco.append(nodo('p', 'ur-aviso', 'Vista previa: se están usando etiquetas propuestas que todavía no han sido revisadas. No es lo que ve el público.'));
  // Simple a la vista: solo tres preguntas; el resto (ocasión, tamaño, color, urgencia y la foto) va en «Más opciones».
  const PRINCIPALES = ['destinatario', 'tipo', 'presupuesto'];
  const filtros = nodo('div', 'ur-filtros');
  const filtrosExtra = nodo('div', 'ur-filtros');
  const extra = nodo('details', 'ur-opciones'); const extraTitulo = nodo('summary', null, 'Más opciones'); extra.append(extraTitulo, filtrosExtra);
  const listas = {};
  grupos.forEach(([clave, titulo, sinFiltro, opciones]) => {
    const campo = nodo('div', 'ur-grupo');
    const lista = nodo('select', 'ur-select'); lista.id = 'ur-' + clave; lista.dataset.clave = clave;
    const et = nodo('label', null, titulo); et.htmlFor = lista.id;
    listas[clave] = lista;
    lista.append(Object.assign(nodo('option', null, sinFiltro), { value: '' }));
    opciones.forEach(([id, texto]) => { const o = Object.assign(nodo('option', null, texto), { value: id }); o.dataset.base = texto; lista.append(o); });
    lista.addEventListener('change', () => {
      if (lista.value) sel[clave] = lista.value; else delete sel[clave];
      lista.classList.toggle('ur-elegido', !!lista.value);
      evento('regalar_paso', { paso: clave, valor_categoria: lista.value || 'ninguno' });
      pintar();
    });
    campo.append(et, lista); (PRINCIPALES.indexOf(clave) >= 0 ? filtros : filtrosExtra).append(campo);
  });
  const reiniciar = nodo('button', 'ur-reiniciar', 'Empezar de nuevo'); reiniciar.type = 'button';
  const fotoBox = listas.color ? montarFotoReferencia() : null;
  reiniciar.addEventListener('click', () => { Object.keys(sel).forEach((k) => delete sel[k]); raiz.querySelectorAll('.ur-select').forEach((x) => { x.value = ''; x.classList.remove('ur-elegido'); }); if (fotoBox) fotoBox.limpiar(); pintar(); });
  const resumen = nodo('p', 'ur-resumen'); resumen.setAttribute('role', 'status'); resumen.setAttribute('aria-live', 'polite');
  const resultados = nodo('div', 'ur-resultados');
  if (fotoBox) extra.append(fotoBox.caja);
  marco.append(filtros, extra, reiniciar, resumen, resultados);
  raiz.replaceChildren(marco);

  const verMas = {};
  function seccion(clave, titulo, nota, items, esIdea) {
    if (!items.length) return null;
    const sec = nodo('section', 'ur-seccion'); sec.setAttribute('aria-label', titulo);
    sec.append(nodo('h3', null, titulo + ' (' + items.length + ')'), nodo('p', 'ur-nota', nota));
    if (!esIdea && items.some((p) => p.es_personaje)) sec.append(nodo('p', 'ur-nota ur-pj-nota', 'Las piezas inspiradas en un personaje son artesanales; no son productos oficiales.'));
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
    if (!esIdea && p.colores && p.colores.length) {
      const puntos = nodo('span', 'ur-puntos'); puntos.setAttribute('role', 'img');
      puntos.setAttribute('aria-label', 'Colores: ' + p.colores.map((c) => (COLORES.find((x) => x[0] === c) || [0, c])[1]).join(', '));
      p.colores.forEach((c) => { const x = COLORES.find((y) => y[0] === c); if (x) { const s = nodo('i'); s.style.background = x[2]; s.setAttribute('aria-hidden', 'true'); puntos.append(s); } });
      a.append(puntos);
    }
    if (esIdea) a.append(nodo('span', 'ur-estado-prod ur-idea', 'Se teje a partir de tu foto o idea · las fotos son de referencia'));
    else a.append(nodo('span', 'ur-estado-prod ' + (p.en_existencia ? 'ur-ya' : 'ur-enc'), p.en_existencia ? 'En existencia' : 'Por encargo' + (p.tiempo_elaboracion ? ' · ' + p.tiempo_elaboracion : '')));
    a.addEventListener('click', () => evento('regalar_abre_ficha', { item_id: p.id, seccion: clave }));
    return a;
  }
  // «Busca por una foto»: se calculan los colores de la foto en este dispositivo (nada se sube ni se guarda) y se elige uno para filtrar.
  function montarFotoReferencia() {
    const caja = nodo('div', 'ur-foto');
    const entrada = document.createElement('input'); entrada.type = 'file'; entrada.accept = 'image/*'; entrada.id = 'ur-foto-entrada'; entrada.className = 'ur-foto-entrada';
    const boton = nodo('label', 'ur-foto-btn', '📷 Buscar por los colores de una foto'); boton.htmlFor = entrada.id;
    const nota = nodo('p', 'ur-nota ur-foto-nota', 'Elige una foto de referencia (un peluche, una prenda, una decoración…) y buscamos piezas de sus colores. La foto se queda en tu dispositivo: no se envía ni se guarda.');
    const salida = nodo('div', 'ur-foto-salida'); salida.setAttribute('aria-live', 'polite');
    caja.append(boton, entrada, nota, salida);
    let urlVista = null;
    function limpiar() { if (urlVista) { URL.revokeObjectURL(urlVista); urlVista = null; } salida.replaceChildren(); entrada.value = ''; }
    function elegirColor(id) {
      listas.color.value = id; listas.color.classList.toggle('ur-elegido', !!id);
      if (id) sel.color = id; else delete sel.color;
      evento('regalar_paso', { paso: 'color', valor_categoria: id || 'ninguno', origen: 'foto' });
      salida.querySelectorAll('.ur-muestra').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.color === id)));
      pintar();
    }
    entrada.addEventListener('change', async () => {
      const archivo = entrada.files && entrada.files[0];
      if (!archivo) return;
      salida.replaceChildren(nodo('p', 'ur-nota', 'Mirando los colores de tu foto…'));
      if (!/^image\//.test(archivo.type) || archivo.size > 25 * 1024 * 1024) { salida.replaceChildren(nodo('p', 'ur-nota', 'Elige una imagen (JPG, PNG o WebP) de menos de 25 MB.')); return; }
      let perfil;
      try { perfil = await perfilDeArchivo(archivo); } catch (e) { salida.replaceChildren(nodo('p', 'ur-nota', 'No pude leer esa foto. Prueba con otra (JPG, PNG o WebP).')); return; }
      if (!perfil.colores || !perfil.colores.length) { salida.replaceChildren(nodo('p', 'ur-nota', 'No pude distinguir colores en esa foto. Prueba con otra en la que se vea bien lo que quieres imitar.')); return; }
      const posibles = perfil.colores.filter((c) => coloresHay[c]);
      evento('regalar_foto_color', { n_colores: (perfil.colores || []).length, n_con_piezas: posibles.length });
      if (urlVista) URL.revokeObjectURL(urlVista);
      urlVista = URL.createObjectURL(archivo);
      const vista = document.createElement('img'); vista.className = 'ur-foto-vista'; vista.src = urlVista; vista.alt = 'Tu foto de referencia'; vista.width = 64; vista.height = 64;
      const cuerpo = nodo('div', 'ur-foto-cuerpo');
      if (!posibles.length) { cuerpo.append(nodo('p', 'ur-nota', 'En tu foto veo colores que todavía no tenemos en piezas. Elige un color de la lista o cuéntanos tu idea.')); salida.replaceChildren(vista, cuerpo); return; }
      cuerpo.append(nodo('p', 'ur-foto-titulo', 'Colores que veo en tu foto: elige uno para buscar'));
      const fila = nodo('div', 'ur-muestras');
      posibles.forEach((id) => {
        const c = COLORES.find((x) => x[0] === id);
        const b = nodo('button', 'ur-muestra'); b.type = 'button'; b.dataset.color = id; b.setAttribute('aria-pressed', 'false');
        const punto = nodo('i'); punto.style.background = c[2]; punto.setAttribute('aria-hidden', 'true');
        b.append(punto, c[1]); b.addEventListener('click', () => elegirColor(id)); fila.append(b);
      });
      cuerpo.append(fila); salida.replaceChildren(vista, cuerpo);
      elegirColor(posibles[0]);
    });
    return { caja, limpiar };
  }
  // Ninguna lista debe llevar a un callejón sin salida: con lo ya elegido, las opciones que no darían ningún producto se apagan («sin piezas»).
  const cuantos = (selx) => { const x = recomendar(productos, selx, { usarEtiquetas, modoPropuestas }); return x.disponibles.length + x.encargo.length + x.ideas.length; };
  function actualizarListas() {
    Object.keys(listas).forEach((clave) => {
      Array.prototype.forEach.call(listas[clave].options, (o) => {
        if (!o.value) return;
        const sinPiezas = o.value !== sel[clave] && cuantos(Object.assign({}, sel, { [clave]: o.value })) === 0;
        o.disabled = sinPiezas;
        o.textContent = o.dataset.base + (sinPiezas ? ' (sin piezas)' : '');
      });
    });
  }
  function quitarFiltro(clave) {
    delete sel[clave]; listas[clave].value = ''; listas[clave].classList.remove('ur-elegido');
    if (clave === 'color' && fotoBox) fotoBox.limpiar();
    pintar();
  }
  let temporizador = null;
  function pintar() {
    const r = recomendar(productos, sel, { usarEtiquetas, modoPropuestas });
    const total = r.disponibles.length + r.encargo.length + r.ideas.length;
    resultados.replaceChildren();
    if (!r.disponibles.length && !r.encargo.length) {
      const vacio = nodo('div', 'ur-vacio');
      vacio.append(nodo('p', null, 'No encontré productos con esa combinación' + (r.ideas.length ? '; mira las ideas para personalizar o quita un filtro:' : '. Quita uno de los filtros para ver más:')));
      const fila = nodo('div', 'ur-quitar');
      Object.keys(sel).forEach((clave) => {
        const op = Array.prototype.find.call(listas[clave].options, (o) => o.value === sel[clave]);
        const b = nodo('button', 'ur-quitar-btn', 'Quitar «' + (op ? op.dataset.base : sel[clave]) + '»'); b.type = 'button';
        b.addEventListener('click', () => quitarFiltro(clave)); fila.append(b);
      });
      vacio.append(fila);
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
    actualizarListas();
    const nExtra = Object.keys(sel).filter((k) => PRINCIPALES.indexOf(k) < 0).length;
    extraTitulo.textContent = 'Más opciones' + (nExtra ? ' (' + nExtra + ' elegida' + (nExtra > 1 ? 's' : '') + ')' : '');
    clearTimeout(temporizador);
    if (Object.keys(sel).length) temporizador = setTimeout(() => evento('regalar_resultado', { n_disponibles: r.disponibles.length, n_encargo: r.encargo.length, n_ideas: r.ideas.length, sin_resultados: !r.disponibles.length && !r.encargo.length }), 800);
  }
  // Preselección desde la dirección (?tipo=peluche&presupuesto=p2, p. ej. desde el inicio): solo se aceptan valores que existen en la lista.
  const params = new URLSearchParams(location.search);
  Object.keys(listas).forEach((clave) => {
    const v = params.get(clave);
    if (v && Array.prototype.some.call(listas[clave].options, (o) => o.value === v)) { listas[clave].value = v; listas[clave].classList.add('ur-elegido'); sel[clave] = v; }
  });
  if (Object.keys(sel).some((k) => PRINCIPALES.indexOf(k) < 0)) extra.open = true;
  evento('universo_inicio', { recorrido: 'regalar', con_filtros: Object.keys(sel).length });
  pintar();
}

function pintarError(raiz) {
  const d = nodo('div', 'ur-vacio');
  d.append(nodo('p', null, 'No pude cargar los productos ahora.'));
  const a = nodo('a', null, 'Escríbenos por WhatsApp y te ayudamos a elegir'); a.href = 'https://wa.me/' + CONFIG.WHATSAPP + '?text=' + encodeURIComponent('Hola Lana Rosa 💕 Estoy buscando un regalo.'); a.target = '_blank'; a.rel = 'noopener';
  const p = nodo('p'); p.append(a, ' o ', Object.assign(nodo('a', null, 'mira toda la tienda'), { href: '/tienda.html' }), '.');
  d.append(p); raiz.replaceChildren(d);
}
