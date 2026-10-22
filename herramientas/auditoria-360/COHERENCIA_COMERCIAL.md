# Matriz de coherencia comercial — auditoría 360 (22-oct-2026)

Se comparó cada dato comercial entre las 60 páginas, `llms.txt`, los datos estructurados (JSON-LD), el código de las funciones de pago y las pruebas. La **fuente de verdad** de cada dato es la que manda en el sistema (la base del ERP o el código del servidor); las páginas solo la repiten. Hoy no se pudo releer la base (SQL caído): los valores de la base se tomaron de la auditoría del 17-oct y del código.

Estados: **Coherente** · **Coherente con matiz** (no se contradice, pero hay un texto incompleto) · **Contradicción** · **No verificable hoy**.

| # | Dato | Fuente de verdad | Dónde aparece | Estado | Nota |
|---|---|---|---|---|---|
| 1 | Precio base de los amigurumis personalizados: 13 cm $85.000, 15 cm $95.000, 20 cm $115.000 | Productos «Amigurumi personalizado N cm» del ERP, leídos por `crear-pago-wompi` | Personaliza, Precios, `llms.txt` (4 archivos) | Coherente | El de 10 cm ($70.000) no se paga en línea: se cotiza |
| 2 | «Desde»: amigurumis $70.000, peluches $35.000, llaveros $12.000; rango de $70.000 a $200.000 | Decisión de precios de Sara | Inicio, Personaliza, `llms.txt`, Revista (amigurumi de tu mascota) y JSON-LD | Coherente | Los tamaños de Personaliza (10, 13, 15, 20 cm) explican el «desde $70.000» |
| 3 | Presupuestos del recomendador de regalos (hasta $20.000 … más de $200.000) | `js/universo/config.js` | Inicio y universo de Rosina | Coherente | `probar_regalar.py` comprueba que coinciden |
| 4 | Tiempo de entrega: disponible = despacho el siguiente día hábil; bajo pedido y personalizado = 8 días hábiles de elaboración y despacho el siguiente día hábil; luego la transportadora | Decisión de Sara del 17-oct | 7 archivos con «8 días hábiles» y 13 con «siguiente día hábil» (políticas, tienda, preguntas, Personaliza, Precios, Mercería, Revista, `llms.txt`) | Coherente | 0 menciones de «15 días», «1 semana» o «2 semanas» |
| 5 | Envío a domicilio: Villamaría $8.000, Manizales $13.000, resto de Colombia $18.000; recoger en tienda, gratis | Tabla `tarifas_envio_ciudad` (verificada el 17-oct) | 12 archivos | Coherente | La Mercería cobra el envío al recibir (contraentrega) con los mismos valores estimados |
| 6 | Medios de pago en línea: tarjeta, PSE, Nequi, Bancolombia y Bre-B con Wompi, sin crear cuenta | Wompi | Pie de 55 páginas, tienda, contacto, `llms.txt` | Coherente | |
| 7 | Cómo se paga un personalizado | Personaliza (13, 15 y 20 cm: en línea con Wompi; el resto, cotización y WhatsApp) | Personaliza y Precios dicen lo anterior; preguntas frecuentes y `llms.txt` dicen «por WhatsApp» | **Contradicción menor (CON-02)** | Falta decir en la FAQ y en `llms.txt` que los tres tamaños base también se pagan en línea |
| 8 | Descuento de primera compra del 10 % | `crear-pago-wompi.ts` (excluye patrones, membresía y personalizados) | Mercería (preguntas y cómo comprar), políticas, `llms.txt` | **Coherente con matiz (CON-03)** | La política omite que tampoco aplica a personalizados; solo `llms.txt` lo dice |
| 9 | Retracto: 5 días hábiles en el catálogo; sin retracto en personalizados | Decisión de Sara del 17-oct | Políticas y Mercería (cambios y devoluciones) | Coherente | Pendiente de confirmar con la abogada |
| 10 | Fotos de referencia: se conservan 90 días y se borran solas | Función `depurar-fotos-referencia` y casilla de Personaliza | Personaliza y políticas (apartado 4) | Coherente | El borrado automático se podrá comprobar el 23-dic |
| 11 | Dirección, teléfono, correo y horario | Perfil del negocio | 54 a 56 archivos y JSON-LD de la tienda física (lunes a viernes 7:30-18:15, sábado 8:00-12:00) | Coherente | |
| 12 | Apertura de la tienda física | Calendario de Sara | «apertura: 15 de noviembre de 2026» (8 archivos), «domingo 15 de noviembre» (5), «lunes 16 de noviembre» (1) | Coherente | El horario del JSON-LD ya está publicado antes de abrir |
| 13 | Talleres: «Desconecta para Conectar» $50.000, 3 horas, kit y refrigerio incluidos; clases particulares $25.000 la hora por persona, mínimo 1 hora, materiales no incluidos | Academy | Academy (3 páginas), Aprende, Precios, `llms.txt` y JSON-LD | Coherente | «Próxima fecha: por confirmar» en todas |
| 14 | Membresía de la Agenda: $7.000 al mes o $57.000 al año; **no está a la venta** desde el 12-oct | `MEMBRESIA_EN_VENTA = false` en `crear-pago-wompi` | Solo en las políticas, con un aviso «por ahora no está a la venta» | Coherente | El servidor rechaza la compra aunque alguien la intente |
| 15 | La agenda completa es gratis con cuenta | Decisión de Sara del 12-oct | Agenda, recursos, políticas | **Contradicción (CON-01)** | El encabezado de la agenda promete «llena tus hojas aquí mismo» sin decir que requiere cuenta |
| 16 | Disponibilidad «Disponible» o «Bajo pedido» | `obtener_tienda_web()` (marca manual y existencias > 0, migración 26) | Tienda, universo de Rosina, ficha | Coherente en la tienda | El **feed de Google** siempre envía `in_stock` (CON-04) |
| 17 | PayPal | `PAYPAL_ACTIVO = false` | Ninguna página lo ofrece; `llms.txt` dice que no se envía fuera de Colombia sin confirmar | Coherente | La función sigue desplegada (SEG-09) |
| 18 | Valores de la marca (sin Navidad, santos, San Valentín ni Halloween) | Decisión de Sara | 60 páginas y 110 archivos de texto | Coherente | 0 coincidencias |
| 19 | Nombres de producto sin medidas en cm (salvo los tres personalizados) | Decisión de Sara del 17-oct | Tienda, recomendador, chat | Coherente | `probar_regalar` y `probar_rosina_chat` lo comprueban |
| 20 | Valores guardados en la base (tarifas, precios, existencias) frente a lo publicado | ERP | — | **No verificable hoy** | Se comprobaron el 17-oct; repetir cuando vuelva el SQL |

## Resumen

- 20 datos comparados: **15 coherentes, 2 coherentes con matiz, 2 contradicciones menores (CON-01, CON-02) y 1 no verificable hoy** (el contraste directo con la base).
- Ninguna contradicción afecta precios, plazos ni medios de pago de lo que se cobra: el servidor es quien decide el valor, y los textos lo repiten bien.
- Correcciones propuestas: `CON-01`, `CON-02`, `CON-03` (solo texto) y `CON-04` (feed de Google, depende de Sara y de Merchant Center). Ver `REGISTRO_HALLAZGOS.csv`.
