# Stock Inquiry Feature Implementation Guide

## Overview

This document contains everything needed to implement the Stock Inquiry feature (INV-F003/F004/F005) in a new session.

## Current Status

**Completed (17/17 tasks):**

- [x] Created `00012_create_stocks.sql` migration
- [x] Created `00013_create_stock_movements.sql` migration
- [x] Create stock types (`packages/shared/src/types/stock.ts`)
- [x] Create stock schemas (`packages/shared/src/schemas/stock.ts`)
- [x] Export types/schemas from index files
- [x] Create stocks module (`apps/api/src/modules/stocks/stocks.module.ts`)
- [x] Create stocks service with findAll, findOne, mapStock, pagination
- [x] Create stocks controller with GET endpoints and Zod validation
- [x] Create stocks index.ts barrel export
- [x] Register StocksModule in app.module.ts
- [x] Create stock API hooks (`apps/web/src/hooks/api/use-stocks.ts`)
- [x] Export hooks from apps/web/src/hooks/api/index.ts
- [x] Create stock columns definition (`apps/web/src/components/stocks/stock-columns.tsx`)
- [x] Create stock inquiry page (`apps/web/src/app/(dashboard)/inventory/stocks/page.tsx`)
- [x] Add 재고 관리 navigation section to sidebar with 재고 조회 menu item
- [x] Add seed data for development (`supabase/seed.sql`)
- [x] Run `pnpm build` to verify no TypeScript errors

**Remaining:**

- [ ] Run migrations (`pnpm supabase db push`)
- [ ] Run seed data (`pnpm supabase db seed`)
- [ ] Test API endpoints manually
- [ ] Test frontend page in browser

## Design Decisions

| Question                  | Decision                                                        |
| ------------------------- | --------------------------------------------------------------- |
| Stock Summary aggregation | By **item** (not by warehouse)                                  |
| Navigation structure      | Option A: `재고 관리 (Inventory)` → `재고 조회 (Stock Inquiry)` |
| Seed data                 | Yes, create test stock data for development                     |

## Database Schema

### stocks table (migration 00012)

```sql
CREATE TYPE stock_condition AS ENUM ('parent', 'slitted');
CREATE TYPE stock_status AS ENUM ('available', 'reserved', 'quarantine', 'disposed');

CREATE TABLE stocks (
  id UUID PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES items(id),
  location_id UUID NOT NULL REFERENCES locations(id),
  width_mm INTEGER NOT NULL CHECK (width_mm BETWEEN 50 AND 2500),
  condition stock_condition NOT NULL DEFAULT 'parent',
  quantity INTEGER NOT NULL DEFAULT 0,
  weight_kg NUMERIC(12,3),
  status stock_status NOT NULL DEFAULT 'available',
  is_active BOOLEAN DEFAULT true,
  batch_number TEXT,
  lot_number TEXT,
  received_at TIMESTAMPTZ,
  parent_stock_id UUID REFERENCES stocks(id),
  source_type TEXT,
  source_reference_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**Key Point:** `width_mm` is tracked at stock level, not item level.

### stock_movements table (migration 00013)

```sql
CREATE TYPE movement_type AS ENUM ('in', 'out', 'adjustment', 'move', 'quarantine');
CREATE TYPE movement_reference_type AS ENUM ('import', 'production', 'sale', 'adjustment', 'transfer');

CREATE TABLE stock_movements (
  id UUID PRIMARY KEY,
  stock_id UUID NOT NULL REFERENCES stocks(id),
  movement_type movement_type NOT NULL,
  quantity_change INTEGER NOT NULL,
  weight_change_kg NUMERIC(12,3),
  quantity_before INTEGER NOT NULL,
  quantity_after INTEGER NOT NULL,
  weight_before_kg NUMERIC(12,3),
  weight_after_kg NUMERIC(12,3),
  reason TEXT,
  reference_type movement_reference_type,
  reference_id UUID,
  performed_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ
);
```

## Implementation Patterns to Follow

### Types Pattern (follow `packages/shared/src/types/item.ts`)

```typescript
export const STOCK_CONDITIONS = ["parent", "slitted"] as const;
export type StockCondition = (typeof STOCK_CONDITIONS)[number];

export const STOCK_STATUSES = [
  "available",
  "reserved",
  "quarantine",
  "disposed",
] as const;
export type StockStatus = (typeof STOCK_STATUSES)[number];

export interface Stock {
  id: string;
  itemId: string;
  locationId: string;
  widthMm: number;
  condition: StockCondition;
  quantity: number;
  weightKg: number | null;
  status: StockStatus;
  isActive: boolean;
  batchNumber: string | null;
  lotNumber: string | null;
  receivedAt: string | null;
  parentStockId: string | null;
  sourceType: string | null;
  sourceReferenceId: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StockWithRelations extends Stock {
  item: Item;
  location: Location;
  warehouse: Warehouse;
}
```

### Schema Pattern (follow `packages/shared/src/schemas/audit.ts`)

```typescript
export const stockSearchSchema = z.object({
  warehouseId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  itemId: z.string().uuid().optional(),
  widthMm: z.coerce.number().int().optional(),
  widthMin: z.coerce.number().int().optional(),
  widthMax: z.coerce.number().int().optional(),
  condition: z.enum(STOCK_CONDITIONS).optional(),
  status: z.enum(STOCK_STATUSES).optional(),
  isActive: z.coerce.boolean().optional(),
  q: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});
```

### API Controller Pattern (follow `apps/api/src/modules/items/items.controller.ts`)

```typescript
@Controller("stocks")
@UseGuards(JwtAuthGuard, RolesGuard)
export class StocksController {
  @Get()
  findAll(
    @Query(new ZodValidationPipe(stockSearchSchema)) search: StockSearchInput,
  ) {
    return this.stocksService.findAll(search);
  }

