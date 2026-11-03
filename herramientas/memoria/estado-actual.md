# Estado actual (léelo primero en un chat nuevo)

> Actualizado: 3-nov-2026. Al terminar cada tarea, actualiza este archivo (máximo ~20 líneas). El detalle de cada tema está en su archivo (índice en `CLAUDE.md`).

**Rama de trabajo:** `claude/sweet-hypatia-6sqpmv`; tras cada publicación se vuelve a `origin/main`. Publicar = PR a `main` + squash con el visto bueno de Jennifer (la dueña; en archivos antiguos aparece como «Sara»).

**Publicado en `main` hasta hoy (#513 a #519):** metas de ahorro y planes con un solo formulario; agenda en celular con un solo fondo y hojas más anchas; letra mínima de 12 px; dibujos y fotos en IndexedDB (fotos a 1600 px; copia en la cuenta sin fotos si pasa de 3 MB); íconos nuevos de Jennifer (Recursos de Rosina, corazón, play, portátil, 123, brújula, disquete, flecha del menú); auditoría de Google (`herramientas/agenda-auditoria/AUDITORIA-GOOGLE.md`); memoria por temas. `rosina-web` desplegada en **v58**.

**Publicado el 3-nov-2026:** #525 (arreglos pequeños de Calendar; `google-calendar` v13 y `rosina-web` v59 desplegadas; auditoría en `herramientas/agenda-auditoria/AUDITORIA-GOOGLE.md`; falta que Jennifer pruebe el chat) y #527 (tarjeta de la prueba gratis al inicio de Configuración, `membresia.js` v4; lista «Hojas de…» arriba en la vista de sección del teléfono). **En la rama (PR #528, etapa 1 de «Conexiones e integraciones», `rosina-web` v60 ya desplegada y verificada):** esperando merge; Jennifer debe probar el chat. En revisión con Jennifer en su celular: desplazamiento horizontal en abreviaturas (esperar captura).

**Pendiente de Jennifer:**
- Google Cloud: confirmar que la app esté en **Producción** (no «Pruebas»).
- Prueba real de Drive en dos aparatos y de Calendar (actualizar y borrar).
- Probar en su celular: dibujos y fotos grandes tras recargar; «Guardar una copia» con dibujos.
- Preguntarle cosas reales a Rosina (no se puede probar el chat desde el entorno).
- Pago real de prueba de la membresía; revisión de la abogada.

**Lo que puede hacer Claude cuando se le pida (en orden sugerido):**
1. Revisar con Jennifer qué renglones de `PENDIENTES.md` ya están hechos sin marcar.
2. Etapa 1 del centro de conexiones («Conexiones e integraciones»); antes, arreglos pequeños de Calendar y verificar el tamaño de `agenda.json` con fotos.
3. Documento de marketing de las funciones; cobro en dólares.

**Plan de base de datos y pagos (3-nov, solo plan):** asesor de seguridad sin errores, 5 avisos (ver nota en `base-de-datos-y-cuentas.md`); A2b y A3 hechos (migración 41, `search_path` fijado); A1/A2 revisados (A2 sin cambios; A1 lo enciende Jennifer en el panel); lo siguiente es probar Wompi de punta a punta, decidir la protección de contraseñas filtradas y revisar `fn_es_tejedora`/`fn_rol_actual` abiertas a `anon`.

**Fechas clave:** la tienda física abre el **domingo 13-dic-2026** (aplazada desde el 15-nov, 3-nov-2026); atención normal desde el lunes 14-dic. Reprogramado (3-nov): reunión con el contador 23-nov a 4-dic, conteo físico 7 a 9-dic, ensayo de caja 10 a 12-dic.

**Reglas de oro (no olvidar):** desplegar `rosina-web` enviando `nucleo.ts` e `index.ts` COMPLETOS y comparar con lo desplegado; todo lo que lea la agenda completa debe pasar por `lrDibStore`; correr las pruebas de `herramientas/pruebas/` antes de publicar; no publicar sin el visto bueno de Jennifer.
