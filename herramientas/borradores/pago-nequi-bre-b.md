# Pago por transferencia Nequi / Bre-B (borrador, NO publicado) — chat 6, 18-nov-2026

> Encargo de Jennifer por el orquestador general (nivel 🔴: pagos y textos de políticas). **No se publica nada hasta que Jennifer confirme en el chat 6:** (1) que hizo una transferencia de prueba y llegó; (2) que 3205072801 está registrada como llave Bre-B en ese Nequi (cuenta solo del negocio); (3) el nombre exacto de la titular tal como le aparece al cliente al pagar (para el texto: evita estafas con números parecidos). Wompi sigue encendido; esto es un medio adicional. Sin cambios de código del cobro ni de precios.

## Lo que ya dice la web hoy
- Pie de todas las páginas: «Pagos: en línea: tarjeta, PSE, Nequi, Bancolombia o Bre-B» (son los medios de **Wompi**, no una transferencia directa; no se mezclan).
- `llms.txt`, contacto, Mercería (cómo comprar y preguntas): «Por WhatsApp: te indicamos cómo pagar y nos envías el comprobante». Es el camino manual que ya existe; aquí se hace explícito con el número.

## Textos propuestos (visibles; 🟡: foto y «¿Lo pongo? Sí o no»)
**Bloque corto «También puedes pagar por Nequi o Bre-B»** (en la ventana de pago de `js/pago.js` y en `gracias.html`, sin cambiar el cobro):
> **También puedes pagar por Nequi o Bre-B.** Transfiere al **320 507 2801**, a nombre de **[NOMBRE EXACTO DE LA TITULAR]**. Antes de confirmar, revisa que el nombre que te aparece sea ese. Luego envíanos el comprobante por WhatsApp (573205072801) con el número de tu pedido. Tu pedido queda pendiente hasta que confirmemos el pago.

**Pregunta para preguntas frecuentes (Tienda y Mercería):**
> **¿Puedo pagar por transferencia (Nequi o Bre-B)?** Sí. Es un pago manual: transfiere al 320 507 2801, a nombre de [NOMBRE EXACTO DE LA TITULAR] (revisa que el nombre coincida antes de confirmar), y envíanos el comprobante por WhatsApp con tu número de pedido. El pedido queda pendiente hasta que confirmemos el pago. Para estos pagos, el plazo de entrega cuenta desde que confirmamos el pago. También puedes pagar en línea con Wompi.

**Plazos:** la regla de `CLAUDE.md` no cambia. Solo se aclara que en pagos por transferencia el plazo (siguiente día hábil si hay inventario; 8 días hábiles de elaboración si es bajo pedido o personalizado) cuenta **desde que se confirma el pago**.

## Dónde se pondría (después del sí de Jennifer)
`js/pago.js` (bloque en la ventana de pago), `gracias.html`, `preguntas-frecuentes.html`, `merceria/preguntas-frecuentes/`, `merceria/como-comprar/`, `contacto.html`, `llms.txt` y los datos estructurados si hay número; **un solo número, el mismo en todos lados**: 320 507 2801 (573205072801).

## Texto legal (🔴) — borrador para la abogada, no se publica sin su aprobación escrita
Política de uso del sitio, apartado 4 «Medios de pago» (`politicas.html#uso`). Hoy dice que el sitio puede ofrecer diferentes medios y que Lana Rosa no pide contraseñas ni códigos. **Adición propuesta:**
> Además de los medios habilitados en la tienda en línea, Lana Rosa Crochet recibe pagos por transferencia a través de Nequi o Bre-B al número 320 507 2801, a nombre de [NOMBRE EXACTO DE LA TITULAR]. Estos pagos se confirman manualmente: el cliente envía el comprobante por WhatsApp con el número de su pedido y el pedido queda pendiente hasta que se confirme el pago. En esos casos, el plazo de entrega se cuenta desde la confirmación del pago. Lana Rosa Crochet no solicitará contraseñas, códigos de seguridad ni información confidencial de cuentas bancarias.

Preguntas para la abogada: (a) ¿basta esta adición al apartado 4, o hace falta decir algo en la política de envíos (apartado de tiempos de preparación)? (b) ¿debe indicarse que los datos del comprobante (nombre, número) se tratan según la política de datos? (c) ¿se recomienda un aviso de «revisa que el nombre coincida» como medida contra fraudes?

## Respuesta del ERP (chat 2, Pedidos y anticipos, 18-nov-2026)
- **No hace falta un estado nuevo:** la web ya tiene `pedidos_web.estado = 'pendiente_pago'` y el pedido no pasa al ERP hasta que esté 'pagado'. En el ERP el equivalente es `esperando_pago`.
- **Cómo registra la administradora el pago:** en el ERP, Punto de venta → Pedidos Web/Redes → «Cobrar anticipo», eligiendo el medio (Transferencia). **No se debe marcar el pedido web como 'pagado' a mano**: se registraría como pago de Wompi, con su comisión, y sería incorrecto.
- **Sin código nuevo:** se puede crear el pedido por el formulario de pedidos de redes, desmarcar «Cobrar el anticipo ahora» y cobrarlo cuando llegue el comprobante. Límites: el pedido del ERP no queda enlazado a la referencia del pedido web, y el selector no trae «Nequi» ni «Bre-B» por separado.
- **Texto sugerido por el ERP para la web:** «Paga por Nequi o Bre-B al 320 507 2801 y envíanos el comprobante por WhatsApp; confirmamos tu pago y empezamos tu pedido».
- **Solo con código (si Jennifer lo aprueba):** agregar «Nequi» y «Bre-B» al selector de medios y un botón «Confirmar pago manual» para pedidos web pendientes.

## Cosas que no decide la web
El estado del pedido y dónde se guardan los pagos por transferencia lo define el ERP (arriba). La web solo dice «queda pendiente hasta que confirmemos el pago».
