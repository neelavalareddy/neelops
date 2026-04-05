-- Allow multiple attempts per worker per agent over time, while still
-- permitting only one active session at a time.

alter table public.agent_sessions
  drop constraint if exists agent_sessions_agent_id_nullifier_hash_key;

create unique index if not exists idx_agent_sessions_one_active_per_worker
  on public.agent_sessions (agent_id, nullifier_hash)
  where status = 'active';
