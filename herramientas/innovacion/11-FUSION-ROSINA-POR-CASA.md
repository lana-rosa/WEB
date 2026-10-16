# Evaluación: unir los recursos de Rosina con el Universo de Rosina, por casa (17-oct-2026)

## Cómo está hoy
- **Universo de Rosina** (`universo-rosina.html?casa=…`): portada con recorridos (regalar, crear, inspirarte, aprender, elegir lana, aventura). Cada casa ve solo los suyos. Usa un rosado propio (`g-universo`) en el menú y el encabezado dice «crochet» aunque se entre desde Academy.
- **Rincón de Rosina** (`recursos-rosina.html` y sus hijas: glosario, paletas, agenda, calculadoras, abreviaturas, stickers, fondos e íconos, checklist) y **Conoce a Rosina** (`rosina.html`): todo vive en **Academy** (azul), con su propia portada, su propio encabezado ilustrado y su propio menú.
- El menú de Academy ya trae los dos: «Recursos gratis» y «El universo de Rosina» (y en el pie, «Rincón de Rosina» y «La aventura de Rosina»). Para una persona son **dos puertas para lo mismo** («todo lo de Rosina»).
- Cada casa muestra lo suyo, pero **no todo lo de Rosina es de Academy**: las calculadoras de lana sirven en Mercería; los stickers, fondos y «Cuida tu pieza» (QR) sirven en Tienda; el glosario y las paletas sirven en las tres.

## Propuesta recomendada: una sola puerta «Rosina» por casa, con los colores de esa casa
1. **Un solo hub:** el Universo pasa a ser la portada de todo lo de Rosina y absorbe la portada del Rincón. Mismo componente, mismo orden, tres versiones (`?casa=`): 
   - **Tienda:** regalar · crear · cuida tu pieza · stickers y fondos · conoce a Rosina.
   - **Mercería:** elegir lana (calculadoras) · paletas de color · glosario · abreviaturas · conoce a Rosina.
   - **Academy:** aprender · agenda · glosario · calculadoras · recursos gratis · aventura de los niños · conoce a Rosina.
2. **Colores de la casa:** el Universo deja el rosado propio y toma los acentos de la casa desde la que se entra (`html[data-casa]`), igual que el resto del sitio; el encabezado y el menú también cambian según `?casa=`.
3. **Una barra «Rosina» en todas sus páginas** (glosario, paletas, agenda, calculadoras, recursos, conoce a Rosina, aventura): una fila corta «🐑 Rosina · Inicio · Regalar/Aprender/Recursos · Aventura», con los colores de la casa de origen, para que siempre se sepa dónde se está y se pueda volver al hub.
4. **Un solo enlace en el menú** por casa: «🐑 Rosina» (reemplaza «El universo de Rosina» + «Recursos gratis/Rincón»), y el pie queda con una sola columna «Rosina».
5. **No mover las direcciones** (`/glosario-rosina.html`, etc.): ya están en Google, en Pinterest y en PDFs. Solo cambia lo que se ve; `recursos-rosina.html` queda como página de recursos (la lista completa) enlazada desde el hub.

## Qué cambiaría para la persona
- Antes: entra por «Recursos gratis» o por «El universo», ve dos portadas distintas y colores distintos.
- Después: entra por «Rosina», ve una portada con lo que le sirve en esa casa, en los colores de esa casa, y las páginas internas llevan la barra para volver.

## Esfuerzo y riesgos
- **Medio (1–2 sesiones):** hub (`universo-rosina.html`), barra Rosina (un fragmento que genera `sincronizar_encabezado.py`), menú y pie (generador), colores por casa (`css/universo.css` + `comun.css`) y pruebas (`probar_regalar.py`, revisión de enlaces, celular y computador).
- **Riesgos:** (a) que un mismo recurso (glosario) se vea en tres casas con colores distintos: se resuelve con `?casa=` y el recuerdo de la última casa; (b) el chat de Rosina no sale en las páginas `*rosina.html` (decisión pendiente de Sara); (c) SEO: no se tocan títulos ni direcciones, solo el menú.
- **Qué NO se toca:** la aventura de los niños (sin cookies ni medición, a propósito) conserva su propio estilo y solo recibe el enlace de vuelta.

## Alternativas
- **A (la recomendada):** hub único «Rosina» por casa + barra en las páginas + menú único.
- **B (mínima):** solo unificar colores y poner la barra «Rosina» en las páginas, sin tocar los menús ni las portadas. Rápida, pero siguen dos puertas.
- **C (completa):** además, mover las páginas a una carpeta `/rosina/…` con redirecciones. Más limpio a futuro, pero con riesgo de perder enlaces y posicionamiento; no se recomienda ahora.

## Decisiones que necesito de Sara
1. ¿Opción A, B o C?
2. ¿Cómo quiere llamar a la puerta: «Rosina», «El universo de Rosina» o «El rincón de Rosina»?
3. ¿El chat de Rosina puede aparecer también en las páginas de recursos (hoy no sale)?
