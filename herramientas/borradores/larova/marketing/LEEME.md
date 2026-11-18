# LAROVA · Marketing y comunicación (borrador, 18-nov-2026)

Encargo del Orquestador general (aprobado por Jennifer el 18-nov). Construido y probado sin tocar la base ni el ERP. **Nada está aplicado ni publicado.**

| Archivo | Qué es |
|---|---|
| `01-tablas-marketing.sql` | Tabla nueva y aislada `public.mkt_piezas` (sin llaves a otras tablas). Solo la ven y la cambian las administradoras (RLS con la función existente `fn_rol_actual()`); `anon` sin permisos. **No crea funciones nuevas.** |
| `02-prueba-con-rollback.sql` | Prueba que se deshace sola: la administradora crea y ve; valores raros se rechazan; otra cuenta no ve ni escribe; anon no lee. |
| `marketing.html` | Pantalla aparte para la raíz del repo ERP (junto a `larova.html`): lista y calendario del mes, filtros por marca, plataforma y estado; cada pieza abre su ficha con guion completo, copy, estado, tipo, dónde se publica y fecha. Usa la sesión del ERP; si la cuenta no es administradora, muestra un aviso. No cambia `index.html`. |

## Decisiones de Jennifer
- 18-nov-2026: aprobó cómo se ve la pantalla (fotos de lista, calendario y ficha con datos de ejemplo).

## Campos (los definió el chat 8, `herramientas/memoria/marketing-programacion-esquema.md`, 18-nov-2026)
marca (crochet / academy, siempre separadas) · plataformas (Instagram, Facebook, TikTok, Pinterest, YouTube; varias) · fecha (día) · tipo_publicacion (reel, carrusel, stories, video_youtube, foto) · angulo (la idea en una frase) · objetivos (alcance, confianza, conversión, formación, lista de espera, comunidad; uno o varios, porque el calendario usa «Confianza / conversión») · guion · copy · estado (idea → aprobado → grabado → editado → publicado) · bloque_grabacion (sábado) · notas. La tabla y la pantalla ya están ajustadas a esto y probadas de nuevo.

## Pasos que faltan (en orden)
1. ~~Chat 8 confirma los campos~~ hecho (18-nov).
2. Sí de Jennifer para tocar la base (🔴). Fuera del 12 y 13-dic y de sábados 9 a. m.–7 p. m.
3. Correr `02` (con `01` pegado dentro) → debe terminar en «PRUEBA OK». Luego aplicar `01` y correr el asesor de seguridad.
4. Llevar `marketing.html` al repo ERP (esta sesión no tiene permiso de escritura allá: lo hace un chat del ERP o se da el permiso), cambiar la tarjeta «Marketing y comunicación» de `larova.html` a `./marketing.html` y subir `CACHE_NAME` de `sw.js` si la página entra al caché.
5. Cargar las piezas del calendario de apertura (`herramientas/marketing-agenda/CALENDARIO-APERTURA-11NOV-14DIC.md`) — opcional, con sí de Jennifer.

Prueba de la pantalla: Playwright con la base simulada (4 piezas): filtros 4/2/1/2, calendario con 3 piezas y «Sin fecha», ficha abre, sin desplazamiento horizontal a 390 y 1280 px, cuenta «cajero» bloqueada.
