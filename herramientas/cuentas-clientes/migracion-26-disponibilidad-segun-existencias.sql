-- La tienda web ahora dice «Disponible» solo si hay existencias (20-oct-2026, a pedido de Sara).
-- Problema: obtener_tienda_web() devolvía disponible_web tal cual (una marca manual del ERP) sin mirar stock_actual; tras la venta de la feria
-- (POS-2026-00016) 14 productos con 0 existencias seguían como «Disponible» (despacho el siguiente día hábil) en la tienda y en los datos de Google.
-- Regla nueva: disponible = marca manual del ERP Y stock_actual > 0 (la marca manual en falso se respeta: nunca se promete lo que el taller marcó como bajo pedido).
-- Para volver atrás: reemplazar la expresión por i.disponible_web.
create or replace function public.obtener_tienda_web()
 returns table(id uuid, nombre text, precio numeric, categoria_web text, disponible_web boolean, tiempo_elaboracion text, descripcion_web text, especificaciones_web jsonb, cuidados_web jsonb, foto_url text, orden_web integer)
 language sql security definer set search_path to 'public'
as $function$
  SELECT i.id, i.nombre, i.precio_venta, i.categoria_web, (i.disponible_web AND coalesce(i.stock_actual, 0) > 0),
         i.tiempo_elaboracion, i.descripcion_web,
         CASE
           WHEN i.alto_cm IS NOT NULL AND i.ancho_cm IS NOT NULL THEN
             jsonb_build_array('Medidas: ' || trim(trailing '.' from trim(trailing '0' from i.alto_cm::numeric(8,1)::text)) || ' cm de alto x ' || trim(trailing '.' from trim(trailing '0' from i.ancho_cm::numeric(8,1)::text)) || ' cm de ancho')
             || coalesce((SELECT jsonb_agg(e) FROM jsonb_array_elements(coalesce(i.especificaciones_web, '[]'::jsonb)) e WHERE e::text NOT ILIKE '"Medidas%'), '[]'::jsonb)
           ELSE i.especificaciones_web
         END,
         i.cuidados_web, i.foto_url, i.orden_web
  FROM inventario_items i
  WHERE i.tipo = 'producto_terminado' AND i.activo = true AND i.descripcion_web IS NOT NULL
  ORDER BY i.orden_web NULLS LAST, i.nombre;
$function$;
