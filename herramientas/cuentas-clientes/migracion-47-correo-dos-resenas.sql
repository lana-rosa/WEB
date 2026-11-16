-- Migración 47 (16-nov-2026) — PREPARADA, SIN APLICAR (🔴 base de datos; espera el sí de Jennifer sobre la imagen del correo).
-- Pedido de Jennifer (16-nov): el correo de gracias de cada compra web (fn_correo_compra_web, migración 6) debe ofrecer DOS opciones para dejar reseña:
--   1) «⭐ Deja tu reseña en la página» → https://lanarosacrochet.com/cuenta.html#resenas  (Mi cuenta → Reseñas; abre esa sección con la sesión iniciada; sin sesión pide entrar primero)
--   2) «⭐ Deja tu reseña en Google»  → https://g.page/r/Cae2iIji5j_XEAI/review  (enlace directo nuevo que mandó Sara; ver nota abajo)
-- Hace solo un reemplazo de texto sobre la definición actual de la función (no toca nada más) y falla sin cambiar nada si no encuentra el párrafo anterior.
-- NOTA PARA CONFIRMAR: el correo de hoy usa https://g.page/r/Cae2iIji5j_XEAE/review (termina en «E»); el enlace nuevo termina en «I». Confirmar con Sara cuál abre la ventana de reseña antes de aplicar.
-- No se cambian los botones «Ver reseñas en Google» de index, tienda y personaliza (siguen con share.google).
-- Reversa: volver a aplicar la definición anterior (la migración 6 o esta misma con los textos intercambiados).
do $$
declare d text; viejo text; nuevo text;
begin
  d := pg_get_functiondef('public.fn_correo_compra_web(uuid, boolean)'::regprocedure);
  viejo := '<p style="text-align:center;margin:14px 0"><a href="https://g.page/r/Cae2iIji5j_XEAE/review" style="background:#fff;color:#E74E96;border:2px solid #E74E96;text-decoration:none;padding:10px 22px;border-radius:999px;font-weight:bold;display:inline-block">⭐ Dejar una reseña en Google</a></p>';
  nuevo := '<p style="text-align:center;margin:14px 0 6px"><a href="https://lanarosacrochet.com/cuenta.html#resenas" style="background:#E74E96;color:#fff;border:2px solid #E74E96;text-decoration:none;padding:10px 22px;border-radius:999px;font-weight:bold;display:inline-block">⭐ Deja tu reseña en la página</a></p>'
        || chr(10) || '<p style="text-align:center;margin:6px 0 14px"><a href="https://g.page/r/Cae2iIji5j_XEAI/review" style="background:#fff;color:#E74E96;border:2px solid #E74E96;text-decoration:none;padding:10px 22px;border-radius:999px;font-weight:bold;display:inline-block">⭐ Deja tu reseña en Google</a></p>';
  if position(viejo in d) = 0 then raise exception 'No se encontró el botón anterior de reseña: no se cambió nada'; end if;
  execute replace(d, viejo, nuevo);
end $$;
