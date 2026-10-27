-- Agenda de Rosina: copia en la cuenta GRATIS (sin membresía) — 27-oct-2026, a pedido de Sara («ambos»: copia en la cuenta y recordatorio de copia).
-- Problema: la agenda vive solo en el navegador; al borrar los datos de navegación se pierde.
-- Cambios sobre la migración 18:
--   * agenda_nube_consentir / agenda_nube_leer / agenda_nube_guardar ya NO exigen membresía: basta tener cuenta (sesión) y haber autorizado
--     expresamente la copia (agenda_nube_consentir, con fecha, hora y versión del texto en agenda_nube_consentimientos).
--   * fn_nube_version() sube a '2026-10-27' (el texto de la autorización cambió: ya no habla de membresía). El texto está en agenda-rosina.html (VERSION_NUBE)
--     y en politicas.html#datos apartado 11; se suben juntos si cambia de forma importante lo que la persona acepta.
--   * Conservación: mientras la persona tenga su cuenta y no la borre (se borra con la cuenta: on delete cascade) o la borre ella misma (agenda_nube_borrar,
--     que también retira la autorización). Pendiente con la abogada: si conviene un plazo máximo por inactividad.
--   * fn_depurar_agenda_nube (pg_cron) y mi_membresia() quedan como estaban: solo actúan sobre quien tuvo una membresía (hoy hay 0).
-- Volver atrás: reaplicar las tres funciones de la migración 18 y fn_nube_version() = '2026-10-12'.
create or replace function public.fn_nube_version() returns text language sql immutable as $$ select '2026-10-27'::text $$;

create or replace function public.agenda_nube_consentir(p_version text) returns jsonb
language plpgsql security definer set search_path to 'public' as $$
begin
  if auth.uid() is null then return jsonb_build_object('error', 'sin_sesion'); end if;
  if p_version is distinct from fn_nube_version() then return jsonb_build_object('error', 'version_vieja'); end if;
  insert into agenda_nube_consentimientos (user_id, accion, version) values (auth.uid(), 'acepta', p_version);
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.agenda_nube_leer() returns jsonb
language plpgsql security definer set search_path to 'public' as $$
declare a record;
begin
  if auth.uid() is null then return jsonb_build_object('error', 'sin_sesion'); end if;
  if not fn_nube_consentida(auth.uid()) then return jsonb_build_object('error', 'sin_consentimiento'); end if;
  select * into a from agenda_nube where user_id = auth.uid();
  if a.user_id is null then return jsonb_build_object('vacio', true); end if;
  return jsonb_build_object('datos', a.datos, 'actualizado', a.actualizado);
end $$;

create or replace function public.agenda_nube_guardar(p_datos jsonb, p_base timestamptz default null) returns jsonb
language plpgsql security definer set search_path to 'public' as $$
declare a record; v_ahora timestamptz := clock_timestamp();
begin
  if auth.uid() is null then return jsonb_build_object('error', 'sin_sesion'); end if;
  if not fn_nube_consentida(auth.uid()) then return jsonb_build_object('error', 'sin_consentimiento'); end if;
  if p_datos is null or jsonb_typeof(p_datos) <> 'object' then return jsonb_build_object('error', 'datos_invalidos'); end if;
  if length(p_datos::text) > 3000000 then return jsonb_build_object('error', 'muy_grande'); end if;
  select * into a from agenda_nube where user_id = auth.uid() for update;
  if a.user_id is not null and p_base is distinct from a.actualizado then
    return jsonb_build_object('conflicto', true, 'actualizado', a.actualizado);
  end if;
  insert into agenda_nube (user_id, datos, actualizado) values (auth.uid(), p_datos, v_ahora)
  on conflict (user_id) do update set datos = excluded.datos, actualizado = excluded.actualizado;
  return jsonb_build_object('ok', true, 'actualizado', v_ahora);
end $$;
