-- VIVA CONECTA - ESTADO SINCRONIZADO DO DASHBOARD
-- Rode este SQL UMA VEZ no SQL Editor do Supabase.

create table if not exists public.viva_state (
  id bigint primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.viva_state enable row level security;

-- Leitura pública para as TVs
create policy "viva_state_select_public"
on public.viva_state
for select
to anon, authenticated
using (true);

-- Escrita temporariamente pública para o painel administrativo desta versão.
-- Depois podemos trocar por login Supabase e restringir a usuários autenticados.
create policy "viva_state_insert_public"
on public.viva_state
for insert
to anon, authenticated
with check (id = 1);

create policy "viva_state_update_public"
on public.viva_state
for update
to anon, authenticated
using (id = 1)
with check (id = 1);

insert into public.viva_state (id, data)
values (1, '{}'::jsonb)
on conflict (id) do nothing;

-- Realtime para atualização automática
alter publication supabase_realtime add table public.viva_state;
