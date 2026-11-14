-- Migración 46 (14-nov-2026): APLICADA el 14-nov-2026 (sí de Sara, por el Orquestador ERP; verificada por el chat 5 con consulta: anon=false, authenticated=true).
-- fn_horarios_disponibles_capacitador(uuid, date, numeric) era SECURITY DEFINER y ejecutable por visitantes sin cuenta (anon) y sin guarda de rol; el ERP y la web
-- confirmaron que no la usan. Ahora solo la ejecutan usuarias con sesión (y service_role). No se agregó guarda dentro: la función es del ERP y su uso real aún no se conoce.
-- Reversa: grant execute on function public.fn_horarios_disponibles_capacitador(uuid, date, numeric) to anon;
revoke execute on function public.fn_horarios_disponibles_capacitador(uuid, date, numeric) from public, anon;
grant execute on function public.fn_horarios_disponibles_capacitador(uuid, date, numeric) to authenticated, service_role;
