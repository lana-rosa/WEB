# Sincronización de la agenda de Rosina con Google Calendar

Estado (29-oct-2026): **ENCENDIDO otra vez** por pedido de Sara, gratis con la cuenta (tarjeta en `agenda-rosina.html`, módulo `js/agenda/google-calendar.js`; función `google-calendar` v12 desplegada y con sus 4 secretos). **Usa el permiso NO sensible `calendar.app.created`** (declarado en Google Auth Platform → Acceso a los datos junto con `openid` y `userinfo.email`, 29-oct): crea un calendario aparte «Agenda para tejedoras» en la cuenta de Google de cada persona (id en `google_calendar_cuentas.calendar_id`, migración 36) y solo escribe en él; **no hace falta la verificación de Google** (sin aviso «app no verificada» ni tope de 100 personas; `verificacion-google.md` solo sirve si algún día se vuelve a pedir un permiso sensible como `calendar.events`). «Desconectar» borra ese calendario de Google. La función ya no borra de golpe más de 3 fechas de Google Calendar sin confirmación (`confirmarBorrado`). Historial: apagado el 13-oct-2026 (piezas en `agenda-apagada/`); antes, activo y probado por Sara el 8-oct-2026.

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
- `agenda-rosina.html`: tarjeta `#calendario-sync`; `js/agenda/google-calendar.js`: el módulo; `window.lrAgenda` entrega los eventos.
- `probar_funcion.mjs` y `herramientas/pruebas/probar_agenda_google_calendar.py`: pruebas.
