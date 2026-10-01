# Cuentas de clientes de la web (29-sep-2026)

Los clientes se registran en `cuenta.html` y entran con un **enlace que llega a su correo** (Supabase Auth, sin contraseña).

- `migracion.sql`: tablas `cuentas_clientes_web` y `carritos_web`, funciones `registrar_cuenta_cliente`, `mi_cuenta`, `actualizar_mi_cuenta`, `mis_pedidos`, y permisos de sesión. Ya aplicada en el proyecto Supabase "Lana Rosa ERP + SO".
- Cada cuenta queda en la tabla `terceros` del ERP como cliente (documento `WEB-…`, con la aceptación del tratamiento de datos y su fecha). Si ya existía un cliente con el mismo correo, se vincula a él. **Nunca se vincula por teléfono** (cualquiera podría escribir el teléfono de otra persona).
- El historial sale de `pedidos_canal_venta` y `ventas_pos` (por `tercero_id`) y de `oportunidades_venta` (solicitudes de personalizados). Para que un pedido aparezca en la cuenta del cliente, hay que registrarlo en el ERP a nombre de ese tercero.
- Un cliente registrado no tiene rol en `usuarios_roles`, así que `fn_rol_actual()` devuelve null y ninguna política del ERP le da acceso.
- Carrito guardado: `js/cuenta.js` sincroniza `localStorage.carritoLanaRosa` con `carritos_web` cuando hay sesión.

## Configuración en el panel de Supabase (la hace Sara)
1. Authentication → URL Configuration: Site URL `https://lanarosacrochet.com`; Redirect URLs: `https://lanarosacrochet.com/cuenta.html`.
2. Authentication → Emails → SMTP Settings: **SMTP propio** (Brevo, Resend, etc.). El correo por defecto de Supabase solo envía a los miembros del equipo y con un límite muy bajo por hora; sin SMTP propio los clientes no reciben el enlace.
3. Authentication → Sign In / Providers → Email activado, con "Allow new users to sign up" activado.
4. Opcional: personalizar la plantilla "Magic Link" (asunto y texto en español).

## Correos en español (plantillas)
En Supabase → Authentication → Emails → Templates hay que pegar dos plantillas (una por cada tipo de correo que se envía):
- **Magic link** (clientas que ya tienen cuenta): asunto `Tu enlace para entrar a Lana Rosa Crochet`, contenido = `correos/enlace-de-acceso.html`.
- **Confirm sign up** (clientas nuevas): asunto `Bienvenida a Lana Rosa Crochet: confirma tu cuenta`, contenido = `correos/confirmar-registro.html`.
Las plantillas usan `{{ .ConfirmationURL }}` (no borrarlo).

## Entrar con Google (opcional)
1. Google Cloud Console → APIs y servicios → Credenciales → Crear credenciales → ID de cliente de OAuth (tipo "Aplicación web"). Antes hay que configurar la pantalla de consentimiento (nombre "Lana Rosa Crochet", correo de soporte, dominio `lanarosacrochet.com`).
2. En "URI de redireccionamiento autorizados" pegar la URL de callback que muestra Supabase en Authentication → Sign In / Providers → Google (termina en `/auth/v1/callback`).
3. Copiar el Client ID y el Client Secret en Supabase (Providers → Google) y activar. El secreto solo se pega en Supabase, nunca en el chat.
4. En `cuenta.html`, cambiar `const GOOGLE_ACTIVO = false;` por `true` para mostrar el botón.

## Secciones del panel (parte 2)
`migracion-2-secciones.sql` agrega: `favoritos_web`, `direcciones_web` (máx. 10 por clienta), `mensajes_cuenta`, la columna `user_id` en `resenas_web`, y las funciones `mis_resenas`, `crear_mi_resena`, `marcar_mensajes_leidos`. `mis_pedidos` ahora trae la foto y el estado de pago.
- **Pedidos por estado:** usa `pedidos_canal_venta.estado` (esperando_pago → Por pagar, en_preparacion, listo_despacho → Listos, entregado). Las compras de tienda (`ventas_pos`) salen como "Compra en tienda".
- **Mensajes:** un trigger en `pedidos_canal_venta` crea un aviso cuando el equipo registra un pedido o cambia su estado (solo si la clienta tiene cuenta vinculada).
- **Reseñas:** la clienta solo puede reseñar piezas de pedidos entregados o compras en tienda. Quedan `pendiente` y el equipo las aprueba en el ERP (llega el correo de aviso de siempre). En público se muestra "Nombre A.".
- **Favoritos:** corazón en las tarjetas y la ficha de la tienda (requiere sesión).

