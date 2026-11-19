-- LAROVA · Marketing: ESTADÍSTICAS por publicación — BORRADOR (19-nov-2026). NO APLICADO.
-- Se aplica solo con el sí de Jennifer (🔴), nunca el 12 ni el 13-dic ni un sábado de 9 a. m. a 7 p. m.
-- Antes: 04-prueba-metricas-con-rollback.sql. Después: asesor de seguridad.
-- No crea funciones. Solo administradoras (RLS con la función existente public.fn_rol_actual()).
-- OJO (aprendido el 18-nov): no usar DROP ... IF EXISTS; se cuelga en esta base.

-- 1) Una fila = los números de UNA pieza en UNA plataforma en UNA fecha de medición.
--    Marca y formato salen de la pieza (no se repiten aquí, así no se desordenan).
create table if not exists public.mkt_metricas (
  id                 uuid primary key default gen_random_uuid(),
  pieza_id           uuid not null references public.mkt_piezas(id) on delete cascade,
  plataforma         text not null check (plataforma in ('instagram', 'facebook', 'tiktok', 'pinterest', 'youtube')),
  fecha_medicion     date not null default current_date,
  alcance            integer check (alcance >= 0),
  impresiones        integer check (impresiones >= 0),
  vistas             integer check (vistas >= 0),
  interacciones      integer check (interacciones >= 0),
  me_gusta           integer check (me_gusta >= 0),
  comentarios        integer check (comentarios >= 0),
  guardados          integer check (guardados >= 0),
  compartidos        integer check (compartidos >= 0),
  clics              integer check (clics >= 0),
  seguidores_ganados integer,
  retencion_pct      numeric(5,2) check (retencion_pct between 0 and 100),   -- reels y videos
  tiempo_visto_seg   numeric(10,1) check (tiempo_visto_seg >= 0),            -- promedio por vista
  fuente             text not null default 'manual' check (fuente in ('manual', 'archivo')),
  notas              text not null default '',
  creado_por         uuid default auth.uid(),
  creado_en          timestamptz not null default now(),
  unique (pieza_id, plataforma, fecha_medicion)
);
create index if not exists mkt_metricas_pieza_idx on public.mkt_metricas (pieza_id);

-- 2) Cada cuántos días se miden (valor por defecto; Jennifer o el chat 8 lo cambian en la pantalla).
create table if not exists public.mkt_frecuencia_metricas (
  tipo_publicacion text not null check (tipo_publicacion in ('reel', 'carrusel', 'stories', 'video_youtube', 'foto')),
  plataforma       text not null check (plataforma in ('instagram', 'facebook', 'tiktok', 'pinterest', 'youtube')),
  dias_despues     integer[] not null check (array_length(dias_despues, 1) between 1 and 6),
  actualizado_en   timestamptz not null default now(),
  primary key (tipo_publicacion, plataforma)
);
insert into public.mkt_frecuencia_metricas (tipo_publicacion, plataforma, dias_despues)
select t, p, case
    when t = 'stories' then '{1}'::int[]
    when t = 'video_youtube' then '{7,28,90}'::int[]
    when t = 'foto' then '{1,7}'::int[]
    else '{1,7,28}'::int[] end
from unnest(array['reel','carrusel','stories','video_youtube','foto']) t,
     unnest(array['instagram','facebook','tiktok','pinterest','youtube']) p
on conflict do nothing;

-- 3) Lectura para los chats por rol (solo lectura, respeta los permisos de quien consulta).
create or replace view public.mkt_resultados with (security_invoker = true) as
select m.id, p.marca, m.plataforma, p.tipo_publicacion, p.fecha as fecha_publicacion, m.fecha_medicion,
       (m.fecha_medicion - p.fecha) as dias_despues, p.angulo, p.objetivos,
       m.alcance, m.impresiones, m.vistas, m.interacciones, m.me_gusta, m.comentarios, m.guardados,
       m.compartidos, m.clics, m.seguidores_ganados, m.retencion_pct, m.tiempo_visto_seg, m.notas,
       case when m.alcance > 0 then round(100.0 * coalesce(m.interacciones,
              coalesce(m.me_gusta,0) + coalesce(m.comentarios,0) + coalesce(m.guardados,0) + coalesce(m.compartidos,0)) / m.alcance, 2) end
         as tasa_interaccion_pct,
       m.pieza_id
from public.mkt_metricas m join public.mkt_piezas p on p.id = m.pieza_id;

-- 4) Permisos: nada para el público ni anon; RLS solo administradoras.
alter table public.mkt_metricas enable row level security;
alter table public.mkt_metricas force row level security;
alter table public.mkt_frecuencia_metricas enable row level security;
alter table public.mkt_frecuencia_metricas force row level security;
revoke all on public.mkt_metricas, public.mkt_frecuencia_metricas, public.mkt_resultados from public, anon;
grant select, insert, update, delete on public.mkt_metricas, public.mkt_frecuencia_metricas to authenticated;
grant select on public.mkt_resultados to authenticated;

create policy mkt_metricas_solo_admin on public.mkt_metricas for all to authenticated
  using ((select public.fn_rol_actual())::text = 'administrador')
  with check ((select public.fn_rol_actual())::text = 'administrador');
create policy mkt_frecuencia_solo_admin on public.mkt_frecuencia_metricas for all to authenticated
  using ((select public.fn_rol_actual())::text = 'administrador')
  with check ((select public.fn_rol_actual())::text = 'administrador');

comment on table public.mkt_metricas is 'LAROVA Marketing: estadísticas por pieza, plataforma y fecha de medición. Solo administradoras.';
comment on view public.mkt_resultados is 'LAROVA Marketing: lectura de resultados para los chats por rol (solo lectura).';
