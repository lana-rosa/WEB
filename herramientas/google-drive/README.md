# Sincronización de la agenda con el Google Drive de la usuaria (etapa 7, 31-oct-2026)

La función `google-drive` (copia en `google-drive.ts`) está **desplegada** y la tabla `google_drive_cuentas` creada (migración 40).
Para que funcione hay que hacer UNA vez, en Google Cloud (proyecto `lana-rosa-web`, el mismo de Google Calendar), estos 3 pasos:

1. **Activar la API de Google Drive:** Google Cloud → APIs y servicios → Biblioteca → «Google Drive API» → Habilitar.
2. **Agregar el permiso (alcance):** Google Auth Platform → Acceso a los datos → Agregar o quitar permisos → buscar `.../auth/drive.appdata`
   («Ver y administrar sus propios datos de configuración en Google Drive») → marcar → Actualizar → Guardar.
   Es un permiso **NO sensible**: no necesita la verificación larga de Google (igual que `calendar.app.created`).
3. **Agregar la URI de redireccionamiento:** Google Auth Platform → Clientes → «Agenda de Rosina» → URIs de redireccionamiento autorizados → Agregar URI:
   `https://ngjoognzvehwjtpqwrqe.supabase.co/functions/v1/google-drive` → Guardar. (No hace falta tocar «Orígenes de JavaScript».)

Los secretos (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `CALENDAR_TOKEN_KEY`, `CALENDAR_STATE_SECRET`) son los mismos de Google Calendar; no hay que crear nada nuevo.

## Cómo funciona (resumen)
- La función **nunca ve la agenda**: solo consigue el permiso (`drive.appdata`, carpeta oculta de la app), lo guarda cifrado y le da al navegador una llave de ~1 hora (`accion: 'token'`).
- El navegador (`js/agenda/drive-sync.js`) lee y escribe `agenda.json` en esa carpeta y mezcla con `js/agenda/drive-merge.js` (mezcla de tres vías, sin perder datos).
- Versiones anteriores: `agenda-anterior-<fecha>.json` (las últimas 5) en la misma carpeta.
- Pruebas: `node herramientas/pruebas/probar_drive_merge.mjs` (30) y `python3 herramientas/pruebas/probar_agenda_drive.py` (39, con Drive y función simulados).

## Para probar de verdad (cuando estén los 3 pasos y se publique)
1. En el computador: Configuración → «Guardar en tu Google Drive» → Conectar → aceptar. Escribir un pedido.
2. En el celular (misma cuenta de Lana Rosa y mismo Google): abrir la agenda → debe aparecer el pedido.
3. Escribir un pedido distinto en cada aparato y volver a abrir los dos: deben quedar los dos pedidos en ambos.
