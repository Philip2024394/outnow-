-- ══════════════════════════════════════════════════════════════════════
-- Wanted Property + International Investors tables
-- ══════════════════════════════════════════════════════════════════════

-- Wanted Property Requests
CREATE TABLE IF NOT EXISTS wanted_properties (
  id TEXT PRIMARY KEY,
  buyer_id UUID REFERENCES auth.users(id),
  buyer_name TEXT,
  buyer_verified BOOLEAN DEFAULT FALSE,
  anonymous BOOLEAN DEFAULT FALSE,
  property_type TEXT NOT NULL,
  listing_type TEXT NOT NULL DEFAULT 'buy', -- buy or rent
  location TEXT NOT NULL,
  budget_min BIGINT,
  budget_max BIGINT,
  bedrooms TEXT,
  bathrooms TEXT,
  land_area_min TEXT,
  purpose TEXT, -- personal, investment, business, holiday
  timeline TEXT, -- buying_now, within_3_months, within_6_months, exploring
  requirements TEXT,
  status TEXT DEFAULT 'active', -- active, matched, closed, expired
  responses_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wanted Property Responses (agent responds to a request)
CREATE TABLE IF NOT EXISTS wanted_responses (
  id TEXT PRIMARY KEY,
  wanted_id TEXT REFERENCES wanted_properties(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES auth.users(id),
  agent_name TEXT,
  listing_id TEXT, -- reference to the matching listing
  message TEXT,
  status TEXT DEFAULT 'pending', -- pending, viewed, accepted, rejected
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Global Agents (certified for international transactions)
CREATE TABLE IF NOT EXISTS global_agents (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  city TEXT,
  photo TEXT,
  languages TEXT[] DEFAULT '{}',
  specialization TEXT[] DEFAULT '{}',
  deals_closed INTEGER DEFAULT 0,
  rating NUMERIC(2,1) DEFAULT 0,
  certified BOOLEAN DEFAULT FALSE,
  certified_at TIMESTAMPTZ,
  experience_years INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Supervised Transactions
CREATE TABLE IF NOT EXISTS supervised_transactions (
  id TEXT PRIMARY KEY,
  listing_id TEXT,
  buyer_id UUID REFERENCES auth.users(id),
  seller_id UUID,
  agent_id TEXT REFERENCES global_agents(id),
  current_step INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active', -- active, completed, cancelled
  property_title TEXT,
  property_price BIGINT,
  currency TEXT DEFAULT 'IDR',
  supervision_fee_pct NUMERIC(3,1) DEFAULT 2.5,
  escrow_status TEXT DEFAULT 'pending', -- pending, funded, released
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign_eligible flag to rental_listings
ALTER TABLE rental_listings ADD COLUMN IF NOT EXISTS foreign_eligible BOOLEAN DEFAULT FALSE;
ALTER TABLE rental_listings ADD COLUMN IF NOT EXISTS investment_grade TEXT;
ALTER TABLE rental_listings ADD COLUMN IF NOT EXISTS supervised BOOLEAN DEFAULT FALSE;

-- RLS Policies
ALTER TABLE wanted_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE wanted_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE supervised_transactions ENABLE ROW LEVEL SECURITY;

-- Wanted properties: anyone can read active, owners can manage their own
CREATE POLICY "wanted_read" ON wanted_properties FOR SELECT USING (status = 'active');
CREATE POLICY "wanted_insert" ON wanted_properties FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "wanted_update" ON wanted_properties FOR UPDATE USING (auth.uid() = buyer_id);

-- Responses: agents can insert, wanted owner can read
CREATE POLICY "response_insert" ON wanted_responses FOR INSERT WITH CHECK (auth.uid() = agent_id);
CREATE POLICY "response_read" ON wanted_responses FOR SELECT USING (true);

-- Global agents: public read, self manage
CREATE POLICY "agent_read" ON global_agents FOR SELECT USING (true);
CREATE POLICY "agent_update" ON global_agents FOR UPDATE USING (auth.uid() = user_id);

-- Supervised transactions: participants only
CREATE POLICY "transaction_read" ON supervised_transactions FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "transaction_insert" ON supervised_transactions FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_wanted_status ON wanted_properties(status);
CREATE INDEX IF NOT EXISTS idx_wanted_type ON wanted_properties(property_type);
CREATE INDEX IF NOT EXISTS idx_wanted_location ON wanted_properties(location);
CREATE INDEX IF NOT EXISTS idx_responses_wanted ON wanted_responses(wanted_id);
CREATE INDEX IF NOT EXISTS idx_global_agents_certified ON global_agents(certified);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON supervised_transactions(status);
