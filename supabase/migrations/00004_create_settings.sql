-- ============================================================================
-- CHISAN Platform - Settings Table Migration
-- FOUND-F003: Tenant Configuration
-- ============================================================================

CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(category, key)
);

CREATE INDEX IF NOT EXISTS idx_settings_category ON settings(category);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_settings" ON settings
  FOR SELECT TO authenticated
  USING (true);

-- ============================================================================
-- Seed default settings
-- ============================================================================

INSERT INTO settings (category, key, value, description) VALUES
  ('company', 'name', '"지산페이퍼"', 'Company display name'),
  ('company', 'address', '"경기도 광주시"', 'Company address'),
  ('regional', 'timezone', '"Asia/Seoul"', 'Default timezone'),
  ('regional', 'locale', '"ko-KR"', 'Default locale'),
  ('regional', 'currency', '"KRW"', 'Default currency'),
  ('inventory', 'default_warehouse', 'null', 'Default warehouse for stock-in'),
  ('inventory', 'fifo_enabled', 'true', 'Enforce FIFO for stock-out'),
  ('notifications', 'email_enabled', 'false', 'Email notifications'),
  ('notifications', 'slack_webhook', 'null', 'Slack webhook URL')
ON CONFLICT (category, key) DO NOTHING;
