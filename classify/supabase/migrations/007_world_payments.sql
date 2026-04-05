-- Real World wallet funding and payout tracking for task marketplace flows.

alter table public.app_users
  add column if not exists wallet_address text unique,
  add column if not exists wallet_connected_at timestamptz;

alter table public.tasks
  add column if not exists created_by_user_id uuid references public.app_users(id) on delete set null,
  add column if not exists max_responses integer not null default 10,
  add column if not exists funded_pool_wld numeric(10,4) not null default 0,
  add column if not exists remaining_pool_wld numeric(10,4) not null default 0,
  add column if not exists funding_status text not null default 'unfunded'
    check (funding_status in ('unfunded', 'funded', 'depleted')),
  add column if not exists funding_reference text,
  add column if not exists funding_transaction_id text,
  add column if not exists funding_wallet_address text,
  add column if not exists funded_at timestamptz;

alter table public.responses
  add column if not exists payout_status text not null default 'pending'
    check (payout_status in ('pending', 'paid', 'failed')),
  add column if not exists payout_wallet_address text,
  add column if not exists payout_transaction_hash text,
  add column if not exists payout_error text,
  add column if not exists payout_attempted_at timestamptz,
  add column if not exists payout_paid_at timestamptz;

create or replace function public.claim_task_pool(task_uuid uuid, amount numeric)
returns table(remaining_pool_wld numeric, funding_status text)
language plpgsql
as $$
begin
  return query
  update public.tasks
     set remaining_pool_wld = tasks.remaining_pool_wld - amount,
         funding_status = case
           when tasks.remaining_pool_wld - amount <= 0 then 'depleted'
           else tasks.funding_status
         end,
         status = case
           when tasks.remaining_pool_wld - amount < tasks.bounty_wld then 'closed'
           else tasks.status
         end
   where tasks.id = task_uuid
     and tasks.status = 'open'
     and tasks.remaining_pool_wld >= amount
  returning tasks.remaining_pool_wld, tasks.funding_status;
end;
$$;

create or replace function public.release_task_pool(task_uuid uuid, amount numeric)
returns table(remaining_pool_wld numeric, funding_status text)
language plpgsql
as $$
begin
  return query
  update public.tasks
     set remaining_pool_wld = tasks.remaining_pool_wld + amount,
         funding_status = case
           when tasks.remaining_pool_wld + amount > 0 then 'funded'
           else tasks.funding_status
         end,
         status = case
           when tasks.status = 'closed' and tasks.remaining_pool_wld + amount >= tasks.bounty_wld then 'open'
           else tasks.status
         end
   where tasks.id = task_uuid
  returning tasks.remaining_pool_wld, tasks.funding_status;
end;
$$;
