-- Membresía de la Agenda de Rosina (fase 1 del plan de herramientas/agenda-premium/PLAN.md) — 8-oct-2026.
-- Precios (los fija la Edge Function crear-pago-wompi, nunca el navegador): mensual $7.000 COP, anual $57.000 COP (desde el 9-oct-2026; antes $10.000 y $60.000).
-- Cada pago aprobado en Wompi suma 1 mes o 1 año a la fecha de vencimiento (si aún está activa, se suma desde esa fecha).
-- Piezas:
--   1) pedidos_web.membresia_plan ('mensual' | 'anual'): marca los pedidos que son una membresía (también es_digital = true:
--      sin envío, sin taller, sin CRM; no pasan al ERP, el ingreso se registra en contabilidad).
--   2) membresias_agenda(user_id, plan, vence_at, ...): una fila por clienta. Solo ella la puede leer; solo el servidor escribe.
--   3) trigger trg_membresia_activar: al quedar 'pagado' el pedido, activa/renueva la membresía.
--   4) mi_membresia(): la agenda y Mi cuenta preguntan si está activa y cuándo vence.
--   5) Correo de bienvenida/renovación (fn_correo_membresia), mensaje en Mi cuenta, y avisos de vencimiento a 7 y 1 días
--      (fn_avisos_membresia, programada con pg_cron todos los días a las 8:00 a. m. de Colombia = 13:00 UTC).
--   6) Las membresías NO cuentan como primera compra (no gastan el descuento de bienvenida) y no salen en "Mis pedidos".
-- Nota: sobre pedidos_web no se agregan CHECK ni llaves foráneas (bloquean la tabla y el editor SQL se agota); el plan lo valida
-- la Edge Function (solo 'mensual' o 'anual'). Por eso membresias_agenda.ultimo_pedido es un uuid simple, sin FK.
-- Se aplicó por partes (cada instrucción por separado) y además existe pedido_web_es_membresia(referencia), que usa gracias.html.
alter table public.pedidos_web add column if not exists membresia_plan text;

