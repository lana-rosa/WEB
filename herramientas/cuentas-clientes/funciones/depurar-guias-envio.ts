// Edge Function «depurar-guias-envio» (5-nov-2026, pedido de la abogada, punto 6): borra las guías de envío del bucket privado «guias-envio»
// a los 90 días de subidas (con la API de Storage, no con SQL). La llama pg_cron todos los días (migración 44). Como la de fotos de referencia,
// va sin JWT a propósito: no recibe datos (solo {dry:true}, que no borra) y solo borra lo que ya cumplió el plazo.
import { createClient } from 'npm:@supabase/supabase-js@2';

const BUCKET = 'guias-envio';
const DIAS = 90;
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json' } });

Deno.serve(async (req: Request) => {
  let dry = false;
  try { dry = (await req.json())?.dry === true; } catch { /* sin cuerpo */ }
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const limite = new Date(Date.now() - DIAS * 86400000);
  const viejos: string[] = [];
  const recorrer = async (carpeta: string, nivel: number): Promise<string | null> => {
    for (let offset = 0; ; offset += 100) {
      const { data, error } = await sb.storage.from(BUCKET).list(carpeta, { limit: 100, offset });
      if (error) return error.message;
      if (!data || !data.length) break;
      for (const o of data) {
        const ruta = carpeta ? carpeta + '/' + o.name : o.name;
        if (!o.id) { if (nivel < 3) { const e = await recorrer(ruta, nivel + 1); if (e) return e; } }
        else if (o.created_at && new Date(o.created_at) < limite) viejos.push(ruta);
      }
      if (data.length < 100) break;
    }
    return null;
  };
  const err = await recorrer('', 0);
  if (err) return json({ error: 'listar: ' + err }, 500);
  let borrados = 0;
  if (!dry) {
    for (let i = 0; i < viejos.length; i += 100) {
      const lote = viejos.slice(i, i + 100);
      const { error } = await sb.storage.from(BUCKET).remove(lote);
      if (error) return json({ error: 'borrar: ' + error.message, borrados }, 500);
      borrados += lote.length;
    }
  }
  return json({ ok: true, dry, vencidas: viejos.length, borrados, dias: DIAS });
});
