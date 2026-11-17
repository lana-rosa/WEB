# Qué mirar en Merchant Center y Search Console (E5, 17-nov-2026)

## Lo que revisó Claude desde el repositorio y la base (hecho el 17-nov-2026)
- El feed `feed-google-merchant` envía hoy **46 productos** (consulta a `obtener_feed_google()`): **22 `in_stock`** (con existencias) y **24 `backorder`** (bajo pedido). Es la misma regla de la tienda (`feed.ts`, migración 26). Los 46 tienen foto; las fotos de muestra existen en `img/productos/` (los 3 personalizados en `.webp`).
- **34 de 46** tienen código de barras de 13 dígitos (el feed valida el dígito de control); los demás salen con `identifier_exists = no`. Es válido para productos hechos a mano.
- Los 31 productos de personaje **no van** al feed (política de marcas de Google).
- Los enlaces del feed son `tienda.html?producto=<id>`: siguen abriendo la ficha aunque la tienda ahora muestre primero las categorías (verificado el 14-nov con prueba local).
- Desde aquí no se puede abrir Merchant Center ni la web en vivo (el entorno bloquea esos sitios). Por eso lo siguiente lo mira Jennifer.

## Lista para Jennifer en Merchant Center (entrar con la cuenta de Google de la tienda)
1. **Productos → Diagnóstico:** ¿hay problemas «Requiere atención» o «Rechazado»? Anotar el texto exacto de cada uno (o foto de pantalla). Revisar sobre todo «disponibilidad no coincide» y «precio no coincide».
2. **Productos → Todos los productos:** ¿cuántos dicen «Aprobado»? Deben ser hasta 46 (43 si los 3 personalizados siguen inactivos).
3. **Crecimiento → Administrar programas → Fichas gratuitas (Free listings):** ¿dice «Activo»? Si dice «Pendiente» o «Sin participar», es la razón principal de que los productos no salgan al buscar.
4. **Ajustes → Envíos y devoluciones:** ¿hay un servicio de envío para Colombia con costo y tiempo, y una política de devoluciones? Sin eso Google no muestra los productos. (Los valores que necesitaría están en `ENVIOS-MERCHANT.md`.)
5. **Productos → Fuentes (feed):** ¿la fuente `feed-google-merchant` aparece «Correcta» y con la última lectura reciente? ¿Cuántos productos leyó?
6. **Ajustes → Información de la empresa / Verificación del sitio:** sitio web verificado y reclamado, dirección y teléfono completos.
7. **Aviso de «Declaración falsa» o «Políticas»:** si hay una suspensión de la cuenta, aparece arriba en rojo: copiar el texto.

## Lista para Jennifer en Search Console (lanarosacrochet.com)
1. **Sitemaps:** ¿`sitemap.xml` figura «Correcto» y con la fecha de lectura reciente?
2. **Inspección de URL:** pegar `https://lanarosacrochet.com/tienda.html` y pulsar «Probar URL publicada»: ¿dice «La URL está disponible para Google»?
3. **Indexación de páginas:** ¿`tienda.html` aparece como «Indexada»? ¿Cuántas páginas «Rastreada, sin indexar»?
4. **Mejoras → Fragmentos de productos:** ¿detecta productos válidos? (La tienda publica un `ItemList` de 77 productos.)

## Qué hace Claude después con lo que Jennifer encuentre
Con las respuestas (texto o fotos de pantalla) se corrige lo que sea del feed o de la web; lo que sea de la cuenta de Google lo hace Jennifer.
