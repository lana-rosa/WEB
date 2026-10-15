#!/usr/bin/env python3
"""Genera migracion-universo-1.sql (tabla de etiquetas, función obtener_regalos_web y PROPUESTAS de etiquetas sin revisar)
a partir de herramientas/pruebas/fixtures/regalos.json (copia de lo que devolvió la función el 15-oct-2026)."""
import json, os
AQUI = os.path.dirname(os.path.abspath(__file__))
datos = json.load(open(os.path.join(AQUI, '..', 'pruebas', 'fixtures', 'regalos.json'), encoding='utf-8'))
arr = lambda a: "'{" + ",".join(a) + "}'"
filas = [p for p in datos if p['ocasiones'] or p['destinatarios'] or p['estilos']]
valores = ",\n".join("  ('%s', %s, %s, %s) -- %s" % (p['id'], arr(p['ocasiones']), arr(p['destinatarios']), arr(p['estilos']), p['nombre'].replace('"', '')) for p in filas)
CABECERA = r"""-- Etapa 1 del universo de Rosina — «Rosina te ayuda a regalar» (aplicada en Supabase el 15-oct-2026).
-- Crea las etiquetas de los productos (ocasión, para quién, estilo), la función pública que alimenta el recomendador
-- y carga PROPUESTAS de etiquetas que NO están revisadas: el recomendador no las usa para filtrar hasta que Sara o el taller
-- las revisen (columna revisado_en). Es idempotente: se puede volver a correr sin duplicar ni pisar etiquetas ya revisadas.
--
-- Seguridad: la tabla tiene RLS activado y SIN políticas, y no se le da acceso a anon ni a authenticated; solo se lee
-- a través de obtener_regalos_web() (SECURITY DEFINER; solo devuelve campos públicos y si hay existencia, no cuántas unidades).

create table if not exists public.producto_etiquetas (
  item_id        uuid primary key references public.inventario_items(id) on delete cascade,
  ocasiones      text[] not null default '{}',
  destinatarios  text[] not null default '{}',
  estilos        text[] not null default '{}',
  revisado_por   text,
  revisado_en    timestamptz,
  actualizado_en timestamptz not null default now()
);
alter table public.producto_etiquetas enable row level security;
revoke all on public.producto_etiquetas from anon, authenticated;
comment on table public.producto_etiquetas is
  'Etiquetas de regalo por producto. Solo se usan para filtrar en la web cuando revisado_en no es nulo (revisión de Sara o el taller).';

create or replace function public.obtener_regalos_web()
returns table(id uuid, nombre text, precio numeric, categoria_web text, foto_url text, tiempo_elaboracion text,
              en_existencia boolean, tamano_cm numeric, personalizable_base boolean, es_personaje boolean,
              ocasiones text[], destinatarios text[], estilos text[], etiquetas_revisadas boolean)
language sql stable security definer set search_path to 'public'
as $function$
  select i.id, i.nombre, i.precio_venta, i.categoria_web, i.foto_url, i.tiempo_elaboracion,
         coalesce(i.stock_actual, 0) > 0,
         nullif(replace(substring(i.nombre from '(?i)(\d+(?:[.,]\d+)?)\s*cm'), ',', '.'), '')::numeric,
         i.nombre ~ '^Amigurumi personalizado \d+ cm$',
         exists (select 1 from web_productos_personaje wp where wp.item_id = i.id),
         coalesce(e.ocasiones, '{}'), coalesce(e.destinatarios, '{}'), coalesce(e.estilos, '{}'),
         (e.revisado_en is not null)
  from inventario_items i
  left join producto_etiquetas e on e.item_id = i.id
  where i.tipo = 'producto_terminado' and i.activo = true and i.descripcion_web is not null
    and i.disponible_web = true and i.foto_url is not null and i.precio_venta > 0
  order by i.orden_web nulls last, i.nombre;
$function$;
-- Pública a propósito (la usa la web sin cuenta): también está en la lista blanca de anon de migracion-19-seguridad.sql.
grant execute on function public.obtener_regalos_web() to anon, authenticated, service_role;

-- Propuestas de etiquetas (SIN revisar). Las que ya estén en la tabla no se tocan.
insert into public.producto_etiquetas (item_id, ocasiones, destinatarios, estilos) values
"""
PIE = r"""
on conflict (item_id) do nothing;

-- Cuando Sara corrija un producto, se registra así (el recomendador empieza a usarlo):
--   update public.producto_etiquetas
--      set ocasiones = '{cumpleanos,dia_madre}', destinatarios = '{mama,amiga_o}', estilos = '{tierno}',
--          revisado_por = 'Sara', revisado_en = now(), actualizado_en = now()
--    where item_id = '<id del producto>';
-- Los filtros «¿Para quién?» y «¿Qué ocasión?» aparecen en la web solo cuando hay al menos
-- CONFIG.MIN_ETIQUETADOS (20, en js/universo/config.js) productos con revisado_en.
"""
salida = os.path.join(AQUI, 'migracion-universo-1.sql')
open(salida, 'w', encoding='utf-8').write(CABECERA + valores + PIE)
print(len(filas), 'filas de propuestas →', salida)
