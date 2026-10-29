-- Migración 37 (29-oct-2026, pedido de Sara): la Agenda para tejedoras vuelve a tener membresía, con prueba gratis de 7 días.
--   · Todas las cuentas tienen la agenda completa 7 días: desde que se crea la cuenta o, para las cuentas anteriores, desde `lanzamiento`
--     (lo que ocurra después). Pasada la prueba quedan gratis las tres primeras pestañas (Inicio, Tablero, Proyectos) y el resto pide membresía
--     ($5.000 al mes o $45.000 al año; los precios los fija crear-pago-wompi).
--   · `mi_membresia()` ahora también devuelve `prueba_hasta`, `en_prueba` y `dias_prueba`; lo demás queda igual.
--   · Para mover la fecha de lanzamiento: update agenda_membresia_config set lanzamiento = '...' where id = 1;
create table if not exists public.agenda_membresia_config (
  id int primary key default 1 check (id = 1),
  lanzamiento timestamptz not null,
  prueba_dias int not null default 7 check (prueba_dias between 0 and 60)
);
alter table public.agenda_membresia_config enable row level security;   -- sin políticas: solo la leen las funciones de seguridad definida
insert into public.agenda_membresia_config (id, lanzamiento, prueba_dias) values (1, '2026-10-30 00:00:00-05', 7) on conflict (id) do nothing;

create or replace function public.mi_membresia()
returns jsonb language plpgsql stable security definer set search_path to 'public' as $function$
declare m record; v_copia boolean; c record; v_alta timestamptz; v_ini timestamptz; v_fin timestamptz; v_json jsonb;
begin
  if auth.uid() is null then return jsonb_build_object('activa', false); end if;
  select * into c from agenda_membresia_config where id = 1;
  v_alta := coalesce((select created_at from cuentas_clientes_web where user_id = auth.uid()), (select created_at from auth.users where id = auth.uid()), now());
  v_ini := greatest(v_alta, coalesce(c.lanzamiento, v_alta));
  v_fin := v_ini + make_interval(days => coalesce(c.prueba_dias, 7));
  v_json := jsonb_build_object('prueba_hasta', v_fin, 'en_prueba', now() < v_fin, 'dias_prueba', coalesce(c.prueba_dias, 7));
  select * into m from membresias_agenda where user_id = auth.uid();
  if m.user_id is null then return v_json || jsonb_build_object('activa', false); end if;
  v_copia := exists (select 1 from agenda_nube where user_id = auth.uid());
  return v_json || jsonb_build_object('activa', m.vence_at > now(), 'plan', m.plan, 'vence', m.vence_at,
                            'dias', greatest(0, ceil(extract(epoch from (m.vence_at - now())) / 86400)::int),
                            'nube', fn_nube_consentida(auth.uid()), 'nube_version', fn_nube_version(),
                            'nube_dias_conservacion', fn_nube_dias_conservacion(),
                            'nube_borrado', case when v_copia then m.vence_at + make_interval(days => fn_nube_dias_conservacion()) end);
end $function$;
