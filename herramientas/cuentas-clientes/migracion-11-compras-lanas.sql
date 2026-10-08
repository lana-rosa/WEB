-- Lanas e hilos que la clienta compró en Lana Rosa (8-oct-2026).
-- mis_compras_lanas(): devuelve, de la clienta con sesión, las lanas e hilos de la Mercería que compró en la web (pedido pagado),
--   en pedidos del ERP o en la tienda física. La Agenda de Rosina los agrega sola a la hoja "Inventario de lanas" (una vez por compra,
--   usando "clave" para no repetir). Solo lee; cada clienta ve únicamente lo suyo.

create or replace function public.mis_compras_lanas()
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

  select coalesce(jsonb_agg(to_jsonb(x) order by x.fecha, x.clave), '[]'::jsonb) into v_res from (
    -- compras en la tienda física
    select 'pos:' || d.id::text as clave, coalesce(vp.fecha, vp.created_at)::date as fecha, i.nombre, i.marca, i.color, i.material, d.cantidad, c.nombre as categoria
      from ventas_pos vp
      join ventas_pos_detalle d on d.venta_id = vp.id
      join inventario_items i on i.id = d.inventario_item_id
      left join categorias_inventario c on c.id = i.categoria_id
     where vp.tercero_id = v_t and vp.estado <> 'anulada' and i.tipo = 'merceria' and coalesce(c.nombre, '') in ('Lanas', 'Hilos')
    union all
    -- pedidos de la web ya pagados
    select 'web:' || it.id::text, coalesce(w.pagado_at, w.created_at)::date, i.nombre, i.marca, i.color, i.material, it.cantidad, c.nombre
      from pedidos_web w
      join pedidos_web_items it on it.pedido_id = w.id
      join inventario_items i on i.id = it.producto_id
      left join categorias_inventario c on c.id = i.categoria_id
     where w.estado = 'pagado' and (w.user_id = auth.uid() or lower(w.correo) = lower(coalesce(v_email, '')))
       and i.tipo = 'merceria' and coalesce(c.nombre, '') in ('Lanas', 'Hilos')
    union all
    -- pedidos del ERP (WhatsApp, redes) con anticipo pagado que no vienen de un pedido web ya contado arriba
    select 'ped:' || p.id::text, p.created_at::date, i.nombre, i.marca, i.color, i.material, p.cantidad, c.nombre
      from pedidos_canal_venta p
      join inventario_items i on i.id = p.inventario_item_id
      left join categorias_inventario c on c.id = i.categoria_id
     where p.tercero_id = v_t and coalesce(p.anticipo_pagado, false)
       and i.tipo = 'merceria' and coalesce(c.nombre, '') in ('Lanas', 'Hilos')
       and not exists (select 1 from pedidos_web w2 where p.id = any(coalesce(w2.erp_pedidos, '{}')))
  ) x;
  return v_res;
end $f$;

revoke all on function public.mis_compras_lanas() from public, anon;
grant execute on function public.mis_compras_lanas() to authenticated;
