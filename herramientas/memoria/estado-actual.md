# Estado actual (léelo primero en un chat nuevo)

> Actualizado: 3-nov-2026 (orquestador). **Cada chat reemplaza solo SU renglón de «Por chat»** (máx. 3 líneas, sin agregar renglones nuevos ni tocar los de otros). Lo general lo mantiene el orquestador. El detalle de cada tema está en su archivo (índice en `CLAUDE.md`); el plan hasta la apertura, en `encargos.md`.

**Publicar** = PR a `main` + squash con el visto bueno de Jennifer (la dueña; en archivos antiguos «Sara»); después, la rama de trabajo vuelve a `origin/main`. `rosina-web` desplegada: **v62 del repositorio** (Supabase la numera v61), idéntica al repositorio (3-nov).

**Fechas clave:** la tienda física abre el **domingo 13-dic-2026**; atención normal desde el lunes 14-dic (los textos cambian solos ese día, `js/apertura.js`). Contador 23-nov a 4-dic, conteo físico 7 a 9-dic, ensayo de caja 10 a 12-dic.

## Por chat (cada uno reemplaza solo el suyo)
- **1 · Agenda datos y Google:** publicado: auditoría, arreglos de Calendar, Conexiones etapas 1 y 2 (#525, #528, #530). A medias: interruptor de fotos de Drive (no hecho a propósito: riesgo de perder dibujos); etapas 3 y 4. Falta que Jennifer pruebe Drive y Calendar reales.
- **2 · Agenda diseño y Plus:** publicado #527, #529, #531, #535. A medias: Jennifer revisa en su celular Plus, fichas, portada, dibujo, Rosina y «Abreviaturas» (espera captura); puntos de miles en ferias, costo por ovillo y catálogo.
- **3 · Agenda Rosina e idiomas:** E1 hecho (`rosina-web` desplegada con la etapa 2 y los puntos de miles en `GUIA_AGENDA`); renglones hechos de `PENDIENTES.md` al historial. A medias: 2 preguntas de prueba para Jennifer en `agenda-casa-y-rosina.md`.
- **4 · Tienda y Mercería:** etiquetas al día; plantilla de 34 ítems y `cargar_merceria.py` listos. Espera el Excel y las 34 fotos de Jennifer (E2) y su decisión de si se recoge en el taller antes del 13-dic.
- **5 · Base de datos y pagos:** migración 41 aplicada (`search_path` en 139 funciones); auditoría de guardas. A medias: **A4b** (guarda de rol en `fn_tomar_material_pedido` y `fn_compra_*`, espera los roles), A1 (Jennifer enciende «Leaked password protection» en Auth) y A5.
- **6 · Sitio, SEO y Revista:** E6 hecho en borrador: `herramientas/legal/PAQUETE-ABOGADA.md` (13 puntos); espera el visto bueno de Jennifer. No se tocó `politicas.html`.
- **7 · Universo de Rosina y Academy:** bloque A hecho; «Google Fonts» quitado de `politicas.html#cookies` en el PR #534, **en espera de la abogada**. No regenerar glosario ni paletas hasta actualizar `plantilla-rincon.html`.

## Pendiente de Jennifer
- Google Cloud en **Producción**; prueba real de Drive (dos aparatos) y Calendar; preguntas reales a Rosina.
- Excel de la Mercería, 34 fotos y decisiones del catálogo; roles para A4b; protección de contraseñas en Supabase.
- Revisar el paquete de la abogada y llevárselo; pago real de prueba.

**Reglas de oro:** desplegar `rosina-web` con `nucleo.ts` e `index.ts` COMPLETOS y comparar; todo lo que lea la agenda completa pasa por `lrDibStore`; pruebas de `herramientas/pruebas/` antes de publicar; nada se publica sin el visto bueno de Jennifer.
