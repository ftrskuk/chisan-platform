-- ============================================================================
-- CHISAN Platform - Development Seed Data
-- For development and testing only - DO NOT use in production
-- ============================================================================

-- ============================================================================
-- Warehouses (locations auto-created via trigger)
-- ============================================================================

INSERT INTO warehouses (code, name, address, city, is_default, notes) VALUES
  ('WH-MAIN', '본사 창고', '경기도 광주시 오포읍', '광주시', true, '본사 메인 창고'),
  ('WH-EXT', '외부 임대 창고', '경기도 이천시', '이천시', false, '외부 임대 창고')
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- Partners (Suppliers)
-- ============================================================================

INSERT INTO partners (partner_code, name, name_local, partner_type, country_code, supplier_currency, lead_time_days, notes) VALUES
  ('SUP-001', 'Asia Pulp & Paper', 'APP', 'supplier', 'ID', 'USD', 45, 'Indonesia - APP and APRIL brands'),
  ('SUP-002', 'Bohui Paper', '博汇纸业', 'supplier', 'CN', 'USD', 30, 'China'),
  ('SUP-003', 'Wuxing Paper', '五星纸业', 'supplier', 'CN', 'USD', 30, 'China'),
  ('SUP-004', 'Nippon Paper Industries', '日本製紙', 'supplier', 'JP', 'USD', 60, 'Japan - NPI'),
  ('SUP-005', 'Hokuetsu Kishu', '北越キシュ', 'supplier', 'JP', 'USD', 60, 'Japan - H-K')
ON CONFLICT (partner_code) DO NOTHING;

-- ============================================================================
-- Partners (Customers)
-- ============================================================================

INSERT INTO partners (partner_code, name, partner_type, country_code, customer_currency, credit_limit) VALUES
  ('CUS-001', '삼성인쇄', 'customer', 'KR', 'KRW', 50000000),
  ('CUS-002', '대한포장', 'customer', 'KR', 'KRW', 30000000),
  ('CUS-003', '신세계프린팅', 'customer', 'KR', 'KRW', 80000000)
ON CONFLICT (partner_code) DO NOTHING;

-- ============================================================================
-- Brands (linked to suppliers)
-- ============================================================================

INSERT INTO brands (partner_id, code, name, description, internal_code) VALUES
  ((SELECT id FROM partners WHERE partner_code = 'SUP-001'), 'APP', 'Asia Pulp & Paper', 'APP brand from Indonesia', '01A'),
  ((SELECT id FROM partners WHERE partner_code = 'SUP-001'), 'APRIL', 'APRIL', 'APRIL brand from Indonesia', '01B'),
  ((SELECT id FROM partners WHERE partner_code = 'SUP-002'), 'BOHUI', 'Bohui', 'Bohui brand from China', '02A'),
  ((SELECT id FROM partners WHERE partner_code = 'SUP-003'), 'WUXING', 'Wuxing', 'Wuxing brand from China', '03A'),
  ((SELECT id FROM partners WHERE partner_code = 'SUP-003'), 'ROXCEL', 'Roxcel', 'Roxcel brand from Wuxing', '03B'),
  ((SELECT id FROM partners WHERE partner_code = 'SUP-004'), 'NPI', 'Nippon Paper', 'Nippon Paper Industries', '04A'),
  ((SELECT id FROM partners WHERE partner_code = 'SUP-005'), 'H-K', 'Hokuetsu Kishu', 'Hokuetsu Kishu brand', '05A')
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- Items (item_code auto-generated via trigger if not provided)
-- ============================================================================

INSERT INTO items (display_name, paper_type_id, brand_id, grammage, form, core_diameter_inch) VALUES
  ('Woodfree Offset [WUXING] 70g Roll',
   (SELECT id FROM paper_types WHERE code = 'WF'),
   (SELECT id FROM brands WHERE code = 'WUXING'),
   70, 'roll', 3.0),

  ('Woodfree Offset [WUXING] 80g Roll',
   (SELECT id FROM paper_types WHERE code = 'WF'),
   (SELECT id FROM brands WHERE code = 'WUXING'),
   80, 'roll', 3.0),

  ('Offset IK Bluish White [APP] 70g Roll',
   (SELECT id FROM paper_types WHERE code = 'OFF'),
   (SELECT id FROM brands WHERE code = 'APP'),
   70, 'roll', 3.0),

  ('Offset IK Bluish White [APP] 80g Roll',
   (SELECT id FROM paper_types WHERE code = 'OFF'),
   (SELECT id FROM brands WHERE code = 'APP'),
   80, 'roll', 3.0),

  ('Natural White [APRIL] 90g Roll',
   (SELECT id FROM paper_types WHERE code = 'NW'),
   (SELECT id FROM brands WHERE code = 'APRIL'),
   90, 'roll', 3.0),

  ('Natural White [APRIL] 100g Roll',
   (SELECT id FROM paper_types WHERE code = 'NW'),
   (SELECT id FROM brands WHERE code = 'APRIL'),
   100, 'roll', 3.0),

  ('Form Bond [NPI] 80g Roll',
   (SELECT id FROM paper_types WHERE code = 'FB'),
   (SELECT id FROM brands WHERE code = 'NPI'),
   80, 'roll', 3.0),

  ('Photocopy Paper [BOHUI] 75g Roll',
   (SELECT id FROM paper_types WHERE code = 'CP'),
   (SELECT id FROM brands WHERE code = 'BOHUI'),
   75, 'roll', 3.0),

  ('Art Paper [H-K] 128g Roll',
   (SELECT id FROM paper_types WHERE code = 'ART'),
   (SELECT id FROM brands WHERE code = 'H-K'),
   128, 'roll', 3.0),

  ('Kraft [ROXCEL] 120g Roll',
   (SELECT id FROM paper_types WHERE code = 'KR'),
   (SELECT id FROM brands WHERE code = 'ROXCEL'),
   120, 'roll', 3.0)