## Pagos en línea con Wompi (30-sep-2026)
Piezas: `js/pago.js` (botón "Pagar en línea" del carrito y formulario de envío), `gracias.html` (estado del pedido), funciones de Supabase `crear-pago-wompi` y `wompi-webhook`, tablas `pedidos_web` y `pedidos_web_items`, y `migracion-3-pagos-web.sql` / `migracion-4-pedidos-web-erp.sql`.

**Flujo:** el carrito manda solo ids y cantidades → `crear-pago-wompi` calcula precios y envío con datos del ERP, crea el pedido web y devuelve la URL de Wompi → la clienta paga en Wompi → Wompi avisa a `wompi-webhook` (firma verificada y consulta directa a la API de Wompi) → el pedido pasa a `pagado`, se avisa por correo al equipo y se registra en el ERP.

**En el ERP:** cada producto del pedido web queda como pedido del canal "🛍️ Tienda virtual" (100% pagado, en preparación), con el cliente, la fecha, el medio de pago (wompi_tarjeta, wompi_pse, wompi_nequi, wompi_daviplata… según lo que usó en Wompi) y en las observaciones la referencia LRW-…, el número de transacción, el WhatsApp y la dirección de envío. El dinero entra a la caja de Tienda y se contabiliza como anticipo recibido (2805) contra la cuenta bancaria predeterminada (la que recibe los depósitos de Wompi); los medios wompi_… no se asignan en Bancos, para que no se mezclen con los pagos directos por Nequi o transferencia. Si un pedido no se pudo pasar al ERP, queda el motivo en `pedidos_web.erp_error` y `fn_reintentar_pedidos_web_erp()` lo reintenta.

**Para activarlo (Sara):**
1. Wompi → Desarrolladores: copiar la llave pública, el secreto de integridad y el secreto de eventos (primero las de pruebas, `pub_test_…`).
2. Supabase → Edge Functions → Secrets: `WOMPI_PUBLIC_KEY`, `WOMPI_INTEGRITY_SECRET`, `WOMPI_EVENTS_SECRET`. Las llaves nunca van en el chat ni en el código.
3. Wompi → Desarrolladores → URL de eventos: `https://ngjoognzvehwjtpqwrqe.supabase.co/functions/v1/wompi-webhook`.
4. Probar en privado: abrir `lanarosacrochet.com/tienda.html?pagosprueba=1` (muestra el botón solo en ese navegador; `?pagosprueba=0` lo quita) y pagar con la tarjeta de pruebas de Wompi. Al terminar, cambiar las tres llaves por las de producción (`pub_prod_…`) y poner `PAGOS_ACTIVOS = true` en `js/pago.js` para que lo vea todo el público.
5. ERP → Conciliación bancaria: la cuenta predeterminada debe ser la que recibe los depósitos de Wompi (Bancolombia). Si el Nequi es otra cuenta, crearla y asignarle el medio Nequi.

**Pagos de prueba:** si `WOMPI_PUBLIC_KEY` no empieza por `pub_prod_`, el webhook marca el pedido como `es_prueba` y **no** lo registra en el ERP (no mueve caja, bancos ni inventario). Solo los pagos hechos con llaves de producción pasan al ERP. La función `crear-pago-wompi` se niega a generar pagos si `WOMPI_PUBLIC_KEY` no es una llave pública (`pub_test_` o `pub_prod_`). En el ERP el pedido aparece en Punto de Venta → "Pedidos Web/Redes" (canal 🛍️ Tienda virtual).


## Conexión ERP ↔ CRM para pedidos web (30-sep-2026, fase 1)
El CRM tiene su propia base de datos de Supabase ("Lana Rosa CRM", `wcqdkccvtywiutzknskr`), separada de la del ERP. Un pedido pagado en la web (llaves de producción) ahora también llega al CRM, sin botones:

`wompi-webhook` (ERP) → `enviar-pedido-web-crm` (ERP) → `recibir-pedido-web` (CRM)

