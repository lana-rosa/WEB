# UX/UI y accesibilidad — auditoría 360 (22-oct-2026)

**Método.** 70 rutas (las 58 direcciones + 12 variantes) a 390 y 1280 px con Chromium; axe-core 4.14 (reglas WCAG 2.0/2.1/2.2 A y AA y buenas prácticas); recorrido con teclado de 13 páginas clave; reflujo a 320 px en 60 rutas; medición de tamaño de objetivos; recorridos con datos simulados de tienda, carrito, pago, cuenta, agenda, recursos, glosario, calculadora, Revista, preguntas frecuentes, gracias, baja, 404 y sin conexión; y las 884 comprobaciones de las pruebas que ya existían. Observación visual directa de las capturas de inicio, 404, catálogo de la Mercería y Personaliza a 390 px (las capturas de las 70 rutas están generadas, pero no revisé todas a ojo). **No se probó con lector de pantalla real** (ACC-09).

## 1. Resultados automáticos

| Medición | Resultado |
|---|---|
| Desplazamiento horizontal a 390 y 1280 px | 0 de 70 rutas |
| Reflujo a 320 px (WCAG 1.4.10) | 60 de 60 rutas medidas sin desplazamiento horizontal |
| Errores de JavaScript propios | 0 de 70 rutas |
| Imágenes sin `alt` / campos sin etiqueta / botones sin nombre | 0 / 0 / 0 |
| Idioma declarado | 70 de 70 (`es-CO`; la aventura usa `es`) |
| `<title>` | 70 de 70 |
| axe-core en las 58 direcciones a 390 px | 4 sin violaciones; 47 solo con la regla de nombre accesible del carrito (ACC-04); 7 con otras violaciones (ver tabla) |

| Regla de axe | Rutas | Gravedad (axe) | Detalle | Hallazgo |
|---|---|---|---|---|
| `color-contrast` | 404, baja-recordatorios, /academy/empieza-aqui/, /p/ (y su variante) | seria | Pie de 404 y baja: 1,66:1 y 4,16:1; números de «Empieza aquí» 1,78:1; botón verde de /p/ 3,09:1 | ACC-01, ACC-05 |
| `link-in-text-block` | 404, baja, /p/ (variante) | seria | Enlace del pie distinguible solo por color (1,27:1) | ACC-01 |
| `label-content-name-mismatch` | 60 de 70 | seria | `#boton-carrito`: nombre «Ver carrito de compras» y texto visible «0» | ACC-04 |
| `landmark-unique` | hubs de Rosina de Mercería y Academy | moderada | Dos `<nav class="recorridos">` sin etiqueta distinta | ACC-06 |
| `heading-order` | calculadoras-rosina | moderada | `#co-titulo` y el resultado de la calculadora | ACC-06 |
| `landmark-one-main` y `aria-allowed-role` | baja-recordatorios | moderada y leve | `<main role="status">` anula la región principal | ACC-06 |

## 2. Teclado y foco (13 páginas, 30 tabulaciones cada una)

| Comprobación | Resultado |
|---|---|
| Elementos invisibles que reciben el foco | 0 |
| Íconos de redes del pie sin indicador de foco | 4 de 13 páginas (las demás no llegan al pie en 30 tabulaciones) → ACC-02 |
| Enlace «Saltar al contenido» | Solo en la aventura de Rosina; 12 de 13 sin él. Hay 10-12 tabulaciones antes del contenido en escritorio y 5 en celular; todas tienen `<main>` → ACC-08 |
| Aviso «Producto agregado» | Diálogo correcto: `role="dialog"`, `aria-modal`, foco dentro, Esc cierra |
| Panel del carrito | **El foco sale del panel 7 de 12 veces y Esc no lo cierra** (390 y 1280 px) → ACC-03 |
| Ficha del producto | Esc la cierra; tras abrirla y cerrarla el foco queda en `<body>` (informativo) |
| Preguntas frecuentes | Enter y Espacio abren y cierran (la primera viene abierta a propósito) |
| Ventana «Descarga gratis con tu cuenta» (recursos) | Diálogo accesible, Esc cierra, lleva a `/cuenta.html?volver=…` |

## 3. Tamaño de los objetivos táctiles (WCAG 2.2, 2.5.8)

317 elementos de menos de 24 px en 62 de 70 rutas (heurística; no evalúa la excepción de espaciado). Los más repetidos: enlaces del pie «Políticas», «Datos personales», «Cookies» y «Configurar cookies» (20-21 px de alto), casillas nativas de 18-20 px, tres botones de la agenda de 20 px de alto («Guardar una copia», «Cargar una copia», «Fechas al calendario») y el teléfono de la página de contacto (21 px). → ACC-07.

## 4. Cumplimiento WCAG 2.2 AA (criterios revisados)

Estados: **Cumple** (con medición), **Parcial**, **No cumple**, **No probado**.

