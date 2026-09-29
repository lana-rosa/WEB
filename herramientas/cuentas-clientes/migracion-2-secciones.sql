-- Cuentas de clientes, parte 2: favoritos, direcciones, mensajes, reseñas desde la cuenta y pedidos con más detalle.
-- Aplicada en producción (proyecto "Lana Rosa ERP + SO"). Solo agrega; no cambia datos existentes.

-- ---------- Favoritos ----------
create table if not exists public.favoritos_web (
  user_id uuid not null references auth.users(id) on delete cascade,
  producto_id uuid not null references public.inventario_items(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, producto_id)
);
alter table public.favoritos_web enable row level security;
create policy "favoritos: ver los propios" on public.favoritos_web for select to authenticated using (user_id = auth.uid());
create policy "favoritos: agregar los propios" on public.favoritos_web for insert to authenticated with check (user_id = auth.uid());
create policy "favoritos: quitar los propios" on public.favoritos_web for delete to authenticated using (user_id = auth.uid());
revoke all on public.favoritos_web from anon;

-- ---------- Direcciones ----------
create table if not exists public.direcciones_web (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  alias text not null check (length(alias) between 1 and 40),
  nombre_receptor text check (length(nombre_receptor) <= 80),
  telefono text check (length(telefono) <= 30),
  ciudad text not null check (length(ciudad) between 2 and 60),
  direccion text not null check (length(direccion) between 4 and 200),
  indicaciones text check (length(indicaciones) <= 200),
  es_principal boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.direcciones_web enable row level security;
create policy "direcciones: gestionar las propias" on public.direcciones_web for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke all on public.direcciones_web from anon;

create or replace function public.fn_limite_direcciones() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from direcciones_web where user_id = NEW.user_id) >= 10 then
    raise exception 'Puedes guardar hasta 10 direcciones';
  end if;
  return NEW;
end $$;
create trigger trg_limite_direcciones before insert on public.direcciones_web for each row execute function public.fn_limite_direcciones();

