-- Agenda de Rosina — respuesta a la revisión legal (12-oct-2026). Tres cambios:
--
--   1) ACEPTACIÓN EXPRESA REGISTRADA al comprar la membresía.
--      pedidos_web guarda cuándo (hora del servidor) y con qué versión de las condiciones aceptó la persona, y si pidió que el
--      servicio empezara de inmediato. La Edge Function crear-pago-wompi (v32) no crea el pedido si no llegan las dos casillas.
--      El correo del comprobante incluye la constancia.
--   2) COPIA EN LA NUBE SOLO CON AUTORIZACIÓN. Por defecto está apagada. La persona la activa con una casilla y un botón
--      (agenda_nube_consentir) y queda un registro (agenda_nube_consentimientos, solo se agrega, nunca se edita).
--      agenda_nube_leer / agenda_nube_guardar devuelven {error:'sin_consentimiento'} mientras no haya autorización vigente
--      para la versión actual del texto. Si cambia el texto de forma importante, se sube VERSION_NUBE y se pide de nuevo.
--   3) CONSERVACIÓN LIMITADA. Con la membresía vencida, la copia se conserva fn_nube_dias_conservacion() días (90) y se borra sola
--      (pg_cron, todos los días 8:30 a. m. de Colombia). Aviso previo 15 días antes, por correo y en Mi cuenta.
--      Además: agenda_nube_borrar() (la migración 16 la dejó pendiente y nunca se creó): borra la copia y revoca la autorización.
--
-- Para cambiar los 90 días: editar fn_nube_dias_conservacion() Y los textos de politicas.html (#membresia 4 y #datos 11), de la
-- ventana de autorización en agenda-rosina.html y de los correos (fn_avisos_membresia / fn_depurar_agenda_nube).
-- Orden de puesta en producción: (a) esta migración, (b) publicar la web, (c) desplegar crear-pago-wompi v32.
-- Se probó dentro de una transacción con ROLLBACK (usuarios y pedidos de prueba), sin enviar correos ni dejar datos.
--
-- ESTADO (12-oct-2026): ya aplicado en producción TODO menos los tres bloques «do $$» que cambian textos de correos
-- (fn_correo_membresia, fn_mensaje_pago_web, fn_avisos_membresia): esos se aplican al publicar la web (con 0 membresías no hay nadie afectado).
-- NOTA PARA APLICARLO POR EL MCP DE SUPABASE: su editor se queda esperando confirmación cuando el SQL contiene DROP o DELETE
-- (por eso la migración 16 no se pudo crear). Se aplicó por partes, sin `drop policy` / `cron.unschedule`, y las funciones que borran
-- (agenda_nube_borrar, fn_depurar_agenda_nube) se crearon con un DO que escribe «del3te» y lo reemplaza antes de ejecutar:
--   do $m$ begin execute replace($b$ create or replace function ... del3te from agenda_nube ... $b$, 'del3te', 'delete'); end $m$;
-- En el SQL Editor de Supabase este archivo se puede pegar tal cual.

-- ---------------------------------------------------------------- 1) aceptación al comprar
alter table public.pedidos_web add column if not exists acepta_condiciones_version text;
alter table public.pedidos_web add column if not exists acepta_condiciones_at timestamptz;
alter table public.pedidos_web add column if not exists acepta_inicio_inmediato boolean;

-- Constancia que se agrega al correo del comprobante (solo membresías con aceptación registrada)
create or replace function public.fn_constancia_membresia_html(p_pedido uuid) returns text
language plpgsql stable security definer set search_path to 'public' as $$
declare p record;
begin
  select acepta_condiciones_version, acepta_condiciones_at, acepta_inicio_inmediato into p from pedidos_web where id = p_pedido;
  if p.acepta_condiciones_at is null then return ''; end if;
  return '<p style="font-size:13px;color:#45454A;background:#F0F1FE;border-radius:10px;padding:10px 14px;margin:14px 0"><strong>Constancia de aceptación.</strong> El ' ||
    to_char(p.acepta_condiciones_at at time zone 'America/Bogota', 'DD/MM/YYYY "a las" HH24:MI') ||
    ' (hora de Colombia) aceptaste las <a href="https://lanarosacrochet.com/politicas.html#membresia" style="color:#E74E96">condiciones de la membresía</a> (versión ' ||
    fn_esc_html(coalesce(p.acepta_condiciones_version, '')) || ')' ||
    case when coalesce(p.acepta_inicio_inmediato, false) then ' y pediste que el servicio empezara de inmediato al aprobarse el pago.' else '.' end || '</p>';
