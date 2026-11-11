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
**Aclarado por Jennifer (3-nov-2026): las tareas de la agenda NO esperan a la apertura; se hacen ya, en paralelo.** Lo que sí tiene fecha (antes de la apertura) es la tienda: crear todos los productos en el ERP (aparecen solos en la web), subir las fotos, probar compras y la sincronización con el inventario del ERP (E2, E4, E5, E7, E8, E9). **Orden dentro del chat 2 (para no pisarse):** E11 → E18 → E13 + E15 → E19 → E16 → E17. Chat 1: E14 después de E13. Chat 5: E12 ya, sin frenar E3/E4.

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

## [ ] E13 · «Mi semana» (chat 2) — después de E11 y E18
Horario semanal por bloques de color (clases, trabajo, tejido, pedidos) y «Hoy» arriba; usa los datos de fechas que ya existen; celular 390 px y computador 1280 px; textos en 3 idiomas y `GUIA_AGENDA` (pedirlo al chat 3). Mostrar foto a Jennifer antes de publicar.

## [ ] E14 · Avisos de «Mi semana» por Google Calendar (chat 1) — después de E13
Enviar los bloques al calendario propio «Agenda para tejedoras» con su aviso, para que Google avise en el celular y en el reloj; interruptor en Conexiones; todo por `lrDibStore`/copias como hoy.

## [ ] E15 · Atajos del ícono (chat 2) — con E13
`shortcuts` en `manifest-agenda.webmanifest`: «Mi semana», «Nota rápida», «Hoy».

## [ ] E16 · Proyecto con pasos y barra de avance (chat 2), luego hábitos de la semana unidos a pausas activas, luego finanzas unificadas según E11 (chat 2, con el chat 1 para pasar los datos sin perder nada)

## [ ] E17 · Después: stickers y paletas de Rosina en las hojas (chat 2 con dibujos del chat 7), compartir ficha por WhatsApp (chat 2), Google Sheets (chat 1), Google Tasks (chat 1, exige verificación de Google)

## [ ] E18 · «Mi cuenta» dentro de la agenda (chat 2; pedido de Jennifer, 3-nov-2026)
- **Punto nuevo (Jennifer, 3-nov-2026): la barra «Dictar» y «Lápiz».** Los celulares y tabletas ya dictan y reconocen la letra desde el teclado. **Decidido por Jennifer (3-nov-2026): «Dictar» solo en el computador; «Lápiz» (escribir a mano encima de la hoja) solo en tabletas y dentro del menú, sin barra fija.**
- **Objetivo:** (1) dentro de la agenda, quitar el menú de las tres rayas y dejar **un solo menú: el de «Mi cuenta»**; (2) **menos íconos arriba** (dejar solo los necesarios y el resto dentro de ese menú); (3) **imagen de perfil**: una foto propia o un ícono sugerido (animalitos y otros, en el estilo de Rosina; Jennifer puede enviar los dibujos); (4) **nombre del negocio** configurable (que salga en el informe del mes, el catálogo y lo que se comparta).
- **Hecho 3-nov-2026:** dibujo en `herramientas/agenda-auditoria/MI-CUENTA-MAQUETA.html` (+ `.png`), esperando el sí o no de Jennifer; la agenda no se tocó.
- **Decidido por Jennifer (3-nov-2026):** le gusta el dibujo («Mi cuenta» con un solo menú); los íconos de perfil serán **Rosina y sus amigos (la tortuga y los otros animalitos)**, no más. **Jennifer pidió construirlo ya (3-nov-2026) y aclaró que la agenda no depende del 13-dic (esa fecha es solo la apertura de la Mercería): no volver a preguntar por esa fecha.** Construido; falta su visto bueno para publicarlo.
- **Primero:** mostrarle a Jennifer un dibujo de cómo quedaría (celular 390 px y computador 1280 px) y preguntarle con sí o no. Construir apenas Jennifer apruebe el dibujo.
- **Datos:** la foto se guarda en el aparato como los dibujos (`lrDibStore`) y viaja en las copias (pedirle al chat 1 que lo revise); no se sube a nuestros servidores. El nombre del negocio va con los datos de la agenda.
- **Avisar a otros chats:** chat 3 (`GUIA_AGENDA` y textos en 3 idiomas), chat 1 (copias y Drive con la foto), chat 6 (si la política de datos debe mencionar la foto de perfil, con la abogada).
- **Anotar:** su renglón en `estado-actual.md` y lo pendiente en `PENDIENTES.md`.

