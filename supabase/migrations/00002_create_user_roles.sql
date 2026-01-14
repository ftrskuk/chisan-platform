-- ============================================================================
-- CHISAN Platform - User Roles Table Migration
-- FOUND-F002: User Management
-- ============================================================================

-- Role enum type
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'manager', 'worker');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- User roles table (supports multiple roles per user if needed later)
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, role)
);

-- Indexes for role lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Users can view their own roles
CREATE POLICY "users_view_own_roles" ON user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Admins can view all roles
CREATE POLICY "admins_view_all_roles" ON user_roles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- No direct client writes - all modifications through API
-- INSERT/UPDATE/DELETE policies intentionally omitted

-- ============================================================================
-- Helper function to check if user is admin
-- ============================================================================

CREATE OR REPLACE FUNCTION is_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = check_user_id AND role = 'admin'
  );
$$;

-- ============================================================================
-- Helper function to get user roles
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_roles(check_user_id UUID DEFAULT auth.uid())
RETURNS user_role[]
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    array_agg(role ORDER BY role),
    ARRAY[]::user_role[]
  )
  FROM user_roles
  WHERE user_id = check_user_id;
$$;

-- ============================================================================
-- Update users RLS to allow admin access
-- ============================================================================

-- Drop old policy if exists and create updated one
DROP POLICY IF EXISTS "users_read_all_authenticated" ON users;

-- Admins can read all users
CREATE POLICY "admins_read_all_users" ON users
  FOR SELECT TO authenticated
  USING (
    id = auth.uid() OR is_admin()
  );

-- Managers can read all users (for display purposes)
CREATE POLICY "managers_read_all_users" ON users
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'manager')
    )
  );
