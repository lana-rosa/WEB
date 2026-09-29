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
