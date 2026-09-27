-- Aplicada en Supabase (proyecto "Lana Rosa ERP + SO") el 27-sep-2026 como "web_google_shopping_feed".
-- Productos de la tienda web que se envían a Google Merchant Center (solo diseños propios).
-- Tabla aparte para no modificar inventario_items del ERP.
create table if not exists public.web_google_shopping (
  item_id uuid primary key references public.inventario_items(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.web_google_shopping enable row level security;

-- Carga inicial: todos los productos de la tienda menos los personajes de marcas o personas famosas.
insert into public.web_google_shopping (item_id)
select w.id from public.obtener_tienda_web() w
where w.nombre not in (
  'Barbie 29cm','Bulbasaur Pokemón 14cm*15cm','Coraline 19cm','Dipper Pines Gravity Falls 22cm',
  'Goku Dragon Ball Z 20cm','Harry Potter 14cm','Hello Kitty 10cm','Hermione Granger 14cm',
  'Lambie Doctora Juguetes 15cm','Lionel Messi Copa Mundial 20cm','Michael Jackson 19cm',
  'Mickey Mouse 15cm','Minnie Mouse 15cm','Nami One Piece 15cm','Pato Donald 15cm',
  'Portgas D. Ace One Piece 15cm','Rapunzel 15cm','Ron Weasley 14cm','Roronoa Zoro One Piece 15cm',
  'Rosita Fresita (25cm)','Sanji One Piece','Usopp One Piece','Vegueta Dragon Ball Z 20cm',
  'Winnie the Pooh con corazón 10cm','Llavero Frailejón Ernesto Pérez 11cm','Llavero Labubu 10cm',
  'Llavero Luffy Cabeza - One Piece','Peluche Sin Rostro 15cm','Peluche Snoopy grande 32cm',
  'Peluche Spiderman 22cm'
)
on conflict do nothing;

create or replace function public.obtener_feed_google()
returns table(id uuid, sku text, nombre text, precio numeric, categoria_web text, descripcion_web text,
              foto_url text, stock_actual numeric, tiempo_elaboracion text)
language sql
security definer
set search_path to 'public'
as $$
  select i.id, i.sku, i.nombre, i.precio_venta, i.categoria_web, i.descripcion_web,
         i.foto_url, i.stock_actual, i.tiempo_elaboracion
  from inventario_items i
  join web_google_shopping g on g.item_id = i.id
  where i.tipo = 'producto_terminado' and i.activo = true and i.disponible_web = true
    and i.descripcion_web is not null and i.foto_url is not null and i.precio_venta > 0
  order by i.orden_web nulls last, i.nombre;
$$;
revoke all on function public.obtener_feed_google() from public;
grant execute on function public.obtener_feed_google() to anon, authenticated;

-- 27-sep-2026, migración "web_personajes_y_titulos_google": columnas titulo_google/descripcion_google,
-- tabla web_productos_personaje (30 productos) y RPC obtener_productos_personaje(); obtener_feed_google usa coalesce(titulo_google, nombre).