| Criterio | Estado | Nota |
|---|---|---|
| 1.1.1 Contenido no textual | Cumple (automático) | 0 imágenes sin `alt`; la calidad de las descripciones no se evaluó |
| 1.3.1 Información y relaciones | Parcial | Baja sin región principal; navegaciones sin nombre (ACC-06) |
| 1.4.3 Contraste mínimo | No cumple en 4 páginas | ACC-01, ACC-05 |
| 1.4.4 Cambiar tamaño del texto / 1.4.12 Espaciado / 1.4.13 Contenido al pasar el cursor | No probado | |
| 1.4.10 Reflujo | Cumple | 320 px en 60 rutas |
| 1.4.11 Contraste de elementos no textuales | No probado | |
| 2.1.1 Teclado | Parcial | Todo se alcanza con Tab en las 13 páginas; el carrito no cierra con Esc |
| 2.4.1 Saltar bloques | Cumple por regiones | Sin enlace de salto (ACC-08) |
| 2.4.2 Título de página | Cumple | 70 de 70 |
| 2.4.3 Orden del foco | No cumple en el carrito | ACC-03 |
| 2.4.6 Encabezados y etiquetas | Parcial | Saltos de nivel en agenda y calculadoras (ACC-06) |
| 2.4.7 Foco visible | No cumple en íconos del pie | ACC-02 |
| 2.4.11 Foco no oculto (2.2) | No probado | El aviso de cookies y el encabezado fijo podrían taparlo |
| 2.5.3 Etiqueta en el nombre | No cumple | ACC-04 |
| 2.5.8 Tamaño mínimo del objetivo (2.2) | Parcial (heurística) | ACC-07 |
| 3.1.1 Idioma de la página | Cumple | 70 de 70 |
| 3.2.3 Navegación coherente | Cumple (probado) | `probar_menus.py`: 156 comprobaciones del menú por casa |
| 3.3.1 / 3.3.2 Identificación de errores / etiquetas | Cumple (probado) | Pago, cuenta y baja muestran mensajes claros con `role="alert"`; 0 campos sin etiqueta |
| 3.3.8 Autenticación accesible (2.2) | Cumple (por diseño) | Sin contraseñas: enlace al correo o Google |
| 4.1.2 Nombre, función, valor | Parcial | `<main role="status">` en baja (ACC-06) |
| 4.1.3 Mensajes de estado | Cumple en lo probado | Pago y cuenta |

## 5. UX por recorrido (datos simulados; sin cobros)

| Recorrido | Resultado | Observaciones |
|---|---|---|
| Buscar, abrir ficha y agregar | Correcto a 390 y 1280 px | Búsqueda sin resultados explica qué hacer; aviso «Producto agregado» con botones Una menos, Una más y Continuar |
| Carrito y WhatsApp | Correcto salvo teclado (ACC-03) | El mensaje de WhatsApp lleva producto, cantidad, total y el número 573205072801 |
| Pago de 4 pasos | Correcto | Sin datos o con datos inválidos no avanza y avisa; «Recoger en tienda» salta la dirección; sin aceptar la política no se envía; casillas de política, promociones y recordatorio vienen **sin marcar**; **«Crear mi cuenta» viene marcada** (PRI-01) |
| Gracias (pagado, rechazado, pendiente, inválida) | Correcto | Compra se informa a Analytics una sola vez; el carrito se vacía; referencia inválida no consulta la base |
| Baja de recordatorios (válido, inválido, fallo) | Correcto | Explica que se puede escribir al correo |
| Cuenta | Correcto | Correo inválido y falta de aceptación avisan; las dos casillas vienen sin marcar; sin contraseña |
| Agenda como visitante | **Contradicción de texto** (CON-01) | La puerta bloquea las hojas; el encabezado promete llenarlas |
| Recursos (234 descargas) | Correcto | Todas pasan por la puerta de cuenta gratis; la sección «Ver los stickers» es un botón plegable con `aria-expanded` |
| Glosario, calculadora de lana, Revista, preguntas frecuentes, contacto | Correcto | La calculadora suma 10 % de margen (500 g → 550 g → 6 ovillos) y con peso 0 pide completar datos; la Revista filtra por casa y categoría y marca el botón activo |
| 404 y sin conexión | Correcto | 404 con dos botones; sin conexión con botón «Reintentar»; el pie del 404 tiene problemas de contraste (ACC-01) |

## 6. Observaciones visuales (capturas a 390 px)

- **Botones flotantes (Rosina y WhatsApp) tapan texto** en el inicio («Personalizado»), en la Mercería («en línea») y en Personaliza (tarjetas) → UX-01.
- El encabezado de 390 px es coherente entre casas (logo, buscar, cuenta, carrito, menú); los colores de casa se mantienen.
- Personaliza usa acordeones y pasos en fila deslizable que se cortan en el borde derecho como pista de deslizar; es una decisión de diseño que depende de que la persona descubra el gesto.
- En el 404 la etiqueta «Tienda» del pie y la línea de pagos casi no se leen (ACC-01).
- La aventura de Rosina no tiene cookies, medición ni cuenta; su logo enlaza a la Academy (UX-02).
- Páginas muy largas en celular: políticas (≈ 41.900 px de alto), privacidad de la aventura, glosario, paletas y términos de la Mercería (≈ 14.000 px); la política tiene índice con anclas.

## 7. Lo que sigue pendiente

Lector de pantalla real (ACC-09), zoom al 200 % y espaciado de texto, foco no oculto por el aviso de cookies, contraste de elementos no textuales y pruebas en Android e iPhone (FUN-02).
