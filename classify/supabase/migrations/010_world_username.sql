alter table public.app_users
  add column if not exists username text;