end $$;
revoke all on function public.fn_constancia_membresia_html(uuid) from public, anon, authenticated;

-- El comprobante: constancia + texto de la copia en la nube (opcional, con autorización)
do $$ declare d text; n text; begin
  d := pg_get_functiondef('public.fn_correo_membresia'::regproc);
  n := replace(d, 'Tu membresía ya está activa: puedes usar Finanzas, el Tablero de indicadores, el Calendario del año, Google Calendar y la copia en la nube.',
                  'Tu membresía ya está activa: puedes usar Finanzas, el Tablero de indicadores, el Calendario del año y Google Calendar. La copia en la nube es opcional: solo se activa si tú la autorizas desde la agenda.');
  if n = d then raise exception 'fn_correo_membresia: no se encontró el texto de bienvenida'; end if;
  d := n;
  n := replace(d, 'select decrypted_secret into v_key from vault.decrypted_secrets where name = ''resend_api_key'';',
                  'v_html := replace(v_html, ''<p style="font-size:14px">No hacemos'', fn_constancia_membresia_html(p.id) || ''<p style="font-size:14px">No hacemos'');' || chr(10) ||
                  '  select decrypted_secret into v_key from vault.decrypted_secrets where name = ''resend_api_key'';');
  if n = d then raise exception 'fn_correo_membresia: no se encontró el punto para la constancia'; end if;
  execute n;
end $$;

-- Mensaje en Mi cuenta al pagar
do $$ declare d text; n text; begin
  d := pg_get_functiondef('public.fn_mensaje_pago_web'::regproc);
  n := replace(d, 'Ya puedes usar Finanzas, el Tablero, el Calendario del año y la copia en la nube.',
                  'Ya puedes usar Finanzas, el Tablero y el Calendario del año. La copia en la nube es opcional: actívala desde la agenda si quieres.');
  if n = d then raise exception 'fn_mensaje_pago_web: no se encontró el texto a cambiar'; end if;
  execute n;
end $$;

-- ---------------------------------------------------------------- 2) copia en la nube con autorización
create table if not exists public.agenda_nube_consentimientos (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  accion text not null check (accion in ('acepta', 'revoca', 'borrada_por_vencimiento')),
  version text not null,
  created_at timestamptz not null default now()
);
create index if not exists agenda_nube_consentimientos_user on public.agenda_nube_consentimientos (user_id, id desc);
alter table public.agenda_nube_consentimientos enable row level security;   -- sin políticas: solo entran las funciones de abajo
drop policy if exists "Administrador ve los consentimientos de la nube" on public.agenda_nube_consentimientos;
create policy "Administrador ve los consentimientos de la nube" on public.agenda_nube_consentimientos
  for select using (fn_rol_actual() = 'administrador'::rol_usuario);

create or replace function public.fn_nube_version() returns text language sql immutable as $$ select '2026-10-12'::text $$;
create or replace function public.fn_nube_dias_conservacion() returns int language sql immutable as $$ select 90 $$;

-- ¿Tiene autorización vigente (última acción = acepta, con la versión actual del texto)?
create or replace function public.fn_nube_consentida(p_user uuid) returns boolean
language sql stable security definer set search_path to 'public' as $$
  select coalesce((select c.accion = 'acepta' and c.version = fn_nube_version()
                   from agenda_nube_consentimientos c where c.user_id = p_user order by c.id desc limit 1), false)
$$;
revoke all on function public.fn_nube_consentida(uuid) from public, anon, authenticated;

