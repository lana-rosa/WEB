# 06 · Etapa 2: «Rosina te ayuda a crear» (configurador de personalizados, 16-oct-2026)

**Estado:** construida y probada en la rama `claude/universo-etapa2`. **No está publicada** hasta que Sara la apruebe (toca `personaliza.html`, que tiene el pago con Wompi).

## Qué es
Un configurador guiado, en `universo-rosina.html#crear` (la tarjeta «Rosina te ayuda a crear» del universo ahora lleva ahí). En cinco pasos la persona arma la **ficha** de su personalizado:
1. ¿Qué quieres que tejamos? (persona, mascota, pareja, personaje, recuerdo pequeño/llavero, regalo especial).
2. ¿De qué tamaño? Los mismos de Personaliza (amigurumi 10, 13, 15, 20 cm; llavero 4, 5, 6 cm). Se muestra el **precio base real** de los «Amigurumi personalizado» de 13, 15 y 20 cm (leído del catálogo); 10 cm y los llaveros dicen «te lo cotizamos».
3. Detalles (opcional): gafas, ropa específica, color de ojos, accesorios, cabello o peinado, cada uno con su casilla para explicar cómo es. Son los que las Preguntas frecuentes ya dicen que se pueden tejer.
4. Tu idea (texto) y colores importantes.
5. Ocasión y fecha en que lo necesita (opcional). No se promete ningún plazo: «te confirmamos si alcanzamos esa fecha antes de empezar».

Un resumen «Tu ficha» se actualiza en vivo. Al terminar hay dos salidas:
- **Continuar con mi pedido:** guarda la ficha en este dispositivo y abre `/personaliza.html?desde=crear#pide-el-tuyo`, que precarga tipo, tamaño, descripción y mensaje (todo editable) y muestra un aviso con el resumen, «Cambiar mi ficha» (vuelve al configurador con todo puesto) y «Descartar la ficha». La persona sube sus fotos, pone sus datos y envía como siempre: **el formulario, `crear_solicitud_personalizada`, el radicado y el pago con Wompi no cambiaron**.
- **Enviarla por WhatsApp:** abre `wa.me/573205072801` con la ficha escrita.

## Cómo viaja la ficha (sin cambios en la base de datos)
La ficha se escribe como texto legible en los dos campos que la función ya tiene: `p_descripcion` (`[Amigurumi — 15 cm] Quiero tejer: una mascota. / Detalles que quiero: … / Colores importantes: … / Mi idea: …`) y `p_mensaje` (ocasión, fecha y la marca «Ficha armada con Rosina te ayuda a crear»). El taller la ve en Oportunidades del ERP como cualquier solicitud, con las opciones ya ordenadas. Verificado con una solicitud de prueba revertida (transacción con ROLLBACK): la ficha queda intacta y cabe en los límites (3.000 caracteres por campo; el configurador limita cada texto).

## Archivos
`js/universo/crear.js` (configurador; `armarFicha` y `textoWhatsApp` son funciones puras), `js/universo/ficha.js` (guardar/leer la ficha en este dispositivo), `js/universo/datos.js` (catálogo compartido con el recomendador: una sola petición), `js/universo/config.js` (interruptor `CREAR_ACTIVO`, `FICHA_VIDA_HORAS`, opciones `IDEAS_CREAR`, `TAMANOS_CREAR`, `DETALLES_CREAR`, `OCASIONES_CREAR`), `css/universo.css`, `universo-rosina.html` y `personaliza.html` (precarga + aviso).

## Privacidad y seguridad
- Sin cuentas, sin fotos y sin datos personales en el configurador: la ficha solo guarda las opciones elegidas y los textos de la idea, **en este dispositivo** (`localStorage.lrFichaCrear`), 24 horas, y se borra al enviar la solicitud. No se manda nada a ningún servidor mientras se arma (solo se pide el catálogo público).
- Lo que lee Personaliza se valida: tipo y tamaño deben existir, los textos se recortan a 2.800 caracteres y todo se inserta como texto (nunca como HTML). Una ficha vencida, dañada o manipulada se ignora.
- Los eventos de medición no llevan lo que la persona escribe.

## Interruptor
`CONFIG.CREAR_ACTIVO = false` en `js/universo/config.js`: la sección del configurador se oculta y la tarjeta «crear» vuelve a llevar a `/personaliza.html`. Personaliza sigue funcionando igual sin ficha.

## Pruebas (`python3 herramientas/pruebas/probar_crear.py [carpeta_capturas]`)
63 comprobaciones con el catálogo real y Supabase simulado: reglas de `armarFicha`, vocabulario idéntico al de Personaliza y sin fechas que la marca no celebra, pasos y resumen en vivo, validación accesible, precios base reales, recorrido completo configurador → Personaliza → solicitud (lo que recibe la función), WhatsApp, ficha que vuelve a abrirse, ficha vencida o manipulada, medición sin texto libre, fallo del catálogo, interruptor, celular y computador sin scroll horizontal ni errores de JavaScript. `probar_regalar.py` (93) sigue pasando.

## Lo que NO se hizo y necesita decisión de Sara o del taller
1. **Confirmar las opciones.** La lista sale de lo que el sitio ya dice; el taller debe confirmar o ajustar: tipos, tamaños (en especial el precio de 10 cm y de los llaveros), detalles que se ofrecen (¿hay otros? ¿alguno con costo adicional?), límites (por ejemplo, ¿cuántas piezas máximo en una pareja?).
2. **Selector de colores.** Hoy los colores son texto libre. Un selector real necesita la **paleta de lanas que usa el taller** (¿las del catálogo de la Mercería u otra?). Con esa lista se agrega fácil (Etapa 2b).
3. **Pareja (dos piezas).** El precio base es por pieza; hoy la ficha lo aclara con «te confirmamos antes de empezar». Si hay un valor fijo para parejas, se agrega.
4. **Ficha estructurada en el ERP.** Hoy es texto ordenado. Si se quiere filtrar por detalle (por ejemplo «con gafas») hay que agregar una columna jsonb a `oportunidades_venta` y mostrarla en Oportunidades (cambia el ERP: se prueba aparte).
5. **Imagen conceptual con IA:** no se construye (propiedad intelectual sin resolver, ver `02-ARQUITECTURA-Y-ROADMAP.md`).
