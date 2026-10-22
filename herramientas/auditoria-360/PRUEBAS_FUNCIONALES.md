# Pruebas funcionales — auditoría 360 (22-oct-2026)

**Cómo se probó.** Chromium (Playwright) contra una copia local del sitio (código de `main` en `947fe96`), con respuestas **simuladas** de Supabase, de la función de pago y de los servicios de Google. **No se hizo ningún cobro, no se tocó ningún dato real y no se llamó a producción.** Ver los límites en `LIMITACIONES_Y_PENDIENTES.md`.

## 1. Resultado global

| Bloque | Comprobaciones | Pasan | Fallan |
|---|---|---|---|
| Pruebas que ya existían (16 scripts; sección 2) | 895 | 895 | 0 (una prueba se rompió a medias: PRU-01) |
| Recorridos nuevos de tienda y pago (a 390 y 1280 px) | 50 | 46 | 4 (la misma falla en dos viewports: ACC-03) |
| Recorridos nuevos de servicio y herramientas | 37 | 36 | 1 (CON-01) |
| **Total** | **982** | **977 (99,5 %)** | **5** |

Además: axe-core y rastreo de 70 rutas a 390 y 1280 px (140 cargas), teclado en 13 páginas y reflujo a 320 px en 60 rutas (resultados en `UX_UI_Y_ACCESIBILIDAD.md` y `INVENTARIO_PAGINAS.csv`). Las 5 comprobaciones que fallan son **hallazgos reales**, no errores de la prueba; las expectativas equivocadas de mis primeras versiones de los scripts se corrigieron antes de contar.

## 2. Pruebas que ya existían (se corrieron todas, sin modificarlas)

| Script | Qué cubre | Resultado |
|---|---|---|
| `probar_menus.py` | Menú por casa en las 52 páginas con menú (de las 58) | 156 correctas |
| `probar_regalar.py` | Recomendador de regalos (inicio y universo de Rosina) | 114 |
| `probar_crear.py` | Asistente «Rosina te ayuda a crear» de Personaliza | 84 |
| `probar_rosina_casas.py` | Hubs de Rosina por casa | 55 |
| `probar_rosina_chat.py` | Chat de Rosina (tarjetas de productos) | 31 |
| `probar_colores.py` | «Busca por color» | 73 |
| `probar_ampliar.py` | Ampliar fotos | 24 |
| `probar_suscripcion.py` | Puerta de cuenta gratis en recursos | 13 |
| `probar_lista_espera.py` | Lista de espera de talleres | 36 |
| `probar_qr.py` | Códigos QR (se leen de verdad con OpenCV) | 41 |
| `probar_historias.py` | Historias y cuidados por pieza | 13 |
| `probar_visor3d.py` | Visor 3D de prueba | 54 |
| `probar_aviso_merceria.py` | «Avísame cuando abra» | 29 |
| `probar_fotos_autorizacion.py` | Casillas y autorizaciones de Personaliza | 36 |
| `aventuras-de-rosina/probar.py` | Cuento de Rosina | 82 |
| `probar_rosina_funcion.mjs` | Función del chat (con una base simulada) | 43 |
| `prueba_consentimiento.py` | Aviso de cookies | 11 correctas y se rompe en el paso 6 (**PRU-01**: busca la casilla de «publicar foto» que se quitó el 22-oct) |

## 3. Recorridos nuevos de tienda y pago (`probar_flujos_tienda.py`, 25 comprobaciones por tamaño de pantalla)

Pasan: el catálogo muestra sus tarjetas; la búsqueda por nombre filtra y, si no hay resultados, lo dice; la ficha se abre y se cierra con Esc; agregar suma al contador; el aviso «Producto agregado» es un diálogo accesible con foco y Esc; el panel del carrito se abre, muestra el producto y el total se duplica al sumar una unidad; «Pedir por WhatsApp» arma el mensaje con producto, cantidad, total y el número 573205072801; el pago abre un asistente de 4 pasos; sin datos o con datos inválidos no avanza y avisa con `role="alert"`; «Recoger en tienda» salta la dirección; sin aceptar la política no se envía; las casillas de política, promociones y recordatorio vienen sin marcar; sin errores de JavaScript propios.

