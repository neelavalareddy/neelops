-- External agent connection settings for companies that want Classify to call
-- a real internet-reachable agent endpoint instead of the built-in simulator.

alter table public.agents
  add column if not exists connection_mode text not null default 'simulated'
    check (connection_mode in ('simulated', 'openai_compatible')),
  add column if not exists endpoint_base_url text,
  add column if not exists endpoint_api_key text,
  add column if not exists endpoint_model text;

comment on column public.agents.connection_mode is
  'How Classify gets agent replies: simulated or openai_compatible endpoint.';
comment on column public.agents.endpoint_base_url is
  'Base URL for an external OpenAI-compatible API, e.g. https://api.example.com/v1';
comment on column public.agents.endpoint_api_key is
  'Optional bearer token for the external agent endpoint.';
comment on column public.agents.endpoint_model is
  'Model identifier to send to the external OpenAI-compatible API.';
