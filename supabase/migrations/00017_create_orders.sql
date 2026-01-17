-- ============================================================================
-- CHISAN Platform - Orders Table Migration
-- Phase 1: Approval Workflow for Stock-In/Stock-Out
-- ============================================================================
-- Business Flow:
-- 1. Office creates order (stock-in or stock-out request)
-- 2. Field team processes and registers completion
-- 3. Office reviews and approves
-- 4. System applies inventory change
-- ============================================================================

-- ============================================================================
-- ENUM: Order Type
-- ============================================================================

CREATE TYPE order_type AS ENUM ('stock_in', 'stock_out');

-- ============================================================================
-- ENUM: Order Status
-- ============================================================================

CREATE TYPE order_status AS ENUM (
  'pending',            -- Order created, waiting for field processing
  'field_processing',   -- Field team is working on it
  'awaiting_approval',  -- Field done, waiting for office approval
  'approved',           -- Approved, stock updated
  'rejected',           -- Rejected by approver
  'cancelled'           -- Cancelled by creator
);

-- ============================================================================
-- ENUM: Order Reason (Stock-In)
-- ============================================================================

CREATE TYPE order_in_reason AS ENUM (
  'container',          -- Container import (수입 컨테이너)
  'domestic_purchase',  -- Domestic purchase (국내 구매)
  'warehouse_transfer', -- Warehouse transfer in (창고 이동 입고)
  'return',             -- Customer return (반품)
  'adjustment'          -- Inventory adjustment (재고 조정)
);

-- ============================================================================
-- ENUM: Order Reason (Stock-Out)
-- ============================================================================

CREATE TYPE order_out_reason AS ENUM (
  'sales',              -- Customer sales (판매 출고)
  'sample',             -- Sample shipment (샘플 출고)
  'slitting',           -- Slitting production (슬리팅 투입)
  'loss',               -- Loss/disposal (손실/폐기)
  'warehouse_transfer'  -- Warehouse transfer out (창고 이동 출고)
);

-- ============================================================================
-- Table: orders
-- ============================================================================

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Order identification
  order_number VARCHAR(30) NOT NULL UNIQUE,  -- SO-YYYYMMDD-NNN / SI-YYYYMMDD-NNN
  type order_type NOT NULL,
  status order_status NOT NULL DEFAULT 'pending',

  -- Urgency flag
  is_urgent BOOLEAN DEFAULT FALSE NOT NULL,

  -- Reason (stored as text, validated at application level for type-specific values)
  reason VARCHAR(30) NOT NULL,

  -- Partner reference (customer for stock-out, supplier for stock-in)
  partner_id UUID REFERENCES partners(id) ON DELETE SET NULL,

  -- Scheduling
  scheduled_date DATE,
  
  -- Memo/Notes
  memo TEXT,

  -- Workflow actors
  requested_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  processed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Timestamps
  processed_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT orders_reason_matches_type CHECK (
    (type = 'stock_in' AND reason IN ('container', 'domestic_purchase', 'warehouse_transfer', 'return', 'adjustment'))
    OR
    (type = 'stock_out' AND reason IN ('sales', 'sample', 'slitting', 'loss', 'warehouse_transfer'))
  )
);

-- ============================================================================
-- Indexes for orders
-- ============================================================================

-- Primary access patterns
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_type ON orders(type);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_is_urgent ON orders(is_urgent) WHERE is_urgent = true;

