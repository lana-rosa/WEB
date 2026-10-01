// Pagos con PayPal para clientas de otros países (Edge Function de Supabase, verify_jwt = false).
// Secretos (Supabase → Edge Functions → Secrets): PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_MODO ('sandbox' | 'live').
// Los ajustes (activo, tasa USD→COP) y el envío por zona se editan en el ERP: Configuración empresa → PayPal y envío internacional.
//   { accion: 'estado' }                  -> { activo, modo, tasa, zonas, paises }  (la web decide si muestra PayPal)
//   { accion: 'crear', cliente, items }   -> crea el pedido (en USD con la tasa del ERP) y la orden de PayPal; devuelve la URL de pago
//   { accion: 'capturar', ref }           -> la llama gracias.html al volver de PayPal: captura el pago, verifica el monto y marca el pedido como pagado
// Al quedar 'pagado', los triggers de la base registran el pedido en el ERP (medio 'paypal') y avisan al equipo; aquí se envía también al CRM.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SITIO = 'https://lanarosacrochet.com';
const PCT_PRIMERA_COMPRA = 10; // misma promoción que Wompi; un solo descuento por pedido
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
const limpio = (v: unknown, max: number) => String(v ?? '').replace(/[\u0000-\u001f<>]/g, ' ').trim().slice(0, max);
const conDescuento = (valor: number, pct: number) => Math.round((valor * (100 - pct)) / 100);
const CORREO_OK = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const MODO = () => ((Deno.env.get('PAYPAL_MODO') || 'sandbox').trim().toLowerCase() === 'live' ? 'live' : 'sandbox');
const API = () => (MODO() === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com');
const tieneLlaves = () => !!(Deno.env.get('PAYPAL_CLIENT_ID') || '').trim() && !!(Deno.env.get('PAYPAL_CLIENT_SECRET') || '').trim();

async function tokenPaypal() {
  const id = (Deno.env.get('PAYPAL_CLIENT_ID') || '').trim(), secreto = (Deno.env.get('PAYPAL_CLIENT_SECRET') || '').trim();
  const r = await fetch(`${API()}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: 'Basic ' + btoa(`${id}:${secreto}`), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  });
  if (!r.ok) throw new Error('PayPal rechazó las llaves (' + r.status + ')');
  return (await r.json()).access_token as string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);
  let body: any;
  try { body = await req.json(); } catch { return json({ error: 'Solicitud inválida' }, 400); }

  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  // ---------- Configuración vigente ----------
  const { data: aj } = await sb.from('paypal_ajustes').select('activo, tasa_usd_cop').eq('id', 1).maybeSingle();
  const tasa = Number(aj?.tasa_usd_cop) || 0;
  const { data: zonasDb } = await sb.from('envio_zonas_intl').select('zona, etiqueta, valor_usd, activo, orden').eq('activo', true).order('orden');
  const zonas = (zonasDb || []).filter((z: any) => Number(z.valor_usd) > 0);
  const { data: paisesDb } = await sb.from('paises_envio').select('pais, zona').order('pais');
  const paises = (paisesDb || []).filter((p: any) => zonas.some((z: any) => z.zona === p.zona));
  const activo = tieneLlaves() && !!aj?.activo && tasa > 0 && zonas.length > 0;

  if (body?.accion === 'estado') {
    return json({ activo, modo: MODO(), tasa: activo ? tasa : null, zonas: activo ? zonas.map((z: any) => ({ zona: z.zona, etiqueta: z.etiqueta, valor_usd: Number(z.valor_usd) })) : [], paises: activo ? paises : [] });
  }

  // ---------- Crear pedido + orden de PayPal ----------
  if (body?.accion === 'crear') {
    if (!activo) return json({ error: 'Los pagos con PayPal aún no están activos.' }, 503);
    const c = body?.cliente || {};
    const nombre = limpio(c.nombre, 120), correo = limpio(c.correo, 120).toLowerCase(), telefono = limpio(c.telefono, 20);
    const pais = limpio(c.pais, 60), ciudad = limpio(c.ciudad, 80), direccion = limpio(c.direccion, 250), notas = limpio(c.notas, 500);
    if (!nombre || !CORREO_OK.test(correo) || telefono.replace(/\D/g, '').length < 7 || !pais || !ciudad || direccion.length < 6)
      return json({ error: 'Revisa tus datos: nombre, correo, teléfono, país, ciudad y dirección.' }, 400);
    const paisFila = paises.find((p: any) => p.pais === pais);
    const zona = paisFila && zonas.find((z: any) => z.zona === paisFila.zona);
    if (!zona) return json({ error: 'Por ahora no enviamos a ese país con PayPal. Escríbenos por WhatsApp.' }, 400);

    const items: { id: string; cantidad: number }[] = (Array.isArray(body?.items) ? body.items : [])
      .map((i: any) => ({ id: String(i?.id || ''), cantidad: Math.floor(Number(i?.cantidad)) }))
      .filter((i: any) => /^[0-9a-f-]{36}$/i.test(i.id) && i.cantidad >= 1 && i.cantidad <= 20).slice(0, 40);
    if (!items.length) return json({ error: 'Tu carrito está vacío.' }, 400);
    const { data: productos } = await sb.from('inventario_items').select('id, nombre, precio_venta')
      .in('id', items.map((i) => i.id)).eq('tipo', 'producto_terminado').eq('activo', true).not('descripcion_web', 'is', null);
    const mapa = new Map((productos || []).map((p: any) => [p.id, p]));
    if (items.some((i) => !mapa.has(i.id))) return json({ error: 'Algún producto del carrito ya no está disponible.' }, 409);

    // Descuento de primera compra (un solo descuento por pedido)
    let pct = 0;
    const { data: primera } = await sb.rpc('fn_es_primera_compra_web', { p_correo: correo, p_telefono: telefono });
    if (PCT_PRIMERA_COMPRA > 0 && primera === true) pct = PCT_PRIMERA_COMPRA;
    const valores = items.map((i) => Number(mapa.get(i.id).precio_venta) * i.cantidad);
    const subtotal = valores.reduce((s, v) => s + v, 0);
    const descuento = subtotal - valores.reduce((s, v) => s + conDescuento(v, pct), 0);
    const envioCop = Math.round(Number(zona.valor_usd) * tasa);
    const totalCop = subtotal - descuento + envioCop;
    const totalUsd = Math.round((totalCop / tasa) * 100) / 100;
    if (totalUsd < 1) return json({ error: 'El valor mínimo de pago es US$ 1.' }, 400);

    let userId: string | null = null;
    const auth = req.headers.get('Authorization') || '';
    if (auth.startsWith('Bearer ') && auth.length > 60) { const { data } = await sb.auth.getUser(auth.slice(7)); userId = data?.user?.id ?? null; }

    const { data: ref } = await sb.rpc('fn_referencia_pedido_web');
    const referencia = String(ref);
    const { data: pedido, error: e2 } = await sb.from('pedidos_web').insert({
      referencia, user_id: userId, nombre, correo, telefono, ciudad: `${ciudad}, ${pais}`, direccion, notas: notas || null,
      subtotal, envio: envioCop, total: totalCop, descuento_pct: pct, descuento,
      pais, moneda: 'USD', total_usd: totalUsd, tasa_usd_cop: tasa,
    }).select('id').single();
    if (e2 || !pedido) return json({ error: 'No pudimos crear tu pedido.' }, 500);
    await sb.from('pedidos_web_items').insert(items.map((i) => ({
      pedido_id: pedido.id, producto_id: i.id, nombre: mapa.get(i.id).nombre, precio: Number(mapa.get(i.id).precio_venta), cantidad: i.cantidad,
    })));

    try {
      const token = await tokenPaypal();
      const r = await fetch(`${API()}/v2/checkout/orders`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'PayPal-Request-Id': referencia },
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [{
            reference_id: referencia, custom_id: referencia, invoice_id: referencia,
            description: `Pedido ${referencia} - Lana Rosa Crochet`,
            amount: { currency_code: 'USD', value: totalUsd.toFixed(2) },
          }],
          payment_source: { paypal: { experience_context: {
            brand_name: 'Lana Rosa Crochet', locale: 'es-ES', landing_page: 'LOGIN', user_action: 'PAY_NOW', shipping_preference: 'NO_SHIPPING',
            return_url: `${SITIO}/gracias.html?ref=${encodeURIComponent(referencia)}&pp=1`,
            cancel_url: `${SITIO}/tienda.html?pago=cancelado`,
          } } },
        }),
      });
      const orden = await r.json().catch(() => ({}));
      const url = (orden.links || []).find((l: any) => l.rel === 'payer-action' || l.rel === 'approve')?.href;
      if (!r.ok || !orden.id || !url) { console.error('PayPal crear orden:', JSON.stringify(orden)); await sb.from('pedidos_web').update({ estado: 'error' }).eq('id', pedido.id); return json({ error: 'No pudimos preparar tu pago con PayPal.' }, 502); }
      await sb.from('pedidos_web').update({ paypal_order_id: orden.id }).eq('id', pedido.id);
      return json({ url, referencia, total_usd: totalUsd, total: totalCop, envio_usd: Number(zona.valor_usd), descuento });
    } catch (e) {
      console.error('PayPal crear:', e);
      await sb.from('pedidos_web').update({ estado: 'error' }).eq('id', pedido.id);
      return json({ error: 'No pudimos conectar con PayPal.' }, 502);
    }
  }

  // ---------- Capturar al volver de PayPal ----------
  if (body?.accion === 'capturar') {
    const referencia = limpio(body?.ref, 60);
    const { data: p } = await sb.from('pedidos_web').select('id, estado, total_usd, paypal_order_id').eq('referencia', referencia).maybeSingle();
    if (!p || !p.paypal_order_id) return json({ error: 'Pedido no encontrado' }, 404);
    if (p.estado === 'pagado') return json({ estado: 'pagado' });
    if (!tieneLlaves()) return json({ error: 'PayPal no está configurado' }, 503);
    try {
      const token = await tokenPaypal();
      const h = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
      let orden = await (await fetch(`${API()}/v2/checkout/orders/${encodeURIComponent(p.paypal_order_id)}`, { headers: h })).json();
      if (orden.status === 'APPROVED') {
        const rc = await fetch(`${API()}/v2/checkout/orders/${encodeURIComponent(p.paypal_order_id)}/capture`, { method: 'POST', headers: { ...h, 'PayPal-Request-Id': referencia + '-cap' }, body: '{}' });
        orden = await rc.json();
      }
      if (orden.status !== 'COMPLETED') return json({ estado: orden.status === 'VOIDED' ? 'rechazado' : 'pendiente' });
      const unidad = orden.purchase_units?.[0];
      const captura = unidad?.payments?.captures?.[0];
      if (unidad?.custom_id !== referencia || !captura || captura.status !== 'COMPLETED'
        || captura.amount?.currency_code !== 'USD' || Math.round(Number(captura.amount?.value) * 100) !== Math.round(Number(p.total_usd) * 100)) {
        console.error('PayPal: la captura no coincide con el pedido', referencia, JSON.stringify(orden));
        return json({ error: 'El pago no coincide con el pedido. Escríbenos por WhatsApp.' }, 409);
      }
      await sb.from('pedidos_web').update({
        estado: 'pagado', pagado_at: new Date().toISOString(), metodo_pago: 'PAYPAL', paypal_capture_id: captura.id,
        es_prueba: MODO() !== 'live', updated_at: new Date().toISOString(),
      }).eq('id', p.id);
      if (MODO() === 'live') {
        try {
          await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/enviar-pedido-web-crm`, {
            method: 'POST', signal: AbortSignal.timeout(25000),
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` },
            body: JSON.stringify({ pedido_id: p.id }),
          });
        } catch (e) { console.error('No se pudo enviar al CRM:', e); }
      }
      return json({ estado: 'pagado' });
    } catch (e) {
      console.error('PayPal capturar:', e);
      return json({ error: 'No pudimos confirmar el pago con PayPal.' }, 502);
    }
  }

  return json({ error: 'Acción no válida' }, 400);
});
