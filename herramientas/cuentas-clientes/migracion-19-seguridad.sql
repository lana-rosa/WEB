-- Endurecimiento de seguridad (15-oct-2026). YA APLICADO en producción (Supabase «Lana Rosa ERP + SO»).
-- Este archivo documenta lo que se hizo; las definiciones originales y los permisos anteriores están guardados en las tablas
-- seguridad_respaldo_funciones y seguridad_respaldo_permisos para poder devolverlos.
--
-- Hallazgos (probados con roles simulados dentro de transacciones con ROLLBACK, sin tocar datos):
--   1) Las vistas fe_saldo_global y vista_trazabilidad_sistema eran SECURITY DEFINER: cualquier cuenta autenticada, aunque fuera
--      una clienta sin rol, leía el saldo del Fondo Emprender y 119 registros de auditoría (ventas, nómina, gastos).
--   2) 83 funciones SECURITY DEFINER eran ejecutables por el rol anónimo (la llave pública de la web): un visitante podía leer saldos de
--      vacaciones de empleadas, reportes financieros por departamento y datos de cuentas bancarias (y ejecutar funciones de escritura).
--   3) 132 funciones del ERP, ejecutables por cualquier cuenta autenticada (incluidas las clientas de la web), no verificaban el rol
--      (entre ellas fn_reiniciar_datos_prueba, fn_registrar_gasto_departamento, fn_liquidar_*, fn_registrar_retiro_*).
--
-- 1) Vistas con los permisos de quien consulta (el administrador sigue viendo todo; la clienta sin rol ve 0 filas)
alter view public.fe_saldo_global set (security_invoker = true);
alter view public.vista_trazabilidad_sistema set (security_invoker = true);
revoke truncate, references, trigger, insert, update, delete on public.fe_saldo_global, public.vista_trazabilidad_sistema from authenticated;

-- 2) El rol anónimo solo conserva las funciones que usa la web pública (lista blanca = RPC que llama el sitio y el feed de Google):
--    crear_resena_web, crear_solicitud_personalizada, estado_pedido_web, obtener_carrito_abandonado, obtener_feed_google, obtener_merceria_web,
--    obtener_merceria_web_v2, obtener_productos_personaje, obtener_tarifas_envio_web, obtener_tienda_web, pedido_web_es_digital,
--    pedido_web_es_membresia, registrar_bono_bienvenida, registrar_carrito_abandonado, registrar_promos_pedido, tarifas_envio_web
--    (+ fn_rol_actual y fn_es_tejedora, que usan las políticas de RLS). El resto: revoke execute ... from public, anon;
--    grant execute ... to authenticated, service_role;   (ver seguridad_respaldo_permisos para la lista y el estado anterior)

-- 3) Guarda de personal en las 132 funciones del ERP: primera instrucción de cada una (si es SQL se convirtió a plpgsql):
--      if auth.uid() is not null and public.fn_rol_actual() is null and not public.fn_es_tejedora()
--      then raise exception 'No autorizado' using errcode = '42501'; end if;
--    Pasan: el personal con rol, las tejedoras vinculadas y las llamadas de servidor (triggers, pg_cron, funciones Edge con la llave de servicio:
--    auth.uid() es null). Se bloquean las cuentas de clientas sin rol. No se tocaron las funciones que usa la web (mi_*, mis_*, agenda_nube_*, etc.).

-- 4) Límite de uso del formulario público de personalizados (crear_solicitud_personalizada): hasta 4 solicitudes por teléfono en 24 h,
--    8 por IP en 1 h y 60 en total por hora; se guardan solo hashes en personalizados_uso; longitudes máximas de texto.

-- 5) Storage: el bucket solicitudes-personalizadas (fotos que suben las clientas) pasó a privado:
--      update storage.buckets set public = false where name = 'solicitudes-personalizadas';
--    El ERP muestra esas fotos con enlaces firmados de 1 hora (ERP PR #83, tablero de Oportunidades).
--    NO se cambiaron guias-envio (la clienta ve «Ver guía» desde Mi cuenta con una URL pública), produccion-fotos ni fotos-productos: sus nombres
--    de archivo no se pueden adivinar y ninguna política permite listarlos; pasarlos a privado exige URLs firmadas para clientas (pendiente).

-- Para devolver una función a su estado anterior:
--   select definicion_original from public.seguridad_respaldo_funciones where firma = 'fn_xxx(uuid)';  → ejecutar ese texto
-- Para devolver permisos al rol anónimo:
--   select firma from public.seguridad_respaldo_permisos where motivo = 'anon 15-oct-2026';  → grant execute on function public.<firma> to anon;

-- Pendiente (no aplicado):
--   · 137 funciones con search_path mutable (alerta function_search_path_mutable): fijar «search_path = public» exige probar cada función; se hará por lotes.
--   · Protección contra contraseñas filtradas en Auth: solo está disponible en el plan Pro de Supabase.
--   · Las 290 funciones ejecutables por cuentas autenticadas siguen siendo SECURITY DEFINER (ahora con guarda de personal): lo ideal es una
--     verificación de rol más fina por función (administrador / cajero / contador / taller).
--   · Definir el secreto RW_SAL de la función rosina-web (sal del hash de IP) en Supabase → Edge Functions → Secrets.
