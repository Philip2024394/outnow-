-- ═══════════════════════════════════════════════════════════════════════════
-- Unified user addresses — one place, all modules read from here
-- ═══════════════════════════════════════════════════════════════════════════

-- saved_addresses: JSONB array of { label, address, lat, lng, isDefault }
-- Example: [{ "label": "Home", "address": "Jl. Sudirman 45, Jakarta", "lat": -6.2088, "lng": 106.8456, "isDefault": true }]
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS saved_addresses jsonb DEFAULT '[]'::jsonb;

-- Primary address shortcut columns for fast queries
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS primary_address text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS primary_lat double precision;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS primary_lng double precision;
