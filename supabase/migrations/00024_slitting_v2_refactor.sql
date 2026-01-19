-- ============================================================================
-- CHISAN Platform - Slitting V2 Refactor Migration
-- ============================================================================
-- This migration refactors the slitting module from V1 (1 job = 1 parent roll)
-- to V2 (1 job = product order with multiple rolls).
--
-- Changes:
-- 1. slitting_jobs: Add item_id, parent_width_mm, planned_roll_count
-- 2. slitting_planned_outputs: NEW - cutting pattern defined upfront
-- 3. slitting_job_rolls: NEW - parent rolls registered by workers
-- 4. slitting_outputs → slitting_actual_outputs: RENAMED with new columns
-- 5. approve_slitting_job_v2: NEW - handles multi-roll approval
-- 6. Analysis views: variance_analysis, loss_analysis
-- ============================================================================

-- ============================================================================
-- SECTION 1: ENUM - Job Roll Status
-- ============================================================================

CREATE TYPE job_roll_status AS ENUM (
  'registered',   -- Roll scanned/added to job
  'in_progress',  -- Worker actively cutting this roll
  'completed',    -- Roll finished, outputs recorded
  'cancelled'     -- Roll cancelled (wrong roll, defect, etc.)
);

-- ============================================================================
-- SECTION 2: MODIFY slitting_jobs TABLE
-- Add V2 columns, make parent_stock_id nullable
-- ============================================================================

