-- Recibos descargables y factura electrónica en la cuenta de la clienta (8-oct-2026).
-- mi_recibo(ref): datos del recibo de una compra pagada (pedido web "LRW-…" o compra en tienda) de la clienta con sesión.
-- mis_comprobantes(): por cada pedido/compra de la clienta, qué recibo puede descargar y qué facturas electrónicas
--   (documentos_electronicos) ya están registradas en el ERP. cuenta.html cruza el resultado por "consecutivo".
-- Solo lee: no cambia mis_pedidos ni ninguna tabla.

create or replace function public.mi_recibo(p_ref text)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $f$
declare v_t uuid; v_email text; w record; vp record; v_items jsonb; v_fact jsonb; v_pagos text;
begin
  if auth.uid() is null then return null; end if;
  select tercero_id into v_t from cuentas_clientes_web where user_id = auth.uid();
  select email into v_email from auth.users where id = auth.uid();

  select * into w from pedidos_web
   where referencia = p_ref and estado = 'pagado'
     and (user_id = auth.uid() or lower(correo) = lower(coalesce(v_email, '')));
  if found then
    select coalesce(jsonb_agg(jsonb_build_object('nombre', i.nombre, 'cantidad', i.cantidad, 'precio', i.precio) order by i.nombre), '[]'::jsonb)
      into v_items from pedidos_web_items i where i.pedido_id = w.id;
    select coalesce(jsonb_agg(jsonb_build_object('prefijo', d.prefijo, 'numero', d.numero, 'fecha', d.fecha_emision)), '[]'::jsonb)
      into v_fact from documentos_electronicos d
     where d.tipo = 'factura' and d.estado = 'emitida' and d.origen = 'pedido_canal' and d.origen_id = any(coalesce(w.erp_pedidos, '{}'));
    return jsonb_build_object(
      'origen', 'web', 'referencia', w.referencia, 'fecha', coalesce(w.pagado_at, w.created_at),
      'nombre', w.nombre, 'items', v_items, 'subtotal', w.subtotal, 'descuento', coalesce(w.descuento, 0),
      'envio', coalesce(w.envio, 0), 'total', w.total,
      'medio_pago', case when coalesce(w.metodo_pago, '') ilike '%paypal%' or w.paypal_order_id is not null then 'PayPal' else 'Pago en línea con Wompi' end,
      'entrega', case when w.ciudad = 'Recoger en tienda' then 'Recoger en tienda' else w.ciudad end,
      'facturas', v_fact);
  end if;

  if v_t is not null then
    select * into vp from ventas_pos where consecutivo = p_ref and tercero_id = v_t and estado <> 'anulada';
    if found then
      select coalesce(jsonb_agg(jsonb_build_object('nombre', d.descripcion, 'cantidad', d.cantidad, 'precio', d.precio_unitario) order by d.descripcion), '[]'::jsonb)
        into v_items from ventas_pos_detalle d where d.venta_id = vp.id;
      select string_agg(distinct g.metodo_pago, ', ') into v_pagos from ventas_pos_pagos g where g.venta_id = vp.id;
      select coalesce(jsonb_agg(jsonb_build_object('prefijo', d.prefijo, 'numero', d.numero, 'fecha', d.fecha_emision)), '[]'::jsonb)
        into v_fact from documentos_electronicos d
       where d.tipo = 'factura' and d.estado = 'emitida' and d.origen = 'venta_pos' and d.origen_id = vp.id;
      return jsonb_build_object(
        'origen', 'tienda', 'referencia', vp.consecutivo, 'fecha', coalesce(vp.fecha, vp.created_at),
        'nombre', null, 'items', v_items, 'subtotal', vp.subtotal, 'descuento', 0, 'envio', 0, 'total', vp.total,
        'medio_pago', v_pagos, 'entrega', 'Compra en la tienda', 'facturas', v_fact);
    end if;
  end if;
  return null;
end $f$;

create or replace function public.mis_comprobantes()
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $f$
declare v_t uuid; v_email text; v_res jsonb;
begin
  if auth.uid() is null then return '[]'::jsonb; end if;
  select tercero_id into v_t from cuentas_clientes_web where user_id = auth.uid();
  select email into v_email from auth.users where id = auth.uid();

  select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) into v_res from (
    -- pedidos ya registrados en el ERP (los de la web llevan el recibo de su pedido web pagado)
    select p.consecutivo,
           (select w.referencia from pedidos_web w
             where p.id = any(coalesce(w.erp_pedidos, '{}')) and w.estado = 'pagado'
               and (w.user_id = auth.uid() or lower(w.correo) = lower(coalesce(v_email, ''))) limit 1) as recibo,
           (select coalesce(jsonb_agg(jsonb_build_object('prefijo', d.prefijo, 'numero', d.numero, 'fecha', d.fecha_emision)), '[]'::jsonb)
              from documentos_electronicos d
             where d.tipo = 'factura' and d.estado = 'emitida' and d.origen = 'pedido_canal' and d.origen_id = p.id) as facturas
      from pedidos_canal_venta p where p.tercero_id = v_t
    union all
    -- pedidos web pagados que todavía no pasan al ERP
    select w.referencia, w.referencia, '[]'::jsonb
      from pedidos_web w
     where w.estado = 'pagado' and coalesce(array_length(w.erp_pedidos, 1), 0) = 0
       and (w.user_id = auth.uid() or lower(w.correo) = lower(coalesce(v_email, '')))
    union all
    -- compras en la tienda física
    select vp.consecutivo, vp.consecutivo,
           (select coalesce(jsonb_agg(jsonb_build_object('prefijo', d.prefijo, 'numero', d.numero, 'fecha', d.fecha_emision)), '[]'::jsonb)
              from documentos_electronicos d
             where d.tipo = 'factura' and d.estado = 'emitida' and d.origen = 'venta_pos' and d.origen_id = vp.id)
      from ventas_pos vp where vp.tercero_id = v_t and vp.estado <> 'anulada'
  ) x
  where x.recibo is not null or jsonb_array_length(x.facturas) > 0;
  return v_res;
end $f$;

revoke all on function public.mi_recibo(text) from public, anon;
revoke all on function public.mis_comprobantes() from public, anon;
grant execute on function public.mi_recibo(text) to authenticated;
grant execute on function public.mis_comprobantes() to authenticated;
