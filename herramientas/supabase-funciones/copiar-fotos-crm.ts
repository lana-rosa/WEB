// Copia al ERP (bucket produccion-fotos) las fotos de resultado que todavía están en el almacenamiento del CRM,
// y actualiza produccion_fichas.foto_url. No recibe datos: solo procesa fichas cuya foto apunta al CRM,
// así que llamarla varias veces no hace daño (lo ya copiado se salta).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const PREFIJO = 'https://wcqdkccvtywiutzknskr.supabase.co/storage/v1/object/public/pedidos-imagenes/';
const json = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'método no permitido' }, 405);
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: fichas, error } = await sb.from('produccion_fichas').select('orden_id, foto_url').like('foto_url', PREFIJO + '%').limit(50);
  if (error) return json({ error: error.message }, 500);
  const resultado: string[] = [];
  for (const f of fichas || []) {
    try {
      const r = await fetch(f.foto_url);
      if (!r.ok) { resultado.push(`${f.orden_id}: no se pudo descargar (${r.status})`); continue; }
      const tipo = r.headers.get('content-type') || 'image/jpeg';
      if (!tipo.startsWith('image/')) { resultado.push(`${f.orden_id}: no es una imagen`); continue; }
      const nombre = f.foto_url.split('/').pop()!.replace(/[^\w.-]/g, '');
      const ruta = `crm/${nombre}`;
      const { error: e1 } = await sb.storage.from('produccion-fotos').upload(ruta, await r.arrayBuffer(), { contentType: tipo, upsert: true });
      if (e1) { resultado.push(`${f.orden_id}: ${e1.message}`); continue; }
      const url = sb.storage.from('produccion-fotos').getPublicUrl(ruta).data.publicUrl;
      const { error: e2 } = await sb.from('produccion_fichas').update({ foto_url: url }).eq('orden_id', f.orden_id);
      resultado.push(e2 ? `${f.orden_id}: ${e2.message}` : `${f.orden_id}: copiada`);
    } catch (e) {
      resultado.push(`${f.orden_id}: ${String(e)}`);
    }
  }
  return json({ ok: true, procesadas: resultado.length, resultado });
});
