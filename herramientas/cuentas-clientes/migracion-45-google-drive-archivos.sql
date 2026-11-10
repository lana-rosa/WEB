-- Migración 45 (10-nov-2026): Conexiones e integraciones, etapa 4 — guardar Excel y copias en una carpeta VISIBLE del Drive de la persona.
-- Guarda SOLO el permiso de Google (cifrado, `drive.file`: la app solo ve los archivos que ella misma crea) de quien conecte esta función. Nunca guarda archivos ni datos de la agenda.
-- Es una conexión APARTE de la sincronización (migración 40, `drive.appdata`): cada permiso tiene su propio propósito y se quita por separado.
-- La tabla tiene seguridad por fila activa y ninguna política: solo la función `google-drive-archivos` (clave de servicio) la toca; la web no puede leerla.
-- Sin DROP ni DELETE (el MCP de Supabase se queda esperando con ellos). Tabla nueva: nace cerrada (sin permisos para anon ni authenticated).
create table if not exists public.google_drive_archivos_cuentas (
  user_id uuid primary key references auth.users(id) on delete cascade,
  refresh_token text not null,
  google_correo text,
  ultimo_guardado timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.google_drive_archivos_cuentas enable row level security;
revoke all on table public.google_drive_archivos_cuentas from anon, authenticated;
comment on table public.google_drive_archivos_cuentas is 'Permiso cifrado (drive.file) para guardar Excel y copias en una carpeta visible del Drive de la persona. No guarda archivos ni datos de la agenda.';
