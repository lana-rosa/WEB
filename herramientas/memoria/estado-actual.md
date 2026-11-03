# Estado actual (léelo primero en un chat nuevo)

> Actualizado: 3-nov-2026. Al terminar cada tarea, actualiza este archivo (máximo ~20 líneas). El detalle de cada tema está en su archivo (índice en `CLAUDE.md`).

**Rama de trabajo:** `claude/sweet-hypatia-6sqpmv`; tras cada publicación se vuelve a `origin/main`. Publicar = PR a `main` + squash con el visto bueno de Jennifer (la dueña; en archivos antiguos aparece como «Sara»).

**Publicado en `main` hasta hoy (#513 a #519):** metas de ahorro y planes con un solo formulario; agenda en celular con un solo fondo y hojas más anchas; letra mínima de 12 px; dibujos y fotos en IndexedDB (fotos a 1600 px; copia en la cuenta sin fotos si pasa de 3 MB); íconos nuevos de Jennifer (Recursos de Rosina, corazón, play, portátil, 123, brújula, disquete, flecha del menú); auditoría de Google (`herramientas/agenda-auditoria/AUDITORIA-GOOGLE.md`); memoria por temas. `rosina-web` desplegada en **v58**.

**Publicado también (#522 a #526):** apertura 13-dic, Excel de finanzas, plantillas de chats (`plantillas-de-chats.md`), fechas reprogramadas, íconos de Google y confeti.

**Orquestador y chats:** plantilla 0 en `plantillas-de-chats.md`. Decidido por Jennifer: orquestador con Opus 5.5 y 7 chats de tema con Sonnet 5.5; cada chat cierra con «Cierre de sesión» (anota en su tema y aquí, máx. 3 líneas).

**Publicado el 3-nov-2026:** #525 (arreglos pequeños de Calendar; `google-calendar` v13 y `rosina-web` v59 desplegadas; auditoría en `herramientas/agenda-auditoria/AUDITORIA-GOOGLE.md`; falta que Jennifer pruebe el chat) y #527 (tarjeta de la prueba gratis al inicio de Configuración, `membresia.js` v4; lista «Hojas de…» arriba en la vista de sección del teléfono). **Etapa 2 de «Conexiones e integraciones» publicada (#530) y puntos de miles (#531); `rosina-web` v61 sigue sin desplegar (encargo E1).** Plan hasta la apertura: `encargos.md`. La etapa 1 ya está en `main` (#528, `rosina-web` v60); Jennifer debe probar el chat. En revisión con Jennifer en su celular: desplazamiento horizontal en abreviaturas (esperar captura).

**Agenda · diseño y Plus (cierre 3-nov):** publicados #527, #529 y #531 (prueba gratis primero en Configuración, «Hojas de…» en la sección del teléfono, solo ✕ al cerrar, puntos de miles en dinero). A medias: Jennifer aún revisa en su celular Plus, fichas, portada, dibujo, Rosina y «Abreviaturas».
Decisiones de Jennifer: lista «Hojas de…» arriba, solo ✕ para cerrar, puntos de miles en toda casilla de dinero. Detalle en `agenda-diseno-y-pantallas.md` y `PENDIENTES.md`.

**Pendiente de Jennifer:**
- Google Cloud: confirmar que la app esté en **Producción** (no «Pruebas»).
- Prueba real de Drive en dos aparatos y de Calendar (actualizar y borrar).
- Probar en su celular: dibujos y fotos grandes tras recargar; «Guardar una copia» con dibujos.
- Preguntarle cosas reales a Rosina (no se puede probar el chat desde el entorno).
- Pago real de prueba de la membresía; revisión de la abogada.

**Lo que puede hacer Claude cuando se le pida (en orden sugerido):**
1. ~~Revisar renglones hechos de `PENDIENTES.md`~~ (hecho el 3-nov-2026: pasaron al historial; fecha de apertura automática corregida al 14-dic).
2. Verificar el tamaño de `agenda.json` con fotos (etapas 1 y 2 de Conexiones y arreglos de Calendar ya están en `main`).
3. Documento de marketing de las funciones; cobro en dólares.

**Fechas clave:** la tienda física abre el **domingo 13-dic-2026** (aplazada desde el 15-nov, 3-nov-2026); atención normal desde el lunes 14-dic. Reprogramado (3-nov): reunión con el contador 23-nov a 4-dic, conteo físico 7 a 9-dic, ensayo de caja 10 a 12-dic.

**Reglas de oro (no olvidar):** desplegar `rosina-web` enviando `nucleo.ts` e `index.ts` COMPLETOS y comparar con lo desplegado; todo lo que lea la agenda completa debe pasar por `lrDibStore`; correr las pruebas de `herramientas/pruebas/` antes de publicar; no publicar sin el visto bueno de Jennifer.
