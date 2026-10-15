// Visor 3D y realidad aumentada de una pieza (Etapa 5 del universo de Rosina).
// - Carga diferida: el componente <model-viewer> (1 MB, js/vendor/model-viewer.min.js) solo se descarga cuando la persona toca «Ver en 3D».
//   Antes se ve la foto de la pieza, así que la página pesa igual que sin 3D.
// - Sin servicios externos: la librería y el modelo salen del propio sitio. Un modelo con compresión Draco o KTX2 haría que la librería pida
//   su decodificador a gstatic.com; por eso los modelos se entregan sin esas compresiones (ver la guía del artista en 10-ETAPA-5-3D-AR.md).
// - Honestidad: si el modelo no carga, no hay WebGL o la escala no coincide con la medida real, se vuelve a la foto y no se ofrece la
//   realidad aumentada (verla a otro tamaño engañaría). Un modelo de «prueba» nunca se muestra en las páginas públicas.
import { CONFIG } from './config.js';

const LIBRERIA = '/js/vendor/model-viewer.min.js?v=1';
const TOLERANCIA_ESCALA = 0.08;   // el modelo puede diferir hasta un 8 % de la medida declarada
const ESPERA_MAX_MS = 25000;
const RUTA_GLB = /^\/modelos3d\/(?!.*\.\.)[\w\-./]+\.glb$/;   // solo la carpeta /modelos3d/ del propio sitio, sin «..»
const ORBITA = /^-?[\d.]+deg -?[\d.]+deg (auto|[\d.]+(%|m|cm|mm)?)$/;

let promesa = null;
export function cargarModelos() {
  if (!promesa) {
    promesa = fetch('/modelos3d/modelos.json')
      .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then((d) => (d && Array.isArray(d.modelos) ? d.modelos : []))
      .catch(() => []);
  }
  return promesa;
}

// Función pura (se prueba aparte): el modelo aprobado de una pieza del catálogo, o null.
export function modeloPublicado(modelos, itemId) {
  if (!CONFIG.VISOR_3D_ACTIVO || !itemId) return null;
  return (modelos || []).find((m) => m && m.publicado === true && m.revisado_por && m.revisado_en && m.origen !== 'prueba'
    && m.item_id === itemId && typeof m.glb === 'string' && RUTA_GLB.test(m.glb)) || null;
}

const cm = (n) => Number(n).toLocaleString('es-CO', { maximumFractionDigits: 1 });
export function medidaTexto(m) {
  const t = [m.ancho_cm, m.fondo_cm, m.alto_cm];
  return t.every((x) => Number(x) > 0) ? cm(t[0]) + ' × ' + cm(t[1]) + ' × ' + cm(t[2]) + ' cm (ancho × fondo × alto)' : '';
}
// ¿La medida del modelo (en metros) coincide con la declarada (en cm)? Función pura.
export function escalaCorrecta(dim, m, tolerancia) {
  const tol = tolerancia == null ? TOLERANCIA_ESCALA : tolerancia;
  const pares = [[dim.x, m.ancho_cm], [dim.y, m.alto_cm], [dim.z, m.fondo_cm]];
  return pares.every(([real, decl]) => Number(decl) > 0 && Math.abs(real * 100 - decl) / decl <= tol);
}

const nodo = (tag, clase, texto) => { const e = document.createElement(tag); if (clase) e.className = clase; if (texto != null) e.textContent = texto; return e; };
function evento(nombre, datos) { try { (window.dataLayer = window.dataLayer || []).push(Object.assign({ event: nombre }, datos || {})); } catch (e) { /* sin medición */ } }
function hayWebGL() { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } }

