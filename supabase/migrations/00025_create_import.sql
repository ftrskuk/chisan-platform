-- ============================================================================
-- CHISAN Platform - Import Module Migration
-- IMP-F002: Import Order Management
-- IMP-F003: Shipment Tracking
-- IMP-F004: Import Cost Management
-- ============================================================================
-- Business Flow:
-- 1. Create Import Order (PO) to overseas supplier
-- 2. Supplier confirms and ships goods
-- 3. Track shipment via B/L (Bill of Lading)
-- 4. Handle customs clearance
-- 5. Record all import costs for landed cost calculation
-- 6. Generate stock-in request when goods arrive at warehouse
-- ============================================================================

-- ============================================================================
-- ENUM: Import Order Status
-- ============================================================================

CREATE TYPE import_order_status AS ENUM (
  'draft',              -- PO being prepared
  'confirmed',          -- PO sent to supplier, awaiting shipment
  'partially_shipped',  -- Some items shipped, some pending
  'shipped',            -- All items shipped
  'arrived',            -- Goods arrived at port
  'customs_clearing',   -- Going through customs
  'cleared',            -- Customs cleared, ready for delivery
  'completed',          -- Stock-in completed
  'cancelled'           -- Order cancelled
);

-- ============================================================================
-- ENUM: Shipment Status
-- ============================================================================

CREATE TYPE shipment_status AS ENUM (
  'pending',            -- Shipment scheduled but not departed
  'departed',           -- Left port of loading
  'in_transit',         -- On the way
  'arrived',            -- Arrived at port of discharge
  'customs_hold',       -- Held at customs
  'customs_cleared',    -- Cleared customs
  'delivered',          -- Delivered to warehouse
  'cancelled'           -- Shipment cancelled
);

-- ============================================================================
-- ENUM: Import Cost Type
-- ============================================================================

CREATE TYPE import_cost_type AS ENUM (
  'freight',            -- Ocean/air freight (운임)
  'insurance',          -- Cargo insurance (보험료)
  'tariff',             -- Import duty/tariff (관세)
  'vat',                -- VAT on import (부가세)
  'customs_fee',        -- Customs brokerage fee (통관수수료)
  'inland_transport',   -- Domestic transport (내륙운송비)
  'port_charge',        -- Terminal handling charge (항만비용)
  'bank_charge',        -- L/C or T/T fees (은행수수료)
  'inspection',         -- Quality inspection fee (검사비)
  'storage',            -- Temporary storage (보관료)
  'other'               -- Other miscellaneous costs
);

-- ============================================================================
-- Table: import_orders (Purchase Orders to overseas suppliers)
-- ============================================================================

CREATE TABLE IF NOT EXISTS import_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Order identification
  po_number VARCHAR(30) NOT NULL UNIQUE,  -- PO-YYYYMMDD-NNN
  
  -- Supplier (must be partner with type 'supplier' or 'both')
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE RESTRICT,

  -- Order status
  status import_order_status NOT NULL DEFAULT 'draft',

  -- Dates
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_etd DATE,                      -- Expected Time of Departure
  expected_eta DATE,                      -- Expected Time of Arrival

  -- Financial
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',  -- ISO 4217 currency code
  exchange_rate NUMERIC(12,4),            -- KRW per currency unit at order time
  payment_terms VARCHAR(100),             -- e.g., 'T/T 30 days after B/L', 'L/C at sight'
  
  -- Calculated totals (updated by trigger or application)
  total_amount NUMERIC(15,2) DEFAULT 0,   -- Total in order currency
  total_amount_krw NUMERIC(15,0),         -- Total in KRW

  -- Workflow
  requested_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  confirmed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  confirmed_at TIMESTAMPTZ,

  -- Notes
  memo TEXT,
  internal_notes TEXT,                    -- Internal notes not shown on PO

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- Indexes for import_orders
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_import_orders_po_number ON import_orders(po_number);
CREATE INDEX IF NOT EXISTS idx_import_orders_partner ON import_orders(partner_id);
CREATE INDEX IF NOT EXISTS idx_import_orders_status ON import_orders(status);
CREATE INDEX IF NOT EXISTS idx_import_orders_order_date ON import_orders(order_date);
CREATE INDEX IF NOT EXISTS idx_import_orders_expected_eta ON import_orders(expected_eta);
CREATE INDEX IF NOT EXISTS idx_import_orders_requested_by ON import_orders(requested_by);
CREATE INDEX IF NOT EXISTS idx_import_orders_created_at ON import_orders(created_at);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_import_orders_status_eta ON import_orders(status, expected_eta);
CREATE INDEX IF NOT EXISTS idx_import_orders_partner_status ON import_orders(partner_id, status);

