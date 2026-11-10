-- Migración 44 (5-nov-2026, pedido de la abogada, punto 6): el bucket «guias-envio» pasa a PRIVADO.
--  · Las clientas ven «Ver guía» con un enlace que vence en 10 minutos (función guia-envio, que comprueba que la guía es de sus pedidos).
--  · Solo administrador y cajero pueden pedir enlaces firmados y leer archivos desde el ERP (la subida ya estaba limitada a ellos).
--  · pg_cron llama cada día a la función depurar-guias-envio, que borra las guías de más de 90 días (con la API de Storage).
-- Hoy el bucket tiene 0 archivos, así que no se rompe ningún enlace. El ERP debe abrir las guías con enlaces firmados (ver PENDIENTES).
-- Reversa: update storage.buckets set public = true where id = 'guias-envio'; drop policy "Personal lee guías" on storage.objects; select cron.unschedule('depurar-guias-envio');
update storage.buckets set public = false where id = 'guias-envio';
drop policy if exists "Personal lee guías" on storage.objects;
create policy "Personal lee guías" on storage.objects for select to authenticated
  using (bucket_id = 'guias-envio' and public.fn_rol_actual() in ('administrador'::rol_usuario, 'cajero'::rol_usuario));
select cron.unschedule('depurar-guias-envio') where exists (select 1 from cron.job where jobname = 'depurar-guias-envio');
select cron.schedule('depurar-guias-envio', '55 13 * * *', $cron$select net.http_post(url := 'https://ngjoognzvehwjtpqwrqe.supabase.co/functions/v1/depurar-guias-envio',
    headers := jsonb_build_object('Content-Type', 'application/json'), body := '{}'::jsonb)$cron$);
