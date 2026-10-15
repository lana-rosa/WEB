// Permite probar la función de Rosina (herramientas/rosina-web/index.ts) con Node: los imports «jsr:» se reemplazan por un doble de prueba.
export async function resolve(specifier, context, siguiente) {
  if (specifier.startsWith('jsr:@supabase/supabase-js')) return { url: new URL('./supabase-doble.mjs', import.meta.url).href, shortCircuit: true };
  return siguiente(specifier, context);
}
