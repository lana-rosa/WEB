# Conexiones, etapa 4 — Drive visible (plan para aprobar, 10-nov-2026)

Objetivo: que la persona guarde en SU Drive, en una carpeta que ella ve y abre («Agenda para tejedoras»), el Excel, el informe del mes y las copias de seguridad. Hoy la copia en Drive es una carpeta oculta (`drive.appdata`) que solo la agenda abre.

## Propuesta (recomendada)
- **Conexión aparte** («Guardar informes y copias en tu Drive»), con su propio aviso antes de conectar (como E30) y su propia casilla. No se mezcla con la conexión de sincronización, para que cada permiso tenga un solo propósito y se pueda quitar por separado.
- **Permiso `drive.file`** (no sensible): la app solo ve los archivos que ella misma crea; no puede leer el resto del Drive. No exige verificación de Google.
- **Qué se sube, solo cuando la persona lo pide:** botón «Guardar en mi Drive» junto a «Exportar a Excel» y «Guardar una copia» (copia .json). El informe del mes en PDF queda para después: hoy sale por el cuadro de imprimir del navegador y la app no genera el PDF por sí sola.
- **Orden de la carpeta:** `Agenda para tejedoras / Excel`, `/ Copias`; el nombre lleva la fecha; no se borra nada solo.
- **Datos:** van del navegador a su Drive, no pasan por Lana Rosa (igual que la sincronización).

## Piezas y quién las hace
1. **Función `google-drive`** (Supabase): aceptar un segundo permiso guardado aparte (`tipo` = archivos) y entregar la llave de corta vida. Requiere una migración (columna o tabla nueva) y desplegar la función. **Cambia la base y pide permisos nuevos: va con aviso a Jennifer y revisión de la abogada.**
2. **Google Cloud (Jennifer):** en Acceso a los datos agregar `.../auth/drive.file` al cliente «Agenda de Rosina».
3. **Navegador** (chat 1): módulo nuevo `drive-archivos.js`, aviso antes de conectar, botones, tarjeta en «Conexiones e integraciones», pruebas con Drive simulado.
4. **Textos** (chat 6 + abogada): `politicas.html#datos`, apartado 12, y el aviso de conexión.
5. **Guía de Rosina** (chat 3).

## Decisiones que necesito de Jennifer
1. ¿Conexión aparte con su propio aviso? (recomendado: sí).
2. ¿Empezamos con Excel y copias, y dejamos el PDF para después? (recomendado: sí).
3. Cuando esté listo el código: agregar el permiso `drive.file` en Google Cloud.
