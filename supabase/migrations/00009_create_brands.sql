-- ============================================================================
-- CHISAN Platform - Brands Table Migration
-- IMP-F001: Partner Management
-- ============================================================================

CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,

  -- Identification
  code TEXT UNIQUE NOT NULL,           -- 'APP', 'APRIL', 'BOHUI'
  name TEXT NOT NULL,
  description TEXT,

  -- Status
  is_active BOOLEAN DEFAULT true NOT NULL,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_brands_partner ON brands(partner_id);
CREATE INDEX IF NOT EXISTS idx_brands_code ON brands(code);
CREATE INDEX IF NOT EXISTS idx_brands_active ON brands(is_active);

-- ============================================================================
-- RLS
-- ============================================================================

ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "brands_select_authenticated" ON brands
  FOR SELECT TO authenticated
  USING (true);

-- ============================================================================
-- Trigger: updated_at
-- ============================================================================

DROP TRIGGER IF EXISTS brands_updated_at ON brands;
CREATE TRIGGER brands_updated_at
  BEFORE UPDATE ON brands
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
