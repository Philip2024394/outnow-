-- ============================================================================
-- Marketplace Orders, Chat Persistence, Commission Enforcement
-- ============================================================================

-- ── 1. Marketplace Orders table ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS marketplace_orders (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id      uuid NOT NULL REFERENCES auth.users(id),
  seller_id     uuid NOT NULL REFERENCES auth.users(id),
  items         jsonb NOT NULL DEFAULT '[]',
  subtotal      bigint NOT NULL DEFAULT 0,
  delivery_fee  bigint NOT NULL DEFAULT 0,
  total         bigint NOT NULL DEFAULT 0,
  status        text NOT NULL DEFAULT 'awaiting_payment'
                CHECK (status IN ('awaiting_payment','pending','confirmed','shipped','delivered','cancelled','refunded')),
  payment_method text,
  payment_proof_url text,
  delivery_address text,
  notes         text,
  carrier_name  text,
  tracking_no   text,
  commission_status text DEFAULT 'none' CHECK (commission_status IN ('none','pending','paid')),
  created_at    timestamptz DEFAULT now(),
  confirmed_at  timestamptz,
  shipped_at    timestamptz,
  delivered_at  timestamptz,
  cancelled_at  timestamptz
);

ALTER TABLE marketplace_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers see own orders"
  ON marketplace_orders FOR SELECT
  USING (auth.uid() = buyer_id);

CREATE POLICY "Sellers see orders to them"
  ON marketplace_orders FOR SELECT
  USING (auth.uid() = seller_id);

CREATE POLICY "Buyers create orders"
  ON marketplace_orders FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Sellers update their orders"
  ON marketplace_orders FOR UPDATE
  USING (auth.uid() = seller_id);

CREATE POLICY "Buyers update own orders"
  ON marketplace_orders FOR UPDATE
  USING (auth.uid() = buyer_id);

CREATE INDEX IF NOT EXISTS idx_marketplace_orders_buyer  ON marketplace_orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_seller ON marketplace_orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_status ON marketplace_orders(status);

-- ── 2. Marketplace Chat tables ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS marketplace_conversations (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id      uuid NOT NULL REFERENCES auth.users(id),
  seller_id     uuid NOT NULL REFERENCES auth.users(id),
  last_message  text,
  last_at       timestamptz DEFAULT now(),
  unread_buyer  int DEFAULT 0,
  unread_seller int DEFAULT 0,
  created_at    timestamptz DEFAULT now(),
  UNIQUE(buyer_id, seller_id)
);

ALTER TABLE marketplace_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants see their conversations"
  ON marketplace_conversations FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Buyers create conversations"
  ON marketplace_conversations FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Participants update conversations"
  ON marketplace_conversations FOR UPDATE
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE TABLE IF NOT EXISTS marketplace_messages (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid NOT NULL REFERENCES marketplace_conversations(id) ON DELETE CASCADE,
  sender_id       uuid NOT NULL REFERENCES auth.users(id),
  text            text,
  image_url       text,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE marketplace_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants read messages"
  ON marketplace_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM marketplace_conversations c
      WHERE c.id = conversation_id
        AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    )
  );

CREATE POLICY "Participants send messages"
  ON marketplace_messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE INDEX IF NOT EXISTS idx_mkt_messages_conv ON marketplace_messages(conversation_id, created_at);

-- ── 3. Seller chat block flag (commission enforcement) ──────────────────────
ALTER TABLE marketplace_conversations
  ADD COLUMN IF NOT EXISTS seller_blocked boolean DEFAULT false;

-- When seller_blocked = true, seller cannot send messages (enforced in app layer)
-- Admin sets this flag when commission is overdue and unpaid
