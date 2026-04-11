-- ─────────────────────────────────────────────────────────────────────────────
-- Gift Orders — Anonymous gifting via Hangger Marketplace
-- Phase 2 + 3: delivery pricing, privacy vault, seller acknowledgment, audit log
-- ─────────────────────────────────────────────────────────────────────────────

-- ── gift_addresses ────────────────────────────────────────────────────────────
-- Each user stores ONE private delivery address.
-- RLS: only the owner can read/write their own row.
-- The reveal_gift_address() RPC (SECURITY DEFINER) reads it on behalf of sellers,
-- only after they acknowledge and only within the 7-day window.
CREATE TABLE IF NOT EXISTS gift_addresses (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  street        text        NOT NULL,
  district      text        NOT NULL,   -- shown to seller at district-level before full reveal
  city          text        NOT NULL,
  postal_code   text,
  country       text        NOT NULL DEFAULT 'Indonesia',
  instructions  text,                  -- optional delivery notes (e.g. "Ring bell 3x")
  updated_at    timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE gift_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gift_addr_owner_all" ON gift_addresses
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ── gift_orders ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gift_orders (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id         uuid        NOT NULL REFERENCES auth.users(id),
  recipient_id     uuid        NOT NULL REFERENCES auth.users(id),
  seller_id        uuid        NOT NULL REFERENCES auth.users(id),
  product_id       text        NOT NULL,
  product_name     text        NOT NULL,
  product_price    numeric     NOT NULL,
  product_image    text,
  product_variant  text,
  gift_message     text,
  delivery_fee     numeric     NOT NULL DEFAULT 0,
  distance_km      numeric,
  status           text        NOT NULL DEFAULT 'pending'
                   CHECK (status IN (
                     'pending',
                     'seller_acknowledged',
                     'preparing',
                     'out_for_delivery',
                     'delivered',
                     'cancelled'
                   )),
  seller_ack_at    timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE gift_orders ENABLE ROW LEVEL SECURITY;

-- Buyer sees their sent gifts
CREATE POLICY "gift_order_buyer_select" ON gift_orders FOR SELECT
  USING (buyer_id = auth.uid());

-- Seller sees orders for their shop
CREATE POLICY "gift_order_seller_select" ON gift_orders FOR SELECT
  USING (seller_id = auth.uid());

-- Recipient sees gifts sent to them
CREATE POLICY "gift_order_recipient_select" ON gift_orders FOR SELECT
  USING (recipient_id = auth.uid());

-- Buyer can cancel while still pending
CREATE POLICY "gift_order_buyer_cancel" ON gift_orders FOR UPDATE
  USING (buyer_id = auth.uid() AND status = 'pending')
  WITH CHECK (status = 'cancelled');

-- Seller can update status (acknowledge, preparing, out_for_delivery, delivered)
CREATE POLICY "gift_order_seller_update" ON gift_orders FOR UPDATE
  USING (seller_id = auth.uid());

-- ── gift_address_views ────────────────────────────────────────────────────────
-- Immutable audit log: every time a seller reveals the full delivery address.
CREATE TABLE IF NOT EXISTS gift_address_views (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    uuid        NOT NULL REFERENCES gift_orders(id) ON DELETE CASCADE,
  viewer_id   uuid        NOT NULL REFERENCES auth.users(id),
  viewed_at   timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE gift_address_views ENABLE ROW LEVEL SECURITY;

-- Viewer (seller) can see their own audit entries
CREATE POLICY "gift_addr_view_owner" ON gift_address_views FOR SELECT
  USING (viewer_id = auth.uid());

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_gift_orders_buyer     ON gift_orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_gift_orders_seller    ON gift_orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_gift_orders_recipient ON gift_orders(recipient_id);
CREATE INDEX IF NOT EXISTS idx_gift_orders_status    ON gift_orders(status);
CREATE INDEX IF NOT EXISTS idx_gift_addr_views_order ON gift_address_views(order_id);

-- ── RPC: place_gift_order ─────────────────────────────────────────────────────
-- Creates an anonymous gift order. Runs as SECURITY DEFINER so the buyer's
-- identity is captured from auth.uid() — never passed in as a parameter.
CREATE OR REPLACE FUNCTION place_gift_order(
  p_recipient_id    uuid,
  p_seller_id       uuid,
  p_product_id      text,
  p_product_name    text,
  p_product_price   numeric,
  p_product_image   text,
  p_product_variant text,
  p_gift_message    text,
  p_delivery_fee    numeric,
  p_distance_km     numeric
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id uuid;
BEGIN
  -- Prevent self-gifting
  IF auth.uid() = p_recipient_id THEN
    RAISE EXCEPTION 'You cannot send a gift to yourself';
  END IF;

  INSERT INTO gift_orders (
    buyer_id, recipient_id, seller_id,
    product_id, product_name, product_price,
    product_image, product_variant, gift_message,
    delivery_fee, distance_km, status
  ) VALUES (
    auth.uid(), p_recipient_id, p_seller_id,
    p_product_id, p_product_name, p_product_price,
    p_product_image, p_product_variant, p_gift_message,
    p_delivery_fee, p_distance_km, 'pending'
  )
  RETURNING id INTO v_order_id;

  RETURN v_order_id;
END;
$$;

GRANT EXECUTE ON FUNCTION place_gift_order TO authenticated;

-- ── RPC: reveal_gift_address ──────────────────────────────────────────────────
-- Seller calls this to reveal the full delivery address.
-- Enforces: seller is the right person, 7-day expiry, logs every view.
CREATE OR REPLACE FUNCTION reveal_gift_address(p_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order      gift_orders%ROWTYPE;
  v_addr       gift_addresses%ROWTYPE;
  v_expires_at timestamptz;
BEGIN
  -- Verify caller is the seller for this order
  SELECT * INTO v_order
  FROM   gift_orders
  WHERE  id = p_order_id AND seller_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Not authorised to view this order';
  END IF;

  -- 7-day window after order creation
  v_expires_at := v_order.created_at + interval '7 days';
  IF now() > v_expires_at THEN
    RETURN jsonb_build_object('error', 'address_expired');
  END IF;

  -- Recipient must have a gift address saved
  SELECT * INTO v_addr
  FROM   gift_addresses
  WHERE  user_id = v_order.recipient_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'no_address');
  END IF;

  -- Write immutable audit entry
  INSERT INTO gift_address_views (order_id, viewer_id)
  VALUES (p_order_id, auth.uid());

  -- Acknowledge order on first reveal
  UPDATE gift_orders
  SET
    status        = CASE WHEN status = 'pending' THEN 'seller_acknowledged' ELSE status END,
    seller_ack_at = CASE WHEN seller_ack_at IS NULL THEN now() ELSE seller_ack_at END,
    updated_at    = now()
  WHERE id = p_order_id;

  RETURN jsonb_build_object(
    'street',       v_addr.street,
    'district',     v_addr.district,
    'city',         v_addr.city,
    'postal_code',  v_addr.postal_code,
    'country',      v_addr.country,
    'instructions', v_addr.instructions,
    'expires_at',   v_expires_at
  );
END;
$$;

GRANT EXECUTE ON FUNCTION reveal_gift_address TO authenticated;

-- ── auto-update updated_at ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION gift_orders_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_gift_orders_updated_at ON gift_orders;
CREATE TRIGGER trg_gift_orders_updated_at
  BEFORE UPDATE ON gift_orders
  FOR EACH ROW EXECUTE FUNCTION gift_orders_set_updated_at();
