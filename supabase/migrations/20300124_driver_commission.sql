-- ─────────────────────────────────────────────────────────────────────────────
-- Driver Commission System
-- Bike and car drivers pay 10% commission per completed ride.
-- Due window: next sign-in (not time-based like sellers).
-- Hard fallback: account suspended 14 days after first missed commission.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Add driver commission columns to bookings table ───────────────────────────
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS commission_amount  numeric(12,2),
  ADD COLUMN IF NOT EXISTS commission_status  text DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS commission_type    text;   -- 'driver_bike' | 'driver_car'

-- ── Trip end declaration columns ─────────────────────────────────────────────
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS trip_outcome       text,   -- 'complete' | 'cancelled'
  ADD COLUMN IF NOT EXISTS cancel_reason      text,   -- reason if cancelled
  ADD COLUMN IF NOT EXISTS outcome_declared_at timestamptz;

-- ── Driver suspension flag ────────────────────────────────────────────────────
ALTER TABLE driver_profiles
  ADD COLUMN IF NOT EXISTS commission_suspended    boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS commission_suspended_at timestamptz,
  ADD COLUMN IF NOT EXISTS commission_proof_url    text,
  ADD COLUMN IF NOT EXISTS commission_proof_at     timestamptz;

-- ── RPC: record commission when driver taps "Trip Complete" ──────────────────
CREATE OR REPLACE FUNCTION record_commission_on_trip_complete(
  p_booking_id  uuid,
  p_driver_id   uuid,
  p_fare        numeric,
  p_commission_type text  -- 'driver_bike' | 'driver_car'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rate      numeric := 0.10;
  v_amount    numeric;
  v_comm_id   uuid;
BEGIN
  v_amount := round(p_fare * v_rate, 0);

  -- Mark booking as complete with commission
  UPDATE bookings SET
    trip_outcome        = 'complete',
    outcome_declared_at = now(),
    commission_amount   = v_amount,
    commission_status   = 'pending',
    commission_type     = p_commission_type
  WHERE id = p_booking_id;

  -- Insert into seller_commissions (shared table, driver entries)
  INSERT INTO seller_commissions (
    seller_id, order_id, amount, commission_type, rate, status,
    created_at
    -- NOTE: due_at is NULL for drivers — due at next sign-in, not time-based
  ) VALUES (
    p_driver_id, p_booking_id, v_amount, p_commission_type, v_rate, 'pending',
    now()
  )
  RETURNING id INTO v_comm_id;

  RETURN v_comm_id;
END;
$$;

-- ── RPC: record trip cancellation (no commission) ────────────────────────────
CREATE OR REPLACE FUNCTION record_trip_cancellation(
  p_booking_id uuid,
  p_reason     text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE bookings SET
    trip_outcome        = 'cancelled',
    cancel_reason       = p_reason,
    outcome_declared_at = now(),
    commission_status   = 'none'
  WHERE id = p_booking_id;
END;
$$;

-- ── RPC: check if driver has unpaid commission (blocks sign-in) ──────────────
CREATE OR REPLACE FUNCTION driver_has_unpaid_commission(p_driver_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT count(*) INTO v_count
  FROM seller_commissions
  WHERE seller_id = p_driver_id
    AND commission_type IN ('driver_bike', 'driver_car')
    AND status IN ('pending', 'overdue');
  RETURN v_count > 0;
END;
$$;

-- ── RPC: get driver commission balance ────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_driver_commission_balance(p_driver_id uuid)
RETURNS TABLE(
  total_pending  numeric,
  total_paid     numeric,
  unpaid_count   integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    coalesce(sum(amount) FILTER (WHERE status IN ('pending','overdue')), 0) AS total_pending,
    coalesce(sum(amount) FILTER (WHERE status = 'paid'), 0)                 AS total_paid,
    count(*)              FILTER (WHERE status IN ('pending','overdue'))::integer AS unpaid_count
  FROM seller_commissions
  WHERE seller_id = p_driver_id
    AND commission_type IN ('driver_bike', 'driver_car');
END;
$$;

-- ── Cron: suspend drivers with 14-day unpaid commissions ─────────────────────
CREATE OR REPLACE FUNCTION sweep_suspended_drivers()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Mark commissions overdue (14-day hard fallback for drivers)
  UPDATE seller_commissions
  SET status = 'overdue'
  WHERE commission_type IN ('driver_bike', 'driver_car')
    AND status = 'pending'
    AND created_at < now() - interval '14 days';

  -- Suspend driver accounts with overdue commissions older than 14 days
  UPDATE driver_profiles
  SET commission_suspended    = true,
      commission_suspended_at = now()
  WHERE id IN (
    SELECT DISTINCT seller_id
    FROM seller_commissions
    WHERE commission_type IN ('driver_bike', 'driver_car')
      AND status = 'overdue'
      AND created_at < now() - interval '14 days'
  )
  AND commission_suspended = false;
END;
$$;

-- Run once daily at 03:00 UTC
SELECT cron.schedule(
  'sweep-suspended-drivers',
  '0 3 * * *',
  'SELECT sweep_suspended_drivers()'
);