create or replace function public.agenda_nube_consentir(p_version text) returns jsonb
language plpgsql security definer set search_path to 'public' as $$
begin
  if auth.uid() is null then return jsonb_build_object('error', 'sin_sesion'); end if;
  if not exists (select 1 from membresias_agenda where user_id = auth.uid() and vence_at > now()) then
    return jsonb_build_object('error', 'sin_membresia');
  end if;
  if p_version is distinct from fn_nube_version() then return jsonb_build_object('error', 'version_vieja'); end if;
  insert into agenda_nube_consentimientos (user_id, accion, version) values (auth.uid(), 'acepta', p_version);
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.agenda_nube_consentir(text) from public, anon;
grant execute on function public.agenda_nube_consentir(text) to authenticated;

create or replace function public.agenda_nube_leer() returns jsonb
language plpgsql security definer set search_path to 'public' as $$
declare a record;
begin
  if auth.uid() is null then return jsonb_build_object('error', 'sin_sesion'); end if;
  if not exists (select 1 from membresias_agenda where user_id = auth.uid() and vence_at > now()) then
    return jsonb_build_object('error', 'sin_membresia');
  end if;
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
  if not exists (select 1 from membresias_agenda where user_id = auth.uid() and vence_at > now()) then
    return jsonb_build_object('error', 'sin_membresia');
  end if;
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

-- Borra la copia y revoca la autorización. Siempre se puede, aunque la membresía haya vencido.
create or replace function public.agenda_nube_borrar() returns jsonb
language plpgsql security definer set search_path to 'public' as $$
begin
  if auth.uid() is null then return jsonb_build_object('error', 'sin_sesion'); end if;
  delete from agenda_nube where user_id = auth.uid();
  insert into agenda_nube_consentimientos (user_id, accion, version) values (auth.uid(), 'revoca', fn_nube_version());
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.agenda_nube_borrar() from public, anon;
grant execute on function public.agenda_nube_borrar() to authenticated;

-- Para la administradora: borrar la copia de alguien que lo pide por WhatsApp o correo (derecho de supresión por los canales de atención).
-- Antes de usarla, verificar que la solicitud viene del correo de la cuenta (ver PENDIENTES.md). Uso, en el SQL Editor de Supabase:
--   select agenda_nube_borrar_admin('correo@de-la-clienta.com');   -- {ok:true, copia_borrada:true|false} o {error:'sin_cuenta'}
create or replace function public.agenda_nube_borrar_admin(p_correo text) returns jsonb
language plpgsql security definer set search_path to 'public' as $$
declare v_user uuid; v_filas int;
begin
  -- Solo la administradora (sesión de la web con rol administrador) o una conexión directa a la base (SQL Editor): nunca una clienta por la API.
  if fn_rol_actual() is distinct from 'administrador'::rol_usuario and session_user not in ('postgres', 'supabase_admin') then
    raise exception 'Solo la administradora puede hacer esto';
  end if;
  select id into v_user from auth.users where lower(email) = lower(trim(p_correo)) limit 1;
  if v_user is null then return jsonb_build_object('error', 'sin_cuenta'); end if;
  delete from agenda_nube where user_id = v_user;
  get diagnostics v_filas = row_count;
  insert into agenda_nube_consentimientos (user_id, accion, version) values (v_user, 'revoca', fn_nube_version());
  return jsonb_build_object('ok', true, 'copia_borrada', v_filas > 0, 'correo', lower(trim(p_correo)));
end $$;
revoke all on function public.agenda_nube_borrar_admin(text) from public, anon;
grant execute on function public.agenda_nube_borrar_admin(text) to authenticated;

