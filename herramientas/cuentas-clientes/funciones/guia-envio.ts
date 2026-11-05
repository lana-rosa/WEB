// Edge Function «guia-envio» (5-nov-2026, pedido de la abogada, punto 6): entrega un enlace TEMPORAL (10 minutos) a la guía de envío de un pedido
// de la clienta, porque el bucket «guias-envio» ahora es PRIVADO. Recibe { numero_guia } con la sesión de la clienta (Authorization: Bearer <su sesión>).
// Comprueba con su propia sesión que ese número de guía está en SUS pedidos (mis_pedidos) y solo entonces firma el archivo con la llave de servicio.
// El ERP puede seguir guardando en guia_url el enlace público de siempre o solo la ruta del archivo: de ambas se saca la ruta.
import { createClient } from 'npm:@supabase/supabase-js@2';

const BUCKET = 'guias-envio';
const SEGUNDOS = 600;
const ORIGENES = ['https://lanarosacrochet.com', 'https://www.lanarosacrochet.com'];
const cors = (req: Request) => ({
  'Access-Control-Allow-Origin': ORIGENES.includes(req.headers.get('origin') || '') ? req.headers.get('origin')! : ORIGENES[0],
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS', Vary: 'Origin',
});
const json = (req: Request, o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json', ...cors(req) } });

const rutaDe = (u: string): string => {
  const m = String(u || '').match(/\/object\/(?:public|sign|authenticated)\/guias-envio\/([^?#]+)/);
  if (m) return decodeURIComponent(m[1]);
  return /^https?:\/\//i.test(u) ? '' : String(u || '').replace(/^\/+/, '');
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(req) });
  if (req.method !== 'POST') return json(req, { error: 'Método no permitido' }, 405);
  const auth = req.headers.get('authorization') || '';
  if (!/^Bearer\s+\S+/.test(auth)) return json(req, { error: 'Inicia sesión para ver tu guía.' }, 401);
  let numero = '';
  try { numero = String((await req.json())?.numero_guia || '').trim(); } catch { /* sin cuerpo */ }
  if (!numero) return json(req, { error: 'Falta el número de guía.' }, 400);

  const url = Deno.env.get('SUPABASE_URL')!;
  const delUsuario = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } } });
  const { data: u } = await delUsuario.auth.getUser();
  if (!u?.user) return json(req, { error: 'Tu sesión venció. Vuelve a iniciar sesión.' }, 401);
  const { data: pedidos, error } = await delUsuario.rpc('mis_pedidos');
  if (error || !Array.isArray(pedidos)) return json(req, { error: 'No pudimos consultar tus pedidos.' }, 500);
  const p = pedidos.find((x: any) => String(x?.numero_guia || '').trim() === numero && x?.guia_url);
  if (!p) return json(req, { error: 'No encontramos esa guía en tus pedidos.' }, 404);
  const ruta = rutaDe(p.guia_url);
  if (!ruta) return json(req, { error: 'Esta guía está en otro sitio.', externo: p.guia_url }, 200);

  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data, error: e2 } = await admin.storage.from(BUCKET).createSignedUrl(ruta, SEGUNDOS);
  if (e2 || !data?.signedUrl) return json(req, { error: 'La guía ya no está disponible. Escríbenos por WhatsApp.' }, 404);
  return json(req, { url: data.signedUrl, vence_en_segundos: SEGUNDOS });
});
