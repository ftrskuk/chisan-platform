-- ============================================================================
-- CHISAN Platform - Items Table Migration
-- INV-F002: Item Master Management
-- ============================================================================

CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identification (auto-generated if not provided)
  item_code TEXT UNIQUE NOT NULL,      -- 'WF-70-1000-R'
  display_name TEXT NOT NULL,          -- 'Woodfree Offset 70g 1000mm Roll'

  -- Classification
  paper_type_id UUID NOT NULL REFERENCES paper_types(id),
  brand_id UUID REFERENCES brands(id), -- Optional

  -- Specifications
  grammage INTEGER NOT NULL CHECK (grammage BETWEEN 30 AND 500),
  width_mm INTEGER CHECK (width_mm BETWEEN 50 AND 2500),
  form TEXT NOT NULL CHECK (form IN ('roll', 'sheet')),

  -- Roll-specific
  core_diameter_inch NUMERIC(3,1),     -- 3.0, 6.0 inch

  -- Sheet-specific
  length_mm INTEGER,
  sheets_per_ream INTEGER DEFAULT 500,

  -- Inventory settings
  unit_of_measure TEXT DEFAULT 'kg' NOT NULL,

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

CREATE INDEX IF NOT EXISTS idx_items_code ON items(item_code);
CREATE INDEX IF NOT EXISTS idx_items_paper_type ON items(paper_type_id);
CREATE INDEX IF NOT EXISTS idx_items_brand ON items(brand_id);
CREATE INDEX IF NOT EXISTS idx_items_grammage ON items(grammage);
CREATE INDEX IF NOT EXISTS idx_items_form ON items(form);
CREATE INDEX IF NOT EXISTS idx_items_active ON items(is_active);

-- Composite for common search patterns
CREATE INDEX IF NOT EXISTS idx_items_type_grammage_width
  ON items(paper_type_id, grammage, width_mm);

-- ============================================================================
-- RLS
-- ============================================================================

ALTER TABLE items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "items_select_authenticated" ON items
  FOR SELECT TO authenticated
  USING (true);

-- ============================================================================
-- Trigger: updated_at
-- ============================================================================

DROP TRIGGER IF EXISTS items_updated_at ON items;
CREATE TRIGGER items_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Function: Auto-generate item_code
-- Pattern: {PAPER_TYPE_CODE}-{GRAMMAGE}-{WIDTH}-{FORM}
-- Examples: WF-70-1000-R (roll), WF-70-210x297-S (sheet)
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_item_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  type_code TEXT;
  form_code TEXT;
BEGIN
  -- Skip if item_code already provided
  IF NEW.item_code IS NOT NULL AND NEW.item_code != '' THEN
    RETURN NEW;
  END IF;

  -- Get paper type code
  SELECT code INTO type_code FROM paper_types WHERE id = NEW.paper_type_id;

  -- Determine form code
  form_code := CASE WHEN NEW.form = 'roll' THEN 'R' ELSE 'S' END;

  -- Generate code based on form
  IF NEW.form = 'roll' THEN
    NEW.item_code := type_code || '-' || NEW.grammage || '-' || NEW.width_mm || '-' || form_code;
  ELSE
    NEW.item_code := type_code || '-' || NEW.grammage || '-' || NEW.width_mm || 'x' || NEW.length_mm || '-' || form_code;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS items_generate_code ON items;
CREATE TRIGGER items_generate_code
  BEFORE INSERT ON items
  FOR EACH ROW
  EXECUTE FUNCTION generate_item_code();
