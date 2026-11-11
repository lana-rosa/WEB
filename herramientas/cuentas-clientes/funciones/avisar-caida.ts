// Edge Function «avisar-caida» (11-nov-2026): la llama el revisor de GitHub Actions (.github/workflows/vigilar-servicios.yml) cuando una
// revisión falla dos veces seguidas, y manda UN correo de aviso a contacto@ (el remitente configurado en «configuracion_correo»).
// Seguridad: solo atiende si trae el secreto ALERTA_TOKEN (Supabase → Edge Functions → Secrets, y el mismo valor en GitHub → Secrets);
// el contenido del correo es fijo (solo se escriben los nombres y el detalle corto de lo que falló, recortados); máximo 1 aviso por hora.
// Usa la clave RESEND_API_KEY que ya tiene el envío de recibos; no hay claves nuevas en el código.
import { createClient } from 'npm:@supabase/supabase-js@2';

const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json' } });
const escapar = (t: string) => t.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const igual = (a: string, b: string) => { if (a.length !== b.length) return false; let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0; };

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);
  const esperado = (Deno.env.get('ALERTA_TOKEN') || '').trim();
  const recibido = (req.headers.get('x-alerta-token') || '').trim();
  if (!esperado || esperado.length < 24 || !igual(esperado, recibido)) return json({ error: 'No autorizado' }, 401);

  let body: any = {};
  try { body = await req.json(); } catch { /* sin cuerpo */ }
  const fallos = (Array.isArray(body?.fallos) ? body.fallos : []).slice(0, 10)
    .map((f: any) => ({ nombre: String(f?.nombre || '').slice(0, 80), detalle: String(f?.detalle || '').slice(0, 160) })).filter((f: any) => f.nombre);
  const recuperado = body?.recuperado === true;
  if (!fallos.length && !recuperado) return json({ error: 'Sin datos' }, 400);

  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
  // máximo 1 aviso por hora (los de «recuperado» no cuentan)
  if (!recuperado) {
    const desde = new Date(Date.now() - 3600 * 1000).toISOString();
    const { count } = await sb.from('correos_enviados').select('id', { count: 'exact', head: true }).eq('referencia', 'caida').eq('estado', 'enviado').gte('created_at', desde);
    if ((count || 0) >= 1) return json({ ok: true, omitido: 'ya se avisó hace menos de una hora' });
  }
  const { data: cfg } = await sb.from('configuracion_correo').select('remitente_email, remitente_nombre').eq('id', 1).maybeSingle();
  const clave = Deno.env.get('RESEND_API_KEY');
  if (!cfg?.remitente_email || !clave) return json({ error: 'Correo sin configurar' }, 500);

  const asunto = recuperado ? '✅ Lana Rosa: los servicios volvieron a responder' : '🚨 Lana Rosa: algo dejó de responder en la web';
  const lista = fallos.map((f: any) => `<li><strong>${escapar(f.nombre)}</strong>${f.detalle ? ': ' + escapar(f.detalle) : ''}</li>`).join('');
  const html = `<div style="font-family:Arial,sans-serif;font-size:14px;color:#333;">${recuperado
    ? 'Los servicios que habían fallado <strong>volvieron a responder</strong>.'
    : `Esto no respondió en dos revisiones seguidas (a ${new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })}):<ul>${lista}</ul>Si es un pago o la tienda, conviene mirarlo pronto. Este aviso se repite como máximo una vez por hora mientras siga el problema.`}</div>`;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST', headers: { Authorization: `Bearer ${clave}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: `${cfg.remitente_nombre || 'Lana Rosa Crochet'} <${cfg.remitente_email}>`, to: [cfg.remitente_email], subject: asunto, html }),
  });
  const d = await r.json().catch(() => ({}));
  await sb.from('correos_enviados').insert({ enviado_por: null, destinatario: cfg.remitente_email, asunto, tipo: 'otro', referencia: recuperado ? 'caida-recuperada' : 'caida', estado: r.ok ? 'enviado' : 'error', error: r.ok ? null : String(d?.message || r.status).slice(0, 300), message_id: d?.id || null });
  return r.ok ? json({ ok: true }) : json({ error: 'No se pudo enviar el aviso' }, 502);
});
