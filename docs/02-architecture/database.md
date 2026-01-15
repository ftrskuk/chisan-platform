# Database Design

CHISAN Platform uses PostgreSQL provided by Supabase as its core storage and prioritizes data integrity and security in its design.

## 1. Supabase PostgreSQL Configuration

- **Extensions**: Activate and use necessary extension functions such as `pg_stat_statements`, `pgcrypto`, `uuid-ossp`.
- **Realtime**: Enable Realtime features for specific tables (e.g., `inventory_status`) to support real-time updates.

## 2. Schema Design Principles

1.  **Use UUID**: All Primary Keys use `uuid` type and use `gen_random_uuid()` as default value.
2.  **Foreign Key Constraints**: All relationships are connected by physical Foreign Keys to guarantee data integrity.
3.  **Normalization**: Aim for 3rd Normal Form (3NF) or higher to minimize duplicate data, but allow denormalization limitedly when query performance is critical.
4.  **Timestamps**: All tables include `created_at`, `updated_at`, `deleted_at` (for Soft Delete) fields.

## 3. Row Level Security (RLS) Patterns

Perform access control at the database level to strengthen security.

- **Public Access**: Unauthenticated users cannot read or write any data.
- **Authenticated Access**: Authenticated users can only query/modify data suitable for their Role.
- **Service Role**: Backend server (NestJS) uses `service_role` key to bypass RLS and perform complex system logic.

### Example RLS Policy

```sql
-- Restrict users to view only their organization's inventory
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view inventory of their organization"
ON inventory FOR SELECT
USING (auth.uid() IN (
  SELECT user_id FROM organization_members WHERE org_id = inventory.org_id
));
```

## 4. Migration Strategy

- **Supabase CLI**: Create and test migration files in local development environment, then deploy to staging and production environments.
- **Prisma (Optional)**: If using Prisma as ORM in backend, schema changes can be managed through `prisma migrate` command.

## 5. Naming Conventions

- **Tables**: Snake Case, Plural (e.g., `parent_rolls`, `stock_items`).
- **Columns**: Snake Case (e.g., `item_code`, `warehouse_id`).
- **Indexes**: `idx_{table_name}_{column_name}`.
- **Foreign Keys**: `fk_{table_name}_{column_name}`.

## 6. Common Patterns

### 6.1 Soft Delete

Do not physically delete data but record a timestamp in `deleted_at` column to process logical deletion.

### 6.2 Audit Logs

Use a separate `audit_logs` table or database Trigger to track change history of important tables.

```sql
CREATE TRIGGER tr_audit_inventory
AFTER UPDATE ON inventory
FOR EACH ROW EXECUTE FUNCTION log_inventory_changes();
```

## 7. Example Inventory Module Schema

Example schema for 'Parent Roll' management, the core domain of CHISAN Paper.

```sql
CREATE TABLE parent_rolls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roll_number TEXT UNIQUE NOT NULL, -- Barcode Number
  item_code TEXT NOT NULL,
  grammage INTEGER NOT NULL,       -- Grammage (g/m²)
  width INTEGER NOT NULL,          -- Width (mm)
  diameter INTEGER,                -- Diameter (mm)
  initial_weight DECIMAL NOT NULL, -- Weight at stock-in (kg)
  current_weight DECIMAL NOT NULL, -- Current remaining weight (kg)
  warehouse_id UUID REFERENCES warehouses(id),
  supplier_id UUID REFERENCES partners(id),
  status TEXT DEFAULT 'available', -- available, in_use, consumed, damaged
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);
```

## 8. Relationships & Hierarchy

Method for handling 'Parent-Child' relationships, which is the core of CHISAN Paper domain.

- **Parent-Child Tracking**: Results created through slitting processing from Parent Roll reference the original source through `parent_id`. This enables Traceability when quality issues occur.
- **Recursive Queries**: Efficiently query the history of products that have gone through multiple stages of processing using PostgreSQL's `WITH RECURSIVE` queries.

### History Tracking Table (Slitting Logs)

```sql
CREATE TABLE slitting_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_roll_id UUID REFERENCES parent_rolls(id),
  operator_id UUID,
  machine_id TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  yield_percentage DECIMAL, -- Yield
  notes TEXT
);
```

## 9. Performance Optimization

- **Indexing Strategy**:
  - Apply B-Tree indexes to frequent search conditions like `roll_number`, `item_code`.
  - Consider Partial Index for low cardinality columns like `status`.
- **JSONB Usage**: Use `JSONB` type for variable configuration values or external system integration logs to ensure flexibility, but add GIN indexes if necessary.
- **Materialized Views**: Use Materialized Views for complex monthly statistics or dashboard data to maximize query performance and refresh periodically.

## 10. Backup & Recovery

- **Point-in-Time Recovery (PITR)**: Enable Supabase's PITR feature to establish a system capable of precise recovery to specific points in time.
- **Automated Backups**: Perform full database backups at set times every day and archive them in a separate secure storage (Cloudflare R2, etc.).

## 11. Data Security & Compliance

- **Encryption at Rest**: All data is encrypted with AES-256 when stored on disk.
- **Encryption in Transit**: All communication between client and database is encrypted via SSL/TLS 1.3.
- **Sensitive Data**: Columns containing personal information or critical business information are stored through separate encryption logic or access rights are strictly restricted.
