-- «Avísame cuando abra» de la Mercería en línea (20-oct-2026). Se llena desde la web (js/aviso-merceria.js, función
-- avisarme_apertura_merceria, ejecutable por visitantes). Sara los ve en Supabase:
--   select * from v_avisos_apertura_merceria;   (marcar avisados: update avisos_apertura_merceria set avisada = true where id = '...';)
-- Los datos se usan solo para avisar una vez cuando abra la Mercería en línea; después de avisar se eliminan (ver politicas.html#datos).
create table if not exists public.avisos_apertura_merceria (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  nombre text not null,
  whatsapp text,
  correo text,
  acepta_datos boolean not null,
  fecha_aceptacion timestamptz not null default now(),
  medio_autorizacion text not null default 'Aviso de apertura de la Mercería en línea (lanarosacrochet.com)',
  avisada boolean not null default false,
  notas text,
  constraint avisos_apertura_merceria_contacto check (whatsapp is not null or correo is not null)
);
alter table public.avisos_apertura_merceria enable row level security;
revoke all on public.avisos_apertura_merceria from anon, authenticated;

create or replace function public.avisarme_apertura_merceria(
  p_nombre text, p_whatsapp text default null, p_correo text default null, p_acepta_datos boolean default false)
returns void language plpgsql security definer set search_path to 'public' as $$
declare
  v_wa text := nullif(left(trim(coalesce(p_whatsapp, '')), 30), '');
  v_correo text := nullif(lower(left(trim(coalesce(p_correo, '')), 120)), '');
begin
  if p_nombre is null or length(trim(p_nombre)) < 2 then raise exception 'Nombre inválido'; end if;
  if v_wa is not null and length(regexp_replace(v_wa, '[^0-9]', '', 'g')) < 7 then raise exception 'WhatsApp inválido'; end if;
  if v_correo is not null and v_correo !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Correo inválido'; end if;
  if v_wa is null and v_correo is null then raise exception 'Escribe un WhatsApp o un correo para avisarte'; end if;
  if p_acepta_datos is not true then raise exception 'Debes aceptar el tratamiento de datos personales'; end if;
  if (select count(*) from avisos_apertura_merceria where created_at > now() - interval '1 hour') >= 60 then
    raise exception 'Recibimos muchas solicitudes seguidas. Intenta de nuevo en un rato.';
  end if;
  update avisos_apertura_merceria
     set nombre = left(trim(p_nombre), 100), whatsapp = coalesce(v_wa, whatsapp), correo = coalesce(v_correo, correo), fecha_aceptacion = now()
   where not avisada
     and ((v_wa is not null and regexp_replace(coalesce(whatsapp, ''), '[^0-9]', '', 'g') = regexp_replace(v_wa, '[^0-9]', '', 'g'))
       or (v_correo is not null and correo = v_correo));
  if not found then
    insert into avisos_apertura_merceria (nombre, whatsapp, correo, acepta_datos) values (left(trim(p_nombre), 100), v_wa, v_correo, true);
  end if;
end $$;
revoke all on function public.avisarme_apertura_merceria(text, text, text, boolean) from public;
grant execute on function public.avisarme_apertura_merceria(text, text, text, boolean) to anon, authenticated;

create or replace view public.v_avisos_apertura_merceria as
  select created_at, nombre, whatsapp, correo, avisada, notas from avisos_apertura_merceria order by created_at desc;
revoke all on public.v_avisos_apertura_merceria from public, anon, authenticated;