create table if not exists public.membresias_agenda (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null check (plan in ('mensual', 'anual')),
  vence_at timestamptz not null,
  ultimo_pedido uuid,
  aviso7_para timestamptz,   -- vence_at para el que ya se envió el aviso de 7 días
  aviso1_para timestamptz,   -- vence_at para el que ya se envió el aviso de 1 día
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.membresias_agenda enable row level security;
drop policy if exists "Clienta ve su membresia" on public.membresias_agenda;
create policy "Clienta ve su membresia" on public.membresias_agenda for select using (user_id = auth.uid());
drop policy if exists "Administrador ve las membresias" on public.membresias_agenda;
create policy "Administrador ve las membresias" on public.membresias_agenda for select using (fn_rol_actual() = 'administrador'::rol_usuario);

create or replace function public.mi_membresia() returns jsonb
language plpgsql stable security definer set search_path to 'public' as $$
declare m record;
begin
  if auth.uid() is null then return jsonb_build_object('activa', false); end if;
  select * into m from membresias_agenda where user_id = auth.uid();
  if m.user_id is null then return jsonb_build_object('activa', false); end if;
  return jsonb_build_object('activa', m.vence_at > now(), 'plan', m.plan, 'vence', m.vence_at,
                            'dias', greatest(0, ceil(extract(epoch from (m.vence_at - now())) / 86400)::int));
end $$;
revoke all on function public.mi_membresia() from public, anon;
grant execute on function public.mi_membresia() to authenticated;

-- Activa o renueva la membresía cuando el pedido queda pagado
create or replace function public.fn_trg_membresia_activar() returns trigger
language plpgsql security definer set search_path to 'public' as $$
declare v_user uuid; v_actual timestamptz; v_base timestamptz; v_nuevo timestamptz;
begin
  v_user := new.user_id;
  if v_user is null then
    select u.id into v_user from auth.users u where lower(u.email) = lower(new.correo) limit 1;
  end if;
  if v_user is null then
    update pedidos_web set erp_error = 'Membresía pagada pero sin cuenta: revisar a mano (' || new.correo || ')' where id = new.id;
    return new;
  end if;
  select vence_at into v_actual from membresias_agenda where user_id = v_user;
  v_base := greatest(now(), coalesce(v_actual, now()));
  v_nuevo := case new.membresia_plan when 'anual' then v_base + interval '1 year' else v_base + interval '1 month' end;
  insert into membresias_agenda (user_id, plan, vence_at, ultimo_pedido) values (v_user, new.membresia_plan, v_nuevo, new.id)
  on conflict (user_id) do update set plan = excluded.plan, vence_at = excluded.vence_at, ultimo_pedido = excluded.ultimo_pedido, updated_at = now();
  return new;
end $$;
drop trigger if exists trg_membresia_activar on public.pedidos_web;
create trigger trg_membresia_activar after update of estado on public.pedidos_web
  for each row when (new.estado = 'pagado' and old.estado is distinct from 'pagado' and new.membresia_plan is not null)
  execute function public.fn_trg_membresia_activar();

-- Correo de bienvenida / renovación (comprobante de pago)
create or replace function public.fn_correo_membresia(p_pedido uuid) returns jsonb
language plpgsql security definer set search_path to 'public' as $$
declare p record; v_key text; v_html text; v_vence timestamptz; v_plan text;
begin
  select * into p from pedidos_web where id = p_pedido;
  if p.id is null or p.membresia_plan is null then return jsonb_build_object('omitido', 'no es membresía'); end if;
  if coalesce(p.es_prueba, false) then return jsonb_build_object('omitido', 'pedido de prueba'); end if;
  if coalesce(p.correo, '') !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then return jsonb_build_object('omitido', 'sin correo'); end if;
  if exists (select 1 from avisos_compra_web where pedido_id = p_pedido) then return jsonb_build_object('omitido', 'ya enviado'); end if;
  select vence_at into v_vence from membresias_agenda where ultimo_pedido = p.id;
  v_plan := case p.membresia_plan when 'anual' then 'Anual' else 'Mensual' end;
  v_html := format($h$<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#45454A;line-height:1.5">
<h2 style="color:#E74E96;margin-bottom:4px">¡Bienvenida a la Agenda de Rosina completa! 💗</h2>
<p style="margin-top:0">Hola %s, <strong>confirmamos tu pago</strong>. Tu membresía ya está activa: puedes usar Finanzas, el Tablero de indicadores, el Calendario del año, Google Calendar y la copia en la nube.</p>
<div style="background:#FBE4EF;border-radius:14px;padding:14px 18px;margin:16px 0">
<strong>Recibo de pago</strong><br>Pedido: <strong>%s</strong><br>Fecha: %s<br>Medio de pago: Pago en línea con Wompi<br>Plan: <strong>Membresía %s</strong> · %s<br>Activa hasta: <strong>%s</strong></div>
<p style="text-align:center;margin:18px 0"><a href="https://lanarosacrochet.com/agenda-rosina.html" style="background:#E74E96;color:#fff;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:bold;display:inline-block">Abrir mi agenda</a></p>
<p style="font-size:14px">No hacemos cobros automáticos: te avisamos por aquí 7 días y 1 día antes de que venza, con un botón para renovar. Si no renuevas, tus datos siguen guardados y tus hojas gratis siguen funcionando; solo se bloquean las hojas de pago.</p>
<p style="font-size:12px;color:#6E6E73;background:#FBF7F4;border-radius:10px;padding:10px 14px;margin:14px 0">Este correo es un comprobante de pago. <strong>Lana Rosa Crochet</strong> · Sara Loaiza Muñoz, NIT 1.055.359.694-4 · Calle 10 No. 5-37, Villamaría, Caldas · Tel. 320 507 2801.<br><strong>Régimen Simple de Tributación (SIMPLE) · No responsable de IVA.</strong> Si necesitas factura electrónica de venta, responde este correo con tu nombre completo, documento y correo.</p>
<p style="font-size:13px;color:#6E6E73">¿Dudas? Responde este correo o escríbenos por <a href="https://wa.me/573205072801" style="color:#E74E96">WhatsApp</a>.<br>Con cariño, Lana Rosa Crochet · lanarosacrochet.com</p></div>$h$,
    initcap(split_part(coalesce(p.nombre, ''), ' ', 1)), fn_esc_html(p.referencia),
    to_char(coalesce(p.pagado_at, p.created_at) at time zone 'America/Bogota', 'DD/MM/YYYY HH24:MI'),
    v_plan, fn_cop(p.total), to_char(v_vence at time zone 'America/Bogota', 'DD/MM/YYYY'));
  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'resend_api_key';
  if v_key is null then return jsonb_build_object('omitido', 'sin llave de correo'); end if;
  perform net.http_post(url := 'https://api.resend.com/emails',
    headers := jsonb_build_object('Authorization', 'Bearer ' || v_key, 'Content-Type', 'application/json'),
    body := jsonb_build_object('from', 'Lana Rosa Crochet <contacto@lanarosacrochet.com>', 'reply_to', 'contacto@lanarosacrochet.com',
      'to', array[p.correo], 'subject', '💗 Tu membresía de la Agenda de Rosina está activa · recibo ' || p.referencia, 'html', v_html));
  insert into avisos_compra_web (pedido_id, correo) values (p_pedido, p.correo) on conflict do nothing;
  return jsonb_build_object('enviado', p.correo);
end $$;
revoke all on function public.fn_correo_membresia(uuid) from public, anon, authenticated;

-- El correo de compra de siempre no se manda para membresías: sale el de membresía
create or replace function public.fn_trg_pedido_web_pagado() returns trigger
language plpgsql security definer set search_path to 'public' as $$
begin
  if new.estado = 'pagado' and old.estado is distinct from 'pagado' then
    if new.membresia_plan is not null then
      begin perform fn_correo_membresia(new.id); exception when others then null; end;
    else
      begin perform fn_correo_compra_web(new.id, true); exception when others then null; end;
    end if;
  end if;
  return new;
end $$;

-- Avisos de vencimiento (7 y 1 días antes): mensaje en Mi cuenta + correo. Una sola vez por fecha de vencimiento.
create or replace function public.fn_avisos_membresia() returns integer
language plpgsql security definer set search_path to 'public' as $$
declare m record; v_key text; v_mail text; v_dias int; v_n int := 0; v_fecha text; v_html text;
begin
  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'resend_api_key';
  for m in select * from membresias_agenda where vence_at > now() and vence_at <= now() + interval '7 days' loop
    v_dias := ceil(extract(epoch from (m.vence_at - now())) / 86400)::int;
    if v_dias <= 1 and m.aviso1_para is distinct from m.vence_at then
      update membresias_agenda set aviso1_para = vence_at, aviso7_para = vence_at where user_id = m.user_id;
    elsif v_dias > 1 and m.aviso7_para is distinct from m.vence_at then
      update membresias_agenda set aviso7_para = vence_at where user_id = m.user_id;
    else
      continue;
    end if;
    v_n := v_n + 1;
    v_fecha := to_char(m.vence_at at time zone 'America/Bogota', 'DD/MM/YYYY');
    insert into mensajes_cuenta (user_id, tipo, titulo, cuerpo, referencia)
    values (m.user_id, 'pedido', case when v_dias <= 1 then 'Tu membresía vence mañana' else 'Tu membresía vence pronto' end,
            'Tu membresía de la Agenda de Rosina está activa hasta el ' || v_fecha || '. Renuévala desde la agenda para no perder las hojas de pago.', 'membresia');
    select email into v_mail from auth.users where id = m.user_id;
    if v_key is not null and v_mail is not null then
      v_html := '<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#45454A;line-height:1.5"><h2 style="color:#E74E96">Tu membresía vence ' ||
        case when v_dias <= 1 then 'mañana' else 'pronto' end || ' 🧶</h2><p>Tu membresía de la Agenda de Rosina está activa hasta el <strong>' || v_fecha ||
        '</strong>. Renuévala en un minuto para seguir usando Finanzas, el Tablero y la copia en la nube. Tus datos siguen guardados aunque venza.</p>' ||
        '<p style="text-align:center;margin:18px 0"><a href="https://lanarosacrochet.com/agenda-rosina.html#membresia" style="background:#E74E96;color:#fff;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:bold;display:inline-block">Renovar mi membresía</a></p>' ||
        '<p style="font-size:13px;color:#6E6E73">Lana Rosa Crochet · lanarosacrochet.com</p></div>';
      perform net.http_post(url := 'https://api.resend.com/emails',
        headers := jsonb_build_object('Authorization', 'Bearer ' || v_key, 'Content-Type', 'application/json'),
        body := jsonb_build_object('from', 'Lana Rosa Crochet <contacto@lanarosacrochet.com>', 'reply_to', 'contacto@lanarosacrochet.com',
          'to', array[v_mail], 'subject', case when v_dias <= 1 then 'Tu membresía de la Agenda de Rosina vence mañana' else 'Tu membresía de la Agenda de Rosina vence pronto' end, 'html', v_html));
    end if;
  end loop;
  return v_n;
end $$;
revoke all on function public.fn_avisos_membresia() from public, anon, authenticated;
select cron.unschedule('avisos-membresia') where exists (select 1 from cron.job where jobname = 'avisos-membresia');
select cron.schedule('avisos-membresia', '0 13 * * *', $$select public.fn_avisos_membresia()$$);

-- Mensaje en Mi cuenta al pagar: texto de membresía
do $$ declare d text; n text; begin
  d := pg_get_functiondef('public.fn_mensaje_pago_web'::regproc);
  n := replace(d, 'if coalesce(new.es_digital,false) and new.estado = ''pagado'' then',
    'if new.membresia_plan is not null then v_titulo := ''Tu membresía está activa''; v_cuerpo := ''Gracias por unirte a la Agenda de Rosina completa. Ya puedes usar Finanzas, el Tablero, el Calendario del año y la copia en la nube.''; elsif coalesce(new.es_digital,false) and new.estado = ''pagado'' then');
  if n = d then raise exception 'fn_mensaje_pago_web: no se encontró el texto a cambiar'; end if;
  execute n;
end $$;

-- "Mis pedidos" no muestra las membresías (tienen su propio bloque)
do $$ declare d text; n text; begin
  d := pg_get_functiondef('public.mis_pedidos'::regproc);
  n := replace(d, 'and w.estado <> ''anulado'' and coalesce(array_length', 'and w.estado <> ''anulado'' and w.membresia_plan is null and coalesce(array_length');
  if n = d then raise exception 'mis_pedidos: no se encontró el texto a cambiar'; end if;
  execute n;
end $$;

-- Las membresías no cuentan como "primera compra" (no gastan el descuento de bienvenida)
do $$ declare d text; n text; begin
  d := pg_get_functiondef('public.fn_es_primera_compra_web'::regproc);
  n := replace(d, 'not coalesce(w.es_prueba, false) and (p_excluir', 'not coalesce(w.es_prueba, false) and w.membresia_plan is null and (p_excluir');
  if n = d then raise exception 'fn_es_primera_compra_web: no se encontró el texto a cambiar'; end if;
  execute n;
end $$;

-- gracias.html distingue una membresía de un patrón digital
create or replace function public.pedido_web_es_membresia(p_referencia text) returns boolean
language sql stable security definer set search_path to 'public' as $$
  select coalesce((select p.membresia_plan is not null from pedidos_web p where p.referencia = p_referencia), false);
$$;
grant execute on function public.pedido_web_es_membresia(text) to anon, authenticated;
