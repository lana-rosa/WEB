-- Etapa 1 del universo de Rosina — «Rosina te ayuda a regalar» (aplicada en Supabase el 15-oct-2026).
-- Crea las etiquetas de los productos (ocasión, para quién, estilo), la función pública que alimenta el recomendador
-- y carga PROPUESTAS de etiquetas que NO están revisadas: el recomendador no las usa para filtrar hasta que Sara o el taller
-- las revisen (columna revisado_en). Es idempotente: se puede volver a correr sin duplicar ni pisar etiquetas ya revisadas.
--
-- Seguridad: la tabla tiene RLS activado y SIN políticas, y no se le da acceso a anon ni a authenticated; solo se lee
-- a través de obtener_regalos_web() (SECURITY DEFINER; solo devuelve campos públicos y si hay existencia, no cuántas unidades).

create table if not exists public.producto_etiquetas (
  item_id        uuid primary key references public.inventario_items(id) on delete cascade,
  ocasiones      text[] not null default '{}',
  destinatarios  text[] not null default '{}',
  estilos        text[] not null default '{}',
  revisado_por   text,
  revisado_en    timestamptz,
  actualizado_en timestamptz not null default now()
);
alter table public.producto_etiquetas enable row level security;
revoke all on public.producto_etiquetas from anon, authenticated;
comment on table public.producto_etiquetas is
  'Etiquetas de regalo por producto. Solo se usan para filtrar en la web cuando revisado_en no es nulo (revisión de Sara o el taller).';

create or replace function public.obtener_regalos_web()
returns table(id uuid, nombre text, precio numeric, categoria_web text, foto_url text, tiempo_elaboracion text,
              en_existencia boolean, tamano_cm numeric, personalizable_base boolean, es_personaje boolean,
              ocasiones text[], destinatarios text[], estilos text[], etiquetas_revisadas boolean)
language sql stable security definer set search_path to 'public'
as $function$
  select i.id, i.nombre, i.precio_venta, i.categoria_web, i.foto_url, i.tiempo_elaboracion,
         coalesce(i.stock_actual, 0) > 0,
         nullif(replace(substring(i.nombre from '(?i)(\d+(?:[.,]\d+)?)\s*cm'), ',', '.'), '')::numeric,
         i.nombre ~ '^Amigurumi personalizado \d+ cm$',
         exists (select 1 from web_productos_personaje wp where wp.item_id = i.id),
         coalesce(e.ocasiones, '{}'), coalesce(e.destinatarios, '{}'), coalesce(e.estilos, '{}'),
         (e.revisado_en is not null)
  from inventario_items i
  left join producto_etiquetas e on e.item_id = i.id
  where i.tipo = 'producto_terminado' and i.activo = true and i.descripcion_web is not null
    and i.disponible_web = true and i.foto_url is not null and i.precio_venta > 0
  order by i.orden_web nulls last, i.nombre;
$function$;
-- Pública a propósito (la usa la web sin cuenta): también está en la lista blanca de anon de migracion-19-seguridad.sql.
grant execute on function public.obtener_regalos_web() to anon, authenticated, service_role;

