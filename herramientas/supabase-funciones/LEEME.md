# Copia del código de Edge Functions sin repositorio propio

Copia hecha el 22-oct-2026 (auditoría 360, DAT-01) desde Supabase («Lana Rosa ERP + SO») de las funciones que no tenían archivo en ningún repositorio. **El código desplegado en Supabase es el que manda**: si se cambia allá, actualizar aquí.

| Archivo | Versión desplegada | Estado |
|---|---|---|
| `enviar-pedido-web-crm.ts` | v23 | Activa: la llaman `wompi-webhook` y `paypal-pagos` para enviar el pedido pagado al CRM |
| `actualizar-pedido-desde-crm.ts` | v21 | Activa: el CRM le avisa los cambios de estado y de envío |
| `copiar-fotos-crm.ts` | v9 | Activa |
| `carrito-baja.ts` | v10 | Activa: baja de recordatorios (`baja-recordatorios.html`) |
| `diag-secretos.ts` | v25 | Deshabilitada (responde 410); se puede eliminar en el panel |
| `probar-envio-crm.ts` | v3 | Inactiva (410); se puede eliminar en el panel |

Las demás funciones están en `herramientas/cuentas-clientes/funciones/`, `herramientas/rosina-web/` y `herramientas/google-merchant/`. No hay secretos aquí: las llaves se leen de las variables del entorno de Supabase (`actualizar-pedido-desde-crm` solo guarda la huella SHA-256 del secreto compartido).
