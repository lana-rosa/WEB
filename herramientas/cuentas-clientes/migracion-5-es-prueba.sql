-- Pagos de prueba de Wompi no se registran en el ERP (30-sep-2026).
-- El webhook (wompi-webhook) marca es_prueba = true cuando WOMPI_PUBLIC_KEY no empieza por pub_prod_.
alter table public.pedidos_web add column if not exists es_prueba boolean not null default false;

create or replace function public.fn_trg_pedido_web_erp() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.es_prueba then return new; end if;
  begin
    perform fn_registrar_pedido_web_en_erp(new.id);
  exception when others then
    update pedidos_web set erp_error = left(sqlerrm, 500) where id = new.id;
  end;
  return new;
end $$;
