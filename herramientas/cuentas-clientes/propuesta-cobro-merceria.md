# Cobro en línea de lanas e hilos (Mercería): hallazgo y propuesta — 8-oct-2026

**Estado:** NO aplicado. Necesita la aprobación de Sara y una prueba real de bajo valor, porque toca el pago (`crear-pago-wompi`) y el registro de pedidos en el ERP.

## Qué pasa hoy
1. `crear-pago-wompi` solo acepta productos terminados de la Tienda (`tipo = 'producto_terminado'` con `descripcion_web`) y patrones digitales. Un producto de la Mercería (`tipo = 'merceria'`) se rechaza con el error 409 «Algún producto del carrito ya no está disponible».
2. Aunque lo aceptara, cobraría mal: el ERP guarda en `inventario_items.precio_venta` el **precio por gramo** de lanas e hilos (por ejemplo $110 por gramo de Kusi Kusi Chelín de 160 g) y la función calcula `precio_venta × cantidad`. Un ovillo de $17.600 se cobraría como $110.
3. La existencia de lanas e hilos está en **gramos** (decisión de Sara del 5-oct: «Por ovillo y por gramo»), pero la web vende por **ovillo completo**. `fn_crear_pedido_canal` compara `stock_actual` (gramos) con la cantidad pedida (ovillos).

## Qué se hizo mientras tanto (ya publicado en la rama de trabajo)
- Las tarjetas y la ficha muestran el precio **por ovillo** (`precio_gramo × peso_gramos`, redondeado a $100, igual que siempre).
- Los productos de la Mercería entran al carrito con `merceria: true`. Mientras `PAGO_EN_LINEA_MERCERIA = false` (`js/pago.js`), un carrito con materiales **oculta el botón de Wompi** y ofrece solo «Pedir por WhatsApp» (confirmamos disponibilidad, envío y pago por Nequi o Bre-B). Los patrones digitales y los productos de la Tienda siguen pagándose con Wompi.
- Los textos de la Mercería (inicio, Cómo comprar, preguntas frecuentes) dicen esto mismo.

## Propuesta para habilitar el pago en línea de materiales
1. **`crear-pago-wompi`** (solo para `tipo = 'merceria'`, sin tocar los demás caminos):
   - leer también `peso_gramos`, `unidad_medida` y `stock_actual`;
   - precio por unidad = `round(precio_venta × peso_gramos / 100) × 100` cuando `unidad_medida = 'gramo'` y hay `peso_gramos` (igual que la web); en otro caso `precio_venta`;
   - validar existencia: ovillos disponibles = `floor(stock_actual / peso_gramos)`; si `cantidad` es mayor, responder 409 con «No hay suficientes ovillos de …»;
   - excluir la categoría `Empaques` (las bolsas no se venden en la web);
   - guardar en `pedidos_web_items.precio` el precio del ovillo y en `cantidad` los ovillos.
2. **`fn_registrar_pedido_web_en_erp`**: para esos ítems, pasar a `fn_crear_pedido_canal` la cantidad en **gramos** (`cantidad × peso_gramos`) para que el ERP compare y descuente en la misma unidad que el inventario.
3. **`obtener_merceria_web`**: devolver también `unidad_medida`, para que la web muestre «quedan N ovillos» y limite el carrito sin adivinar.
4. Pruebas antes de encender: (a) en SQL, con un bloque que termine en error para deshacer todo, crear un pedido web de prueba y comprobar que el ERP descuenta gramos; (b) un pago real de bajo valor con Wompi de un ovillo; (c) comprobar el pedido en el ERP y el correo de confirmación.
5. Encender: poner `PAGO_EN_LINEA_MERCERIA = true` en `js/pago.js` y actualizar los textos de Cómo comprar, preguntas frecuentes e inicio de la Mercería (volver a mencionar tarjeta, PSE, Nequi y Bancolombia para materiales).

## Otras notas
- `crear-pago-wompi` hoy no consulta `stock_actual`; para la Mercería sí conviene validarlo, porque son existencias reales y limitadas.
- Hoy hay 34 referencias (33 Lanas y 1 «Hilos») y ninguna tiene existencias.
