-- Classify — Initial Schema

create extension if not exists "pgcrypto";

-- ─── TASKS ────────────────────────────────────────────────────────────────────
create table public.tasks (
  id           uuid        primary key default gen_random_uuid(),
  company_name text        not null,
  ai_output    text        not null,
  criteria     text        not null,
  bounty_wld   numeric(10,4) not null default 0.5,
  status       text        not null default 'open'
                           check (status in ('open','closed')),
  created_at   timestamptz not null default now()
);

alter table public.tasks enable row level security;
create policy "Anyone can read tasks"   on public.tasks for select using (true);
create policy "Anyone can insert tasks" on public.tasks for insert with check (true);
create policy "Anyone can update tasks" on public.tasks for update using (true);

-- ─── RESPONSES ────────────────────────────────────────────────────────────────
create table public.responses (
  id             uuid        primary key default gen_random_uuid(),
  task_id        uuid        not null references public.tasks(id) on delete cascade,
  nullifier_hash text        not null,
  rating         smallint    not null check (rating between 1 and 5),
  feedback_text  text        not null,
  paid           boolean     not null default false,
  created_at     timestamptz not null default now(),
  unique (task_id, nullifier_hash)  -- one submission per World ID per task
);

alter table public.responses enable row level security;
create policy "Anyone can read responses"   on public.responses for select using (true);
create policy "Anyone can insert responses" on public.responses for insert with check (true);
create policy "Anyone can update responses" on public.responses for update using (true);

-- ─── SEED DATA ────────────────────────────────────────────────────────────────
insert into public.tasks (company_name, ai_output, criteria, bounty_wld) values
(
  'OpenEval AI',
  'The French Revolution began in 1789 when citizens of France overthrew their monarchy. The main causes were financial crisis, social inequality, and Enlightenment ideas. Key events include the storming of the Bastille, the Declaration of the Rights of Man, and the Reign of Terror. The revolution ended with Napoleon Bonaparte taking power in 1799.',
  'Rate this AI-generated history summary for: (1) Factual accuracy, (2) Completeness of key events, (3) Clarity and readability, (4) Appropriate length. Provide specific feedback on any missing context or inaccuracies.',
  0.75
),
(
  'SentimentLabs',
  'I recently visited a local coffee shop and had a mixed experience. The coffee was excellent — rich, smooth, and perfectly brewed. However, the service was slow and the seating area felt cramped. The prices were reasonable for the quality. Overall, I would return for the coffee but hope for improvements in service.',
  'Evaluate this AI-generated customer review analysis. Rate it for: (1) Tone neutrality, (2) Coverage of both positive and negative aspects, (3) Whether the implied 3/5 rating matches the written sentiment, (4) Usefulness to the business owner.',
  0.50
),
(
  'CodeAssist Pro',
  E'function calculateSum(arr) {\n  let total = 0;\n  for (let i = 0; i <= arr.length; i++) {\n    total += arr[i];\n  }\n  return total;\n}\n// Returns the sum of all numbers in the array.\n// Time complexity: O(n), Space complexity: O(1)',
  'Review this AI-generated JavaScript code. Rate it for: (1) Correctness — does it work as intended? (2) Code quality and best practices, (3) Accuracy of the complexity analysis, (4) Quality of inline comments. Hint: there may be an off-by-one error — look closely.',
  1.00
);
