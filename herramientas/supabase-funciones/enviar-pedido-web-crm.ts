// Envía al CRM un pedido pagado en la web. Lo llama wompi-webhook y paypal-pagos (con la llave de servicio).
// Body: { pedido_id, prueba?: boolean }  —  prueba:true permite enviar un pedido marcado es_prueba
// (crea el pedido en el CRM sin vincularlo al ERP, solo para verificar la conexión).
// Después de enviar, guarda referencia_crm_id en el pedido del ERP para que el botón
// "Cargar pedidos nuevos del CRM" no lo vuelva a importar.
// Si el pedido tuvo descuento de primera compra (descuento_pct), cada producto se envía ya con el descuento aplicado.
// Casa (9-oct-2026): se manda `casa` al CRM: 'merceria' si todos los productos son materiales de la Mercería (tipo 'merceria'), si no 'crochet'.
// CRM profesional (14-oct-2026): también se manda `acepta_contacto` (true solo si la clienta marcó recibir novedades: pedidos_web.acepta_promos)
// y `fecha_nacimiento` (del tercero, si la tiene). Ambos son opcionales: si algo falla al leerlos, el pedido se envía igual.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CRM_URL = 'https://wcqdkccvtywiutzknskr.supabase.co/functions/v1/recibir-pedido-web';
const json = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'Content-Type': 'application/json' } });
const METODOS: Record<string, string> = { CARD: 'Tarjeta', BANCOLOMBIA_TRANSFER: 'Bancolombia', BANCOLOMBIA_COLLECT: 'Bancolombia', BANCOLOMBIA_QR: 'QR Bancolombia', PSE: 'PSE', NEQUI: 'Nequi', PAYPAL: 'PayPal' };

