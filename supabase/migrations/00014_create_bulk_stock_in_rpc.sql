-- ============================================================================
-- CHISAN Platform - Bulk Stock-In RPC Function
-- INV-F003: Atomic bulk stock-in processing
-- ============================================================================
-- This function wraps multiple stock insertions in a single transaction,
-- ensuring all-or-nothing semantics for bulk operations.
-- ============================================================================

-- ============================================================================
-- Type: Bulk stock-in item input
-- ============================================================================

CREATE TYPE bulk_stock_in_item AS (
  item_id UUID,
  location_id UUID,
  width_mm INTEGER,
  weight_kg NUMERIC(12,3),
  quantity INTEGER,
  condition TEXT,
  source_type TEXT,
  lot_number TEXT,
  notes TEXT
);

-- ============================================================================
-- Type: Bulk stock-in result item
-- ============================================================================

CREATE TYPE bulk_stock_in_result_item AS (
  stock_id UUID,
  movement_id UUID,
  batch_number TEXT,
  item_id UUID,
  location_id UUID,
  width_mm INTEGER,
  weight_kg NUMERIC(12,3),
  quantity INTEGER,
  condition TEXT
);

-- ============================================================================
-- Function: Generate batch number (with advisory lock for concurrency safety)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.generate_batch_number()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  today_prefix TEXT;
  last_seq INTEGER;
  new_batch TEXT;
BEGIN
  today_prefix := 'SI-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-';
  
  -- Acquire advisory lock for this day's batch number generation
  -- Using hashtext ensures consistent lock ID per day prefix
  PERFORM pg_advisory_xact_lock(hashtext(today_prefix));
  
  SELECT COALESCE(
    MAX(CAST(SUBSTRING(batch_number FROM LENGTH(today_prefix) + 1) AS INTEGER)),
    0
  ) INTO last_seq
  FROM public.stocks
  WHERE batch_number LIKE today_prefix || '%';
  
  new_batch := today_prefix || LPAD((last_seq + 1)::TEXT, 3, '0');
  
  RETURN new_batch;
END;
$$;

-- ============================================================================
-- Function: Bulk Stock-In (Atomic Transaction)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.bulk_stock_in(
  items JSONB,
  performed_by UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  item JSONB;
  item_record RECORD;
  stock_record RECORD;
  movement_record RECORD;
  batch_number TEXT;
  results JSONB := '[]'::JSONB;
  item_count INTEGER := 0;
  current_received_at TIMESTAMPTZ := NOW();
BEGIN
  IF performed_by IS NULL THEN
    RAISE EXCEPTION 'performed_by cannot be null';
  END IF;

  IF items IS NULL OR jsonb_array_length(items) = 0 THEN
    RAISE EXCEPTION 'Items array cannot be empty';
  END IF;
  
  IF jsonb_array_length(items) > 50 THEN
    RAISE EXCEPTION 'Maximum 50 items allowed per bulk operation';
  END IF;

  FOR item IN SELECT * FROM jsonb_array_elements(items)
  LOOP
    item_count := item_count + 1;

    IF item->>'item_id' IS NULL THEN
      RAISE EXCEPTION 'item_id is required (item #%)', item_count;
    END IF;
    IF item->>'location_id' IS NULL THEN
      RAISE EXCEPTION 'location_id is required (item #%)', item_count;
    END IF;
    IF item->>'width_mm' IS NULL THEN
      RAISE EXCEPTION 'width_mm is required (item #%)', item_count;
    END IF;
    IF item->>'weight_kg' IS NULL THEN
      RAISE EXCEPTION 'weight_kg is required (item #%)', item_count;
    END IF;

    SELECT id INTO item_record
    FROM public.items
    WHERE id = (item->>'item_id')::UUID
      AND is_active = true;
    
    IF item_record.id IS NULL THEN
      RAISE EXCEPTION 'Invalid or inactive item: % (item #%)', item->>'item_id', item_count;
    END IF;
    
    SELECT id INTO item_record
    FROM public.locations
    WHERE id = (item->>'location_id')::UUID
      AND is_active = true;
    
    IF item_record.id IS NULL THEN
      RAISE EXCEPTION 'Invalid or inactive location: % (item #%)', item->>'location_id', item_count;
    END IF;
    
    batch_number := public.generate_batch_number();
    
    INSERT INTO public.stocks (
      item_id,
      location_id,
      width_mm,
      weight_kg,
      quantity,
      condition,
      status,
      is_active,
      batch_number,
      lot_number,
      received_at,
      source_type,
      notes
    ) VALUES (
      (item->>'item_id')::UUID,
      (item->>'location_id')::UUID,
      (item->>'width_mm')::INTEGER,
      (item->>'weight_kg')::NUMERIC(12,3),
      COALESCE((item->>'quantity')::INTEGER, 1),
      COALESCE(item->>'condition', 'parent')::public.stock_condition,
      'available'::public.stock_status,
      true,
      batch_number,
      item->>'lot_number',
      current_received_at,
      item->>'source_type',
      item->>'notes'
    )
    RETURNING * INTO stock_record;
    
    INSERT INTO public.stock_movements (
      stock_id,
      movement_type,
      quantity_change,
      weight_change_kg,
      quantity_before,
      quantity_after,
      weight_before_kg,
      weight_after_kg,
      reason,
      reference_type,
      performed_by
    ) VALUES (
      stock_record.id,
      'in'::public.movement_type,
      stock_record.quantity,
      stock_record.weight_kg,
      0,
      stock_record.quantity,
      0,
      stock_record.weight_kg,
      'Stock-in: ' || COALESCE(item->>'source_type', 'import'),
      COALESCE(item->>'source_type', 'import')::public.movement_reference_type,
      performed_by
    )
    RETURNING * INTO movement_record;
    
    results := results || jsonb_build_array(jsonb_build_object(
      'stockId', stock_record.id,
      'movementId', movement_record.id,
      'batchNumber', stock_record.batch_number,
      'itemId', stock_record.item_id,
      'locationId', stock_record.location_id,
      'widthMm', stock_record.width_mm,
      'weightKg', stock_record.weight_kg,
      'quantity', stock_record.quantity,
      'condition', stock_record.condition
    ));
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'count', jsonb_array_length(results),
    'results', results
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Bulk stock-in failed (sqlstate=%, item=#%): %', SQLSTATE, item_count, SQLERRM;
END;
$$;

-- ============================================================================
-- Security: Lock down SECURITY DEFINER functions
-- ============================================================================

REVOKE ALL ON FUNCTION public.bulk_stock_in(JSONB, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bulk_stock_in(JSONB, UUID) TO service_role;

REVOKE ALL ON FUNCTION public.generate_batch_number() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.generate_batch_number() TO service_role;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON FUNCTION public.bulk_stock_in(JSONB, UUID) IS 'Atomic bulk stock-in operation - all items succeed or all fail';
COMMENT ON FUNCTION public.generate_batch_number() IS 'Generates sequential batch number in format SI-YYYYMMDD-NNN (concurrency-safe)';
