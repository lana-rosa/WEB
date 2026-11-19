# LAROVA · Marketing y comunicación (borrador, 18-nov-2026)

Encargo del Orquestador general (aprobado por Jennifer el 18-nov). **Tabla APLICADA en la base el 18-nov-2026 con el sí de Jennifer** (migración `larova_marketing_mkt_piezas`). La pantalla todavía NO está en el ERP.

| Archivo | Qué es |
|---|---|
| `01-tablas-marketing.sql` | Tabla nueva y aislada `public.mkt_piezas` (sin llaves a otras tablas). Solo la ven y la cambian las administradoras (RLS con la función existente `fn_rol_actual()`); `anon` sin permisos. **No crea funciones nuevas.** |
| `02-prueba-con-rollback.sql` | Prueba que se deshace sola: la administradora crea y ve; valores raros se rechazan; otra cuenta no ve ni escribe; anon no lee. |
| `marketing.html` | Pantalla aparte para la raíz del repo ERP (junto a `larova.html`): lista y calendario del mes, filtros por marca, plataforma y estado; cada pieza abre su ficha con guion completo, copy, estado, tipo, dónde se publica y fecha. Usa la sesión del ERP; si la cuenta no es administradora, muestra un aviso. No cambia `index.html`. |

## Decisiones de Jennifer
- 19-nov-2026 (pedido vía Orquestador / chat 8): color por marca. Jennifer dijo SÍ el 19-nov (falta que un chat del ERP copie el archivo): barra lateral de cada pieza y mini del calendario con el color de la marca (Crochet `#E74E96` / fondo `#FBE4EF`; Academy `#1F6FDB` / fondo `#E8F1FF`), etiqueta de marca con su fondo, leyenda arriba; el estado sigue en la etiqueta y en un punto. «Aprobado» pasó de azul a verde azulado `#0f8b8d` para no confundirse con Academy. Probado con 11 piezas reales (390 y 1280 px, sin desplazamiento horizontal). El `marketing.html` del repo ERP era idéntico al borrador antes de este cambio: basta copiar este archivo encima.
- 18-nov-2026: dijo SÍ a crear la tabla. Prueba con rollback: «PRUEBA OK» (admin crea y ve, valor raro rechazado, otra cuenta no ve ni escribe, anon sin permiso). Verificado después: RLS forzado, una sola política, anon sin SELECT, 0 filas, sin llaves a otras tablas; asesor de seguridad: ningún aviso de `mkt_piezas` (los 4 avisos que da ya existían). Ojo: el primer intento con `drop policy if exists` se colgó (sin dejar nada); se quitó esa línea.
- 18-nov-2026: aprobó cómo se ve la pantalla (fotos de lista, calendario y ficha con datos de ejemplo).

## Campos (los definió el chat 8, `herramientas/memoria/marketing-programacion-esquema.md`, 18-nov-2026)
marca (crochet / academy, siempre separadas) · plataformas (Instagram, Facebook, TikTok, Pinterest, YouTube; varias) · fecha (día) · tipo_publicacion (reel, carrusel, stories, video_youtube, foto) · angulo (la idea en una frase) · objetivos (alcance, confianza, conversión, formación, lista de espera, comunidad; uno o varios, porque el calendario usa «Confianza / conversión») · guion · copy · estado (idea → aprobado → grabado → editado → publicado) · bloque_grabacion (sábado) · notas. La tabla y la pantalla ya están ajustadas a esto y probadas de nuevo.

## Pasos que faltan (en orden)
1. ~~Chat 8 confirma los campos~~ hecho (18-nov).
2. ~~Sí de Jennifer, prueba con rollback, aplicar y asesor~~ hecho 18-nov.
4. Llevar `marketing.html` al repo ERP (esta sesión no tiene permiso de escritura allá: lo hace un chat del ERP o se da el permiso), cambiar la tarjeta «Marketing y comunicación» de `larova.html` a `./marketing.html` y subir `CACHE_NAME` de `sw.js` si la página entra al caché.
5. Cargar las piezas del calendario de apertura (`herramientas/marketing-agenda/CALENDARIO-APERTURA-11NOV-14DIC.md`) — opcional, con sí de Jennifer.

Prueba de la pantalla: Playwright con la base simulada (4 piezas): filtros 4/2/1/2, calendario con 3 piezas y «Sin fecha», ficha abre, sin desplazamiento horizontal a 390 y 1280 px, cuenta «cajero» bloqueada.

## Respuesta del chat 8 (guardada tal cual)
### Respuesta del chat de Marketing y contenido (18-nov-2026)

Campos propuestos: marca, título, tipo, plataformas, estado, fecha y hora, guion completo, copy, línea de contenido, código del calendario, enlace de la publicación y notas. **Está casi completo.** Ajustes:
- **Falta Pinterest** en plataformas (Crochet publica carruseles ahí): Instagram, Facebook, TikTok, Pinterest y YouTube.
- **Falta «objetivo»**: alcance, confianza, conversión, formación, lista de espera o comunidad (el calendario lo usa en cada fila).
- **Falta «bloque de grabación»**: la fecha del sábado en que se graba la pieza (campo opcional).
- **Tipo:** agregar «foto» además de reel, carrusel, historia y video de YouTube.
- **No hacen falta campos aparte** para hashtags, llamado a la acción, música ni tomas: los hashtags y el llamado a la acción van dentro del copy; la lista de tomas y la música, dentro del guion o de las notas. Los hashtags pueden diferir por plataforma, así que el copy debería poder variar por plataforma (opcional).
- **Responsable** no es necesario por ahora: Jennifer aprueba todo y Sara administra el calendario.
- **Marca** (Crochet o Academy) es obligatoria y las dos nunca se mezclan en una pieza.
Origen del esquema base: `herramientas/memoria/marketing-programacion-esquema.md`.

**Cómo quedó:** todo lo pedido está en la tabla (Pinterest, objetivo, bloque de grabación, foto; sin campos aparte de hashtags, música ni responsable). «Copy distinto por plataforma» (opcional) queda para después, si Jennifer lo pide.
