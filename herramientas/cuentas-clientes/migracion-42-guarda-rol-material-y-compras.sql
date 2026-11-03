-- Migración 42 (3-nov-2026, A4b de la auditoría): guarda de rol en tres funciones del ERP que solo pedían sesión
-- (un cliente con cuenta también es «authenticated»).
--   fn_tomar_material_pedido                      -> administrador y taller
--   fn_compra_registrar_requisitos (2 versiones)  -> administrador
--   fn_compra_requisitos_info                     -> administrador
-- Sin usuario (service_role, editor SQL, cron) pasa igual que con los demás ayudantes. No cambia permisos ni search_path:
-- se inserta la guarda justo después del primer «begin» del cuerpo y se recrea la función con su definición actual.
-- Reversa: volver a crear la función sin las tres líneas «A4b».
do $$
declare r record; def text; guarda text; n int := 0;
begin
  for r in
    select p.oid, p.proname,
           case when p.proname = 'fn_tomar_material_pedido' then '''administrador'', ''taller''' else '''administrador''' end as roles,
           case when p.proname = 'fn_tomar_material_pedido' then 'La toma de material la hacen la administradora y el Taller.'
                else 'Las compras con requisitos las maneja la administradora.' end as msg
    from pg_proc p
    where p.pronamespace = 'public'::regnamespace
      and p.proname in ('fn_tomar_material_pedido','fn_compra_registrar_requisitos','fn_compra_requisitos_info')
  loop
    def := pg_get_functiondef(r.oid);
    if def like '%-- A4b%' then continue; end if;
    guarda := format(E'\n  -- A4b (3-nov-2026): guarda de rol\n  if auth.uid() is not null and coalesce(public.fn_rol_actual()::text, '''') not in (%s) then raise exception %L using errcode = ''42501''; end if;', r.roles, r.msg);
    def := regexp_replace(def, '(\mbegin\M)', '\1' || replace(guarda, '\', '\\'), 'i');  -- solo el primer begin
    execute def;
    n := n + 1;
  end loop;
  raise notice 'guarda A4b puesta en % funciones', n;
end $$;
