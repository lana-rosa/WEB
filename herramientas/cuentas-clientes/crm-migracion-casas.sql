-- CRM (proyecto «Lana Rosa CRM», wcqdkccvtywiutzknskr) — clientes por casa — 9-oct-2026.
-- Los pedidos pagados de la web llegan al CRM desde el ERP (`enviar-pedido-web-crm` → `recibir-pedido-web`). Desde que la Mercería vende materiales
-- en línea, cada pedido lleva su casa ('crochet' | 'merceria' | 'academy') y cada cliente suma su historial por casa en `clientes_casas`
-- (una persona sigue siendo UN solo cliente; puede comprar en varias casas).
alter table public.pedidos add column if not exists casa text not null default 'crochet';   -- los 32 pedidos existentes quedan en 'crochet'

create table if not exists public.clientes_casas (
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  casa text not null,
  primera_compra date,
  ultima_compra date,
  pedidos integer not null default 0,
  total_comprado numeric not null default 0,
  created_at timestamptz not null default now(),
  primary key (cliente_id, casa)
);
alter table public.clientes_casas enable row level security;
create policy clientes_casas_all on public.clientes_casas for all to public using (auth.role() = 'authenticated'::text);

create or replace function public.fn_registrar_compra_casa(p_cliente uuid, p_casa text, p_fecha date, p_total numeric)
returns void language sql security definer set search_path to 'public' as $f$
  insert into clientes_casas (cliente_id, casa, primera_compra, ultima_compra, pedidos, total_comprado)
  values (p_cliente, p_casa, p_fecha, p_fecha, 1, coalesce(p_total, 0))
  on conflict (cliente_id, casa) do update set
    primera_compra = least(clientes_casas.primera_compra, excluded.primera_compra),
    ultima_compra = greatest(clientes_casas.ultima_compra, excluded.ultima_compra),
    pedidos = clientes_casas.pedidos + 1,
    total_comprado = clientes_casas.total_comprado + excluded.total_comprado;
$f$;
revoke all on function public.fn_registrar_compra_casa(uuid, text, date, numeric) from public, anon, authenticated;
grant execute on function public.fn_registrar_compra_casa(uuid, text, date, numeric) to service_role;

-- Relleno inicial: todo lo que ya existía es de la tienda de amigurumis.
insert into public.clientes_casas (cliente_id, casa, primera_compra, ultima_compra, pedidos, total_comprado)
select cliente_id, 'crochet', min(fecha_pedido), max(fecha_pedido), count(*), coalesce(sum(precio_total), 0)
from public.pedidos where cliente_id is not null and casa = 'crochet' group by cliente_id
on conflict (cliente_id, casa) do nothing;

-- Edge Functions (viven en Supabase): CRM `recibir-pedido-web` v4 (lee `casa`, marca el pedido, tipo «Insumos (Mercería)» y suma el historial por casa);
-- ERP `enviar-pedido-web-crm` v21 (manda `casa`: 'merceria' si todos los productos son tipo 'merceria', si no 'crochet').
