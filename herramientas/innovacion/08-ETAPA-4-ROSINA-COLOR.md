# 08 · Etapa 4: Rosina con tarjetas de producto y «Busca por color» (16-oct-2026)

**Estado:** construida y probada en la rama `claude/universo-etapa4`. **Sin publicar** hasta que Sara la apruebe. Ya está aplicada en Supabase la migración (aditiva, invisible; tablas vacías). **Falta desplegar la versión 16 de la función `rosina-web`** (se hace al publicar, ver «Cómo se publica»).

Esta etapa tiene tres partes. Las dos primeras son lo que ve la clienta; la tercera es una evaluación escrita que **no activa nada** (`09-OCR-Y-POLITICA-DE-DATOS.md`).

| Parte | Qué cambia para la clienta | Dónde |
|---|---|---|
| 4A · Rosina con tarjetas | Cuando Rosina recomienda un producto, aparece su tarjeta (foto, precio real, «En existencia» o «Por encargo» y enlace a la ficha). Si no tiene el dato, un botón lleva al equipo por WhatsApp. | `js/rosina-chat.js` + función `rosina-web` v16 |
| 4B · Busca por color | En «Rosina te ayuda a regalar», lista «¿Qué color te gusta?» y botón «Buscar por los colores de una foto». | `js/universo/colores.js`, `regalar.js`, `img/productos/colores.json` |
| 4C · Evaluación OCR / IA | Nada visible. Documento con opciones, riesgos y propuesta de política de datos para que decidan Sara y la abogada. | `09-OCR-Y-POLITICA-DE-DATOS.md` |

## 4A · Rosina con tarjetas de producto

**Principio:** el modelo solo *elige* productos por código; el nombre, el precio, la foto, el enlace y si hay existencias salen siempre del catálogo real. Si el modelo inventa un código, simplemente no sale tarjeta (no puede inventar productos ni precios).

Cómo funciona (`herramientas/rosina-web/index.ts` + `nucleo.ts`):
- La función lee `obtener_regalos_web()` (la misma que usa el recomendador: existencia = `stock_actual > 0`), `obtener_tienda_web()` (descripción y medidas) y `obtener_merceria_web_v2()` y arma el catálogo del prompt con un **código corto por producto** (`[T1]`, `[T2]`…). Cada línea dice «en existencia ahora», «por encargo: se teje cuando se pide (elaboración: …)» o «se teje a pedido a partir de tu foto o idea (precio base…)», y los colores de la foto.
- El modelo escribe `[[T12]]` junto a lo que recomienda (máximo 3). La función quita las marcas del texto, valida cada código contra el catálogo y devuelve `{ respuesta, productos: [{id, nombre, precio, foto, url, estado, elaboracion, personaje}], sin_dato }`. Una respuesta antigua (solo `respuesta`) sigue funcionando en el navegador.
- Si el modelo escribe `[[SIN_DATO]]` (no encontró la respuesta y ofrece el WhatsApp), la función lo marca con `sin_dato: true` y el chat muestra el botón «Escribir al equipo por WhatsApp» con un mensaje fijo (no copia lo que escribió la persona).
- **Cambio de comportamiento del texto:** antes el chat decía «disponible» para todo producto visible en la web; ahora distingue «en existencia ahora» de «por encargo» con el inventario real, igual que «Rosina te ayuda a regalar» y la Tienda.

Interfaz (`js/rosina-chat.js`): las tarjetas se arman con `textContent` (nada de lo que llegue se inserta como HTML), el enlace y la foto se construyen con el id y el nombre de archivo codificados, abren en otra pestaña (la conversación no se pierde), miden más de 44 px, se alcanzan con el teclado y llevan la nota «Pieza artesanal inspirada en un personaje; no es un producto oficial» cuando corresponde.

**Medición del costo (nuevo, sin datos personales):** la función suma por día y casa las consultas y los tokens en `rosina_web_consumo` (antes no se medía el gasto por consulta, el primer dato pendiente de la auditoría). No lleva IP, texto ni nada de la persona.

