-- Lista de espera de los talleres de Lana Rosa Academy. Aplicada en Supabase el 17-oct-2026.
-- Se llena desde la web (js/lista-espera.js, función unirme_lista_espera_taller, ejecutable por visitantes). Sara la ve en Supabase:
--   select * from v_lista_espera_talleres;   (marcar avisadas: update lista_espera_talleres set avisada = true where id = '...';)
create table if not exists public.lista_espera_talleres (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  taller text not null,
  nombre text not null,
  telefono text not null,
  correo text,
  personas int not null default 1 check (personas between 1 and 20),
  acepta_datos boolean not null,
  fecha_aceptacion timestamptz not null default now(),
  medio_autorizacion text not null default 'Lista de espera de talleres (lanarosacrochet.com)',
  avisada boolean not null default false,
  notas text
);
alter table public.lista_espera_talleres enable row level security;
revoke all on public.lista_espera_talleres from anon, authenticated;

create or replace function public.unirme_lista_espera_taller(
  p_nombre text, p_telefono text, p_correo text default null, p_personas int default 1,
  p_acepta_datos boolean default false, p_taller text default 'Desconecta para Conectar')
returns void language plpgsql security definer set search_path to 'public' as $$
declare
  v_tel text := left(trim(coalesce(p_telefono, '')), 30);
  v_correo text := nullif(left(trim(coalesce(p_correo, '')), 120), '');
  v_taller text := left(coalesce(nullif(trim(p_taller), ''), 'Desconecta para Conectar'), 80);
  v_personas int := least(greatest(coalesce(p_personas, 1), 1), 20);
begin
  if p_nombre is null or length(trim(p_nombre)) < 2 then raise exception 'Nombre inválido'; end if;
  if length(regexp_replace(v_tel, '[^0-9]', '', 'g')) < 7 then raise exception 'Teléfono inválido'; end if;
  if v_correo is not null and v_correo !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Correo inválido'; end if;
  if p_acepta_datos is not true then raise exception 'Debes aceptar el tratamiento de datos personales'; end if;
  update lista_espera_talleres
     set nombre = left(trim(p_nombre), 100), correo = coalesce(v_correo, correo), personas = v_personas, fecha_aceptacion = now()
   where taller = v_taller and not avisada
     and regexp_replace(telefono, '[^0-9]', '', 'g') = regexp_replace(v_tel, '[^0-9]', '', 'g');
  if not found then
    insert into lista_espera_talleres (taller, nombre, telefono, correo, personas, acepta_datos)
    values (v_taller, left(trim(p_nombre), 100), v_tel, v_correo, v_personas, true);
  end if;
end $$;
revoke all on function public.unirme_lista_espera_taller(text, text, text, int, boolean, text) from public;
grant execute on function public.unirme_lista_espera_taller(text, text, text, int, boolean, text) to anon, authenticated;

create or replace view public.v_lista_espera_talleres as
  select created_at, taller, nombre, telefono, correo, personas, avisada, notas
  from lista_espera_talleres order by created_at desc;
revoke all on public.v_lista_espera_talleres from public, anon, authenticated;
