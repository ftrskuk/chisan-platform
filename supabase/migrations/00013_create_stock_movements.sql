-- ============================================================================
-- CHISAN Platform - Stock Movements Table Migration
-- INV-F003/F004: Stock-In/Stock-Out Processing Audit Trail
-- ============================================================================

CREATE TYPE movement_type AS ENUM ('in', 'out', 'adjustment', 'move', 'quarantine');

CREATE TYPE movement_reference_type AS ENUM ('import', 'production', 'sale', 'adjustment', 'transfer');

CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  stock_id UUID NOT NULL REFERENCES stocks(id) ON DELETE RESTRICT,

  movement_type movement_type NOT NULL,
  quantity_change INTEGER NOT NULL,
  weight_change_kg NUMERIC(12,3),

  quantity_before INTEGER NOT NULL,
  quantity_after INTEGER NOT NULL,
  weight_before_kg NUMERIC(12,3),
  weight_after_kg NUMERIC(12,3),

  reason TEXT,

  reference_type movement_reference_type,
  reference_id UUID,

  performed_by UUID REFERENCES users(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_stock ON stock_movements(stock_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created ON stock_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_stock_movements_reference ON stock_movements(reference_type, reference_id) 
  WHERE reference_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stock_movements_performer ON stock_movements(performed_by) 
  WHERE performed_by IS NOT NULL;

ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stock_movements_select_authenticated" ON stock_movements
  FOR SELECT TO authenticated
  USING (true);

COMMENT ON TABLE stock_movements IS 'Immutable audit trail for all stock quantity changes';
COMMENT ON COLUMN stock_movements.quantity_change IS 'Positive for additions, negative for removals';