  @Get(":id")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.stocksService.findOne(id);
  }
}
```

### API Service Pattern (follow `apps/api/src/core/audit/audit.service.ts` for pagination)

Response format:

```typescript
{
  data: StockWithRelations[],
  total: number,
  limit: number,
  offset: number
}
```

### Frontend Hook Pattern (follow `apps/web/src/hooks/api/use-items.ts`)

```typescript
const STOCKS_KEY = ["stocks"];

export function useStocks(searchParams?: StockSearchInput) {
  return useQuery({
    queryKey: [...STOCKS_KEY, searchParams],
    queryFn: () =>
      api.get<StocksResponse>(
        `/api/v1/stocks${buildQueryString(searchParams)}`,
      ),
  });
}
```

### Frontend Page Pattern (follow `apps/web/src/app/(dashboard)/master/items/page.tsx`)

Key features:

- PageHeader with title "재고 조회"
- DataTable with stockColumns
- Filters: warehouse, item, width range, condition, status
- Search by item code/name

## Seed Data Template

```sql
-- Add to supabase/seed.sql after items are seeded

INSERT INTO stocks (item_id, location_id, width_mm, condition, quantity, weight_kg, status, batch_number, received_at) VALUES
  -- WOODFREE OFFSET [WUXING] 70g parent rolls
  ((SELECT id FROM items WHERE item_code LIKE 'WF-03A-70-R%' LIMIT 1),
   (SELECT id FROM locations WHERE code = 'DEFAULT' LIMIT 1),
   1050, 'parent', 5, 4500.000, 'available', 'BATCH-2024-001', NOW() - INTERVAL '30 days'),

  -- Slitted rolls from parent
  ((SELECT id FROM items WHERE item_code LIKE 'WF-03A-70-R%' LIMIT 1),
   (SELECT id FROM locations WHERE code = 'DEFAULT' LIMIT 1),
   520, 'slitted', 10, 2100.000, 'available', 'BATCH-2024-001', NOW() - INTERVAL '25 days');
```

## File Structure

```
packages/shared/src/
├── types/
│   ├── stock.ts          # NEW: Stock types and enums
│   └── index.ts          # ADD: export * from "./stock"
├── schemas/
│   ├── stock.ts          # NEW: Zod schemas
│   └── index.ts          # ADD: export * from "./stock"

apps/api/src/modules/
├── stocks/
│   ├── stocks.module.ts   # NEW
│   ├── stocks.controller.ts # NEW
│   ├── stocks.service.ts  # NEW
│   └── index.ts           # NEW

apps/web/src/
├── hooks/api/
│   ├── use-stocks.ts      # NEW
│   └── index.ts           # ADD: export
├── components/stocks/
│   └── stock-columns.tsx  # NEW
├── app/(dashboard)/inventory/
│   └── stocks/
│       └── page.tsx       # NEW
```

## Commands to Run

```bash
# 1. Apply migrations
cd /home/david/projects/chisan-platform
pnpm supabase db push

# 2. Verify tables created
pnpm supabase db dump --schema public | grep -E "stocks|stock_movements"

# 3. After implementation, build to verify
pnpm build

# 4. Run dev to test
pnpm dev
```

## Reference Files

| Pattern    | Reference File                                          |
| ---------- | ------------------------------------------------------- |
| Types      | `packages/shared/src/types/item.ts`, `warehouse.ts`     |
| Schemas    | `packages/shared/src/schemas/audit.ts`, `item.ts`       |
| Controller | `apps/api/src/modules/items/items.controller.ts`        |
| Service    | `apps/api/src/core/audit/audit.service.ts` (pagination) |
| Hooks      | `apps/web/src/hooks/api/use-items.ts`                   |
| Columns    | `apps/web/src/components/items/item-columns.tsx`        |
| Page       | `apps/web/src/app/(dashboard)/master/items/page.tsx`    |
| Sidebar    | `apps/web/src/components/layout/sidebar.tsx`            |

## Session Continuation Prompt

Copy this to start the new session:

```
Continue implementing the Stock Inquiry feature for CHISAN Platform.

Context:
- Read docs/05-development/stock-inquiry-implementation.md for full context
- Migrations 00012 and 00013 are already created (stocks and stock_movements tables)
- Need to implement: types, schemas, API module, frontend hooks/components/page

Design decisions:
- Stock summary: aggregate by item
- Navigation: 재고 관리 → 재고 조회
- Include seed data for development

Start with task: Create stock types in packages/shared/src/types/stock.ts
```
