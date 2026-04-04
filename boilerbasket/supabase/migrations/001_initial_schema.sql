-- BoilerBasket Initial Schema
-- Run via: supabase db push

-- Enable required extensions
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────
-- USERS
-- Extends Supabase auth.users with app profile data
-- ─────────────────────────────────────────────
create table public.users (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text not null unique,
  full_name       text not null,
  purdue_id       text,                        -- optional student ID
  avatar_url      text,
  -- ratings are averages maintained via trigger after reviews insert
  rating_as_requester numeric(3,2) default null,
  rating_as_picker    numeric(3,2) default null,
  review_count_requester integer not null default 0,
  review_count_picker    integer not null default 0,
  -- Stripe Connect for picker payouts
  stripe_account_id     text,                 -- TODO: populated after Connect onboarding
  stripe_onboarding_complete boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Row-level security
alter table public.users enable row level security;

create policy "Users can view any profile"
  on public.users for select using (true);

create policy "Users can update own profile"
  on public.users for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.users for insert with check (auth.uid() = id);

-- ─────────────────────────────────────────────
-- ORDERS
-- ─────────────────────────────────────────────
create type order_status as enum (
  'open',         -- posted, waiting for a picker
  'claimed',      -- picker has claimed it, going to pick up
  'picked_up',    -- picker has the food
  'delivered',    -- requester confirmed delivery
  'cancelled'     -- cancelled before claim
);

create table public.orders (
  id                  uuid primary key default uuid_generate_v4(),
  requester_id        uuid not null references public.users(id) on delete restrict,
  picker_id           uuid references public.users(id) on delete set null,

  -- Order details
  dining_hall         text not null,
  items               text not null,           -- free-text for MVP
  dropoff_building    text not null,
  notes               text,

  -- Pricing
  meal_cost           numeric(6,2) not null,   -- requester's estimate of meal value
  convenience_fee     numeric(6,2) not null,   -- computed: base $1.20 + distance fee
  total_charge        numeric(6,2) generated always as (meal_cost + convenience_fee) stored,

  -- Payment
  payment_intent_id   text,                    -- Stripe PaymentIntent id
  payment_status      text not null default 'pending',  -- pending | held | released | refunded
  payout_transfer_id  text,                    -- Stripe Transfer id for picker payout

  -- Status
  status              order_status not null default 'open',

  -- Timestamps
  claimed_at          timestamptz,
  picked_up_at        timestamptz,
  delivered_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table public.orders enable row level security;

-- Requesters see their own orders; pickers see open + orders they claimed
create policy "Requesters see own orders"
  on public.orders for select
  using (auth.uid() = requester_id);

create policy "Pickers see open or claimed orders"
  on public.orders for select
  using (status = 'open' or auth.uid() = picker_id);

create policy "Requesters can insert orders"
  on public.orders for insert
  with check (auth.uid() = requester_id);

create policy "Requester or picker can update own orders"
  on public.orders for update
  using (auth.uid() = requester_id or auth.uid() = picker_id);

-- ─────────────────────────────────────────────
-- REVIEWS
-- ─────────────────────────────────────────────
create table public.reviews (
  id            uuid primary key default uuid_generate_v4(),
  order_id      uuid not null references public.orders(id) on delete cascade,
  reviewer_id   uuid not null references public.users(id) on delete cascade,
  reviewee_id   uuid not null references public.users(id) on delete cascade,
  -- role of the reviewee in the order (so we know which rating bucket to update)
  reviewee_role text not null check (reviewee_role in ('requester', 'picker')),
  rating        smallint not null check (rating between 1 and 5),
  comment       text,
  created_at    timestamptz not null default now(),
  -- one review per role per order
  unique (order_id, reviewer_id, reviewee_role)
);

alter table public.reviews enable row level security;

create policy "Anyone can read reviews"
  on public.reviews for select using (true);

create policy "Reviewer can insert own review"
  on public.reviews for insert
  with check (auth.uid() = reviewer_id);

-- ─────────────────────────────────────────────
-- TRIGGER: keep user rating averages up to date
-- ─────────────────────────────────────────────
create or replace function update_user_rating()
returns trigger language plpgsql security definer as $$
declare
  avg_rating numeric(3,2);
  review_count integer;
begin
  select
    round(avg(rating)::numeric, 2),
    count(*)
  into avg_rating, review_count
  from public.reviews
  where reviewee_id = NEW.reviewee_id
    and reviewee_role = NEW.reviewee_role;

  if NEW.reviewee_role = 'requester' then
    update public.users
    set rating_as_requester = avg_rating,
        review_count_requester = review_count,
        updated_at = now()
    where id = NEW.reviewee_id;
  else
    update public.users
    set rating_as_picker = avg_rating,
        review_count_picker = review_count,
        updated_at = now()
    where id = NEW.reviewee_id;
  end if;

  return NEW;
end;
$$;

create trigger on_review_insert
  after insert on public.reviews
  for each row execute function update_user_rating();

-- ─────────────────────────────────────────────
-- TRIGGER: auto-update orders.updated_at
-- ─────────────────────────────────────────────
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$;

create trigger orders_updated_at
  before update on public.orders
  for each row execute function touch_updated_at();

create trigger users_updated_at
  before update on public.users
  for each row execute function touch_updated_at();

-- ─────────────────────────────────────────────
-- REALTIME: enable on orders table
-- ─────────────────────────────────────────────
alter publication supabase_realtime add table public.orders;
