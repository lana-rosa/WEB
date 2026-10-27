-- Paleta de colores de la Mercería (28-oct-2026, pedido de Sara)
-- Agrega dos datos opcionales por producto (metraje por ovillo y código del color) y una función pública que devuelve la paleta:
-- imagen, marca, gramos, composición, metraje y código del color. Mientras esos dos datos estén vacíos, la función los saca del nombre del producto
-- («… - 125 metros - 100% poliester», «Shade 25», «#2110», «T18»…); si Sara los escribe en el producto, manda lo escrito.
alter table public.inventario_items add column if not exists metraje_m numeric;
alter table public.inventario_items add column if not exists codigo_color text;

create or replace function public.obtener_paleta_merceria()
returns table (id uuid, linea text, marca text, color text, codigo_color text, composicion text, peso_gramos numeric, metraje_m numeric,
               foto_url text, categoria text, stock_actual numeric, precio_ovillo numeric)
language sql security definer set search_path to 'public' as $$
  select i.id,
         btrim(split_part(i.nombre, ' - ', 1)),
         i.marca, i.color,
         coalesce(nullif(btrim(i.codigo_color), ''),
                  (regexp_match(i.nombre, 'Shade\s*(\d+)', 'i'))[1],
                  (regexp_match(i.nombre, '#\s*(\w+)'))[1],
                  (regexp_match(i.nombre, '\m(T\d+)\M'))[1],
                  (regexp_match(i.color, '(\d{2,4})\s*$'))[1]),
         coalesce((select m[1] || '% ' || case lower(m[2]) when 'poliester' then 'poliéster' when 'acrilico' then 'acrílico' when 'algodon' then 'algodón' else lower(m[2]) end
                     from regexp_match(i.nombre, '(\d+)\s*%\s*([A-Za-zñáéíóúÑ]+)', 'i') as m),
                  nullif(btrim(i.material), '')),
         i.peso_gramos,
         coalesce(i.metraje_m, (regexp_match(i.nombre, '(\d+)\s*metros', 'i'))[1]::numeric),
         i.foto_url, c.nombre, i.stock_actual,
         case when i.peso_gramos > 0 and c.nombre in ('Lanas', 'Hilos') then round(i.precio_venta * i.peso_gramos / 100) * 100 else i.precio_venta end
    from inventario_items i left join categorias_inventario c on c.id = i.categoria_id
   where i.tipo = 'merceria' and i.activo = true and i.centro_costo_id = '2c1577b5-514e-4952-ba15-4feb64ea1879'
     and c.nombre in ('Lanas', 'Hilos')
   order by i.marca, btrim(split_part(i.nombre, ' - ', 1)), i.color;
$$;
-- función pública de la web: se abre a propósito a la llave pública
grant execute on function public.obtener_paleta_merceria() to anon, authenticated;
