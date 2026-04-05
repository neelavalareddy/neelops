-- Full session-level judge evaluation (README spec: multi-criteria + hallucination flags + ensemble)

alter table public.agents
  add column if not exists tests_completed integer not null default 0,
  add column if not exists avg_score numeric(4,3);

create table public.session_evaluations (
  id                      uuid primary key default gen_random_uuid(),
  session_id              uuid not null references public.agent_sessions(id) on delete cascade,

  -- Per-criteria scores (0.0 – 1.0), matching README judge rubric
  relevance_score         numeric(4,3) not null,
  relevance_reason        text,
  rule_compliance_score   numeric(4,3) not null,
  rule_compliance_reason  text,
  ai_detection_score      numeric(4,3) not null,   -- 1.0 = definitely human
  ai_detection_reason     text,
  objective_completion    numeric(4,3) not null,
  objective_completion_reason text,

  -- Hallucination flags: [{turn, claim, severity}]
  hallucination_flags     jsonb not null default '[]',

  -- Aggregate
  overall_score           numeric(4,3) not null,
  overall_assessment      text,
  passed                  boolean not null,

  -- Judge metadata
  judge_model             text not null,
  judge_reasoning         text,
  secondary_judge_model   text,
  secondary_judge_agreed  boolean,

  -- Deterministic pre-check flags that ran before LLM judge
  precheck_flags          jsonb not null default '[]',

  created_at              timestamptz not null default now(),
  unique (session_id)
);

alter table public.session_evaluations enable row level security;
create policy "Anyone can read session_evaluations"  on public.session_evaluations for select using (true);
create policy "Anyone can insert session_evaluations" on public.session_evaluations for insert with check (true);
create policy "Anyone can update session_evaluations" on public.session_evaluations for update using (true);

create index idx_session_evaluations_session on public.session_evaluations(session_id);
create index idx_session_evaluations_passed  on public.session_evaluations(passed);
