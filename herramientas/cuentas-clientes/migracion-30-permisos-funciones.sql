-- Auditoría 360 (SEG-01 y SEG-02), aplicada el 26-oct-2026 con OK de Sara.
-- SEG-01: seis funciones internas del taller estaban abiertas a la llave pública (todas tienen guarda de sesión y de rol por dentro, así que era una segunda cerradura).
--         Solo las usa el ERP con sesión iniciada (rol authenticated).
-- SEG-02: toda función nueva nacía abierta a la llave pública. Desde ahora nace cerrada a PUBLIC y a anon; las funciones PÚBLICAS de la web hay que abrirlas
--         a propósito con una línea en su migración:  grant execute on function public.nombre(args) to anon, authenticated;
--         y toda función interna debe llevar:  revoke execute on function public.nombre(args) from public, anon;  (ya no hace falta si nace cerrada, pero no estorba).
-- Para volver atrás SEG-01:  grant execute on function <firma> to anon;  (por cada una de las seis firmas)
-- Para volver atrás SEG-02:  alter default privileges for role postgres grant execute on functions to public;
--                            alter default privileges for role postgres in schema public grant execute on functions to anon;

revoke execute on function public.fn_tejido_guardar_plan(uuid, uuid, numeric, integer, boolean) from public, anon;
revoke execute on function public.fn_tejido_guardar_plan(uuid, uuid, numeric, integer) from public, anon;
revoke execute on function public.fn_tejido_guardar_capacidad(uuid, numeric) from public, anon;
revoke execute on function public.fn_sugerencias_tejido() from public, anon;
revoke execute on function public.fn_agendar_pedido_anticipo_bajo(uuid, numeric, text) from public, anon;
revoke execute on function public.fn_ficha_insumo_guardar(uuid, jsonb, jsonb) from public, anon;
revoke execute on function public.fn_ficha_insumo_obtener(uuid) from public, anon;

grant execute on function public.fn_tejido_guardar_plan(uuid, uuid, numeric, integer, boolean) to authenticated, service_role;
grant execute on function public.fn_tejido_guardar_plan(uuid, uuid, numeric, integer) to authenticated, service_role;
grant execute on function public.fn_tejido_guardar_capacidad(uuid, numeric) to authenticated, service_role;
grant execute on function public.fn_sugerencias_tejido() to authenticated, service_role;
grant execute on function public.fn_agendar_pedido_anticipo_bajo(uuid, numeric, text) to authenticated, service_role;
grant execute on function public.fn_ficha_insumo_guardar(uuid, jsonb, jsonb) to authenticated, service_role;
grant execute on function public.fn_ficha_insumo_obtener(uuid) to authenticated, service_role;

alter default privileges for role postgres revoke execute on functions from public;
alter default privileges for role postgres in schema public revoke execute on functions from anon;
