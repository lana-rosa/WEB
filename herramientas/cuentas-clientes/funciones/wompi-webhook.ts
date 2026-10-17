// Copia de la función desplegada en Supabase (v25, 17-oct-2026). Recibe los eventos de Wompi (URL de eventos) y actualiza el pedido.
// Secretos: WOMPI_EVENTS_SECRET y WOMPI_PUBLIC_KEY (la llave decide si consulta sandbox o producción).
// verify_jwt = false: lo llama Wompi; la autenticidad se comprueba con el checksum del evento
// y con una segunda consulta a la API de Wompi.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

async function sha256(texto: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}
const leer = (obj: any, ruta: string) => ruta.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
const ESTADOS: Record<string, string> = { APPROVED: 'pagado', DECLINED: 'rechazado', VOIDED: 'anulado', ERROR: 'error' };

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('ok');
  const secreto = Deno.env.get('WOMPI_EVENTS_SECRET');
  const llavePublica = (Deno.env.get('WOMPI_PUBLIC_KEY') || '').trim();
  if (!secreto) return new Response('sin configurar', { status: 503 });

  let ev: any;
  try { ev = await req.json(); } catch { return new Response('json inválido', { status: 400 }); }
  if (ev?.event !== 'transaction.updated') return new Response('ignorado');

  // 1) Checksum del evento: sha256(valores de las propiedades + timestamp + secreto de eventos)
  const props: string[] = ev?.signature?.properties || [];
  const cadena = props.map((p) => String(leer(ev.data, p))).join('') + String(ev.timestamp) + secreto;
  if ((await sha256(cadena)) !== ev?.signature?.checksum) return new Response('firma inválida', { status: 401 });

  const t = ev.data?.transaction;
  if (!t?.reference || !t?.id) return new Response('sin transacción', { status: 400 });

  // 2) Segunda verificación directa con Wompi (evita confiar solo en el cuerpo recibido)
  const esProduccion = llavePublica.startsWith('pub_prod_');
  const base = esProduccion ? 'https://production.wompi.co/v1' : 'https://sandbox.wompi.co/v1';
  const r = await fetch(`${base}/transactions/${encodeURIComponent(t.id)}`);
  if (!r.ok) return new Response('no se pudo verificar', { status: 502 });
  const real = (await r.json())?.data;
  if (!real || real.reference !== t.reference) return new Response('no coincide', { status: 400 });

  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: pedido } = await sb.from('pedidos_web').select('id, total, estado, es_digital').eq('referencia', real.reference).maybeSingle();
  if (!pedido) return new Response('pedido no encontrado', { status: 404 });
  if (Math.round(Number(pedido.total) * 100) !== Number(real.amount_in_cents)) return new Response('monto no coincide', { status: 409 });

  const nuevo = ESTADOS[real.status];
  const cambios: Record<string, unknown> = {
    wompi_transaction_id: real.id, wompi_estado: real.status,
    metodo_pago: real.payment_method_type || null, updated_at: new Date().toISOString(),
    // Con llaves de pruebas el pedido NO se registra en el ERP (no es una venta real).
    es_prueba: !esProduccion,
  };
  // Un pedido ya pagado no se degrada por eventos tardíos.
  if (nuevo && pedido.estado !== 'pagado') cambios.estado = nuevo;
  if (nuevo === 'pagado' && pedido.estado !== 'pagado') cambios.pagado_at = new Date().toISOString();
  await sb.from('pedidos_web').update(cambios).eq('id', pedido.id);

  // Pedido pagado de verdad: ya quedó en el ERP (trigger de la base). Se envía también al CRM.
  // Los pedidos digitales (patrones) no tienen envío ni taller: no se mandan al CRM.
  // Si falla, el pago y el ERP no se afectan: el error queda en pedidos_web.crm_error y
  // el siguiente evento de Wompi (o una llamada manual) lo reintenta; la función no duplica.
  if (esProduccion && !pedido.es_digital && (nuevo === 'pagado' || pedido.estado === 'pagado')) {
    try {
      await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/enviar-pedido-web-crm`, {
        method: 'POST', signal: AbortSignal.timeout(25000),
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` },
        body: JSON.stringify({ pedido_id: pedido.id }),
      });
    } catch (e) { console.error('No se pudo enviar al CRM:', e); }
  }
  return new Response('ok');
});