- **`enviar-pedido-web-crm`** (proyecto ERP): arma el envío con el pedido web y sus productos, y llama al CRM. Después guarda `referencia_crm_id` en cada pedido del ERP (y `crm_cliente_id` en el tercero), que es la marca que usa el Worker `lana-rosa-os-pos` para no volver a importar ese pedido al tocar "Cargar pedidos nuevos del CRM". Deja `pedidos_web.crm_enviado_at` o el motivo en `pedidos_web.crm_error`. Si falla, el pago y el ERP no se afectan; el siguiente evento de Wompi lo reintenta y no duplica.
- **`recibir-pedido-web`** (proyecto CRM): busca al cliente por correo y luego por teléfono (si no existe lo crea con canal `otro` y "Página web"), y crea un pedido por producto (estado `listo` si había stock, `en proceso` si hay que tejerlo; entrega `envio`, con dirección) y su pago `anticipo` con medio `Wompi`. Cada pedido lleva en las notas un marcador `[ERP:PED-…]` que evita duplicados.
- **Seguridad:** la llamada lleva el secreto `crm_puente_secreto` (guardado en la bóveda del ERP; en el código del CRM solo está su huella SHA-256). Los pedidos de prueba (`es_prueba`) no se envían.
- Verificado con una llamada de prueba (creó cliente, pedido y pago; repetirla no duplicó; una clave equivocada fue rechazada) y luego se borró. **Falta probar el recorrido completo con un pago real de producción.**
- Pendiente (fase 2): arreglar el Worker para que no duplique clientes (busca solo por cédula) y para normalizar los medios de pago ("Nequi" del CRM vs `nequi` del ERP).

## Sincronización de cobros y estados ERP ↔ CRM (fase 2b, 30-sep-2026)
Aplica a los pedidos que ya están vinculados (`pedidos_canal_venta.referencia_crm_id`): los de la web y los traídos del CRM.

- **Cobros, ERP → CRM:** cada cobro que se registra en el ERP (`pedidos_canal_pagos`) avisa al CRM (`recibir-actualizacion-erp`). Se comparan **totales**: si el ERP tiene cobrado más de lo que el CRM tiene en `pagos`, se registra la diferencia (marcador `[ERP-PAGO:…]`). Por eso un pago que ya está en el CRM nunca se duplica.
- **Estados, ERP → CRM:** ERP "listo para despachar" → CRM `listo`; ERP "entregado" → CRM `entregado` (con `fecha_entrega_real`). Solo avanzan, nunca retroceden.
- **Estados, CRM → ERP** (`actualizar-pedido-desde-crm`): CRM `listo`/`enviado`/`entregado` con el pedido "en preparación" → ERP "listo para despachar". CRM `entregado` con el pedido "listo" y **sin saldo pendiente** → ERP "entregado" (reconoce el ingreso, igual que el botón). Si queda saldo por cobrar **no** se entrega: el cobro final se registra en el ERP.
- **Cobros, CRM → ERP: no se automatizan.** El ERP es el sistema del dinero (anticipo y saldo fijos, con caja y asientos); los pagos que se anotan solo en el CRM no mueven la contabilidad solos. El cobro final se hace en el ERP y de ahí pasa al CRM.
- **Mecanismo:** triggers `trg_pago_pedido_a_crm` y `trg_estado_pedido_a_crm` (ERP) y `trg_estado_pedido_a_erp` (CRM) con `pg_net`; los dos sentidos usan secretos distintos (`crm_puente_secreto` en la bóveda del ERP, `erp_puente_secreto` en la del CRM; en las funciones solo hay su huella). Si un aviso falla, el cambio original (cobro, estado) no se ve afectado.
- Verificado con pedidos de prueba en ambas bases (cobros anticipo y saldo, "listo", "entregado" en ambos sentidos, sin duplicar ni entrar en bucle) y luego borrados. En el libro diario queda un asiento de prueba con su reversión (PED-2026-00530), que suma cero.

## Salida a producción de Wompi (30-sep-2026)
`PAGOS_ACTIVOS = true` en `js/pago.js` **no** abre los pagos al público por sí solo: el botón le pregunta al servidor (`crear-pago-wompi` con `{ accion: 'estado' }`) en qué modo están las llaves y se muestra así:
- llaves `pub_prod_…` → lo ve todo el público;
- llaves `pub_test_…` → solo quien abre `?pagosprueba=1` (con la etiqueta PRUEBA);
- sin llaves o llave inválida → nadie.

