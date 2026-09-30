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

**Pagos de prueba:** si `WOMPI_PUBLIC_KEY` no empieza por `pub_prod_`, el webhook marca el pedido como `es_prueba` y **no** lo registra en el ERP (no mueve caja, bancos ni inventario). Solo los pagos hechos con llaves de producción pasan al ERP. La función `crear-pago-wompi` se niega a generar pagos si `WOMPI_PUBLIC_KEY` no es una llave pública (`pub_test_` o `pub_prod_`). En el ERP el pedido aparece en Punto de Venta → "Pedidos WhatsApp/Redes" (canal 🛍️ Tienda virtual).
