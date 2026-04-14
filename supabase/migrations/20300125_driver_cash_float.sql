-- ─────────────────────────────────────────────────────────────────────────────
-- 20300125  Driver cash float declaration
--
-- Drivers declare their available cash each time they go online.
-- This controls which COD food orders they are eligible to receive:
--   driver.cash_float >= order.food_total  → eligible
--   driver.cash_float <  order.food_total  → NOT assigned for that COD order
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Add cash float columns to driver_profiles ──────────────────────────────
alter table driver_profiles
  add column if not exists cash_float              numeric(12,2) default 0,
  add column if not exists cash_float_declared_at  timestamptz;

-- ── 2. Index — booking matcher queries by driver + float amount ───────────────
create index if not exists idx_driver_profiles_cash_float
  on driver_profiles(cash_float)
  where cash_float > 0;

-- ── 3. RPC: upsert cash float on go-online ────────────────────────────────────
-- Called from DriverCashFloatModal when driver confirms going online.
create or replace function set_driver_cash_float(
  p_driver_id uuid,
  p_amount     numeric
)
returns void
language plpgsql
security definer
as $$
begin
  update driver_profiles
  set cash_float             = p_amount,
      cash_float_declared_at = now()
  where user_id = p_driver_id;
end;
$$;

-- ── 4. RPC: check if driver is eligible for a COD food order ──────────────────
-- Returns true when driver's declared cash covers the food total.
-- Transfer orders always return true (no float required).
create or replace function driver_eligible_for_cod_order(
  p_driver_id    uuid,
  p_food_total   numeric,
  p_payment_method text  -- 'cod' | 'bank_transfer'
)
returns boolean
language plpgsql
security definer
as $$
declare
  v_float numeric := 0;
begin
  if p_payment_method <> 'cod' then
    return true;
  end if;

  select coalesce(cash_float, 0)
  into   v_float
  from   driver_profiles
  where  user_id = p_driver_id;

  return v_float >= p_food_total;
end;
$$;

-- ── 5. Reset float to 0 when driver goes offline ──────────────────────────────
-- Ensures stale floats from a previous shift don't carry over.
create or replace function reset_driver_cash_float_on_offline(
  p_driver_id uuid
)
returns void
language plpgsql
security definer
as $$
begin
  update driver_profiles
  set cash_float             = 0,
      cash_float_declared_at = null
  where user_id = p_driver_id;
end;
$$;
