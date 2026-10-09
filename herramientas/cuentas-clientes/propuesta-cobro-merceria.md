# Cobro en línea de lanas e hilos (Mercería) — APLICADO el 9-oct-2026

Sara aprobó («corrige el cobro») y decidió: **Wompi cobra solo los productos; a domicilio el envío lo paga la clienta a la transportadora al recibir** (como dicen los Términos de venta de la Mercería, sección 9). Recoger en tienda sigue gratis.

## Qué estaba mal
1. `crear-pago-wompi` solo aceptaba productos terminados de la Tienda y patrones digitales: un material (`tipo = 'merceria'`) se rechazaba con el error 409.
2. Aunque lo aceptara, cobraba el **precio por gramo** (`precio_venta`) por cada ovillo: $110 en vez de $17.600.
3. La existencia de lanas e hilos está en **gramos** pero se vende por **ovillo**; el ERP comparaba gramos con ovillos.

## Qué se hizo
- **`crear-pago-wompi` v30** (`funciones/crear-pago-wompi.ts`): acepta materiales del centro Tienda/Mercería (sin «Empaques»); precio del ovillo = `precio_venta × peso_gramos`, redondeado a $100 (igual que la web); valida existencias (gramos ÷ peso = ovillos; suma cantidades repetidas); no mezcla materiales con productos de la Tienda ni con patrones; a domicilio cobra $0 de envío en línea y guarda `envio_al_recibir = true` y una nota «Envío contraentrega…» con el estimado. Con productos de la Tienda y patrones todo queda igual.
- **Base de datos** (`migracion-17-cobro-merceria.sql`): columna `pedidos_web.envio_al_recibir`; `obtener_merceria_web_v2()` (agrega `unidad_medida`); `fn_registrar_pedido_web_en_erp` registra la cantidad en gramos para lanas/hilos guardados en gramos; `fn_correo_compra_web` dice «Lo pagas al recibir» en vez de «Gratis».
- **Web**: `js/pago.js` v23 (`PAGO_EN_LINEA_MERCERIA = true`): la ventana de pago muestra «Lo pagas a la transportadora al recibir (aprox. $X)» y «Pagas ahora en línea»; solo Colombia; la casilla de aceptación enlaza los términos de venta y la política de cambios de la Mercería. Un carrito que mezcla materiales y productos de la Tienda se pide por WhatsApp o en dos compras. `js/merceria.js`: «Quedan N unidades» y tope del carrito por existencias.

## Pruebas hechas
- SQL: pedido de prueba en un bloque con error final (se deshace todo): ERP cantidad 320 g, valor $35.200, observación y correo correctos.
- Función desplegada, consultada desde la base: cotización de un producto de la Tienda (200, mismo total de siempre); material agotado (409 «está agotado por ahora»); carrito mezclado (409).
- Navegador (simulado): ficha, tope por existencias, ventana de pago de materiales y carrito mezclado.

## Qué NO se pudo probar (hacerlo con el primer ovillo real)
Hoy ninguna lana tiene existencias, así que el camino feliz (cotizar y pagar un material con existencias) no se pudo ejecutar contra la función desplegada. **Antes de anunciar el pago en línea:** cargar existencias de un ovillo, comprarlo con Wompi (valor bajo, o con llaves de pruebas y `?pagosprueba=1`), y revisar el pedido en el ERP (cantidad en gramos, observación «ENVÍO CONTRAENTREGA»), el aviso a contacto@ y el correo de recibo.

## CRM y Rosina (9-oct-2026, decisiones de Sara)
- Los pedidos de materiales sí pasan al CRM. Para tener la base de clientes de cada casa: `pedidos.casa` y la tabla `clientes_casas` en el CRM (`crm-migracion-casas.sql`); `recibir-pedido-web` (CRM v4) y `enviar-pedido-web-crm` (ERP v21) mandan y guardan la casa. Una persona sigue siendo un solo cliente con historial por casa. **Falta:** que la pantalla del CRM muestre/filtre por casa (la app del CRM no está en este repositorio).
- `rosina-web` v13: precio del ovillo (no por gramo), existencias en ovillos, términos y política de cambios de la Mercería, y no dice «disponible» si figura agotado.

## Para revisar con Sara
- Hay 7 lanas de la Mercería con `unidad_medida = 'unidad'` (las demás están en 'gramo'): el precio se calcula igual (por gramo × peso), pero su existencia se leería como ovillos. Al cargar las existencias con `cargar_merceria.py` quedan en 'gramo' (Sara: ok).
- Para volver a pedir los materiales solo por WhatsApp: `PAGO_EN_LINEA_MERCERIA = false` en `js/pago.js`.
