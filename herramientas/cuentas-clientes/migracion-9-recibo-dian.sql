-- Recibo con los datos del recibo de venta del ERP (8-oct-2026): agrega correo, teléfono, dirección, ciudad, referencia del pago,
-- consecutivo(s) del pedido en el ERP y documento del cliente (si lo tiene registrado; los "WEB-…" de registro no se muestran).
-- Los datos del vendedor (Sara Loaiza Muñoz, NIT, Régimen SIMPLE, no responsable de IVA) los pone cuenta.html, igual que el ERP.
create or replace function public.mi_recibo(p_ref text)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $f$
declare v_t uuid; v_email text; w record; vp record; v_items jsonb; v_fact jsonb; v_pagos text; v_doc text; v_cons text[];
begin
  if auth.uid() is null then return null; end if;
  select tercero_id into v_t from cuentas_clientes_web where user_id = auth.uid();
  select email into v_email from auth.users where id = auth.uid();
  select case when t.numero_documento is not null and t.numero_documento !~* '^WEB-' then trim(coalesce(t.tipo_documento || ' ', '') || t.numero_documento) end
    into v_doc from terceros t where t.id = v_t;

  select * into w from pedidos_web
   where referencia = p_ref and estado = 'pagado'
     and (user_id = auth.uid() or lower(correo) = lower(coalesce(v_email, '')));
  if found then
    select coalesce(jsonb_agg(jsonb_build_object('nombre', i.nombre, 'cantidad', i.cantidad, 'precio', i.precio) order by i.nombre), '[]'::jsonb)
      into v_items from pedidos_web_items i where i.pedido_id = w.id;
    select coalesce(jsonb_agg(jsonb_build_object('prefijo', d.prefijo, 'numero', d.numero, 'fecha', d.fecha_emision)), '[]'::jsonb)
      into v_fact from documentos_electronicos d
     where d.tipo = 'factura' and d.estado = 'emitida' and d.origen = 'pedido_canal' and d.origen_id = any(coalesce(w.erp_pedidos, '{}'));
    select array_agg(p.consecutivo order by p.consecutivo) into v_cons from pedidos_canal_venta p where p.id = any(coalesce(w.erp_pedidos, '{}'));
    return jsonb_build_object(
      'origen', 'web', 'referencia', w.referencia, 'consecutivos', coalesce(to_jsonb(v_cons), '[]'::jsonb),
      'fecha', coalesce(w.pagado_at, w.created_at),
      'nombre', w.nombre, 'documento', v_doc, 'correo', w.correo, 'telefono', w.telefono,
      'ciudad', w.ciudad, 'direccion', case when w.ciudad = 'Recoger en tienda' then null else w.direccion end,
      'items', v_items, 'subtotal', w.subtotal, 'descuento', coalesce(w.descuento, 0),
      'envio', coalesce(w.envio, 0), 'total', w.total,
      'medio_pago', case when coalesce(w.metodo_pago, '') ilike '%paypal%' or w.paypal_order_id is not null then 'PayPal' else 'Pago en línea con Wompi' end,
      'pago_ref', coalesce(w.wompi_transaction_id, w.paypal_capture_id),
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
        'origen', 'tienda', 'referencia', vp.consecutivo, 'consecutivos', '[]'::jsonb, 'fecha', coalesce(vp.fecha, vp.created_at),
        'nombre', (select t.nombre_completo from terceros t where t.id = v_t), 'documento', v_doc,
        'correo', v_email, 'telefono', (select t.telefono from terceros t where t.id = v_t), 'ciudad', null, 'direccion', null,
        'items', v_items, 'subtotal', vp.subtotal, 'descuento', 0, 'envio', 0, 'total', vp.total,
        'medio_pago', v_pagos, 'pago_ref', null, 'entrega', 'Compra en la tienda', 'facturas', v_fact);
    end if;
  end if;
  return null;
end $f$;

revoke all on function public.mi_recibo(text) from public, anon;
grant execute on function public.mi_recibo(text) to authenticated;
