-- ================================================================
-- MARKETPLACE PROTECTION — content violations, seller reputation,
-- payment verification, return policy
-- ================================================================

-- ────────────────────────────────────────────────────────────────
-- Content violation log — admin reviews blocked messages
-- ────────────────────────────────────────────────────────────────
create table if not exists content_violations (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        references auth.users on delete cascade not null,
  conversation_id text,
  blocked_text    text        not null,
  reason          text        not null,  -- 'phone' | 'link' | 'social'
  role            text,                  -- 'buyer' | 'seller' | null
  reviewed        boolean     default false,
  created_at      timestamptz default now()
);

alter table content_violations enable row level security;
create policy "violations_admin_only" on content_violations for all using (false);

create index if not exists idx_violations_user on content_violations(user_id, created_at desc);
create index if not exists idx_violations_unreviewed on content_violations(reviewed, created_at desc) where reviewed = false;

-- ────────────────────────────────────────────────────────────────
-- Seller reputation — orders filled vs canceled
-- ────────────────────────────────────────────────────────────────
alter table profiles add column if not exists orders_filled   int default 0;
alter table profiles add column if not exists orders_canceled int default 0;
alter table profiles add column if not exists return_count    int default 0;
alter table profiles add column if not exists violation_count int default 0;

-- ────────────────────────────────────────────────────────────────
-- Seller bank details — activated in chat
-- ────────────────────────────────────────────────────────────────
create table if not exists seller_bank_details (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        references auth.users on delete cascade not null unique,
  bank_name       text        not null,
  account_number  text        not null,
  account_name    text        not null,
  is_verified     boolean     default false,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

alter table seller_bank_details enable row level security;
drop policy if exists "bank_owner_select" on seller_bank_details;
drop policy if exists "bank_owner_upsert" on seller_bank_details;
create policy "bank_owner_select" on seller_bank_details for select using (auth.uid() = user_id);
create policy "bank_owner_upsert" on seller_bank_details for insert with check (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────────
-- Payment verifications — screenshot proof tracking
-- ────────────────────────────────────────────────────────────────
create table if not exists payment_verifications (
  id              uuid        primary key default gen_random_uuid(),
  order_id        text        not null,
  conversation_id text        not null,
  buyer_id        uuid        references auth.users on delete cascade not null,
  seller_id       uuid        references auth.users on delete cascade not null,
  screenshot_url  text        not null,
  amount          numeric,
  status          text        not null default 'pending_verification',
    -- 'pending_verification' | 'active' | 'canceled' | 're_upload'
  cancel_count    int         default 0,
  cancel_reason   text,
  verified_at     timestamptz,
  created_at      timestamptz default now()
);

alter table payment_verifications enable row level security;
drop policy if exists "pv_participants" on payment_verifications;
create policy "pv_participants" on payment_verifications for select
  using (auth.uid() = buyer_id or auth.uid() = seller_id);

create index if not exists idx_pv_order on payment_verifications(order_id);
create index if not exists idx_pv_seller on payment_verifications(seller_id, status);

-- ────────────────────────────────────────────────────────────────
-- Return requests
-- ────────────────────────────────────────────────────────────────
create table if not exists return_requests (
  id              uuid        primary key default gen_random_uuid(),
  order_id        text        not null,
  buyer_id        uuid        references auth.users on delete cascade not null,
  seller_id       uuid        references auth.users on delete cascade not null,
  reason          text        not null,
  status          text        not null default 'pending',
    -- 'pending' | 'approved' | 'rejected' | 'completed'
  admin_notes     text,
  created_at      timestamptz default now(),
  resolved_at     timestamptz
);

alter table return_requests enable row level security;
drop policy if exists "return_participants" on return_requests;
create policy "return_participants" on return_requests for select
  using (auth.uid() = buyer_id or auth.uid() = seller_id);
create policy "return_buyer_create" on return_requests for insert
  with check (auth.uid() = buyer_id);

-- ────────────────────────────────────────────────────────────────
-- Commission payment proofs — seller uploads screenshot, admin reviews
-- ────────────────────────────────────────────────────────────────
create table if not exists commission_payments (
  id              uuid        primary key default gen_random_uuid(),
  seller_id       uuid        references auth.users on delete cascade not null,
  screenshot_url  text        not null,
  amount          numeric     not null default 0,
  status          text        not null default 'pending_review',
    -- 'pending_review' | 'confirmed' | 'rejected'
  admin_notes     text,
  reviewed_at     timestamptz,
  created_at      timestamptz default now()
);

alter table commission_payments enable row level security;
drop policy if exists "cp_seller_select" on commission_payments;
create policy "cp_seller_select" on commission_payments for select
  using (auth.uid() = seller_id);
create policy "cp_seller_insert" on commission_payments for insert
  with check (auth.uid() = seller_id);

create index if not exists idx_cp_pending on commission_payments(status, created_at desc) where status = 'pending_review';

-- ────────────────────────────────────────────────────────────────
-- Helper: increment seller reputation counters
-- ────────────────────────────────────────────────────────────────
create or replace function increment_order_filled(p_user_id uuid)
returns void language plpgsql security definer as $$
begin
  update profiles set orders_filled = orders_filled + 1 where id = p_user_id;
end;
$$;

create or replace function increment_order_canceled(p_user_id uuid)
returns void language plpgsql security definer as $$
begin
  update profiles set orders_canceled = orders_canceled + 1 where id = p_user_id;
end;
$$;

create or replace function increment_violation_count(p_user_id uuid)
returns void language plpgsql security definer as $$
begin
  update profiles set violation_count = violation_count + 1 where id = p_user_id;
end;
$$;

-- Auto-increment violation_count when a content_violation is inserted
create or replace function on_content_violation_insert()
returns trigger language plpgsql security definer as $$
begin
  perform increment_violation_count(new.user_id);
  return new;
end;
$$;

drop trigger if exists trg_violation_count on content_violations;
create trigger trg_violation_count
  after insert on content_violations
  for each row execute function on_content_violation_insert();
