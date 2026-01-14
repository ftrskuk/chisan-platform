-- ============================================================================
-- CHISAN Platform - Partners Table Migration
-- IMP-F001: Partner Management
-- ============================================================================

-- Partner type enum
DO $$ BEGIN
  CREATE TYPE partner_type AS ENUM ('supplier', 'customer', 'both');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identification
  partner_code TEXT UNIQUE NOT NULL,   -- 'SUP-001', 'CUS-001'
  name TEXT NOT NULL,
  name_local TEXT,                     -- Korean/Chinese name
  partner_type partner_type NOT NULL,

  -- Location
  country_code TEXT NOT NULL,          -- ISO 3166-1 alpha-2
  address TEXT,
  city TEXT,

  -- Contact
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,

  -- Supplier-specific (nullable if customer only)
  supplier_currency TEXT,              -- 'USD', 'EUR', 'KRW'
  supplier_payment_terms TEXT,         -- 'T/T 30 days', 'L/C at sight'
  lead_time_days INTEGER,

  -- Customer-specific (nullable if supplier only)
  customer_currency TEXT,
  customer_payment_terms TEXT,
  credit_limit NUMERIC(15,2),

  -- Status
  is_active BOOLEAN DEFAULT true NOT NULL,

  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_partners_code ON partners(partner_code);
CREATE INDEX IF NOT EXISTS idx_partners_type ON partners(partner_type);
CREATE INDEX IF NOT EXISTS idx_partners_country ON partners(country_code);
CREATE INDEX IF NOT EXISTS idx_partners_name ON partners(name);
CREATE INDEX IF NOT EXISTS idx_partners_active ON partners(is_active);

-- ============================================================================
-- RLS
-- ============================================================================

ALTER TABLE partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "partners_select_authenticated" ON partners
  FOR SELECT TO authenticated
  USING (true);

-- ============================================================================
-- Trigger: updated_at
-- ============================================================================

DROP TRIGGER IF EXISTS partners_updated_at ON partners;
CREATE TRIGGER partners_updated_at
  BEFORE UPDATE ON partners
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
