-- Wanted Board — buyers post items they're looking for
CREATE TABLE IF NOT EXISTS wanted_items (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid NOT NULL REFERENCES auth.users(id),
  title           text NOT NULL,
  description     text,
  image_url       text,
  category        text,
  condition_pref  text DEFAULT 'either' CHECK (condition_pref IN ('new','used','either')),
  target_price    bigint,
  city            text,
  status          text DEFAULT 'active' CHECK (status IN ('active','fulfilled','expired')),
  expires_at      timestamptz DEFAULT (now() + interval '30 days'),
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE wanted_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active wanted items"
  ON wanted_items FOR SELECT USING (status = 'active');

CREATE POLICY "Users can read own wanted items"
  ON wanted_items FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users create own wanted items"
  ON wanted_items FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own wanted items"
  ON wanted_items FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users delete own wanted items"
  ON wanted_items FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_wanted_items_status ON wanted_items(status, created_at);
CREATE INDEX IF NOT EXISTS idx_wanted_items_user   ON wanted_items(user_id);
