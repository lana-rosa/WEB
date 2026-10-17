-- Lista de espera de los talleres: nivel, disponibilidad y proyecto de interés (opcionales). Aplicada en Supabase el 17-oct-2026.
-- La web (js/lista-espera.js) llama a unirme_lista_espera_taller_v2. La función anterior se conserva como puente por si una página en caché
-- todavía la llama: reenvía a la v2 sin los campos nuevos (se puede quitar cuando ya no haya páginas viejas en circulación).
-- Sara la ve en Supabase: select * from v_lista_espera_talleres;
alter table public.lista_espera_talleres
  add column if not exists nivel text,
  add column if not exists disponibilidad text,
  add column if not exists proyecto text;

create or replace function public.unirme_lista_espera_taller_v2(
  p_nombre text, p_telefono text, p_correo text default null, p_personas int default 1,
  p_acepta_datos boolean default false, p_taller text default 'Desconecta para Conectar',
  p_nivel text default null, p_disponibilidad text default null, p_proyecto text default null)
returns void language plpgsql security definer set search_path to 'public' as $$
declare
  v_tel text := left(trim(coalesce(p_telefono, '')), 30);
  v_correo text := nullif(left(trim(coalesce(p_correo, '')), 120), '');
  v_taller text := left(coalesce(nullif(trim(p_taller), ''), 'Desconecta para Conectar'), 80);
  v_personas int := least(greatest(coalesce(p_personas, 1), 1), 20);
  v_nivel text := nullif(trim(coalesce(p_nivel, '')), '');
  v_disp text := nullif(trim(coalesce(p_disponibilidad, '')), '');
  v_proy text := nullif(left(trim(coalesce(p_proyecto, '')), 200), '');
begin
  if p_nombre is null or length(trim(p_nombre)) < 2 then raise exception 'Nombre inválido'; end if;
  if length(regexp_replace(v_tel, '[^0-9]', '', 'g')) < 7 then raise exception 'Teléfono inválido'; end if;
  if v_correo is not null and v_correo !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Correo inválido'; end if;
  if p_acepta_datos is not true then raise exception 'Debes aceptar el tratamiento de datos personales'; end if;
  if v_nivel is not null and v_nivel not in ('Nunca he tejido', 'Sé lo básico', 'Ya tejo y quiero avanzar', 'Tejo con soltura') then raise exception 'Nivel inválido'; end if;
  if v_disp is not null and v_disp not in ('Entre semana', 'Sábados', 'Domingos', 'Cualquier día') then raise exception 'Disponibilidad inválida'; end if;
  -- si ya está en la lista sin haber sido avisada, se actualiza en vez de duplicar (los campos opcionales vacíos no borran lo anterior)
  update lista_espera_talleres
     set nombre = left(trim(p_nombre), 100), correo = coalesce(v_correo, correo), personas = v_personas, fecha_aceptacion = now(),
         nivel = coalesce(v_nivel, nivel), disponibilidad = coalesce(v_disp, disponibilidad), proyecto = coalesce(v_proy, proyecto)
   where taller = v_taller and not avisada
     and regexp_replace(telefono, '[^0-9]', '', 'g') = regexp_replace(v_tel, '[^0-9]', '', 'g');
  if not found then
    insert into lista_espera_talleres (taller, nombre, telefono, correo, personas, acepta_datos, nivel, disponibilidad, proyecto)
    values (v_taller, left(trim(p_nombre), 100), v_tel, v_correo, v_personas, true, v_nivel, v_disp, v_proy);
  end if;
end $$;
revoke all on function public.unirme_lista_espera_taller_v2(text, text, text, int, boolean, text, text, text, text) from public;
grant execute on function public.unirme_lista_espera_taller_v2(text, text, text, int, boolean, text, text, text, text) to anon, authenticated;

-- puente: la función anterior reenvía a la v2
create or replace function public.unirme_lista_espera_taller(
  p_nombre text, p_telefono text, p_correo text default null, p_personas int default 1,
  p_acepta_datos boolean default false, p_taller text default 'Desconecta para Conectar')
returns void language sql security definer set search_path to 'public' as $$
  select public.unirme_lista_espera_taller_v2(p_nombre, p_telefono, p_correo, p_personas, p_acepta_datos, p_taller, null, null, null);
$$;

create or replace view public.v_lista_espera_talleres as
  select created_at, taller, nombre, telefono, correo, personas, avisada, notas, nivel, disponibilidad, proyecto
  from lista_espera_talleres order by created_at desc;
revoke all on public.v_lista_espera_talleres from public, anon, authenticated;
