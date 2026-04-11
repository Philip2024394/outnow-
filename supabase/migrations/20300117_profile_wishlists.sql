-- ─────────────────────────────────────────────────────────────────────────────
-- Profile Wishlists — dating profiles can pin up to 5 marketplace items
-- Buyers see the wishlist when they tap 🛍️ on a profile and can send any item
-- as an anonymous gift via the existing gift_orders flow.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS profile_wishlists (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id       text        NOT NULL,
  seller_id        uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_name     text        NOT NULL,
  product_price    numeric     NOT NULL,
  product_currency text        NOT NULL DEFAULT 'IDR',
  product_image    text,
  seller_name      text,
  added_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);

ALTER TABLE profile_wishlists ENABLE ROW LEVEL SECURITY;

-- Owner can manage their own wishlist
CREATE POLICY "wishlist_owner_all" ON profile_wishlists
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Anyone authenticated can read any profile's wishlist (it's intentionally public)
CREATE POLICY "wishlist_public_read" ON profile_wishlists
  FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_wishlist_user    ON profile_wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_seller  ON profile_wishlists(seller_id);

-- ── RPC: add_to_wishlist ──────────────────────────────────────────────────────
-- Enforces the 5-item cap server-side
CREATE OR REPLACE FUNCTION add_to_wishlist(
  p_product_id       text,
  p_seller_id        uuid,
  p_product_name     text,
  p_product_price    numeric,
  p_product_currency text,
  p_product_image    text,
  p_seller_name      text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
BEGIN
  -- Count existing items
  SELECT count(*) INTO v_count
  FROM   profile_wishlists
  WHERE  user_id = auth.uid();

  -- Check if this product is already in the wishlist (idempotent)
  IF EXISTS (
    SELECT 1 FROM profile_wishlists
    WHERE user_id = auth.uid() AND product_id = p_product_id
  ) THEN
    RETURN jsonb_build_object('ok', true, 'msg', 'already_added');
  END IF;

  IF v_count >= 5 THEN
    RETURN jsonb_build_object('ok', false, 'msg', 'limit_reached');
  END IF;

  INSERT INTO profile_wishlists
    (user_id, product_id, seller_id, product_name, product_price,
     product_currency, product_image, seller_name)
  VALUES
    (auth.uid(), p_product_id, p_seller_id, p_product_name, p_product_price,
     p_product_currency, p_product_image, p_seller_name);

  RETURN jsonb_build_object('ok', true, 'msg', 'added');
END;
$$;

GRANT EXECUTE ON FUNCTION add_to_wishlist TO authenticated;
