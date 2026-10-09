-- Cobro en línea de lanas e hilos de la Mercería — 8-oct-2026 (ver propuesta-cobro-merceria.md).
-- Reglas (decididas por Sara): las lanas e hilos se venden por ovillo completo; el precio del ovillo = precio por gramo × peso del ovillo
-- (redondeado a $100, igual que la web); a domicilio, Wompi cobra SOLO los productos y el envío lo paga la clienta a la transportadora al recibir
-- (Términos de venta de la Mercería, sección 9). Recoger en tienda sigue gratis.
-- Se aplicó instrucción por instrucción (el editor SQL se agota con bloques largos sobre tablas con triggers).

-- 1) Marca de "envío contraentrega" en el pedido web (para el correo de recibo y el ERP).
alter table public.pedidos_web add column if not exists envio_al_recibir boolean not null default false;

-- 2) La web necesita la unidad del inventario para saber si la existencia está en gramos o en unidades. Se creó una función NUEVA (v2) en vez de
--    cambiar la anterior (cambiarle las columnas exigía borrarla, y el editor SQL se queda esperando confirmación en instrucciones de borrado).
--    `obtener_merceria_web()` sigue igual (la usan la agenda y Rosina).
create or replace function public.obtener_merceria_web_v2()
 returns table(id uuid, nombre text, marca text, color text, material text, peso_gramos numeric, precio_gramo numeric, stock_actual numeric, foto_url text, categoria text, unidad_medida text)
 language sql security definer set search_path to 'public'
as $f$ SELECT i.id, i.nombre, i.marca, i.color, i.material, i.peso_gramos, i.precio_venta, i.stock_actual, i.foto_url, c.nombre as categoria, i.unidad_medida
 FROM inventario_items i LEFT JOIN categorias_inventario c ON c.id = i.categoria_id
 WHERE i.tipo = 'merceria' AND i.activo = true AND i.centro_costo_id = '2c1577b5-514e-4952-ba15-4feb64ea1879'
 AND coalesce(c.nombre, '') <> 'Empaques'
 ORDER BY c.nombre, i.marca, i.color; $f$;

-- 3) ERP: la cantidad del pedido de canal va en la unidad del inventario (gramos para lanas/hilos guardados en gramos).
do $m$ declare d text; begin
  d := pg_get_functiondef('public.fn_registrar_pedido_web_en_erp'::regproc);
  if position('select i.*, inv.centro_costo_id as centro from pedidos_web_items i' in d) = 0 or position('it.cantidad, v_valor, v_envio, v_obs, null);' in d) = 0 or position('|| case when w.notas is not null' in d) = 0 then raise exception 'la función cambió: revisar'; end if;
  d := replace(d, 'select i.*, inv.centro_costo_id as centro from pedidos_web_items i', 'select i.*, inv.centro_costo_id as centro, case when inv.tipo = ''merceria'' and inv.unidad_medida = ''gramo'' and coalesce(inv.peso_gramos, 0) > 0 then inv.peso_gramos else 1 end as factor_cant from pedidos_web_items i');
  d := replace(d, 'it.cantidad, v_valor, v_envio, v_obs, null);', 'it.cantidad * it.factor_cant, v_valor, v_envio, v_obs, null);');
  d := replace(d, '|| case when w.notas is not null', '|| case when w.envio_al_recibir then '' · ENVÍO CONTRAENTREGA: la transportadora cobra el envío al recibir'' else '''' end || case when w.notas is not null');
  execute d;
end $m$;

-- 4) Correo de recibo: el envío contraentrega no es "Gratis".
do $m$ declare d text; begin
  d := pg_get_functiondef('public.fn_correo_compra_web'::regproc);
  if position('case when coalesce(p.envio,0)=0 then ''Gratis'' else fn_cop(p.envio) end' in d) = 0 or position('else ''Envío a: ''||fn_esc_html(p.direccion)||'', ''||fn_esc_html(p.ciudad) end;' in d) = 0 then raise exception 'la función cambió: revisar'; end if;
  d := replace(d, 'case when coalesce(p.envio,0)=0 then ''Gratis'' else fn_cop(p.envio) end', 'case when coalesce(p.envio_al_recibir,false) then ''Lo pagas al recibir'' when coalesce(p.envio,0)=0 then ''Gratis'' else fn_cop(p.envio) end');
  d := replace(d, 'else ''Envío a: ''||fn_esc_html(p.direccion)||'', ''||fn_esc_html(p.ciudad) end;', 'else ''Envío a: ''||fn_esc_html(p.direccion)||'', ''||fn_esc_html(p.ciudad)||case when coalesce(p.envio_al_recibir,false) then ''. El costo del envío lo pagas a la transportadora al recibir tu pedido; lo despachamos el siguiente día hábil.'' else '''' end end;');
  execute d;
end $m$;

-- Prueba hecha (con un bloque que termina en error para deshacerlo todo): un pedido web pagado de 2 ovillos Kusi Kusi Chelín de 160 g con envío al recibir dejó en el ERP
-- cantidad 320 (gramos) y valor $35.200, la observación «ENVÍO CONTRAENTREGA…» y el correo de recibo con «Lo pagas al recibir».
-- La función de borde `crear-pago-wompi` (v30) está en funciones/crear-pago-wompi.ts.
