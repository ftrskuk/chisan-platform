-- ============================================================================
-- CHISAN Platform - Stocks Table Migration
-- INV-F003/F004/F005: Stock Management & Inquiry
-- ============================================================================
-- Width is tracked at the STOCK level (not item level) because:
-- - Parent rolls have specific widths that vary by shipment
-- - Slitted rolls are cut to customer-specific widths
-- - Same item specification can have multiple width variants in inventory
-- ============================================================================

-- ============================================================================
-- ENUM: Stock Condition
-- ============================================================================

CREATE TYPE stock_condition AS ENUM ('parent', 'slitted');

-- ============================================================================
-- ENUM: Stock Status
-- ============================================================================

CREATE TYPE stock_status AS ENUM ('available', 'reserved', 'quarantine', 'disposed');

-- ============================================================================
-- Table: stocks
-- ============================================================================

CREATE TABLE IF NOT EXISTS stocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE RESTRICT,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,

  -- Physical Specifications (tracked at stock level)
  width_mm INTEGER NOT NULL CHECK (width_mm BETWEEN 50 AND 2500),
  condition stock_condition NOT NULL DEFAULT 'parent',

  -- Quantities
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  weight_kg NUMERIC(12,3) CHECK (weight_kg >= 0),

  -- Status
  status stock_status NOT NULL DEFAULT 'available',
  is_active BOOLEAN DEFAULT true NOT NULL,

  -- Tracking
  batch_number TEXT,
  lot_number TEXT,
  received_at TIMESTAMPTZ,

  -- Source tracking (for lineage)
  parent_stock_id UUID REFERENCES stocks(id) ON DELETE SET NULL,
  source_type TEXT CHECK (source_type IN ('import', 'production', 'adjustment')),
  source_reference_id UUID,

  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT stocks_weight_required_for_rolls CHECK (
    weight_kg IS NOT NULL OR quantity = 0
  )
);

-- ============================================================================
-- Indexes
-- ============================================================================

-- Primary access patterns
CREATE INDEX IF NOT EXISTS idx_stocks_item ON stocks(item_id);
CREATE INDEX IF NOT EXISTS idx_stocks_location ON stocks(location_id);
CREATE INDEX IF NOT EXISTS idx_stocks_status ON stocks(status);
CREATE INDEX IF NOT EXISTS idx_stocks_condition ON stocks(condition);
CREATE INDEX IF NOT EXISTS idx_stocks_active ON stocks(is_active);

-- Common query patterns
CREATE INDEX IF NOT EXISTS idx_stocks_width ON stocks(width_mm);
CREATE INDEX IF NOT EXISTS idx_stocks_batch ON stocks(batch_number) WHERE batch_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stocks_received ON stocks(received_at);

-- Composite indexes for common filters
CREATE INDEX IF NOT EXISTS idx_stocks_item_location ON stocks(item_id, location_id);
CREATE INDEX IF NOT EXISTS idx_stocks_item_width ON stocks(item_id, width_mm);
CREATE INDEX IF NOT EXISTS idx_stocks_location_status ON stocks(location_id, status);
CREATE INDEX IF NOT EXISTS idx_stocks_available ON stocks(item_id, status) WHERE status = 'available' AND is_active = true;

-- Lineage tracking
CREATE INDEX IF NOT EXISTS idx_stocks_parent ON stocks(parent_stock_id) WHERE parent_stock_id IS NOT NULL;

-- ============================================================================
-- RLS (Row Level Security)
-- ============================================================================

ALTER TABLE stocks ENABLE ROW LEVEL SECURITY;

-- Read access for all authenticated users
CREATE POLICY "stocks_select_authenticated" ON stocks
  FOR SELECT TO authenticated
  USING (true);

-- Write access restricted to service role (API only)
-- No INSERT/UPDATE/DELETE policies for 'authenticated' role
-- All mutations must go through the NestJS API using service_role

-- ============================================================================
-- Trigger: updated_at
-- ============================================================================

DROP TRIGGER IF EXISTS stocks_updated_at ON stocks;
CREATE TRIGGER stocks_updated_at
  BEFORE UPDATE ON stocks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Function: Get warehouse_id from location
-- Helper view for easier querying
-- ============================================================================

CREATE OR REPLACE FUNCTION get_stock_warehouse_id(stock_location_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT warehouse_id FROM locations WHERE id = stock_location_id;
$$;

-- ============================================================================
-- View: stocks_with_details (for common queries)
-- ============================================================================

CREATE OR REPLACE VIEW stocks_with_details AS
SELECT 
  s.id,
  s.item_id,
  s.location_id,
  s.width_mm,
  s.condition,
  s.quantity,
  s.weight_kg,
  s.status,
  s.is_active,
  s.batch_number,
  s.lot_number,
  s.received_at,
  s.parent_stock_id,
  s.source_type,
  s.source_reference_id,
  s.notes,
  s.created_at,
  s.updated_at,
  -- Item details
  i.item_code,
  i.display_name AS item_name,
  i.grammage,
  i.form AS item_form,
  i.paper_type_id,
  -- Location details
  l.code AS location_code,
  l.name AS location_name,
  l.warehouse_id,
  -- Warehouse details
  w.code AS warehouse_code,
  w.name AS warehouse_name
FROM stocks s
JOIN items i ON s.item_id = i.id
JOIN locations l ON s.location_id = l.id
JOIN warehouses w ON l.warehouse_id = w.id;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE stocks IS 'Physical inventory tracking with width at stock level';
COMMENT ON COLUMN stocks.width_mm IS 'Width in mm - tracked here, not at item level, because rolls vary by shipment';
COMMENT ON COLUMN stocks.condition IS 'parent = original imported roll, slitted = cut from parent roll';
COMMENT ON COLUMN stocks.parent_stock_id IS 'For slitted rolls, references the parent roll they were cut from';
COMMENT ON COLUMN stocks.source_type IS 'Origin of this stock: import, production, or adjustment';
