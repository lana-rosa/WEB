# Inventario de proveedores que reciben datos de clientas (borrador para la abogada)

> **Fecha:** 11-nov-2026 · **Hecho por:** chat 5 (base de datos y pagos), parte de E28 · **Responsable del tratamiento:** Sara Loaiza Muñoz (persona natural, NIT 1.055.359.694-4), nombre comercial Lana Rosa Crochet.
> **Cómo leerlo:** «✅ verificado» = lo comprobé en el sistema o en el código el 11-nov-2026. «📄 declarado» = viene de nuestros borradores o del código, sin confirmar en el contrato o la página oficial del proveedor. «❓» = por confirmar con el proveedor o su contrato. **No se afirma ningún país ni contrato que no esté verificado.**
> Los textos legales de `politicas.html` los lleva el chat 6; este documento es el insumo técnico que ese chat pidió para su apartado 9 y para el punto 7 (supresión y copias).

## Tabla
| Proveedor | Para qué lo usamos | Datos de clientas que recibe | País donde se procesan | Rol (responsable / encargado) | Subencargados | Contrato / términos | Estado |
|---|---|---|---|---|---|---|---|
| **Supabase** | Base de datos, cuentas, pedidos, fotos de Personaliza, funciones del servidor, copias en la nube de la agenda | Nombre, correo, teléfono, direcciones, carrito, pedidos, reseñas, favoritos, mensajes, fotos de referencia (90 días), guías de envío (privadas, 90 días), copia de la agenda si la clienta la autoriza | **Brasil, São Paulo** (región `sa-east-1` del proyecto «Lana Rosa ERP + SO») | Encargado (por cuenta de Lana Rosa) ❓ | ❓ | Plan gratuito; términos y DPA ❓ | ✅ región · ❓ contrato |
| **Wompi** (Bancolombia) | Cobro en línea | Nombre, correo, teléfono, monto y referencia; **los datos de la tarjeta se escriben solo en Wompi, Lana Rosa no los guarda** | 📄 Colombia ❓ | Responsable propio del medio de pago y encargado del cobro ❓ | ❓ | Términos de comercio de Wompi ❓ | ✅ qué recibe (verificado con la compra de prueba del 11-nov) · ❓ país y contrato |
| **PayPal** | Código dormido (apagado desde el 5-oct) | Nada hoy | — | — | — | — | Apagado: no recibe datos |
| **Resend** | Envío de correos desde contacto@ (recibo de compra, códigos de acceso a la cuenta, carrito abandonado, invitación a reseñar) | Correo, nombre, contenido del recibo (productos, total, dirección) | ❓ | Encargado ❓ | ❓ | Términos y DPA ❓ | ✅ lo usa el código (`resend_api_key` en la bóveda de Supabase) · ❓ país y contrato |
| **Zoho Mail** | Buzón de contacto@lanarosacrochet.com (recibe el aviso «Pedido pagado en la web» y las respuestas de clientas) | Lo que llega al buzón: nombre, WhatsApp, correo, dirección, productos del pedido | ❓ | Encargado ❓ | ❓ | ❓ | ✅ verificado con el aviso real del 11-nov (captura de Jennifer) · ❓ país y contrato |
| **Google** (inicio de sesión, Calendar, Drive, Tag Manager, Analytics, Merchant Center, YouTube) | Entrar con Google; la agenda en el Calendar y el Drive **de la clienta y solo si lo conecta**; medición con consentimiento; fichas de Google Shopping; videos | Correo y nombre (inicio de sesión); datos que la clienta conecta; visitas y eventos de la web solo si acepta cookies | 📄 EE. UU. y otros ❓ | Responsable propio en el inicio de sesión; encargado en Calendar/Drive ❓ | ❓ | Términos de Google ❓ | 📄 · ❓ |
| **Cloudflare** | DNS, red y seguridad del sitio; medición agregada de visitas (Web Analytics, sin cookies) | Dirección IP y datos técnicos de cada visita | 📄 EE. UU. y red global ❓ | Encargado ❓ | ❓ | Términos de Cloudflare ❓ | ✅ en uso (verificado en el panel el 3-nov) · ❓ contrato |
| **GitHub** (GitHub Pages y Actions) | Alojar el sitio; copia diaria **cifrada** de la base, guardada 90 días | El sitio es público; las copias contienen la base (cifrada con clave de Jennifer) | 📄 EE. UU. ❓ | Encargado ❓ | ❓ | Términos de GitHub ❓ | ✅ en uso · ❓ región, contrato y subencargados (la abogada lo pidió, punto 7) |
| **Anthropic** | Respuestas del chat de Rosina | **Lo que la clienta escribe en el chat**; se pide no escribir datos personales | 📄 EE. UU. ❓ | Encargado ❓ | ❓ | Términos comerciales de Anthropic ❓ | ✅ en uso · ❓ país y contrato |
| **WhatsApp (Meta)** | Pedidos y atención por el 320 507 2801 | Mensajes y número de quien escribe | 📄 EE. UU. ❓ | Responsable propio de la plataforma | ❓ | Términos de WhatsApp Business ❓ | 📄 |
| **Transportadoras** (hoy: manual; plataforma por decidir tras la apertura) | Entrega de pedidos | Nombre, teléfono, dirección, contenido del paquete | Colombia | Responsable propio / encargado ❓ | ❓ | ❓ | Ver `herramientas/envios/COMPARACION-PLATAFORMAS.md` |
| **ElevenLabs** | Voz de Rosina en la aventura infantil (no publicada) | **Ningún dato de clientas** (solo textos del cuento) | ❓ | — | — | — | Sin datos personales |

## Lo que ya se resolvió con este inventario
- La fila **«Correo: [proveedor por confirmar]»** de `BORRADORES-FASE-1.md` queda así: **Resend** envía los correos y **Zoho Mail** es el buzón de contacto@.
- **Supabase está en Brasil (São Paulo):** es una transmisión fuera de Colombia (la abogada preguntó por el mecanismo para Brasil).

## Lo que falta confirmar (pregunta para la abogada y para cada proveedor)
1. País y contrato (o términos de procesamiento) de **Resend, Zoho, Cloudflare, GitHub, Anthropic y Google**.
2. Si cada uno actúa como **encargado** y quiénes son sus **subencargados**.
3. **GitHub**: región, contrato y subencargados (punto 7 de la abogada).
4. Plazo de conservación de cada categoría y procedimiento de **supresión** (incluye reaplicar supresiones si se restaura una copia vieja).
5. Si hace falta **registrar bases de datos** (RNBD) y autorización para la transferencia internacional.

**Nota:** este inventario no cambia nada en la web ni en la base de datos. Cuando la abogada responda, el chat 6 actualiza `politicas.html` y yo ajusto lo técnico (por ejemplo, subir versiones de las autorizaciones).
