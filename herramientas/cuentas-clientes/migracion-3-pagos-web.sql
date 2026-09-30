-- Pagos Wompi en la web, parte del lado de la cuenta y del carrito (30-sep-2026). Solo agrega/actualiza funciones.

-- Tarifas de envío visibles para el carrito (solo ciudad y valor, activas)
create or replace function public.obtener_tarifas_envio_web() returns table(ciudad text, valor numeric)
language sql stable security definer set search_path = public as $$
  select t.ciudad, t.valor from tarifas_envio_ciudad t where t.activo = true order by (t.ciudad = 'Otro (nacional)'), t.ciudad;
$$;
grant execute on function public.obtener_tarifas_envio_web() to anon, authenticated;

-- Aviso en la cuenta cuando se confirma el pago de un pedido web
create or replace function public.fn_mensaje_pago_web() returns trigger language plpgsql security definer set search_path = public as $$
declare v_user uuid; v_titulo text; v_cuerpo text;
begin
  begin
    if new.estado is not distinct from old.estado then return new; end if;
    v_user := new.user_id;
    if v_user is null then
      select u.id into v_user from auth.users u join cuentas_clientes_web c on c.user_id = u.id where lower(u.email) = lower(new.correo) limit 1;
    end if;
    if v_user is null then return new; end if;
    case new.estado
      when 'pagado' then v_titulo := 'Recibimos tu pago'; v_cuerpo := 'Tu pedido ' || new.referencia || ' está pagado. En breve empezamos a prepararlo y te avisamos por aquí.';
      when 'rechazado' then v_titulo := 'No se completó tu pago'; v_cuerpo := 'El pago del pedido ' || new.referencia || ' fue rechazado. Puedes intentarlo de nuevo desde la tienda o escribirnos por WhatsApp.';
      else return new;
    end case;
    insert into mensajes_cuenta (user_id, tipo, titulo, cuerpo, referencia) values (v_user, 'pedido', v_titulo, v_cuerpo, new.referencia);
  exception when others then null;
  end;
  return new;
end $$;
drop trigger if exists trg_mensaje_pago_web on public.pedidos_web;
create trigger trg_mensaje_pago_web after update of estado on public.pedidos_web
  for each row execute function public.fn_mensaje_pago_web();

-- Historial: incluye los pedidos pagados en línea
create or replace function public.mis_pedidos() returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_t uuid; v_email text; v_pedidos jsonb; v_solicitudes jsonb;
begin
  select tercero_id into v_t from cuentas_clientes_web where user_id = auth.uid();
  if v_t is null then return jsonb_build_object('pedidos', '[]'::jsonb, 'solicitudes', '[]'::jsonb); end if;
  select email into v_email from auth.users where id = auth.uid();

  select coalesce(jsonb_agg(to_jsonb(x) order by x.fecha desc), '[]'::jsonb) into v_pedidos from (
    select p.consecutivo, p.created_at as fecha, p.descripcion_producto as producto, p.cantidad,
           p.total_pedido as total, p.estado::text as estado, p.fecha_estimada_entrega as entrega, 'pedido'::text as origen,
           i.foto_url as foto, p.valor_envio as envio, p.anticipo_pagado, p.saldo_pagado
    from pedidos_canal_venta p left join inventario_items i on i.id = p.inventario_item_id
    where p.tercero_id = v_t
    union all
    select vp.consecutivo, coalesce(vp.fecha, vp.created_at),
           (select string_agg(d.descripcion || ' x' || d.cantidad::text, ', ') from ventas_pos_detalle d where d.venta_id = vp.id),
           null::numeric, vp.total, vp.estado, null::date, 'tienda'::text,
           null::text, null::numeric, null::boolean, null::boolean
    from ventas_pos vp where vp.tercero_id = v_t and vp.estado <> 'anulada'
    union all
    select w.referencia, w.created_at,
           (select string_agg(it.cantidad::text || ' x ' || it.nombre, ', ') from pedidos_web_items it where it.pedido_id = w.id),
           (select sum(it.cantidad) from pedidos_web_items it where it.pedido_id = w.id),
           w.total,
           case w.estado when 'pagado' then 'en_preparacion' when 'pendiente_pago' then 'esperando_pago' else w.estado end,
           null::date, 'web'::text,
           (select i2.foto_url from pedidos_web_items it join inventario_items i2 on i2.id = it.producto_id where it.pedido_id = w.id limit 1),
           w.envio, (w.estado = 'pagado'), (w.estado = 'pagado')
    from pedidos_web w where w.user_id = auth.uid() or lower(w.correo) = lower(v_email)
  ) x;

  select coalesce(jsonb_agg(to_jsonb(y) order by y.fecha desc), '[]'::jsonb) into v_solicitudes from (
    select o.consecutivo, o.created_at as fecha, left(o.descripcion, 200) as descripcion, o.etapa
    from oportunidades_venta o
    where o.tercero_id = v_t or lower(o.cliente_correo_libre) = lower(v_email)
  ) y;

  return jsonb_build_object('pedidos', v_pedidos, 'solicitudes', v_solicitudes);
end $$;
