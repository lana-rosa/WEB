-- Prueba con rollback de 03-tablas-metricas.sql (todo se deshace con el raise final).
-- Correr con: set statement_timeout='60s'; set lock_timeout='10s'; antes del DO.
-- [03] El contenido de 03 (sin comentarios) va pegado al principio del bloque.
do $$
declare n int; ok boolean; v_pieza uuid; v_tasa numeric;
begin
  -- [03]

  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', '{"sub":"5d148bc8-f5d2-45bb-86ee-910f274d7f2d","role":"authenticated"}', true);
  -- 1) Administradora: carga números de una pieza y los lee en la vista
  insert into public.mkt_piezas (marca, angulo, tipo_publicacion, plataformas, estado, fecha)
  values ('crochet', 'Prueba métricas', 'reel', '{instagram}', 'publicado', '2026-11-19') returning id into v_pieza;
  insert into public.mkt_metricas (pieza_id, plataforma, fecha_medicion, alcance, interacciones, guardados)
  values (v_pieza, 'instagram', '2026-11-20', 1000, 50, 10);
  select tasa_interaccion_pct into v_tasa from public.mkt_resultados where pieza_id = v_pieza;
  if v_tasa is distinct from 5.00 then raise exception 'FALLA tasa % (esperaba 5.00)', v_tasa; end if;
  select count(*) into n from public.mkt_frecuencia_metricas;
  if n <> 25 then raise exception 'FALLA frecuencias %', n; end if;

  -- 2) Repetir la misma medición se rechaza; números negativos también
  ok := false;
  begin insert into public.mkt_metricas (pieza_id, plataforma, fecha_medicion) values (v_pieza, 'instagram', '2026-11-20');
  exception when unique_violation then ok := true; end;
  if not ok then raise exception 'FALLA acepta medición repetida'; end if;
  ok := false;
  begin insert into public.mkt_metricas (pieza_id, plataforma, alcance) values (v_pieza, 'facebook', -5);
  exception when check_violation then ok := true; end;
  if not ok then raise exception 'FALLA acepta negativo'; end if;

  -- 3) Otra cuenta: no ve métricas, ni la vista, ni frecuencias; no escribe
  perform set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000000","role":"authenticated"}', true);
  select count(*) into n from public.mkt_resultados;
  if n <> 0 then raise exception 'FALLA otra cuenta ve % resultados', n; end if;
  select count(*) into n from public.mkt_frecuencia_metricas;
  if n <> 0 then raise exception 'FALLA otra cuenta ve frecuencias'; end if;
  ok := false;
  begin insert into public.mkt_metricas (pieza_id, plataforma) values (v_pieza, 'tiktok');
  exception when insufficient_privilege or foreign_key_violation then ok := true; end;
  if not ok then raise exception 'FALLA otra cuenta pudo escribir'; end if;

  -- 4) Anon: sin permiso a nada
  execute 'set local role anon';
  ok := false;
  begin select count(*) into n from public.mkt_resultados;
  exception when insufficient_privilege then ok := true; end;
  if not ok then raise exception 'FALLA anon lee la vista'; end if;

  raise exception 'PRUEBA OK (todo se deshace)';
end $$;
