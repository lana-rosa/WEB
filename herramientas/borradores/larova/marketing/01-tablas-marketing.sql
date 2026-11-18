-- LAROVA · Marketing y Comunicación — BORRADOR (18-nov-2026). NO APLICADO.
-- Se aplica solo con el sí de Jennifer (🔴), nunca el 12 ni el 13-dic ni un sábado de 9 a. m. a 7 p. m.
-- Antes de aplicarlo: correr 02-prueba-con-rollback.sql. Después: asesor de seguridad de Supabase.
--
-- Tablas nuevas y aisladas: no tienen llaves hacia ninguna tabla existente (ventas, pedidos, inventario…)
-- y nadie existente las lee. Solo las ven y las cambian las administradoras (rol «administrador» activo,
-- con la función que ya existe public.fn_rol_actual()). No se crea ninguna función nueva.
-- Campos según herramientas/memoria/marketing-programacion-esquema.md (chat 8, 18-nov-2026).

create table if not exists public.mkt_piezas (
  id               uuid primary key default gen_random_uuid(),
  marca            text not null check (marca in ('crochet', 'academy')),          -- siempre separadas
  plataformas      text[] not null default '{}'
                   check (plataformas <@ array['instagram', 'facebook', 'tiktok', 'pinterest', 'youtube']::text[]),
  fecha            date,                                                          -- día de publicación (America/Bogota)
  tipo_publicacion text not null check (tipo_publicacion in ('reel', 'carrusel', 'stories', 'video_youtube', 'foto')),
  angulo           text not null check (length(trim(angulo)) between 1 and 300), -- idea de la pieza en una frase
  objetivos        text[] not null default '{}'
                   check (objetivos <@ array['alcance', 'confianza', 'conversion', 'formacion', 'lista_espera', 'comunidad']::text[]),
  guion            text not null default '',                                      -- gancho, desarrollo, CTA
  copy             text not null default '',                                      -- texto de la publicación
  estado           text not null default 'idea'
                   check (estado in ('idea', 'aprobado', 'grabado', 'editado', 'publicado')),
  bloque_grabacion date,                                                          -- sábado de grabación en bloque
  notas            text not null default '',                                      -- pendientes (fotos, permisos)
  creado_por       uuid default auth.uid(),
  creado_en        timestamptz not null default now(),
  actualizado_en   timestamptz not null default now()
);

create index if not exists mkt_piezas_fecha_idx on public.mkt_piezas (fecha);
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
  'LAROVA Marketing: programación de contenido (esquema del chat 8). Solo administradoras. Aislada: sin llaves a otras tablas.';
