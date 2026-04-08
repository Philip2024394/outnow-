-- ── Repeat order discount ────────────────────────────────────────────────────
-- Restaurants set a % discount for customers who re-order within N days.
-- Shown as a badge on their listing card to incentivise return visits.

ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS repeat_discount_percent  int,
  ADD COLUMN IF NOT EXISTS repeat_discount_days     int NOT NULL DEFAULT 3;

-- No new RLS needed — covered by existing restaurant_owner_all policy.
