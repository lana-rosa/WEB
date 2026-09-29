-- Cuentas de clientes de la web (lanarosacrochet.com) — 29-sep-2026
-- Solo agrega tablas y funciones nuevas; no modifica ninguna tabla existente del ERP.
-- Los clientes entran con un enlace al correo (Supabase Auth). Su usuario NO tiene rol en usuarios_roles,
-- por eso fn_rol_actual() devuelve null y ninguna política del ERP les da acceso.

create table if not exists public.cuentas_clientes_web (
  user_id uuid primary key references auth.users(id) on delete cascade,
  tercero_id uuid not null references public.terceros(id),
  created_at timestamptz not null default now()
);
create index if not exists cuentas_clientes_web_tercero_idx on public.cuentas_clientes_web(tercero_id);
alter table public.cuentas_clientes_web enable row level security;
drop policy if exists "Cliente ve su propia cuenta" on public.cuentas_clientes_web;
create policy "Cliente ve su propia cuenta" on public.cuentas_clientes_web
  for select to authenticated using (user_id = auth.uid());
drop policy if exists "Administrador ve las cuentas web" on public.cuentas_clientes_web;
create policy "Administrador ve las cuentas web" on public.cuentas_clientes_web
  for select to authenticated using (public.fn_rol_actual() = 'administrador');

create table if not exists public.carritos_web (
  user_id uuid primary key references auth.users(id) on delete cascade,
  items jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  constraint carritos_web_items_valido check (
    jsonb_typeof(items) = 'array' and jsonb_array_length(items) <= 60 and pg_column_size(items) <= 20000)
);
alter table public.carritos_web enable row level security;
drop policy if exists "Cliente gestiona su carrito" on public.carritos_web;
create policy "Cliente gestiona su carrito" on public.carritos_web
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Crea la cuenta del cliente. Si ya existe un cliente con el MISMO correo (verificado por el enlace), se vincula;
-- nunca se vincula por teléfono, porque cualquiera podría escribir el teléfono de otra persona.
create or replace function public.registrar_cuenta_cliente(
  p_nombre text, p_telefono text, p_ciudad text default null, p_acepta_datos boolean default false)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_tercero uuid;
  v_tel text := trim(coalesce(p_telefono, ''));
  v_ciudad text := nullif(trim(coalesce(p_ciudad, '')), '');
begin
  if v_uid is null then raise exception 'Debes iniciar sesión'; end if;
  select tercero_id into v_tercero from cuentas_clientes_web where user_id = v_uid;
  if v_tercero is not null then return v_tercero; end if;
  if p_nombre is null or length(trim(p_nombre)) < 2 then raise exception 'Nombre inválido'; end if;
  if length(regexp_replace(v_tel, '[^0-9]', '', 'g')) < 7 then raise exception 'Teléfono inválido'; end if;
  if p_acepta_datos is not true then raise exception 'Debes aceptar el tratamiento de datos personales'; end if;
  select email into v_email from auth.users where id = v_uid;
  select id into v_tercero from terceros
    where lower(email) = lower(v_email) and tipo in ('cliente', 'mixto') and activo
    order by created_at limit 1;
  if v_tercero is null then
    insert into terceros (tipo, tipo_documento, numero_documento, nombre_completo, email, telefono, ciudad,
                          acepta_tratamiento_datos, fecha_aceptacion_datos, medio_autorizacion, version_politica)
    values ('cliente', 'CC', 'WEB-' || substr(md5(v_uid::text), 1, 10), trim(p_nombre), v_email, v_tel, v_ciudad,
            true, now(), 'Registro de cuenta en la web (lanarosacrochet.com)', 'v1.0')
    returning id into v_tercero;
  else
    update terceros set telefono = coalesce(telefono, nullif(v_tel, '')), ciudad = coalesce(ciudad, v_ciudad),
                        updated_at = now()
    where id = v_tercero;
  end if;
  insert into cuentas_clientes_web (user_id, tercero_id) values (v_uid, v_tercero);
  return v_tercero;
end $$;

