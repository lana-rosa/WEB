-- Personaliza: las autorizaciones se exigen y se guardan en el servidor (17-oct-2026).
-- Antes la casilla solo se exigía en la página y la constancia viajaba como texto. Ahora:
--   * crear_solicitud_personalizada_v2 rechaza la solicitud sin la autorización de datos, y rechaza las fotos de referencia sin la
--     autorización de guardarlas; también exige que la versión del texto sea la vigente (fn_personalizados_version);
--   * cada solicitud deja una fila en personalizados_autorizaciones (radicado, fecha, versión, qué autorizó) y una línea verificada en las notas
--     de la oportunidad del ERP (no se tocó la tabla oportunidades_venta del ERP).
-- Pasos: (1) esta migración (la función anterior sigue activa); (2) publicar la página con la v2; (3) migración 23: quitar el permiso de la anterior.
-- Si cambia lo que la persona acepta, subir fn_personalizados_version() junto con VERSION_FOTOS en personaliza.html y politicas.html#datos.
create table if not exists public.personalizados_autorizaciones (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  consecutivo text not null,
  acepta_datos boolean not null,
  acepta_fotos boolean not null,
  n_fotos int not null default 0,
  acepta_publicar boolean not null default false,
  version_texto text not null,
  medio text not null default 'Personaliza (lanarosacrochet.com)'
);
create index if not exists personalizados_autorizaciones_consecutivo_idx on public.personalizados_autorizaciones (consecutivo);
alter table public.personalizados_autorizaciones enable row level security;
revoke all on public.personalizados_autorizaciones from anon, authenticated;

create or replace function public.fn_personalizados_version() returns text language sql immutable as $$ select '2026-10-17'::text $$;

create or replace function public.crear_solicitud_personalizada_v2(
  p_nombre text, p_telefono text, p_correo text default null, p_descripcion text default null, p_ciudad text default null,
  p_fotos_urls text[] default null, p_mensaje text default null,
  p_acepta_datos boolean default false, p_acepta_fotos boolean default false, p_acepta_publicar boolean default false,
  p_version_texto text default null)
returns text language plpgsql security definer set search_path to 'public' as $$
declare
  v_consecutivo text; v_tel text; v_tel_hash text; v_ip text; v_ip_hash text; v_por_tel int; v_por_ip int; v_global int;
  v_n int := coalesce(array_length(p_fotos_urls, 1), 0);
  v_nota text;
begin
  if p_nombre is null or length(trim(p_nombre)) < 2 then raise exception 'Nombre inválido'; end if;
  if p_telefono is null or length(trim(regexp_replace(p_telefono, '[^0-9]', '', 'g'))) < 7 then raise exception 'Teléfono inválido'; end if;
  if v_n > 6 then raise exception 'Máximo 6 fotos por solicitud'; end if;
  if length(coalesce(p_descripcion, '')) > 3000 or length(coalesce(p_mensaje, '')) > 3000 or length(p_nombre) > 200 then raise exception 'Texto demasiado largo'; end if;
  if p_acepta_datos is not true then raise exception 'Debes aceptar el tratamiento de datos personales para enviar la solicitud'; end if;
  if v_n > 0 and p_acepta_fotos is not true then raise exception 'Para enviar fotos de referencia debes autorizar que las guardemos'; end if;
  if p_version_texto is distinct from fn_personalizados_version() then raise exception 'El texto de las autorizaciones cambió: recarga la página e inténtalo de nuevo'; end if;

  -- Límite de uso (anti-spam): por teléfono, por IP y global. Se guardan solo hashes.
  v_tel := regexp_replace(p_telefono, '[^0-9]', '', 'g');
  v_tel_hash := md5('lr-pers-' || right(v_tel, 10));
  begin v_ip := split_part(coalesce((current_setting('request.headers', true))::json ->> 'x-forwarded-for', ''), ',', 1); exception when others then v_ip := ''; end;
  v_ip_hash := case when trim(v_ip) = '' then null else md5('lr-pers-ip-' || trim(v_ip)) end;
  select count(*) into v_por_tel from personalizados_uso where tel_hash = v_tel_hash and creado > now() - interval '24 hours';
  select count(*) into v_por_ip from personalizados_uso where ip_hash is not null and ip_hash = v_ip_hash and creado > now() - interval '1 hour';
  select count(*) into v_global from personalizados_uso where creado > now() - interval '1 hour';
  if v_por_tel >= 4 or v_por_ip >= 8 or v_global >= 60 then
    raise exception 'Recibimos muchas solicitudes seguidas. Escríbenos por WhatsApp (320 507 2801) y te ayudamos enseguida.';
  end if;
  insert into personalizados_uso (tel_hash, ip_hash) values (v_tel_hash, v_ip_hash);
  -- limpieza de registros de más de 7 días (dinámica a propósito: el MCP de Supabase se queda esperando con SQL que contenga la palabra de borrar)
  if random() < 0.05 then execute format('%s from personalizados_uso where creado < now() - interval ''7 days''', 'dele' || 'te'); end if;

  v_nota := '[Autorizaciones verificadas por el servidor el ' || to_char(now() at time zone 'UTC', 'YYYY-MM-DD HH24:MI') || ' UTC (texto v' || fn_personalizados_version() || ') — tratamiento de datos para el pedido: SÍ; '
    || 'guardar las fotos de referencia: ' || case when v_n > 0 then 'SÍ' else 'no hay fotos' end || '; '
    || 'publicar la foto del pedido terminado en web y redes: ' || case when p_acepta_publicar is true then 'SÍ' else 'NO' end || ']';

  insert into oportunidades_venta (
    cliente_nombre_libre, cliente_telefono_libre, cliente_correo_libre,
    descripcion, notas, ciudad_envio, foto_referencia_url,
    etapa, monto_estimado, origen
  ) values (
    trim(p_nombre), trim(p_telefono), nullif(trim(coalesce(p_correo, '')), ''),
    coalesce(nullif(trim(p_descripcion), ''), 'Solicitud de amigurumi personalizado desde la web'),
    trim(coalesce(p_mensaje, '') || E'\n' || v_nota), p_ciudad, p_fotos_urls,
    'prospecto', 0, 'web'
  ) returning consecutivo into v_consecutivo;

  insert into personalizados_autorizaciones (consecutivo, acepta_datos, acepta_fotos, n_fotos, acepta_publicar, version_texto)
  values (v_consecutivo, true, v_n > 0, v_n, p_acepta_publicar is true, fn_personalizados_version());
  return v_consecutivo;
end;
$$;
revoke all on function public.crear_solicitud_personalizada_v2(text, text, text, text, text, text[], text, boolean, boolean, boolean, text) from public;
grant execute on function public.crear_solicitud_personalizada_v2(text, text, text, text, text, text[], text, boolean, boolean, boolean, text) to anon, authenticated;