// raiz: contenedor vacío. modelo: entrada de modelos.json. opciones: { nombre, poster, itemId }.
export function montarVisor3D(raiz, modelo, opciones) {
  const o = Object.assign({ nombre: 'la pieza', poster: '', itemId: null }, opciones || {});
  const id = o.itemId || modelo.id || 'sin-id';
  const caja = nodo('div', 'v3-caja');
  const escena = nodo('div', 'v3-escena');
  const estado = nodo('p', 'v3-estado'); estado.setAttribute('role', 'status'); estado.setAttribute('aria-live', 'polite');
  const nota = nodo('p', 'v3-nota');
  const medida = medidaTexto(modelo);
  const notaNormal = 'Vista 3D aproximada: el color y los detalles pueden variar un poco respecto a la pieza tejida.' + (medida ? ' Medida real: ' + medida + '.' : '');
  nota.textContent = modelo.origen === 'prueba' ? 'MODELO DE PRUEBA generado por reglas: no es una pieza real. ' + (medida ? 'Medida declarada: ' + medida + '.' : '') : notaNormal;
  if (modelo.origen === 'prueba') nota.classList.add('v3-prueba');
  caja.append(escena, estado, nota);
  raiz.replaceChildren(caja);
  let visor = null, temporizador = null;

  function pintarFoto() {
    escena.replaceChildren();
    if (o.poster) {
      const f = document.createElement('img'); f.className = 'v3-poster'; f.src = o.poster; f.alt = 'Foto de ' + o.nombre; f.width = 520; f.height = 520; f.decoding = 'async';
      f.addEventListener('error', () => { f.style.visibility = 'hidden'; }); escena.append(f);
    }
    const b = nodo('button', 'v3-abrir', '🧊 Ver en 3D'); b.type = 'button'; b.addEventListener('click', abrir); escena.append(b);
  }
  function volverAFoto(mensaje, ok) {
    clearTimeout(temporizador);
    if (visor) { visor.remove(); visor = null; }
    pintarFoto();
    estado.textContent = mensaje || '';
    if (mensaje) estado.classList.add('v3-aviso'); else estado.classList.remove('v3-aviso');
    evento('visor_3d', { item_id: id, modo: 'foto', ok: ok !== false });
  }
  function fallar(razon) { volverAFoto('No pudimos mostrar el modelo 3D en este dispositivo. Te dejamos la foto de la pieza.', false); evento('visor_3d_error', { item_id: id, razon }); }

  async function abrir() {
    const boton = escena.querySelector('.v3-abrir');
    if (boton) boton.disabled = true;
    estado.classList.remove('v3-aviso');
    estado.textContent = 'Cargando el modelo 3D…';
    if (!hayWebGL()) return fallar('sin_webgl');
    try { await import(LIBRERIA); } catch (e) { return fallar('libreria'); }
    visor = document.createElement('model-viewer');
    visor.setAttribute('src', modelo.glb);
    visor.setAttribute('alt', 'Modelo 3D de ' + o.nombre + '. Arrástralo para girarlo.');
    if (o.poster) visor.setAttribute('poster', o.poster);
    visor.setAttribute('camera-controls', '');
    visor.setAttribute('touch-action', 'pan-y');
    visor.setAttribute('shadow-intensity', '1');
    visor.setAttribute('environment-image', 'neutral');
    visor.setAttribute('loading', 'eager');
    visor.setAttribute('reveal', 'auto');
    visor.setAttribute('ar', '');
    visor.setAttribute('ar-modes', 'webxr scene-viewer quick-look');
    visor.setAttribute('ar-scale', 'fixed');
    if (typeof modelo.camera_orbit === 'string' && ORBITA.test(modelo.camera_orbit)) visor.setAttribute('camera-orbit', modelo.camera_orbit);
    const ar = nodo('button', 'v3-ar', '👁️ Ver en tu espacio'); ar.type = 'button'; ar.setAttribute('slot', 'ar-button');
    ar.addEventListener('click', () => evento('visor_3d', { item_id: id, modo: 'ar', ok: true }));
    const cerrar = nodo('button', 'v3-cerrar', '← Volver a la foto'); cerrar.type = 'button'; cerrar.addEventListener('click', () => volverAFoto('', true));
    visor.append(ar);
    visor.addEventListener('error', () => fallar('modelo'));
    visor.addEventListener('load', () => {
      clearTimeout(temporizador);
      let escalaOk = true;
      try { escalaOk = escalaCorrecta(visor.getDimensions(), modelo); } catch (e) { escalaOk = false; }
      if (!escalaOk) { visor.removeAttribute('ar'); nota.textContent = modelo.origen === 'prueba' ? 'MODELO DE PRUEBA generado por reglas: no es una pieza real.' : 'Vista 3D aproximada: el color y los detalles pueden variar un poco respecto a la pieza tejida.'; }
      estado.textContent = escalaOk ? 'Arrástralo para girarlo. Con dos dedos haces zoom.' : 'Arrástralo para girarlo.';
      evento('visor_3d', { item_id: id, modo: '3d', ok: true, escala_ok: escalaOk });
    });
    escena.replaceChildren(visor, cerrar);
    temporizador = setTimeout(() => fallar('tiempo'), ESPERA_MAX_MS);
  }
  pintarFoto();
  return { abrir, volverAFoto: () => volverAFoto('', true), estado: () => ({ abierto: !!visor }) };
}
