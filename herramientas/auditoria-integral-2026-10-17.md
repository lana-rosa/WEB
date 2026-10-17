# Auditoría integral — informe final (17-oct-2026)

Resumen de lo que se revisó, corrigió y quedó pendiente. Solo se afirma lo que se ejecutó; lo demás figura como pendiente.

## Correcciones realizadas

| ID | Problema | Archivos principales | Solución | Prueba ejecutada | Resultado |
|---|---|---|---|---|---|
| H1 | Plazos de entrega contradictorios (1 semana, 15 días, siguiente día hábil) | `politicas.html`, `tienda.html`, FAQ, `personaliza.html`, `llms.txt`, Revista | Una sola regla: disponible = despacho el siguiente día hábil; bajo pedido o personalizado = 8 días hábiles + despacho el siguiente día hábil | Búsqueda de los plazos en todo el sitio | Sin contradicciones |
| H2 | Correos de carrito abandonado sin consentimiento | `js/pago.js`, `politicas.html`, base (`carritos_abandonados.acepta_at`, `fn_enviar_carritos_abandonados`) | Casilla opcional y desmarcada; solo escribe a quien aceptó; baja y re-suscripción permitidas | Navegador a 390 px: sin casilla no hay petición; con casilla se guarda. Base: 9 carritos guardados, 0 con aceptación, ninguno recibe correos | Aprobado |
| H3 | GTM desde la primera visita | — | Sara comprobó en la vista previa de GTM que tras «Rechazar» no se envía nada a GA4 | `prueba_consentimiento.py` (15 comprobaciones) | Aprobado (la prueba de GTM la hizo Sara) |
| H4 | `diag-secretos` activa | — | Ya responde 410 y exige sesión: no se tocó | Lectura del código desplegado | Sin riesgo |
| H5 | Bucket `guias-envio` público | — | Decisión de Sara: queda público (hoy sin datos) | Estado del bucket | Pendiente si se suben guías con datos personales |
| H8 | PayPal con referencias en el código | `js/pago.js` | `PAYPAL_ACTIVO = false`; en la base ya estaba inactivo | Navegador: no aparece el selector de país | Aprobado |
| H7 | Código de `wompi-webhook` fuera del repo | `herramientas/cuentas-clientes/funciones/` | Copia guardada | — | Faltan copias de otras funciones |
| H9 | Encabezados de la Revista saltaban a h3; `politicas.html` sin Open Graph | Revista, `politicas.html` | h1 → h2; etiquetas OG | `revisar_enlaces.py`, revisión de títulos | Aprobado |
| — | Accesibilidad: 27 fallos de axe-core (contraste, selectores sin nombre, botón vacío) | CSS y páginas | Corregidos | axe-core en 16 páginas a 390 y 1280 px | 0 fallos |
| H10 | «(apertura: 15 de noviembre de 2026)» quedaba tras abrir, en 10 páginas | `herramientas/activar_apertura.py` | El script lo quita el 16-nov | Ejecución en una copia, repetida | Aprobado |
| — | Fotos de color de la Mercería sin aviso de que son aproximadas | `merceria/catalogo/index.html` | Nota en la ficha | Playwright con datos simulados a 390 y 1280 px | Aprobado |
| — | Rendimiento (inicio, tienda, Personaliza, universo, Mercería, Academy) | Varias | Fotos por tamaños, miniaturas, precargas, aviso de cookies al inicio del body, reserva de espacio (CLS) | Emulación local con red lenta y CPU 4x | Mejoró en local; PageSpeed varía mucho entre corridas |
| — | Ajustes de rendimiento que causaban «brinquitos» | PR 362 | Se revirtieron | Revisión de Sara | Resuelto |
| — | Ícono de carrito distinto en computador y celular | `tienda.html`, Mercería, cuenta | SVG propio | Revisión visual | Aprobado |
| — | Nombres de producto con medidas en cm | `tienda.html`, `regalar.js`, `rosina-chat.js` | Se quitan al mostrar (los 3 personalizados las conservan) | `probar_regalar` y `probar_rosina_chat` | Aprobado |

## Revisado sin necesidad de cambios

- Tarifas de envío en la base (Villamaría $8.000, Manizales $13.000, resto $18.000) = política, tienda, contacto y FAQ.
- Precios publicados coinciden entre páginas y `llms.txt`.
- Pedido con referencia única; botón de pagar se bloquea al primer clic; `gracias.html` lee el estado del servidor.
- Webhook de Wompi: verifica firma, vuelve a consultar a Wompi, compara el monto y no degrada pedidos pagados.
- RLS en todas las tablas de clientes; bucket de fotos de personalización privado, límite 8 MB y tipos validados en el servidor.
- Agenda de Rosina: 90 días de conservación y aviso 15 días antes coinciden con la política; membresía apagada y rechazada por el servidor.
- Mercería: producto agotado con botón deshabilitado. Rosina: sin coincidencias ofrece alternativas y el fallo del chat no bloquea.
- PWA: manifiestos, íconos y service worker; sin conexión muestra `/offline.html`.