## [ ] E19 · Modo oscuro en la agenda (chat 2; pedido de Jennifer, 3-nov-2026) — después de E13
- **Objetivo:** opción «Claro / Oscuro / Como el celular» en Configuración de la agenda; se recuerda por aparato.
- **Cuidado especial (pedido de Jennifer: que todo se vea bien):** contraste de textos y botones (mínimo 4,5:1), colores de cada sección y de la casa, tablas y casillas, gráficas, avisos, menús, hoja de dibujo (el papel del dibujo puede quedar claro para no cambiar los colores de lo dibujado), íconos y stickers hechos con fondo claro, portada y fondos, la impresión (siempre en claro) y el chat de Rosina.
- **Probar:** cada hoja en celular 390 px y computador 1280 px en los dos modos, con capturas para Jennifer antes de publicar; revisión de contraste con axe.
- **Avisar:** chat 3 (`GUIA_AGENDA` y textos en 3 idiomas). El resto del sitio (Tienda, Mercería, Academy) queda en claro; si Jennifer lo quiere después, sería un encargo aparte para el chat 6.

## [ ] E20 · Plan B de la Mercería para la apertura (chat 4; 3-nov-2026)
- **Por qué:** el desembolso del Fondo Emprender está demorado y los pedidos de la Mercería no se han hecho (Jennifer).
- **Objetivo:** proponerle a Jennifer, con sí o no, qué mostrar si el 13-dic aún no hay existencias: la Mercería en «Muy pronto» con lista de espera (ya existe), la Tienda de amigurumis completa, y qué decir en la web y en redes (avisar al chat 6 y al chat 8). Nada se publica sin su visto bueno.
- **E4 no espera:** la compra de prueba se puede hacer ya con un producto de la Tienda; la del ovillo, cuando haya existencias.

## [x] E21 (hecho 3-nov-2026, #569: estilos del engranaje en `css/comun.css`, `comun.css?v=43`) · Ícono de Configuración gigante en «Mi cuenta» cuando se llega desde la agenda (chat 6; captura de Jennifer, 3-nov-2026)
- En `cuenta.html` con el menú de la casa Agenda, el engranaje de Configuración sale enorme (~110 px) en el encabezado. Buscar si viene de `js/casa-menu.js` (generado por `herramientas/sincronizar_encabezado.py`: no se edita a mano) o de un estilo que falta en esa página; dejarlo del tamaño de los otros íconos. Revisar las demás páginas comunes con `?casa=agenda`. Foto a Jennifer antes de publicar (nivel 🟡). Avisar al chat 2, porque E18 rehace ese encabezado en la agenda.

## [ ] E22 · País, departamento y ciudad en las cuentas (chat 5 con el chat 6 para la página; pedido de Jennifer, 3-nov-2026)
- Hoy `cuenta.html` pide «Ciudad» con texto libre y lista sugerida (4 formularios: completar cuenta, mis datos, direcciones y otro). Pedido: **primero País**; si es Colombia, **Departamento** y luego **Ciudad** en listas; si es otro país, solo el país.
- Revisar dónde se guarda (tablas de cuentas y direcciones), que el pago, el cálculo del envío (Villamaría, Manizales, otras ciudades) y el paso al ERP/CRM sigan funcionando con los datos nuevos y con los viejos. Lista de departamentos y municipios del DANE alojada en el sitio (sin pedirla a otro servidor). Nivel 🔴 (base de datos): explicarle a Jennifer antes de cambiar.

