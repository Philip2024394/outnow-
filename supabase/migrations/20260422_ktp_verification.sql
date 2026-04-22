-- ═══════════════════════════════════════════════════════════════════════════
-- KTP (ID Card) Verification — 4-step identity check for sellers/drivers
-- ═══════════════════════════════════════════════════════════════════════════

-- KTP fields on profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ktp_nik text;                  -- 16-digit NIK
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ktp_name text;                 -- Full name on KTP
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ktp_photo_url text;            -- Photo of KTP card
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ktp_selfie_url text;           -- Selfie holding KTP
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ktp_status text DEFAULT 'none' -- 'none' | 'pending' | 'approved' | 'rejected'
  CHECK (ktp_status IN ('none', 'pending', 'approved', 'rejected'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ktp_rejected_reason text;      -- Admin rejection note
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ktp_verified_at timestamptz;   -- When admin approved
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ktp_bank_name text;            -- Bank account name (must match KTP)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ktp_bank_account text;         -- Bank account number
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ktp_bank_code text;            -- Bank code (BCA, BRI, etc.)

-- ID verification fields (if not already added)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS id_document_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS id_verification_status text DEFAULT 'none';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS id_verified boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS driver_license_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS driver_license_status text DEFAULT 'none';

-- Index for admin review queue
CREATE INDEX IF NOT EXISTS idx_profiles_ktp_pending ON profiles(ktp_status) WHERE ktp_status = 'pending';
