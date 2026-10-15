-- Etapa 4 del universo de Rosina: datos para las tarjetas de producto y la medición del chat. Aditiva e invisible (nada de la web
-- cambia hasta que se despliegue la versión 16 de la función rosina-web). Sin DROP ni DELETE.
--
-- 1) rosina_web_consumo: cuántas consultas y cuántos tokens usa Rosina por día y casa (sin IP, sin texto, sin datos personales).
--    Es el primer dato de costo real del asistente (antes no se medía).
-- 2) rosina_sin_respuesta: resumen corto de preguntas que Rosina no pudo responder. La función solo lo escribe si el secreto
--    RW_REGISTRAR_SIN_RESPUESTA vale 1 (APAGADO por defecto) y después de actualizar la política de privacidad; el resumen no lleva
--    correos, teléfonos ni enlaces, ni IP, ni el resto de la conversación; se borra a los 90 días (lo hace la propia función).
-- Ambas tablas: RLS activa, sin políticas y sin permisos para anon/authenticated; solo la función Edge (service_role) las usa.

create table if not exists public.rosina_web_consumo (
  dia date not null,
  casa text not null check (casa in ('tienda', 'merceria', 'academy')),
  consultas integer not null default 0,
  con_tarjetas integer not null default 0,
  sin_dato integer not null default 0,
  tokens_entrada bigint not null default 0,
  tokens_salida bigint not null default 0,
  tokens_cache_lectura bigint not null default 0,
  tokens_cache_escritura bigint not null default 0,
  primary key (dia, casa)
);
alter table public.rosina_web_consumo enable row level security;
revoke all on public.rosina_web_consumo from anon, authenticated;

create or replace function public.fn_rosina_registrar_consumo(
  p_casa text, p_entrada integer, p_salida integer, p_cache_lectura integer, p_cache_escritura integer, p_tarjetas integer, p_sin_dato integer
) returns void
language sql security definer set search_path = public, pg_temp
as $fn$
  insert into public.rosina_web_consumo (dia, casa, consultas, con_tarjetas, sin_dato, tokens_entrada, tokens_salida, tokens_cache_lectura, tokens_cache_escritura)
  select (now() at time zone 'America/Bogota')::date, p_casa, 1,
         least(greatest(coalesce(p_tarjetas, 0), 0), 1), least(greatest(coalesce(p_sin_dato, 0), 0), 1),
         greatest(coalesce(p_entrada, 0), 0), greatest(coalesce(p_salida, 0), 0),
         greatest(coalesce(p_cache_lectura, 0), 0), greatest(coalesce(p_cache_escritura, 0), 0)
  where p_casa in ('tienda', 'merceria', 'academy')
  on conflict (dia, casa) do update set
    consultas = public.rosina_web_consumo.consultas + 1,
    con_tarjetas = public.rosina_web_consumo.con_tarjetas + excluded.con_tarjetas,
    sin_dato = public.rosina_web_consumo.sin_dato + excluded.sin_dato,
    tokens_entrada = public.rosina_web_consumo.tokens_entrada + excluded.tokens_entrada,
    tokens_salida = public.rosina_web_consumo.tokens_salida + excluded.tokens_salida,
    tokens_cache_lectura = public.rosina_web_consumo.tokens_cache_lectura + excluded.tokens_cache_lectura,
    tokens_cache_escritura = public.rosina_web_consumo.tokens_cache_escritura + excluded.tokens_cache_escritura;
$fn$;
revoke all on function public.fn_rosina_registrar_consumo(text, integer, integer, integer, integer, integer, integer) from public, anon, authenticated;
grant execute on function public.fn_rosina_registrar_consumo(text, integer, integer, integer, integer, integer, integer) to service_role;

create table if not exists public.rosina_sin_respuesta (
  id bigint generated always as identity primary key,
  creado timestamptz not null default now(),
  casa text not null check (casa in ('tienda', 'merceria', 'academy')),
  pregunta_resumen text not null check (char_length(pregunta_resumen) between 1 and 160)
);
create index if not exists rosina_sin_respuesta_creado_idx on public.rosina_sin_respuesta (creado);
alter table public.rosina_sin_respuesta enable row level security;
revoke all on public.rosina_sin_respuesta from anon, authenticated;