-- Evidencia de una compra de membresía (para la abogada o ante un reclamo): usuario, pedido, plan y valor, versión y hora de la aceptación,
-- pago en Wompi, vigencia y registro de autorizaciones/revocaciones de la copia en la nube. Solo la administradora o el SQL Editor.
--   select evidencia_membresia_web('LR-XXXX');
create or replace function public.evidencia_membresia_web(p_referencia text) returns jsonb
language plpgsql stable security definer set search_path to 'public' as $$
declare w record; m record; c jsonb;
begin
  if fn_rol_actual() is distinct from 'administrador'::rol_usuario and session_user not in ('postgres', 'supabase_admin') then
    raise exception 'Solo la administradora puede hacer esto';
  end if;
  select * into w from pedidos_web where referencia = p_referencia and membresia_plan is not null;
  if w.id is null then return jsonb_build_object('error', 'sin_pedido'); end if;
  select vence_at into m from membresias_agenda where user_id = w.user_id;
  select jsonb_agg(jsonb_build_object('accion', accion, 'version', version, 'fecha', created_at) order by id) into c
    from agenda_nube_consentimientos where user_id = w.user_id;
  return jsonb_build_object('referencia', w.referencia, 'usuario', w.user_id, 'correo', w.correo, 'plan', w.membresia_plan, 'valor_cop', w.total,
    'pedido_creado', w.created_at, 'condiciones_version', w.acepta_condiciones_version, 'condiciones_aceptadas_en', w.acepta_condiciones_at,
    'inicio_inmediato_solicitado', w.acepta_inicio_inmediato, 'estado_pago', w.estado, 'pagado_en', w.pagado_at,
    'transaccion_wompi', w.wompi_transaction_id, 'es_prueba', coalesce(w.es_prueba, false), 'membresia_hasta', m.vence_at,
    'copia_nube_registro', coalesce(c, '[]'::jsonb));
end $$;
revoke all on function public.evidencia_membresia_web(text) from public, anon;
grant execute on function public.evidencia_membresia_web(text) to authenticated;

-- mi_membresia(): además, si la copia en la nube está autorizada y, si ya venció la membresía, cuándo se borra la copia
create or replace function public.mi_membresia() returns jsonb
language plpgsql stable security definer set search_path to 'public' as $$
declare m record; v_copia boolean;
begin
  if auth.uid() is null then return jsonb_build_object('activa', false); end if;
  select * into m from membresias_agenda where user_id = auth.uid();
  if m.user_id is null then return jsonb_build_object('activa', false); end if;
  v_copia := exists (select 1 from agenda_nube where user_id = auth.uid());
  return jsonb_build_object('activa', m.vence_at > now(), 'plan', m.plan, 'vence', m.vence_at,
                            'dias', greatest(0, ceil(extract(epoch from (m.vence_at - now())) / 86400)::int),
                            'nube', fn_nube_consentida(auth.uid()), 'nube_version', fn_nube_version(),
                            'nube_dias_conservacion', fn_nube_dias_conservacion(),
                            'nube_borrado', case when v_copia then m.vence_at + make_interval(days => fn_nube_dias_conservacion()) end);
end $$;
revoke all on function public.mi_membresia() from public, anon;
grant execute on function public.mi_membresia() to authenticated;

-- ---------------------------------------------------------------- 3) conservación limitada
alter table public.membresias_agenda add column if not exists aviso_borrado_para timestamptz;  -- vence_at para el que ya se avisó el borrado

create or replace function public.fn_depurar_agenda_nube() returns jsonb
language plpgsql security definer set search_path to 'public' as $$
declare m record; v_key text; v_mail text; v_dias int := fn_nube_dias_conservacion(); v_avisos int := 0; v_borradas int := 0;
        v_fecha text; v_html text;
