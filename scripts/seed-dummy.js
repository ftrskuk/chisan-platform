const { Client } = require("pg");

const client = new Client({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://postgres.bnskrqopbzdlinvpickz:!anjfqhk0815!@aws-1-ap-south-1.pooler.supabase.com:5432/postgres",
});

const EXISTING_USER_ID = "82a3e9d9-8589-4b01-970a-62956ad843cc";

async function seed() {
  await client.connect();
  console.log("Connected, inserting dummy data...");

  await client.query(
    `
    INSERT INTO users (id, email, display_name, is_active) VALUES
    ($1, 'davidkukhj@gmail.com', '관리자', true)
    ON CONFLICT (id) DO UPDATE SET display_name = '관리자'
  `,
    [EXISTING_USER_ID],
  );
  console.log("✅ User synced");

  await client.query(
    `
    INSERT INTO user_roles (user_id, role, assigned_by) VALUES
    ($1, 'admin', $1)
    ON CONFLICT (user_id, role) DO NOTHING
  `,
    [EXISTING_USER_ID],
  );
  console.log("✅ User Role assigned");

  await client.query(`
    INSERT INTO warehouses (code, name, is_active) VALUES
    ('WH-TEST-001', '테스트 본사 창고', true),
    ('WH-TEST-002', '테스트 생산 창고', true)
    ON CONFLICT (code) DO NOTHING
  `);
  console.log("✅ Warehouses inserted");

  await client.query(`
    INSERT INTO locations (warehouse_id, code, name, type, is_active)
    SELECT w.id, 'T-01-01', 'T구역 1열 1단', 'rack', true
    FROM warehouses w WHERE w.code = 'WH-TEST-001'
    ON CONFLICT (warehouse_id, code) DO NOTHING
  `);

  await client.query(`
    INSERT INTO locations (warehouse_id, code, name, type, is_active)
    SELECT w.id, 'T-01-02', 'T구역 1열 2단', 'rack', true
    FROM warehouses w WHERE w.code = 'WH-TEST-001'
    ON CONFLICT (warehouse_id, code) DO NOTHING
  `);

  await client.query(`
    INSERT INTO locations (warehouse_id, code, name, type, is_active)
    SELECT w.id, 'TP-01', '테스트 생산 대기구역', 'default', true
    FROM warehouses w WHERE w.code = 'WH-TEST-002'
    ON CONFLICT (warehouse_id, code) DO NOTHING
  `);
  console.log("✅ Locations inserted");

  await client.query(`
    INSERT INTO partners (partner_code, name, partner_type, country_code, is_active) VALUES
    ('TEST-SUP-001', 'Test Supplier A', 'supplier', 'KR', true),
    ('TEST-SUP-002', 'Test Supplier B', 'supplier', 'CN', true)
    ON CONFLICT (partner_code) DO NOTHING
  `);
  console.log("✅ Partners inserted");

  await client.query(`
    INSERT INTO brands (partner_id, code, name, is_active)
    SELECT p.id, 'TEST-BRAND-A', 'Test Brand A', true
    FROM partners p WHERE p.partner_code = 'TEST-SUP-001'
    ON CONFLICT (code) DO NOTHING
  `);

  await client.query(`
    INSERT INTO brands (partner_id, code, name, is_active)
    SELECT p.id, 'TEST-BRAND-B', 'Test Brand B', true
    FROM partners p WHERE p.partner_code = 'TEST-SUP-002'
    ON CONFLICT (code) DO NOTHING
  `);
  console.log("✅ Brands inserted");

  await client.query(`
    INSERT INTO items (display_name, paper_type_id, brand_id, grammage, form, core_diameter_inch)
    SELECT 
      'Test Art Paper 80g Roll',
      (SELECT id FROM paper_types WHERE code = 'ART'),
      (SELECT id FROM brands WHERE code = 'TEST-BRAND-A'),
      80, 'roll', 3.0
    WHERE NOT EXISTS (SELECT 1 FROM items WHERE display_name = 'Test Art Paper 80g Roll')
  `);

  await client.query(`
    INSERT INTO items (display_name, paper_type_id, brand_id, grammage, form, core_diameter_inch)
    SELECT 
      'Test Art Paper 100g Roll',
      (SELECT id FROM paper_types WHERE code = 'ART'),
      (SELECT id FROM brands WHERE code = 'TEST-BRAND-A'),
      100, 'roll', 3.0
    WHERE NOT EXISTS (SELECT 1 FROM items WHERE display_name = 'Test Art Paper 100g Roll')
  `);

  await client.query(`
    INSERT INTO items (display_name, paper_type_id, brand_id, grammage, form, core_diameter_inch)
    SELECT 
      'Test Woodfree 80g Roll',
      (SELECT id FROM paper_types WHERE code = 'WF'),
      (SELECT id FROM brands WHERE code = 'TEST-BRAND-B'),
      80, 'roll', 3.0
    WHERE NOT EXISTS (SELECT 1 FROM items WHERE display_name = 'Test Woodfree 80g Roll')
  `);
  console.log("✅ Items inserted");

  await client.query(`
    INSERT INTO stocks (item_id, location_id, width_mm, condition, quantity, weight_kg, status, is_active, batch_number, received_at)
    SELECT 
      (SELECT id FROM items WHERE display_name = 'Test Art Paper 80g Roll'),
      (SELECT l.id FROM locations l JOIN warehouses w ON l.warehouse_id = w.id WHERE w.code = 'WH-TEST-001' AND l.code = 'T-01-01'),
      1200, 'parent', 5, 2500.000, 'available', true, 'TEST-IMP-001', NOW()
    WHERE NOT EXISTS (SELECT 1 FROM stocks WHERE batch_number = 'TEST-IMP-001')
  `);

  await client.query(`
    INSERT INTO stocks (item_id, location_id, width_mm, condition, quantity, weight_kg, status, is_active, batch_number, received_at)
    SELECT 
      (SELECT id FROM items WHERE display_name = 'Test Art Paper 100g Roll'),
      (SELECT l.id FROM locations l JOIN warehouses w ON l.warehouse_id = w.id WHERE w.code = 'WH-TEST-001' AND l.code = 'T-01-02'),
      1000, 'parent', 3, 1800.000, 'available', true, 'TEST-IMP-002', NOW()
    WHERE NOT EXISTS (SELECT 1 FROM stocks WHERE batch_number = 'TEST-IMP-002')
  `);

  await client.query(`
    INSERT INTO stocks (item_id, location_id, width_mm, condition, quantity, weight_kg, status, is_active, batch_number, received_at)
    SELECT 
      (SELECT id FROM items WHERE display_name = 'Test Woodfree 80g Roll'),
      (SELECT l.id FROM locations l JOIN warehouses w ON l.warehouse_id = w.id WHERE w.code = 'WH-TEST-002' AND l.code = 'TP-01'),
      1500, 'parent', 4, 3200.000, 'available', true, 'TEST-IMP-003', NOW()
    WHERE NOT EXISTS (SELECT 1 FROM stocks WHERE batch_number = 'TEST-IMP-003')
  `);
  console.log("✅ Stocks (parent rolls) inserted");

  const counts = await client.query(`
    SELECT 
      (SELECT COUNT(*) FROM users) as users,
      (SELECT COUNT(*) FROM items) as items,
      (SELECT COUNT(*) FROM stocks WHERE condition = 'parent') as parent_stocks,
      (SELECT COUNT(*) FROM warehouses) as warehouses,
      (SELECT COUNT(*) FROM machines) as machines
  `);
  console.log("\n📊 Summary:", counts.rows[0]);

  await client.end();
  console.log("✅ Done!");
}

seed().catch((e) => {
  console.error("❌ Error:", e.message);
  process.exit(1);
});