**Registro de preguntas sin respuesta: APAGADO por defecto.** La función solo escribe en `rosina_sin_respuesta` si el secreto `RW_REGISTRAR_SIN_RESPUESTA` vale `1`. Guarda un resumen de máximo 140 caracteres sin correos, teléfonos, cifras largas ni enlaces, la casa y la fecha (sin IP y sin el resto de la conversación) y se borra a los 90 días. **No se enciende hasta que Sara lo decida y se actualice la política de privacidad** (ver 09: el chat ya envía lo que la persona escribe a Anthropic y eso tampoco está descrito hoy en `politicas.html`).

Datos: `migracion-universo-5-rosina.sql` (aplicada el 16-oct): `rosina_web_consumo`, `fn_rosina_registrar_consumo` (solo `service_role`) y `rosina_sin_respuesta`. Probada con transacción revertida y los roles reales: `anon` y `authenticated` no pueden llamar la función ni leer ni escribir las tablas; la casa inválida se ignora o se rechaza; los números negativos se cuentan como 0.

## 4B · Busca por color (búsqueda visual simple)

Es la «búsqueda visual simple» del plan: color y etiquetas, **sin IA y sin subir nada**. Se hizo así a propósito: las fotos de las clientas no salen de su dispositivo.

- **Lista «¿Qué color te gusta?»** (desplegable, como pidió Sara) con los 11 colores de la lista (rosa, rojo, naranja, amarillo, verde, azul o celeste, morado o lila, café, blanco o crema, gris y negro), solo los que alguna pieza tiene. Se combina con los otros filtros; primero salen las piezas cuyo color *principal* es el elegido y luego las que lo llevan de detalle. Cada tarjeta muestra sus colores con puntos (con texto para lectores de pantalla). `?color=rosa` llega ya elegido. Las «Ideas para personalizar» no cambian con el color (en ellas el color lo elige la persona).
- **«Buscar por los colores de una foto»:** la persona elige una foto de referencia (un peluche, una prenda, una decoración), el navegador la reduce a 64 px y calcula sus colores **en su propio dispositivo**; muestra los colores que ve y busca con el primero (se puede cambiar). Verificado con la red vigilada: al elegir la foto no sale ningún pedido (ni POST, ni a otros sitios) y lo que se mide (`regalar_foto_color`) son solo cantidades, nunca el nombre del archivo ni la imagen. Funciona con JPG, PNG y WebP; si el navegador no puede leer el archivo, da un mensaje amable.
- **Cómo se calculan los colores** (`js/universo/colores.js`, un solo código para el navegador y para las fotos de los productos): cada píxel se clasifica en uno de los 11 colores con reglas de matiz, saturación y brillo; se cuenta el centro de la foto y se **descuenta lo que ya aparece en el borde** (la mesa de madera, la pared), para que gane el color de la pieza y no el del fondo.
- **Datos de los productos:** `img/productos/colores.json` (74 fotos; las 3 de los personalizados no llevan color). Lo propone `herramientas/innovacion/colores.py` con esas reglas, **Claude lo revisó a ojo contra cada foto** y los ajustes a mano están en `herramientas/innovacion/colores_datos.py` (57 de 74 se corrigieron; las reglas se equivocan sobre todo con piezas blancas o grises sobre fondo claro y con piezas del color de la mesa). **Sara o el taller pueden revisarlos** (los de la hoja `python3 herramientas/innovacion/colores.py hoja carpeta` salen con foto, nombre y colores). Un producto nuevo no tiene colores hasta correr `python3 herramientas/innovacion/colores.py generar` (como `extras.json`); mientras tanto sigue apareciendo en todos los demás filtros y la prueba avisa si falta alguno.
- Si `colores.json` no carga, desaparecen la lista y el botón de foto y todo lo demás funciona igual.