create or replace function public.mi_cuenta()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('nombre', t.nombre_completo, 'email', t.email, 'telefono', t.telefono,
                            'ciudad', t.ciudad, 'puntos', t.puntos_fidelizacion)
  from cuentas_clientes_web c join terceros t on t.id = c.tercero_id
  where c.user_id = auth.uid();
$$;

create or replace function public.actualizar_mi_cuenta(p_nombre text, p_telefono text, p_ciudad text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Debes iniciar sesión'; end if;
  if p_nombre is null or length(trim(p_nombre)) < 2 then raise exception 'Nombre inválido'; end if;
  if length(regexp_replace(coalesce(p_telefono, ''), '[^0-9]', '', 'g')) < 7 then raise exception 'Teléfono inválido'; end if;
  update terceros set nombre_completo = trim(p_nombre), telefono = trim(p_telefono),
                      ciudad = nullif(trim(coalesce(p_ciudad, '')), ''), updated_at = now()
  where id = (select tercero_id from cuentas_clientes_web where user_id = auth.uid());
end $$;

-- Historial del cliente: pedidos (WhatsApp, tienda física) y solicitudes de personalizados.
-- Solo campos que puede ver el cliente; sin costos, asientos ni observaciones internas.
create or replace function public.mis_pedidos()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_t uuid;
  v_email text;
  v_pedidos jsonb;
  v_solicitudes jsonb;
begin
  select tercero_id into v_t from cuentas_clientes_web where user_id = auth.uid();
  if v_t is null then return jsonb_build_object('pedidos', '[]'::jsonb, 'solicitudes', '[]'::jsonb); end if;
  select email into v_email from auth.users where id = auth.uid();

  select coalesce(jsonb_agg(to_jsonb(x) order by x.fecha desc), '[]'::jsonb) into v_pedidos from (
    select p.consecutivo, p.created_at as fecha, p.descripcion_producto as producto, p.cantidad,
           p.total_pedido as total, p.estado::text as estado, p.fecha_estimada_entrega as entrega, 'pedido'::text as origen
    from pedidos_canal_venta p where p.tercero_id = v_t
    union all
    select vp.consecutivo, coalesce(vp.fecha, vp.created_at), 
           (select string_agg(d.descripcion || ' x' || d.cantidad::text, ', ') from ventas_pos_detalle d where d.venta_id = vp.id),
           null::numeric, vp.total, vp.estado, null::date, 'tienda'::text
    from ventas_pos vp where vp.tercero_id = v_t and vp.estado <> 'anulada'
  ) x;

  select coalesce(jsonb_agg(to_jsonb(y) order by y.fecha desc), '[]'::jsonb) into v_solicitudes from (
    select o.consecutivo, o.created_at as fecha, left(o.descripcion, 200) as descripcion, o.etapa
    from oportunidades_venta o
    where o.tercero_id = v_t or lower(o.cliente_correo_libre) = lower(v_email)
  ) y;

  return jsonb_build_object('pedidos', v_pedidos, 'solicitudes', v_solicitudes);
end $$;

revoke all on function public.registrar_cuenta_cliente(text, text, text, boolean) from public, anon;
revoke all on function public.mi_cuenta() from public, anon;
revoke all on function public.actualizar_mi_cuenta(text, text, text) from public, anon;
revoke all on function public.mis_pedidos() from public, anon;
grant execute on function public.registrar_cuenta_cliente(text, text, text, boolean) to authenticated;
grant execute on function public.mi_cuenta() to authenticated;
grant execute on function public.actualizar_mi_cuenta(text, text, text) to authenticated;
grant execute on function public.mis_pedidos() to authenticated;

-- Permisos para clientes con sesión iniciada (antes solo estaban abiertos para visitantes "anon")
create policy "lectura publica de resenas aprobadas (con sesion)" on public.resenas_web
  for select to authenticated using (estado = 'aprobada'::text);
create policy "clientes con sesion suben fotos de solicitudes web" on storage.objects
  for insert to authenticated with check (bucket_id = 'solicitudes-personalizadas'::text);
