-- Companies list agents with an objective; users chat; Classify evaluates each user turn.

create table public.agents (
  id            uuid primary key default gen_random_uuid(),
  company_name  text not null,
  name          text not null,
  objective     text not null,
  rules         text not null,
  persona       text,
  bounty_wld    numeric(10,4) not null default 0.5,
  status        text not null default 'open' check (status in ('open','closed')),
  created_at    timestamptz not null default now()
);

alter table public.agents enable row level security;
create policy "Anyone can read agents" on public.agents for select using (true);
create policy "Anyone can insert agents" on public.agents for insert with check (true);
create policy "Anyone can update agents" on public.agents for update using (true);

create table public.agent_sessions (
  id              uuid primary key default gen_random_uuid(),
  agent_id        uuid not null references public.agents(id) on delete cascade,
  nullifier_hash  text not null,
  status          text not null default 'active'
                  check (status in ('active','eligible','rejected','closed')),
  payout_note     text,
  created_at      timestamptz not null default now(),
  unique (agent_id, nullifier_hash)
);

alter table public.agent_sessions enable row level security;
create policy "Anyone can read agent_sessions" on public.agent_sessions for select using (true);
create policy "Anyone can insert agent_sessions" on public.agent_sessions for insert with check (true);
create policy "Anyone can update agent_sessions" on public.agent_sessions for update using (true);

create table public.agent_messages (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.agent_sessions(id) on delete cascade,
  role       text not null check (role in ('user','assistant')),
  content    text not null,
  created_at timestamptz not null default now()
);

alter table public.agent_messages enable row level security;
create policy "Anyone can read agent_messages" on public.agent_messages for select using (true);
create policy "Anyone can insert agent_messages" on public.agent_messages for insert with check (true);

-- Classify evaluation per user message (hallucination / relevance / rules / AI-use detection)
create table public.agent_message_evaluations (
  message_id          uuid primary key references public.agent_messages(id) on delete cascade,
  relevance_1_5       smallint not null check (relevance_1_5 between 1 and 5),
  ai_likelihood_0_1   numeric(4,3) not null check (ai_likelihood_0_1 >= 0 and ai_likelihood_0_1 <= 1),
  rules_compliant     boolean not null,
  rationale           text,
  created_at          timestamptz not null default now()
);

alter table public.agent_message_evaluations enable row level security;
create policy "Anyone can read agent_message_evaluations" on public.agent_message_evaluations for select using (true);
create policy "Anyone can insert agent_message_evaluations" on public.agent_message_evaluations for insert with check (true);
