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
