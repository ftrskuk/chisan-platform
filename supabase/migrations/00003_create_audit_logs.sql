-- ============================================================================
-- CHISAN Platform - Audit Logs Table Migration
-- FOUND-F004: Audit Logging
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  actor_id UUID NOT NULL,
  actor_email TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  
  action TEXT NOT NULL,
  category TEXT NOT NULL,
  
  target_table TEXT,
  target_id UUID,
  
  changes JSONB,
  metadata JSONB,
  
  ip_address INET,
  user_agent TEXT,
  request_id UUID,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON audit_logs(target_table, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_category ON audit_logs(category);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_read_audit" ON audit_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
