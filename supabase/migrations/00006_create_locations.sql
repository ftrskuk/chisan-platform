-- ============================================================================
-- CHISAN Platform - Locations Table Migration
-- INV-F001: Warehouse & Location Management
-- ============================================================================

-- Location type enum
DO $$ BEGIN
  CREATE TYPE location_type AS ENUM ('default', 'zone', 'rack', 'shelf', 'floor');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,

  -- Identification
  code TEXT NOT NULL,                  -- 'DEFAULT', 'A-01-02'
  name TEXT,
  type location_type DEFAULT 'default' NOT NULL,

  -- Hierarchy (future rack/shelf support)
  parent_id UUID REFERENCES locations(id) ON DELETE SET NULL,

  -- Status
  is_active BOOLEAN DEFAULT true NOT NULL,

  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Location code unique within warehouse
  UNIQUE(warehouse_id, code)
);

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_locations_warehouse ON locations(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_locations_type ON locations(type);
CREATE INDEX IF NOT EXISTS idx_locations_parent ON locations(parent_id);

-- ============================================================================
-- RLS
-- ============================================================================

ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "locations_select_authenticated" ON locations
  FOR SELECT TO authenticated
  USING (true);

-- ============================================================================
-- Trigger: updated_at
-- ============================================================================

DROP TRIGGER IF EXISTS locations_updated_at ON locations;
CREATE TRIGGER locations_updated_at
  BEFORE UPDATE ON locations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Trigger: Auto-create default location when warehouse is created
-- ============================================================================

CREATE OR REPLACE FUNCTION create_default_location()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO locations (warehouse_id, code, name, type)
  VALUES (NEW.id, 'DEFAULT', NEW.name || ' - 기본', 'default');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS warehouse_create_default_location ON warehouses;
CREATE TRIGGER warehouse_create_default_location
  AFTER INSERT ON warehouses
  FOR EACH ROW
  EXECUTE FUNCTION create_default_location();