-- ============================================================================
-- Table: import_order_items (Line items for import orders)
-- ============================================================================

CREATE TABLE IF NOT EXISTS import_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  import_order_id UUID NOT NULL REFERENCES import_orders(id) ON DELETE CASCADE,

  -- Item specification
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE RESTRICT,

  -- Paper specifications (may differ from base item)
  width_mm INTEGER NOT NULL CHECK (width_mm BETWEEN 50 AND 2500),

  -- Quantities
  quantity INTEGER NOT NULL CHECK (quantity > 0),        -- Number of rolls/units
  weight_kg NUMERIC(12,3) CHECK (weight_kg > 0),         -- Estimated total weight

  -- Pricing (in order currency)
  unit_price NUMERIC(12,4) NOT NULL CHECK (unit_price > 0),  -- Price per unit
  total_price NUMERIC(15,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,

  -- Fulfillment tracking
  shipped_quantity INTEGER DEFAULT 0 CHECK (shipped_quantity >= 0),
  received_quantity INTEGER DEFAULT 0 CHECK (received_quantity >= 0),

  -- Notes
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- Indexes for import_order_items
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_import_order_items_order ON import_order_items(import_order_id);
CREATE INDEX IF NOT EXISTS idx_import_order_items_item ON import_order_items(item_id);

-- ============================================================================
-- Table: shipments (B/L based shipment tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference to import order
  import_order_id UUID NOT NULL REFERENCES import_orders(id) ON DELETE RESTRICT,

  -- Shipment identification
  shipment_number VARCHAR(30) NOT NULL UNIQUE,  -- SH-YYYYMMDD-NNN
  bl_number VARCHAR(50),                        -- Bill of Lading number
  
  -- Vessel information
  vessel_name VARCHAR(100),
  voyage_number VARCHAR(50),
  
  -- Container information (can have multiple containers)
  container_numbers TEXT[],                     -- Array of container numbers
  container_count INTEGER DEFAULT 1,

  -- Ports
  port_of_loading VARCHAR(100),                 -- e.g., 'HELSINKI, FINLAND'
  port_of_discharge VARCHAR(100),               -- e.g., 'BUSAN, KOREA'

  -- Dates
  etd DATE,                                     -- Estimated Time of Departure
  eta DATE,                                     -- Estimated Time of Arrival
  actual_departure_date DATE,
  actual_arrival_date DATE,
  customs_cleared_date DATE,
  delivered_date DATE,

  -- Status
  status shipment_status NOT NULL DEFAULT 'pending',

  -- Documents (store file references as JSON)
  documents JSONB DEFAULT '[]',
  -- Structure: [{ "type": "bl", "filename": "...", "url": "...", "uploaded_at": "..." }]

  -- Notes
  memo TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- Indexes for shipments
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_shipments_order ON shipments(import_order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_shipment_number ON shipments(shipment_number);
CREATE INDEX IF NOT EXISTS idx_shipments_bl_number ON shipments(bl_number) WHERE bl_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_eta ON shipments(eta);
CREATE INDEX IF NOT EXISTS idx_shipments_actual_arrival ON shipments(actual_arrival_date) WHERE actual_arrival_date IS NOT NULL;

-- Composite for dashboard queries
CREATE INDEX IF NOT EXISTS idx_shipments_status_eta ON shipments(status, eta);

-- ============================================================================
-- Table: shipment_items (Items included in each shipment)
-- ============================================================================

CREATE TABLE IF NOT EXISTS shipment_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  import_order_item_id UUID NOT NULL REFERENCES import_order_items(id) ON DELETE RESTRICT,

  -- Quantities
  shipped_quantity INTEGER NOT NULL CHECK (shipped_quantity > 0),
  received_quantity INTEGER CHECK (received_quantity >= 0),
  damaged_quantity INTEGER DEFAULT 0 CHECK (damaged_quantity >= 0),

  -- Notes (e.g., damage description)
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Prevent duplicate items in same shipment
  UNIQUE (shipment_id, import_order_item_id)
);

-- ============================================================================
-- Indexes for shipment_items
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_shipment_items_shipment ON shipment_items(shipment_id);
CREATE INDEX IF NOT EXISTS idx_shipment_items_order_item ON shipment_items(import_order_item_id);

-- ============================================================================
-- Table: import_costs (All costs associated with import)
-- ============================================================================

CREATE TABLE IF NOT EXISTS import_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference (can be linked to shipment or directly to order)
  shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
  import_order_id UUID REFERENCES import_orders(id) ON DELETE CASCADE,

  -- Cost details
  cost_type import_cost_type NOT NULL,
  description TEXT,

  -- Amount
  amount NUMERIC(15,2) NOT NULL CHECK (amount >= 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'KRW',
  amount_krw NUMERIC(15,0),                   -- Converted to KRW for reporting

  -- Invoice/Receipt reference
  invoice_number VARCHAR(100),
  vendor_name VARCHAR(200),                   -- e.g., shipping line, customs broker

  -- Payment tracking
  is_paid BOOLEAN DEFAULT FALSE,
  paid_at DATE,
  
  -- Notes
  notes TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- At least one reference must be set
  CONSTRAINT import_costs_reference_check CHECK (
    shipment_id IS NOT NULL OR import_order_id IS NOT NULL
  )
);

-- ============================================================================
-- Indexes for import_costs
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_import_costs_shipment ON import_costs(shipment_id) WHERE shipment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_import_costs_order ON import_costs(import_order_id) WHERE import_order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_import_costs_type ON import_costs(cost_type);
CREATE INDEX IF NOT EXISTS idx_import_costs_paid ON import_costs(is_paid);

-- ============================================================================
-- Table: import_history (Audit trail for import operations)
-- ============================================================================

CREATE TABLE IF NOT EXISTS import_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Entity reference (one must be set)
  import_order_id UUID REFERENCES import_orders(id) ON DELETE CASCADE,
  shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,

  -- Action performed
  entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('order', 'shipment')),
  action VARCHAR(30) NOT NULL,

  -- Who performed the action
  actor_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

  -- State change
  previous_status VARCHAR(30),
  new_status VARCHAR(30),
  changes JSONB,

  -- Additional context
  memo TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  CONSTRAINT import_history_reference_check CHECK (
    (entity_type = 'order' AND import_order_id IS NOT NULL) OR
    (entity_type = 'shipment' AND shipment_id IS NOT NULL)
  )
);