## Pruebas (17-oct-2026, sobre `main` en `22e29f2`)

Aprobadas, 0 fallas: menús 151, regalar 114, crear 84, casas de Rosina 55, chat de Rosina 31, colores 73, ampliar 24, suscripción 13, lista de espera 24, QR 41, historias 13, visor 3D 54, cuento de Rosina 82, función de Rosina 43, consentimiento (15 filas, todas OK). Fallidas: ninguna.

Enlaces internos rotos: 0 antes (481 URLs) y 0 después (482 URLs); 0 rutas relativas.

## Pendiente o sin verificar

- **PageSpeed:** medir de nuevo en celular (inicio, tienda, Personaliza, Mercería, Academy, universo) tras los últimos despliegues, 3 veces cada una. Solo hay mediciones locales y las capturas de Sara anteriores a los últimos cambios (inicio móvil 75, tienda 67, Personaliza 88, universo 88, Academy 76, Mercería entre 97 y 75).
- **Lector de pantalla** (VoiceOver/TalkBack): no probado.
- **Pagos:** no se hizo ningún pago de prueba contra el sandbox de Wompi desde el entorno de revisión (sin acceso a la red del proveedor). Pendiente un pago real de prueba.
- **Indexación en Google:** sin evidencia de Search Console.
- **Supabase:** activar la protección contra contraseñas filtradas; 137 funciones del ERP sin `search_path` fijo y funciones `SECURITY DEFINER` ejecutables por anon (las RPC públicas son intencionales; las del ERP se revisan con calma). Los avisos siguen iguales que al inicio.
- **Decisiones de Sara:** aplazar o no GTM; campos de nivel y proyecto en la lista de espera de Academy; plazo de conservación de las fotos de referencia de Personaliza (Sara decidió el 17-oct que se pida una autorización expresa para obtenerlas y guardarlas; queda como siguiente fase).
- **Revisión jurídica:** retracto en el catálogo no personalizado, garantías, conservación de fotos, plazo de 90 días de la Agenda.

## Alcance

No se tocaron colores ni identidad de marca, no se hicieron pagos ni envíos reales, no se cambiaron credenciales ni precios dentro de la auditoría (los cambios de precios que pidió Sara fueron antes y aparte). Los cambios en la base de datos fueron la casilla de consentimiento del carrito abandonado (`acepta_at` y la función de envío).

---

# Verificación complementaria de cobertura (17-oct-2026, solo lectura)

No se modificó ninguna página, política ni configuración; no se publicó nada. Evidencia por aparición: `herramientas/auditoria-inventario-enlaces-2026-10-17.csv` (una fila por enlace o recurso: página de origen, archivo y línea, destino, resultado, estado, evidencia y corrección recomendada) y `herramientas/auditoria-inventario-paginas-2026-10-17.csv` (una fila por página: ruta, robots, sitemap, enlaces entrantes, canonical).

## 1. Qué cobertura faltaba

- **El verificador existente (`revisar_enlaces.py`) cubre menos de lo que parecía.** Revisa `a[href]`, `form[action]`, `data-href` y recursos (CSS, JS, imágenes) de las páginas que no están en `herramientas/`. **No revisa:** anclas (`#…`), enlaces externos (los cuenta, no los visita), `mailto:`/`tel:`/WhatsApp, rutas que arma JavaScript, `url()` de los CSS, imágenes que llegan desde la base de datos, ni las 28 páginas HTML de `herramientas/`. Su «482 URLs, 0 rotos» que cité antes salía de un servidor **local**, no de producción; esa cifra no debe leerse como prueba de la web publicada.
- **La revisión de producción no corre sola tras publicar.** El flujo `revisar-enlaces.yml` debería dispararse al terminar «pages build and deployment», pero no lo hizo en ninguna de las ~25 publicaciones del 17-oct: las 16 ejecuciones del 7 y 8-oct fueron manuales, y la única automática fue la programada del 12-oct (45 páginas, 1.638 enlaces internos, 286 externos sin comprobar, 0 errores), anterior a unas 100 publicaciones.
- **Páginas bajo `herramientas/` (28 HTML)** no estaban en el inventario: se publican (el sitio tiene `.nojekyll` y no hay lista de exclusión), aunque `robots.txt` les pide a los buscadores no indexarlas.

## 2. Verificaciones adicionales realizadas

