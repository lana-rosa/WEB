# Informe ejecutivo — Auditoría integral 360° de lanarosacrochet.com

**Fecha:** 22 de octubre de 2026 · **Para:** Sara · **Estado:** terminada la fase de revisión. **No se cambió nada** en la web, la base de datos, los precios, las políticas ni las configuraciones; todo espera tu autorización.

## 1. En pocas palabras

- **La web está en buen estado general** y lo más delicado (precios y pagos calculados en el servidor, verificación doble de Wompi, secretos fuera del código, fotos de referencia privadas con borrado a los 90 días, tablas protegidas) está bien construido.
- **No hay nada que obligue a detener la web hoy** (0 hallazgos P0).
- Encontré **48 hallazgos**: **1 alto (P1)**, **14 medios (P2)** y **33 menores (P3)**. De ellos, 13 son defectos confirmados, 11 riesgos potenciales, 19 recomendaciones y 5 cosas que no pude verificar.
- **El asunto más importante lo dejé sin comprobar a propósito:** cuatro funciones internas del taller en la base de datos están abiertas a cualquier visitante con la llave pública (SEG-01). No las ejecuté ni pude leer su contenido (el SQL de Supabase sigue caído). Es lo primero que hay que cerrar cuando vuelva el acceso.
- **Tres de los problemas los causé yo** con cambios de las últimas dos semanas (pie de 404 y de baja de recordatorios con textos casi invisibles, íconos de redes sin foco de teclado y una prueba que quedó rota). Están contados en la sección 8 y corregirlos es rápido.
- **Lo que no pude comprobar importa:** no vi la web publicada (solo lo que rastrea GitHub), ni los ajustes de Cloudflare y de Supabase, no hice pagos y no usé un lector de pantalla. La lista está en `LIMITACIONES_Y_PENDIENTES.md`; **esta auditoría no queda «completa al 100 %»**, y abajo está la cobertura exacta.

## 2. Semáforo por área

| Área | Estado | Por qué |
|---|---|---|
| Pagos y precios | Amarillo | Bien diseñados y verificados dos veces, pero **ningún pago de extremo a extremo** se ha probado (FUN-01) |
| Seguridad de la aplicación web | Amarillo | Sin secretos en el repositorio; falta escapar datos del catálogo (SEG-04) y no hay CSP (SEG-06) |
| Seguridad de la base de datos | Rojo condicionado | SEG-01 y SEG-03 **no se pudieron comprobar** sin SQL |
| Datos y copias | Amarillo | Copia cifrada y restauración probada, pero en un repositorio público (SEG-07), 6 funciones sin copia (DAT-01) y aún sin copia diaria programada exitosa (DAT-02) |
| Privacidad y consentimiento | Amarillo | Casilla premarcada de crear cuenta (PRI-01) y chat de Rosina sin aviso (PRI-02) |
| Accesibilidad | Amarillo | Sin desbordes ni errores y con teclado casi completo, pero hay fallos de contraste, foco y carrito (ACC-01 a ACC-04) |
| Contenido y coherencia comercial | Verde | 15 de 20 datos coherentes, 2 con matiz y 2 contradicciones menores (CON-01, CON-02) |
| SEO | Verde | Títulos únicos, canonical y mapa del sitio correctos; solo detalles (SEO-01, SEO-02) |
| Rendimiento | Verde/amarillo | En laboratorio ninguna página pasa de 2,6 s de LCP; agenda y recursos son las más pesadas |
| PWA | Verde | Manifiestos, íconos y página sin conexión en orden; sin probar en teléfonos |

## 3. Lo más importante (en lenguaje sencillo)

1. **SEG-01 (alto).** Cuatro funciones del taller (`fn_tejido_guardar_plan` en dos versiones, `fn_tejido_guardar_capacidad`, `fn_sugerencias_tejido` y `fn_agendar_pedido_anticipo_bajo`) las puede ejecutar cualquiera desde fuera. Ni la web ni el ERP las usan, y no están en ningún repositorio. Arreglo: cerrarlas con una línea cada una.
2. **SEG-02 y SEG-03.** Toda función nueva de la base nace abierta al público, y hay 315 funciones del ERP que cualquier cuenta (y cualquiera puede crear una) puede intentar ejecutar; las protege una revisión de rol que se puso el 15-oct y que no pude comprobar en las 25 nuevas.
3. **SEG-04.** Si alguien con acceso al ERP pega texto con código en el nombre de un producto, la tienda lo ejecutaría en el navegador de las visitas. Lo demostré con datos inventados en un servidor de pruebas local. La Mercería ya lo evita; falta copiar su solución a la tienda y a los carritos.
4. **SEG-07.** Las copias cifradas de la base están en un repositorio público (cualquiera con cuenta de GitHub las puede bajar 90 días). Están cifradas; todo depende de que la contraseña sea larga. Pasarlas a un repositorio privado es gratis.
5. **PRI-01.** En el paso final del pago, «Crear mi cuenta con este correo» viene marcada. Mejor desmarcada, y que la abogada lo confirme.
6. **PRI-02.** El chat de Rosina envía lo que la persona escribe a un proveedor de IA y ni el chat ni la política lo dicen.
7. **ACC-01 a ACC-03.** Pie casi invisible en 404 y en la baja de recordatorios; íconos de redes del pie sin foco al navegar con teclado; el carrito deja escapar el foco y no se cierra con Esc.
8. **DAT-01 y DAT-02.** Seis funciones de Supabase no tienen copia en ningún repositorio, y todavía no hay una copia diaria programada exitosa (la primera con la conexión buena es la del 23-oct).

