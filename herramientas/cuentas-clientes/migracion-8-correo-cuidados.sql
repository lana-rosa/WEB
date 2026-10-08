-- Correo de compra: bloque "Cuida tu tejido para que dure" con el enlace al artículo de la Revista (8-oct-2026).
-- Se agregó con un bloque DO que inserta el HTML justo después del párrafo de entrega en fn_correo_compra_web
-- (la función completa vive en la base de datos; ver migracion-6-correo-compra.sql). Es idempotente.
do $do$
declare d text; m text := '<p style="font-size:14px">%s</p>'; pos int; nuevo text;
begin
  d := pg_get_functiondef('public.fn_correo_compra_web(uuid,boolean)'::regprocedure);
  if position('cuidar-lavar-tejidos' in d) > 0 then raise notice 'ya tiene el enlace'; return; end if;
  pos := position(m in d);
  if pos = 0 then raise exception 'marcador no encontrado'; end if;
  nuevo := $b$
<div style="background:#FBF7F4;border-radius:14px;padding:14px 18px;margin:18px 0">
<strong>Cuida tu tejido para que dure 🧺</strong><br>
<span style="font-size:14px">Un tejido hecho a mano dura años si lo cuidas bien. Aquí te contamos cómo limpiarlo y lavarlo sin dañarlo.</span>
<p style="text-align:center;margin:12px 0 0"><a href="https://lanarosacrochet.com/revista.html#cuidar-lavar-tejidos" style="background:#fff;color:#E74E96;border:2px solid #E74E96;text-decoration:none;padding:10px 22px;border-radius:999px;font-weight:bold;display:inline-block">Cómo cuidar y lavar tu tejido</a></p></div>$b$;
  d := substr(d, 1, pos - 1 + length(m)) || nuevo || substr(d, pos + length(m));
  execute d;
end $do$;
