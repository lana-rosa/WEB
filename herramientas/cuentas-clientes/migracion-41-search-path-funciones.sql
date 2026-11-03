-- Migración 41 (3-nov-2026): fija el search_path de todas las funciones de public que no lo tenían
-- (aviso «function_search_path_mutable» del asesor de seguridad de Supabase).
-- search_path = public, extensions, pg_temp equivale a lo que ya veían las llamadas de la API
-- (las extensiones pgcrypto, uuid-ossp y pg_net viven en «extensions»). No cambia permisos ni cuerpo de las funciones.
-- Reversa: alter function public.<nombre>(<args>) reset search_path;  (o repetir el bloque con RESET)
do $$
declare r record; n int := 0;
begin
  for r in
    select p.oid::regprocedure as firma
    from pg_proc p
    join pg_namespace ns on ns.oid = p.pronamespace
    where ns.nspname = 'public' and p.prokind = 'f' and p.proconfig is null
      and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')
  loop
    execute format('alter function %s set search_path = public, extensions, pg_temp', r.firma);
    n := n + 1;
  end loop;
  raise notice 'search_path fijado en % funciones', n;
end $$;
