-- LAROVA · Marketing y Comunicación — BORRADOR (18-nov-2026). NO APLICADO.
-- Se aplica solo con el sí de Jennifer (🔴), nunca el 12 ni el 13-dic ni un sábado de 9 a. m. a 7 p. m.
-- Antes de aplicarlo: correr 02-prueba-con-rollback.sql. Después: asesor de seguridad de Supabase.
--
-- Tablas nuevas y aisladas: no tienen llaves hacia ninguna tabla existente (ventas, pedidos, inventario…)
-- y nadie existente las lee. Solo las ven y las cambian las administradoras (rol «administrador» activo,
-- con la función que ya existe public.fn_rol_actual()). No se crea ninguna función nueva.
-- Los campos son PROPUESTA: los confirma el chat «Web Chat 8. Marketing y contenido».

create table if not exists public.mkt_piezas (
  id               uuid primary key default gen_random_uuid(),
  marca            text not null check (marca in ('lana_rosa_crochet', 'lana_rosa_academy')),
  titulo           text not null check (length(trim(titulo)) between 1 and 200),
  tipo             text not null check (tipo in ('reel', 'carrusel', 'historia', 'video_youtube')),
  plataformas      text[] not null default '{}'
                   check (plataformas <@ array['instagram', 'facebook', 'tiktok', 'youtube']::text[]),
  estado           text not null default 'idea'
                   check (estado in ('idea', 'aprobado', 'grabado', 'editado', 'publicado')),
  fecha_publicacion timestamptz,                 -- día y hora en que sale (puede quedar vacía en «idea»)
  guion            text not null default '',     -- guion completo (tomas, gancho, cierre)
  copy             text not null default '',     -- texto de la publicación (con hashtags)
  linea_contenido  text,                         -- ej. «Apertura», «El crochet tiene historia»
  codigo           text,                         -- ej. R2, C3, S4 (el del calendario del chat 8)
  enlace_publicado text check (enlace_publicado is null or enlace_publicado ~ '^https://'),
  notas            text not null default '',
  creado_por       uuid default auth.uid(),
  creado_en        timestamptz not null default now(),
  actualizado_en   timestamptz not null default now()
);

create index if not exists mkt_piezas_fecha_idx on public.mkt_piezas (fecha_publicacion);
create index if not exists mkt_piezas_marca_estado_idx on public.mkt_piezas (marca, estado);

alter table public.mkt_piezas enable row level security;
alter table public.mkt_piezas force row level security;

-- Nadie de afuera: ni anon ni el público.
revoke all on public.mkt_piezas from public, anon;
grant select, insert, update, delete on public.mkt_piezas to authenticated;

drop policy if exists mkt_piezas_solo_admin on public.mkt_piezas;
create policy mkt_piezas_solo_admin on public.mkt_piezas
  for all to authenticated
  using ((select public.fn_rol_actual())::text = 'administrador')
  with check ((select public.fn_rol_actual())::text = 'administrador');

comment on table public.mkt_piezas is
  'LAROVA Marketing: piezas de contenido (guion, copy, estado, tipo, plataformas, fecha). Solo administradoras. Aislada: sin llaves a otras tablas.';