## 4. Lo que está bien (con evidencia)

- **0 secretos** en el repositorio (HEAD y 611 confirmaciones) y ningún dato de clientas.
- **0 tablas sin protección** en la base; 30 tablas cerradas por completo (solo se leen por funciones).
- **Precios, descuento y envío** los calcula siempre el servidor; el webhook de Wompi verifica firma, consulta de nuevo y compara el monto.
- **Producción:** el rastreo de GitHub del 22-oct (70 páginas, 363 recursos, 54 canonical) no halló ni un error; 23 de 23 publicaciones salieron bien.
- **Sin desbordes** horizontales en 70 rutas a 390 y 1280 px (ni a 320 px en 60), **0 errores de JavaScript**, 0 imágenes sin descripción, 0 campos sin etiqueta.
- **977 de 982** comprobaciones automáticas pasan (99,5 %); las 5 que fallan son hallazgos reales.
- **Valores de marca:** 0 coincidencias de Navidad, santos, San Valentín o Halloween en 60 páginas y 110 archivos.
- **Coherencia comercial:** una sola regla de plazos, una sola tarifa de envío y mismos datos de contacto en más de 50 páginas.
- La aventura de Rosina no usa cookies, medición ni cuentas: 0 solicitudes a terceros.

## 5. Cobertura (fórmulas y denominadores)

| Medida | Fórmula | Resultado |
|---|---|---|
| Direcciones con estado explícito | 58 ÷ 58 | **100 %** (más 12 variantes y sondas: 70 rutas) |
| Con rastreo automático completo (HTTP, SEO, axe-core, errores JS, desbordes a 390 y 1280 px) | 58 ÷ 58 | 100 % |
| Con estado de producción verificado una por una | 51 ÷ 58 | 87,9 % (las 7 restantes: 2 alcanzables por enlaces y 5 sin enlaces entrantes, ver sección 2 de `LIMITACIONES_Y_PENDIENTES.md`) |
| Con alguna prueba funcional dirigida (sin contar menús) | 26 ÷ 58 | 44,8 % |
| Con prueba de menú por casa | 52 ÷ 58 | 89,7 % |
| Con teclado y foco medidos | 13 ÷ 58 | 22,4 % |
| Con rendimiento de laboratorio | 19 ÷ 58 | 32,8 % |
| Con reflujo a 320 px | 58 ÷ 58 | 100 % |
| Enlaces y recursos verificados | 5.190 ÷ 5.545 | 93,6 % (los 355 restantes son externos y quedan **pendientes**, no aprobados) |
| Funciones de Supabase leídas completas | 12 ÷ 16 | 75 % (2 en parte, 2 sin leer) |
| Comprobaciones automáticas que pasan | 977 ÷ 982 | 99,5 % |
| Páginas con revisión de texto automatizada | 60 ÷ 60 | 100 % (lectura humana completa: 0 de 60) |
| Pruebas con lector de pantalla o dispositivos reales | 0 | 0 % |

**Qué cuenta como «verificado»:** el destino existe en el repositorio o el servidor local responde 200, la ancla existe, o el formato del correo y de WhatsApp es válido; **no** significa que un destino externo responda ni que un correo llegue. Las cifras de enlaces de hoy (5.545 apariciones) y las del 17-oct (9.203) no son comparables porque la herramienta cuenta distinto las rutas dentro de JavaScript.

## 6. Reutilicé lo anterior

Partí de `auditoria-integral-2026-10-17.md`, `auditoria-privacidad.md`, los dos inventarios del 17-oct y los resultados de GitHub Actions, **sin sobrescribirlos**. De 16 puntos anteriores: **7 corregidos y comprobados hoy**, 2 vigentes por decisión tuya (H3 y H5), 3 vigentes (H7, las 34 fotos, las cifras de Supabase), 2 parciales (H2 y accesibilidad) y 2 pendientes de fecha o de medición (H10, PageSpeed). Detalle: `datos/reverificacion_auditoria_previa.csv`.

