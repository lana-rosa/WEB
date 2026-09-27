// Feed de productos para Google Merchant Center (Lana Rosa Crochet).
// Público y de solo lectura: expone los mismos datos que ya muestra la tienda web,
// solo para los productos marcados en web_google_shopping (diseños propios).
// Todos los productos del feed están disponibles en la web (disponible_web), igual que en la ficha.
const SITIO = 'https://lanarosacrochet.com';

const esc = (t: unknown) => String(t ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

function gtinValido(codigo: string | null): boolean {
  if (!codigo || !/^\d{13}$/.test(codigo)) return false;
  const d = codigo.split('').map(Number);
  const suma = d.slice(0, 12).reduce((s, n, i) => s + n * (i % 2 === 0 ? 1 : 3), 0);
  return (10 - (suma % 10)) % 10 === d[12];
}

Deno.serve(async () => {
  const url = Deno.env.get('SUPABASE_URL')!;
  const clave = Deno.env.get('SUPABASE_ANON_KEY')!;
  const r = await fetch(url + '/rest/v1/rpc/obtener_feed_google', {
    method: 'POST',
    headers: { apikey: clave, Authorization: 'Bearer ' + clave, 'Content-Type': 'application/json' },
    body: '{}',
  });
  if (!r.ok) return new Response('Error al leer productos', { status: 502 });
  const productos: any[] = await r.json();

  const items = productos.map((p) => {
    const descripcion = String(p.descripcion_web || p.nombre).replace(/\s+/g, ' ').trim().slice(0, 4900);
    const lineas = [
      `<g:id>${esc(p.sku || p.id)}</g:id>`,
      `<g:title>${esc(p.nombre + ' | Crochet hecho a mano')}</g:title>`,
      `<g:description>${esc(descripcion)}</g:description>`,
      `<g:link>${SITIO}/tienda.html?producto=${esc(p.id)}</g:link>`,
      `<g:image_link>${SITIO}/img/productos/${esc(encodeURIComponent(p.foto_url))}</g:image_link>`,
      `<g:availability>in_stock</g:availability>`,
      `<g:price>${Number(p.precio).toFixed(2)} COP</g:price>`,
      `<g:condition>new</g:condition>`,
      `<g:brand>Lana Rosa Crochet</g:brand>`,
      gtinValido(p.sku) ? `<g:gtin>${p.sku}</g:gtin>` : `<g:identifier_exists>no</g:identifier_exists>`,
      `<g:product_type>Tejidos a mano &gt; ${esc(p.categoria_web)}</g:product_type>`,
    ];
    return '    <item>\n      ' + lineas.join('\n      ') + '\n    </item>';
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Lana Rosa Crochet</title>
    <link>${SITIO}/tienda.html</link>
    <description>Amigurumis, peluches, llaveros y accesorios tejidos a mano en Villamaría, Caldas.</description>
${items.join('\n')}
  </channel>
</rss>
`;
  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=900' },
  });
});
