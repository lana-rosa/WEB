# Sincronización de la agenda de Rosina con Google Calendar

Estado (8-oct-2026): **ACTIVO y probado por Sara** (proyecto de Google Cloud `lana-rosa-web`, cliente OAuth "Agenda de Rosina", app en producción sin verificar: hasta 100 personas, con el aviso "Google no ha verificado esta app"). Pendiente: enviar la verificación a Google (ver paso 7) para quitar el aviso y el límite. Antes: el código estuvo publicado pero apagado. La tarjeta "Google Calendar" de `agenda-rosina.html` solo aparece cuando la Edge Function `google-calendar` responde que está configurada (es decir, cuando existen los 4 secretos de abajo). Mientras tanto, la agenda sigue con los botones "Añadir a Google Calendar" y el archivo `.ics`, que no necesitan permisos.

## Cómo funciona
- La clienta (con sesión) toca **Conectar con Google Calendar** → la función la manda a Google → Google pide permiso `calendar.events` (crear y editar eventos; no lee otros eventos) → vuelve a la función, que guarda el permiso **cifrado** (AES-GCM) en `google_calendar_cuentas` y la regresa a la agenda.
- La agenda manda a la función la lista de fechas (pedidos, proyectos, fechas especiales, clientas, ficha, feria) con una "clave" estable por renglón (`pedido:3`). La función crea, actualiza o borra solo lo que cambió (tabla `google_calendar_eventos` guarda qué evento de Google corresponde a cada renglón) en el calendario principal de la clienta.
- Sincroniza solo, 4 segundos después de editar la agenda, o con "Sincronizar ahora". "Desconectar" revoca el permiso en Google y borra lo guardado (los eventos ya creados se quedan en su calendario).
- La agenda sigue guardándose solo en el dispositivo; al servidor solo viajan las fechas y sus textos, cuando la persona conecta su calendario.

## Lo que debe hacer Sara (una sola vez)
1. Entrar a https://console.cloud.google.com con la cuenta de Lana Rosa y **crear un proyecto** ("Lana Rosa Agenda").
2. **APIs y servicios → Biblioteca → Google Calendar API → Habilitar.**
3. **APIs y servicios → Pantalla de consentimiento de OAuth:** tipo *Externo*; nombre "Lana Rosa Crochet"; correo de soporte `contacto@lanarosacrochet.com`; dominio autorizado `lanarosacrochet.com`; enlace de política de privacidad `https://lanarosacrochet.com/politicas.html#datos`; en *Permisos (scopes)* agregar solo `.../auth/calendar.events` (más `openid` y `email`). Mientras la app esté en "Pruebas" solo la pueden usar hasta 100 correos agregados como *usuarios de prueba* (sirve para empezar).
4. **Credenciales → Crear credenciales → ID de cliente de OAuth → Aplicación web.** En *URI de redireccionamiento autorizados* poner exactamente: `https://ngjoognzvehwjtpqwrqe.supabase.co/functions/v1/google-calendar`
5. En Supabase → Edge Functions → Secrets guardar:
   - `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` (los del paso 4)
   - `CALENDAR_TOKEN_KEY` = un texto largo al azar (40 caracteres o más; no hace falta `openssl`)
   - `CALENDAR_STATE_SECRET` = un texto largo al azar
6. Recargar la agenda: la tarjeta aparece sola.
7. **Para abrirla a todo el público:** en la pantalla de consentimiento, *Publicar aplicación* y enviar la **verificación** a Google (el permiso `calendar.events` es "sensible": piden política de privacidad, dominio verificado en Search Console y un video corto mostrando cómo se usa; suele tardar de días a unas semanas). Antes de eso, la política de datos debe mencionar el uso de Google Calendar (ver `herramientas/borrador-politica-datos.md`).

## Archivos
- `google-calendar.ts`: la Edge Function (nombre `google-calendar`, `verify_jwt = false`, valida la sesión dentro).
- Tablas `google_calendar_cuentas` y `google_calendar_eventos` (RLS activa y sin políticas: solo la función las toca).
- `agenda-rosina.html`: tarjeta y módulo al final de la página; `window.lrAgenda` entrega los eventos.
