-- ─────────────────────────────────────────────────────────────────────────────
-- Add item_type to profile_wishlists so the same table handles both
-- marketplace product pins ('product') and food/dish pins ('food').
-- Each type has its own 5-item cap enforced by the updated RPC.
-- Unique constraint is now (user_id, product_id, item_type) so the same
-- dish can't be pinned twice as food but a food item and product item with
-- the same ID (unlikely) won't conflict.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add column (safe — existing rows get default 'product')
ALTER TABLE profile_wishlists
  ADD COLUMN IF NOT EXISTS item_type text NOT NULL DEFAULT 'product';

-- 2. Replace unique constraint to include item_type
ALTER TABLE profile_wishlists
  DROP CONSTRAINT IF EXISTS profile_wishlists_user_id_product_id_key;

ALTER TABLE profile_wishlists
  ADD CONSTRAINT profile_wishlists_user_product_type_key
  UNIQUE (user_id, product_id, item_type);

-- 3. Index for fast food / product queries
CREATE INDEX IF NOT EXISTS idx_wishlist_type ON profile_wishlists(user_id, item_type);

-- ── Updated RPC: add_to_wishlist ──────────────────────────────────────────────
-- Cap of 5 is now per item_type (5 products + 5 food items separately).
CREATE OR REPLACE FUNCTION add_to_wishlist(
  p_product_id       text,
  p_seller_id        uuid,
  p_product_name     text,
  p_product_price    numeric,
  p_product_currency text,
  p_product_image    text,
  p_seller_name      text,
  p_item_type        text DEFAULT 'product'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
BEGIN
  -- Check duplicate within same type
  IF EXISTS (
    SELECT 1 FROM profile_wishlists
    WHERE user_id   = auth.uid()
      AND product_id = p_product_id
      AND item_type  = p_item_type
  ) THEN
    RETURN jsonb_build_object('ok', true, 'msg', 'already_added');
  END IF;

  -- Count existing items of this type
  SELECT count(*) INTO v_count
  FROM   profile_wishlists
  WHERE  user_id   = auth.uid()
    AND  item_type = p_item_type;

  IF v_count >= 5 THEN
    RETURN jsonb_build_object('ok', false, 'msg', 'limit_reached');
  END IF;

  INSERT INTO profile_wishlists
    (user_id, product_id, seller_id, product_name, product_price,
     product_currency, product_image, seller_name, item_type)
  VALUES
    (auth.uid(), p_product_id, p_seller_id, p_product_name, p_product_price,
     p_product_currency, p_product_image, p_seller_name, p_item_type);

  RETURN jsonb_build_object('ok', true, 'msg', 'added');
END;
$$;

GRANT EXECUTE ON FUNCTION add_to_wishlist TO authenticated;
