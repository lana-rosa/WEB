-- Fase 5 de la agenda (8-oct-2026): borrar la copia en la nube e ingresos digitales para contabilidad.
--
-- 1) agenda_nube_borrar(): borra la copia en la nube de la persona que la llama. Se puede usar aunque la membresía haya vencido
--    (derecho a suprimir los datos). La agenda lo llama desde «Borrar mi copia en la nube».
--    *** PENDIENTE DE CREAR: el editor del MCP de Supabase se queda esperando confirmación con instrucciones de borrado, así que
--    hay que pegar este bloque en Supabase → SQL Editor y ejecutarlo. Mientras no exista, la agenda hace un respaldo:
--    deja la copia vacía (agenda_nube_guardar con {}), que borra el contenido pero no la fila. ***
create or replace function public.agenda_nube_borrar() returns jsonb
language plpgsql security definer set search_path to 'public' as $$
begin
  if auth.uid() is null then return jsonb_build_object('error', 'sin_sesion'); end if;
  delete from public.agenda_nube where user_id = auth.uid();
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.agenda_nube_borrar() from public, anon;
grant execute on function public.agenda_nube_borrar() to authenticated;

-- 2) ingresos_digitales_web(desde, hasta): lista de lo cobrado por Wompi en membresías y patrones digitales (pedidos reales, no de
--    prueba). Solo para la administradora. Sirve para registrar a mano el ingreso en contabilidad, porque estos pedidos no pasan al ERP.
--    Ya está creada en Supabase. Uso (SQL Editor):  select * from ingresos_digitales_web('2026-11-01', '2026-11-30');
create or replace function public.ingresos_digitales_web(p_desde date default null, p_hasta date default null)
returns table (referencia text, fecha timestamptz, tipo text, detalle text, valor numeric, medio_pago text, correo text, transaccion_wompi text)
language plpgsql stable security definer set search_path to 'public' as $$
begin
  if fn_rol_actual() is distinct from 'administrador'::rol_usuario then raise exception 'Solo la administradora puede ver esto'; end if;
  return query
    select w.referencia, w.pagado_at,
           case when w.membresia_plan is not null then 'Membresía ' || w.membresia_plan else 'Patrón digital' end,
           (select string_agg(i.nombre, ', ') from pedidos_web_items i where i.pedido_id = w.id),
           w.total, w.metodo_pago, w.correo, w.wompi_transaction_id
    from pedidos_web w
    where w.es_digital and w.estado = 'pagado' and not coalesce(w.es_prueba, false)
      and (p_desde is null or (w.pagado_at at time zone 'America/Bogota')::date >= p_desde)
      and (p_hasta is null or (w.pagado_at at time zone 'America/Bogota')::date <= p_hasta)
    order by w.pagado_at;
end $$;
