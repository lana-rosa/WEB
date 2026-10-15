# 07 · Etapa 3: cuidados e historia de cada pieza con código QR (16-oct-2026)

**Estado:** publicada el 16-oct-2026. Sara aprobó las 77 piezas (`historias-piezas-revisado.xlsx`, cargadas con `migracion-universo-4-historias-revisadas.sql`). La migración SQL (aditiva) está aplicada en Supabase. **Falta imprimir:** primero una hoja de prueba escaneada con el celular.

## Qué es
Cada pieza puede llevar una etiqueta con un código QR que abre `https://lanarosacrochet.com/p/?i=<id de la pieza>&o=etiqueta`. Esa página (`p/index.html`, `noindex`, fuera del sitemap) muestra:
- el nombre, la foto, la categoría y las medidas de la pieza (lo que la tienda ya publica);
- los **cuidados**: los de esa pieza y, debajo, los generales que el sitio ya publica en sus dos guías de la Revista (sin secadora, secar a la sombra, guardar sin humedad, si se suelta un hilito escribir por WhatsApp). Si el taller validó los cuidados de la pieza, aparece «✔ Revisados por el taller para esta pieza»; si no, no se afirma nada de más;
- **«Su historia»** y el material, **solo si el taller los aprobó**;
- botones: guía completa de cuidados, WhatsApp, reseñas en Google (`Cuéntanos cómo te fue`), regalar otra pieza y personalizar.

`/p/` sin código (o con uno inválido, o de una pieza que ya no está en el catálogo) muestra la página general «Cuida tu pieza de Lana Rosa». Sirve para el **QR general** de la tarjeta que se mete en los pedidos personalizados (`/p/?o=tarjeta`), porque esas piezas no están en el catálogo.

El código es el `id` (uuid) del producto: **sigue valiendo si el producto cambia de nombre** (Q1). Los QR salen de una dirección de 91 caracteres, versión 5: pocos módulos, escanean bien aunque la etiqueta sea pequeña.

## Datos (migración `migracion-universo-3-historias.sql`, aplicada el 16-oct)
- Tabla `producto_historia(item_id, historia, cuidados_validados, material_notas, publicado, revisado_por, revisado_en, …)`: RLS sin políticas y sin acceso directo para `anon`/`authenticated`. No toca `inventario_items` ni el ERP.
- Función pública `obtener_producto_publico(p_id uuid)` (SECURITY DEFINER): devuelve solo id, nombre, categoría, foto, descripción, especificaciones, cuidados, si están validados, historia y material. Los datos salen de `obtener_tienda_web()` (ya públicos) más lo aprobado. **La historia, el material y los cuidados validados solo salen con `publicado = true` Y `revisado_en` no nulo.**
- Verificado en la base con transacciones revertidas: Q1 (cambiar el nombre no rompe el código), Q2 (aprobar y despublicar cambia lo que sale, sin tocar la página; publicado sin `revisado_en` no sale), Q3 (las columnas públicas son exactamente esas diez; `anon` no puede leer la tabla; un id inexistente no devuelve nada) y la petición REST real con la llave pública (200).

## Hoja del taller (`historias.py`)
`python3 herramientas/innovacion/historias.py hoja herramientas/pruebas/fixtures/tienda-cuidados.json` crea `historias-piezas.xlsx` con las 77 piezas: los cuidados que dice hoy la web, una columna con esos mismos cuidados para que el taller los **confirme o corrija** (una frase por línea), material e historia opcionales y «¿Publicar? Sí/No». `historias.py cargar hoja.xlsx` escribe el SQL de aprobación (solo lo marcado «Sí»; límites de largo; rechaza fechas que la marca no celebra). El SQL se revisa y se corre aparte, como con las etiquetas.

**Hoja de Sara (16-oct-2026):** las 77 piezas con «Sí»; confirmó los cuidados tal como estaban («No usar secadora»; el Bolso ZARIA con dos líneas, y la Base para amigurumi sin cuidados propios), escribió una historia por pieza (180 a 254 caracteres) y no puso notas de material. Cargado y verificado: 77 filas, `publicado` y `revisado_en` en todas, huella md5 igual a la hoja; la función pública devuelve la historia y «cuidados revisados» (la lectura REST pasa con la llave pública y la tabla sigue cerrada para `anon`). Las historias hablan del «personaje» o de una pieza «inspirada» sin afirmar que sea un producto oficial; se conserva el aviso de pieza inspirada. Un producto nuevo no tiene historia hasta que Sara la apruebe en la hoja.

## QR para imprimir (`herramientas/qr/generar_qr.py`)
Requisitos: `pip install segno playwright`. Sin servicios externos: los QR no se envían a ningún tercero.
- `python3 herramientas/qr/generar_qr.py --datos piezas.json --salida carpeta [--tamano 30]` → un SVG por pieza (con su medida real en mm), `hoja-etiquetas.pdf` (A4, 30 mm por QR por defecto, mínimo 20) y `urls.csv`.
- `python3 herramientas/qr/generar_qr.py --generico --salida carpeta` → `tarjeta-general.pdf` (85 × 55 mm).
- `piezas.json`: `select json_agg(json_build_object('id', id, 'nombre', nombre) order by nombre) from obtener_tienda_web();`
- Antes de imprimir todo: **imprimir una hoja de prueba y escanearla con el celular**.

## Privacidad
Página pública sin cuentas ni datos personales. Evento `qr_visita` con el id de la pieza (o `generico`) y el origen (`etiqueta`, `tarjeta`, `estanteria`, `qr`); sin cookies nuevas. La historia es contenido del taller, no de clientas ni de tejedoras (Q3).

## Interruptor
`CONFIG.QR_ACTIVO = false` en `js/universo/config.js`: `/p/` deja de consultar la base y muestra solo la página general. Para retirar la etapa: no imprimir etiquetas (las ya impresas seguirán mostrando la página general).

## Pruebas
- `python3 herramientas/pruebas/probar_qr.py [carpeta_capturas]` (41): la página en todos sus casos (con y sin historia, cuidados validados sin repetir frases, pieza inexistente, códigos inválidos o maliciosos, error de la base, interruptor, texto con HTML), celular y computador sin scroll horizontal ni errores de JavaScript, y los QR **se leen de verdad** (se decodifican con OpenCV, también tal como quedan en la hoja impresa, uno por uno y midiendo los 30 mm). Esta prueba detectó un error mío: los QR de la primera versión de la hoja salían cortados; ya está corregido.
- `python3 herramientas/pruebas/probar_historias.py` (13): la hoja del taller y su SQL (aprobación, comillas, límites, fechas que la marca no celebra).

## Pendiente de decisión de Sara o del taller
1. **Validar los cuidados por pieza.** Hoy 75 piezas dicen solo «No usar secadora» y el bolso Zaria dos frases. El taller debe confirmar o corregir (¿peluches con relleno distinto? ¿macetas y flores? ¿llaveros?). Además, las dos guías de la Revista dicen cosas un poco distintas (una explica cómo lavar a mano; la otra, limpiar con paño húmedo y «nada de lavadora»): conviene unificarlas.
2. **Historias.** Las escribe el taller (2 a 4 frases); no se inventan.
3. **Qué piezas llevan QR y dónde** (etiqueta colgante, tarjeta, estantería) y si se imprime la tarjeta general para los personalizados.
4. **Opcional:** pantalla en el ERP para escribir historias y cuidados sin pasar por Excel (cambia el ERP; se prueba aparte), y un enlace a `/p/` desde el correo de gracias.