## [ ] E23 · Tutorial de bienvenida al día con «Mi cuenta» (chat 3; después de E18)
- Cuando E18 cambie el menú y los íconos, rehacer los pasos de `js/agenda/tour.js` que los señalan (paso 2 Configuración y paso 5 «Escribe como prefieras») y sus textos en 3 idiomas; actualizar `GUIA_AGENDA`.

## [x] E24 (hecho 4-nov-2026, #589; falta que Jennifer lo vea con sesión iniciada) · Menú de la casa Agenda en las páginas comunes (chat 6; captura de Jennifer, 3-nov-2026)
- En las páginas comunes abiertas desde la agenda (como `cuenta.html` con `?casa=agenda`): **quitar los botones de arriba** («Mi agenda», «Aprende y compra», «Material gratis de Rosina», «Sobre nosotras») y **dejar solo el menú de las tres rayitas**; dentro de ese menú, **quitar «Rosina / Material gratis de Rosina»** (ese material ya está dentro de la agenda y el enlace lleva a la Academy). Solo la casa Agenda; las otras casas no cambian.
- Se hace en `herramientas/sincronizar_encabezado.py` (genera `js/casa-menu.js`); probar con `probar_menus.py`, en 390 y 1280 px; foto a Jennifer antes de publicar (nivel 🟡).
- Ojo: dentro de la agenda (E18, chat 2) la decisión es otra (un solo menú de «Mi cuenta», sin tres rayitas): avisar al chat 2 para que se vea coherente al pasar de la agenda a «Mi cuenta».

## [ ] E25 (4-nov-2026: 3 opciones con foto en `herramientas/agenda-auditoria/tarjetas/`, esperando la elección de Jennifer) · Más contraste y color en las tarjetas de las secciones (chat 2; captura de Jennifer, 4-nov-2026)
- Jennifer: «todo se ve muy monótono en cuanto al color, le falta contraste» (sección «Mis proyectos»: tarjetas blancas con borde rosa y títulos rosados, sobre fondo rosado claro).
- **Objetivo:** proponer 2 o 3 opciones con foto (sin cambiar todavía): por ejemplo, cada tarjeta con un fondo suave de un color distinto de la paleta (rosa, lila, azul acero, durazno, verde menta) o el color propio de cada sección; títulos más oscuros; borde o sombra que separe la tarjeta del fondo; contraste mínimo 4,5:1 en textos. Mirar todas las secciones, no solo «Mis proyectos».
- **Coordinar:** con E19 (modo oscuro) y E18 («Mi cuenta»), para no repintar dos veces. Foto a Jennifer y sí o no antes de publicar (nivel 🟡).

## [x] E26 (hecho 4-nov-2026, #584, parte del sitio; la agenda va con el chat 2) · Letra gris más oscura (Jennifer, 4-nov-2026: «el gris que estamos usando está un poco claro»)
- **Agenda → chat 2, dentro de E25** (mismas fotos de opciones). **Resto del sitio → chat 6**: revisar `--tinta-suave` y otros grises de texto en `css/comun.css` y en los estilos de cada página; oscurecerlos hasta al menos 4,5:1 sobre el fondo blanco y sobre los fondos de cada casa (`--casa-t1`, `--casa-t2`). Fotos antes y después a Jennifer, sí o no (nivel 🟡). Que los dos chats usen el mismo gris.
- **E24 ampliado (Jennifer, 4-nov-2026, captura de `cuenta.html` desde la agenda):** (1) quitar también el **engranaje de Configuración** del encabezado (no lleva a ningún lado y ya está en el perfil de la agenda); (2) las **tres rayitas** deben mostrar **solo las opciones de «Mi cuenta»**: Pedidos, Mensajes, Reseñas, Favoritos, Direcciones, Carrito, Personalizados, Mis datos y Cerrar sesión (y un enlace para volver a la agenda), no el menú del sitio.