-- ---------- Mensajes de la cuenta ----------
create table if not exists public.mensajes_cuenta (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null default 'pedido',
  titulo text not null,
  cuerpo text,
  referencia text,
  leido boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_mensajes_cuenta_user on public.mensajes_cuenta (user_id, created_at desc);
alter table public.mensajes_cuenta enable row level security;
create policy "mensajes: ver los propios" on public.mensajes_cuenta for select to authenticated using (user_id = auth.uid());
revoke all on public.mensajes_cuenta from anon;
revoke insert, update, delete on public.mensajes_cuenta from authenticated;

create or replace function public.marcar_mensajes_leidos() returns void language sql security definer set search_path = public as $$
  update mensajes_cuenta set leido = true where user_id = auth.uid() and leido = false;
$$;
revoke execute on function public.marcar_mensajes_leidos() from public, anon;
grant execute on function public.marcar_mensajes_leidos() to authenticated;

-- Aviso automático cuando el equipo crea o cambia el estado de un pedido
create or replace function public.fn_mensaje_pedido_cuenta() returns trigger language plpgsql security definer set search_path = public as $$
declare v_user uuid; v_titulo text; v_cuerpo text;
begin
  begin
    if NEW.tercero_id is null then return NEW; end if;
    if TG_OP = 'UPDATE' and NEW.estado is not distinct from OLD.estado then return NEW; end if;
    select user_id into v_user from cuentas_clientes_web where tercero_id = NEW.tercero_id limit 1;
    if v_user is null then return NEW; end if;
    case NEW.estado::text
      when 'esperando_pago' then v_titulo := 'Recibimos tu pedido'; v_cuerpo := 'Registramos tu pedido ' || NEW.consecutivo || '. Está esperando el pago para empezar a tejerlo.';
      when 'en_preparacion' then v_titulo := 'Estamos tejiendo tu pedido'; v_cuerpo := 'Tu pedido ' || NEW.consecutivo || ' ya está en preparación.';
      when 'listo_despacho' then v_titulo := 'Tu pedido está listo'; v_cuerpo := 'Tu pedido ' || NEW.consecutivo || ' está listo para entregarse o enviarse.';
      when 'entregado' then v_titulo := 'Tu pedido fue entregado'; v_cuerpo := 'Esperamos que ames tu pedido ' || NEW.consecutivo || '. Puedes contarnos cómo te fue en Mi cuenta → Reseñas.';
      else return NEW;
    end case;
    insert into mensajes_cuenta (user_id, tipo, titulo, cuerpo, referencia) values (v_user, 'pedido', v_titulo, v_cuerpo, NEW.consecutivo);
  exception when others then null;
  end;
  return NEW;
end $$;
create trigger trg_mensaje_pedido_cuenta after insert or update of estado on public.pedidos_canal_venta
  for each row execute function public.fn_mensaje_pedido_cuenta();

-- ---------- Reseñas desde la cuenta ----------
alter table public.resenas_web add column if not exists user_id uuid references auth.users(id) on delete set null;

create or replace function public.mis_resenas() returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_t uuid; v_pend jsonb; v_hechas jsonb;
begin
  select tercero_id into v_t from cuentas_clientes_web where user_id = auth.uid();
  if v_t is null then return jsonb_build_object('pendientes', '[]'::jsonb, 'hechas', '[]'::jsonb); end if;

  select coalesce(jsonb_agg(to_jsonb(c) order by c.fecha desc), '[]'::jsonb) into v_pend from (
    select i.id::text as clave, i.nombre, i.foto_url as foto, max(x.f) as fecha
    from (
      select p.inventario_item_id iid, p.created_at f from pedidos_canal_venta p
        where p.tercero_id = v_t and p.estado = 'entregado' and p.inventario_item_id is not null
      union all
      select d.inventario_item_id, coalesce(vp.fecha, vp.created_at) from ventas_pos vp
        join ventas_pos_detalle d on d.venta_id = vp.id
        where vp.tercero_id = v_t and vp.estado = 'completada' and d.inventario_item_id is not null
    ) x join inventario_items i on i.id = x.iid
    where i.tipo = 'producto_terminado'
    group by i.id, i.nombre, i.foto_url
    union all
    select 'pedido:' || p.consecutivo, left(p.descripcion_producto, 80), null, p.created_at
    from pedidos_canal_venta p
    where p.tercero_id = v_t and p.estado = 'entregado' and p.inventario_item_id is null
  ) c
  where not exists (select 1 from resenas_web r where r.user_id = auth.uid() and r.producto_id = c.clave);

  select coalesce(jsonb_agg(to_jsonb(h) order by h.fecha desc), '[]'::jsonb) into v_hechas from (
    select r.producto_nombre as nombre, r.calificacion, r.comentario, r.estado, r.created_at as fecha
    from resenas_web r where r.user_id = auth.uid()
  ) h;

  return jsonb_build_object('pendientes', v_pend, 'hechas', v_hechas);
end $$;
revoke execute on function public.mis_resenas() from public, anon;
grant execute on function public.mis_resenas() to authenticated;

create or replace function public.crear_mi_resena(p_clave text, p_calificacion integer, p_comentario text) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_t uuid; v_nombre text; v_tel text; v_prod_nombre text; v_cat text; v_id uuid; v_iid uuid; v_partes text[];
begin
  if auth.uid() is null then raise exception 'Inicia sesión'; end if;
  if p_calificacion is null or p_calificacion < 1 or p_calificacion > 5 then raise exception 'Calificación inválida'; end if;
  if p_comentario is null or length(trim(p_comentario)) < 5 then raise exception 'Comentario demasiado corto'; end if;
  if length(trim(p_comentario)) > 600 then raise exception 'Comentario demasiado largo'; end if;

  select c.tercero_id, t.nombre_completo, t.telefono into v_t, v_nombre, v_tel
  from cuentas_clientes_web c join terceros t on t.id = c.tercero_id where c.user_id = auth.uid();
  if v_t is null then raise exception 'No encontramos tu cuenta'; end if;

  if exists (select 1 from resenas_web r where r.user_id = auth.uid() and r.producto_id = p_clave) then
    raise exception 'Ya reseñaste esta pieza. ¡Gracias!';
  end if;

  if p_clave like 'pedido:%' then
    select left(p.descripcion_producto, 80) into v_prod_nombre from pedidos_canal_venta p
      where p.consecutivo = substr(p_clave, 8) and p.tercero_id = v_t and p.estado = 'entregado' and p.inventario_item_id is null;
    if v_prod_nombre is null then raise exception 'No encontramos esa compra'; end if;
    v_cat := 'Personalizados';
  else
    begin v_iid := p_clave::uuid; exception when others then raise exception 'Pieza inválida'; end;
    select i.nombre, i.categoria_web into v_prod_nombre, v_cat from inventario_items i
      where i.id = v_iid and i.tipo = 'producto_terminado'
        and (exists (select 1 from pedidos_canal_venta p where p.tercero_id = v_t and p.estado = 'entregado' and p.inventario_item_id = v_iid)
          or exists (select 1 from ventas_pos vp join ventas_pos_detalle d on d.venta_id = vp.id
                     where vp.tercero_id = v_t and vp.estado = 'completada' and d.inventario_item_id = v_iid));
    if v_prod_nombre is null then raise exception 'No encontramos esa compra'; end if;
  end if;

  -- En público solo se muestra el primer nombre y la inicial del apellido
  v_partes := regexp_split_to_array(initcap(lower(trim(v_nombre))), '\s+');
  v_nombre := v_partes[1] || case when array_length(v_partes, 1) > 1 then ' ' || upper(left(v_partes[array_length(v_partes, 1)], 1)) || '.' else '' end;

  insert into resenas_web (producto_id, producto_nombre, producto_categoria, cliente_nombre, cliente_telefono,
                           calificacion, comentario, estado, compra_coincide, user_id)
  values (p_clave, v_prod_nombre, v_cat, v_nombre, coalesce(v_tel, ''), p_calificacion, trim(p_comentario), 'pendiente', true, auth.uid())
  returning id into v_id;
  return v_id;
end $$;
revoke execute on function public.crear_mi_resena(text, integer, text) from public, anon;
grant execute on function public.crear_mi_resena(text, integer, text) to authenticated;

-- ---------- Pedidos con más detalle ----------
create or replace function public.mis_pedidos() returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_t uuid; v_email text; v_pedidos jsonb; v_solicitudes jsonb;
begin
  select tercero_id into v_t from cuentas_clientes_web where user_id = auth.uid();
  if v_t is null then return jsonb_build_object('pedidos', '[]'::jsonb, 'solicitudes', '[]'::jsonb); end if;
  select email into v_email from auth.users where id = auth.uid();

  select coalesce(jsonb_agg(to_jsonb(x) order by x.fecha desc), '[]'::jsonb) into v_pedidos from (
    select p.consecutivo, p.created_at as fecha, p.descripcion_producto as producto, p.cantidad,
           p.total_pedido as total, p.estado::text as estado, p.fecha_estimada_entrega as entrega, 'pedido'::text as origen,
           i.foto_url as foto, p.valor_envio as envio, p.anticipo_pagado, p.saldo_pagado
    from pedidos_canal_venta p left join inventario_items i on i.id = p.inventario_item_id
    where p.tercero_id = v_t
    union all
    select vp.consecutivo, coalesce(vp.fecha, vp.created_at),
           (select string_agg(d.descripcion || ' x' || d.cantidad::text, ', ') from ventas_pos_detalle d where d.venta_id = vp.id),
           null::numeric, vp.total, vp.estado, null::date, 'tienda'::text,
           null::text, null::numeric, null::boolean, null::boolean
    from ventas_pos vp where vp.tercero_id = v_t and vp.estado <> 'anulada'
  ) x;

  select coalesce(jsonb_agg(to_jsonb(y) order by y.fecha desc), '[]'::jsonb) into v_solicitudes from (
    select o.consecutivo, o.created_at as fecha, left(o.descripcion, 200) as descripcion, o.etapa
    from oportunidades_venta o
    where o.tercero_id = v_t or lower(o.cliente_correo_libre) = lower(v_email)
  ) y;

  return jsonb_build_object('pedidos', v_pedidos, 'solicitudes', v_solicitudes);
end $$;