| Verificación | Cómo | Alcance |
|---|---|---|
| Inventario de páginas | `git ls-files` (todas las `.html`), contraste con `sitemap.xml`, `noindex`, canonical y enlaces entrantes (HTML + rutas en JavaScript) | 87 páginas |
| Todas las apariciones de enlaces y recursos | Análisis del HTML (`a`, `area`, `form`, `data-href`, `link`, `script`, `img`/`srcset`, `source`, `meta og/twitter`), de las rutas entre comillas en los `.js` y `<script>` en línea, de los `url()` de CSS, de los manifiestos y del sitemap, con archivo y línea | 9.203 apariciones |
| Resolución como GitHub Pages | Archivo, carpeta con `index.html` o nombre sin `.html`; sensible a mayúsculas; rutas relativas y prefijos duplicados (`/merceria/merceria/`) | todas las internas |
| Anclas | `#id` contra los `id`/`name` del destino; las que resuelve JavaScript se leyeron en el código | 180 anclas + las de enlaces con `#` |
| HTTP real | Petición a cada ruta interna única contra un servidor local con los mismos archivos | 541 rutas internas únicas |
| DOM renderizado | Navegador real (Chromium) en las 59 páginas públicas a 390 y 1280 px, con datos de la base simulados: se recogieron los `href` que existen tras ejecutar JavaScript, los HTTP ≥ 400 y los errores de consola | 2.146 pares (página, enlace); 325 los genera JavaScript |
| Imágenes que dependen de la base | `foto_url` de `obtener_tienda_web`, `obtener_regalos_web` y `obtener_merceria_web_v2` contra `img/productos/` y `img/productos-mini/` | 111 fotos |
| **Producción** | Se lanzó a mano el flujo de producción (corre en GitHub, con internet y solo lee): ejecución 18, 17-oct 17:30 UTC, sobre `main` en `ad3b1cd` | 69 rutas rastreadas |

**Resultado de producción (ejecución 18):** 69 rutas rastreadas, 2.767 enlaces internos vistos, 441 externos (**no comprobados por esa herramienta**), 362 recursos únicos, canonical 53; ninguna ruta distinta de 200, ningún recurso roto. Limitaciones: rastrea el HTML tal como lo sirve el sitio (no el que genera JavaScript); sigue enlaces desde `/` y el sitemap, así que no llega a páginas sin enlaces entrantes; cuenta rutas, no archivos (por eso 69 y no 59).

## 3. Totales y cómo se calcularon

| Concepto | Total |
|---|---|
| Páginas HTML descubiertas | **87** (59 del sitio + 28 bajo `herramientas/`) |
| Del sitio: en el sitemap / `noindex` intencional | 50 / 9 (3d-prueba, 404, baja-recordatorios, cuenta, gracias, offline, p, revista/index, rosina) |
| Indexables fuera del sitemap | 0 |
| Páginas sin ningún enlace entrante | 4, todas `noindex` y esperadas (404, gracias —llega desde Wompi—, baja-recordatorios —llega por correo—, 3d-prueba —oculta a propósito—) |
| Páginas revisadas | 87 en estático; 59 en navegador (118 cargas); 69 rutas en producción |
| Apariciones de enlaces y recursos identificadas | **9.203** (3.615 enlaces HTML, 3.866 rutas entre comillas en JS/HTML —incluye atributos HTML repetidos—, 1.606 recursos, 50 sitemap, 20 CSS, 12 manifiestos, 34 fotos desde la base) |
| Verificadas | **8.800** |
| Problemas confirmados | **36** (2 enlaces y 34 fotos) |
| Pendientes de comprobar | **367** (todas externas; 22 URLs únicas) |
| Destinos internos únicos / externos únicos | 541 / 22 |

Cobertura = verificadas ÷ identificadas = 8.800 / 9.203 = 95,6 %; las 367 pendientes **no** se cuentan como exitosas, y las 36 con problema tampoco. «Verificado» significa: el destino existe en el repositorio (y responde 200 en el servidor local), el ancla existe, o el formato del correo/WhatsApp es válido. **No** significa que el destino externo responda, ni que un correo llegue, ni que WhatsApp abra.

## 4. Problemas confirmados

