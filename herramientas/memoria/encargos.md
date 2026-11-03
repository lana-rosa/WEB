# Encargos del orquestador (3-nov-2026)

Cada encargo va a un chat de tema (plantillas en `plantillas-de-chats.md`). El ejecutor pega la plantilla de su tema y en «Tarea:» escribe «Haz el encargo E# de herramientas/memoria/encargos.md». Al terminar: marca el encargo `[x]` aquí con fecha y una línea de resultado, deja su nota en el archivo del tema y actualiza `estado-actual.md`. **Ningún encargo publica sin el visto bueno de Jennifer.**

**Visión hasta la apertura (domingo 13-dic-2026):** la agenda ya tiene mucho hecho; lo que falta para abrir es la **Mercería con existencias, el cobro probado de punta a punta, la seguridad de la base, la revisión legal y el ERP listo para la caja**. Hasta el 13-dic la agenda solo recibe arreglos de lo que Jennifer encuentre al probar (nada de funciones nuevas).

| # | Cuándo | Qué | Chat ejecutor |
|---|---|---|---|
| E1 | 3–5 nov | Desplegar `rosina-web` v61 (la agenda publicada ya tiene la etapa 2 y Rosina no la conoce) | 3 · Agenda Rosina e idiomas |
| — | 3–10 nov | **Jennifer:** plantilla de la Mercería llena, 34 fotos de ovillos, 5 decisiones del catálogo | (Jennifer) |
| E2 | al llegar la plantilla | Cargar la Mercería al inventario de la **Tienda**, fotos y precios | 4 · Tienda y Mercería |
| E3 | 10–14 nov | Seguridad de la base (paquete B) y asesor de Supabase | 5 · Base de datos y pagos |
| E4 | tras E2 (~17 nov) | Pago real de un ovillo y de una pieza con Wompi, punta a punta | 5 · Base de datos y pagos |
| E5 | tras E2 | Google Merchant y Search Console al día con la Mercería | 4 · Tienda y Mercería |
| E6 | antes del 20 nov | Un solo «paquete para la abogada» con todos los puntos legales abiertos | 6 · Sitio, SEO y Revista |
| E7 | 23 nov–4 dic | ERP para el contador y la caja (bancos, gastos, reglas de precios, usuarias del POS) | **ERP (repo `lana-rosa/ERP`; no hay plantilla: ver nota)** |
| E8 | 7–12 dic | Conteo físico → ajuste del Kardex; ensayo de caja | 5 · Base de datos y pagos |
| E9 | 1–14 dic | Textos y anuncio de la apertura; verificar el cambio automático del 14-dic | 6 · Sitio, SEO y Revista |

---