## 7. Qué propongo y qué necesito de ti

Nada se hace sin tu autorización explícita. Te propongo tres paquetes:

| Paquete | Qué incluye | Requiere |
|---|---|---|
| **A. Cambios pequeños de código y texto** (los preparo en una rama, con capturas, sin publicar) | SEG-04 (escapar datos), SEG-05 (formateador del chat), ACC-01 a ACC-06, UX-01, CON-01 a CON-03, PRU-01, ARQ-01 a ARQ-03, DAT-01 (guardar las 6 copias de código) | Tu OK. No toca la base |
| **B. Base de datos** | SEG-01 (cerrar las 4 funciones), SEG-02 (permisos por defecto), muestreo de SEG-03, DAT-02 | Que vuelva el acceso SQL (restablecer la contraseña una vez más y actualizar el secreto) y tu OK |
| **C. Decisiones y ajustes tuyos o de terceros** | SEG-07 (repositorio privado para las copias), SEG-08 (proteger `main`), PRI-01 (casilla desmarcada), PRI-02 (aviso del chat y política con la abogada), SEG-06 y PRI-03 (Cloudflare), SEG-15 (lista de comprobación), FUN-01 (pago de prueba y pago real), ACC-09 y FUN-02 (lector de pantalla y teléfonos), CON-04 (Merchant Center), PWA-01, SEG-09 (borrar funciones sin uso) | Tú, la abogada o quien tenga la cuenta |

**Orden sugerido:** B primero (en cuanto haya SQL), A en paralelo (revisas capturas y publicamos), C a tu ritmo. **Esfuerzo recomendado para cada paquete: A, medio; B, alto (hay que tener cuidado con permisos); C, bajo cada uno, pero varios.** ¿Con cuál empezamos y qué autorizas?

## 8. Cambios míos que causaron problemas (para que lo sepas)

- **Pie de 404 y baja-recordatorios** (PR #383 y #400): faltan variables de color y quedaron textos casi invisibles (ACC-01).
- **Pie con íconos de redes** (PR #382): sin indicador de foco del teclado (ACC-02).
- **Quitar la casilla de publicar foto** (22-oct): dejé una prueba (`prueba_consentimiento.py`) con una referencia a esa casilla (PRU-01).
- **Mi mensaje del 22-oct con las 58 direcciones** decía «Revista (21)» y «20 artículos»; lo correcto es 20 direcciones de Revista (portada y 19 artículos). El total de 58 era correcto.

## 9. Archivos de la auditoría (carpeta `herramientas/auditoria-360/`)

| Archivo | Qué es |
|---|---|
| `INFORME_EJECUTIVO.md` | Este informe |
| `REGISTRO_HALLAZGOS.csv` | Los 48 hallazgos con ID, prioridad, clase, evidencia, cómo reproducirlos, impacto, corrección y cómo verificarla |
| `INVENTARIO_PAGINAS.csv` | 70 filas: las 58 direcciones y 12 variantes, con estado, SEO, accesibilidad, pruebas, hallazgos, cobertura y límites |
| `INVENTARIO_ENLACES.csv` | 5.545 enlaces y recursos con archivo y línea, resultado y estado |
| `SEGURIDAD_INFORMATICA.md` | Seguridad, mapa OWASP y controles que funcionan |
| `UX_UI_Y_ACCESIBILIDAD.md` | WCAG 2.2, teclado, recorridos y observaciones visuales |
| `REVISION_EDITORIAL_Y_COHERENCIA.md` | Ortografía, valores de marca, contradicciones y notas para la abogada |
| `COHERENCIA_COMERCIAL.md` | Matriz de 20 datos comerciales |
| `SEO_RENDIMIENTO_PWA.md` | SEO técnico, rendimiento en laboratorio y PWA |
| `PRUEBAS_FUNCIONALES.md` | Qué se probó, resultados y qué falta |
| `LIMITACIONES_Y_PENDIENTES.md` | Lo que no se pudo hacer, lista de comprobación para ti, correcciones mías |
| `datos/` y `scripts/` | Datos medidos y los scripts para repetir cada medición |

**Prioridades:** P0 = detener y arreglar hoy; P1 = arreglar en cuanto se pueda comprobar; P2 = planificar pronto; P3 = mejora o limpieza. **Clases:** *defecto confirmado* (se reprodujo o se midió), *riesgo potencial* (hay un motivo concreto pero no se comprobó el daño), *recomendación de diseño* y *pendiente de verificar*.
