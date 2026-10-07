# Auditoría técnica de privacidad — Lana Rosa (7-oct-2026)

> Informe **técnico**. Describe lo que hace la web según el código y la base de datos. Lo jurídico queda separado en la sección 7 ("Para validación de la abogada"): nada de este documento es una conclusión legal.

Estados usados: **IMPLEMENTADO Y VERIFICADO** · **PENDIENTE DE VALIDACIÓN JURÍDICA** · **PENDIENTE DE INFORMACIÓN DEL PROVEEDOR** · **NO APLICA**

## 1. Inventario de cookies y almacenamiento del navegador

| Tecnología | Clasificación | Dónde se activa | Antes del consentimiento |
|---|---|---|---|
| Cookies de Google Analytics (`_ga`, `_ga_*`), vía GTM | Analítica | Todas las páginas con GTM, si la etiqueta GA4 se dispara | Bloqueadas (consentimiento `analytics_storage` en "denegado"). **Verificado** el estado inicial y, el 7-oct-2026, el bloqueo real en GTM: las dos etiquetas de eventos GA4 exigen `analytics_storage`; en Tag Assistant no se activan sin aceptar y sí se activan al aceptar. |
| `localStorage.lrConsent` | Necesario (guarda la decisión) | Aviso de cookies | Se crea solo al decidir |
| `localStorage.carritoLanaRosa`, `lrFotosCarrito` | Necesario (carrito) | Tienda, Mercería, pago | Solo al agregar productos |
| `localStorage.sb-ngjoognzvehwjtpqwrqe-auth-token` | Necesario (sesión) | Solo si la persona inicia sesión | No existe sin sesión |
| `lrRegistroPendiente`, `lrCuentaEnviada`, `lrPrefillCuenta`, `lrPendResenas` | Funcional (cuenta y reseñas) | Cuenta / pago | Solo al usar esas funciones |
| `lrOrigen`, `lrCasa`, `lrVolver`, `lrVolviendo` | Funcional (botón "Volver", casa de origen) | Navegación | Sí, sin datos personales |
| `saludo-rosina` | Funcional (no repetir saludo) | Todas | Sí, sin datos personales |
| `sessionStorage compra-<ref>` | Necesario (no contar dos veces una compra) | `gracias.html` | Solo tras un pago |
| `lrPagosPrueba` | Interno (modo de pruebas de pagos) | Solo con parámetro de pruebas | No aplica al público |
| Cookies de marketing / píxeles | — | **No existen en el código** (no hay Meta Pixel ni similares) | NO APLICA |

El código de la web **no escribe `document.cookie`** directamente; las cookies de analítica las crea Google si la etiqueta se dispara.

## 2. Scripts y solicitudes de terceros

| Tercero | Qué se pide | Páginas | Clasificación |
|---|---|---|---|
| Google Tag Manager (`googletagmanager.com`) | Carga el contenedor `GTM-M3MQ7XZD` | Todas | Cargador de etiquetas (no cookies por sí mismo) |
| Google Analytics (dentro de GTM) | Medición | Todas, solo con consentimiento | Analítica |
| ~~Google Fonts~~ | **Ya no se piden a Google**: las fuentes se sirven desde `/fonts/` | — | Eliminado (ver 5) |
| ~~`esm.sh`~~ | **Ya no se pide a esm.sh**: la librería de Supabase se sirve desde `/js/vendor/supabase.js` | — | Eliminado (ver `js/vendor/LEEME.md`) |
| Supabase (`ngjoognzvehwjtpqwrqe.supabase.co`) | Catálogo, cuentas, solicitudes, pagos | Tienda, Mercería, Personaliza, Cuenta, Pago | Necesario |
| Wompi (`checkout.wompi.co`) | Página de pago | Solo al pagar (redirección) | Tercero de pagos |
| WhatsApp (`wa.me`) | Enlaces | Todas | Enlace: no carga nada hasta el clic |
| YouTube, Instagram, TikTok, Facebook, Google (reseñas/mapas) | **Solo enlaces** | Pie y secciones | No cargan rastreadores hasta el clic. No hay iframes incrustados (el único `<iframe>` es el `noscript` de GTM) |

