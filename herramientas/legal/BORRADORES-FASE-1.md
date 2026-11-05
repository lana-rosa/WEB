# Fase 1 — los 13 puntos contra lo que la web hace hoy (5-nov-2026)

> Pedido de la abogada: contrastar cada punto con el funcionamiento real antes de aprobar textos. Esta tabla es el primer paso del encargo E27. **No es asesoría jurídica.** Lo técnico que no se puede comprobar desde el chat 6 (proveedores, países, qué datos salen) lo aporta el chat 5. Respuesta completa: `RESPUESTA-ABOGADA-2026-11.md`.

| # | Lo que dice la política hoy | Lo que la web hace hoy | Falta / texto por proponer |
|---|---|---|---|
| 1 Retracto | Apartados 1, 2, 5 y 6 de `#cambios` (5 días hábiles, devolución «plazo máximo legal») | Catálogo en línea con Wompi; personalizados con foto de aprobación; tienda física desde el 13-dic | **Hecho en borrador:** texto de la abogada, 15 días calendario, 7 días solo recomendación, solo compras por internet, retracto ≠ garantía. Preguntas frecuentes y Personaliza no hablan de retracto: nada que unificar. Mercería: apartado 4 de cambios aclara «por internet» |
| 2 Titular y Mercería | «Lana Rosa Crochet» en datos; Mercería nombra a Sara Loaiza Muñoz | Recibo y comprobantes dicen «Lana Rosa Crochet» | Unificar con el texto de identificación única en datos, cambios, membresía, proceso de compra y recibos; texto del pago del envío; conservar prueba de aceptación de los términos (hoy hay casilla en `js/pago.js` pero **no se guarda la versión aceptada**: revisar con chat 5) |
| 3 Datos | Lista corta de datos y finalidades; terceros en general | Cuentas, direcciones, favoritos, reseñas, bono, recordatorio de carrito, correos de compra, Rosina | Reescribir finalidades y terceros por categoría; inventario de proveedores y países (chat 5, E28); reseñas solo nombre de pila (hoy **por verificar** qué se muestra); separar bono de publicidad (hoy una sola casilla) |
| 4 Membresía | Condiciones del 29-oct; dos casillas | Prueba gratis 7 días; dos casillas con versión, fecha y hora en `pedidos_web`; copia en la nube gratuita | Texto de inicio inmediato de la abogada; separar copia gratuita de la membresía; unificar apartados 1, 3, 4 y 5; la membresía está encendida sin pago real probado |
| 5 Patrones | Apartado 8 de `#membresia` | No hay patrones publicados; casilla del pago no es propia | No publicar patrones hasta tener condiciones y casilla propia (fase 2, chat 5) |
| 6 Fotos y guías | Apartado 4 de `#datos`: almacenamiento privado, 90 días | Bucket `solicitudes-personalizadas` privado (verificado 3-nov); `guias-envio` **público** | Guías privadas con enlaces firmados (E28, chat 5); declaración sobre terceros y menores en Personaliza; autorización escrita de las 3 fotos de la galería |
| 7 Copias | Apartado 8 de `#datos` | Copia diaria cifrada en GitHub, 90 días; prueba de restauración mensual | Registro de solicitudes de supresión (hoy no existe); informar plazos |
| 8 Calendar y Drive | Apartados 10 y 12 de `#datos` | Se conecta con un botón, sin ventana previa | Ventana informativa antes de conectar (E30, chat 1); texto del acceso del equipo |
| 9 Voz y lápiz | Párrafo en apartado 11 | «Dictar» activa el micrófono sin aviso previo | Aviso antes de activar el micrófono (E31, chat 2) |
| 10 Chat de Rosina | `#ia-chat`: «proveedor de IA» | Aviso bajo el chat sin nombrar a Anthropic; casilla de cuenta sin marcar | Nombrar a Anthropic; regla de peluches/bebés (E29, chat 5/3) |
| 11 Cloudflare | `#cookies` lo declara | Script de medición se carga en todas las páginas | Verificar con solicitudes de red que no hay cookies ni datos personales (fase 2) |
| 12 Google Fonts | `#cookies` apartado 3 aún lo menciona | No se piden fuentes a Google | Aprobado por la abogada: quitar «Google Fonts» y actualizar la fecha (el chat 7 lo tiene en el PR #534) |
| 13 Generales | RNBD, menores, conservación, consultas: dichos de forma general | Plazos de consulta/reclamo no detallados en la política | Textos por categoría de conservación, consultas 10/15 días hábiles, seguridad y cookies por tipo; aviso de realidad aumentada y personajes (chat 7) |

## Fuentes que la abogada pide entregar junto al documento
Ley 2439 de 2024 (15 días calendario); orientaciones de la SIC de 2026 (países con nivel adecuado, transmisiones y transferencias); SIC sobre el RNBD; Ley 1480 de 2011, Ley 1581 de 2012, Decreto 1074 de 2015, Ley 527 de 1999, Ley 23 de 1982, Decisión Andina 351 de 1993 y 486 de 2000, Ley 962 de 2005 (art. 28).
