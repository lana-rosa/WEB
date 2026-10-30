# Etapa 2 — Guía para revisar con Sara en el panel de Supabase (30-oct-2026)

Esto no se puede ver desde las herramientas de Claude; se hace en https://supabase.com/dashboard (proyecto «Lana Rosa ERP + SO»), con Sara delante y sin cambiar nada hasta decidir.

## A. Códigos de acceso (hallazgo A6)
Authentication → **Sign In / Providers → Email**:
- «Email OTP Expiration»: ideal 600–900 segundos (10–15 min). El máximo permitido es 86400; el valor por defecto es 3600 (1 hora).
- «Email OTP Length»: 6 dígitos o más.
Authentication → **Rate Limits**: revisar «Rate limit for sending emails», «Rate limit for sign-ups and sign-ins» y «Rate limit for token verifications» (por defecto 30 cada 5 minutos por dirección IP). Un valor bajo en verificaciones protege contra adivinar códigos.
Authentication → **Attack Protection**: activar CAPTCHA (hCaptcha o Turnstile, gratis) si hay abuso; no es obligatorio hoy.
Anotar los valores encontrados aquí y decidir juntas si se cambian.

## B. Restauración de copias de seguridad (hallazgo A7)
Database → **Backups**: ver si el plan incluye copias diarias (planes de pago) o solo Point-in-Time. Si hay copias: crear un proyecto nuevo de prueba, restaurar una copia reciente allí (nunca sobre producción), confirmar que las tablas `agenda_nube`, `membresias_agenda` y `cuentas_clientes_web` tienen datos y anotar cuánto tardó. Si el plan no incluye copias, la copia que existe es la de `lana-rosa/lanarosa-copias` (exportación programada): probar restaurarla en el proyecto de prueba.

## C. Eliminación de cuenta y datos
Hoy se solicita por correo (cuenta.html). Para una solicitud: `select agenda_nube_borrar_admin('correo')` desde el editor de SQL (borra la copia en la nube) y borrar el usuario en Authentication → Users. Documentar cada solicitud (fecha y correo) para tener constancia.
