-- Patrones digitales (PDF) que se venden en la Mercería y se descargan desde la cuenta (8-oct-2026).
-- Ya aplicada en Supabase como las migraciones "patrones_digitales" y funciones relacionadas. Resumen de lo que hace:
--   1) pedidos_web.es_digital (boolean): marca los pedidos que solo llevan patrones (sin envío, sin taller, sin CRM).
--   2) tabla patrones_archivos(item_id, ruta, nombre_archivo) + bucket PRIVADO "patrones" en Storage: ahí van los PDF.
--   3) categoría de inventario "Patrones" (tipo merceria): los productos de esa categoría son digitales.
--   4) fn_registrar_pedido_web_en_erp: si el pedido es digital no crea pedidos de producción; lo marca registrado con la nota
--      "Pedido digital: registrar el ingreso en contabilidad" (falta automatizar el asiento contable).
--   5) mis_compras_patrones(): lo que la clienta compró (item_id, descargable). Lo usa la Agenda y Mi cuenta.
--   6) fn_correo_compra_web y fn_mensaje_pago_web: texto especial para pedidos digitales (descarga en Mi cuenta).
--   7) pedido_web_es_digital(referencia): lo usa gracias.html.
-- Edge Functions: crear-pago-wompi (acepta carritos solo de patrones, sin dirección), wompi-webhook (no envía los digitales al CRM)
-- y descargar-patron (valida la compra y entrega un enlace firmado de 5 minutos).
--
-- CÓMO PUBLICAR UN PATRÓN NUEVO (hace Sara):
--   a) ERP: crear el producto en la categoría "Patrones" (nombre, precio de venta, foto, activo). La mercería ya lo muestra.
--   b) Supabase → Storage → bucket "patrones": subir el PDF.
--   c) Supabase → Table Editor → patrones_archivos: insertar item_id (id del producto), ruta (nombre del archivo en el bucket)
--      y nombre_archivo (el nombre con el que se descarga, por ejemplo patron-zorro-zoro.pdf).
alter table public.pedidos_web add column if not exists es_digital boolean not null default false;
create table if not exists public.patrones_archivos (
  item_id uuid primary key references public.inventario_items(id) on delete cascade,
  ruta text not null,
  nombre_archivo text,
  created_at timestamptz not null default now()
);
alter table public.patrones_archivos enable row level security;
create or replace function public.pedido_web_es_digital(p_referencia text)
returns boolean language sql stable security definer set search_path to 'public' as $$
  select coalesce((select p.es_digital from pedidos_web p where p.referencia = p_referencia), false);
$$;
grant execute on function public.pedido_web_es_digital(text) to anon, authenticated;