-- ============================================================================
-- Indexes for import_history
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_import_history_order ON import_history(import_order_id) WHERE import_order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_import_history_shipment ON import_history(shipment_id) WHERE shipment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_import_history_actor ON import_history(actor_id);
CREATE INDEX IF NOT EXISTS idx_import_history_created ON import_history(created_at);

-- ============================================================================
-- RLS (Row Level Security)
-- ============================================================================

ALTER TABLE import_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_history ENABLE ROW LEVEL SECURITY;

-- Read access for all authenticated users
CREATE POLICY "import_orders_select_authenticated" ON import_orders
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "import_order_items_select_authenticated" ON import_order_items
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "shipments_select_authenticated" ON shipments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "shipment_items_select_authenticated" ON shipment_items
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "import_costs_select_authenticated" ON import_costs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "import_history_select_authenticated" ON import_history
  FOR SELECT TO authenticated USING (true);

-- ============================================================================
-- Triggers: updated_at
-- ============================================================================

DROP TRIGGER IF EXISTS import_orders_updated_at ON import_orders;
CREATE TRIGGER import_orders_updated_at
  BEFORE UPDATE ON import_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS shipments_updated_at ON shipments;
CREATE TRIGGER shipments_updated_at
  BEFORE UPDATE ON shipments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS import_costs_updated_at ON import_costs;
CREATE TRIGGER import_costs_updated_at
  BEFORE UPDATE ON import_costs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Function: Generate PO number
-- Pattern: PO-YYYYMMDD-NNN
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_po_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_date TEXT;
  v_sequence INTEGER;
  v_po_number TEXT;
BEGIN
  v_date := to_char(CURRENT_DATE, 'YYYYMMDD');

  PERFORM pg_advisory_xact_lock(hashtext('PO' || v_date));

  SELECT COALESCE(MAX(
    CAST(SUBSTRING(po_number FROM '\d{3}$') AS INTEGER)
  ), 0) + 1
  INTO v_sequence
  FROM import_orders
  WHERE po_number LIKE 'PO-' || v_date || '-%';

  v_po_number := 'PO-' || v_date || '-' || LPAD(v_sequence::TEXT, 3, '0');

  RETURN v_po_number;
END;
$$;

-- ============================================================================
-- Function: Generate shipment number
-- Pattern: SH-YYYYMMDD-NNN
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_shipment_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_date TEXT;
  v_sequence INTEGER;
  v_shipment_number TEXT;
