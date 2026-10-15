// Catálogo real para el universo de Rosina: una sola petición por página, compartida por el recomendador y el configurador.
import { CONFIG } from './config.js';

let promesa = null;
export function cargarCatalogo() {
  if (!promesa) {
    promesa = fetch(CONFIG.SUPABASE_URL + '/rest/v1/rpc/obtener_regalos_web', { method: 'POST', headers: { apikey: CONFIG.SUPABASE_KEY, Authorization: 'Bearer ' + CONFIG.SUPABASE_KEY, 'Content-Type': 'application/json' }, body: '{}' })
      .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then((p) => { if (!Array.isArray(p) || !p.length) throw new Error('vacío'); return p; });
  }
  return promesa;
}

// Precio base de los «Amigurumi personalizado N cm» reales: { '13 cm': 85000, … }
export function preciosBase(productos) {
  const m = {};
  (productos || []).forEach((p) => { if (p.personalizable_base && p.tamano_cm != null) m[Math.round(p.tamano_cm) + ' cm'] = Number(p.precio); });
  return m;
}

// Página pública de una pieza (obtener_producto_publico): devuelve la pieza o null si no existe en el catálogo.
export async function cargarPieza(id) {
  const r = await fetch(CONFIG.SUPABASE_URL + '/rest/v1/rpc/obtener_producto_publico', { method: 'POST', headers: { apikey: CONFIG.SUPABASE_KEY, Authorization: 'Bearer ' + CONFIG.SUPABASE_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ p_id: id }) });
  if (!r.ok) throw new Error(r.status);
  const filas = await r.json();
  return Array.isArray(filas) && filas.length ? filas[0] : null;
}