## 3. Datos que recoge la web (verificado en código y base de datos)

| Dato | Dónde se pide | Dónde queda | Quién más lo recibe |
|---|---|---|---|
| Nombre, teléfono, correo (opcional), ciudad, descripción y mensaje del pedido personalizado | Personaliza | Tabla de solicitudes (RPC `crear_solicitud_personalizada`) | Supabase |
| **Fotos de referencia (hasta 6)** | Personaliza | Bucket de Storage `solicitudes-personalizadas` (**público**: quien tenga el enlace exacto la puede ver) | Supabase |
| Nombre, correo, teléfono, ciudad, dirección, notas, productos y valores del pedido | Pago | `pedidos_web` y `pedidos_web_items` | Supabase; **Wompi recibe correo, nombre completo y teléfono** (no la dirección) |
| Datos del pago (tarjeta, PSE, etc.) | Página de Wompi | **No pasan por Lana Rosa**; solo se recibe el resultado de la transacción | Wompi |
| Cuenta: correo o acceso con Google | Cuenta | Supabase Auth + tablas de cuenta | Supabase; Google si elige ese acceso |
| Favoritos, direcciones guardadas, mensajes de la cuenta | Cuenta | `favoritos_web`, `direcciones_web`, `mensajes_cuenta` | Supabase |
| Reseñas: nombre, teléfono (verificación), calificación, comentario | Tienda / Cuenta | Tabla de reseñas (`crear_resena_web`, `crear_mi_resena`) | Supabase. **Falta confirmar qué se muestra públicamente** (nombre completo, solo nombre de pila, etc.) |
| Casilla de promociones | Pago | Con el pedido | Supabase |
| Casilla de aceptación de la política | Pago y Cuenta | Con el pedido / la cuenta | — |
| **Autorizaciones de Personaliza** (nuevo) | Personaliza | Línea "[Autorizaciones registradas…]" dentro del mensaje de la solicitud | Supabase |

## 4. Discrepancias entre la práctica real y la política publicada

| # | Hallazgo | Estado |
|---|---|---|
| 1 | La política de cookies mencionaba **Meta Pixel**, que no existe. | **IMPLEMENTADO Y VERIFICADO** (mención eliminada) |
| 2 | La política decía que la analítica funcionaba sin aclarar el consentimiento. | **IMPLEMENTADO Y VERIFICADO** (ahora se activa solo con aceptación y se puede cambiar) |
| 3 | **Personaliza no tenía ninguna casilla de aceptación** de la política de datos, pese a recoger nombre, teléfono, correo y fotos. | **IMPLEMENTADO Y VERIFICADO** (casilla obligatoria agregada) · el texto definitivo: **PENDIENTE DE VALIDACIÓN JURÍDICA** |
| 4 | **No existía autorización separada** para usar fotos de pedidos en web y redes. | **IMPLEMENTADO** (casilla opcional separada, sin marcar) · registro definitivo y texto: **PENDIENTE DE VALIDACIÓN JURÍDICA** |
| 5 | **Las fotos de Personaliza se podían listar por cualquier visitante** (la política de Storage permitía `SELECT` a `anon`). Había 1 foto expuesta al listado. | **IMPLEMENTADO Y VERIFICADO** (listado cerrado: `anon` ve 0 objetos; el personal activo conserva la lectura). El bucket **sigue público por enlace exacto**. Hacerlo privado requiere cambiar cómo el ERP muestra las fotos: **decisión pendiente** |
| 6 | La política de datos no menciona cuentas, favoritos, direcciones ni reseñas. | **PENDIENTE DE VALIDACIÓN JURÍDICA** |
| 7 | La política no lista los terceros que reciben datos (Supabase, Wompi, Google, Cloudflare, GitHub Pages, WhatsApp, transportadoras). | **PENDIENTE DE VALIDACIÓN JURÍDICA** |
| 8 | Google Fonts enviaba la IP de cada visita a Google. | **IMPLEMENTADO Y VERIFICADO** (fuentes propias) |
| 9 | `esm.sh` recibía la IP de las visitas que cargan la librería de Supabase. | **IMPLEMENTADO Y VERIFICADO** (librería alojada en `/js/vendor/supabase.js`; 0 solicitudes a esm.sh en tienda, Personaliza, catálogo y cuenta) |

