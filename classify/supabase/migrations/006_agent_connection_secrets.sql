-- Move external endpoint bearer tokens out of the public agents table.

create table if not exists public.agent_connection_secrets (
  agent_id uuid primary key references public.agents(id) on delete cascade,
  endpoint_api_key text not null,
  created_at timestamptz not null default now()
);

alter table public.agent_connection_secrets enable row level security;

create policy "No public reads on agent_connection_secrets"
  on public.agent_connection_secrets
  for select
  using (false);

create policy "No public writes on agent_connection_secrets"
  on public.agent_connection_secrets
  for all
  using (false)
  with check (false);

insert into public.agent_connection_secrets (agent_id, endpoint_api_key)
select id, endpoint_api_key
from public.agents
where endpoint_api_key is not null
  and length(trim(endpoint_api_key)) > 0
on conflict (agent_id) do update
set endpoint_api_key = excluded.endpoint_api_key;

update public.agents
set endpoint_api_key = null
where endpoint_api_key is not null;
