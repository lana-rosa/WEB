# Google Merchant Center (Google Shopping)

- **Feed en vivo** (lo lee Google): `https://ngjoognzvehwjtpqwrqe.supabase.co/functions/v1/feed-google-merchant`
  - Edge Function `feed-google-merchant` del proyecto Supabase "Lana Rosa ERP + SO" (sin JWT: es público y solo muestra datos que ya están en la tienda).
  - Lee la función SQL `obtener_feed_google()`, que devuelve solo los productos de `web_google_shopping` que estén activos y disponibles en la web.
  - Precio y existencias salen del ERP en cada lectura; no hay que regenerar nada.
- **Qué productos van:** solo diseños propios (decisión de Sara, 27-sep-2026). Los personajes de marcas o personas famosas (Disney, One Piece, Harry Potter, Pokémon, Messi, etc.) **no** se envían, por la política de marcas de Google.
  - Para agregar un producto nuevo al feed:
    `insert into web_google_shopping (item_id) select id from inventario_items where nombre = 'Nombre exacto';`
  - Para quitarlo: `delete from web_google_shopping where item_id = (select id from inventario_items where nombre = 'Nombre exacto');`
- **GTIN:** el `sku` de 13 dígitos (códigos GS1 de Lana Rosa). Si no es un código válido, el producto se envía con `identifier_exists = no`.
- **Página de destino:** `tienda.html?producto=<id>` abre la ficha del producto y agrega sus datos estructurados (`Product`).
- Copias de referencia: `feed.ts` (código de la Edge Function) y `migracion.sql`.
