// Ficha del configurador «Rosina te ayuda a crear»: se recuerda solo en este dispositivo (localStorage), sin datos personales
// (únicamente las opciones elegidas y el texto de la idea) y por poco tiempo. La lee personaliza.html para precargar el formulario.
export const CLAVE_FICHA = 'lrFichaCrear';
const MAX_TEXTO = 2800;   // el formulario acepta hasta 3000 caracteres por campo

const texto = (v) => (typeof v === 'string' ? v.slice(0, MAX_TEXTO) : '');

export function guardarFicha(ficha, ahora) {
  try { localStorage.setItem(CLAVE_FICHA, JSON.stringify(Object.assign({}, ficha, { t: ahora || Date.now() }))); return true; } catch (e) { return false; }
}

// Devuelve la ficha si existe y no ha vencido; los textos se recortan y lo que no sea texto se descarta.
export function leerFicha(horas, ahora) {
  try {
    const f = JSON.parse(localStorage.getItem(CLAVE_FICHA) || 'null');
    if (!f || typeof f !== 'object' || typeof f.t !== 'number') return null;
    if ((ahora || Date.now()) - f.t > (horas || 24) * 3600 * 1000) { borrarFicha(); return null; }
    return { tipo: texto(f.tipo), tamano: texto(f.tamano), descripcion: texto(f.descripcion), mensaje: texto(f.mensaje), resumen: Array.isArray(f.resumen) ? f.resumen.map(texto).slice(0, 12) : [], estado: f.estado && typeof f.estado === 'object' ? f.estado : null, t: f.t };
  } catch (e) { return null; }
}

export function borrarFicha() { try { localStorage.removeItem(CLAVE_FICHA); } catch (e) { /* sin almacenamiento */ } }
