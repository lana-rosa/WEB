// Crea el pedido de la web y devuelve la URL de pago de Wompi (Web Checkout).
// Los precios, el descuento y el envío se calculan AQUÍ con los datos del ERP; el navegador solo manda ids y cantidades.
// Secretos (Supabase → Edge Functions → Secrets): WOMPI_PUBLIC_KEY, WOMPI_INTEGRITY_SECRET.
// { accion: 'estado' }  -> modo de los pagos ('produccion' | 'pruebas'); la web muestra el botón al público solo en producción.
// { accion: 'cotizar', correo, telefono, ciudad?, entrega?, items } -> resumen con el descuento de primera compra (sin crear nada).
// { accion: 'membresia', plan: 'mensual' | 'anual', cliente?: { nombre, telefono } } -> pago de la membresía de la Agenda de Rosina.
//   Exige sesión (Authorization: Bearer). El precio sale de PRECIOS_MEMBRESIA, nunca del navegador. Es un pedido digital
//   (sin envío, sin descuento de primera compra, sin ERP/CRM); al quedar pagado, un trigger de la base activa la membresía.
// Entrega: 'domicilio' (por defecto, con tarifa de envío por ciudad) o 'recogida' (recoge en tienda, envío $0, sin dirección).
// Patrones digitales (categoría de inventario "Patrones", se venden desde la Mercería): sin envío ni dirección, se descargan desde la cuenta.
// Un carrito con patrones no se mezcla con productos físicos. Los patrones NO llevan el descuento de primera compra.
// Materiales de la Mercería (tipo 'merceria': lanas, hilos…): se venden por unidad completa (ovillo). El ERP guarda en precio_venta el precio POR GRAMO
// de lanas e hilos, así que el precio del ovillo = precio_venta × peso_gramos (redondeado a $100, igual que la web). La existencia de lanas/hilos
// guardados en gramos se convierte a ovillos. Un carrito de materiales no se mezcla con productos de la Tienda ni con patrones. A domicilio, Wompi
// cobra SOLO los productos: el envío lo paga la clienta a la transportadora al recibir (Términos de venta de la Mercería, sección 9); en la
// cotización se devuelve el estimado. Recoger en tienda sigue gratis.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SITIO = 'https://lanarosacrochet.com';
// Promoción de primera compra: % sobre los productos (no sobre el envío). Se aplica sola si la persona nunca ha comprado
// (por correo o teléfono) en la web, en pedidos por WhatsApp/redes ni en la tienda. 0 = apagada.
// Regla: un solo descuento por pedido (hoy es el único). No aplica a patrones digitales ni a la membresía.
const PCT_PRIMERA_COMPRA = 10;
const TEXTO_RECOGIDA = 'Recoger en tienda';
const TEXTO_DIGITAL = 'Descarga digital';
const TEXTO_MEMBRESIA = 'Membresía digital';
const CATEGORIA_DIGITAL = 'Patrones';
const CATEGORIAS_POR_OVILLO = ['Lanas', 'Hilos'];
const CATEGORIA_EMPAQUES = 'Empaques'; // las bolsas se cobran en la venta, no se venden en la web
const CENTRO_MERCERIA = '2c1577b5-514e-4952-ba15-4feb64ea1879'; // Tienda/Mercería: el mismo filtro de obtener_merceria_web
// Membresía de la Agenda de Rosina (COP)
const PRECIOS_MEMBRESIA: Record<string, { valor: number; nombre: string }> = {
  mensual: { valor: 10000, nombre: 'Membresía Agenda de Rosina · Mensual' },
  anual: { valor: 60000, nombre: 'Membresía Agenda de Rosina · Anual' },
};
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (o: unknown, status = 200) =>
  new Response(JSON.stringify(o), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

async function sha256(texto: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}
const limpio = (v: unknown, max: number) => String(v ?? '').replace(/[\u0000-\u001f<>]/g, ' ').trim().slice(0, max);
const conDescuento = (valor: number, pct: number) => Math.round((valor * (100 - pct)) / 100);
const CORREO_OK = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);

  const llavePublica = (Deno.env.get('WOMPI_PUBLIC_KEY') || '').trim();
  const secretoIntegridad = (Deno.env.get('WOMPI_INTEGRITY_SECRET') || '').trim();
  if (!llavePublica || !secretoIntegridad) return json({ error: 'Los pagos en línea aún no están activos.' }, 503);
  // Seguridad: la llave que viaja en la URL de pago DEBE ser la pública (pub_test_ / pub_prod_). Si alguien guardó
  // por error la llave privada (prv_…), no se devuelve nada para no exponerla.
  if (!/^pub_(test|prod)_[A-Za-z0-9]+$/.test(llavePublica)) return json({ error: 'Los pagos en línea aún no están activos.' }, 503);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: 'Solicitud inválida' }, 400); }

  if (body?.accion === 'estado') return json({ modo: llavePublica.startsWith('pub_prod_') ? 'produccion' : 'pruebas' });

  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  // ---- Membresía de la Agenda de Rosina ----
  if (body?.accion === 'membresia') {
    const plan = String(body?.plan || '');
    const precio = PRECIOS_MEMBRESIA[plan];
    if (!precio) return json({ error: 'Elige el plan mensual o anual.' }, 400);
    const auth = req.headers.get('Authorization') || '';
    if (!auth.startsWith('Bearer ') || auth.length <= 60) return json({ error: 'Para activar la membresía entra primero a tu cuenta.' }, 401);
    const { data: u } = await sb.auth.getUser(auth.slice(7));
    const usuario = u?.user;
    if (!usuario || !CORREO_OK.test(usuario.email || '')) return json({ error: 'Tu sesión venció. Entra de nuevo a tu cuenta.' }, 401);
    const correo = String(usuario.email).toLowerCase();
    const cl = body?.cliente || {};
    const meta: any = usuario.user_metadata || {};
    const nombre = limpio(cl.nombre, 120) || limpio(meta.full_name || meta.name || correo.split('@')[0], 120);
    const telefono = limpio(cl.telefono, 20);
    const total = precio.valor;
    const { data: ref } = await sb.rpc('fn_referencia_pedido_web');
    const referencia = String(ref);
    const { data: pedido, error: e } = await sb.from('pedidos_web').insert({
      referencia, user_id: usuario.id, nombre, correo, telefono, ciudad: TEXTO_MEMBRESIA, direccion: TEXTO_MEMBRESIA,
      subtotal: total, envio: 0, total, descuento_pct: 0, descuento: 0, es_digital: true, membresia_plan: plan,
    }).select('id').single();
    if (e || !pedido) return json({ error: 'No pudimos crear tu pedido.' }, 500);
    await sb.from('pedidos_web_items').insert({ pedido_id: pedido.id, producto_id: null, nombre: precio.nombre, precio: total, cantidad: 1 });
    const centavos = total * 100;
    const firma = await sha256(`${referencia}${centavos}COP${secretoIntegridad}`);
    const q = new URLSearchParams({
      'public-key': llavePublica,
      'currency': 'COP',
      'amount-in-cents': String(centavos),
      'reference': referencia,
      'signature:integrity': firma,
      'redirect-url': `${SITIO}/gracias.html?ref=${encodeURIComponent(referencia)}`,
      'customer-data:email': correo,
      'customer-data:full-name': nombre,
    });
    const tel10 = telefono.replace(/\D/g, '').slice(-10);
    if (tel10.length === 10) { q.set('customer-data:phone-number', tel10); q.set('customer-data:phone-number-prefix', '+57'); }
    return json({ url: `https://checkout.wompi.co/p/?${q.toString()}`, referencia, total, plan, membresia: true });
  }

  const cotizando = body?.accion === 'cotizar';
  const c = cotizando ? { correo: body?.correo, telefono: body?.telefono, ciudad: body?.ciudad, entrega: body?.entrega } : (body?.cliente || {});

  const pedidoItems: { id: string; cantidad: number }[] = (Array.isArray(body?.items) ? body.items : [])
    .map((i: any) => ({ id: String(i?.id || ''), cantidad: Math.floor(Number(i?.cantidad)) }))
    .filter((i: any) => /^[0-9a-f-]{36}$/i.test(i.id) && i.cantidad >= 1 && i.cantidad <= 20)
    .slice(0, 40);
  if (!pedidoItems.length) return json({ error: 'Tu carrito está vacío.' }, 400);

  // Productos: terminados de la tienda (con ficha web) y patrones digitales de la mercería
  const { data: filas, error: e1 } = await sb.from('inventario_items')
    .select('id, nombre, precio_venta, tipo, descripcion_web, categoria_id, centro_costo_id, unidad_medida, peso_gramos, stock_actual')
    .in('id', pedidoItems.map((i) => i.id)).eq('activo', true);
  if (e1) return json({ error: 'No pudimos leer los productos.' }, 500);
  const catIds = Array.from(new Set((filas || []).map((p: any) => p.categoria_id).filter(Boolean)));
  const { data: cats } = catIds.length ? await sb.from('categorias_inventario').select('id, nombre').in('id', catIds) : { data: [] as any[] };
  const nombreCat = new Map((cats || []).map((k: any) => [k.id, k.nombre]));
  const esDigitalItem = (p: any) => nombreCat.get(p.categoria_id) === CATEGORIA_DIGITAL;
  const esMaterial = (p: any) => p.tipo === 'merceria' && p.centro_costo_id === CENTRO_MERCERIA && nombreCat.get(p.categoria_id) !== CATEGORIA_EMPAQUES && !esDigitalItem(p);
  const productos = (filas || []).filter((p: any) => esDigitalItem(p) || esMaterial(p) || (p.tipo === 'producto_terminado' && p.descripcion_web != null));
  const mapa = new Map(productos.map((p: any) => [p.id, p]));
  if (pedidoItems.some((i) => !mapa.has(i.id))) return json({ error: 'Algún producto del carrito ya no está disponible.' }, 409);
  const nDigitales = pedidoItems.filter((i) => esDigitalItem(mapa.get(i.id))).length;
  const digital = nDigitales === pedidoItems.length;
  if (nDigitales > 0 && !digital) return json({ error: 'Los patrones se compran por separado de los productos físicos. Paga primero uno y luego el otro.' }, 409);
  const nMateriales = pedidoItems.filter((i) => esMaterial(mapa.get(i.id))).length;
  const materiales = nMateriales === pedidoItems.length;
  if (nMateriales > 0 && !materiales) return json({ error: 'Los materiales de la Mercería se compran por separado de los productos de la Tienda. Paga primero uno y luego el otro.' }, 409);
  // Precio de la unidad de venta (ovillo) y existencias en unidades de venta
  const porOvillo = (p: any) => esMaterial(p) && CATEGORIAS_POR_OVILLO.includes(nombreCat.get(p.categoria_id)) && Number(p.peso_gramos) > 0;
  const precioUnidad = (p: any) => porOvillo(p) ? Math.round((Number(p.precio_venta) * Number(p.peso_gramos)) / 100) * 100 : Number(p.precio_venta);
  const unidadesDisponibles = (p: any) => (p.unidad_medida === 'gramo' && Number(p.peso_gramos) > 0)
    ? Math.floor(Number(p.stock_actual) / Number(p.peso_gramos)) : Math.floor(Number(p.stock_actual));
  if (materiales) {
    // Existencias: se suman las cantidades repetidas del mismo producto y se compara con lo que hay.
    const pedidas = new Map<string, number>();
    pedidoItems.forEach((i) => pedidas.set(i.id, (pedidas.get(i.id) || 0) + i.cantidad));
    for (const [id, cant] of pedidas) {
      const p = mapa.get(id); const hay = unidadesDisponibles(p) || 0;
      if (hay <= 0) return json({ error: `«${p.nombre}» está agotado por ahora.` }, 409);
      if (cant > hay) return json({ error: `De «${p.nombre}» solo quedan ${hay} unidades.` }, 409);
    }
  }
  // Un patrón digital se compra una sola vez por pedido
  if (digital) pedidoItems.forEach((i) => { i.cantidad = 1; });

  const recoge = !digital && c.entrega === 'recogida';
  const nombre = limpio(c.nombre, 120), correo = limpio(c.correo, 120).toLowerCase(), telefono = limpio(c.telefono, 20);
  const ciudad = digital ? TEXTO_DIGITAL : (recoge ? TEXTO_RECOGIDA : limpio(c.ciudad, 60));
  const direccion = digital ? TEXTO_DIGITAL : (recoge ? TEXTO_RECOGIDA : limpio(c.direccion, 250));
  const notas = limpio(c.notas, 500);
  if (!cotizando && (!nombre || !CORREO_OK.test(correo) || telefono.replace(/\D/g, '').length < 10 || !ciudad || direccion.length < 6))
    return json({ error: (recoge || digital) ? 'Revisa tus datos: nombre, correo y teléfono.' : 'Revisa tus datos: nombre, correo, teléfono, ciudad y dirección.' }, 400);

  // Envío: digital o recoger en tienda = $0; a domicilio = tarifa de la ciudad (o la de "Otro (nacional)").
  // Materiales de la Mercería a domicilio: se cobra $0 en línea (envío contraentrega) y se informa el estimado.
  let envio: number | null = null;
  let envioEstimado: number | null = null;
  const envioAlRecibir = materiales && !recoge;
  if (recoge || digital) envio = 0;
  else {
    const { data: tarifas } = await sb.from('tarifas_envio_ciudad').select('ciudad, valor').eq('activo', true);
    const tarifa = ciudad ? ((tarifas || []).find((t: any) => t.ciudad === ciudad) || (tarifas || []).find((t: any) => t.ciudad === 'Otro (nacional)')) : null;
    if (!cotizando && !tarifa) return json({ error: 'No pudimos calcular el envío.' }, 500);
    envioEstimado = tarifa ? Number(tarifa.valor) : null;
    envio = envioAlRecibir ? 0 : envioEstimado;
  }

  // Sesión de clienta (si hay): se liga el pedido a su cuenta y también cuenta su correo para la primera compra.
  let userId: string | null = null, correoCuenta = '';
  const auth = req.headers.get('Authorization') || '';
  if (auth.startsWith('Bearer ') && auth.length > 60) {
    const { data } = await sb.auth.getUser(auth.slice(7));
    userId = data?.user?.id ?? null; correoCuenta = (data?.user?.email || '').toLowerCase();
  }

  // Descuento de primera compra (no aplica a patrones digitales)
  let pct = 0;
  if (!digital && PCT_PRIMERA_COMPRA > 0 && CORREO_OK.test(correo)) {
    const { data: primera } = await sb.rpc('fn_es_primera_compra_web', { p_correo: correo, p_telefono: telefono });
    let ok = primera === true;
    if (ok && correoCuenta && correoCuenta !== correo) {
      const { data: primeraCuenta } = await sb.rpc('fn_es_primera_compra_web', { p_correo: correoCuenta, p_telefono: '' });
      ok = primeraCuenta === true;
    }
    if (ok) pct = PCT_PRIMERA_COMPRA;
  }

  const valores = pedidoItems.map((i) => precioUnidad(mapa.get(i.id)) * i.cantidad);
  const subtotal = valores.reduce((s, v) => s + v, 0);
  const descuento = subtotal - valores.reduce((s, v) => s + conDescuento(v, pct), 0);

  if (cotizando) {
    return json({ primera: pct > 0, pct, subtotal, descuento, envio, digital, materiales, envio_al_recibir: envioAlRecibir, envio_estimado: envioAlRecibir ? envioEstimado : null, total: subtotal - descuento + (envio ?? 0) });
  }

  const total = subtotal - descuento + Number(envio);
  const centavos = Math.round(total * 100);
  if (total < 1500) return json({ error: 'El valor mínimo de pago es $1.500.' }, 400);

  const { data: ref } = await sb.rpc('fn_referencia_pedido_web');
  const referencia = String(ref);
  const notasPedido = [notas, envioAlRecibir ? `Envío contraentrega: lo paga la clienta a la transportadora al recibir${envioEstimado != null ? ` (estimado $${envioEstimado.toLocaleString('es-CO')})` : ''}` : ''].filter(Boolean).join(' · ');
  const { data: pedido, error: e2 } = await sb.from('pedidos_web').insert({
    referencia, user_id: userId, nombre, correo, telefono, ciudad, direccion, notas: notasPedido || null,
    subtotal, envio: Number(envio), total, descuento_pct: pct, descuento, es_digital: digital, envio_al_recibir: envioAlRecibir,
  }).select('id').single();
  if (e2 || !pedido) return json({ error: 'No pudimos crear tu pedido.' }, 500);

  await sb.from('pedidos_web_items').insert(pedidoItems.map((i) => ({
    pedido_id: pedido.id, producto_id: i.id, nombre: mapa.get(i.id).nombre,
    precio: precioUnidad(mapa.get(i.id)), cantidad: i.cantidad,
  })));

  const firma = await sha256(`${referencia}${centavos}COP${secretoIntegridad}`);
  const p = new URLSearchParams({
    'public-key': llavePublica,
    'currency': 'COP',
    'amount-in-cents': String(centavos),
    'reference': referencia,
    'signature:integrity': firma,
    'redirect-url': `${SITIO}/gracias.html?ref=${encodeURIComponent(referencia)}`,
    'customer-data:email': correo,
    'customer-data:full-name': nombre,
    'customer-data:phone-number': telefono.replace(/\D/g, '').slice(-10),
    'customer-data:phone-number-prefix': '+57',
  });
  return json({ url: `https://checkout.wompi.co/p/?${p.toString()}`, referencia, total, envio, descuento, digital, envio_al_recibir: envioAlRecibir });
});
