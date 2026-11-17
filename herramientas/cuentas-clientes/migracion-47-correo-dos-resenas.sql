-- Migración 47 (16-nov-2026) — APLICADA el 16-nov-2026 (nombre «migracion_47_correo_simple_dos_resenas»; sí de Jennifer a la imagen y enlace de Google nuevo …_XEAI confirmado por el Orquestador WEB, que es el que Sara mandó al CRM). Verificada por consulta el 16-nov.
-- Pedido de Jennifer (16-nov): el correo de gracias de cada compra web (fn_correo_compra_web, migración 6) debe ofrecer DOS opciones para dejar reseña (en la página y en Google)
-- y verse MÁS SIMPLE («se ve sobre saturado»). Esta versión: un solo botón lleno «Entrar a mi cuenta» y debajo enlaces de texto pequeños: «Cómo cuidar tu tejido» ·
-- «Deja tu reseña en la página» (https://lanarosacrochet.com/cuenta.html#resenas) · «Deja tu reseña en Google» (https://g.page/r/Cae2iIji5j_XEAI/review, enlace nuevo de Sara).
-- Se quitan las cajas de colores y el segundo cierre (queda uno, con WhatsApp). SE CONSERVA todo lo legal: «comprobante de pago», titular, NIT, dirección, teléfono, régimen SIMPLE,
-- no responsable de IVA y cómo pedir factura electrónica (solo con letra más pequeña y sin caja). Se conservan subtotal, descuento, envío y total (en tamaño pequeño), el medio de pago
-- y el texto «Ya estamos preparando tu pedido con mucho cariño.», que la función reemplaza en los patrones digitales.
-- Solo reemplaza la plantilla del correo dentro de la definición actual de la función (no cambia argumentos, permisos ni envío) y falla sin cambiar nada si no la encuentra.
-- Enlace de Google: antes usaba …_XEAE/review; ahora …_XEAI/review (el de Sara y del CRM).
-- Reversa: volver a aplicar la definición anterior (migración 6 con el enlace anterior).
do $mig$
declare d text; i int; j int; resto text; tpl text; ini text := 'v_html := format($h$'; fin text := '$h$,';
begin
  d := pg_get_functiondef('public.fn_correo_compra_web(uuid, boolean)'::regprocedure);
  i := position(ini in d);
  if i = 0 then raise exception 'No se encontró la plantilla del correo: no se cambió nada'; end if;
  resto := substr(d, i + length(ini));
  j := position(fin in resto);
  if j = 0 then raise exception 'No se encontró el final de la plantilla: no se cambió nada'; end if;
  tpl := $plantilla$<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#45454A;line-height:1.5">
<h2 style="color:#E74E96;margin:0 0 4px">¡Gracias por tu compra! 💗</h2>
<p style="margin:0 0 16px">Hola %1$s, <strong>confirmamos tu pago</strong>. Ya estamos preparando tu pedido con mucho cariño.</p>
<p style="margin:0 0 6px;font-size:14px"><strong>Pedido %2$s</strong> · %3$s · %4$s</p>
<table style="width:100%%;border-collapse:collapse;font-size:14px">%5$s</table>
<table style="width:100%%;border-collapse:collapse;font-size:13px;color:#6E6E73;margin-top:6px">
<tr><td style="padding:2px 0">Subtotal</td><td style="padding:2px 0;text-align:right">%6$s</td></tr>%7$s
<tr><td style="padding:2px 0">Envío</td><td style="padding:2px 0;text-align:right">%8$s</td></tr></table>
<table style="width:100%%;border-collapse:collapse;font-size:15px;margin-top:4px">
<tr><td style="padding:8px 0;border-top:2px solid #E74E96"><strong>Total pagado</strong></td><td style="padding:8px 0;border-top:2px solid #E74E96;text-align:right"><strong>%9$s</strong></td></tr>%10$s</table>
<p style="font-size:14px;margin:10px 0 22px">%11$s</p>
<p style="text-align:center;margin:0 0 14px"><a href="https://lanarosacrochet.com/cuenta.html" style="background:#E74E96;color:#fff;text-decoration:none;padding:12px 26px;border-radius:999px;font-weight:bold;display:inline-block">Entrar a mi cuenta</a></p>
<p style="text-align:center;font-size:13px;line-height:1.9;margin:0 0 24px"><a href="https://lanarosacrochet.com/revista.html#cuidar-lavar-tejidos" style="color:#E74E96;white-space:nowrap">Cómo cuidar tu tejido</a> · <a href="https://lanarosacrochet.com/cuenta.html#resenas" style="color:#E74E96;white-space:nowrap">Deja tu reseña en la página</a> · <a href="https://g.page/r/Cae2iIji5j_XEAI/review" style="color:#E74E96;white-space:nowrap">Deja tu reseña en Google</a></p>
<p style="font-size:11px;color:#6E6E73;margin:0 0 14px">Este correo es un comprobante de pago. <strong>Lana Rosa Crochet</strong> · Sara Loaiza Muñoz, NIT 1.055.359.694-4 · Calle 10 No. 5-37, Villamaría, Caldas · Tel. 320 507 2801.<br><strong>Régimen Simple de Tributación (SIMPLE) · No responsable de IVA.</strong> Si necesitas factura electrónica de venta, responde este correo con tu nombre completo, documento y correo.</p>
<p style="font-size:13px;color:#6E6E73;margin:0">¿Dudas? Responde este correo o escríbenos por <a href="https://wa.me/573205072801" style="color:#E74E96">WhatsApp</a>.<br>Con cariño, Lana Rosa Crochet 🧶 · Villamaría, Caldas · lanarosacrochet.com</p></div>$plantilla$;
  d := left(d, i - 1) || ini || tpl || fin || substr(resto, j + length(fin));
  if position('Ya estamos preparando tu pedido con mucho cariño.' in d) = 0 or position('Régimen Simple de Tributación' in d) = 0 or position('NIT 1.055.359.694-4' in d) = 0 or position('factura electrónica de venta' in d) = 0 then
    raise exception 'La nueva plantilla perdió texto obligatorio: no se cambió nada';
  end if;
  execute d;
end $mig$;