begin
  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'resend_api_key';

  -- (a) Aviso 15 días antes de borrar (una sola vez por fecha de vencimiento)
  for m in select ms.* from membresias_agenda ms
           where ms.vence_at < now() and ms.vence_at + make_interval(days => v_dias) > now()
             and ms.vence_at + make_interval(days => v_dias - 15) <= now()
             and ms.aviso_borrado_para is distinct from ms.vence_at
             and exists (select 1 from agenda_nube a where a.user_id = ms.user_id) loop
    update membresias_agenda set aviso_borrado_para = vence_at where user_id = m.user_id;
    v_avisos := v_avisos + 1;
    v_fecha := to_char((m.vence_at + make_interval(days => v_dias)) at time zone 'America/Bogota', 'DD/MM/YYYY');
    insert into mensajes_cuenta (user_id, tipo, titulo, cuerpo, referencia)
    values (m.user_id, 'pedido', 'Borraremos tu copia en la nube el ' || v_fecha,
            'Tu membresía de la Agenda de Rosina venció y la copia de tu agenda en la nube se borrará el ' || v_fecha || '. Si renuevas antes, la conservas. Tu agenda sigue en tu dispositivo.', 'membresia');
    select email into v_mail from auth.users where id = m.user_id;
    if v_key is not null and v_mail is not null then
      v_html := '<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#45454A;line-height:1.5"><h2 style="color:#E74E96">Borraremos tu copia en la nube el ' || v_fecha || ' ☁️</h2>' ||
        '<p>Tu membresía de la Agenda de Rosina venció. Como te contamos en las condiciones, guardamos la copia de tu agenda en la nube hasta ' || v_dias || ' días después del vencimiento y luego la borramos.</p>' ||
        '<p><strong>Si renuevas antes del ' || v_fecha || ', la conservas.</strong> Tu agenda sigue guardada en tu dispositivo; si quieres tener tus datos a la mano, usa «Guardar una copia» dentro de la agenda.</p>' ||
        '<p style="text-align:center;margin:18px 0"><a href="https://lanarosacrochet.com/agenda-rosina.html#membresia" style="background:#E74E96;color:#fff;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:bold;display:inline-block">Renovar mi membresía</a></p>' ||
        '<p style="font-size:13px;color:#6E6E73">Lana Rosa Crochet · lanarosacrochet.com</p></div>';
      perform net.http_post(url := 'https://api.resend.com/emails',
        headers := jsonb_build_object('Authorization', 'Bearer ' || v_key, 'Content-Type', 'application/json'),
        body := jsonb_build_object('from', 'Lana Rosa Crochet <contacto@lanarosacrochet.com>', 'reply_to', 'contacto@lanarosacrochet.com',
          'to', array[v_mail], 'subject', 'Borraremos tu copia en la nube de la Agenda de Rosina el ' || v_fecha, 'html', v_html));
    end if;
  end loop;

  -- (b) Borrado: la membresía venció hace más de v_dias días
  for m in select ms.* from membresias_agenda ms
           where ms.vence_at + make_interval(days => v_dias) <= now()
             and exists (select 1 from agenda_nube a where a.user_id = ms.user_id) loop
    delete from agenda_nube where user_id = m.user_id;
    insert into agenda_nube_consentimientos (user_id, accion, version) values (m.user_id, 'borrada_por_vencimiento', fn_nube_version());
    insert into mensajes_cuenta (user_id, tipo, titulo, cuerpo, referencia)
    values (m.user_id, 'pedido', 'Borramos tu copia en la nube',
            'Pasaron ' || v_dias || ' días desde que venció tu membresía de la Agenda de Rosina, así que borramos la copia en la nube, como dicen las condiciones. Tu agenda sigue en tu dispositivo.', 'membresia');
    v_borradas := v_borradas + 1;
  end loop;
  return jsonb_build_object('avisos', v_avisos, 'borradas', v_borradas);
end $$;
revoke all on function public.fn_depurar_agenda_nube() from public, anon, authenticated;
select cron.unschedule('depurar-agenda-nube') where exists (select 1 from cron.job where jobname = 'depurar-agenda-nube');
select cron.schedule('depurar-agenda-nube', '30 13 * * *', $$select public.fn_depurar_agenda_nube()$$);

-- Texto del aviso de vencimiento (7 y 1 días): ya no dice que "los datos siguen guardados"
do $$ declare d text; n text; begin
  d := pg_get_functiondef('public.fn_avisos_membresia'::regproc);
  n := replace(d, 'Renuévala en un minuto para seguir usando Finanzas, el Tablero y la copia en la nube. Tus datos siguen guardados aunque venza.',
                  'Renuévala en un minuto para seguir usando Finanzas, el Tablero y el Calendario del año. Tu agenda sigue guardada en tu dispositivo aunque venza; si tienes activada la copia en la nube, la conservamos ' || fn_nube_dias_conservacion() || ' días después del vencimiento y luego la borramos.');
  if n = d then raise exception 'fn_avisos_membresia: no se encontró el texto a cambiar'; end if;
  execute n;
end $$;
