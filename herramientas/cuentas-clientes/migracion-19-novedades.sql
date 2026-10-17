-- Autorización OPCIONAL para recibir novedades, recursos y promociones (Ley 1581 de 2012). Aplicada en Supabase el 17-oct-2026.
-- Es aparte de la aceptación del tratamiento de datos (que sigue siendo obligatoria para crear la cuenta).
-- Lista de suscriptoras para Sara: select * from v_suscriptores_novedades where acepta_novedades;  (solo desde el panel de Supabase)
create table if not exists public.cuentas_novedades (
  user_id uuid primary key references auth.users(id) on delete cascade,
  acepta boolean not null default false,
  fecha_aceptacion timestamptz,
  medio text,
  version_politica text,
  updated_at timestamptz not null default now()
);
alter table public.cuentas_novedades enable row level security;
revoke all on public.cuentas_novedades from anon, authenticated;

create or replace function public.registrar_novedades(p_acepta boolean, p_medio text default null)
returns void language plpgsql security definer set search_path to 'public' as $$
begin
  if auth.uid() is null then raise exception 'Debes iniciar sesión'; end if;
  insert into cuentas_novedades (user_id, acepta, fecha_aceptacion, medio, version_politica)
  values (auth.uid(), coalesce(p_acepta, false), case when p_acepta is true then now() end, left(coalesce(nullif(trim(p_medio), ''), 'Cuenta web (lanarosacrochet.com)'), 120), 'v1.0')
  on conflict (user_id) do update
    set acepta = excluded.acepta,
        fecha_aceptacion = case when excluded.acepta then now() else cuentas_novedades.fecha_aceptacion end,
        medio = excluded.medio,
        updated_at = now();
end $$;

create or replace function public.mis_novedades()
returns boolean language sql stable security definer set search_path to 'public' as $$
  select coalesce((select acepta from cuentas_novedades where user_id = auth.uid()), false);
$$;

revoke all on function public.registrar_novedades(boolean, text) from public, anon;
revoke all on function public.mis_novedades() from public, anon;
grant execute on function public.registrar_novedades(boolean, text) to authenticated;
grant execute on function public.mis_novedades() to authenticated;

create or replace view public.v_suscriptores_novedades as
  select t.nombre_completo as nombre, t.email, t.telefono, t.ciudad, c.created_at as cuenta_creada,
         coalesce(n.acepta, false) as acepta_novedades, n.fecha_aceptacion, n.medio
  from cuentas_clientes_web c
  join terceros t on t.id = c.tercero_id
  left join cuentas_novedades n on n.user_id = c.user_id;
revoke all on public.v_suscriptores_novedades from public, anon, authenticated;
