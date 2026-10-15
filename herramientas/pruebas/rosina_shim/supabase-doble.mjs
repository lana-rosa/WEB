// Doble de prueba de @supabase/supabase-js: guarda en memoria lo que la función lee y escribe (no toca ninguna base real).
// El estado vive en globalThis.__sb: { rpc: {nombre: datos | () => ({data, error})}, conteos: {porIp, global}, llamadas: [...] }
export function createClient() {
  const S = () => globalThis.__sb;
  const registrar = (tipo, datos) => S().llamadas.push({ tipo, ...datos });
  return {
    rpc(nombre, args) {
      registrar('rpc', { nombre, args });
      const r = S().rpc[nombre];
      if (typeof r === 'function') return Promise.resolve(r(args));
      if (r === undefined) return Promise.resolve({ data: null, error: { message: 'no existe ' + nombre } });
      return Promise.resolve({ data: r, error: null });
    },
    from(tabla) {
      return {
        select(_c, opciones) {
          const q = { eq: () => q, gte: (_c2, valor) => Promise.resolve({ count: opciones && opciones.head ? (q._ip ? S().conteos.porIp : S().conteos.global) : null }) };
          q.eq = () => { q._ip = true; return q; };
          return q;
        },
        insert(fila) { registrar('insert', { tabla, fila }); return Promise.resolve({ error: null }); },
        delete() { return { lt: (campo, valor) => { registrar('delete', { tabla, campo, valor }); return Promise.resolve({ error: null }); } }; },
      };
    },
  };
}
