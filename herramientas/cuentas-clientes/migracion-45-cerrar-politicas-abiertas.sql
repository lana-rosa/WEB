-- Migración 45 (13-nov-2026) — PREPARADA, SIN APLICAR (🔴 seguridad de la base; espera el sí de Jennifer y la coordinación con el chat del ERP).
-- Problema (verificado con consultas el 13-nov-2026): 4 tablas tienen una política «ALL … USING true» que deja entrar a cuentas que no son del ERP:
--   · oportunidades_venta (2 filas: solicitudes de Personaliza con nombre, teléfono, correo y enlaces de fotos): cualquier clienta con sesión las ve y las puede cambiar.
--   · fe_config_proyecto (1 fila) y fe_metas_mensuales_produccion (12 filas): igual, para cualquier cuenta con sesión.
--   · honorarios_tejedora_nomina (0 filas hoy): la política es para el rol PÚBLICO, o sea también visitantes sin cuenta (anon tiene permisos de tabla).
-- Arreglo: las políticas pasan a exigir una usuaria del ERP (fn_rol_actual() no nulo = fila activa en usuarios_roles). service_role y las funciones SECURITY DEFINER
-- (crear_solicitud_personalizada_v2, mis_pedidos) no se afectan (no dependen de estas políticas). Además se quitan los permisos de tabla al rol anon.
-- Reversa: ver el final del archivo.
drop policy if exists "Acceso total via service role" on public.oportunidades_venta;
create policy "Personal del ERP gestiona oportunidades" on public.oportunidades_venta for all to authenticated
  using (public.fn_rol_actual() is not null) with check (public.fn_rol_actual() is not null);

drop policy if exists "fe_config_autenticados" on public.fe_config_proyecto;
create policy "Personal del ERP gestiona fe_config_proyecto" on public.fe_config_proyecto for all to authenticated
  using (public.fn_rol_actual() is not null) with check (public.fn_rol_actual() is not null);

drop policy if exists "fe_metas_autenticados" on public.fe_metas_mensuales_produccion;
create policy "Personal del ERP gestiona fe_metas" on public.fe_metas_mensuales_produccion for all to authenticated
  using (public.fn_rol_actual() is not null) with check (public.fn_rol_actual() is not null);

drop policy if exists "Acceso total via service role" on public.honorarios_tejedora_nomina;
create policy "Personal del ERP gestiona honorarios" on public.honorarios_tejedora_nomina for all to authenticated
  using (public.fn_rol_actual() in ('administrador'::rol_usuario, 'contador'::rol_usuario, 'taller'::rol_usuario))
  with check (public.fn_rol_actual() in ('administrador'::rol_usuario, 'contador'::rol_usuario, 'taller'::rol_usuario));

revoke all on table public.oportunidades_venta, public.fe_config_proyecto, public.fe_metas_mensuales_produccion, public.honorarios_tejedora_nomina from anon;

-- Reversa (solo si el ERP se rompe; reabre el hueco): 
--   drop las 4 políticas nuevas; create policy "Acceso total via service role" on oportunidades_venta for all to authenticated using (true) with check (true);
--   create policy "fe_config_autenticados" … / "fe_metas_autenticados" … (to authenticated, true); y en honorarios la de «public».
--   grant all on las 4 tablas to anon;
