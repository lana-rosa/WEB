-- Borrado automático de las fotos de referencia de Personaliza a los 90 días (17-oct-2026). Aplicada en Supabase.
-- La Edge Function depurar-fotos-referencia (herramientas/cuentas-clientes/funciones/) borra del almacenamiento los archivos con más de
-- 90 días y quita los enlaces en las oportunidades del ERP. Este job la llama todos los días a las 8:45 a. m. de Colombia (13:45 UTC).
-- Prueba sin borrar: select net.http_post(url := 'https://ngjoognzvehwjtpqwrqe.supabase.co/functions/v1/depurar-fotos-referencia',
--   headers := jsonb_build_object('Content-Type','application/json'), body := '{"dry": true}'::jsonb);  y leer net._http_response.
select cron.schedule('depurar-fotos-referencia', '45 13 * * *',
  $$select net.http_post(url := 'https://ngjoognzvehwjtpqwrqe.supabase.co/functions/v1/depurar-fotos-referencia',
    headers := jsonb_build_object('Content-Type', 'application/json'), body := '{}'::jsonb)$$);
