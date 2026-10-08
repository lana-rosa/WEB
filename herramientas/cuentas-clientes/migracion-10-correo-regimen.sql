-- Correo de compra: datos del vendedor y régimen (8-oct-2026). Inserta un bloque antes de la frase final de fn_correo_compra_web:
-- Sara Loaiza Muñoz, NIT, dirección, teléfono, "Régimen Simple de Tributación (SIMPLE) · No responsable de IVA" y cómo pedir factura. Idempotente.
do $do$
declare d text; m text := '<p style="text-align:center;font-family:Georgia'; pos int; nuevo text;
begin
  d := pg_get_functiondef('public.fn_correo_compra_web(uuid,boolean)'::regprocedure);
  if position('Régimen Simple de Tributación' in d) > 0 then raise notice 'ya tiene los datos del vendedor'; return; end if;
  pos := position(m in d);
  if pos = 0 then raise exception 'marcador no encontrado'; end if;
  nuevo := $b$<p style="font-size:12px;color:#6E6E73;background:#FBF7F4;border-radius:10px;padding:10px 14px;margin:14px 0">Este correo es un comprobante de pago. <strong>Lana Rosa Crochet</strong> · Sara Loaiza Muñoz, NIT 1.055.359.694-4 · Calle 10 No. 5-37, Villamaría, Caldas · Tel. 320 507 2801.<br><strong>Régimen Simple de Tributación (SIMPLE) · No responsable de IVA.</strong> Si necesitas factura electrónica de venta, responde este correo con tu nombre completo, documento y correo.</p>
$b$;
  d := substr(d, 1, pos - 1) || nuevo || substr(d, pos);
  execute d;
end $do$;