ON CONFLICT (item_code) DO NOTHING;

-- ============================================================================
-- Stocks (sample inventory data)
-- ============================================================================

INSERT INTO stocks (
  item_id,
  location_id,
  width_mm,
  condition,
  quantity,
  weight_kg,
  status,
  batch_number,
  received_at
) VALUES
  ((SELECT id FROM items WHERE display_name LIKE 'Woodfree Offset [WUXING] 70g%' LIMIT 1),
   (SELECT id FROM locations WHERE code = 'DEFAULT' LIMIT 1),
   1050, 'parent', 5, 4500.000, 'available', 'BATCH-2024-001', NOW() - INTERVAL '30 days'),

  ((SELECT id FROM items WHERE display_name LIKE 'Woodfree Offset [WUXING] 70g%' LIMIT 1),
   (SELECT id FROM locations WHERE code = 'DEFAULT' LIMIT 1),
   520, 'slitted', 10, 2100.000, 'available', 'BATCH-2024-001', NOW() - INTERVAL '25 days'),

  ((SELECT id FROM items WHERE display_name LIKE 'Woodfree Offset [WUXING] 80g%' LIMIT 1),
   (SELECT id FROM locations WHERE code = 'DEFAULT' LIMIT 1),
   1020, 'parent', 8, 7200.000, 'available', 'BATCH-2024-002', NOW() - INTERVAL '20 days'),

  ((SELECT id FROM items WHERE display_name LIKE 'Offset IK Bluish White [APP] 70g%' LIMIT 1),
   (SELECT id FROM locations WHERE code = 'DEFAULT' LIMIT 1),
   1000, 'parent', 12, 10800.000, 'available', 'BATCH-2024-003', NOW() - INTERVAL '15 days'),

  ((SELECT id FROM items WHERE display_name LIKE 'Offset IK Bluish White [APP] 70g%' LIMIT 1),
   (SELECT id FROM locations WHERE code = 'DEFAULT' LIMIT 1),
   480, 'slitted', 20, 4200.000, 'available', 'BATCH-2024-003', NOW() - INTERVAL '12 days'),

  ((SELECT id FROM items WHERE display_name LIKE 'Natural White [APRIL] 90g%' LIMIT 1),
   (SELECT id FROM locations WHERE code = 'DEFAULT' LIMIT 1),
   1100, 'parent', 6, 5940.000, 'available', 'BATCH-2024-004', NOW() - INTERVAL '10 days'),

  ((SELECT id FROM items WHERE display_name LIKE 'Natural White [APRIL] 90g%' LIMIT 1),
   (SELECT id FROM locations WHERE code = 'DEFAULT' LIMIT 1),
   550, 'slitted', 8, 3960.000, 'reserved', 'BATCH-2024-004', NOW() - INTERVAL '8 days'),

  ((SELECT id FROM items WHERE display_name LIKE 'Art Paper [H-K] 128g%' LIMIT 1),
   (SELECT id FROM locations WHERE code = 'DEFAULT' LIMIT 1),
   900, 'parent', 4, 4608.000, 'available', 'BATCH-2024-005', NOW() - INTERVAL '5 days'),

  ((SELECT id FROM items WHERE display_name LIKE 'Art Paper [H-K] 128g%' LIMIT 1),
   (SELECT id FROM locations WHERE code = 'DEFAULT' LIMIT 1),
   450, 'slitted', 6, 3456.000, 'quarantine', 'BATCH-2024-005', NOW() - INTERVAL '3 days'),

  ((SELECT id FROM items WHERE display_name LIKE 'Kraft [ROXCEL] 120g%' LIMIT 1),
   (SELECT id FROM locations WHERE code = 'DEFAULT' LIMIT 1),
   1200, 'parent', 10, 14400.000, 'available', 'BATCH-2024-006', NOW() - INTERVAL '2 days')
ON CONFLICT DO NOTHING;
