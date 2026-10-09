// Datos y ayudas compartidas de la Mercería (inicio y catálogo).
// Fuente única de productos: la función `obtener_merceria_web_v2` de Supabase (inventario del ERP; la v2 agrega la unidad del inventario).
// Regla comercial: las lanas y los hilos se venden por ovillo (madeja) completo, nunca por gramos sueltos.
// El ERP guarda el precio por gramo; aquí se convierte al precio del ovillo igual que en el carrito.

const URL_RPC = 'https://ngjoognzvehwjtpqwrqe.supabase.co/rest/v1/rpc/obtener_merceria_web_v2';
const LLAVE = 'sb_publishable_2TQ_piaHlSMHa79zjmOOXg_6bEwgkKD';

export const CATEGORIAS = {
  lanas: { id: 'lanas-merceria', nombre: 'Lanas' },
  hilos: { id: 'hilos-merceria', nombre: 'Hilos' },
  patrones: { id: 'patrones-merceria', nombre: 'Patrones de tejido' },
  agujas: { id: 'agujas-merceria', nombre: 'Agujas' },
  herrajes: { id: 'herrajes-merceria', nombre: 'Herrajes' },
  accesorios: { id: 'accesorios-merceria', nombre: 'Accesorios' },
  relleno: { id: 'relleno-merceria', nombre: 'Relleno' },
  otros: { id: 'otros-merceria', nombre: 'Otros materiales' },
};

export const normalizar = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
export const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const formatoCOP = (v) => '$' + Math.round(v).toLocaleString('es-CO');

const MATERIAL = { poliester: 'Poliéster', acrilico: 'Acrílico', algodon: 'Algodón', chenille: 'Chenille' };
const etiquetaMaterial = (m) => (m ? (MATERIAL[normalizar(m)] || m) : '');

export async function cargarProductos() {
  // El catálogo ya pide los datos en el <head>; si no, se piden aquí.
  if (window.__rpcLR && window.__rpcLR.obtener_merceria_web_v2) return await window.__rpcLR.obtener_merceria_web_v2;
  const r = await fetch(URL_RPC, { method: 'POST', headers: { apikey: LLAVE, Authorization: 'Bearer ' + LLAVE, 'Content-Type': 'application/json' }, body: '{}' });
  if (!r.ok) throw new Error('rpc ' + r.status);
  return await r.json();
}

// Convierte una fila del ERP en lo que muestran las tarjetas, la ficha y el carrito.
export function derivar(item) {
  const claveCat = CATEGORIAS[normalizar(item.categoria)] ? normalizar(item.categoria) : 'otros';
  const cat = CATEGORIAS[claveCat];
  const peso = item.peso_gramos ? Number(item.peso_gramos) : null;
  const porOvillo = !!peso && (claveCat === 'lanas' || claveCat === 'hilos');
  const precio = peso ? Math.round(Number(item.precio_gramo) * peso / 100) * 100 : Math.round(Number(item.precio_gramo));
  const digital = claveCat === 'patrones';
  // Existencias en unidades de venta: lo guardado en gramos (lanas e hilos) se convierte a ovillos completos; no se vende por gramos sueltos.
  const enGramos = (item.unidad_medida ? item.unidad_medida === 'gramo' : porOvillo) && !!peso;
  const unidades = digital ? Infinity : Math.max(0, Math.floor(enGramos ? Number(item.stock_actual) / peso : Number(item.stock_actual)) || 0);
  const disponible = digital || unidades >= 1;
  // La línea del producto ("Lana Chelin", "Lana Happy Chenille"…) viene al comienzo del nombre del ERP: «Lana Chelin - Marca Kusi Kusi - Color …»
  const m = /^(.*?)\s+-\s+Marca\s/i.exec(item.nombre || '');
  const linea = m ? m[1].trim() : (item.nombre || '').split(' - ')[0].trim();
  const marca = item.marca || '';
  const color = item.color || '';
  const material = etiquetaMaterial(item.material);
  const metros = (/(\d+(?:[.,]\d+)?)\s*metros/i.exec(item.nombre || '') || [])[1] || '';
  const comp = (/(\d+\s*%\s*[a-záéíóúñ]+)/i.exec(item.nombre || '') || [])[1] || '';
  const composicion = comp ? comp.replace(/\s*%\s*/, ' % ').replace(/poliester/i, 'poliéster').replace(/acrilico/i, 'acrílico').replace(/algodon/i, 'algodón') : '';
  const titulo = [linea, color].filter(Boolean).join(' — ') || item.nombre;
  const nombreCarrito = [linea, marca && linea.toLowerCase().indexOf(marca.toLowerCase()) < 0 ? marca : '', color ? '— ' + color : ''].filter(Boolean).join(' ').replace(/\s+—/, ' —') + (porOvillo ? ' (ovillo de ' + peso + ' g)' : '');
  return {
    id: item.id, claveCat, cat, categoria: item.categoria || '', peso, porOvillo, precio, digital, disponible, unidades,
    linea, marca, color, material, metros, composicion, titulo, nombreCarrito, nombreERP: item.nombre || '',
    foto: item.foto_url || '',
    busqueda: normalizar([item.nombre, marca, color, item.material, item.categoria, linea].join(' ')),
  };
}

// Productos listos para mostrar: sin los patrones digitales, solo los que sí se pueden pedir hoy.
export async function productosDisponibles() {
  const filas = (await cargarProductos()) || [];
  return filas.map(derivar).filter((p) => !p.digital && p.disponible);
}
