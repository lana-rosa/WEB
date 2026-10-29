-- Migración 38 (29-oct-2026): textos del correo de bienvenida de la membresía acordes con la nueva membresía de la Agenda para tejedoras
-- (toda la agenda: Materiales, Emprendimiento, Finanzas y Fechas y bienestar; Inicio, Mi tablero y Mis proyectos siguen gratis). Aplicada con replace sobre la definición vigente.
do $mig$
declare d text;
begin
  select pg_get_functiondef('public.fn_correo_membresia'::regproc) into d;
  d := replace(d, 'Bienvenida a la Agenda de Rosina completa!', 'Bienvenida a la Agenda para tejedoras completa!');
  d := replace(d, 'puedes usar Finanzas, el Tablero de indicadores y el Calendario del año.', 'tienes toda la agenda: Materiales, Emprendimiento, Finanzas y Fechas y bienestar.');
  d := replace(d, 'Tu membresía de la Agenda de Rosina está activa', 'Tu membresía de la Agenda para tejedoras está activa');
  d := replace(d, 'solo se bloquean las hojas de pago.', 'solo se bloquean las hojas de la membresía (Inicio, Mi tablero y Mis proyectos siguen gratis).');
  execute d;
end $mig$;