**Para abrir los pagos:** Wompi debe haber aprobado el comercio para producción. Luego, en Supabase → Edge Functions → Secrets, reemplazar `WOMPI_PUBLIC_KEY` (`pub_prod_…`), `WOMPI_INTEGRITY_SECRET` y `WOMPI_EVENTS_SECRET` por los de producción, y en Wompi (producción) registrar la URL de eventos `https://ngjoognzvehwjtpqwrqe.supabase.co/functions/v1/wompi-webhook`. No hay que publicar nada más en la web.
El envío a "otras ciudades" en el ERP (`tarifas_envio_ciudad`, "Otro (nacional)") quedó en $18.000, igual que en la web y en las políticas.

## Cuenta al comprar (30-sep-2026)
- En el formulario de pago (`js/pago.js`) hay una casilla **marcada por defecto**: "Crear mi cuenta con este correo para ver el estado de mi pedido" (no aparece si ya hay sesión). Al enviar, los datos de la compra quedan solo en el navegador (`lrPrefillCuenta`, con `crear: true/false`).
- En `gracias.html`, cuando Wompi confirma el pago y la casilla estaba marcada, se envía el correo de activación (`signInWithOtp` con `shouldCreateUser: true` y los datos en `user_metadata`; no se reenvía si recarga). Al abrir el enlace, `cuenta.html` completa el registro sola con esos datos (ya aceptó la política de datos en el formulario de pago) y `mis_pedidos` muestra el pedido por coincidencia de correo.
- Si desmarca la casilla, o el envío falla, `gracias.html` muestra la invitación "Crear mi cuenta" (`cuenta.html?prefill=1`, formulario relleno).
- Comprar sin cuenta sigue siendo posible (la casilla se puede desmarcar).
- Tienda: las tarjetas ya no llevan enlace de WhatsApp; en la ficha queda "¿Dudas? Escríbenos por WhatsApp". El carrito conserva "Pedir por WhatsApp" como alternativa, y Personaliza sigue por WhatsApp.

## Descuento de primera compra, aviso de calificar y carrito (30-sep-2026)
- **Descuento 10 % en la primera compra** (solo sobre productos, no sobre el envío). Lo decide el servidor: `crear-pago-wompi` (`PCT_PRIMERA_COMPRA = 10`; 0 la apaga) usa `fn_es_primera_compra_web` (por correo o teléfono, en web, pedidos por WhatsApp/redes y tienda). `{accion:'cotizar'}` devuelve el resumen sin crear nada; `js/pago.js` lo consulta al escribir el correo/teléfono y muestra la fila "🎁 Primera compra". El pedido guarda `descuento_pct` y `descuento`; `enviar-pedido-web-crm` manda al CRM cada producto ya con descuento.
- **Calificar el pedido:** cuando un pedido pasa a entregado, en `cuenta.html` sale un aviso "te falta calificar" y una insignia con el número en el ícono de cuenta (`actualizarInsigniaCuenta` en `js/cuenta.js`, datos de `mis_resenas`). Además se envía un correo de invitación al verificarse el pago, es decir, al salir de "esperando pago" (`fn_correo_calificar`, una vez por pedido, solo con cuenta).
- **Carrito:** `js/carrito-agregado.js` abre la hoja "Producto agregado" con Ir a pagar / Agregar más productos (tienda y mercería).
- **Regla: un solo descuento por pedido.** Hoy el único descuento en el pago en línea es el de primera compra. Si en el futuro hay otros (códigos, promociones), no se suman: el servidor (`crear-pago-wompi`) debe aplicar solo uno —el que elija la clienta o, si no elige, el de mayor valor— y `js/pago.js` mostrar una sola fila de descuento.
- **Quitar pedidos sin pagar:** en Mi cuenta → Pedidos, los pedidos de la web que siguen "Por pagar" (o con pago rechazado/con error) tienen una X para cancelarlos (pregunta antes) (`quitar_pedido_pendiente`: los marca `anulado`). Los pagados no se pueden quitar. Si Wompi aprueba después un pago de un pedido quitado, vuelve a quedar pagado.
- **Recoger en tienda / envío a domicilio:** el formulario de pago deja elegir. A domicilio, el envío se muestra cuando la clienta escribe ciudad y dirección (tarifa por ciudad). Recoger en tienda: envío $0, sin dirección; queda como "Recoger en tienda" (`crear-pago-wompi` con `entrega: recogida`) y en las observaciones del ERP como "RECOGE EN TIENDA". Se le avisa por WhatsApp cuándo y dónde recogerlo.
- **Textos editables desde el ERP:** Configuración empresa → Textos de la web (tabla `web_textos`, leída por `js/textos.js` solo en el inicio): barra de anuncios (6) y ventana del bono de bienvenida. Si falla la lectura, la página muestra los textos del HTML. Para agregar otro texto: fila en `web_textos` + `data-`/selector en `js/textos.js`.
- **Formulario "Continuar compra" en 4 pasos** (Contacto → Direcciones → Envío → Pago), con "Mi carrito" a la derecha (cantidades, eliminar, descuento, envío, total). En el paso Pago hay una lista de métodos (hoy solo Wompi): ahí entrará PayPal. En celular el carrito va arriba, plegado.
- **Envío visible en la cuenta:** el CRM guarda tipo de entrega, empresa (`transportadora`), guía, enlace y fecha de envío del pedido (la fecha se llena sola al pasar a enviado o escribir la guía). Un trigger del CRM (`trg_estado_pedido_a_erp` y `trg_envio_pedido_a_erp`) manda esos datos a `actualizar-pedido-desde-crm`, que los copia al pedido del ERP (columnas nuevas de `pedidos_canal_venta`). `mis_pedidos` los entrega y `cuenta.html` muestra: Listo para despachar, Listo para recoger en tienda, Enviado / En camino a tu domicilio (con empresa, guía, fecha y botón Rastrear pedido) y Entregado. Pestaña nueva "Enviados". Para que aparezca "Enviado", en el CRM hay que llenar la guía o poner el pedido en enviado.
- Menú: "Tienda" y "Personaliza" van en el color más oscuro de la marca (`.g-tienda`).

