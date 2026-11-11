# E30: registro de autorizaciones de Google, registros de errores y desconexión (informe técnico del chat 5)

> **Fecha:** 11-nov-2026. Respuesta a la abogada (aviso de Google, E30), puntos (a), (b) y (c). **Solo lectura: no se cambió nada en la base ni en las funciones.** Lo que no se pudo probar está marcado.

## (a) Conservar cada autorización: fecha, hora, funcionalidad y copia del texto exacto
**Hoy NO se conserva.** El aviso (`js/agenda/aviso-conexion.js`) solo devuelve «sí/no» a la página; no escribe nada en el servidor. Las tablas de Google (`google_calendar_cuentas`, `google_drive_cuentas`, `google_drive_archivos_cuentas`) guardan solo: usuaria, permiso cifrado, correo de Google, fechas de sincronización. No hay fecha de autorización, ni qué funcionalidad se autorizó, ni el texto. La única tabla parecida, `agenda_nube_consentimientos` (copia en la nube), guarda fecha, acción y **número de versión**, no el texto.

**Propuesta (no hecha; es cambio de base de datos, 🔴, requiere el sí de Jennifer):**
1. Tabla `textos_autorizacion` (servicio, versión, **texto exacto**, huella SHA-256, fecha): solo se agrega, **nunca se actualiza ni se borra** (disparador que lo impide). Cuando cambie un texto se crea una versión nueva; la anterior queda intacta.
2. Tabla `autorizaciones_google` (usuaria, servicio `calendar|drive|archivos`, acción `autoriza|desconecta`, versión, huella, fecha y hora **del servidor**): también solo se agrega.
3. Al tocar «Conectar», la página manda el texto exacto que mostró y su versión; la función `conectar` guarda el texto (si la huella es nueva) y la autorización **antes** de mandar a la persona a Google. También se registra la desconexión.
4. Ambas tablas con seguridad por filas cerrada (solo funciones y el administrador) y copiadas en la copia diaria cifrada.
5. **Decisión de la abogada:** cuánto tiempo se conserva este registro como prueba (aunque la persona se desconecte o borre su cuenta) y decirlo en la política de datos.

## (b) ¿Los registros guardan el contenido de los eventos de Calendar?
**No, con una excepción menor que debe declararse.**
- **Función `google-calendar` desplegada (versión 13):** no tiene ninguna instrucción de escribir en el registro (`console.log/error`); los errores se tragan sin guardar contenido. Verificado leyendo el código desplegado el 11-nov-2026.
- **Registros de la plataforma (Supabase):** `function_logs` (11-nov) solo contiene «booted» y «shutdown»; `function_edge_logs` y `edge_logs` guardan metadatos de cada llamada (método, dirección, estado, **IP**, país y ciudad aproximados, navegador, identificador de la usuaria), **sin el cuerpo de la solicitud**, que es donde viaja el contenido de los eventos.
- **Nuestra base:** `google_calendar_eventos` guarda solo `clave`, `event_id` de Google y una **huella HMAC** del evento (no se puede leer el contenido). Ninguna columna de las tablas de Google contiene títulos, detalles o lugares.
- **Excepción:** la vuelta de Google al conectar es una llamada GET cuya dirección lleva `?code=…&state=…` (código de autorización de un solo uso y el «state» firmado). La plataforma guarda la dirección completa. Riesgo bajo (el código caduca y se usa una vez), pero conviene declararlo y, si la abogada lo pide, quitarlo cambiando el flujo.
- ❓ **Plazo de conservación de los registros de la plataforma:** depende del plan de Supabase; no confirmado.

## (c) Desconexión: qué se borra y qué permanece (según el código; NO se probó con una cuenta de Google real)
**Desde la app (botón «Desconectar»):**
| | Calendar | Drive |
|---|---|---|
| En Google de la persona | Se **borra** el calendario «Agenda para tejedoras» con todas sus fechas | **Permanece** el archivo de la agenda, las fotos de dibujos y hasta 5 versiones en la carpeta oculta de la app (el código dice que el navegador las borra si la persona lo pide) |
| Permiso | Se **revoca** en Google | Se **revoca** en Google |
| En nuestra base | Se borran `google_calendar_cuentas` y `google_calendar_eventos` | Se borra `google_drive_cuentas` |
| Permanece | Los registros de la plataforma (punto b), por su plazo; **hoy no hay registro de la autorización (punto a)** | Igual |

**Desde la cuenta de Google (la persona quita el acceso en los permisos de su cuenta):**
- Google invalida el permiso, pero **nuestra base no se entera** hasta la siguiente sincronización. Ese día el código detecta que venció y borra la fila de la cuenta (`*_cuentas`), **pero en Calendar no borra `google_calendar_eventos`** (quedan filas huérfanas con `clave`, `event_id` y huella, sin contenido) y el calendario «Agenda para tejedoras» **permanece** en su Google porque ya no tenemos permiso para borrarlo.
- Si la persona nunca vuelve a abrir la agenda, **su permiso cifrado queda guardado indefinidamente**. No hay limpieza programada para esto.
- **Propuestas (no hechas):** (1) al detectar el permiso vencido, borrar también `google_calendar_eventos`; (2) tarea diaria que revise cuentas sin sincronizar hace X días (propongo 90) y las borre; (3) en el aviso, decir que si se quita desde Google, el calendario creado debe borrarlo la persona. (4) ❓ Confirmar en Google dónde se borran los «datos ocultos de la app» de Drive para dar esas instrucciones.

## Estado actual en la base (11-nov-2026, solo conteos)
1 conexión de Calendar, 1 de Drive, 2 filas de mapa de eventos.

## Para la prueba real de desconexión (pendiente, necesita a Jennifer)
Con su cuenta ya conectada: (1) yo anoto el estado «antes» en la base; (2) ella toca «Desconectar» en la agenda; (3) yo verifico qué filas se borraron; (4) ella confirma en Google Calendar que el calendario desapareció y en los permisos de su cuenta de Google que el acceso ya no está; (5) se repite quitando el acceso desde la cuenta de Google. **Ojo:** borra su calendario «Agenda para tejedoras» real y revoca los permisos; se vuelve a conectar después.
