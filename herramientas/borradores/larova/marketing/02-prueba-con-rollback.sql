-- Prueba con rollback de 01-tablas-marketing.sql. Todo se deshace al final (raise exception).
-- Se corre con el sí de Jennifer, en el mismo horario permitido. Pegar 01 completo donde dice [01].
do $$
declare n int; ok boolean;
begin
  -- [01] aquí va el contenido de 01-tablas-marketing.sql

  -- 1) Administradora: puede crear y leer
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', '{"sub":"5d148bc8-f5d2-45bb-86ee-910f274d7f2d","role":"authenticated"}', true);
  insert into public.mkt_piezas (marca, titulo, tipo, plataformas, estado, guion, copy)
  values ('lana_rosa_crochet', 'Prueba', 'reel', array['instagram','facebook'], 'idea', 'g', 'c');
  select count(*) into n from public.mkt_piezas;
  if n <> 1 then raise exception 'FALLA admin no ve su pieza (%)', n; end if;

  -- 2) Valores no permitidos se rechazan
  ok := false;
  begin insert into public.mkt_piezas (marca, titulo, tipo) values ('otra', 'x', 'reel');
  exception when check_violation then ok := true; end;
  if not ok then raise exception 'FALLA acepta marca inválida'; end if;

  -- 3) Una cuenta que no es administradora no ve nada y no puede escribir
  perform set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000000","role":"authenticated"}', true);
  select count(*) into n from public.mkt_piezas;
  if n <> 0 then raise exception 'FALLA otra cuenta ve % piezas', n; end if;
  ok := false;
  begin insert into public.mkt_piezas (marca, titulo, tipo) values ('lana_rosa_crochet', 'x', 'reel');
  exception when insufficient_privilege then ok := true; end;
  if not ok then raise exception 'FALLA otra cuenta pudo escribir'; end if;

  -- 4) Visitante anónimo: sin permiso
  execute 'set local role anon';
  ok := false;
  begin select count(*) into n from public.mkt_piezas;
  exception when insufficient_privilege then ok := true; end;
  if not ok then raise exception 'FALLA anon puede leer'; end if;

  raise exception 'PRUEBA OK (todo se deshace)';
end $$;