## PayPal para clientas de otros países (preparado, apagado)
- **Cómo funciona:** si PayPal está activo, el formulario "Continuar compra" muestra un selector de **País** en el paso Direcciones. Colombia sigue igual (Wompi). Otro país: ciudad/estado + dirección libres, envío internacional por zona en US$ y método de pago **PayPal** (pago en dólares). Se muestra el total en pesos y el cobro en dólares (total en pesos ÷ tasa).
- **Función:** `paypal-pagos` (código en `funciones/paypal-pagos.ts`; verify_jwt apagado): `estado` (¿activo?, tasa, zonas y países), `crear` (crea el pedido y la orden de PayPal y devuelve la URL de pago) y `capturar` (la llama `gracias.html` al volver de PayPal; captura, verifica monto y referencia y marca el pedido `pagado`). Luego los triggers registran el pedido en el ERP con el medio `paypal` y `enviar-pedido-web-crm` lo manda al CRM.
- **Se activa solo si** están los 3 secretos (`PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_MODO` = `sandbox`/`live`) **y** en el ERP (Configuración empresa → "PayPal y envío internacional") está marcado "Activar", hay tasa USD→COP y al menos una zona activa con valor > 0. Con `sandbox` solo lo ve quien abre `?pagosprueba=1` y el pedido queda como prueba (no entra al ERP).
- **Tablas:** `paypal_ajustes` (activo, tasa), `envio_zonas_intl` (valor en US$ por zona), `paises_envio` (país → zona); columnas nuevas en `pedidos_web`: `pais`, `moneda`, `total_usd`, `tasa_usd_cop`, `paypal_order_id`, `paypal_capture_id`. Solo administradores las editan.
- **Método de pago:** Colombia paga con Wompi y otros países con PayPal. PayPal no permite pagos entre dos cuentas colombianas, por eso no se ofrece con direcciones en Colombia (se probó y PayPal rechaza la transacción).
- **Pendiente:** la clienta puede aprobar en PayPal y no volver a la web; hoy el pago se confirma al volver. Como mejora, registrar un webhook de PayPal (`PAYMENT.CAPTURE.COMPLETED`). Revisar con Sara el texto de impuestos de importación del paso Pago.
