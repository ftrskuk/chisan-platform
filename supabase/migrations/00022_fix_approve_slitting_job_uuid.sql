-- ============================================================================
-- Fix approve_slitting_job function - UUID type mismatch
-- The function was casting p_job_id to TEXT but source_reference_id and 
-- reference_id columns are UUID type
-- ============================================================================

CREATE OR REPLACE FUNCTION approve_slitting_job(
  p_job_id UUID,
  p_approved_by UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_job RECORD;
  v_parent_stock RECORD;
  v_output RECORD;
  v_output_stock_id UUID;
  v_movement_id UUID;
  v_total_output_qty INTEGER := 0;
  v_total_output_weight NUMERIC(12,3) := 0;
  v_total_loss_qty INTEGER := 0;
  v_total_loss_weight NUMERIC(12,3) := 0;
  v_batch_number TEXT;
  v_output_results JSONB := '[]'::JSONB;
  v_default_location_id UUID;
BEGIN
  -- ========================================================================
  -- 1. Validate job exists and is in 'completed' status
  -- ========================================================================
  SELECT * INTO v_job
  FROM slitting_jobs
  WHERE id = p_job_id
  FOR UPDATE;  -- Lock the job row

  IF v_job IS NULL THEN
    RAISE EXCEPTION 'Job not found: %', p_job_id;
  END IF;

  IF v_job.status != 'completed' THEN
    RAISE EXCEPTION 'Job is not in completed status. Current status: %', v_job.status;
  END IF;

  -- ========================================================================
  -- 2. Get and lock parent stock
  -- ========================================================================
  SELECT * INTO v_parent_stock
  FROM stocks
  WHERE id = v_job.parent_stock_id
  FOR UPDATE;  -- Lock the parent stock row

  IF v_parent_stock IS NULL THEN
    RAISE EXCEPTION 'Parent stock not found: %', v_job.parent_stock_id;
  END IF;

  -- ========================================================================
  -- 3. Get default location for new stocks
  -- ========================================================================
  SELECT id INTO v_default_location_id
  FROM locations
  WHERE is_active = true
  ORDER BY type = 'default' DESC, created_at ASC
  LIMIT 1;

  IF v_default_location_id IS NULL THEN
    RAISE EXCEPTION 'No active location found for creating output stocks';
  END IF;

  -- ========================================================================
  -- 4. Process each output
  -- ========================================================================
  FOR v_output IN
    SELECT * FROM slitting_outputs WHERE job_id = p_job_id
  LOOP
    IF v_output.is_loss THEN
      -- Track loss totals
      v_total_loss_qty := v_total_loss_qty + v_output.quantity;
      v_total_loss_weight := v_total_loss_weight + COALESCE(v_output.weight_kg, 0);
    ELSE
      -- Track output totals
      v_total_output_qty := v_total_output_qty + v_output.quantity;
      v_total_output_weight := v_total_output_weight + COALESCE(v_output.weight_kg, 0);

      -- Generate batch number for output stock
      v_batch_number := 'SL-' || to_char(NOW(), 'YYYYMMDD') || '-' || 
                        LPAD((SELECT COALESCE(MAX(
                          CAST(SUBSTRING(batch_number FROM '\d{3}$') AS INTEGER)
                        ), 0) + 1 FROM stocks WHERE batch_number LIKE 'SL-' || to_char(NOW(), 'YYYYMMDD') || '-%')::TEXT, 3, '0');

      -- Create output stock
      INSERT INTO stocks (
        item_id,
        location_id,
        width_mm,
        condition,
        quantity,
        weight_kg,
        status,
        is_active,
        batch_number,
        received_at,
        parent_stock_id,
        source_type,
        source_reference_id,
        notes
      ) VALUES (
        v_output.item_id,
        v_default_location_id,
        v_output.width_mm,
        'slitted'::stock_condition,
        v_output.quantity,
        v_output.weight_kg,
        'available'::stock_status,
        true,
        v_batch_number,
        NOW(),
        v_job.parent_stock_id,
        'production',
        p_job_id,
        'Slitted from job: ' || p_job_id::TEXT
      )
      RETURNING id INTO v_output_stock_id;

      -- Create stock movement for output (IN)
      INSERT INTO stock_movements (
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
        v_output_stock_id,
        'in'::movement_type,
        v_output.quantity,
        v_output.weight_kg,
        0,
        v_output.quantity,
        0,
        v_output.weight_kg,
        'Slitting output',
        'production'::movement_reference_type,
        p_job_id,
        p_approved_by
      )
      RETURNING id INTO v_movement_id;

      UPDATE slitting_outputs
      SET qr_code = v_batch_number
      WHERE id = v_output.id;

      -- Add to results
      v_output_results := v_output_results || jsonb_build_object(
        'outputId', v_output.id,
        'stockId', v_output_stock_id,
        'movementId', v_movement_id,
        'batchNumber', v_batch_number,
        'widthMm', v_output.width_mm,
        'quantity', v_output.quantity,
        'weightKg', v_output.weight_kg
      );
    END IF;
  END LOOP;

  -- ========================================================================
  -- 5. Decrease parent stock (OUT movement)
  -- ========================================================================
  -- Create stock movement for parent (OUT)
  INSERT INTO stock_movements (
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
    v_parent_stock.id,
    'out'::movement_type,
    -1,  -- Parent roll is consumed (1 roll)
    -(v_total_output_weight + v_total_loss_weight),
    v_parent_stock.quantity,
    GREATEST(v_parent_stock.quantity - 1, 0),
    v_parent_stock.weight_kg,
    GREATEST(COALESCE(v_parent_stock.weight_kg, 0) - (v_total_output_weight + v_total_loss_weight), 0),
    'Slitting production',
    'production'::movement_reference_type,
    p_job_id,
    p_approved_by
  );

  UPDATE stocks
  SET 
    quantity = GREATEST(quantity - 1, 0),
    weight_kg = GREATEST(COALESCE(weight_kg, 0) - (v_total_output_weight + v_total_loss_weight), 0),
    status = CASE WHEN quantity - 1 <= 0 THEN 'disposed'::stock_status ELSE status END
  WHERE id = v_parent_stock.id;

  -- ========================================================================
  -- 6. Update job status to approved
  -- ========================================================================
  UPDATE slitting_jobs
  SET 
    status = 'approved',
    approved_at = NOW(),
    approved_by = p_approved_by
  WHERE id = p_job_id;

  -- ========================================================================
  -- 7. Create history record
  -- ========================================================================
  INSERT INTO slitting_history (
    entity_type,
    entity_id,
    action,
    actor_id,
    previous_status,
    new_status,
    changes
  ) VALUES (
    'job'::slitting_entity_type,
    p_job_id,
    'approved'::slitting_history_action,
    p_approved_by,
    'completed',
    'approved',
    jsonb_build_object(
      'parentStockId', v_parent_stock.id,
      'totalOutputQty', v_total_output_qty,
      'totalOutputWeight', v_total_output_weight,
      'totalLossQty', v_total_loss_qty,
      'totalLossWeight', v_total_loss_weight,
      'outputs', v_output_results
    )
  );

  -- ========================================================================
  -- 8. Check if all jobs in schedule are approved -> update schedule status
  -- ========================================================================
  IF NOT EXISTS (
    SELECT 1 FROM slitting_jobs 
    WHERE schedule_id = v_job.schedule_id 
    AND status != 'approved'
  ) THEN
    UPDATE slitting_schedules
    SET status = 'completed'
    WHERE id = v_job.schedule_id;

    INSERT INTO slitting_history (
      entity_type,
      entity_id,
      action,
      actor_id,
      previous_status,
      new_status
    ) VALUES (
      'schedule'::slitting_entity_type,
      v_job.schedule_id,
      'completed'::slitting_history_action,
      p_approved_by,
      'in_progress',
      'completed'
    );
  END IF;

  -- ========================================================================
  -- 9. Return result
  -- ========================================================================
  RETURN jsonb_build_object(
    'success', true,
    'jobId', p_job_id,
    'parentStockId', v_parent_stock.id,
    'totalOutputQty', v_total_output_qty,
    'totalOutputWeight', v_total_output_weight,
    'totalLossQty', v_total_loss_qty,
    'totalLossWeight', v_total_loss_weight,
    'outputs', v_output_results
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'approve_slitting_job failed (sqlstate=%): %', SQLSTATE, SQLERRM;
END;
$$;

-- Re-grant permissions
REVOKE ALL ON FUNCTION approve_slitting_job(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION approve_slitting_job(UUID, UUID) TO service_role;
