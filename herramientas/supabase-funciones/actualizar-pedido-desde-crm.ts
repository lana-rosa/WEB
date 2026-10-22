// Recibe del CRM los cambios de estado de un pedido y los refleja en el ERP.
// Solo hace avances seguros, los mismos que haría el equipo con los botones del ERP:
//  - CRM 'listo' / 'enviado' / 'entregado' + ERP 'en preparación'  -> ERP 'listo para despachar' (fn_marcar_pedido_listo)
//  - CRM 'entregado' + ERP 'listo para despachar' SIN saldo pendiente -> ERP 'entregado' (fn_entregar_pedido_sin_saldo)
// Si queda saldo por cobrar NO se entrega: el cobro se registra en el ERP (así se contabiliza bien).
// También copia los datos de envío del CRM (tipo de entrega, empresa, guía, enlace, fecha de envío) para que la clienta los vea en su cuenta.
// Solo copia los datos que vienen llenos: así no borra los que se registraron en el ERP.
// Autenticación: secreto compartido; aquí solo está su huella SHA-256.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const HUELLA = '68fd62a4dfa185cf0e458a1d0228193d4356408d537cef8383f4681049a0a7aa';
async function sha256(t: string) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t));
  return Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, '0')).join('');
}
const json = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'Content-Type': 'application/json' } });
const limpio = (v: unknown, max: number) => { const t = String(v ?? '').replace(/[\u0000-\u001f<>]/g, ' ').trim().slice(0, max); return t || null; };

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'método no permitido' }, 405);
  const clave = req.headers.get('x-puente-clave') || '';
  if (!clave || (await sha256(clave)) !== HUELLA) return json({ error: 'no autorizado' }, 401);
  let b: any;
  try { b = await req.json(); } catch { return json({ error: 'json inválido' }, 400); }
  const idCrm = String(b?.crm_pedido_id || '');
  const estado = String(b?.estado || '');
  if (!/^[0-9a-f-]{36}$/.test(idCrm) || !estado) return json({ error: 'datos incompletos' }, 400);

  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: peds } = await sb.from('pedidos_canal_venta')
    .select('id, consecutivo, estado, monto_saldo_requerido, saldo_pagado').eq('referencia_crm_id', idCrm);
  if (!peds?.length) return json({ ok: true, omitido: 'el pedido del CRM no está en el ERP' });

  const acciones: string[] = [];

  // Datos de envío (opcionales)
  if (b?.envio && typeof b.envio === 'object') {
    const e = b.envio;
    const fecha = e.fecha_envio && !isNaN(Date.parse(e.fecha_envio)) ? new Date(e.fecha_envio).toISOString() : null;
    const guiaUrl = limpio(e.guia_url, 500);
    const todos: Record<string, unknown> = {
      tipo_entrega: limpio(e.tipo_entrega, 40)?.toLowerCase() ?? null,
      envio_estado: limpio(e.envio_estado, 40)?.toLowerCase() ?? null,
      transportadora: limpio(e.transportadora, 80),
      numero_guia: limpio(e.numero_guia, 80),
      guia_url: guiaUrl && /^https?:\/\//i.test(guiaUrl) ? guiaUrl : null,
      fecha_envio: fecha,
    };
    const cambios = Object.fromEntries(Object.entries(todos).filter(([, v]) => v !== null));
    if (Object.keys(cambios).length) {
      const { error } = await sb.from('pedidos_canal_venta').update(cambios).eq('referencia_crm_id', idCrm);
      acciones.push(error ? `datos de envío: no se pudieron guardar (${error.message})` : 'datos de envío actualizados');
    }
  }

  for (const p of peds) {
    let actual = p.estado;
    if (['listo', 'enviado', 'entregado'].includes(estado) && actual === 'en_preparacion') {
      const { error } = await sb.rpc('fn_marcar_pedido_listo', { p_pedido_id: p.id });
      if (error) { acciones.push(`${p.consecutivo}: no se pudo marcar listo (${error.message})`); continue; }
      actual = 'listo_despacho';
      acciones.push(`${p.consecutivo}: listo para despachar`);
    }
    if (estado === 'entregado' && actual === 'listo_despacho') {
      if (Number(p.monto_saldo_requerido) <= 0 || p.saldo_pagado) {
        const { error } = await sb.rpc('fn_entregar_pedido_sin_saldo', { p_pedido_id: p.id });
        acciones.push(error ? `${p.consecutivo}: no se pudo entregar (${error.message})` : `${p.consecutivo}: entregado`);
      } else {
        acciones.push(`${p.consecutivo}: tiene saldo pendiente, se entrega desde el ERP al cobrar`);
      }
    }
  }
  return json({ ok: true, acciones });
});