-- Add new V2 columns
ALTER TABLE slitting_jobs
  ADD COLUMN IF NOT EXISTS item_id UUID REFERENCES items(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS parent_width_mm INTEGER CHECK (parent_width_mm IS NULL OR parent_width_mm BETWEEN 50 AND 2500),
  ADD COLUMN IF NOT EXISTS planned_roll_count INTEGER NOT NULL DEFAULT 1 CHECK (planned_roll_count BETWEEN 1 AND 100);

-- Make parent_stock_id nullable for V2 jobs (V2 uses slitting_job_rolls instead)
ALTER TABLE slitting_jobs ALTER COLUMN parent_stock_id DROP NOT NULL;

-- Add index for new item_id column
CREATE INDEX IF NOT EXISTS idx_slitting_jobs_item ON slitting_jobs(item_id) WHERE item_id IS NOT NULL;

-- ============================================================================
-- SECTION 3: CREATE slitting_planned_outputs TABLE
-- Cutting pattern defined by admin at job creation
-- ============================================================================

CREATE TABLE IF NOT EXISTS slitting_planned_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Parent job
  job_id UUID NOT NULL REFERENCES slitting_jobs(id) ON DELETE CASCADE,
  
  -- Output specification
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE RESTRICT,
  width_mm INTEGER NOT NULL CHECK (width_mm BETWEEN 50 AND 2500),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  
  -- Ordering within cutting pattern
  sequence_number INTEGER NOT NULL DEFAULT 1,
  
  -- Notes
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT slitting_planned_outputs_job_sequence_unique UNIQUE (job_id, sequence_number)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_slitting_planned_outputs_job ON slitting_planned_outputs(job_id);
CREATE INDEX IF NOT EXISTS idx_slitting_planned_outputs_item ON slitting_planned_outputs(item_id);

-- ============================================================================
-- SECTION 4: CREATE slitting_job_rolls TABLE
-- Parent rolls scanned/registered by workers during work
-- ============================================================================

CREATE TABLE IF NOT EXISTS slitting_job_rolls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Parent job
  job_id UUID NOT NULL REFERENCES slitting_jobs(id) ON DELETE CASCADE,
  
  -- Parent stock (the roll being cut)
  stock_id UUID NOT NULL REFERENCES stocks(id) ON DELETE RESTRICT,
  
  -- Ordering (1st roll, 2nd roll, etc.)
  sequence_number INTEGER NOT NULL DEFAULT 1,
  
  -- Status tracking
  status job_roll_status NOT NULL DEFAULT 'registered',
  
  -- Registration info
  registered_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  registered_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  
  -- Work timestamps
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Notes
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT slitting_job_rolls_job_sequence_unique UNIQUE (job_id, sequence_number),
  CONSTRAINT slitting_job_rolls_job_stock_unique UNIQUE (job_id, stock_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_slitting_job_rolls_job ON slitting_job_rolls(job_id);
CREATE INDEX IF NOT EXISTS idx_slitting_job_rolls_stock ON slitting_job_rolls(stock_id);
CREATE INDEX IF NOT EXISTS idx_slitting_job_rolls_status ON slitting_job_rolls(status);
CREATE INDEX IF NOT EXISTS idx_slitting_job_rolls_registered_by ON slitting_job_rolls(registered_by);

-- Partial indexes for active rolls
CREATE INDEX IF NOT EXISTS idx_slitting_job_rolls_in_progress ON slitting_job_rolls(status) WHERE status = 'in_progress';
CREATE INDEX IF NOT EXISTS idx_slitting_job_rolls_registered ON slitting_job_rolls(status) WHERE status = 'registered';

-- Trigger: updated_at
DROP TRIGGER IF EXISTS slitting_job_rolls_updated_at ON slitting_job_rolls;
CREATE TRIGGER slitting_job_rolls_updated_at
  BEFORE UPDATE ON slitting_job_rolls
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SECTION 5: RENAME slitting_outputs → slitting_actual_outputs
-- Add new columns for V2
-- ============================================================================

-- Rename table
ALTER TABLE IF EXISTS slitting_outputs RENAME TO slitting_actual_outputs;

-- Add new V2 columns
ALTER TABLE slitting_actual_outputs
  ADD COLUMN IF NOT EXISTS job_roll_id UUID REFERENCES slitting_job_rolls(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS planned_output_id UUID REFERENCES slitting_planned_outputs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS length_m NUMERIC(12,2) CHECK (length_m IS NULL OR length_m > 0),
  ADD COLUMN IF NOT EXISTS roll_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS recorded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS recorded_at TIMESTAMPTZ;

-- Rename indexes to match new table name
ALTER INDEX IF EXISTS idx_slitting_outputs_job RENAME TO idx_slitting_actual_outputs_job;
ALTER INDEX IF EXISTS idx_slitting_outputs_item RENAME TO idx_slitting_actual_outputs_item;
ALTER INDEX IF EXISTS idx_slitting_outputs_qr_code RENAME TO idx_slitting_actual_outputs_qr_code;
ALTER INDEX IF EXISTS idx_slitting_outputs_is_loss RENAME TO idx_slitting_actual_outputs_is_loss;

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_slitting_actual_outputs_job_roll ON slitting_actual_outputs(job_roll_id) WHERE job_roll_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_slitting_actual_outputs_planned ON slitting_actual_outputs(planned_output_id) WHERE planned_output_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_slitting_actual_outputs_roll_id ON slitting_actual_outputs(roll_id) WHERE roll_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_slitting_actual_outputs_recorded_by ON slitting_actual_outputs(recorded_by) WHERE recorded_by IS NOT NULL;

-- ============================================================================
-- SECTION 6: ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE slitting_planned_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE slitting_job_rolls ENABLE ROW LEVEL SECURITY;

-- Read access for all authenticated users
CREATE POLICY "slitting_planned_outputs_select_authenticated" ON slitting_planned_outputs
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "slitting_job_rolls_select_authenticated" ON slitting_job_rolls
  FOR SELECT TO authenticated
  USING (true);

-- Write access restricted to service role (API only)
-- No INSERT/UPDATE/DELETE policies for 'authenticated' role
-- All mutations must go through the NestJS API using service_role

-- ============================================================================
-- SECTION 7: ANALYSIS VIEWS
-- ============================================================================

-- Variance Analysis: Compare planned vs actual outputs per job
CREATE OR REPLACE VIEW slitting_variance_analysis AS
SELECT 
  j.id AS job_id,
  j.schedule_id,
  s.scheduled_date,
  po.id AS planned_output_id,
  po.item_id,
  i.display_name AS item_name,
  po.width_mm AS planned_width_mm,
  po.quantity AS planned_quantity,
  COUNT(ao.id) FILTER (WHERE ao.is_loss = false) AS actual_count,
  COALESCE(SUM(ao.quantity) FILTER (WHERE ao.is_loss = false), 0) AS actual_quantity,
  COALESCE(SUM(ao.weight_kg) FILTER (WHERE ao.is_loss = false), 0) AS actual_weight_kg,
  COALESCE(SUM(ao.quantity) FILTER (WHERE ao.is_loss = true), 0) AS loss_quantity,
  COALESCE(SUM(ao.weight_kg) FILTER (WHERE ao.is_loss = true), 0) AS loss_weight_kg,
  COALESCE(SUM(ao.quantity) FILTER (WHERE ao.is_loss = false), 0) - (po.quantity * COALESCE(
    (SELECT COUNT(*) FROM slitting_job_rolls jr WHERE jr.job_id = j.id AND jr.status = 'completed'), 0
  )) AS quantity_variance,
  COALESCE(AVG(ao.width_mm) FILTER (WHERE ao.is_loss = false AND ao.planned_output_id = po.id), 0) AS avg_actual_width_mm,
  po.width_mm - COALESCE(AVG(ao.width_mm) FILTER (WHERE ao.is_loss = false AND ao.planned_output_id = po.id), po.width_mm) AS avg_width_variance_mm
FROM slitting_jobs j
JOIN slitting_schedules s ON s.id = j.schedule_id
JOIN slitting_planned_outputs po ON po.job_id = j.id
JOIN items i ON i.id = po.item_id
LEFT JOIN slitting_actual_outputs ao ON ao.planned_output_id = po.id
GROUP BY j.id, j.schedule_id, s.scheduled_date, po.id, po.item_id, i.display_name, po.width_mm, po.quantity;

-- Loss Analysis: Track loss percentage per job roll
CREATE OR REPLACE VIEW slitting_loss_analysis AS
SELECT 
  j.id AS job_id,
  j.schedule_id,
  sch.scheduled_date,
  jr.id AS job_roll_id,
  jr.sequence_number AS roll_sequence,
  jr.stock_id,
  s.batch_number AS stock_batch_number,
  s.weight_kg AS input_weight_kg,
  COALESCE(SUM(ao.weight_kg) FILTER (WHERE ao.is_loss = false), 0) AS output_weight_kg,
  COALESCE(SUM(ao.weight_kg) FILTER (WHERE ao.is_loss = true), 0) AS loss_weight_kg,
  CASE 
    WHEN s.weight_kg > 0 THEN 
      ROUND((COALESCE(SUM(ao.weight_kg) FILTER (WHERE ao.is_loss = true), 0) / s.weight_kg * 100)::numeric, 2)
    ELSE 0 
  END AS loss_percentage,
  COUNT(ao.id) FILTER (WHERE ao.is_loss = false) AS output_count,
  COUNT(ao.id) FILTER (WHERE ao.is_loss = true) AS loss_count,
  jr.completed_at
FROM slitting_jobs j
JOIN slitting_schedules sch ON sch.id = j.schedule_id
JOIN slitting_job_rolls jr ON jr.job_id = j.id
JOIN stocks s ON s.id = jr.stock_id
LEFT JOIN slitting_actual_outputs ao ON ao.job_roll_id = jr.id
WHERE jr.status IN ('completed', 'in_progress')
GROUP BY j.id, j.schedule_id, sch.scheduled_date, jr.id, jr.sequence_number, jr.stock_id, s.batch_number, s.weight_kg, jr.completed_at;

-- Monthly Loss Summary
CREATE OR REPLACE VIEW slitting_monthly_loss_summary AS
SELECT 
  DATE_TRUNC('month', sch.scheduled_date) AS month,
  COUNT(DISTINCT j.id) AS total_jobs,
  COUNT(DISTINCT jr.id) AS total_rolls,
  COALESCE(SUM(s.weight_kg), 0) AS total_input_weight_kg,
  COALESCE(SUM(ao.weight_kg) FILTER (WHERE ao.is_loss = false), 0) AS total_output_weight_kg,
  COALESCE(SUM(ao.weight_kg) FILTER (WHERE ao.is_loss = true), 0) AS total_loss_weight_kg,
  CASE 
    WHEN SUM(s.weight_kg) > 0 THEN 
      ROUND((SUM(ao.weight_kg) FILTER (WHERE ao.is_loss = true) / SUM(s.weight_kg) * 100)::numeric, 2)
    ELSE 0 
  END AS loss_rate_pct
FROM slitting_jobs j
JOIN slitting_schedules sch ON sch.id = j.schedule_id
JOIN slitting_job_rolls jr ON jr.job_id = j.id AND jr.status = 'completed'
JOIN stocks s ON s.id = jr.stock_id
LEFT JOIN slitting_actual_outputs ao ON ao.job_roll_id = jr.id
GROUP BY DATE_TRUNC('month', sch.scheduled_date)
ORDER BY month DESC;

-- ============================================================================
-- SECTION 8: APPROVE SLITTING JOB V2 FUNCTION
-- Handles multi-roll job approval
-- ============================================================================

CREATE OR REPLACE FUNCTION approve_slitting_job_v2(
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
  v_job_roll RECORD;
  v_output RECORD;
  v_output_stock_id UUID;
  v_movement_id UUID;
  v_batch_number TEXT;
  v_default_location_id UUID;
  v_roll_results JSONB := '[]'::JSONB;
  v_current_roll_result JSONB;
  v_roll_output_results JSONB;
  v_total_input_weight NUMERIC(12,3) := 0;
  v_total_output_weight NUMERIC(12,3) := 0;
  v_total_loss_weight NUMERIC(12,3) := 0;
  v_total_output_qty INTEGER := 0;
  v_total_loss_qty INTEGER := 0;
  v_processed_rolls INTEGER := 0;
BEGIN
  -- ========================================================================
  -- 1. Validate job exists and is in 'completed' status
  -- ========================================================================
  SELECT * INTO v_job
  FROM slitting_jobs
  WHERE id = p_job_id
  FOR UPDATE;

  IF v_job IS NULL THEN
    RAISE EXCEPTION 'Job not found: %', p_job_id;
  END IF;

  IF v_job.status != 'completed' THEN
    RAISE EXCEPTION 'Job is not in completed status. Current status: %', v_job.status;
  END IF;

  -- ========================================================================
  -- 2. Check if this is a V2 job (has job_rolls) or V1 job (has parent_stock_id)
  -- ========================================================================
  IF NOT EXISTS (SELECT 1 FROM slitting_job_rolls WHERE job_id = p_job_id) THEN
    -- This is a V1 job, delegate to original function
    RETURN approve_slitting_job(p_job_id, p_approved_by);
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
  -- 4. Process each job roll
  -- ========================================================================
  FOR v_job_roll IN
    SELECT jr.*, s.weight_kg AS parent_weight_kg
    FROM slitting_job_rolls jr
    JOIN stocks s ON s.id = jr.stock_id
    WHERE jr.job_id = p_job_id AND jr.status = 'completed'
    ORDER BY jr.sequence_number
    FOR UPDATE OF jr
  LOOP
    v_roll_output_results := '[]'::JSONB;
    v_processed_rolls := v_processed_rolls + 1;
    v_total_input_weight := v_total_input_weight + COALESCE(v_job_roll.parent_weight_kg, 0);

    -- Process each actual output for this roll
    FOR v_output IN
      SELECT * FROM slitting_actual_outputs 
      WHERE job_roll_id = v_job_roll.id
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
          v_job_roll.stock_id,
          'production',
          p_job_id,
          'Slitted from job: ' || p_job_id::TEXT || ', roll: ' || v_job_roll.sequence_number
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

        -- Update output record with stock reference
        UPDATE slitting_actual_outputs
        SET qr_code = v_batch_number
        WHERE id = v_output.id;

        -- Add to roll results
        v_roll_output_results := v_roll_output_results || jsonb_build_object(
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

    -- Create stock movement for parent roll consumption (OUT)
    DECLARE
      v_parent_stock RECORD;
      v_roll_output_weight NUMERIC(12,3);
      v_roll_loss_weight NUMERIC(12,3);
    BEGIN
      SELECT * INTO v_parent_stock FROM stocks WHERE id = v_job_roll.stock_id FOR UPDATE;
      
      SELECT 
        COALESCE(SUM(weight_kg) FILTER (WHERE is_loss = false), 0),
        COALESCE(SUM(weight_kg) FILTER (WHERE is_loss = true), 0)
      INTO v_roll_output_weight, v_roll_loss_weight
      FROM slitting_actual_outputs WHERE job_roll_id = v_job_roll.id;

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
        -1,
        -(v_roll_output_weight + v_roll_loss_weight),
        v_parent_stock.quantity,
        GREATEST(v_parent_stock.quantity - 1, 0),
        v_parent_stock.weight_kg,
        GREATEST(COALESCE(v_parent_stock.weight_kg, 0) - (v_roll_output_weight + v_roll_loss_weight), 0),
        'Slitting production',
        'production'::movement_reference_type,
        p_job_id,
        p_approved_by
      );

      -- Update parent stock
      UPDATE stocks
      SET 
        quantity = GREATEST(quantity - 1, 0),
        weight_kg = GREATEST(COALESCE(weight_kg, 0) - (v_roll_output_weight + v_roll_loss_weight), 0),
        status = CASE WHEN quantity - 1 <= 0 THEN 'disposed'::stock_status ELSE status END
      WHERE id = v_parent_stock.id;
    END;

    -- Build roll result
    v_current_roll_result := jsonb_build_object(
      'jobRollId', v_job_roll.id,
      'stockId', v_job_roll.stock_id,
      'sequenceNumber', v_job_roll.sequence_number,
      'parentWeightKg', v_job_roll.parent_weight_kg,
      'outputs', v_roll_output_results
    );
    v_roll_results := v_roll_results || v_current_roll_result;
  END LOOP;

  -- ========================================================================
  -- 5. Update job status to approved
  -- ========================================================================
  UPDATE slitting_jobs
  SET 
    status = 'approved',
    approved_at = NOW(),
    approved_by = p_approved_by
  WHERE id = p_job_id;

  -- ========================================================================
  -- 6. Create history record
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
      'version', 'v2',
      'processedRolls', v_processed_rolls,
      'totalInputWeight', v_total_input_weight,
      'totalOutputQty', v_total_output_qty,
      'totalOutputWeight', v_total_output_weight,
      'totalLossQty', v_total_loss_qty,
      'totalLossWeight', v_total_loss_weight,
      'lossPercentage', CASE WHEN v_total_input_weight > 0 THEN ROUND((v_total_loss_weight / v_total_input_weight * 100)::numeric, 2) ELSE 0 END,
      'rolls', v_roll_results
    )
  );

  -- ========================================================================
  -- 7. Check if all jobs in schedule are approved -> update schedule status
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
  -- 8. Return result
  -- ========================================================================
  RETURN jsonb_build_object(
    'success', true,
    'version', 'v2',
    'jobId', p_job_id,
    'processedRolls', v_processed_rolls,
    'totalInputWeight', v_total_input_weight,
    'totalOutputQty', v_total_output_qty,
    'totalOutputWeight', v_total_output_weight,
    'totalLossQty', v_total_loss_qty,
    'totalLossWeight', v_total_loss_weight,
    'lossPercentage', CASE WHEN v_total_input_weight > 0 THEN ROUND((v_total_loss_weight / v_total_input_weight * 100)::numeric, 2) ELSE 0 END,
    'rolls', v_roll_results
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'approve_slitting_job_v2 failed (sqlstate=%): %', SQLSTATE, SQLERRM;
END;
$$;

-- Grant permissions
REVOKE ALL ON FUNCTION approve_slitting_job_v2(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION approve_slitting_job_v2(UUID, UUID) TO service_role;

-- ============================================================================
-- SECTION 9: MIGRATE EXISTING V1 DATA
-- Convert existing jobs to use the new structure
-- ============================================================================

-- Create job_rolls for existing V1 jobs that have parent_stock_id
INSERT INTO slitting_job_rolls (
  job_id,
  stock_id,
  sequence_number,
  status,
  registered_by,
  registered_at,
  started_at,
  completed_at,
  notes
)
SELECT 
  j.id AS job_id,
  j.parent_stock_id AS stock_id,
  1 AS sequence_number,
  CASE 
    WHEN j.status = 'approved' THEN 'completed'::job_roll_status
    WHEN j.status IN ('completed', 'in_progress') THEN 'completed'::job_roll_status
    WHEN j.status = 'ready' THEN 'registered'::job_roll_status
    ELSE 'registered'::job_roll_status
  END AS status,
  COALESCE(j.operator_id, j.approved_by, s.created_by) AS registered_by,
  j.created_at AS registered_at,
  j.started_at,
  CASE WHEN j.status IN ('completed', 'approved') THEN COALESCE(j.completed_at, j.approved_at) ELSE NULL END AS completed_at,
  'Migrated from V1 job' AS notes
FROM slitting_jobs j
JOIN slitting_schedules s ON s.id = j.schedule_id
WHERE j.parent_stock_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM slitting_job_rolls jr WHERE jr.job_id = j.id
);

-- Update actual outputs to reference job_rolls
UPDATE slitting_actual_outputs ao
SET job_roll_id = jr.id
FROM slitting_job_rolls jr
WHERE jr.job_id = ao.job_id 
  AND jr.sequence_number = 1
  AND ao.job_roll_id IS NULL;

-- Copy item/width info to jobs from parent stocks (for V1 jobs)
UPDATE slitting_jobs j
SET 
  item_id = s.item_id,
  parent_width_mm = s.width_mm
FROM stocks s
WHERE j.parent_stock_id = s.id 
  AND j.parent_stock_id IS NOT NULL
  AND j.item_id IS NULL;

-- ============================================================================
-- SECTION 10: UPDATE VIEWS
-- Update slitting_schedules_with_stats view to include roll counts
-- ============================================================================

CREATE OR REPLACE VIEW slitting_schedules_with_stats AS
SELECT 
  s.id,
  s.schedule_number,
  s.scheduled_date,
  s.status,
  s.created_by,
  s.memo,
  s.created_at,
  s.updated_at,
  -- Creator details
  u.display_name AS created_by_name,
  -- Job statistics
  (SELECT COUNT(*) FROM slitting_jobs WHERE schedule_id = s.id) AS total_jobs,
  (SELECT COUNT(*) FROM slitting_jobs WHERE schedule_id = s.id AND status = 'pending') AS pending_jobs,
  (SELECT COUNT(*) FROM slitting_jobs WHERE schedule_id = s.id AND status = 'ready') AS ready_jobs,
  (SELECT COUNT(*) FROM slitting_jobs WHERE schedule_id = s.id AND status = 'in_progress') AS in_progress_jobs,
  (SELECT COUNT(*) FROM slitting_jobs WHERE schedule_id = s.id AND status = 'completed') AS completed_jobs,
  (SELECT COUNT(*) FROM slitting_jobs WHERE schedule_id = s.id AND status = 'approved') AS approved_jobs,
  -- V2: Roll statistics
  (SELECT COALESCE(SUM(planned_roll_count), 0) FROM slitting_jobs WHERE schedule_id = s.id) AS total_planned_rolls,
  (SELECT COUNT(*) FROM slitting_job_rolls jr JOIN slitting_jobs j ON j.id = jr.job_id WHERE j.schedule_id = s.id) AS total_registered_rolls,
  (SELECT COUNT(*) FROM slitting_job_rolls jr JOIN slitting_jobs j ON j.id = jr.job_id WHERE j.schedule_id = s.id AND jr.status = 'completed') AS total_completed_rolls
FROM slitting_schedules s
LEFT JOIN users u ON s.created_by = u.id;

-- ============================================================================
-- SECTION 11: TABLE COMMENTS
-- ============================================================================

COMMENT ON TABLE slitting_planned_outputs IS 'V2: Planned cutting pattern outputs defined at job creation. Each row represents an expected output width and quantity.';
COMMENT ON TABLE slitting_job_rolls IS 'V2: Parent rolls registered/scanned by workers for each slitting job. Replaces single parent_stock_id.';

COMMENT ON COLUMN slitting_jobs.item_id IS 'V2: Product specification for the job (the type of paper being processed)';
COMMENT ON COLUMN slitting_jobs.parent_width_mm IS 'V2: Expected parent roll width for this job';
COMMENT ON COLUMN slitting_jobs.planned_roll_count IS 'V2: Expected number of parent rolls to process for this job';
COMMENT ON COLUMN slitting_jobs.parent_stock_id IS 'DEPRECATED in V2: Single parent roll reference. Use slitting_job_rolls table for V2 jobs.';

COMMENT ON COLUMN slitting_actual_outputs.job_roll_id IS 'V2: Reference to the specific parent roll this output came from';
COMMENT ON COLUMN slitting_actual_outputs.planned_output_id IS 'V2: Reference to the planned output this actual output corresponds to (for variance tracking)';
COMMENT ON COLUMN slitting_actual_outputs.length_m IS 'V2: Length of the output roll in meters';
COMMENT ON COLUMN slitting_actual_outputs.roll_id IS 'V2: Unique roll identifier for labeling/tracking';
COMMENT ON COLUMN slitting_actual_outputs.recorded_by IS 'V2: User who recorded this output (worker)';
COMMENT ON COLUMN slitting_actual_outputs.recorded_at IS 'V2: When this output was recorded';

COMMENT ON COLUMN slitting_planned_outputs.job_id IS 'Reference to the parent slitting job';
COMMENT ON COLUMN slitting_planned_outputs.item_id IS 'Output product specification';
COMMENT ON COLUMN slitting_planned_outputs.width_mm IS 'Planned output width in millimeters';
COMMENT ON COLUMN slitting_planned_outputs.quantity IS 'Number of outputs at this width per parent roll';
COMMENT ON COLUMN slitting_planned_outputs.sequence_number IS 'Order in cutting pattern (for display and tracking)';

COMMENT ON COLUMN slitting_job_rolls.job_id IS 'Reference to the parent slitting job';
COMMENT ON COLUMN slitting_job_rolls.stock_id IS 'Reference to the parent roll stock being cut';
COMMENT ON COLUMN slitting_job_rolls.sequence_number IS 'Order of this roll within the job (1st, 2nd, etc.)';
COMMENT ON COLUMN slitting_job_rolls.status IS 'Current status: registered, in_progress, completed, cancelled';
COMMENT ON COLUMN slitting_job_rolls.registered_by IS 'Worker who scanned/registered this roll';

COMMENT ON VIEW slitting_variance_analysis IS 'Compares planned vs actual outputs for variance tracking';
COMMENT ON VIEW slitting_loss_analysis IS 'Tracks loss percentage per job roll';
COMMENT ON VIEW slitting_monthly_loss_summary IS 'Monthly summary of production loss rates';

COMMENT ON FUNCTION approve_slitting_job_v2(UUID, UUID) IS 'V2: Approves a completed slitting job, processing all job rolls and creating stock entries';