BEGIN
  v_date := to_char(CURRENT_DATE, 'YYYYMMDD');

  PERFORM pg_advisory_xact_lock(hashtext('SH' || v_date));

  SELECT COALESCE(MAX(
    CAST(SUBSTRING(shipment_number FROM '\d{3}$') AS INTEGER)
  ), 0) + 1
  INTO v_sequence
  FROM shipments
  WHERE shipment_number LIKE 'SH-' || v_date || '-%';

  v_shipment_number := 'SH-' || v_date || '-' || LPAD(v_sequence::TEXT, 3, '0');

  RETURN v_shipment_number;
END;
$$;

-- ============================================================================
-- Function: Update import order totals
-- Recalculates total_amount when items change
-- ============================================================================

CREATE OR REPLACE FUNCTION update_import_order_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_order_id UUID;
  v_total NUMERIC(15,2);
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_order_id := OLD.import_order_id;
  ELSE
    v_order_id := NEW.import_order_id;
  END IF;

  SELECT COALESCE(SUM(total_price), 0)
  INTO v_total
  FROM import_order_items
  WHERE import_order_id = v_order_id;

  UPDATE import_orders
  SET total_amount = v_total,
      total_amount_krw = CASE 
        WHEN exchange_rate IS NOT NULL THEN ROUND(v_total * exchange_rate)
        ELSE NULL
      END
  WHERE id = v_order_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS import_order_items_update_totals ON import_order_items;
CREATE TRIGGER import_order_items_update_totals
  AFTER INSERT OR UPDATE OR DELETE ON import_order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_import_order_totals();

-- ============================================================================
-- Function: Update shipped/received quantities on import_order_items
-- ============================================================================

CREATE OR REPLACE FUNCTION update_order_item_quantities()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_order_item_id UUID;
  v_shipped INTEGER;
  v_received INTEGER;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_order_item_id := OLD.import_order_item_id;
  ELSE
    v_order_item_id := NEW.import_order_item_id;
  END IF;

  SELECT 
    COALESCE(SUM(shipped_quantity), 0),
    COALESCE(SUM(received_quantity), 0)
  INTO v_shipped, v_received
  FROM shipment_items
  WHERE import_order_item_id = v_order_item_id;

  UPDATE import_order_items
  SET shipped_quantity = v_shipped,
      received_quantity = v_received
  WHERE id = v_order_item_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS shipment_items_update_quantities ON shipment_items;
CREATE TRIGGER shipment_items_update_quantities
  AFTER INSERT OR UPDATE OR DELETE ON shipment_items
  FOR EACH ROW
  EXECUTE FUNCTION update_order_item_quantities();

-- ============================================================================
-- View: import_orders_with_details
-- ============================================================================

CREATE OR REPLACE VIEW import_orders_with_details AS
SELECT 
  io.id,
  io.po_number,
  io.partner_id,
  io.status,
  io.order_date,
  io.expected_etd,
  io.expected_eta,
  io.currency,
  io.exchange_rate,
  io.payment_terms,
  io.total_amount,
  io.total_amount_krw,
  io.requested_by,
  io.confirmed_by,
  io.confirmed_at,
  io.memo,
  io.created_at,
  io.updated_at,
  -- Partner details
  p.name AS partner_name,
  p.partner_code,
  p.country_code AS partner_country,
  -- Requester details
  ru.display_name AS requested_by_name,
  -- Confirmer details
  cu.display_name AS confirmed_by_name,
  -- Item aggregates
  (SELECT COUNT(*) FROM import_order_items WHERE import_order_id = io.id) AS item_count,
  (SELECT SUM(quantity) FROM import_order_items WHERE import_order_id = io.id) AS total_quantity,
  (SELECT SUM(shipped_quantity) FROM import_order_items WHERE import_order_id = io.id) AS total_shipped,
  (SELECT SUM(received_quantity) FROM import_order_items WHERE import_order_id = io.id) AS total_received,
  -- Shipment count
  (SELECT COUNT(*) FROM shipments WHERE import_order_id = io.id) AS shipment_count
FROM import_orders io
LEFT JOIN partners p ON io.partner_id = p.id
LEFT JOIN users ru ON io.requested_by = ru.id
LEFT JOIN users cu ON io.confirmed_by = cu.id;

-- ============================================================================
-- View: shipments_with_details
-- ============================================================================

