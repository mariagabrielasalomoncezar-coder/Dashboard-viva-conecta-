-- Viva Conecta: TVs podem ler sem login; alterações exigem usuário autenticado.
alter table public.viva_state enable row level security;

revoke insert, update, delete on table public.viva_state from anon;
grant select on table public.viva_state to anon, authenticated;
grant insert, update on table public.viva_state to authenticated;

drop policy if exists "viva_state_select_public" on public.viva_state;
drop policy if exists "viva_state_insert_public" on public.viva_state;
drop policy if exists "viva_state_update_public" on public.viva_state;
drop policy if exists "viva_state_select_all" on public.viva_state;
drop policy if exists "viva_state_insert_authenticated" on public.viva_state;
drop policy if exists "viva_state_update_authenticated" on public.viva_state;

create policy "viva_state_select_all"
on public.viva_state
for select
to anon, authenticated
using (true);

create policy "viva_state_insert_authenticated"
on public.viva_state
for insert
to authenticated
with check (id = 1);

create policy "viva_state_update_authenticated"
on public.viva_state
for update
to authenticated
using (id = 1)
with check (id = 1);
