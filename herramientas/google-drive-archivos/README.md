# google-drive-archivos — guardar Excel y copias en una carpeta visible del Drive (etapa 4, 10-nov-2026)

Conexión APARTE de `google-drive` (sincronización en la carpeta oculta). Permiso `drive.file` (no sensible: la app solo ve lo que ella misma crea). La función nunca toca archivos ni datos de la agenda:
solo consigue el permiso (lo guarda cifrado) y entrega una llave de ~1 hora; el navegador (`js/agenda/drive-archivos.js`) sube directo a Drive.

## Para encenderlo (en este orden; todo lo hace Jennifer o se hace con su visto bueno)
1. **Base:** aplicar `herramientas/cuentas-clientes/migracion-45-google-drive-archivos.sql` (tabla nueva, nace cerrada) y correr el asesor de seguridad de Supabase.
2. **Google Cloud (Jennifer):** proyecto `lana-rosa-web` → Google Auth Platform → Acceso a los datos: agregar `https://www.googleapis.com/auth/drive.file`; y en el cliente «Agenda de Rosina» agregar el URI de redireccionamiento `https://ngjoognzvehwjtpqwrqe.supabase.co/functions/v1/google-drive-archivos`.
3. **Desplegar** `google-drive-archivos.ts` como función `google-drive-archivos` con `verify_jwt = false` (mismos secretos que `google-drive`).
4. Probar con la cuenta de Jennifer: conectar → «Guardar el Excel en mi Drive» → abrir la carpeta.
Mientras la función no esté desplegada, la tarjeta de la agenda no aparece (`estado` responde error o `configurado:false`).

## Pruebas
- Lógica de la función: ver cabecera de `probar_funcion.mjs` (13 comprobaciones).
- Navegador: `python3 herramientas/pruebas/probar_agenda_drive_archivos.py` (Drive y función simulados).
