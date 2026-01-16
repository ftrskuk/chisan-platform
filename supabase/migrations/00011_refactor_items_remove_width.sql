-- ============================================================================
-- CHISAN Platform - Items Table Refactoring Migration
-- ============================================================================

-- ============================================================================
-- Step 1: Add internal_code to brands table (idempotent)
-- ============================================================================

ALTER TABLE brands ADD COLUMN IF NOT EXISTS internal_code TEXT;

DO $$ BEGIN
  ALTER TABLE brands ADD CONSTRAINT brands_internal_code_unique UNIQUE (internal_code);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_brands_internal_code ON brands(internal_code);

-- ============================================================================
-- Step 2: Drop width_mm related objects from items
-- ============================================================================

DROP INDEX IF EXISTS idx_items_type_grammage_width;

ALTER TABLE items DROP COLUMN IF EXISTS width_mm;

-- ============================================================================
-- Step 3: Add unique constraints for item specification (idempotent)
-- Using partial unique indexes to handle nullable brand_id correctly
-- ============================================================================

DROP INDEX IF EXISTS idx_items_unique_with_brand;
DROP INDEX IF EXISTS idx_items_unique_without_brand;

DO $$ BEGIN
  ALTER TABLE items DROP CONSTRAINT IF EXISTS items_unique_specification;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_items_unique_with_brand 
  ON items(paper_type_id, brand_id, grammage, form) 
  WHERE brand_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_items_unique_without_brand 
  ON items(paper_type_id, grammage, form) 
  WHERE brand_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_items_type_grammage_form
  ON items(paper_type_id, grammage, form);

-- ============================================================================
-- Step 4: Update generate_item_code() function
-- Pattern: {TYPE}-{BRAND_INTERNAL_CODE}-{GSM}-{FORM}
-- Fallback to brand.code if internal_code is NULL
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_item_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  type_code TEXT;
  brand_identifier TEXT;
  form_code TEXT;
BEGIN
  IF NEW.item_code IS NOT NULL AND NEW.item_code != '' THEN
    RETURN NEW;
  END IF;

  SELECT code INTO type_code FROM paper_types WHERE id = NEW.paper_type_id;

  IF NEW.brand_id IS NOT NULL THEN
    SELECT COALESCE(internal_code, code) INTO brand_identifier 
    FROM brands WHERE id = NEW.brand_id;
  END IF;

  form_code := CASE WHEN NEW.form = 'roll' THEN 'R' ELSE 'S' END;

  IF brand_identifier IS NOT NULL THEN
    NEW.item_code := type_code || '-' || brand_identifier || '-' || NEW.grammage || '-' || form_code;
  ELSE
    NEW.item_code := type_code || '-' || NEW.grammage || '-' || form_code;
  END IF;

  RETURN NEW;
END;
$$;