---
## Respuesta de la abogada (5-nov-2026) — leer `herramientas/legal/RESPUESTA-ABOGADA-2026-11.md`
Regla: los textos legales se preparan como borrador, Jennifer los ve, **la abogada da aprobación escrita** y luego se publican. Ya aprobados para publicar (con foto a Jennifer): punto 1 (retracto, **15 días**, no 30) y punto 12 (Google Fonts). Fase 1 antes de la apertura.

## [ ] E27 (10-nov: retracto publicado #618; comparación y borradores listos en `BORRADORES-FASE-1.md`; falta la aprobación escrita de la abogada) · Textos legales según la abogada (chat 6) — fase 1 ya
- **Primero, como pide la abogada:** contrastar **cada uno de los 13 puntos con lo que la web hace hoy** (tabla en `BORRADORES-FASE-1.md`: qué dice la política, qué hace la web en realidad, qué texto se propone). Lo técnico que no puedas comprobar (proveedores, países, datos que salen) lo aporta el chat 5 (inventario de E28). Junto al documento, entregar a la abogada la sección «Fuentes» de `RESPUESTA-ABOGADA-2026-11.md`.
- **Publicar ya** (con foto a Jennifer): retracto con el texto del punto 1 y **15 días calendario**; 7 días solo como recomendación; diferencia retracto/garantía; retracto solo para compras por internet; coherencia en preguntas frecuentes, Personaliza y Mercería. Google Fonts fuera y **fechas unificadas** de la política de cookies.
- **Borradores para la abogada** (un solo documento `herramientas/legal/BORRADORES-FASE-1.md`, con el texto actual y el propuesto): identificación única de la titular en todas las páginas (punto 2); términos de la Mercería (retracto de insumos, pago del envío, garantía en promociones); política de datos completa (punto 3 y 13: finalidades, proveedores por categoría, reseñas, bono, consultas y reclamos, seguridad, conservación por categoría, supresión, cookies por tipo); membresía (punto 4: texto de inicio inmediato, prueba gratis, separar la copia gratuita); copias (punto 7); Calendar/Drive (punto 8, texto del acceso del equipo); voz y lápiz (punto 9); aviso del chat con Anthropic (punto 10).
- Después de la aprobación escrita: publicar, actualizar fechas y avisar al chat 5 para subir las versiones de las autorizaciones en el código. Anotar las respuestas en la tabla de `PAQUETE-ABOGADA.md`.
- **Fase 2 (después):** términos de Lana Rosa Academy (con el chat 7), condiciones de patrones (con el chat 5), aviso de realidad aumentada (con el chat 7). Verificar Cloudflare con las solicitudes de red (punto 11).

## [ ] E28 · Cambios técnicos de la abogada (chat 5) — fase 1 ya
- **Prioridad:** bucket `guias-envio` privado, enlaces firmados con vencimiento, acceso restringido y borrado de guías viejas (punto 6). Explicarle a Jennifer antes (nivel 🔴).
- Identificación de la titular en comprobantes y correos de compra (texto del punto 2; cuando la abogada apruebe).
- Casilla de personalizados (ya pedida): texto como información y prueba, **no como renuncia**.
- Bono: separar la entrega del bono de la autorización de publicidad. Reseñas: publicar solo nombre de pila o seudónimo.
- Registro de solicitudes de supresión que se vuelva a aplicar si se restaura una copia (punto 7).
- **Inventario de proveedores** para la abogada: proveedor, país donde se procesan los datos, rol (responsable/encargado), subencargados, contrato (Supabase en São Paulo, GitHub, Google, Cloudflare, Anthropic, Wompi, correo). En `herramientas/legal/INVENTARIO-PROVEEDORES.md`.
- Membresía: cuando la abogada apruebe el texto nuevo de la segunda casilla, subir `VERSION_CONDICIONES`. Patrones: casilla propia antes del primer patrón (fase 2).