-- Propuestas de etiquetas (SIN revisar). Las que ya estén en la tabla no se tocan.
insert into public.producto_etiquetas (item_id, ocasiones, destinatarios, estilos) values
  ('16c5c982-67c6-4ebf-9ae6-82e8b25f9005', '{cumpleanos,amor_amistad,dia_madre,dia_padre,graduacion,agradecimiento}', '{mama,papa,pareja,amiga_o,nina_nino,colega_profe,tu_mismo}', '{tierno}') -- Amigurumi personalizado 13 cm,
  ('b0b97bfc-3927-4f57-9295-e1e54297aa41', '{cumpleanos,amor_amistad,dia_madre,dia_padre,graduacion,agradecimiento}', '{mama,papa,pareja,amiga_o,nina_nino,colega_profe,tu_mismo}', '{tierno}') -- Amigurumi personalizado 15 cm,
  ('e3b2b9a7-f312-4a1a-ba79-30e715f3c528', '{cumpleanos,amor_amistad,dia_madre,dia_padre,graduacion,agradecimiento}', '{mama,papa,pareja,amiga_o,nina_nino,colega_profe,tu_mismo}', '{tierno}') -- Amigurumi personalizado 20 cm,
  ('437e3985-f31b-4303-8890-f0d0a3139adc', '{cumpleanos}', '{fan_personaje,nina_nino}', '{coleccionable,divertido}') -- Roronoa Zoro One Piece 15cm,
  ('6e2eeed9-27f3-4dd3-a3fe-318ef454b02e', '{cumpleanos}', '{fan_personaje,nina_nino}', '{coleccionable,divertido}') -- Sanji One Piece,
  ('3dba0691-48ff-412c-8ec5-75d40c34954c', '{cumpleanos}', '{fan_personaje,nina_nino}', '{coleccionable,divertido}') -- Usopp One Piece,
  ('58489366-8d4f-4f08-a544-d8494304d226', '{cumpleanos}', '{fan_personaje,nina_nino}', '{coleccionable,divertido}') -- Nami One Piece 15cm,
  ('012e4391-ba2e-475d-a893-080ed2d8124d', '{cumpleanos}', '{fan_personaje,nina_nino}', '{coleccionable,divertido}') -- Portgas D. Ace One Piece 15cm,
  ('7f636595-2041-4d38-8384-22b272bce026', '{cumpleanos}', '{fan_personaje,nina_nino}', '{coleccionable,divertido}') -- Harry Potter 14cm,
  ('5c5284e6-7b53-47a5-91f5-716e5ec9857e', '{cumpleanos}', '{fan_personaje,nina_nino}', '{coleccionable,divertido}') -- Ron Weasley 14cm,
  ('8df13783-1311-4f86-9761-93d88195f51f', '{cumpleanos}', '{fan_personaje,nina_nino}', '{coleccionable,divertido}') -- Hermione Granger 14cm,
  ('45d5f297-aa3e-4c87-af34-3df85eea539f', '{cumpleanos}', '{fan_personaje,nina_nino}', '{coleccionable,divertido}') -- Goku Dragon Ball Z 20cm,
  ('7d5fad73-c806-4f11-b2dc-2b2c4a84f5d6', '{cumpleanos}', '{fan_personaje,nina_nino}', '{coleccionable,divertido}') -- Vegueta Dragon Ball Z 20cm,
  ('c9542020-15b9-4f1a-860a-d7a25e25a6ba', '{cumpleanos}', '{fan_personaje,nina_nino}', '{coleccionable,divertido}') -- Coraline 19cm,
  ('eb719145-5966-44d5-bf96-dcb64d6b5c03', '{cumpleanos}', '{fan_personaje,nina_nino}', '{coleccionable,divertido}') -- Rapunzel 15cm,
  ('efc61b6c-66fc-4307-8e33-c0728aff61ef', '{cumpleanos}', '{fan_personaje,nina_nino}', '{coleccionable,divertido}') -- Michael Jackson 19cm,
  ('b6149090-06e0-45d7-8aa5-a7c48411fc8b', '{cumpleanos}', '{fan_personaje,nina_nino}', '{coleccionable,divertido}') -- Winnie the Pooh con corazón 10cm,
  ('f6b1a41e-f824-42f1-a28d-8fd818388028', '{cumpleanos,dia_madre,amor_amistad}', '{mama,amiga_o,nina_nino}', '{tierno,coleccionable}') -- Oveja con Vestido 23cm,
  ('63b85679-f066-4393-954d-da22ecb4b9aa', '{cumpleanos}', '{fan_personaje,nina_nino}', '{coleccionable,divertido}') -- Bulbasaur Pokemón 14cm*15cm,
  ('f4e20b3c-666a-4ec2-a4c8-656f46ee7604', '{cumpleanos}', '{fan_personaje,nina_nino}', '{coleccionable,divertido}') -- Lionel Messi Copa Mundial 20cm,
  ('f13dce3b-56ae-4ed6-b5c7-bcdd0368dac6', '{graduacion,cumpleanos,dia_padre}', '{colega_profe,papa,amiga_o}', '{divertido}') -- Ingeniero Civil 22cm,
  ('6da3387b-b892-4f7d-8050-c6e59d872073', '{cumpleanos}', '{fan_personaje,nina_nino}', '{coleccionable,divertido}') -- Dipper Pines Gravity Falls 22cm,
  ('b419d1e8-042d-4d32-ab11-1cdae3af0913', '{cumpleanos}', '{fan_personaje,nina_nino}', '{coleccionable,divertido}') -- Pato Donald 15cm,
  ('5ee1816a-2a98-446e-b268-92497111c0ba', '{cumpleanos}', '{fan_personaje,nina_nino}', '{coleccionable,divertido}') -- Minnie Mouse 15cm,
  ('00c29dd2-f48d-4c0d-8df8-a1a018146fdd', '{cumpleanos}', '{fan_personaje,nina_nino}', '{coleccionable,divertido}') -- Mickey Mouse 15cm,
  ('68a1bad2-77b6-49a8-ba14-d82929513473', '{cumpleanos}', '{fan_personaje,nina_nino}', '{coleccionable,divertido}') -- Hello Kitty 10cm,
  ('354fcc8b-0a65-40a5-9329-f097ece2b33e', '{cumpleanos,dia_madre}', '{nina_nino,mama}', '{elegante,tierno}') -- Muñeca Lydia 30cm,
  ('3c86ea1f-cffa-418d-89ff-0313e8fc4130', '{cumpleanos}', '{fan_personaje,nina_nino}', '{coleccionable,divertido}') -- Barbie 29cm,
  ('3a790bdb-7c48-4382-9b64-2f1670ea8ac9', '{cumpleanos,dia_madre}', '{nina_nino,mama}', '{elegante,tierno}') -- Muñeca Hazel 31cm,
  ('f6aec0f3-5fd3-4f96-91cc-732aaabb2eb6', '{cumpleanos,detalle}', '{nina_nino}', '{tierno,colombiano}') -- Ratón Peréz 28cm,
  ('bdf81e51-420e-4f44-8dd4-d1f7a88fccc5', '{cumpleanos}', '{fan_personaje,nina_nino}', '{coleccionable,divertido}') -- Rosita Fresita (25cm),
  ('0368b924-fb03-4c49-afef-29d5b8a108cb', '{cumpleanos,amor_amistad,detalle}', '{amiga_o,pareja,colega_profe,nina_nino}', '{tierno,divertido}') -- Llavero Capibara con Disfraz 7cm,
  ('a4939136-22ab-412e-9d2c-8639ee645391', '{dia_madre,agradecimiento,decoracion,amor_amistad}', '{mama,amiga_o,pareja}', '{naturaleza,elegante}') -- Set Cactus LOVE 10cm,
  ('2cd8e29e-614b-4ddb-be29-d7826985ce45', '{cumpleanos,amor_amistad,detalle}', '{amiga_o,pareja,colega_profe,nina_nino}', '{tierno,divertido}') -- Llavero Medusa,
  ('3cb4fb61-bce7-491d-9dfb-880c92fe98c0', '{decoracion,dia_madre,agradecimiento}', '{mama,amiga_o,pareja}', '{naturaleza,elegante}') -- Regadera 8cm*14cm,
  ('00cf8be9-0145-4b83-a596-b755311b0168', '{cumpleanos,amor_amistad,detalle}', '{amiga_o,pareja,colega_profe,nina_nino}', '{tierno,divertido}') -- Llavero Tortuga 8cm,
  ('0da0977d-ad53-4ae2-8e97-3e55411a0f02', '{cumpleanos,amor_amistad,detalle}', '{amiga_o,pareja,colega_profe,nina_nino}', '{tierno,divertido}') -- Llavero Fresa Peluche 8cm,
  ('020c81d7-f24a-40d0-98b2-d30f21b3f501', '{cumpleanos,amor_amistad,detalle}', '{amiga_o,pareja,colega_profe,nina_nino}', '{tierno,divertido}') -- Llavero Ballena 5cm,
  ('838e1c04-3c1b-462d-a2ed-e79e8f113b66', '{cumpleanos,amor_amistad,detalle}', '{amiga_o,pareja,colega_profe,nina_nino}', '{tierno,divertido}') -- Llavero de Pulpo 4cm,
  ('20f1b1e6-19cb-4649-b6f5-53a41ea7b8f9', '{cumpleanos,amor_amistad,detalle}', '{amiga_o,pareja,colega_profe,nina_nino}', '{tierno,divertido}') -- Llavero Pulpo con Gafas,
  ('f5c1c576-e583-4752-a71f-34cd9bf37b90', '{cumpleanos,amor_amistad,detalle}', '{amiga_o,pareja,colega_profe,nina_nino}', '{tierno,divertido}') -- Llavero Abeja 6cm,
  ('ea60f9a3-5612-4cb1-a300-42a1236933a9', '{cumpleanos,amor_amistad,detalle}', '{amiga_o,pareja,colega_profe,nina_nino}', '{tierno,divertido}') -- Llavero Pollo 4cm,
  ('cc1e57ce-9ecd-4a20-a8ec-e922cc260b0a', '{cumpleanos,amor_amistad,detalle}', '{amiga_o,pareja,colega_profe,nina_nino}', '{tierno,divertido}') -- Llavero Rosa,
  ('dbd73591-2d40-40e5-a9f0-200b0c452815', '{amor_amistad,dia_madre,detalle}', '{pareja,amiga_o,mama}', '{tierno,divertido}') -- Llavero Corazón 5cm,
  ('b7a684ef-03b9-43ac-8634-217042866e77', '{cumpleanos,amor_amistad,detalle}', '{amiga_o,pareja,colega_profe,nina_nino}', '{tierno,divertido}') -- Llavero Fresa con sombrero de Pollo 6cm,
  ('a18e27c7-84c8-46c5-835a-e5e6a8bb9794', '{cumpleanos,amor_amistad,detalle}', '{amiga_o,pareja,colega_profe,nina_nino}', '{tierno,divertido}') -- Llavero Pollito con Sombrero de Fresa 6cm,
  ('64dad10a-7f4f-4f46-be4b-a2b4c2988e8a', '{amor_amistad,dia_madre,detalle}', '{pareja,mama,amiga_o}', '{naturaleza,elegante}') -- Rosa Individual,
  ('faea1e7a-eb0a-40dc-980b-c90693cc942a', '{cumpleanos,bebe,amor_amistad}', '{nina_nino,bebe,pareja}', '{tierno,divertido}') -- Peluche Pollito (Huevo) 12cm,
  ('77582151-81ad-45e8-bc8e-0d6d437ee6f7', '{cumpleanos}', '{fan_personaje,nina_nino}', '{coleccionable,divertido}') -- Peluche Snoopy grande 32cm,
  ('9114717c-fcc0-43e7-b2cb-8676a9e12334', '{cumpleanos,bebe,amor_amistad}', '{nina_nino,bebe,pareja}', '{tierno,divertido}') -- Peluche Castor con Fresa 15cm,
  ('0fff4714-7328-4fdd-b35f-03e882fb4d5b', '{cumpleanos,bebe,amor_amistad}', '{nina_nino,bebe,pareja}', '{tierno,divertido}') -- Peluche Cerdo 21cm,
  ('8e33a4d5-d05a-4f65-8820-02dc11748816', '{cumpleanos,bebe,amor_amistad}', '{nina_nino,bebe,pareja}', '{tierno,divertido}') -- Peluche Oso 21cm,
  ('12e49286-fafe-43c8-af71-d138de252511', '{cumpleanos,bebe,amor_amistad}', '{nina_nino,bebe,pareja}', '{tierno,divertido}') -- Peluche gato 21cm,
  ('9fbf20dc-9845-43fd-a9cb-76f0fe7a2e4d', '{cumpleanos,bebe,amor_amistad}', '{nina_nino,bebe,pareja}', '{tierno,divertido}') -- Peluche Conejo (Sin ropa) 22cm,
  ('2317b614-1d5c-40f2-a8d3-c43924afc88e', '{cumpleanos,bebe,amor_amistad}', '{nina_nino,bebe,pareja}', '{tierno,divertido}') -- Peluche Elefante 14cm,
  ('22b90e68-4c0e-4aa9-b897-ea1ba14c1fb4', '{cumpleanos,bebe,amor_amistad}', '{nina_nino,bebe,pareja}', '{tierno,divertido}') -- Peluche Pingüino 14cm,
  ('90f0a858-a7f2-44f8-a04c-e2d623671153', '{cumpleanos,bebe,amor_amistad}', '{nina_nino,bebe,pareja}', '{tierno,divertido}') -- Peluche Dinosaurio 14cm,
  ('e61e5f0b-c39c-40f3-9abd-4c6878442133', '{cumpleanos,bebe,amor_amistad}', '{nina_nino,bebe,pareja}', '{tierno,divertido}') -- Peluche Gato (Huevo) 11cm,
  ('2dcec930-018f-489d-9278-6a280f63b9e0', '{cumpleanos}', '{fan_personaje,nina_nino}', '{coleccionable,divertido}') -- Pato el cerdito 10cm,
  ('ba112d06-630d-4572-a300-ff073e146448', '{cumpleanos}', '{fan_personaje,nina_nino}', '{coleccionable,divertido}') -- Peluche Sin Rostro 15cm,
  ('698d3303-8fa5-43b3-8136-32ebf2b527ee', '{dia_madre,agradecimiento,decoracion,amor_amistad}', '{mama,amiga_o,pareja}', '{naturaleza,elegante}') -- Maceta de Zorro 12cm*12cm,
  ('85c65e67-5d80-4ede-8984-dc051410b675', '{dia_madre,agradecimiento,decoracion,amor_amistad}', '{mama,amiga_o,pareja}', '{naturaleza,elegante}') -- Maceta Margarita,
  ('d5fb176d-6203-4024-813a-de770bd7cf6b', '{dia_madre,agradecimiento,decoracion,amor_amistad}', '{mama,amiga_o,pareja}', '{naturaleza,elegante}') -- Maceta Tulipán,
  ('dcf0d6e9-5d8e-4a59-89a9-5a19c18a8330', '{detalle,agradecimiento,cumpleanos}', '{amiga_o,colega_profe}', '{tierno,divertido}') -- Gato Separador de Libros,
  ('37776b5a-c861-4f0e-b5e5-c1d48b82f741', '{cumpleanos,amor_amistad,detalle}', '{amiga_o,pareja,colega_profe,nina_nino}', '{tierno,divertido}') -- Llavero Fresa 5cm,
  ('e559d7db-6ead-43df-8c15-9145871c735e', '{cumpleanos,dia_padre,detalle}', '{papa,amiga_o,nina_nino}', '{colombiano,divertido}') -- Llavero Balón Colombia,
  ('9408b914-fe1c-42b6-8cbc-5e746f8a5f76', '{cumpleanos,amor_amistad,detalle}', '{amiga_o,pareja,colega_profe,nina_nino}', '{tierno,divertido}') -- Llavero Estrella 6cm,
  ('44198bce-f724-4a93-b67e-f5be276e3793', '{cumpleanos}', '{fan_personaje,nina_nino}', '{coleccionable,divertido}') -- Lambie Doctora Juguetes 15cm,
  ('2b858d11-bace-4c26-a8c3-266a1f695706', '{cumpleanos,dia_madre,amor_amistad}', '{mama,amiga_o,pareja}', '{elegante}') -- Bolso ZARIA,
  ('2c0d9f1f-84b9-4267-a71b-17be7217094e', '{cumpleanos,dia_madre,amor_amistad}', '{mama,amiga_o,nina_nino}', '{tierno,coleccionable}') -- Rosina tejida 13cm,
  ('3a480ba4-e9db-414a-a571-5d396c91183b', '{cumpleanos}', '{fan_personaje,nina_nino}', '{coleccionable,divertido}') -- Llavero Labubu 10cm
on conflict (item_id) do nothing;

-- Cuando Sara corrija un producto, se registra así (el recomendador empieza a usarlo):
--   update public.producto_etiquetas
--      set ocasiones = '{cumpleanos,dia_madre}', destinatarios = '{mama,amiga_o}', estilos = '{tierno}',
--          revisado_por = 'Sara', revisado_en = now(), actualizado_en = now()
--    where item_id = '<id del producto>';
-- Los filtros «¿Para quién?» y «¿Qué ocasión?» aparecen en la web solo cuando hay al menos
-- CONFIG.MIN_ETIQUETADOS (20, en js/universo/config.js) productos con revisado_en.
