-- Pasa las 7 lanas de la Mercería que quedaron en unidad «unidad» a «gramo» (E2, preparado el 17-nov-2026, SIN APLICAR).
-- Es un cambio en la base (nivel 🔴): se aplica con el sí de Jennifer, junto con la carga de la Mercería
-- (cargar_merceria.py ya hace lo mismo para las filas con «Por ovillo y por gramo»; este archivo es por si se quiere adelantar).
-- Solo toca el centro Tienda/Mercería (2c1577b5-514e-4952-ba15-4feb64ea1879), no el Taller.
-- Verificar antes:  select nombre, unidad_medida, stock_actual from inventario_items where centro_costo_id = '2c1577b5-514e-4952-ba15-4feb64ea1879' and unidad_medida = 'unidad' and (nombre ilike 'Lana %' or nombre ilike 'Hilo %');   -- deben salir 7 con existencias 0
update inventario_items
   set unidad_medida = 'gramo', updated_at = now()
 where centro_costo_id = '2c1577b5-514e-4952-ba15-4feb64ea1879'
   and unidad_medida = 'unidad'
   and (nombre ilike 'Lana %' or nombre ilike 'Hilo %')
   and coalesce(stock_actual, 0) = 0;
-- Verificar después: la misma consulta de arriba debe devolver 0 filas.
-- Revertir (solo si hiciera falta): update inventario_items set unidad_medida = 'unidad' where id in (<los 7 ids>);
