-- ============================================================================
-- CHISAN Platform - Slitting/Production Workflow Migration
-- Phase 2: Slitting Production Management
-- ============================================================================
-- Business Flow:
-- 1. Manager creates slitting schedule with jobs assigned to machines
-- 2. Logistics prepares parent rolls at machines (mark as 'ready')
-- 3. Operators start work and complete with output results
-- 4. Manager reviews and approves
-- 5. System applies stock changes atomically (parent - , finished + , loss)
-- ============================================================================

-- ============================================================================
-- ENUM: Machine Status
-- ============================================================================

CREATE TYPE machine_status AS ENUM (
  'idle',         -- Machine is idle, no active job
  'running',      -- Machine is currently running a job
  'maintenance'   -- Machine is under maintenance
);

-- ============================================================================
-- ENUM: Schedule Status
-- ============================================================================

CREATE TYPE schedule_status AS ENUM (
  'draft',        -- Schedule created, can be edited
  'published',    -- Schedule published, jobs can be started
  'in_progress',  -- At least one job is in progress
  'completed'     -- All jobs completed and approved
);

-- ============================================================================
-- ENUM: Job Status
-- ============================================================================

CREATE TYPE job_status AS ENUM (
  'pending',      -- Job created, waiting for preparation
  'ready',        -- Parent roll placed, ready to start
  'in_progress',  -- Operator working on the job
  'completed',    -- Job completed, awaiting approval
  'approved'      -- Job approved, stock changes applied
);

-- ============================================================================
-- ENUM: Slitting History Entity Type
-- ============================================================================

CREATE TYPE slitting_entity_type AS ENUM (
  'schedule',
  'job'
);

-- ============================================================================
-- ENUM: Slitting History Action
-- ============================================================================

CREATE TYPE slitting_history_action AS ENUM (
  'created',
  'updated',
  'published',
  'ready',
  'started',
  'completed',
  'approved',
  'cancelled'
);

-- ============================================================================
-- Table: machines (기계)
-- ============================================================================

CREATE TABLE IF NOT EXISTS machines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Machine identification
  name VARCHAR(50) NOT NULL UNIQUE,  -- '1호기', '2호기', etc.
  
  -- Status
  status machine_status NOT NULL DEFAULT 'idle',
  
  -- Optional metadata
  description TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- Trigger: updated_at for machines
-- ============================================================================

DROP TRIGGER IF EXISTS machines_updated_at ON machines;
CREATE TRIGGER machines_updated_at
  BEFORE UPDATE ON machines
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Seed: 5 slitting machines
-- ============================================================================

INSERT INTO machines (name, description) VALUES
  ('1호기', '슬리팅 1호기'),
  ('2호기', '슬리팅 2호기'),
  ('3호기', '슬리팅 3호기'),
  ('4호기', '슬리팅 4호기'),
  ('5호기', '슬리팅 5호기')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- Table: slitting_schedules (슬리팅 스케줄)
-- ============================================================================

CREATE TABLE IF NOT EXISTS slitting_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Schedule identification
  schedule_number VARCHAR(30) NOT NULL UNIQUE,  -- SS-YYYYMMDD-NNN
  
  -- Scheduling
  scheduled_date DATE NOT NULL,
  
  -- Status
  status schedule_status NOT NULL DEFAULT 'draft',
  
  -- Creator
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  
  -- Optional notes
  memo TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- Trigger: updated_at for slitting_schedules
-- ============================================================================

DROP TRIGGER IF EXISTS slitting_schedules_updated_at ON slitting_schedules;
CREATE TRIGGER slitting_schedules_updated_at
  BEFORE UPDATE ON slitting_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Table: slitting_jobs (슬리팅 작업)
-- ============================================================================

CREATE TABLE IF NOT EXISTS slitting_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Parent schedule
  schedule_id UUID NOT NULL REFERENCES slitting_schedules(id) ON DELETE CASCADE,
  
  -- Machine assignment
  machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE RESTRICT,
  
  -- Parent stock (input roll)
  parent_stock_id UUID NOT NULL REFERENCES stocks(id) ON DELETE RESTRICT,
  
  -- Operator assignment (optional until job starts)
  operator_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Job sequence within schedule (for ordering)
  sequence_number INTEGER NOT NULL DEFAULT 1,
  
  -- Status
  status job_status NOT NULL DEFAULT 'pending',
  
  -- Work timestamps
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Notes
  memo TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT slitting_jobs_schedule_sequence_unique UNIQUE (schedule_id, sequence_number)
);

-- ============================================================================
-- Trigger: updated_at for slitting_jobs
-- ============================================================================

