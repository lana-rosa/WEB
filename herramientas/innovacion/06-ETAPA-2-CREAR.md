# 06 · Etapa 2: «Rosina te ayuda a crear» dentro de Personaliza (16-oct-2026)

**Estado:** publicada el 16-oct-2026 (a pedido de Sara, con el ajuste de dejar todo en una sola página).

## Qué es
En `personaliza.html`, en «Pide el tuyo aquí», la persona elige **cómo prefiere pedirlo** (dos opciones, la primera marcada):
1. **🐑 Rosina te ayuda a crear:** asistente guiado de cinco pasos que arma la ficha del personalizado.
2. **📝 Diligencia el formulario:** el formulario directo de siempre (tipo, tamaño, qué quieres, mensaje).

Las dos formas reemplazan **solo la parte «tu idea»**. Las fotos de referencia, el nombre, el teléfono, el correo, la ciudad, las autorizaciones y el botón «Enviar mi solicitud» son los mismos y se piden **una sola vez, abajo**, bajo el título «Tus fotos y tus datos». No hay segundo formulario ni se pregunta nada dos veces (la prueba lo comprueba comparando las preguntas visibles de cada modo).

### Pasos del asistente
1. ¿Qué quieres tejer? (persona, mascota, pareja, personaje, recuerdo pequeño/llavero, regalo especial).
2. ¿De qué tamaño? Los mismos de Personaliza (amigurumi 10, 13, 15, 20 cm; llavero 4, 5, 6 cm). Se muestra el **precio base real** de los «Amigurumi personalizado» de 13, 15 y 20 cm (los de la tienda); 10 cm y los llaveros dicen «te lo cotizamos».
3. Detalles (opcional): gafas, ropa específica, color de ojos, accesorios, cabello o peinado, cada uno con su casilla para explicar cómo es (son los que las Preguntas frecuentes ya dicen que se pueden tejer).
4. Tu idea (texto) y colores importantes.
5. Ocasión, fecha en que lo necesita y mensaje para la tarjeta (todo opcional). No se promete plazo: «te confirmamos si alcanzamos esa fecha antes de empezar».

Un resumen «Tu ficha» se actualiza en vivo y ofrece «Enviarla por WhatsApp» y «Empezar de nuevo». Cuando la persona termina, sube sus fotos, completa sus datos y envía: **la solicitud (`crear_solicitud_personalizada`), el radicado y el pago con Wompi no cambiaron**.

### Cómo se elige el modo
- Sin parámetros: asistente (es la opción recomendada).
- `?modo=guiado`: asistente (lo usa la tarjeta «Rosina te ayuda a crear» del universo). `?modo=formulario`: formulario directo.
- Enlaces que ya existían siguen igual: desde la tienda (`?producto=…&tipo=…&tamano=…`) y desde «Personalízalo» (`?inspiracion=…`) abren el formulario directo con todo preelegido; los del inicio «¿Qué podemos tejer para ti?» (`?idea=mascota`…) abren el asistente con esa idea ya elegida.
- Al pasar del asistente al formulario directo se lleva lo ya elegido (tipo, tamaño, descripción, mensaje) sin pisar lo que la persona haya escrito allá; al volver, el asistente conserva sus respuestas.

## Cómo viaja la ficha (sin cambios en la base de datos)
La ficha se escribe como texto legible en los campos que la función ya tiene: `p_descripcion` (`[Amigurumi — 15 cm] Quiero tejer: una mascota. / Detalles que quiero: … / Colores importantes: … / Mi idea: …`) y `p_mensaje` (ocasión, fecha, mensaje para la tarjeta y la marca «Ficha armada con Rosina te ayuda a crear», más las autorizaciones de siempre). El taller la ve en Oportunidades del ERP con las opciones ya ordenadas. Verificado con una solicitud de prueba revertida (transacción con ROLLBACK): queda intacta y cabe en los límites (3.000 caracteres por campo; el asistente limita cada texto).

## Archivos
`js/universo/crear.js` (`montarGuia`; `armarFicha` y `textoWhatsApp` son funciones puras), `js/universo/config.js` (interruptor `CREAR_ACTIVO` y opciones `IDEAS_CREAR`, `TAMANOS_CREAR`, `DETALLES_CREAR`, `OCASIONES_CREAR`), `css/universo.css` (también cargado por `personaliza.html`), `personaliza.html` (elección de modo, carga del asistente, envío) y `universo-rosina.html` (la tarjeta «crear» lleva a Personaliza).

## Privacidad, seguridad y respaldo
- El asistente no guarda nada en el dispositivo, no pide fotos ni datos personales y no envía nada a ningún servidor mientras se arma; los eventos de medición no llevan lo que la persona escribe (`crear_modo`, `crear_inicio`, `crear_paso`, `crear_whatsapp`, `crear_solicitud`).
- Se carga con `import()` dentro de un `try`: si el módulo falla o `CREAR_ACTIVO` es `false`, **Personaliza queda solo con el formulario de siempre** (sin elegir modo) y se puede enviar igual.
- Enter dentro del asistente no envía el formulario; al enviar, el asistente valida primero sus pasos obligatorios y avisa con foco y `role="alert"`; los campos del modo oculto no se validan (`fieldset` deshabilitado).

## Pruebas (`python3 herramientas/pruebas/probar_crear.py [carpeta_capturas]`)
82 comprobaciones con el catálogo real y Supabase simulado: reglas de `armarFicha`, vocabulario idéntico al de Personaliza y sin fechas que la marca no celebra, **ninguna pregunta repetida** en cada modo y solo lo compartido (fotos y contacto) en común, paso de un modo al otro, precios base reales, validación accesible, lo que recibe `crear_solicitud_personalizada` en modo guiado y en modo formulario, enlaces que ya existían, WhatsApp, medición sin texto libre, interruptor, asistente que no carga, celular y computador sin scroll horizontal ni errores de JavaScript. `probar_regalar.py` (93) sigue pasando.

## Lo que NO se hizo y necesita decisión de Sara o del taller
1. **Confirmar las opciones.** La lista sale de lo que el sitio ya dice; el taller debe confirmar o ajustar: tamaños (en especial el precio de 10 cm y de los llaveros), detalles que se ofrecen (¿hay otros? ¿alguno con costo adicional?), límites (por ejemplo, ¿cuántas piezas máximo en una pareja?).
2. **Selector de colores.** Hoy los colores son texto libre. Un selector real necesita la **paleta de lanas que usa el taller** (¿las del catálogo de la Mercería u otra?).
3. **Pareja (dos piezas).** El precio base es por pieza; hoy la ficha lo aclara con «te confirmamos antes de empezar». Si hay un valor fijo, se agrega.
4. **Ficha estructurada en el ERP.** Hoy es texto ordenado. Para filtrar por detalle («con gafas») habría que agregar una columna jsonb a `oportunidades_venta` y mostrarla en Oportunidades (cambia el ERP: se prueba aparte).
5. **Imagen conceptual con IA:** no se construye (propiedad intelectual sin resolver, ver `02-ARQUITECTURA-Y-ROADMAP.md`).
