-- =============================================================================
-- INDOO Platform: Wallet & Balance Control System
-- =============================================================================
--
-- Minimum balance requirements by user type:
--   Bike riders:  minimum Rp 30,000
--   Car drivers:  minimum Rp 100,000
--   Restaurants:  minimum Rp 50,000
--
-- When balance drops below minimum, user enters a grace period (status = 'restricted').
-- If not topped up, account is deactivated and cannot receive orders.
-- =============================================================================

-- 1. platform_wallets — Main wallet for each user
CREATE TABLE platform_wallets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
    user_type text NOT NULL,
    balance bigint NOT NULL DEFAULT 0,
    minimum_balance bigint NOT NULL DEFAULT 30000,
    status text NOT NULL DEFAULT 'active',
    restricted_at timestamptz,
    deactivated_at timestamptz,
    last_topup_at timestamptz,
    total_topup bigint DEFAULT 0,
    total_commission_paid bigint DEFAULT 0,
    total_orders int DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),

    CONSTRAINT platform_wallets_user_type_check
        CHECK (user_type IN ('bike_rider', 'car_driver', 'restaurant')),
    CONSTRAINT platform_wallets_status_check
        CHECK (status IN ('active', 'restricted', 'deactivated')),
    CONSTRAINT platform_wallets_balance_non_negative
        CHECK (balance >= 0)
);

-- 2. wallet_topups — Top-up history
CREATE TABLE wallet_topups (
    id bigserial PRIMARY KEY,
    wallet_id uuid NOT NULL REFERENCES platform_wallets(id),
    user_id uuid NOT NULL REFERENCES profiles(id),
    amount bigint NOT NULL,
    method text NOT NULL,
    reference_code text,
    proof_url text,
    status text DEFAULT 'pending',
    admin_notes text,
    verified_at timestamptz,
    verified_by uuid REFERENCES profiles(id),
    created_at timestamptz DEFAULT now(),

    CONSTRAINT wallet_topups_method_check
        CHECK (method IN ('bank_transfer', 'gopay', 'ovo', 'dana', 'shopeepay', 'indomaret', 'alfamart', 'admin_credit')),
    CONSTRAINT wallet_topups_status_check
        CHECK (status IN ('pending', 'verified', 'rejected')),
    CONSTRAINT wallet_topups_amount_positive
        CHECK (amount > 0)
);

-- 3. wallet_deductions — Commission deductions per order
CREATE TABLE wallet_deductions (
    id bigserial PRIMARY KEY,
    wallet_id uuid NOT NULL REFERENCES platform_wallets(id),
    user_id uuid NOT NULL REFERENCES profiles(id),
    order_id text NOT NULL,
    order_type text NOT NULL,
    order_total bigint NOT NULL,
    commission_rate numeric NOT NULL DEFAULT 0.10,
    commission_amount bigint NOT NULL,
    balance_before bigint NOT NULL,
    balance_after bigint NOT NULL,
    created_at timestamptz DEFAULT now(),

    CONSTRAINT wallet_deductions_order_type_check
        CHECK (order_type IN ('ride_bike', 'ride_car', 'food_delivery')),
    CONSTRAINT wallet_deductions_commission_positive
        CHECK (commission_amount > 0)
);

-- 4. wallet_alerts — Notification log
CREATE TABLE wallet_alerts (
    id bigserial PRIMARY KEY,
    wallet_id uuid NOT NULL REFERENCES platform_wallets(id),
    user_id uuid NOT NULL REFERENCES profiles(id),
    alert_type text NOT NULL,
    message text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),

    CONSTRAINT wallet_alerts_alert_type_check
        CHECK (alert_type IN ('low_balance', 'zero_balance', 'grace_started', 'deactivation_warning', 'deactivated', 'reactivated'))
);

-- =============================================================================
-- Indexes
-- =============================================================================

CREATE INDEX idx_platform_wallets_user_id ON platform_wallets(user_id);
CREATE INDEX idx_platform_wallets_status ON platform_wallets(status);

CREATE INDEX idx_wallet_topups_wallet_id ON wallet_topups(wallet_id);
CREATE INDEX idx_wallet_topups_user_id ON wallet_topups(user_id);
CREATE INDEX idx_wallet_topups_status ON wallet_topups(status);

CREATE INDEX idx_wallet_deductions_wallet_id ON wallet_deductions(wallet_id);
CREATE INDEX idx_wallet_deductions_user_id ON wallet_deductions(user_id);
CREATE INDEX idx_wallet_deductions_order_id ON wallet_deductions(order_id);

CREATE INDEX idx_wallet_alerts_wallet_id ON wallet_alerts(wallet_id);
CREATE INDEX idx_wallet_alerts_user_id ON wallet_alerts(user_id);
CREATE INDEX idx_wallet_alerts_is_read ON wallet_alerts(is_read);

-- =============================================================================
-- Row Level Security
-- =============================================================================

ALTER TABLE platform_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_topups ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_deductions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_alerts ENABLE ROW LEVEL SECURITY;

-- platform_wallets policies
CREATE POLICY "Users can view their own wallet"
    ON platform_wallets FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallet"
    ON platform_wallets FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wallet"
    ON platform_wallets FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- wallet_topups policies
CREATE POLICY "Users can view their own topups"
    ON wallet_topups FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own topups"
    ON wallet_topups FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- wallet_deductions policies
CREATE POLICY "Users can view their own deductions"
    ON wallet_deductions FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own deductions"
    ON wallet_deductions FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- wallet_alerts policies
CREATE POLICY "Users can view their own alerts"
    ON wallet_alerts FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own alerts"
    ON wallet_alerts FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own alerts"
    ON wallet_alerts FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);
