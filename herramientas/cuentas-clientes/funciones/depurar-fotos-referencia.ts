// Edge Function «depurar-fotos-referencia» (17-oct-2026): borra las fotos de referencia de Personaliza a los 90 días de subidas,
// como dice politicas.html#datos (apartado 4). La llama pg_cron todos los días (job «depurar-fotos-referencia», migración 24).
//  1) Borra del almacenamiento privado «solicitudes-personalizadas» los archivos de más de 90 días (con la API de Storage, no con SQL).
//  2) En las oportunidades del ERP (origen «web») creadas hace más de 90 días quita los enlaces a esas fotos y deja una nota.
// Sin JWT a propósito: no recibe datos (solo el aviso opcional {dry:true}, que no borra) y solo puede borrar lo que ya cumplió los 90 días,
// que es lo que la política promete; llamarla de más no hace daño.
import { createClient } from 'npm:@supabase/supabase-js@2';

const BUCKET = 'solicitudes-personalizadas';
const DIAS = 90;
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json' } });

Deno.serve(async (req: Request) => {
  let dry = false;
  try { dry = (await req.json())?.dry === true; } catch { /* sin cuerpo */ }
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const limite = new Date(Date.now() - DIAS * 86400000);

  // 1) archivos de más de 90 días (están en la raíz del bucket)
  const viejos: string[] = [];
  for (let offset = 0; ; offset += 100) {
    const { data, error } = await sb.storage.from(BUCKET).list('', { limit: 100, offset, sortBy: { column: 'created_at', order: 'asc' } });
    if (error) return json({ error: 'listar: ' + error.message }, 500);
    if (!data || !data.length) break;
    for (const o of data) if (o.id && o.created_at && new Date(o.created_at) < limite) viejos.push(o.name);
    if (data.length < 100) break;
  }
  let borrados = 0;
  if (!dry) {
    for (let i = 0; i < viejos.length; i += 100) {
      const lote = viejos.slice(i, i + 100);
      const { error } = await sb.storage.from(BUCKET).remove(lote);
      if (error) return json({ error: 'borrar: ' + error.message, borrados }, 500);
      borrados += lote.length;
    }
  }

  // 2) enlaces en las oportunidades del ERP
  const { data: ops, error: e2 } = await sb.from('oportunidades_venta').select('consecutivo, notas')
    .eq('origen', 'web').not('foto_referencia_url', 'is', null).lt('created_at', limite.toISOString());
  if (e2) return json({ error: 'oportunidades: ' + e2.message, archivos_vencidos: viejos.length, borrados }, 500);
  let limpiadas = 0;
  if (!dry) {
    const hoy = new Date().toISOString().slice(0, 10);
    for (const op of ops || []) {
      const nota = ((op.notas || '') + `\n[Fotos de referencia borradas el ${hoy}: se cumplieron ${DIAS} días de conservación]`).trim();
      const { error } = await sb.from('oportunidades_venta').update({ foto_referencia_url: null, notas: nota }).eq('consecutivo', op.consecutivo);
      if (!error) limpiadas++;
    }
  }
  return json({ dry, dias: DIAS, archivos_vencidos: viejos.length, borrados, oportunidades_con_fotos_vencidas: (ops || []).length, oportunidades_limpiadas: limpiadas });
});
