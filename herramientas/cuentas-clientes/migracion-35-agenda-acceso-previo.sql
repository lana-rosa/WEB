-- Acceso previo a la agenda completa (28-oct-2026, pedido de Sara).
-- Mientras la agenda completa está «en construcción» (AGENDA_EN_VENTA = false en agenda-rosina.html), el público ve solo las hojas gratis.
-- Las personas de esta lista (por correo de su cuenta, con Google o con código) ven la agenda completa al entrar con esa cuenta.
-- El correo NO está en el código público: la página solo le pregunta a la base «¿mi correo está en la lista?» y cada persona solo puede ver su propia fila.
-- Para agregar a alguien:  insert into public.agenda_acceso_previo (email, nota) values ('correo@gmail.com', 'quién es');
-- Para quitarlo: borrar su fila desde la tabla en el panel de Supabase (Table Editor → agenda_acceso_previo).
create table if not exists public.agenda_acceso_previo (
  email text primary key check (email = lower(email)),
  nota text,
  creado_en timestamptz not null default now()
);
alter table public.agenda_acceso_previo enable row level security;
-- Supabase da por defecto todos los permisos a «authenticated» (incluido TRUNCATE, que la seguridad por filas no frena): se dejan solo lectura
revoke all on public.agenda_acceso_previo from anon, public, authenticated;
grant select on public.agenda_acceso_previo to authenticated;
create policy agenda_acceso_previo_propio on public.agenda_acceso_previo for select to authenticated
  using (email = lower(coalesce(auth.jwt() ->> 'email', '')));
insert into public.agenda_acceso_previo (email, nota) values ('jennifer7610@gmail.com', 'Vista previa de la agenda completa (pedido de Sara, 28-oct-2026)') on conflict (email) do nothing;
