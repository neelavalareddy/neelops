-- AI pre-score, aggregated insights, light anomaly flags

alter table public.tasks
  add column if not exists predicted_score smallint check (predicted_score between 1 and 5),
  add column if not exists prediction_rationale text,
  add column if not exists insights_json jsonb,
  add column if not exists insights_generated_at timestamptz;

alter table public.responses
  add column if not exists flagged_suspicious boolean not null default false,
  add column if not exists time_to_submit_ms integer;

comment on column public.tasks.predicted_score is 'Model-predicted 1–5 quality before human ratings';
comment on column public.tasks.insights_json is 'LLM-extracted consensus themes when 5+ responses exist';
comment on column public.responses.flagged_suspicious is 'Heuristic: uniform ratings across tasks and/or very fast submit';
