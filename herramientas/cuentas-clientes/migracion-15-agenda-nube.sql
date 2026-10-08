-- Copia de la Agenda de Rosina en la nube (fase 2 del plan de herramientas/agenda-premium/PLAN.md) — 8-oct-2026.
-- Solo para quien tiene la membresía activa. La agenda sigue funcionando primero en el dispositivo (localStorage "rosinaAgenda");
-- la nube guarda UNA copia completa por clienta y se usa para respaldo y para abrirla en otro celular o computador.
--   * agenda_nube(user_id, datos jsonb, actualizado): RLS activado SIN políticas, así que nadie la lee ni escribe directo;
--     solo se entra por las dos funciones de abajo (security definer), que exigen sesión y membresía vigente.
--   * agenda_nube_leer(): {vacio:true} | {datos, actualizado} | {error:'sin_sesion'|'sin_membresia'}
--   * agenda_nube_guardar(p_datos, p_base): guarda si p_base == la fecha que quedó de la última sincronización;
--     si otro dispositivo guardó antes devuelve {conflicto:true, actualizado} y la agenda le pregunta a la clienta qué versión conservar.
--     Límite de tamaño 3 MB.
-- Si la membresía vence, la copia en la nube se conserva (no se borra) pero no se puede leer ni escribir hasta renovar.
-- Se aplicó instrucción por instrucción (el editor SQL se agota con bloques largos sobre tablas con triggers).
create table if not exists public.agenda_nube (
  user_id uuid primary key references auth.users(id) on delete cascade,
  datos jsonb not null,
  actualizado timestamptz not null default now()
);
alter table public.agenda_nube enable row level security;

create or replace function public.agenda_nube_leer() returns jsonb
language plpgsql security definer set search_path to 'public' as $$
declare a record;
begin
  if auth.uid() is null then return jsonb_build_object('error', 'sin_sesion'); end if;
  if not exists (select 1 from membresias_agenda where user_id = auth.uid() and vence_at > now()) then
    return jsonb_build_object('error', 'sin_membresia');
  end if;
  select * into a from agenda_nube where user_id = auth.uid();
  if a.user_id is null then return jsonb_build_object('vacio', true); end if;
  return jsonb_build_object('datos', a.datos, 'actualizado', a.actualizado);
end $$;

create or replace function public.agenda_nube_guardar(p_datos jsonb, p_base timestamptz default null) returns jsonb
language plpgsql security definer set search_path to 'public' as $$
declare a record; v_ahora timestamptz := clock_timestamp();
begin
  if auth.uid() is null then return jsonb_build_object('error', 'sin_sesion'); end if;
  if not exists (select 1 from membresias_agenda where user_id = auth.uid() and vence_at > now()) then
    return jsonb_build_object('error', 'sin_membresia');
  end if;
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

revoke all on function public.agenda_nube_leer() from public, anon;
grant execute on function public.agenda_nube_leer() to authenticated;
revoke all on function public.agenda_nube_guardar(jsonb, timestamptz) from public, anon;
grant execute on function public.agenda_nube_guardar(jsonb, timestamptz) to authenticated;
