-- Revisión de seguridad de la agenda (30-oct-2026, con OK de Sara): doble protección en las tablas de la agenda.
-- Antes tenían permisos amplios para anon y authenticated; solo las frenaba la seguridad por fila (RLS, sin políticas = nada pasa).
-- Todas las funciones que las usan son SECURITY DEFINER (corren con permisos del dueño), así que no se afecta nada de la web.
-- Se conserva SELECT para authenticated en las dos tablas con política de lectura (la clienta ve su membresía; la administradora ve membresías y consentimientos desde el ERP).
revoke all on table public.agenda_nube from anon, authenticated;
revoke all on table public.agenda_membresia_config from anon, authenticated;
revoke all on table public.agenda_nube_consentimientos from anon;
revoke insert, update, delete, truncate, references, trigger on table public.agenda_nube_consentimientos from authenticated;
revoke all on table public.membresias_agenda from anon;
revoke insert, update, delete, truncate, references, trigger on table public.membresias_agenda from authenticated;
