-- Migración 40 (31-oct-2026): sincronización de la agenda con el Google Drive de la usuaria (etapa 7 del plan Plus).
-- Guarda SOLO el permiso de Google (cifrado, solo para la carpeta oculta de la app) de cada persona que conecta su Drive. Nunca guarda la agenda.
-- La tabla tiene seguridad por fila activa y ninguna política: solo la función `google-drive` (clave de servicio) la toca; la web no puede leerla.
-- Sin DROP ni DELETE (el MCP de Supabase se queda esperando con ellos).
create table if not exists public.google_drive_cuentas (
  user_id uuid primary key references auth.users(id) on delete cascade,
  refresh_token text not null,
  google_correo text,
  ultima_sincronizacion timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.google_drive_cuentas enable row level security;
revoke all on table public.google_drive_cuentas from anon, authenticated;
comment on table public.google_drive_cuentas is 'Permiso cifrado (drive.appdata) para sincronizar la agenda con el Drive de la persona. No guarda datos de la agenda.';