Deno.serve(async (req) => {
  const llave = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  if (req.method !== 'POST' || (req.headers.get('authorization') || '') !== `Bearer ${llave}`) return json({ error: 'no autorizado' }, 401);
  let body: any;
  try { body = await req.json(); } catch { return json({ error: 'json inválido' }, 400); }
  const prueba = body?.prueba === true;

  const sb = createClient(Deno.env.get('SUPABASE_URL')!, llave);
  const { data: w } = await sb.from('pedidos_web').select('*').eq('id', body?.pedido_id).maybeSingle();
  if (!w) return json({ error: 'pedido no encontrado' }, 404);
  if (w.estado !== 'pagado') return json({ error: 'el pedido no está pagado' }, 409);
  if (w.crm_enviado_at) return json({ ok: true, ya_enviado: true });
  if (w.es_prueba && !prueba) return json({ ok: true, omitido: 'pedido de prueba' });

  const falla = async (msg: string, status = 500) => {
    if (!prueba) await sb.from('pedidos_web').update({ crm_error: msg.slice(0, 500) }).eq('id', w.id);
    return json({ error: msg }, status);
  };

  const { data: items } = await sb.from('pedidos_web_items').select('id, producto_id, nombre, precio, cantidad').eq('pedido_id', w.id).order('id');
  if (!items?.length) return falla('el pedido no tiene productos', 422);

  // Casa del pedido: materiales de la Mercería o productos de la tienda de amigurumis.
  const idsProd = items.map((it: any) => it.producto_id).filter(Boolean);
  const { data: inv } = idsProd.length ? await sb.from('inventario_items').select('id, tipo').in('id', idsProd) : { data: [] as any[] };
  const tipoPorId = new Map((inv || []).map((x: any) => [x.id, x.tipo]));
  const casa = items.every((it: any) => tipoPorId.get(it.producto_id) === 'merceria') ? 'merceria' : 'crochet';

  // Pedidos del ERP, en el mismo orden de los productos (así los crea fn_registrar_pedido_web_en_erp).
  const erpIds: string[] = w.erp_pedidos || [];
  let erp: any[] = [];
  if (!prueba) {
    if (erpIds.length !== items.length) return falla('el pedido aún no está registrado en el ERP', 409);
    const { data } = await sb.from('pedidos_canal_venta').select('id, consecutivo, tercero_id, disponible_en_stock, referencia_crm_id').in('id', erpIds);
    erp = erpIds.map((id) => (data || []).find((x: any) => x.id === id));
    if (erp.some((x) => !x)) return falla('no se encontraron los pedidos del ERP', 409);
  }

  const pct = Number(w.descuento_pct) || 0;
  const conDescuento = (valor: number) => Math.round((valor * (100 - pct)) / 100);
  const pedidos = items.map((it: any, i: number) => ({
    marcador: prueba ? `[PRUEBA-WEB:${w.referencia}:${i + 1}]` : `[ERP:${erp[i].consecutivo}]`,
    descripcion: it.nombre, cantidad: it.cantidad,
    precio_total: conDescuento(Number(it.precio) * Number(it.cantidad)) + (i === 0 ? Number(w.envio) : 0),
    envio: i === 0 ? Number(w.envio) : 0,
    en_stock: prueba ? true : !!erp[i].disponible_en_stock,
    pagado_at: w.pagado_at,
  }));

  const { data: secreto } = await sb.rpc('fn_secreto_crm');
  if (!secreto) return falla('falta el secreto del puente con el CRM');

  const notaExtra = [
    w.notas,
    pct > 0 ? `Descuento primera compra ${pct}%` : null,
    w.moneda === 'USD' ? `Pagado por PayPal: US$ ${w.total_usd} (tasa ${w.tasa_usd_cop}) · País: ${w.pais}` : null,
  ].filter(Boolean).join(' · ');

  // Datos opcionales para el CRM: cumpleaños del tercero (si lo tiene). Si falla, no se bloquea el envío.
  let nacimiento: string | null = null;
  try {
    const terceroPedido = !prueba ? erp[0]?.tercero_id : null;
    if (terceroPedido) {
      const { data: t } = await sb.from('terceros').select('fecha_nacimiento').eq('id', terceroPedido).maybeSingle();
      nacimiento = t?.fecha_nacimiento || null;
    }
  } catch (_) { /* opcional */ }

  let r: Response;
  try {
    r = await fetch(CRM_URL, {
      method: 'POST', signal: AbortSignal.timeout(20000),
      headers: { 'Content-Type': 'application/json', 'x-puente-clave': secreto },
      body: JSON.stringify({
        referencia: w.referencia, wompi_id: w.wompi_transaction_id || w.paypal_capture_id, metodo_texto: METODOS[String(w.metodo_pago || '').toUpperCase()] || w.metodo_pago,
        notas: notaExtra || null, prueba, casa,
        cliente: { nombre: w.nombre, telefono: w.telefono, email: w.correo, ciudad: w.ciudad, direccion: w.direccion, fecha_nacimiento: nacimiento, acepta_contacto: w.acepta_promos === true },
        pedidos,
      }),
    });
  } catch (e) { return falla('no se pudo contactar al CRM: ' + String(e)); }
  const res = await r.json().catch(() => ({}));
  if (!r.ok || !res?.ok) return falla('el CRM respondió: ' + (res?.error || r.status));

  if (prueba) return json({ ok: true, prueba: true, crm: res });

  // Vínculos para que el botón de sincronizar no duplique nada.
  for (let i = 0; i < erp.length; i++) {
    const crmPedido = res.pedidos.find((p: any) => p.marcador === pedidos[i].marcador);
    if (crmPedido && !erp[i].referencia_crm_id) {
      await sb.from('pedidos_canal_venta').update({ referencia_crm_id: crmPedido.crm_pedido_id }).eq('id', erp[i].id);
    }
  }
  const terceroId = erp[0].tercero_id;
  if (terceroId && res.crm_cliente_id) {
    const { data: yaVinculado } = await sb.from('terceros').select('id').eq('crm_cliente_id', res.crm_cliente_id).limit(1);
    if (!yaVinculado?.length) await sb.from('terceros').update({ crm_cliente_id: res.crm_cliente_id }).eq('id', terceroId).is('crm_cliente_id', null);
  }
  await sb.from('pedidos_web').update({ crm_enviado_at: new Date().toISOString(), crm_error: null }).eq('id', w.id);
  return json({ ok: true, crm: res });
});
