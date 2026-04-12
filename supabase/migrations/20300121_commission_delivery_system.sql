-- ─────────────────────────────────────────────────────────────────────────────
-- 20300121  Commission + Delivery System
-- 5% seller commission on every completed order, delivery options per seller,
-- account-level blocking for commission avoidance.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. seller_commissions ────────────────────────────────────────────────────
create table if not exists seller_commissions (
  id            uuid primary key default gen_random_uuid(),
  seller_id     uuid not null references auth.users(id) on delete cascade,
  order_id      text not null,
  amount        numeric(12,2) not null check (amount >= 0),
  status        text not null default 'pending'
                  check (status in ('pending','paid','overdue','waived')),
  created_at    timestamptz not null default now(),
  due_at        timestamptz not null default (now() + interval '72 hours'),
  paid_at       timestamptz,
  notes         text
);

create index if not exists idx_seller_commissions_seller_status
  on seller_commissions(seller_id, status);

create index if not exists idx_seller_commissions_order
  on seller_commissions(order_id);

-- ── 2. blocked_accounts ──────────────────────────────────────────────────────
-- Tracks sellers blocked for commission avoidance (phone + user_id)
create table if not exists blocked_accounts (
  id            uuid primary key default gen_random_uuid(),
  phone         text,
  user_id       uuid references auth.users(id) on delete set null,
  reason        text not null default 'commission_avoidance',
  blocked_at    timestamptz not null default now(),
  unblocked_at  timestamptz,
  notes         text,
  unique(phone),
  unique(user_id)
);

create index if not exists idx_blocked_accounts_phone   on blocked_accounts(phone);
create index if not exists idx_blocked_accounts_user_id on blocked_accounts(user_id);

-- ── 3. Delivery options on businesses ────────────────────────────────────────
-- delivery_options is a JSONB array:
--   [{ type: 'hangger_ride'|'jne'|'jnt'|'sicepat'|'ninja'|'pos', label, base_fare, per_km, city_only }]
alter table businesses
  add column if not exists delivery_options jsonb not null default '[]'::jsonb;

-- ── 4. Add commission tracking columns to orders ──────────────────────────────
alter table orders
  add column if not exists commission_amount  numeric(12,2),
  add column if not exists commission_status  text default 'none'
    check (commission_status in ('none','pending','paid','overdue','waived'));

-- ── 5. RPC: record_commission ─────────────────────────────────────────────────
-- Called server-side (or from client) when seller marks "Payment Received"
create or replace function record_commission(
  p_seller_id  uuid,
  p_order_id   text,
  p_order_total numeric(12,2)
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_amount  numeric(12,2);
  v_comm_id uuid;
begin
  v_amount := round(p_order_total * 0.05, 2);   -- 5% commission

  insert into seller_commissions(seller_id, order_id, amount)
  values (p_seller_id, p_order_id, v_amount)
  returning id into v_comm_id;

  -- Mirror status onto the order row for easy querying
  update orders
  set commission_amount = v_amount,
      commission_status = 'pending'
  where id = p_order_id;

  return v_comm_id;
end;
$$;

-- ── 6. RPC: get_seller_commission_balance ─────────────────────────────────────
create or replace function get_seller_commission_balance(p_seller_id uuid)
returns table(
  total_owed     numeric,
  total_paid     numeric,
  pending_count  bigint,
  overdue_count  bigint
)
language sql
security definer
as $$
  select
    coalesce(sum(case when status in ('pending','overdue') then amount else 0 end), 0) as total_owed,
    coalesce(sum(case when status = 'paid' then amount else 0 end), 0)                 as total_paid,
    count(*) filter (where status = 'pending')                                         as pending_count,
    count(*) filter (where status = 'overdue')                                         as overdue_count
  from seller_commissions
  where seller_id = p_seller_id;
$$;

-- ── 7. Scheduled overdue sweep (runs via cron every hour) ─────────────────────
-- Marks commissions past due_at as overdue
create or replace function sweep_overdue_commissions()
returns void
language sql
security definer
as $$
  update seller_commissions
  set status = 'overdue'
  where status = 'pending'
    and due_at < now();

  update orders
  set commission_status = 'overdue'
  where commission_status = 'pending'
    and id in (
      select order_id from seller_commissions where status = 'overdue'
    );
$$;

-- Register the hourly cron sweep (requires pg_cron)
select cron.schedule(
  'sweep-overdue-commissions',
  '0 * * * *',
  $$ select sweep_overdue_commissions(); $$
) on conflict do nothing;