DROP TRIGGER IF EXISTS slitting_jobs_updated_at ON slitting_jobs;
CREATE TRIGGER slitting_jobs_updated_at
  BEFORE UPDATE ON slitting_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Table: slitting_outputs (슬리팅 산출물)
-- ============================================================================

CREATE TABLE IF NOT EXISTS slitting_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Parent job
  job_id UUID NOT NULL REFERENCES slitting_jobs(id) ON DELETE CASCADE,
  
  -- Output item specification
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE RESTRICT,
  
  -- Output dimensions and quantity
  width_mm INTEGER NOT NULL CHECK (width_mm BETWEEN 50 AND 2500),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  weight_kg NUMERIC(12,3) CHECK (weight_kg > 0),
  
  -- QR code for labeling (generated on creation)
  qr_code VARCHAR(100),
  
  -- Loss flag
  is_loss BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Notes
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- Table: slitting_history (슬리팅 이력)
-- Immutable audit trail for schedule and job state changes
-- ============================================================================

CREATE TABLE IF NOT EXISTS slitting_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Entity reference (schedule or job)
  entity_type slitting_entity_type NOT NULL,
  entity_id UUID NOT NULL,
  
  -- Action performed
  action slitting_history_action NOT NULL,
  
  -- Who performed the action
  actor_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  
  -- Status transition
  previous_status VARCHAR(30),
  new_status VARCHAR(30),
  
  -- Additional context (JSON for flexibility)
  changes JSONB,
  
  -- Notes
  memo TEXT,
  
  -- Timestamp (immutable)
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- Indexes for machines
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_machines_status ON machines(status);
CREATE INDEX IF NOT EXISTS idx_machines_name ON machines(name);

-- ============================================================================
-- Indexes for slitting_schedules
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_slitting_schedules_schedule_number ON slitting_schedules(schedule_number);
CREATE INDEX IF NOT EXISTS idx_slitting_schedules_scheduled_date ON slitting_schedules(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_slitting_schedules_status ON slitting_schedules(status);
CREATE INDEX IF NOT EXISTS idx_slitting_schedules_created_by ON slitting_schedules(created_by);
CREATE INDEX IF NOT EXISTS idx_slitting_schedules_created_at ON slitting_schedules(created_at);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_slitting_schedules_status_date ON slitting_schedules(status, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_slitting_schedules_date_status ON slitting_schedules(scheduled_date, status);

-- Partial indexes for active schedules
CREATE INDEX IF NOT EXISTS idx_slitting_schedules_active ON slitting_schedules(status) 
  WHERE status IN ('draft', 'published', 'in_progress');

-- ============================================================================
-- Indexes for slitting_jobs
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_slitting_jobs_schedule ON slitting_jobs(schedule_id);
CREATE INDEX IF NOT EXISTS idx_slitting_jobs_machine ON slitting_jobs(machine_id);
CREATE INDEX IF NOT EXISTS idx_slitting_jobs_parent_stock ON slitting_jobs(parent_stock_id);
CREATE INDEX IF NOT EXISTS idx_slitting_jobs_operator ON slitting_jobs(operator_id) WHERE operator_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_slitting_jobs_status ON slitting_jobs(status);
CREATE INDEX IF NOT EXISTS idx_slitting_jobs_started_at ON slitting_jobs(started_at) WHERE started_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_slitting_jobs_completed_at ON slitting_jobs(completed_at) WHERE completed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_slitting_jobs_approved_by ON slitting_jobs(approved_by) WHERE approved_by IS NOT NULL;

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_slitting_jobs_machine_status ON slitting_jobs(machine_id, status);
CREATE INDEX IF NOT EXISTS idx_slitting_jobs_schedule_status ON slitting_jobs(schedule_id, status);
CREATE INDEX IF NOT EXISTS idx_slitting_jobs_status_machine ON slitting_jobs(status, machine_id);

-- Partial indexes for active jobs
CREATE INDEX IF NOT EXISTS idx_slitting_jobs_pending ON slitting_jobs(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_slitting_jobs_ready ON slitting_jobs(status) WHERE status = 'ready';
CREATE INDEX IF NOT EXISTS idx_slitting_jobs_in_progress ON slitting_jobs(status) WHERE status = 'in_progress';
CREATE INDEX IF NOT EXISTS idx_slitting_jobs_awaiting_approval ON slitting_jobs(status) WHERE status = 'completed';

-- ============================================================================
-- Indexes for slitting_outputs
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_slitting_outputs_job ON slitting_outputs(job_id);
CREATE INDEX IF NOT EXISTS idx_slitting_outputs_item ON slitting_outputs(item_id);
CREATE INDEX IF NOT EXISTS idx_slitting_outputs_qr_code ON slitting_outputs(qr_code) WHERE qr_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_slitting_outputs_is_loss ON slitting_outputs(is_loss) WHERE is_loss = true;

-- ============================================================================
-- Indexes for slitting_history
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_slitting_history_entity ON slitting_history(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_slitting_history_action ON slitting_history(action);
CREATE INDEX IF NOT EXISTS idx_slitting_history_actor ON slitting_history(actor_id);
CREATE INDEX IF NOT EXISTS idx_slitting_history_created_at ON slitting_history(created_at);

-- ============================================================================
-- RLS (Row Level Security)
-- ============================================================================

ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE slitting_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE slitting_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE slitting_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE slitting_history ENABLE ROW LEVEL SECURITY;

-- Read access for all authenticated users
CREATE POLICY "machines_select_authenticated" ON machines
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "slitting_schedules_select_authenticated" ON slitting_schedules
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "slitting_jobs_select_authenticated" ON slitting_jobs
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "slitting_outputs_select_authenticated" ON slitting_outputs
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "slitting_history_select_authenticated" ON slitting_history
  FOR SELECT TO authenticated
  USING (true);

-- Write access restricted to service role (API only)
-- No INSERT/UPDATE/DELETE policies for 'authenticated' role
-- All mutations must go through the NestJS API using service_role

-- ============================================================================
-- Function: Generate schedule number
-- Pattern: SS-YYYYMMDD-NNN (Slitting Schedule)
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_schedule_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_prefix TEXT := 'SS';
  v_date TEXT;
  v_sequence INTEGER;
  v_schedule_number TEXT;
BEGIN
  -- Get today's date in YYYYMMDD format
  v_date := to_char(CURRENT_DATE, 'YYYYMMDD');

  -- Acquire advisory lock to prevent race conditions
  PERFORM pg_advisory_xact_lock(hashtext(v_prefix || v_date));

  -- Get the next sequence number for today
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(schedule_number FROM '\d{3}$') AS INTEGER)
  ), 0) + 1
  INTO v_sequence
  FROM slitting_schedules
  WHERE schedule_number LIKE v_prefix || '-' || v_date || '-%';

  -- Format: SS-YYYYMMDD-NNN
  v_schedule_number := v_prefix || '-' || v_date || '-' || LPAD(v_sequence::TEXT, 3, '0');

  RETURN v_schedule_number;
END;
$$;

-- ============================================================================
-- Function: Approve slitting job with atomic stock changes
-- Called when manager approves a completed job
-- Performs: Parent stock decrease + Output stocks create + Loss record
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
        p_job_id::TEXT,
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
        p_job_id::TEXT,
        p_approved_by
      )
      RETURNING id INTO v_movement_id;

      -- Update output record with stock reference (using qr_code field for now)
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
    p_job_id::TEXT,
    p_approved_by
  );

  -- Update parent stock
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

