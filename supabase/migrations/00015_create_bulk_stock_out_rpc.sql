-- ============================================================================
-- CHISAN Platform - Bulk Stock-Out RPC Function
-- INV-F004: Atomic bulk stock-out processing
-- ============================================================================

CREATE OR REPLACE FUNCTION public.generate_stock_out_number()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  today_prefix TEXT;
  last_seq INTEGER;
  new_number TEXT;
BEGIN
  today_prefix := 'SO-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-';
  
  PERFORM pg_advisory_xact_lock(hashtext(today_prefix));
  
  SELECT COALESCE(
    MAX(CAST(SUBSTRING(reason FROM LENGTH(today_prefix) + 1) AS INTEGER)),
    0
  ) INTO last_seq
  FROM public.stock_movements
  WHERE movement_type = 'out'
    AND reason LIKE today_prefix || '%';
  
  new_number := today_prefix || LPAD((last_seq + 1)::TEXT, 3, '0');
  
  RETURN new_number;
END;
$$;

CREATE OR REPLACE FUNCTION public.bulk_stock_out(
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
  stock_record RECORD;
  movement_record RECORD;
  out_number TEXT;
  results JSONB := '[]'::JSONB;
  item_count INTEGER := 0;
  out_quantity INTEGER;
  out_weight NUMERIC(12,3);
  new_quantity INTEGER;
  new_weight NUMERIC(12,3);
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

  out_number := public.generate_stock_out_number();

  FOR item IN SELECT * FROM jsonb_array_elements(items)
  LOOP
    item_count := item_count + 1;

    IF item->>'stock_id' IS NULL THEN
      RAISE EXCEPTION 'stock_id is required (item #%)', item_count;
    END IF;
    IF item->>'reason_type' IS NULL THEN
      RAISE EXCEPTION 'reason_type is required (item #%)', item_count;
    END IF;

    SELECT * INTO stock_record
    FROM public.stocks
    WHERE id = (item->>'stock_id')::UUID
      AND is_active = true
      AND status = 'available'
    FOR UPDATE;
    
    IF stock_record.id IS NULL THEN
      RAISE EXCEPTION 'Stock not found, inactive, or not available: % (item #%)', item->>'stock_id', item_count;
    END IF;

    out_quantity := COALESCE((item->>'quantity')::INTEGER, stock_record.quantity);
    out_weight := COALESCE((item->>'weight_kg')::NUMERIC, stock_record.weight_kg);

    IF out_quantity > stock_record.quantity THEN
      RAISE EXCEPTION 'Insufficient quantity: requested %, available % (item #%)', out_quantity, stock_record.quantity, item_count;
    END IF;

    IF out_weight IS NOT NULL AND stock_record.weight_kg IS NOT NULL AND out_weight > stock_record.weight_kg THEN
      RAISE EXCEPTION 'Insufficient weight: requested %, available % (item #%)', out_weight, stock_record.weight_kg, item_count;
    END IF;

    new_quantity := stock_record.quantity - out_quantity;
    new_weight := CASE 
      WHEN stock_record.weight_kg IS NOT NULL AND out_weight IS NOT NULL 
      THEN stock_record.weight_kg - out_weight 
      ELSE NULL 
    END;

    UPDATE public.stocks
    SET 
      quantity = new_quantity,
      weight_kg = new_weight,
      status = CASE WHEN new_quantity = 0 THEN 'disposed'::public.stock_status ELSE status END,
      is_active = CASE WHEN new_quantity = 0 THEN false ELSE is_active END,
      updated_at = NOW()
    WHERE id = stock_record.id;

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
      reference_id,
      performed_by
    ) VALUES (
      stock_record.id,
      'out'::public.movement_type,
      -out_quantity,
      CASE WHEN out_weight IS NOT NULL THEN -out_weight ELSE NULL END,
      stock_record.quantity,
      new_quantity,
      stock_record.weight_kg,
      new_weight,
      out_number || ': ' || COALESCE(item->>'reason', item->>'reason_type'),
      (item->>'reason_type')::public.movement_reference_type,
      CASE WHEN item->>'reference_id' IS NOT NULL THEN (item->>'reference_id')::UUID ELSE NULL END,
      performed_by
    )
    RETURNING * INTO movement_record;

    results := results || jsonb_build_array(jsonb_build_object(
      'stockId', stock_record.id,
      'movementId', movement_record.id,
      'outNumber', out_number,
      'itemId', stock_record.item_id,
      'locationId', stock_record.location_id,
      'quantityOut', out_quantity,
      'weightOutKg', out_weight,
      'quantityRemaining', new_quantity,
      'weightRemainingKg', new_weight
    ));
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'count', jsonb_array_length(results),
    'outNumber', out_number,
    'results', results
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Bulk stock-out failed (sqlstate=%, item=#%): %', SQLSTATE, item_count, SQLERRM;
END;
$$;

REVOKE ALL ON FUNCTION public.bulk_stock_out(JSONB, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bulk_stock_out(JSONB, UUID) TO service_role;

REVOKE ALL ON FUNCTION public.generate_stock_out_number() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.generate_stock_out_number() TO service_role;

COMMENT ON FUNCTION public.bulk_stock_out(JSONB, UUID) IS 'Atomic bulk stock-out operation - all items succeed or all fail';
COMMENT ON FUNCTION public.generate_stock_out_number() IS 'Generates sequential stock-out number in format SO-YYYYMMDD-NNN';