## 5. Google Fonts → fuentes propias
- DynaPuff y Hanken Grotesk, subconjuntos latin y latin-ext (español), archivos variables en `/fonts/` (≈119 KB en total) con `font-display: swap` y precarga de los dos archivos latinos.
- Verificado en 10 páginas: 0 solicitudes a `fonts.googleapis.com` / `fonts.gstatic.com`, las fuentes cargan con 200 y no hay errores de JavaScript.
- No se tocan los pesos ni las familias: la apariencia no cambia.
- Archivos heredados sin uso (`styles.css`, `css/styles.css`) todavía mencionan Google Fonts; **ninguna página los carga**.

## 6. Proveedores

| Proveedor | Finalidad | Datos que puede recibir | Dónde se procesan/almacenan |
|---|---|---|---|
| Supabase | Base de datos, cuentas, almacenamiento de fotos, funciones | Todo lo de la sección 3 | **Requiere confirmación del proveedor** (región del proyecto) |
| Wompi | Pagos | Correo, nombre completo, teléfono, valor y referencia; los datos de pago los ingresa la persona en Wompi | **Requiere confirmación jurídica/proveedor** |
| Google (GTM / Analytics) | Medición | Visitas, dispositivo, página, eventos del sitio; cookies `_ga` solo con consentimiento | **Requiere confirmación jurídica/proveedor** |
| Cloudflare | DNS / entrega del sitio | Dirección IP y tráfico de las visitas | **Requiere confirmación jurídica/proveedor** |
| GitHub Pages | Alojamiento del sitio estático | Dirección IP de las visitas | **Requiere confirmación jurídica/proveedor** |
| WhatsApp (Meta) | Atención de pedidos por chat | Lo que la persona escriba y su número | **Requiere confirmación jurídica/proveedor** |
| Transportadoras | Entrega | Nombre, teléfono y dirección (los entrega Lana Rosa manualmente) | **Requiere confirmación jurídica/proveedor** |
| Proveedor de correo (gracias, recibo) | Correos del pedido | Correo, nombre, datos del pedido | **PENDIENTE DE INFORMACIÓN**: confirmar cuál es |

No se afirma ninguna ubicación ni transferencia internacional: no se puede determinar de forma fiable desde el código.

## 7. Para validación de la abogada (no es conclusión técnica)
1. Terceros encargados del tratamiento (lista de la sección 6).
2. Posibles transferencias o transmisiones internacionales.
3. Tratamiento de datos de cuentas, favoritos, direcciones y reseñas, y qué se publica de una reseña.
4. Tiempos de conservación.
5. Menores de edad (talleres de la Academy).
6. Medidas de seguridad que Lana Rosa puede declarar (p. ej. conexión cifrada, claves de pago solo en el proveedor, fotos accesibles solo por enlace exacto).
7. Procedimiento y plazos para consultas y reclamos.
8. Obligación (o no) de inscribir las bases en el Registro Nacional de Bases de Datos.
9. Texto definitivo de las dos casillas de Personaliza y cómo conservar la prueba de la autorización de uso de fotos (hoy queda como texto dentro de la solicitud); autorización para testimonios y galerías.
10. Si el aviso de cookies y su texto son suficientes, y si las cookies "necesarias" y "funcionales" deben presentarse así.
11. Otras discrepancias detectadas: ver la tabla de la sección 4.
