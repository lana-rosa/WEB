-- Patrones de tejido que la clienta compró en Lana Rosa (8-oct-2026). Preparado para cuando se vendan patrones.
-- mis_compras_patrones(): devuelve, de la clienta con sesión, los productos de la categoría "Patrones" del inventario que compró
--   (pedido web pagado, pedido del ERP con anticipo o tienda física). La Agenda de Rosina los agrega sola a la hoja "Mis patrones"
--   (una vez por compra, usando "clave"). Mientras no exista la categoría "Patrones" devuelve una lista vacía.
-- Para activarlo: en el ERP crear la categoría de inventario "Patrones" y los productos de esa categoría.

create or replace function public.mis_compras_patrones()
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
    select 'pos:' || d.id::text as clave, coalesce(vp.fecha, vp.created_at)::date as fecha, i.nombre
      from ventas_pos vp
      join ventas_pos_detalle d on d.venta_id = vp.id
      join inventario_items i on i.id = d.inventario_item_id
      join categorias_inventario c on c.id = i.categoria_id and c.nombre = 'Patrones'
     where vp.tercero_id = v_t and vp.estado <> 'anulada'
    union all
    select 'web:' || it.id::text, coalesce(w.pagado_at, w.created_at)::date, i.nombre
      from pedidos_web w
      join pedidos_web_items it on it.pedido_id = w.id
      join inventario_items i on i.id = it.producto_id
      join categorias_inventario c on c.id = i.categoria_id and c.nombre = 'Patrones'
     where w.estado = 'pagado' and (w.user_id = auth.uid() or lower(w.correo) = lower(coalesce(v_email, '')))
    union all
    select 'ped:' || p.id::text, p.created_at::date, i.nombre
      from pedidos_canal_venta p
      join inventario_items i on i.id = p.inventario_item_id
      join categorias_inventario c on c.id = i.categoria_id and c.nombre = 'Patrones'
     where p.tercero_id = v_t and coalesce(p.anticipo_pagado, false)
       and not exists (select 1 from pedidos_web w2 where p.id = any(coalesce(w2.erp_pedidos, '{}')))
  ) x;
  return v_res;
end $f$;

revoke all on function public.mis_compras_patrones() from public, anon;
grant execute on function public.mis_compras_patrones() to authenticated;
