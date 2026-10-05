# Carga de la Mercería en el ERP (antes de la apertura)

1. Sara llena `plantilla_carga_merceria.xlsx` (hoja **Productos**): cantidad comprada y costo de cada producto, y los productos nuevos en las filas vacías. Lanas e hilos van "Por ovillo y por gramo" (decisión de Sara, 5-oct-2026): se compran y se cuentan por ovillo, pero la existencia queda en gramos para poder vender el ovillo completo o gramos sueltos en la caja. Agujas, herrajes, relleno y demás van "Por unidad".
2. Claude genera el SQL: `python3 herramientas/merceria-carga/cargar_merceria.py archivo.xlsx > carga.sql` (el resumen y los errores salen en pantalla).
3. Claude revisa el SQL y le muestra a Sara el resumen (productos, unidades y valor total) antes de ejecutarlo en Supabase.
4. Después de cargar: calcular precios con la regla de la Mercería del ERP (Configuración → Reglas de precios), marcar en la web lo que tenga foto, y pasarle al contador el valor total de la mercancía para el saldo de apertura de inventarios.

Notas:
- El SQL va en una transacción y no toca el Taller (solo el centro "Tienda/Mercería").
- Cada entrada queda en el Kardex como `compra_proveedor` con costo, proveedor, factura y fecha, y actualiza el costo promedio ponderado.
- La carga no crea asientos contables de compra: la mercancía que ya existe entra como saldo de apertura con el contador; las compras nuevas se registran como siempre en "Registrar compra / pago a proveedor".
