-- App-level user accounts backed by World ID verification.

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  world_id_nullifier_hash text not null unique,
  auth_method text not null default 'world_id'
    check (auth_method in ('world_id')),
  role text not null default 'worker'
    check (role in ('worker', 'company', 'admin')),
  created_at timestamptz not null default now(),
  world_id_verified_at timestamptz not null default now(),
  last_sign_in_at timestamptz not null default now()
);

alter table public.app_users enable row level security;

create policy "Anyone can read app_users"
  on public.app_users for select using (true);

create policy "Anyone can insert app_users"
  on public.app_users for insert with check (true);

create policy "Anyone can update app_users"
  on public.app_users for update using (true);
