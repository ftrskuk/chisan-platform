-- ============================================================================
-- CHISAN Platform - Paper Types Lookup Table Migration
-- INV-F002: Item Master Management
-- ============================================================================

CREATE TABLE IF NOT EXISTS paper_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  code TEXT UNIQUE NOT NULL,           -- 'WF', 'CP', 'OFF'
  name_en TEXT NOT NULL,               -- 'Woodfree Offset'
  name_ko TEXT,                        -- '백상지'
  description TEXT,

  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_paper_types_code ON paper_types(code);
CREATE INDEX IF NOT EXISTS idx_paper_types_sort ON paper_types(sort_order);

-- ============================================================================
-- RLS
-- ============================================================================

ALTER TABLE paper_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "paper_types_select_authenticated" ON paper_types
  FOR SELECT TO authenticated
  USING (true);

-- ============================================================================
-- Seed Data: Standard paper types
-- ============================================================================

INSERT INTO paper_types (code, name_en, name_ko, sort_order) VALUES
  ('WF', 'Woodfree Offset', '백상지', 1),
  ('CP', 'Photocopy Paper', '복사용지', 2),
  ('OFF', 'Offset', '옵셋지', 3),
  ('ART', 'Art Paper', '아트지', 4),
  ('FB', 'Form Bond', '폼본드', 5),
  ('NW', 'Natural White', '내추럴화이트', 6),
  ('KR', 'Kraft', '크라프트지', 7),
  ('MG', 'MG Paper', 'MG지', 8),
  ('BK', 'Book Paper', '서적용지', 9),
  ('NCR', 'NCR Paper', 'NCR지', 10),
  ('FBB', 'Folding Box Board', 'FBB', 11),
  ('OTH', 'Other', '기타', 99)
ON CONFLICT (code) DO NOTHING;
