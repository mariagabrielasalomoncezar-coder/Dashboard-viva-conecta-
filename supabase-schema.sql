create table if not exists public.viva_state (
  id integer primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.viva_state enable row level security;

drop policy if exists "viva public read" on public.viva_state;
drop policy if exists "viva public insert" on public.viva_state;
drop policy if exists "viva public update" on public.viva_state;

create policy "viva public read" on public.viva_state for select using (true);
create policy "viva public insert" on public.viva_state for insert with check (true);
create policy "viva public update" on public.viva_state for update using (true) with check (true);
