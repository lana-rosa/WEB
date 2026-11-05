# Estado actual (léelo primero en un chat nuevo)

> Actualizado: 3-nov-2026 (orquestador). **Cada chat reemplaza solo SU renglón de «Por chat»** (máx. 3 líneas, sin agregar renglones nuevos ni tocar los de otros). Lo general lo mantiene el orquestador. El detalle de cada tema está en su archivo (índice en `CLAUDE.md`); el plan hasta la apertura, en `encargos.md`.

**Publicar** = PR a `main` + squash con el visto bueno de Jennifer (la dueña; en archivos antiguos «Sara»); después, la rama de trabajo vuelve a `origin/main`. `rosina-web` desplegada: **v62 del repositorio** (Supabase la numera v61), idéntica al repositorio (3-nov).

**Fechas clave:** la tienda física abre el **domingo 13-dic-2026**; atención normal desde el lunes 14-dic (los textos cambian solos ese día, `js/apertura.js`). Contador 23-nov a 4-dic, conteo físico 7 a 9-dic, ensayo de caja 10 a 12-dic.

## Por chat (cada uno reemplaza solo el suyo)
- **1 · Agenda datos y Google:** publicado: auditoría, arreglos de Calendar, Conexiones etapas 1 y 2 (#525, #528, #530). A medias: interruptor de fotos de Drive (no hecho a propósito: riesgo de perder dibujos); etapas 3 y 4. Falta que Jennifer pruebe Drive y Calendar reales.
- **2 · Agenda diseño y Plus:** PUBLICADO: «Mi cuenta» (#574), tarjetas B (#577), «Ventas y gastos» pasos 1 y 2 (#582, #591), «Mis números» y sin lista «Hojas de…» en la hoja principal (#607). E11: `FINANZAS-PROPUESTA.md` y `REVISION-HOJAS-PROPUESTA.md` (10 preguntas pendientes).
  PUBLICADO 5-nov (#612): modo oscuro Claro/Oscuro/Como el celular + contraste de tarjetas y letra gris (E19+E25+E26) + buscador con un solo recuadro; `css/agenda-oscuro.css` se genera con `herramientas/agenda-oscuro/generar_oscuro.py`. Sigue el paso 3 de dinero «Resumen del emprendimiento» y el grupo personal.
  A medias: Jennifer revisa en su celular Plus, fichas, portada, dibujo, Rosina y «Abreviaturas»; chat 3: EN/PT de «Claro u oscuro», «Mis números» y `GUIA_AGENDA`.
- **3 · Agenda Rosina e idiomas:** E1 y E29 cerrados; texto de bebés aprobado. `rosina-web` Supabase v69 = «v75» del repo (idéntica): ya explica el modo claro/oscuro (#612). EN/PT del modo oscuro revisados, correctos. A medias: Jennifer prueba «¿Cómo pongo la agenda en modo oscuro?».
- **4 · Tienda y Mercería:** publicado (5-nov): tienda sin «Ver más» y miniaturas 16 % más livianas. Espera el Excel de la Mercería y las 34 fotos (bloque B).
- **5 · Base de datos y pagos:** E12 hecho: nadie puede ver ni borrar la copia de agenda de otra persona (prueba con 2 cuentas inventadas, sin tocar clientas); cifrado con clave propuesto, no hecho. A medias: Jennifer recorre la lista de seguridad (las contraseñas filtradas no se pueden en el plan gratis: aceptado) y prueba A4b en el ERP.
- **6 · Sitio, SEO y Revista:** paquete de la abogada listo (`herramientas/legal/PAQUETE-ABOGADA.md`; proveedora = Sara Loaiza Muñoz, casilla de patrones propuesta). E9 revisado: `apertura.js`, `activar_apertura.py` y el flujo coinciden (14-dic). Falta: fecha de cookies (espera sí de Jennifer), aviso de apertura en el inicio y recogida en taller.
- **7 · Universo de Rosina y Academy:** bloque A hecho (pruebas del tema en verde). El texto de cookies («Google Fonts») pasó al chat 6 y a la abogada: ya no va en mi PR. A medias: actualizar `plantilla-rincon.html` antes de regenerar glosario y paletas; bloques B (Jennifer) y C (abogada).
- **8 · Marketing y contenido:** Jennifer decidió (3-nov): tono inclusivo, la Agenda se llama CrochetLab, carrito mixto Tienda+Mercería = sí (a construir, chats 4 y 5). Falta elegir línea de contenido y E10 (apertura 13-dic).

## Pendiente de Jennifer
- Google Cloud en **Producción**; prueba real de Drive (dos aparatos) y Calendar; preguntas reales a Rosina.
- Excel de la Mercería, 34 fotos y decisiones del catálogo; roles para A4b; protección de contraseñas en Supabase.
- Revisar el paquete de la abogada y llevárselo; pago real de prueba.

**Reglas de oro:** desplegar `rosina-web` con `nucleo.ts` e `index.ts` COMPLETOS y comparar; todo lo que lea la agenda completa pasa por `lrDibStore`; pruebas de `herramientas/pruebas/` antes de publicar; nada se publica sin el visto bueno de Jennifer.