## [x] E1 · Rosina al día con la agenda publicada (chat 3) — hecho 3-nov-2026: `rosina-web` desplegada (contador de Supabase v61; en el repositorio es «v62» = etapa 2 de Calendar + puntos de miles #531); lo desplegado es idéntico al repositorio (diff vacío) y `probar_rosina_funcion.mjs` dio 43 correctas, 0 fallas
- **Objetivo:** desplegar `rosina-web` v61 (ya en `herramientas/rosina-web/index.ts`, sin desplegar), que explica «Qué fechas enviar a Google Calendar» (#530). Revisar si #531 (puntos de miles al escribir dinero) necesita una línea en `GUIA_AGENDA`; si sí, súbela a v62 antes de desplegar.
- **Leer:** `agenda-casa-y-rosina.md`, `agenda-google.md` (solo la parte de Conexiones).
- **No tocar:** código de la agenda; `nucleo.ts` salvo que haga falta.
- **Probar:** enviar `nucleo.ts` e `index.ts` COMPLETOS, bajar lo desplegado y compararlo con el repositorio (diff vacío); `python3 herramientas/pruebas/probar_rosina_chat.py`.
- **Anotar:** versión desplegada en `agenda-casa-y-rosina.md` y en `estado-actual.md`; dejar a Jennifer 2 preguntas de prueba para el chat.

## [ ] E2 · Mercería con existencias (chat 4)
- **Requisito:** la plantilla `herramientas/merceria-carga/plantilla_carga_merceria.xlsx` llena por Jennifer (y, si llegan, las fotos).
- **Objetivo:** generar el SQL con `cargar_merceria.py`, mostrar el resumen a Jennifer y cargar **solo al inventario de la Tienda** (regla de inventarios); las 7 lanas en «unidad» pasan a «gramo»; subir las fotos a `img/productos/` en WebP liviano; aplicar las decisiones del catálogo; etiquetar en `producto_etiquetas` lo nuevo.
- **Leer:** `tienda-merceria.md`, `base-de-datos-y-cuentas.md` (solo permisos).
- **No tocar:** el inventario del Taller; la agenda; el menú a mano (usar `sincronizar_encabezado.py` si cambia).
- **Probar:** catálogo de la Mercería sin «Muy pronto», ningún insumo del Taller visible en la web, celular 390 px y computador 1280 px, `python3 herramientas/revisar_enlaces.py` (0 rotos, 0 relativas).
- **Anotar:** cuántos ítems y con qué existencias; valor total a costo para el contador (lo usa E7).

## [ ] E3 · Seguridad de la base antes de vender (chat 5)
- **Objetivo:** cerrar SEG-01, SEG-02, SEG-03 y DAT-02 (paquete B de la auditoría 360; el acceso SQL ya se recuperó el 26-oct) y revisar si `obtener_paleta_merceria` debe quedar abierta a `anon` (migración 32).
- **Leer:** `base-de-datos-y-cuentas.md`, `herramientas/auditoria-360/`.
- **No tocar:** funciones de pago en producción sin avisar; tablas de la agenda.
- **Probar:** asesor de seguridad de Supabase después de cada migración (0 errores nuevos); la tienda y la Mercería siguen cargando productos sin sesión.
- **Anotar:** migraciones aplicadas y resultado del asesor.

## [ ] E4 · Cobro probado de punta a punta (chat 5)
- **Requisito:** E2 hecho (hay existencias) y Jennifer disponible para pagar de verdad.
- **Objetivo:** FUN-01: un ovillo (gramos, «ENVÍO CONTRAENTREGA») y una pieza de la Tienda: pedido en el ERP, webhook, CRM con su casa, correo de recibo, aviso a contacto@, `gracias.html`. Aprovechar para revisar los correos de compra y el de reseñas.
- **Leer:** `base-de-datos-y-cuentas.md`, `herramientas/cuentas-clientes/propuesta-cobro-merceria.md`.
- **No tocar:** precios fijados en el servidor; membresía.
- **Probar:** cada eslabón con su evidencia (número de pedido, captura del correo).
- **Anotar:** qué eslabón falló, si alguno, y el arreglo.

## [ ] E5 · Google con la Mercería (chat 4)
- **Objetivo:** con la Mercería cargada, revisar que el feed (`feed-google-merchant` v26) envíe `in_stock`/`backorder` bien; dejar a Jennifer la lista exacta de qué mirar en Merchant Center (Diagnóstico, personalizados, fichas gratuitas, devoluciones, envíos) y en Search Console (sitemap, productos indexados).
- **Leer:** `tienda-merceria.md`, `herramientas/google-merchant/README.md`.
- **No tocar:** textos de plazos (son reglas de CLAUDE.md).
- **Anotar:** qué quedó para Jennifer.

## [ ] E6 · Paquete para la abogada (chat 6) — borrador hecho el 3-nov en `herramientas/legal/PAQUETE-ABOGADA.md`; falta visto bueno de Jennifer y publicar
- **Objetivo:** un solo documento `herramientas/legal/PAQUETE-ABOGADA.md` con cada punto abierto, el enlace exacto al texto publicado y la pregunta concreta: política de datos (cuenta, carrito, bono, Rosina, Wompi), retracto del catálogo, Mercería (términos y cambios), copias de seguridad, Calendar/Drive (apartados 10 y 12), voz y lápiz, chat de Rosina, Cloudflare, fotos de Personaliza, patrones, «Google Fonts» en `#cookies`. Si `herramientas/legal/` es nuevo, revisar que quede fuera del sitio publicado (el flujo excluye `herramientas/`).
- **Leer:** `sitio-seo-revista-cookies.md`, `PENDIENTES.md` (secciones 2, 3 y auditorías).
- **No tocar:** `politicas.html` (no cambiar textos legales sin la abogada).
- **Anotar:** la ruta del documento; Jennifer lo lleva.

## [ ] E7 · ERP para el contador y la caja (repo `lana-rosa/ERP`)
- **Nota del orquestador:** el ERP vive en otro repositorio y ninguna plantilla lo cubre. Propuesta: abrir un chat «ERP y tienda física» con el repo `lana-rosa/ERP`; Jennifer decide.
- **Objetivo:** publicar con visto bueno la rama `claude/ventas-redes-formulario` y `claude/ancho-amigurumi`; dejar listas Bancos, Gastos del local, Reglas de precios (dato del 40 % de E2), usuarias del POS (María Camila y Gloria Inés, «Solo producción»), entradas pendientes (bolsas, Base para amigurumi, Módulo de sonido al Taller).
- **No tocar:** «Reinicio antes de producción» (borra todo) ni «Modo producción» (lo activa Jennifer el día de la apertura).

## [ ] E8 · Conteo físico y ensayo de caja (chat 5)
- **Objetivo:** 7–9 dic: con el conteo de Jennifer (Tienda y Taller por separado), ajustar el Kardex; 10–12 dic: acompañar una venta real pequeña en el POS y revisar permisos.
- **No tocar:** mezclar inventarios de Tienda y Taller.
- **Anotar:** diferencias encontradas y ajustes.

## [ ] E9 · Apertura en la web (chat 6)
- **Objetivo:** revisar que `js/apertura.js` (14-dic), `herramientas/activar_apertura.py` y el flujo `activar-apertura.yml` digan lo mismo; texto de «Recoger en la tienda» antes de abrir (Jennifer decide si se recoge en el taller); horario en `llms.txt` y datos estructurados; aviso de apertura en la web. El 14-dic, comprobar el commit «Tienda física abierta…» en `main`.
- **Leer:** `sitio-seo-revista-cookies.md`.
- **No tocar:** plazos de entrega; nada de Navidad en los anuncios (valores de marca).
- **Probar:** `python3 herramientas/revisar_enlaces.py`; 390 px y 1280 px.
- **Limpieza de paso:** en `PENDIENTES.md` hay renglones viejos que piden «fijar el plazo de personalizados (¿15 días?)» y dicen que la apertura cambia el «16-nov»: la regla de plazos ya está decidida (8 días hábiles) y la fecha es el 14-dic; pasarlos al historial.

## [ ] E10 · Campaña de apertura en redes (chat 8 · Marketing y contenido)
- **Objetivo:** (1) leer `PLAN-MAESTRO-MARKETING.md` y preguntarle a Jennifer, una por una y con sí o no u opciones cortas, las 3 decisiones pendientes (tono inclusivo o femenino, nombre de la línea 4, carrito mixto Tienda + Mercería); (2) armar el calendario de Instagram y Facebook del 4-nov al 14-dic para la apertura de la tienda física (domingo 13-dic): cuenta regresiva, la Mercería, los personalizados (8 días hábiles), la Agenda y el día de apertura; (3) guiones de los primeros 4 reels y 2 carruseles.
- **Leer:** `herramientas/marketing-agenda/LEEME.md`, `PLAN-MAESTRO-MARKETING.md`.
- **No tocar:** páginas del sitio ni la Revista (chat 6). Nada de Navidad, santos ni Halloween: las fechas de diciembre se nombran por la apertura, no por la temporada.
- **Anotar:** el calendario en `herramientas/marketing-agenda/` y su renglón en `estado-actual.md`; si hace falta algo en la web (aviso de apertura), anotarlo para el chat 6 (E9).

---
## Agenda: ideas de otras agendas (aprobado por Jennifer el 3-nov-2026; informe en `herramientas/agenda-auditoria/IDEAS-DE-OTRAS-AGENDAS-2026-11.md`)
**Hasta el 13-dic no se cambia la agenda publicada** (solo E11 en papel y E12). Desde el 14-dic, en este orden: E13 → E14 → E15 → E16 → E17.

## [ ] E11 · Revisión de TODA la agenda para que nada se repita (empezando por finanzas), sin tocar la agenda (chat 2) — ya
- **Hecho (3-nov-2026): finanzas y tiempo** en `herramientas/agenda-auditoria/FINANZAS-PROPUESTA.md` (+ `FINANZAS-MAQUETA.html`); Jennifer respondió sí a las preguntas 1 a 5 (queda la 6). **Hecho también:** las demás secciones en `REVISION-HOJAS-PROPUESTA.md` (39 → 28 hojas); falta que Jennifer responda sus 10 preguntas de sí o no.
- **Ampliado por Jennifer (3-nov-2026):** además de finanzas, revisar **todas las secciones y sus 39 hojas** (`img/agenda/hojas/` y el índice de la agenda): proyectos, patrones, clientas y pedidos, inventario y compras, tiempo (día, semana, mes, año), aprendizaje y Rosina. Por cada grupo: qué hojas o campos se repiten, cuál queda, cuál se une y cómo se pasan los datos. Un solo documento: `herramientas/agenda-auditoria/REVISION-HOJAS-PROPUESTA.md`.
- **Objetivo:** revisar las 10 hojas con dinero (`fin-movimientos`, `fin-presupuesto`, `fin-fijos`, `fin-tcredito`, `fin-resumen`, `fin-analisis`, `fin-negocio`, `gastos-negocio`, `ventas-mes`, `catalogo-precios`) y las metas: qué campo se escribe en dos lugares, qué hoja solo repite. Proponer los dos grupos del informe (punto 4) con «cada peso se escribe una sola vez», cómo pasar los datos de las hojas que sobren sin perder nada, qué cambia en el Excel de finanzas y en el informe del mes. Revisar también las 6 hojas de tiempo (punto 5).
- **Leer:** el informe, `agenda-membresia-y-plus.md`, `agenda-nucleo-y-fichas.md`.
- **No tocar:** el código de la agenda (solo un documento: `herramientas/agenda-auditoria/FINANZAS-PROPUESTA.md`).
- **Entregar a Jennifer:** dibujos o capturas de cómo quedarían las hojas y preguntas de sí o no.
- **Anotar:** su renglón en `estado-actual.md`.

## [x] E12 (3-nov-2026, ver `base-de-datos-y-cuentas.md`) · Seguridad de los datos de la agenda (chat 5) — ya
- **Objetivo:** probar con dos cuentas de prueba que una persona no puede leer ni borrar la copia de otra (tablas y funciones de la copia en la cuenta); revisar el asesor de seguridad; dejar a Jennifer el paso de «Leaked password protection» (A1) en palabras sencillas; estudiar si conviene cifrar la copia en la cuenta con una clave de la persona (ventajas, riesgos: si olvida la clave, se pierde) y proponerlo, sin hacerlo.
- **Leer:** el informe (punto 7), `base-de-datos-y-cuentas.md`, `agenda-datos-y-copias.md`.
- **No tocar:** datos reales de clientas; nada se borra.
- **Anotar:** resultado de la prueba y la propuesta en su archivo.

## [ ] E13 · «Mi semana» (chat 2) — desde el 14-dic
Horario semanal por bloques de color (clases, trabajo, tejido, pedidos) y «Hoy» arriba; usa los datos de fechas que ya existen; celular 390 px y computador 1280 px; textos en 3 idiomas y `GUIA_AGENDA` (pedirlo al chat 3). Mostrar foto a Jennifer antes de publicar.

## [ ] E14 · Avisos de «Mi semana» por Google Calendar (chat 1) — después de E13
Enviar los bloques al calendario propio «Agenda para tejedoras» con su aviso, para que Google avise en el celular y en el reloj; interruptor en Conexiones; todo por `lrDibStore`/copias como hoy.

## [ ] E15 · Atajos del ícono (chat 2) — con E13
`shortcuts` en `manifest-agenda.webmanifest`: «Mi semana», «Nota rápida», «Hoy».

## [ ] E16 · Proyecto con pasos y barra de avance (chat 2), luego hábitos de la semana unidos a pausas activas, luego finanzas unificadas según E11 (chat 2, con el chat 1 para pasar los datos sin perder nada)

## [ ] E17 · Después: stickers y paletas de Rosina en las hojas (chat 2 con dibujos del chat 7), compartir ficha por WhatsApp (chat 2), Google Sheets (chat 1), Google Tasks (chat 1, exige verificación de Google)

## [ ] E18 · «Mi cuenta» dentro de la agenda (chat 2; pedido de Jennifer, 3-nov-2026)
- **Objetivo:** (1) dentro de la agenda, quitar el menú de las tres rayas y dejar **un solo menú: el de «Mi cuenta»**; (2) **menos íconos arriba** (dejar solo los necesarios y el resto dentro de ese menú); (3) **imagen de perfil**: una foto propia o un ícono sugerido (animalitos y otros, en el estilo de Rosina; Jennifer puede enviar los dibujos); (4) **nombre del negocio** configurable (que salga en el informe del mes, el catálogo y lo que se comparta).
- **Hecho 3-nov-2026:** dibujo en `herramientas/agenda-auditoria/MI-CUENTA-MAQUETA.html` (+ `.png`), esperando el sí o no de Jennifer; la agenda no se tocó.
- **Decidido por Jennifer (3-nov-2026):** le gusta el dibujo («Mi cuenta» con un solo menú); los íconos de perfil serán **Rosina y sus amigos (la tortuga y los otros animalitos)**, no más. Falta que diga si se construye ya o desde el 14-dic.
- **Primero:** mostrarle a Jennifer un dibujo de cómo quedaría (celular 390 px y computador 1280 px) y preguntarle con sí o no. Construir desde el 14-dic, salvo que Jennifer diga otra cosa.
- **Datos:** la foto se guarda en el aparato como los dibujos (`lrDibStore`) y viaja en las copias (pedirle al chat 1 que lo revise); no se sube a nuestros servidores. El nombre del negocio va con los datos de la agenda.
- **Avisar a otros chats:** chat 3 (`GUIA_AGENDA` y textos en 3 idiomas), chat 1 (copias y Drive con la foto), chat 6 (si la política de datos debe mencionar la foto de perfil, con la abogada).
- **Anotar:** su renglón en `estado-actual.md` y lo pendiente en `PENDIENTES.md`.

## [ ] E19 · Modo oscuro en la agenda (chat 2; pedido de Jennifer, 3-nov-2026) — desde el 14-dic
- **Objetivo:** opción «Claro / Oscuro / Como el celular» en Configuración de la agenda; se recuerda por aparato.
- **Cuidado especial (pedido de Jennifer: que todo se vea bien):** contraste de textos y botones (mínimo 4,5:1), colores de cada sección y de la casa, tablas y casillas, gráficas, avisos, menús, hoja de dibujo (el papel del dibujo puede quedar claro para no cambiar los colores de lo dibujado), íconos y stickers hechos con fondo claro, portada y fondos, la impresión (siempre en claro) y el chat de Rosina.
- **Probar:** cada hoja en celular 390 px y computador 1280 px en los dos modos, con capturas para Jennifer antes de publicar; revisión de contraste con axe.
- **Avisar:** chat 3 (`GUIA_AGENDA` y textos en 3 idiomas). El resto del sitio (Tienda, Mercería, Academy) queda en claro; si Jennifer lo quiere después, sería un encargo aparte para el chat 6.
