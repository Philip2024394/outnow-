-- Seller contact details on profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS whatsapp text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone    text;

-- Contact unlocks — written by Stripe webhook after successful payment
CREATE TABLE IF NOT EXISTS contact_unlocks (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id         uuid        REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  seller_id        uuid        REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  session_id       uuid        REFERENCES sessions   ON DELETE SET NULL,
  stripe_session_id text       UNIQUE,
  amount           integer     NOT NULL,
  currency         text        NOT NULL,
  unlocked_at      timestamptz DEFAULT now(),
  UNIQUE (buyer_id, seller_id)
);

-- Buyers can only read their own unlocks
ALTER TABLE contact_unlocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "buyer reads own unlocks"
  ON contact_unlocks FOR SELECT
  USING (auth.uid() = buyer_id);

-- Sellers can read whatsapp/phone only if buyer has unlocked
-- (enforced in app layer via contact_unlocks check)
