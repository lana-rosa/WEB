// Descarga de un patrón comprado: valida la sesión, comprueba que la persona lo compró y devuelve un enlace firmado y de corta duración.
// { item_id } con la sesión de la clienta (Authorization: Bearer ...) -> { url, nombre }
// Los PDF viven en el bucket privado "patrones"; la tabla patrones_archivos dice qué archivo corresponde a cada producto.
// (Copia de la función desplegada en Supabase; verify_jwt = false porque la sesión se valida dentro.)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': 'https://lanarosacrochet.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);
  let body: any; try { body = await req.json(); } catch { return json({ error: 'Solicitud inválida' }, 400); }
  const itemId = String(body?.item_id || '');
  if (!/^[0-9a-f-]{36}$/i.test(itemId)) return json({ error: 'Patrón no válido' }, 400);

  const auth = req.headers.get('Authorization') || '';
  if (!auth.startsWith('Bearer ') || auth.length < 60) return json({ error: 'Inicia sesión para descargar tu patrón.' }, 401);

  const url = Deno.env.get('SUPABASE_URL')!;
  // Con la sesión de la clienta se consulta qué compró (la función usa auth.uid())
  const comoClienta = createClient(url, Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_PUBLISHABLE_KEY') || '', { global: { headers: { Authorization: auth } } });
  const { data: compras, error } = await comoClienta.rpc('mis_compras_patrones');
  if (error || !Array.isArray(compras)) return json({ error: 'Inicia sesión para descargar tu patrón.' }, 401);
  if (!compras.some((c: any) => c.item_id === itemId)) return json({ error: 'No encontramos este patrón en tus compras.' }, 403);

  const sb = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: arch } = await sb.from('patrones_archivos').select('ruta, nombre_archivo').eq('item_id', itemId).maybeSingle();
  if (!arch) return json({ error: 'El archivo de este patrón todavía no está disponible. Escríbenos por WhatsApp y te lo enviamos.' }, 404);
  const nombre = arch.nombre_archivo || 'patron-lana-rosa.pdf';
  const { data: firmado, error: e2 } = await sb.storage.from('patrones').createSignedUrl(arch.ruta, 300, { download: nombre });
  if (e2 || !firmado?.signedUrl) return json({ error: 'No pudimos preparar la descarga. Inténtalo de nuevo.' }, 500);
  return json({ url: firmado.signedUrl, nombre });
});
