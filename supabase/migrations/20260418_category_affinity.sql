-- ─────────────────────────────────────────────────────────────────────────────
-- P10: Category Affinity Table
-- Tracks per-user affinity weights for session categories.
-- Weight increments on interest send and profile open (max 5.0).
-- Used in sessionScore.js as a feed ranking multiplier.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_category_affinity (
  user_id  uuid  REFERENCES auth.users ON DELETE CASCADE,
  category text  NOT NULL,
  weight   float NOT NULL DEFAULT 1.0,
  PRIMARY KEY (user_id, category)
);

ALTER TABLE user_category_affinity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_read"
  ON user_category_affinity FOR SELECT
  USING (auth.uid() = user_id);

-- RPC: increment affinity weight for a category, capped at 5.0
-- Called fire-and-forget from AppShell on interest send and profile open
CREATE OR REPLACE FUNCTION increment_category_affinity(
  p_user_id uuid,
  p_category text
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO user_category_affinity (user_id, category, weight)
  VALUES (p_user_id, p_category, 1.5)
  ON CONFLICT (user_id, category) DO UPDATE
    SET weight = LEAST(user_category_affinity.weight + 0.5, 5.0);
END;
$$;

REVOKE EXECUTE ON FUNCTION increment_category_affinity(uuid, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION increment_category_affinity(uuid, text) TO authenticated;
