-- Migración 36 (29-oct-2026): Google Calendar con calendario propio.
-- La agenda pasa del permiso sensible `calendar.events` (pide verificación de Google) al permiso NO sensible `calendar.app.created`:
-- la función crea un calendario secundario «Agenda para tejedoras» en la cuenta de Google de la persona y guarda aquí su id.
-- Sin DROP ni DELETE (el MCP de Supabase se queda esperando con ellos). La tabla sigue con RLS activa y sin políticas: solo la función la toca.
alter table public.google_calendar_cuentas add column if not exists calendar_id text;
comment on column public.google_calendar_cuentas.calendar_id is 'Id del calendario secundario «Agenda para tejedoras» creado en Google Calendar (permiso calendar.app.created).';