-- ============================================================================
-- Security: Lock down RPC functions
-- ============================================================================

REVOKE ALL ON FUNCTION approve_slitting_job(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION approve_slitting_job(UUID, UUID) TO service_role;

-- ============================================================================
-- Views: slitting_schedules_with_stats
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
  (SELECT COUNT(*) FROM slitting_jobs WHERE schedule_id = s.id AND status = 'approved') AS approved_jobs
FROM slitting_schedules s
LEFT JOIN users u ON s.created_by = u.id;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE machines IS 'Slitting machines (1호기 ~ 5호기)';
COMMENT ON TABLE slitting_schedules IS 'Daily slitting production schedules';
COMMENT ON TABLE slitting_jobs IS 'Individual slitting jobs within a schedule';
COMMENT ON TABLE slitting_outputs IS 'Output products from slitting jobs (finished goods + loss)';
COMMENT ON TABLE slitting_history IS 'Immutable audit trail for schedule and job status changes';

COMMENT ON COLUMN machines.status IS 'Current machine status: idle, running, or maintenance';
COMMENT ON COLUMN slitting_schedules.schedule_number IS 'Auto-generated: SS-YYYYMMDD-NNN';
COMMENT ON COLUMN slitting_jobs.parent_stock_id IS 'Reference to the parent roll being slitted';
COMMENT ON COLUMN slitting_jobs.sequence_number IS 'Order of job within the schedule (for prioritization)';
COMMENT ON COLUMN slitting_outputs.is_loss IS 'If true, this output represents loss/waste from the job';
COMMENT ON COLUMN slitting_outputs.qr_code IS 'QR code for labeling, populated with batch_number on approval';
COMMENT ON COLUMN slitting_history.entity_type IS 'Type of entity: schedule or job';
COMMENT ON COLUMN slitting_history.changes IS 'JSON snapshot of changes made during this action';
