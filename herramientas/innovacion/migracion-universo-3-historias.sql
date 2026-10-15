-- Etapa 3 del universo de Rosina — páginas públicas de cuidados e historia por pieza (QR). Aditiva: no toca inventario_items ni nada del ERP.
--
-- producto_historia: lo que el TALLER revisa y decide publicar de cada pieza (historia, cuidados validados para esa pieza, notas de material).
-- Nada se publica hasta que `publicado` sea true Y `revisado_en` no sea nulo (igual que las etiquetas de la Etapa 1).
-- Seguridad: RLS activado SIN políticas y sin acceso directo para anon/authenticated; solo se lee a través de obtener_producto_publico().
-- Aplicada en Supabase el 16-oct-2026.

create table if not exists public.producto_historia (
  item_id            uuid primary key references public.inventario_items(id) on delete cascade,
  historia           text,                    -- 2 a 4 frases que escribe o aprueba el taller; null = sin historia
  cuidados_validados jsonb,                   -- lista de frases validadas por el taller PARA ESTA PIEZA; null = se usan los cuidados_web de siempre
  material_notas     text,                    -- solo si el taller lo confirma (p. ej. «lana acrílica suave»)
  publicado          boolean not null default false,
  revisado_por       text,
  revisado_en        timestamptz,
  actualizado_en     timestamptz not null default now(),
  constraint producto_historia_cuidados_lista check (cuidados_validados is null or jsonb_typeof(cuidados_validados) = 'array'),
  constraint producto_historia_largos check (length(coalesce(historia, '')) <= 1200 and length(coalesce(material_notas, '')) <= 300)
);
alter table public.producto_historia enable row level security;
revoke all on public.producto_historia from anon, authenticated;
comment on table public.producto_historia is
  'Historia, cuidados validados y notas de material por pieza para la página pública /p/ (QR). Solo se muestran con publicado = true y revisado_en no nulo.';

-- Página pública de una pieza. Devuelve SOLO datos que la tienda ya publica (obtener_tienda_web) más lo que el taller aprobó.
create or replace function public.obtener_producto_publico(p_id uuid)
returns table(id uuid, nombre text, categoria_web text, foto_url text, descripcion_web text, especificaciones_web jsonb,
              cuidados jsonb, cuidados_validados boolean, historia text, material_notas text)
language sql stable security definer set search_path to 'public'
as $function$
  select t.id, t.nombre, t.categoria_web, t.foto_url, t.descripcion_web, t.especificaciones_web,
         case when h.publicado and h.revisado_en is not null and h.cuidados_validados is not null then h.cuidados_validados else t.cuidados_web end,
         coalesce(h.publicado and h.revisado_en is not null and h.cuidados_validados is not null, false),
         case when h.publicado and h.revisado_en is not null then nullif(trim(h.historia), '') end,
         case when h.publicado and h.revisado_en is not null then nullif(trim(h.material_notas), '') end
  from public.obtener_tienda_web() t
  left join public.producto_historia h on h.item_id = t.id
  where t.id = p_id;
$function$;
revoke all on function public.obtener_producto_publico(uuid) from public;
-- Pública a propósito (la usa la página /p/ sin cuenta): también va en la lista blanca de anon de migracion-19-seguridad.sql.
grant execute on function public.obtener_producto_publico(uuid) to anon, authenticated, service_role;

-- Cuando el taller apruebe una pieza (la hoja se carga con herramientas/innovacion/historias.py):
--   insert into public.producto_historia (item_id, historia, cuidados_validados, material_notas, publicado, revisado_por, revisado_en)
--   values ('<id>', 'Historia…', '["Lavar a mano…", "Secar a la sombra"]', null, true, 'Sara', now())
--   on conflict (item_id) do update set historia = excluded.historia, cuidados_validados = excluded.cuidados_validados,
--     material_notas = excluded.material_notas, publicado = excluded.publicado, revisado_por = excluded.revisado_por,
--     revisado_en = excluded.revisado_en, actualizado_en = now();