## [x] E29 · Rosina sin afirmaciones de seguridad infantil (chat 3) — CERRADO 5-nov-2026: Jennifer probó en el chat real «¿Este peluche es seguro para un recién nacido?» y Rosina respondió la frase exacta con «puede tener» (la del bebé de 3 meses salió bien en una prueba anterior). DESPLEGADA 5-nov-2026 con el sí de Jennifer (ajustada el mismo día tras su prueba: sin edades inventadas ni «bien asegurado»; 3.ª vuelta el mismo día: regla corta + ojos bordados permitidos; Supabase v64, idéntica al repositorio; prueba 45/45). Falta probar respuestas reales (no se pudo desde el entorno): «¿Este peluche es seguro para un recién nacido?» y «¿Puedo regalarle un amigurumi a un bebé de 3 meses?»; se cierra al verificarlo.
- En `rosina-web` (`nucleo.ts`/`index.ts`): Rosina no dice que un peluche es seguro para bebés, apto para recién nacidos ni que cumple normas; usa datos verificables (materiales, relleno, medidas, edad recomendada, piezas pequeñas, supervisión). Nivel 🔴 (Rosina): explicarle a Jennifer y probar con preguntas sobre bebés antes de desplegar. El aviso del chat con Anthropic lo redacta el chat 6 (E27).

## [ ] E30 · Aviso antes de conectar Google Calendar y Drive (chat 1)
- Antes de conectar cada servicio, una ventana que diga qué datos se consultan, qué se guarda, para qué, qué permisos pide, cómo desconectar y qué pasa después (punto 8). Texto final con el chat 6 y la abogada. Foto a Jennifer.

## [ ] E31 · Aviso antes de dictar (chat 2, con E18)
- Al tocar «Dictar» (solo computador), mostrar una vez el texto del punto 9 antes de activar el micrófono. Textos en 3 idiomas con el chat 3.

## [ ] E32 · Personajes y datos de los peluches (chat 4, con Jennifer)
- Lista de las 27 piezas «personaje» para que Jennifer decida una por una (punto 13: priorizar propios, sin nombres de franquicia como oficiales, sin logotipos). En las fichas de amigurumis: materiales, relleno, medidas, edad recomendada y si tiene piezas pequeñas (datos que Jennifer confirme).

## [ ] E33 · Academy y menores (chat 7) — antes de vender cupos
- Borrador de términos de Lana Rosa Academy (punto 2) y de las autorizaciones de menores (inscribe el representante; fotos y videos aparte), para que el chat 6 los lleve a la abogada.

**De Jennifer:** revisar con la contadora los recibos (qué documento y qué datos); autorizaciones escritas de las fotos de la galería; contratos con proveedores (Supabase en Brasil) con la abogada; la aprobación escrita de la abogada para la fase 1.

## [ ] E34 · Ideas de «Tejedora Artesana Pro» para «Mi emprendimiento» (chat 2, con el chat 1) — después de E11
- Informe: `herramientas/agenda-auditoria/COMPARACION-TEJEDORA-ARTESANA-PRO.md`. Orden propuesto: cronómetro por proyecto → anticipo, cobros parciales y «Saldo por cobrar» → presupuesto en PDF por WhatsApp → pedido y proyecto unidos con materiales reservados → lista de compras que pasa al inventario → medidas y gustos en la ficha de clienta. Revisar primero qué de esto ya existe en nuestras hojas (pedidos, clientas, inventario, proyecto-lana). Ideas, no copia: textos y diseño propios. Fotos a Jennifer antes de publicar.
- **Avance (11-nov):** revisado qué existe (anticipo/saldo ya está casi hecho; lana por proyecto y lista→inventario, en parte). **1. Cronómetro por proyecto: PUBLICADO 11-nov** (`js/agenda/cronometro.js`). Sigue: 2. anticipo, abonos y saldo por cobrar → 3. presupuesto en PDF por WhatsApp → 4. pedido y proyecto unidos con lana apartada → 5. lista de compras al inventario → 6. medidas y gustos de la clienta.
