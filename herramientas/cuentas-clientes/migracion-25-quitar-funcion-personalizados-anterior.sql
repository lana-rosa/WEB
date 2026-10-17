-- Personaliza: se quita el permiso de la función anterior (sin casillas) una vez la página usa la v2 (17-oct-2026). Aplicada en Supabase.
-- La función sigue existiendo pero ni visitantes ni cuentas pueden ejecutarla. Se podrá eliminar más adelante.
revoke execute on function public.crear_solicitud_personalizada(text, text, text, text, text, text[], text) from anon, authenticated, public;
