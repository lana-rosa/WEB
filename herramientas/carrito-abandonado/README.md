# Correos de carrito abandonado (6-oct-2026)

Decisión de Sara: primer correo a las **3 horas**, un **solo recordatorio a las 24 horas**, **sin descuento**.

- **Cómo se guarda:** en el pago, al escribir el correo (y en cada paso siguiente) `js/pago.js` llama a la función `registrar_carrito_abandonado(p_correo, p_nombre, p_items)`. Se guarda en `carritos_abandonados` (un registro por correo; items limpiados y con tope de 20; se ignora si el correo no es válido).
- **Quién recibe:** solo quien escribió su correo en el pago, con el aviso en el paso 1. No se escribe si: ya pagó un pedido real después de dejar el carrito, se dio de baja, o el carrito tiene más de 3 días.
- **Envío:** `fn_enviar_carritos_abandonados()` la ejecuta pg_cron cada 15 minutos (`carritos-abandonados`). Usa Resend con la llave `resend_api_key` de la bóveda, igual que el correo de compra. Tope: 100 correos al día, 20 por corrida.
- **Correo:** `fn_html_carrito_abandonado(correo, 1 | 2)` arma el HTML (productos con foto, cantidad y precio; botón "Terminar mi compra"; WhatsApp; enlace de baja y cabecera List-Unsubscribe).
- **Volver al carrito:** el botón lleva a `tienda.html?retomar=<token>`; `js/pago.js` pide `obtener_carrito_abandonado(token)`, carga los productos en el carrito y lo abre.
- **Baja:** el enlace llama a la función `carrito-baja` (Supabase), que marca `baja_at`.
- **Probar sin enviar a clientas:** filas con `es_prueba = true` nunca se envían. Para ver el HTML: `select fn_html_carrito_abandonado('correo', 1)`.
- **Apagar todo:** `select cron.unschedule('carritos-abandonados');`