| # | Dónde (archivo:línea) | Evidencia | Corrección recomendada |
|---|---|---|---|
| 1 | `preguntas-frecuentes.html:271` | El índice enlaza a `#faq-4` «Talleres», pero la página solo tiene los grupos `faq-1`, `faq-2` y `faq-3` (líneas 275, 292, 309) | Crear el grupo «Talleres» con `id="faq-4"` o quitar el enlace |
| 2 | `recursos-rosina.html:468` | Enlaza a `/rosina.html#tip-rosina`; `rosina.html` ahora solo redirige a `/universo-rosina.html#conoce-a-rosina` y ese ancla ya no existe (enlace a una versión antigua, con salto extra) | Apuntar a `/universo-rosina.html#conoce-a-rosina` |
| 3–36 | Base de datos (`foto_url`) | 34 productos de la Mercería (`lana-chelin-kusi-kusi-*`, `lana-ecological-cotton-papatya-*`, `lana-happy-chenille-dmc-*`, `lana-papatya-love-papatya-*`, `lana-polar-kusi-kusi-blanco-03`) tienen foto en la base y **no existe el archivo** ni la miniatura. Lista en `fotos_faltantes` del CSV. Hoy no se ven porque la Mercería no tiene existencias | Subir las 34 fotos a `img/productos/` y correr `generar_miniaturas_productos.py` (ya estaba en `PENDIENTES.md`) |

Hallazgos de proceso (no son enlaces):
- **El flujo de producción no se dispara tras publicar** (evidencia en la sección 1). Corrección recomendada: revisar la condición `workflow_run` o lanzarlo desde el propio flujo de despliegue; mientras tanto corre los lunes (próxima: 19-oct).
- **Archivos internos servidos públicamente (probable, no comprobado en producción):** con `.nojekyll` y sin lista de exclusión, `PENDIENTES.md`, `CLAUDE.md` y `herramientas/` (plantillas, scripts, correos, informes como este) deberían poder abrirse escribiendo su dirección; `robots.txt` los excluye de los buscadores pero no impide abrirlos. Comprobación: abrir `https://lanarosacrochet.com/PENDIENTES.md`. Corrección posible: no publicar esas carpetas (por ejemplo, otra rama de publicación o una carpeta `docs/`) o quitar del repositorio lo sensible.

Descartados tras revisarlos: las anclas de las calculadoras (`#lana`, `#contador`, `#costos`, `#aumentos`, `#muestra`) y las rutas `#/mapa`, `#/pasaporte`, `#/ayuda`, `#/adultos` del cuento no existen en el HTML pero las resuelve JavaScript (leído en `calculadoras-rosina.html:1388` y `aventuras-de-rosina/js/app.js`; no probado haciendo clic); `404.html:41` (`/merceria.html`) es la redirección intencional de una dirección antigua; `{{ .ConfirmationURL }}` y `{{URL}}` de `herramientas/` son marcadores de plantilla.

## 5. Pendientes de comprobar y por qué

| Elemento | Motivo | Procedimiento para completarlo |
|---|---|---|
| **341 apariciones externas del sitio y 26 de `herramientas/` (22 URLs únicas):** Instagram (perfil, publicación y 8 reels), Facebook, TikTok, YouTube, `share.google` (2 enlaces), Google Maps, política de datos de Google, GTM, Supabase | El entorno de revisión no tiene salida a internet (el proxy responde 403 a estos hosts) y la herramienta de producción no visita enlaces externos | `curl -sIL <url>` de cada una desde una red con internet (lista en el CSV, columna `destino`, `clase = externo`). Las redes sociales a veces responden 403/429 a programas aunque la página exista: confirmarlas abriéndolas en un navegador |
| Destino real de los 171 enlaces de WhatsApp y de los correos | Solo se validó el formato y que el número sea 573205072801 | Abrir uno por tipo de página desde un celular |
| Archivos internos públicos (`PENDIENTES.md`, `herramientas/…`) | No hay acceso desde aquí a la web publicada | Abrir las direcciones en un navegador |
| Anclas que resuelve JavaScript | Se leyó el código, no se hizo clic | Abrir `/calculadoras-rosina.html#lana` y `#costos` y comprobar que se abre la herramienta |
| Catálogo de la Mercería con datos reales | Sin existencias, la página muestra «Muy pronto»; se probó con datos simulados | Repetir cuando haya productos con existencias |
| Comparación exacta repositorio ↔ producción | La herramienta cuenta rutas, no archivos, y no llega a páginas sin enlaces entrantes (`gracias`, `baja-recordatorios`, `3d-prueba`) | Abrir esas 3 direcciones y comprobar que responden 200 |

## 6. ¿La auditoría está completa?

**Sigue siendo parcial.** Con evidencia: las 87 páginas están inventariadas, todas las apariciones internas están resueltas (8.800 verificadas, 0 rutas internas rotas), las 59 páginas públicas se probaron en navegador y producción respondió 200 en las 69 rutas rastreadas el 17-oct. Sin evidencia todavía: los 22 destinos externos, el contenido de producción más allá de lo que rastrea la herramienta, y las comprobaciones manuales de la tabla anterior. Se declarará completa cuando se cierren esas pendientes o se acepten por escrito.