CREATE OR REPLACE VIEW shipments_with_details AS
SELECT 
  s.id,
  s.import_order_id,
  s.shipment_number,
  s.bl_number,
  s.vessel_name,
  s.voyage_number,
  s.container_numbers,
  s.container_count,
  s.port_of_loading,
  s.port_of_discharge,
  s.etd,
  s.eta,
  s.actual_departure_date,
  s.actual_arrival_date,
  s.customs_cleared_date,
  s.delivered_date,
  s.status,
  s.documents,
  s.memo,
  s.created_at,
  s.updated_at,
  -- Order details
  io.po_number,
  io.partner_id,
  p.name AS partner_name,
  -- Item aggregates
  (SELECT COUNT(*) FROM shipment_items WHERE shipment_id = s.id) AS item_count,
  (SELECT SUM(shipped_quantity) FROM shipment_items WHERE shipment_id = s.id) AS total_shipped_quantity,
  (SELECT SUM(received_quantity) FROM shipment_items WHERE shipment_id = s.id) AS total_received_quantity,
  -- Cost aggregates
  (SELECT COALESCE(SUM(amount_krw), 0) FROM import_costs WHERE shipment_id = s.id) AS total_cost_krw
FROM shipments s
LEFT JOIN import_orders io ON s.import_order_id = io.id
LEFT JOIN partners p ON io.partner_id = p.id;

-- ============================================================================
-- View: landed_cost_summary (for cost analysis)
-- ============================================================================

CREATE OR REPLACE VIEW landed_cost_summary AS
SELECT 
  io.id AS import_order_id,
  io.po_number,
  io.partner_id,
  p.name AS partner_name,
  io.total_amount,
  io.currency,
  io.total_amount_krw AS goods_value_krw,
  -- Cost breakdown by type
  COALESCE(SUM(CASE WHEN ic.cost_type = 'freight' THEN ic.amount_krw END), 0) AS freight_krw,
  COALESCE(SUM(CASE WHEN ic.cost_type = 'insurance' THEN ic.amount_krw END), 0) AS insurance_krw,
  COALESCE(SUM(CASE WHEN ic.cost_type = 'tariff' THEN ic.amount_krw END), 0) AS tariff_krw,
  COALESCE(SUM(CASE WHEN ic.cost_type = 'vat' THEN ic.amount_krw END), 0) AS vat_krw,
  COALESCE(SUM(CASE WHEN ic.cost_type = 'customs_fee' THEN ic.amount_krw END), 0) AS customs_fee_krw,
  COALESCE(SUM(CASE WHEN ic.cost_type = 'inland_transport' THEN ic.amount_krw END), 0) AS inland_transport_krw,
  COALESCE(SUM(CASE WHEN ic.cost_type NOT IN ('freight', 'insurance', 'tariff', 'vat', 'customs_fee', 'inland_transport') THEN ic.amount_krw END), 0) AS other_costs_krw,
  -- Total landed cost
  io.total_amount_krw + COALESCE(SUM(ic.amount_krw), 0) AS total_landed_cost_krw,
  -- Cost percentage
  CASE 
    WHEN io.total_amount_krw > 0 
    THEN ROUND((COALESCE(SUM(ic.amount_krw), 0)::NUMERIC / io.total_amount_krw) * 100, 2)
    ELSE 0
  END AS cost_percentage
FROM import_orders io
LEFT JOIN partners p ON io.partner_id = p.id
LEFT JOIN shipments s ON s.import_order_id = io.id
LEFT JOIN import_costs ic ON (ic.shipment_id = s.id OR ic.import_order_id = io.id)
GROUP BY io.id, io.po_number, io.partner_id, p.name, io.total_amount, io.currency, io.total_amount_krw;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE import_orders IS 'Purchase orders to overseas paper suppliers';
COMMENT ON TABLE import_order_items IS 'Line items for import orders with paper specifications and pricing';
COMMENT ON TABLE shipments IS 'Shipment tracking based on Bill of Lading';
COMMENT ON TABLE shipment_items IS 'Items included in each shipment with quantity tracking';
COMMENT ON TABLE import_costs IS 'All costs associated with import (freight, tariff, etc.)';
COMMENT ON TABLE import_history IS 'Audit trail for import order and shipment status changes';

COMMENT ON COLUMN import_orders.po_number IS 'Auto-generated: PO-YYYYMMDD-NNN';
COMMENT ON COLUMN import_orders.currency IS 'ISO 4217 currency code (USD, EUR, etc.)';
COMMENT ON COLUMN import_orders.exchange_rate IS 'KRW per currency unit at order confirmation';

COMMENT ON COLUMN shipments.shipment_number IS 'Auto-generated: SH-YYYYMMDD-NNN';
COMMENT ON COLUMN shipments.bl_number IS 'Bill of Lading number from shipping line';
COMMENT ON COLUMN shipments.documents IS 'JSON array of document references [{type, filename, url, uploaded_at}]';

COMMENT ON VIEW landed_cost_summary IS 'Aggregated view for landed cost calculation and analysis';
