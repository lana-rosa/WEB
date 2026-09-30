-- Pedidos pagados por la web (Wompi) → ERP (30-sep-2026).
-- Cuando el webhook de Wompi marca un pedido web como 'pagado', se crean en el ERP los pedidos del canal
-- "Tienda virtual" con su pago (mismas funciones que usa el ERP: fn_crear_pedido_canal, fn_pagar_anticipo_pedido y
-- fn_contabilizar_pago_pedido_canal). Así aparecen en Pedidos, en la caja de Tienda y en Bancos (asiento contable).

alter table public.pedidos_web
  add column if not exists erp_registrado_at timestamptz,
  add column if not exists erp_pedidos uuid[],
  add column if not exists erp_error text;

create or replace function public.fn_registrar_pedido_web_en_erp(p_id uuid) returns uuid[]
language plpgsql security definer set search_path = public as $$
declare
  w record; it record; v_t uuid; v_ids uuid[] := '{}'; v_ped uuid; v_primero boolean := true;
  v_metodo text; v_obs text; v_envio numeric; v_monto numeric;
  v_centro_defecto constant uuid := '2c1577b5-514e-4952-ba15-4feb64ea1879'; -- Tienda/Mercería
begin
  select * into w from pedidos_web where id = p_id for update;
  if w.id is null or w.estado <> 'pagado' or w.erp_registrado_at is not null then return null; end if;

  -- Cliente: la cuenta de la clienta, o el cliente con el mismo correo, o uno nuevo
  if w.user_id is not null then select tercero_id into v_t from cuentas_clientes_web where user_id = w.user_id; end if;
  if v_t is null then
    select id into v_t from terceros where lower(email) = lower(w.correo) and tipo in ('cliente', 'mixto') and activo order by created_at limit 1;
  end if;
  if v_t is null then
    insert into terceros (tipo, tipo_documento, numero_documento, nombre_completo, telefono, email, ciudad, direccion,
                          acepta_tratamiento_datos, fecha_aceptacion_datos, medio_autorizacion, version_politica)
    values ('cliente', 'CC', 'WEB-' || substr(md5(lower(w.correo)), 1, 10), w.nombre, w.telefono, w.correo, w.ciudad, w.direccion,
            true, now(), 'Compra en la web (lanarosacrochet.com)', 'v1.0')
    on conflict do nothing
    returning id into v_t;
    if v_t is null then select id into v_t from terceros where tipo_documento = 'CC' and numero_documento = 'WEB-' || substr(md5(lower(w.correo)), 1, 10); end if;
  end if;

  -- Medio de pago en los nombres que ya usa el ERP para asignar banco
  -- Medio "wompi_…": no coincide con ningún medio asignado a una cuenta en el ERP, así que el dinero va a la
  -- cuenta predeterminada (donde consigna Wompi) sin mezclarse con los pagos directos por Nequi o transferencia.
  v_metodo := 'wompi_' || case upper(coalesce(w.metodo_pago, ''))
    when 'CARD' then 'tarjeta' when 'BANCOLOMBIA_TRANSFER' then 'bancolombia' when 'BANCOLOMBIA_COLLECT' then 'bancolombia'
    when 'BANCOLOMBIA_QR' then 'qr' when '' then 'otro' else lower(w.metodo_pago) end;

  v_obs := 'PEDIDO WEB ' || w.referencia || ' · Pagó por Wompi (' || coalesce(w.metodo_pago, 'sin dato') || '), transacción ' || coalesce(w.wompi_transaction_id, 'sin dato')
        || ' · Cliente: ' || w.nombre || ', WhatsApp ' || w.telefono || ', ' || w.correo
        || ' · Enviar a: ' || w.ciudad || ', ' || w.direccion
        || case when w.notas is not null then ' · Notas: ' || w.notas else '' end;

  for it in
    select i.*, inv.centro_costo_id as centro from pedidos_web_items i left join inventario_items inv on inv.id = i.producto_id
    where i.pedido_id = w.id order by i.id
  loop
    v_envio := case when v_primero then w.envio else 0 end;
    v_monto := it.precio * it.cantidad + v_envio;
    v_ped := fn_crear_pedido_canal('tienda_virtual', coalesce(it.centro, v_centro_defecto), v_t, it.producto_id, it.nombre,
                                   it.cantidad, it.precio * it.cantidad, v_envio, v_obs, null);
    perform fn_pagar_anticipo_pedido(v_ped, jsonb_build_array(jsonb_build_object('metodo_pago', v_metodo, 'monto', v_monto)), null, null);
    perform fn_contabilizar_pago_pedido_canal(v_ped, 'anticipo');
    update pedidos_canal_venta set fecha_pago_anticipo = coalesce(w.pagado_at, now()), fecha_pago_saldo = coalesce(w.pagado_at, now()) where id = v_ped;
    v_ids := v_ids || v_ped;
    v_primero := false;
  end loop;

  update pedidos_web set erp_registrado_at = now(), erp_pedidos = v_ids, erp_error = null where id = w.id;
  return v_ids;
end $$;
revoke execute on function public.fn_registrar_pedido_web_en_erp(uuid) from public, anon, authenticated;

create or replace function public.fn_trg_pedido_web_erp() returns trigger language plpgsql security definer set search_path = public as $$
begin
  begin
    perform fn_registrar_pedido_web_en_erp(new.id);
  exception when others then
    update pedidos_web set erp_error = left(sqlerrm, 500) where id = new.id;
  end;
  return new;
end $$;
drop trigger if exists trg_pedido_web_erp on public.pedidos_web;
create trigger trg_pedido_web_erp after update of estado on public.pedidos_web
  for each row when (new.estado = 'pagado' and old.estado is distinct from 'pagado') execute function public.fn_trg_pedido_web_erp();

-- Reintento manual para pedidos pagados que no se pudieron pasar al ERP (solo administradores)
create or replace function public.fn_reintentar_pedidos_web_erp() returns integer
language plpgsql security definer set search_path = public as $$
declare r record; n integer := 0;
begin
  if fn_rol_actual() is distinct from 'administrador'::rol_usuario then raise exception 'Solo administradores'; end if;
  for r in select id from pedidos_web where estado = 'pagado' and erp_registrado_at is null loop
    begin perform fn_registrar_pedido_web_en_erp(r.id); n := n + 1;
    exception when others then update pedidos_web set erp_error = left(sqlerrm, 500) where id = r.id; end;
  end loop;
  return n;
end $$;
revoke execute on function public.fn_reintentar_pedidos_web_erp() from public, anon;
grant execute on function public.fn_reintentar_pedidos_web_erp() to authenticated;