**Fallan (a 390 y a 1280 px):** el foco sale del panel del carrito 7 de 12 veces y Esc no lo cierra (**ACC-03**).

Informativo: «Crear mi cuenta con este correo» viene marcada por defecto (**PRI-01**); tras abrir y cerrar la ficha el foco queda en `<body>`.

## 4. Recorridos nuevos de servicio y herramientas (`probar_flujos_servicio.py`, 37 comprobaciones)

| Recorrido | Resultado |
|---|---|
| `gracias.html` con pedido pagado / rechazado / pendiente / referencia inválida | Correcto: «¡Gracias, Ana!», «No se completó tu pago», «Estamos confirmando tu pago…», «No encontramos ese pedido»; el evento de compra se envía una sola vez; el carrito se vacía; la referencia inválida no consulta la base |
| `baja-recordatorios.html` con token válido / inválido / fallo del servidor | Correcto: confirma, o explica cómo escribir al correo |
| `404.html` y `offline.html` | Correcto: botones y pie; botón «Reintentar» |
| `cuenta.html` | Correcto: correo inválido y falta de aceptación avisan; casillas de datos y novedades sin marcar; no pide contraseña; ofrece Google y enlace al correo |
| `agenda-rosina.html` sin sesión | La puerta y el bloqueo funcionan; **el encabezado promete lo contrario (CON-01)** |
| `recursos-rosina.html` | Correcto: 234 descargas con puerta; sección plegable con `aria-expanded`; la ventana de cuenta es un diálogo accesible y lleva a `/cuenta.html?volver=…`; Esc cierra |
| `glosario-rosina.html` | Buscar «anillo» baja de 30 a 9 términos; una búsqueda sin resultados lo dice |
| `calculadoras-rosina.html#lana` | Muestra 100×100 cm con muestra de 10×10 cm y 5 g: 500 g, con 10 % de margen 550 g (6 ovillos de 100 g), correcto; con peso 0 pide completar los datos (sin NaN) |
| `revista.html` | El filtro «Regalos» baja de 7 a 5 artículos (la portada de la Tienda muestra los 7 de su casa; Mercería 6, Academy 13, de 19 en total), «Todo» vuelve a los 7 y el botón activo cambia `aria-pressed` |
| `preguntas-frecuentes.html` | Enter alterna la pregunta (la primera viene abierta a propósito) y Espacio abre otra |
| `contacto.html` | WhatsApp 573205072801 y correo `contacto@lanarosacrochet.com` (el teléfono es el de WhatsApp: no lleva `tel:`) |

## 5. Prueba local de seguridad (`probar_xss_catalogo.py`)

Con un producto simulado cuyo nombre y fichas traen un `<img onerror>` inofensivo, el HTML **se ejecuta** en las tarjetas y en la ficha de la tienda (**SEG-04**). Ver `SEGURIDAD_INFORMATICA.md`.

## 6. Qué cubre y qué no (por recorrido)

| Recorrido | Cubierto | Falta |
|---|---|---|
| Comprar en la tienda | Búsqueda, ficha, carrito, pago hasta el paso 4, WhatsApp | Pago real, webhook, correo, ERP y CRM (FUN-01) |
| Pago de materiales de la Mercería | Código de la función (existencias por ovillo, mezcla no permitida) | Un ovillo real de punta a punta (sin existencias) |
| Personalizados | Asistente, casillas, autorizaciones de fotos y servidor (con base simulada) | Envío real de fotos y radicado en el ERP |
| Cuenta | Validaciones y casillas | Ingreso con Google y con el enlace al correo (FUN-02) |
| Agenda, recursos, glosario, calculadoras, Revista | Sí | — |
| Cuento de Rosina | Sí (82) | Validación de la experta (pendiente) |
| PWA | Manifiestos, íconos, página sin conexión | Instalación en teléfonos y sin red real (FUN-02) |
| 3D y QR | Visor de prueba y lectura de QR generados | Realidad aumentada y etiquetas impresas (FUN-02) |
