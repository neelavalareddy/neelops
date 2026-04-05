-- Reward deeper, higher-signal agent sessions with explicit judge dimensions
-- and a variable payout amount.

alter table public.session_evaluations
  add column if not exists conversation_depth_score numeric(4,3) not null default 0,
  add column if not exists conversation_depth_reason text,
  add column if not exists edge_case_coverage_score numeric(4,3) not null default 0,
  add column if not exists edge_case_coverage_reason text,
  add column if not exists problem_discovery_score numeric(4,3) not null default 0,
  add column if not exists problem_discovery_reason text;

alter table public.agent_sessions
  add column if not exists payout_wld numeric(10,4);