-- Date-based queries
CREATE INDEX IF NOT EXISTS idx_orders_scheduled_date ON orders(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- Actor-based queries
CREATE INDEX IF NOT EXISTS idx_orders_requested_by ON orders(requested_by);
CREATE INDEX IF NOT EXISTS idx_orders_processed_by ON orders(processed_by) WHERE processed_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_approved_by ON orders(approved_by) WHERE approved_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_partner ON orders(partner_id) WHERE partner_id IS NOT NULL;

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_orders_type_status ON orders(type, status);
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_pending_field ON orders(status) WHERE status IN ('pending', 'field_processing');
CREATE INDEX IF NOT EXISTS idx_orders_awaiting_approval ON orders(status) WHERE status = 'awaiting_approval';

-- ============================================================================
-- Table: order_items
-- ============================================================================

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,

  -- Item specification
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE RESTRICT,

  -- Specific stock (optional - for stock-out, can designate which stock to use)
  stock_id UUID REFERENCES stocks(id) ON DELETE SET NULL,

  -- Width (required for orders as items don't have width)
  width_mm INTEGER NOT NULL CHECK (width_mm BETWEEN 50 AND 2500),

  -- Requested vs Processed quantities
  requested_qty INTEGER NOT NULL CHECK (requested_qty > 0),
  requested_weight_kg NUMERIC(12,3) CHECK (requested_weight_kg > 0),

  -- Processed quantities (filled by field team)
  processed_qty INTEGER CHECK (processed_qty >= 0),
  processed_weight_kg NUMERIC(12,3) CHECK (processed_weight_kg >= 0),

  -- Tracking
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- Indexes for order_items
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_item ON order_items(item_id);
CREATE INDEX IF NOT EXISTS idx_order_items_stock ON order_items(stock_id) WHERE stock_id IS NOT NULL;

-- ============================================================================
-- Table: order_history (Audit trail for order state changes)
-- ============================================================================

CREATE TABLE IF NOT EXISTS order_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,

  -- Action performed
  action VARCHAR(30) NOT NULL CHECK (
    action IN ('created', 'updated', 'field_started', 'field_completed', 'approved', 'rejected', 'cancelled', 'urgent_approved')
  ),

  -- Who performed the action
  actor_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

  -- Additional context
  memo TEXT,
  
  -- State snapshot (JSON for flexibility)
  previous_status VARCHAR(30),
  new_status VARCHAR(30),
  changes JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- Indexes for order_history
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_order_history_order ON order_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_history_action ON order_history(action);
CREATE INDEX IF NOT EXISTS idx_order_history_actor ON order_history(actor_id);
CREATE INDEX IF NOT EXISTS idx_order_history_created ON order_history(created_at);

-- ============================================================================
-- RLS (Row Level Security)
-- ============================================================================

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_history ENABLE ROW LEVEL SECURITY;

-- Read access for all authenticated users
CREATE POLICY "orders_select_authenticated" ON orders
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "order_items_select_authenticated" ON order_items
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "order_history_select_authenticated" ON order_history
  FOR SELECT TO authenticated
  USING (true);

-- Write access restricted to service role (API only)
-- No INSERT/UPDATE/DELETE policies for 'authenticated' role
-- All mutations must go through the NestJS API using service_role

-- ============================================================================
-- Trigger: updated_at for orders
-- ============================================================================

DROP TRIGGER IF EXISTS orders_updated_at ON orders;
CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Function: Generate order number
-- Pattern: SI-YYYYMMDD-NNN for stock-in, SO-YYYYMMDD-NNN for stock-out
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_order_number(p_type order_type)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_prefix TEXT;
  v_date TEXT;
  v_sequence INTEGER;
  v_order_number TEXT;
BEGIN
  -- Set prefix based on order type
  v_prefix := CASE p_type
    WHEN 'stock_in' THEN 'OI'   -- Order In
    WHEN 'stock_out' THEN 'OO'  -- Order Out
  END;

  -- Get today's date in YYYYMMDD format
  v_date := to_char(CURRENT_DATE, 'YYYYMMDD');

  -- Get the next sequence number for today
  -- Using advisory lock to prevent race conditions
  PERFORM pg_advisory_xact_lock(hashtext(v_prefix || v_date));

  SELECT COALESCE(MAX(
    CAST(SUBSTRING(order_number FROM '\d{3}$') AS INTEGER)
  ), 0) + 1
  INTO v_sequence
  FROM orders
  WHERE order_number LIKE v_prefix || '-' || v_date || '-%';

  -- Format: OI-YYYYMMDD-NNN or OO-YYYYMMDD-NNN
  v_order_number := v_prefix || '-' || v_date || '-' || LPAD(v_sequence::TEXT, 3, '0');

  RETURN v_order_number;
END;
$$;

-- ============================================================================
-- View: orders_with_details (for common queries)
-- ============================================================================

CREATE OR REPLACE VIEW orders_with_details AS
SELECT 
  o.id,
  o.order_number,
  o.type,
  o.status,
  o.is_urgent,
  o.reason,
  o.partner_id,
  o.scheduled_date,
  o.memo,
  o.requested_by,
  o.processed_by,
  o.approved_by,
  o.processed_at,
  o.approved_at,
  o.created_at,
  o.updated_at,
  -- Partner details
  p.name AS partner_name,
  p.code AS partner_code,
  -- Requester details
  ru.display_name AS requested_by_name,
  -- Processor details
  pu.display_name AS processed_by_name,
  -- Approver details
  au.display_name AS approved_by_name,
  -- Aggregated item count
  (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) AS item_count,
  -- Total requested quantity
  (SELECT SUM(requested_qty) FROM order_items WHERE order_id = o.id) AS total_requested_qty,
  -- Total processed quantity
  (SELECT SUM(processed_qty) FROM order_items WHERE order_id = o.id) AS total_processed_qty
FROM orders o
LEFT JOIN partners p ON o.partner_id = p.id
LEFT JOIN users ru ON o.requested_by = ru.id
LEFT JOIN users pu ON o.processed_by = pu.id
LEFT JOIN users au ON o.approved_by = au.id;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE orders IS 'Stock-in and stock-out order requests with approval workflow';
COMMENT ON TABLE order_items IS 'Line items for each order with requested and processed quantities';
COMMENT ON TABLE order_history IS 'Immutable audit trail for order status changes';

COMMENT ON COLUMN orders.order_number IS 'Auto-generated: OI-YYYYMMDD-NNN for stock-in, OO-YYYYMMDD-NNN for stock-out';
COMMENT ON COLUMN orders.is_urgent IS 'If true, allows bypassing approval workflow for immediate stock update';
COMMENT ON COLUMN orders.reason IS 'Business reason for the order (validated per order type)';

COMMENT ON COLUMN order_items.stock_id IS 'For stock-out, can designate specific stock to use';
COMMENT ON COLUMN order_items.width_mm IS 'Required width specification for the order';
COMMENT ON COLUMN order_items.processed_qty IS 'Actual quantity processed by field team (may differ from requested)';