## Interruptores y reversa
- Color y foto: se apagan quitando `img/productos/colores.json` o con `CONFIG.REGALAR_ACTIVO`; el recomendador queda como en la Etapa 1.
- Tarjetas: si se vuelve a desplegar la función v15 (en `git` está `herramientas/rosina-web/index.ts` de `main`), el chat vuelve a ser solo texto sin romper nada.
- Registro de «sin respuesta»: apagado; para encenderlo, crear el secreto `RW_REGISTRAR_SIN_RESPUESTA=1` en Supabase (después de actualizar la política).

## Cómo se publica (cuando Sara apruebe)
1. (Hecho) Migración `migracion-universo-5-rosina.sql`.
2. Desplegar `rosina-web` v16 (archivos `index.ts` y `nucleo.ts`, `verify_jwt` apagado como la v15) con el MCP de Supabase.
3. PR de la rama `claude/universo-etapa4` a `main` y merge (GitHub Pages despliega solo). El orden 2 y 3 es indiferente: el chat nuevo funciona con la función vieja y la función nueva funciona con el chat viejo.
4. Probar en producción una pregunta por casa (tarjetas, enlaces, WhatsApp si no hay dato), mirar `select * from rosina_web_consumo` (debe tener una fila por día y casa) y confirmar que `rosina_sin_respuesta` sigue vacía.

## Pruebas (todas verdes)
| Prueba | Qué cubre | Comprobaciones |
|---|---|---|
| `node --import ./herramientas/pruebas/rosina_shim/registro.mjs herramientas/pruebas/probar_rosina_funcion.mjs` | El `index.ts` real con la base, el sitio y el modelo simulados: códigos, tarjetas, códigos inventados o repetidos, «sin dato», registro apagado y encendido, límites, fallos, medición | 42 |
| `python3 herramientas/pruebas/probar_rosina_chat.py` | Tarjetas en celular y computador, seguridad (nada como HTML), WhatsApp, respuesta antigua, errores | 31 |
| `python3 herramientas/pruebas/probar_colores.py` | Reglas de color, `colores.json` al día, filtro, foto de referencia sin envío de red, teclado, celular | 73 |
| `probar_regalar.py` (actualizada: ahora 5 filtros sin etiquetas y 7 con ellas) · `probar_crear.py` · `probar_qr.py` · `probar_historias.py` | Lo anterior sigue intacto | 93 · 82 · 41 · 13 |

Los tipos de `index.ts` y `nucleo.ts` se revisaron con `tsc --strict` (con un doble mínimo de `Deno` y de la librería de Supabase): sin errores. Se comprobó que las pruebas de la función fallan si se rompe la lógica (cambiando el máximo de tarjetas y la marca de «sin dato» fallaron las 5 comprobaciones correspondientes).

## Medición (GA4, solo categorías y cantidades; nunca texto de la conversación ni de la foto)
`rosina_tarjetas` (n_tarjetas), `rosina_tarjeta_clic` (item_id, posición), `rosina_sin_respuesta`, `rosina_whatsapp`, `regalar_paso` con `paso=color` (y `origen=foto`), `regalar_foto_color` (n_colores, n_con_piezas).
En la base: `rosina_web_consumo` (consultas, con tarjetas, sin dato, tokens por día y casa).

## Límites conocidos y decisiones pendientes
- **El chat no aparece en `universo-rosina.html` ni en las páginas del Rincón** (`recursos-`, `glosario-`, `paletas-`, `agenda-`, `calculadoras-rosina.html`): `js/rosina-chat.js` se esconde en cualquier página cuyo nombre termine en `rosina.html` (la regla era para `rosina.html`, que ya tiene su propia Rosina). No se cambió en esta etapa; **Sara decide** si el chat debe estar en el universo y en el Rincón.
- Las tarjetas son solo de productos de la **Tienda**; la Mercería no tiene enlace por producto (el catálogo es una sola página), por eso las recomendaciones de lanas siguen en texto.
- Los colores de las fotos son una propuesta revisada por Claude, no por Sara.
- Con el texto de «disponible» cambiado a existencia real, conviene que Sara pruebe 3 o 4 preguntas con productos agotados para confirmar que el tono le gusta.
