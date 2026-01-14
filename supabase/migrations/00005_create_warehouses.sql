-- ============================================================================
-- CHISAN Platform - Warehouses Table Migration
-- INV-F001: Warehouse & Location Management
-- ============================================================================

CREATE TABLE IF NOT EXISTS warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identification
  code TEXT UNIQUE NOT NULL,           -- 'WH-MAIN', 'WH-EXT'
  name TEXT NOT NULL,                  -- '본사 창고'

  -- Address
  address TEXT,
  city TEXT,
  postal_code TEXT,

  -- Contact
  contact_name TEXT,
  contact_phone TEXT,

  -- Settings
  is_active BOOLEAN DEFAULT true NOT NULL,
  is_default BOOLEAN DEFAULT false NOT NULL,

  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_warehouses_code ON warehouses(code);
CREATE INDEX IF NOT EXISTS idx_warehouses_is_active ON warehouses(is_active);

-- Partial unique index: only one default warehouse allowed
CREATE UNIQUE INDEX IF NOT EXISTS idx_warehouses_single_default
  ON warehouses(is_default) WHERE is_default = true;

-- ============================================================================
-- RLS
-- ============================================================================

ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view warehouses
CREATE POLICY "warehouses_select_authenticated" ON warehouses
  FOR SELECT TO authenticated
  USING (true);

-- No direct client writes - all modifications through API
-- INSERT/UPDATE/DELETE policies intentionally omitted

-- ============================================================================
-- Trigger: updated_at
-- ============================================================================

DROP TRIGGER IF EXISTS warehouses_updated_at ON warehouses;
CREATE TRIGGER warehouses_updated_at
  BEFORE UPDATE ON warehouses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
