-- ── Seller unlock & subscription system ─────────────────────────────────────
-- Tiers:
--   free        → 20-min chat, no unlocks
--   starter     → 2 unlocks purchased (1.99 USD one-time)
--   standard    → unlimited unlocks + 50 products (40,000 rp/month)
--   premium     → unlimited unlocks + unlimited products + 1 boost/mo (79,000 rp/month)

-- ── 1. seller_subscriptions ──────────────────────────────────────────────────
create table if not exists seller_subscriptions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  plan          text not null check (plan in ('standard','premium')),
  status        text not null default 'active' check (status in ('active','cancelled','expired','suspended')),
  price_idr     int  not null,                          -- 40000 or 79000
  started_at    timestamptz not null default now(),
  renews_at     timestamptz not null,                   -- next billing date
  cancelled_at  timestamptz,
  stripe_sub_id text,                                   -- Stripe subscription ID
  boost_used_at timestamptz,                            -- last time monthly boost was used
  created_at    timestamptz not null default now()
);

create index if not exists seller_subscriptions_user_idx on seller_subscriptions(user_id, status);

alter table seller_subscriptions enable row level security;

create policy "owner reads own subscription"
  on seller_subscriptions for select
  using (auth.uid() = user_id);

create policy "owner inserts own subscription"
  on seller_subscriptions for insert
  with check (auth.uid() = user_id);

create policy "owner updates own subscription"
  on seller_subscriptions for update
  using (auth.uid() = user_id);

-- Admin full access
create policy "admin full access subscriptions"
  on seller_subscriptions for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  );

-- ── 2. chat_unlocks ──────────────────────────────────────────────────────────
-- Each row = 1 unlock credit purchased or granted
create table if not exists chat_unlocks (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  credits_total   int  not null default 2,    -- unlocks bought in this batch
  credits_used    int  not null default 0,
  price_usd       numeric(6,2) not null default 1.99,
  stripe_pi_id    text,                       -- Stripe PaymentIntent ID
  purchased_at    timestamptz not null default now(),
  expires_at      timestamptz not null default now() + interval '90 days'
);

create index if not exists chat_unlocks_user_idx on chat_unlocks(user_id);

alter table chat_unlocks enable row level security;

create policy "owner reads own unlocks"
  on chat_unlocks for select
  using (auth.uid() = user_id);

create policy "owner inserts own unlocks"
  on chat_unlocks for insert
  with check (auth.uid() = user_id);

create policy "owner updates own unlocks"
  on chat_unlocks for update
  using (auth.uid() = user_id);

-- ── 3. chat_sessions ─────────────────────────────────────────────────────────
-- Tracks the 20-min free window per conversation pair
create table if not exists chat_sessions (
  id              uuid primary key default gen_random_uuid(),
  conversation_id text not null,
  user_id         uuid not null references auth.users(id) on delete cascade,
  started_at      timestamptz not null default now(),
  unlocked_at     timestamptz,               -- when they paid / subscribed to extend
  unlock_type     text check (unlock_type in ('credit','subscription')),
  unique (conversation_id, user_id)
);

create index if not exists chat_sessions_conv_idx on chat_sessions(conversation_id, user_id);

alter table chat_sessions enable row level security;

create policy "owner reads own chat sessions"
  on chat_sessions for select
  using (auth.uid() = user_id);

create policy "owner manages own chat sessions"
  on chat_sessions for insert
  with check (auth.uid() = user_id);

create policy "owner updates own chat sessions"
  on chat_sessions for update
  using (auth.uid() = user_id);

-- ── 4. Helper: get available unlock credits for a user ───────────────────────
create or replace function get_unlock_balance(p_user_id uuid)
returns int
language sql
stable
as $$
  select coalesce(sum(credits_total - credits_used), 0)::int
  from chat_unlocks
  where user_id = p_user_id
    and credits_used < credits_total
    and expires_at > now();
$$;

-- ── 5. Helper: consume one unlock credit ─────────────────────────────────────
create or replace function consume_unlock_credit(p_user_id uuid)
returns boolean
language plpgsql
security definer
as $$
declare
  v_id uuid;
begin
  -- Find oldest batch with remaining credits
  select id into v_id
  from chat_unlocks
  where user_id = p_user_id
    and credits_used < credits_total
    and expires_at > now()
  order by purchased_at asc
  limit 1;

  if v_id is null then
    return false;
  end if;

  update chat_unlocks
  set credits_used = credits_used + 1
  where id = v_id;

  return true;
end;
$$;

-- ── 6. tier column on profiles (if not exists) ───────────────────────────────
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'profiles' and column_name = 'seller_plan'
  ) then
    alter table profiles add column seller_plan text default 'free'
      check (seller_plan in ('free','standard','premium'));
  end if;
end $$;

-- Admin can update seller_plan
create policy "admin update seller_plan"
  on profiles for update
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );
