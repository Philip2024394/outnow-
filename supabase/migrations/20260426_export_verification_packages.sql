-- ================================================================
-- Export Seller Verification & Buyer Contact Packages
-- ================================================================

-- ── 1. Export verification fields on profiles ────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS wa_number           text,
  ADD COLUMN IF NOT EXISTS wa_verified         boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS export_badge        boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS export_verified_at  timestamptz;

-- ── 2. Contact purchases — buyer buys seller contact info ────────────────────
CREATE TABLE IF NOT EXISTS contact_purchases (
  id                bigserial     PRIMARY KEY,
  buyer_id          uuid          NOT NULL REFERENCES profiles(id),
  seller_id         uuid          NOT NULL REFERENCES profiles(id),
  package_type      text          NOT NULL CHECK (package_type IN ('whatsapp_only', 'whatsapp_social')),

  -- Payment
  stripe_session_id text,
  stripe_payment_id text,
  amount_usd        numeric(10,2) NOT NULL,
  currency          text          NOT NULL DEFAULT 'usd',
  payment_status    text          NOT NULL DEFAULT 'pending'
                    CHECK (payment_status IN ('pending', 'paid', 'refunded', 'replaced')),

  -- Delivered contact info
  wa_number_sent    text,
  instagram_sent    text,
  tiktok_sent       text,
  facebook_sent     text,
  website_sent      text,
  delivered_at      timestamptz,

  -- Refund / replacement
  refund_reason     text,
  replacement_seller_id uuid REFERENCES profiles(id),

  created_at        timestamptz   NOT NULL DEFAULT now(),
  updated_at        timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS contact_purchases_buyer_idx  ON contact_purchases(buyer_id, payment_status);
CREATE INDEX IF NOT EXISTS contact_purchases_seller_idx ON contact_purchases(seller_id);
CREATE INDEX IF NOT EXISTS contact_purchases_stripe_idx ON contact_purchases(stripe_session_id);

-- ── 3. RLS ───────────────────────────────────────────────────────────────────
ALTER TABLE contact_purchases ENABLE ROW LEVEL SECURITY;

-- Buyer can see their own purchases
DROP POLICY IF EXISTS "purchases_buyer_read" ON contact_purchases;
CREATE POLICY "purchases_buyer_read" ON contact_purchases FOR SELECT
  USING (auth.uid() = buyer_id);

-- Buyer can create purchases
DROP POLICY IF EXISTS "purchases_buyer_insert" ON contact_purchases;
CREATE POLICY "purchases_buyer_insert" ON contact_purchases FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

-- Seller can see purchases of their contact
DROP POLICY IF EXISTS "purchases_seller_read" ON contact_purchases;
CREATE POLICY "purchases_seller_read" ON contact_purchases FOR SELECT
  USING (auth.uid() = seller_id);

-- Admin full access
DROP POLICY IF EXISTS "purchases_admin_all" ON contact_purchases;
CREATE POLICY "purchases_admin_all" ON contact_purchases FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true
  ));

-- ── 4. Package pricing config ────────────────────────────────────────────────
-- Stored in app_settings table (already exists)
-- key: 'export_packages'
-- value: { whatsapp_only_usd: 4.99, whatsapp_social_usd: 9.99 }
INSERT INTO app_settings (key, value, updated_at)
VALUES (
  'export_packages',
  '{"whatsapp_only_usd": 4.99, "whatsapp_social_usd": 9.99}',
  now()
) ON CONFLICT (key) DO NOTHING;
