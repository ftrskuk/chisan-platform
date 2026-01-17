# Stock In/Out Workflow Redesign Plan

> **Created**: 2026-01-17
> **Updated**: 2026-01-18
> **Status**: Planning Complete - Ready for Implementation

## 1. Current State (AS-IS)

### Current Flow

```
Stock-In:  User → Click → Immediate inventory increase
Stock-Out: User → Click → Immediate inventory decrease
```

### Implemented Components

| Component        | Location                                                  |
| ---------------- | --------------------------------------------------------- |
| Stock-In API     | `apps/api/src/modules/stocks/stocks.service.ts`           |
| Stock-Out API    | Same file                                                 |
| Stock-In RPC     | `supabase/migrations/00014_create_bulk_stock_in_rpc.sql`  |
| Stock-Out RPC    | `supabase/migrations/00015_create_bulk_stock_out_rpc.sql` |
| Stock Table      | `stocks`                                                  |
| Movement History | `stock_movements`                                         |

### Current Tables

- `stocks` - Current inventory state
- `stock_movements` - Movement history (in/out/adjustment/move)

---

## 2. Desired Change (TO-BE)

### Business Owner's Request

```
1. Office team creates an order
2. Field team processes and registers completion
3. Office team reviews and approves
4. System applies inventory change
```

---

## 3. Business Requirements (Answered)

### 3.1 Organization & Roles

| Role   | Responsibility                           | Count |
| ------ | ---------------------------------------- | ----- |
| 부장   | Admin, Final Approver, Slitting Schedule | 1     |
| 대리   | Import Manager (Purchase/Stock-In)       | 1     |
| 주임   | Stock-In/Out Manager (Sales/Stock-Out)   | 1     |
| 물류팀 | Field Stock-In/Out Operations            | 2     |
| 슬리터 | Slitting Machine Operators               | 5     |
| 포장   | Slitting Product Packaging               | 2     |

### 3.2 Order Creation

| Item              | Answer                                                         |
| ----------------- | -------------------------------------------------------------- |
| Who creates?      | Office staff only (not field workers)                          |
| How received?     | Phone, Fax, Messenger from sales team                          |
| Stock-In reasons  | Container import, Domestic purchase, (rare) Warehouse transfer |
| Stock-Out reasons | Customer sales, Sample, Slitting, Loss                         |
| Order info        | Item, Qty, Partner, Scheduled date, Memo                       |

### 3.3 Field Processing

| Item             | Answer                                           |
| ---------------- | ------------------------------------------------ |
| Stock-In tasks   | Arrival check → Inspection → Storage             |
| Stock-Out tasks  | Pickup → Packaging/Loading → Qty confirmation    |
| Recording method | Mobile/Tablet direct input (optimized web app)   |
| Partial qty      | Yes - process available qty only (e.g., 9 of 10) |
| Damaged stock    | Mark separately (was: red text in Excel)         |

### 3.4 Approval

| Item             | Answer                                                |
| ---------------- | ----------------------------------------------------- |
| Who approves?    | Final: 부장 (Manager), Any office staff can approve   |
| Approval timing  | Pre-approval OR Post-processing approval              |
| What to check    | Qty, Correct product (trust field after pre-approval) |
| Self-approval    | Yes, allowed                                          |
| Rejection reason | Incorrect order entry                                 |

### 3.5 Stock Update

| Item              | Answer                                 |
| ----------------- | -------------------------------------- |
| When applied?     | On approval completion (auto)          |
| Current reality   | Batch update after 5PM or next morning |
| Urgent stock-out  | Frequently needed - skip approval      |
| Urgent permission | All office staff                       |

### 3.6 Stock-In Flow

```
Schedule/Packing List → Field Work (Inspect/Store) → Approval → Stock Increase
```

### 3.7 Notification

| Item    | Answer                                             |
| ------- | -------------------------------------------------- |
| Needed? | Yes - order created → field, field done → approver |
| Method  | Web app notification (PWA push if possible)        |

---

## 4. Slitting (Production) Requirements

### 4.1 Current Process

```
Manager creates schedule (Excel) → Print → Distribute to field
→ Logistics prepares rolls at machines
→ Operators work & record on paper
→ Submit paper to office after work
→ Manager updates inventory ledger
```

### 4.2 Target Process

```
Manager creates schedule (System) → Notify field
→ Logistics prepares rolls (mark as 'ready')
→ Operators input work results (Mobile/Tablet)
→ Print labels for finished products
→ Approval → Stock update (atomic: parent roll - , finished + , loss)
```

### 4.3 Recording Info

- Parent roll used (which roll, weight)
- Finished products (qty, spec, weight per roll)
- Loss amount
- Special notes

### 4.4 Key Feature: Real-time Status

- Office can see which rolls are currently being worked on
- Machine status visibility

---

## 5. Label & QR System

### 5.1 Requirements

| Item           | Answer                                    |
| -------------- | ----------------------------------------- |
| Printer        | To be purchased (Thermal / RFID printer)  |
| Phase 1        | QR Code (scan one by one - OK)            |
| Future         | RFID (coordinate-based location tracking) |
| Label info     | Roll ID, Item name, GSM, Width, Weight    |
| Existing stock | Label during warehouse move (H2 2026)     |

### 5.2 Label Application Points

- Slitting completion (finished product label)
- Stock-In (parent roll label)
- Warehouse move (full inventory labeling)

---

## 6. Import Management (Reference)

### 6.1 Current State

- Managed in Google Sheets
- Reference: `docs/references/선적스케쥴 - 데이터베이스(선적) (4).csv`

### 6.2 Key Fields

- LC info: LC NO., Issue date, Due date, Payment amount
- Order: ORDER NO. (CS-YYMMDD), Manufacture/Sales flag
- Product: Mill, Product name, GSM, Qty, MT, Price, Amount
- Shipping: B/L, Vessel, Container NO., ETD, ETA
- Customs: Clearance date, Payment date, Exchange rate
- Documents: PO, Contract, Shipping docs, Customs docs (Google Drive links)

---

## 7. Implementation Plan

### Phase 1: Approval Workflow (입출고 워크플로우)

#### 7.1.1 Data Model

**New Tables:**

```sql
-- orders (주문/오더)
orders (
  id UUID PRIMARY KEY,
  order_number VARCHAR, -- SO-YYYYMMDD-NNN / SI-YYYYMMDD-NNN
  type VARCHAR, -- 'stock_in' | 'stock_out'
  status VARCHAR, -- 'pending' | 'field_processing' | 'awaiting_approval' | 'approved' | 'rejected' | 'cancelled'
  is_urgent BOOLEAN DEFAULT FALSE,
  reason VARCHAR, -- 'sales' | 'sample' | 'slitting' | 'loss' | 'container' | 'domestic_purchase' | 'warehouse_transfer'
  partner_id UUID REFERENCES partners,
  scheduled_date DATE,
  memo TEXT,
  requested_by UUID REFERENCES users,
  approved_by UUID REFERENCES users,
  created_at, updated_at
)

-- order_items (주문 품목)
order_items (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders,
  item_id UUID REFERENCES items,
  stock_id UUID REFERENCES stocks, -- specific stock if designated
  requested_qty INTEGER,
  processed_qty INTEGER, -- for partial processing
  created_at
)

-- order_history (주문 이력)
order_history (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders,
  action VARCHAR, -- 'created' | 'field_started' | 'field_completed' | 'approved' | 'rejected'
  actor_id UUID REFERENCES users,
  memo TEXT,
  created_at
)
```

**Modify Existing:**

```sql
-- stocks: add columns
ALTER TABLE stocks ADD COLUMN status VARCHAR DEFAULT 'available'; -- 'available' | 'reserved' | 'in_transit' | 'damaged'
ALTER TABLE stocks ADD COLUMN qr_code VARCHAR;

-- stock_movements: add column
ALTER TABLE stock_movements ADD COLUMN order_id UUID REFERENCES orders;
```

#### 7.1.2 Workflow States

```
[Normal Stock-Out]
pending → field_processing → awaiting_approval → approved → (stock decrease)
                ↓                    ↓
          (field done)         (approve/reject)

[Urgent Stock-Out]
pending → approved → (immediate stock decrease)

[Stock-In]
pending → field_processing → awaiting_approval → approved → (stock increase)
            (inspect/store)
```

#### 7.1.3 API Endpoints

```
POST   /api/v1/orders              # Create order
GET    /api/v1/orders              # List orders (filter: status, type, date)
GET    /api/v1/orders/:id          # Order detail
PATCH  /api/v1/orders/:id          # Update order
DELETE /api/v1/orders/:id          # Cancel order

POST   /api/v1/orders/:id/process  # Field processing complete (input processed_qty)
POST   /api/v1/orders/:id/approve  # Approve
POST   /api/v1/orders/:id/reject   # Reject
POST   /api/v1/orders/:id/urgent   # Urgent processing (skip approval)
```

#### 7.1.4 UI Screens

| Screen           | User           | Description                 |
| ---------------- | -------------- | --------------------------- |
| Order List       | Office         | All orders, filter/search   |
| Order Create     | Office         | Create stock-in/out order   |
| Field Queue      | Field (Mobile) | My work list                |
| Field Process    | Field (Mobile) | Complete work, confirm qty  |
| Approval Queue   | Office         | Approve/Reject processing   |
| Real-time Status | Office         | Currently processing orders |

#### 7.1.5 Implementation Order

1. DB Migration (orders, order_items, order_history)
2. Backend API (NestJS orders module)
3. Frontend - Office (Order CRUD, Approval)
4. Frontend - Field Mobile (Work list, Process complete)
5. Notification System (Web Push)

---

### Phase 2: Production (슬리터 워크플로우)

#### 7.2.1 Data Model

```sql
-- slitting_schedules (슬리팅 스케쥴)
slitting_schedules (
  id UUID PRIMARY KEY,
  schedule_number VARCHAR,
  scheduled_date DATE,
  created_by UUID REFERENCES users,
  status VARCHAR, -- 'draft' | 'published' | 'in_progress' | 'completed'
  created_at, updated_at
)

-- slitting_jobs (슬리팅 작업)
slitting_jobs (
  id UUID PRIMARY KEY,
  schedule_id UUID REFERENCES slitting_schedules,
  machine_id UUID REFERENCES machines,
  parent_stock_id UUID REFERENCES stocks, -- parent roll
  operator_id UUID REFERENCES users,
  status VARCHAR, -- 'pending' | 'ready' | 'in_progress' | 'completed' | 'approved'
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at
)

-- slitting_outputs (슬리팅 산출물)
slitting_outputs (
  id UUID PRIMARY KEY,
  job_id UUID REFERENCES slitting_jobs,
  item_id UUID REFERENCES items, -- finished product item
  quantity INTEGER,
  weight DECIMAL,
  qr_code VARCHAR,
  is_loss BOOLEAN DEFAULT FALSE,
  created_at
)

-- machines (기계)
machines (
  id UUID PRIMARY KEY,
  name VARCHAR, -- '1호기' ~ '5호기'
  status VARCHAR, -- 'idle' | 'running' | 'maintenance'
  created_at
)
```

#### 7.2.2 Workflow

```
[Schedule Create] Manager → Create schedule, assign jobs per machine
       ↓
[Prepare] Logistics → Place parent rolls (status: ready)
       ↓
[Work] Operator → Start/Complete work input
       ↓           (finished product info, loss input)
       ↓           (print labels)
       ↓
[Approve] Manager → Review work, approve
       ↓
[Stock Update] Parent roll decrease + Finished product increase + Loss (atomic)
```

---

### Phase 3: Import Management (수입 관리)

#### 7.3.1 Data Model

```sql
-- purchase_orders (발주)
purchase_orders (
  id UUID PRIMARY KEY,
  po_number VARCHAR, -- CS-YYMMDD.
  supplier_id UUID REFERENCES partners,
  order_date DATE,
  lc_number VARCHAR,
  lc_issue_date DATE,
  lc_due_date DATE,
  status VARCHAR, -- 'ordered' | 'shipped' | 'arrived' | 'customs' | 'completed'
  created_at, updated_at
)

-- shipments (선적)
shipments (
  id UUID PRIMARY KEY,
  po_id UUID REFERENCES purchase_orders,
  bl_number VARCHAR,
  vessel VARCHAR,
  container_numbers TEXT[], -- array
  container_count INTEGER,
  etd DATE,
  eta DATE,
  actual_arrival_date DATE,
  created_at
)

-- shipment_items (선적 품목)
shipment_items (
  id UUID PRIMARY KEY,
  shipment_id UUID REFERENCES shipments,
  item_id UUID REFERENCES items,
  quantity INTEGER,
  mt DECIMAL,
  unit_price DECIMAL,
  amount DECIMAL,
  created_at
)

-- customs_clearances (통관)
customs_clearances (
  id UUID PRIMARY KEY,
  shipment_id UUID REFERENCES shipments,
  clearance_date DATE,
  payment_date DATE,
  declaration_number VARCHAR,
  exchange_rate DECIMAL,
  customs_amount DECIMAL,
  created_at
)

-- documents (문서)
documents (
  id UUID PRIMARY KEY,
  entity_type VARCHAR, -- 'purchase_order' | 'shipment'
  entity_id UUID,
  doc_type VARCHAR, -- 'po' | 'contract' | 'shipping_docs' | 'customs_docs'
  url VARCHAR, -- Google Drive link
  created_at
)
```

#### 7.3.2 Migration

- Google Sheets → DB migration script
- Maintain existing CS number system

---

### Phase 4: Label & QR System

#### 7.4.1 Features

| Feature        | Description                                  |
| -------------- | -------------------------------------------- |
| QR Generation  | Encode Roll ID + Item info                   |
| Label Template | Roll ID, Item name, GSM, Width, Weight       |
| Printer API    | Thermal printer (ZPL or ESC/POS)             |
| Scan Function  | Mobile camera QR scan → Stock lookup/process |

#### 7.4.2 Label Application Points

- Slitting completion (finished product label)
- Stock-In (parent roll label)
- Warehouse move (full inventory labeling)

---

## 8. Timeline Estimate

| Phase | Content               | Duration  |
| ----- | --------------------- | --------- |
| 1     | Approval Workflow     | 3-4 weeks |
| 2     | Production (Slitting) | 2-3 weeks |
| 3     | Import Management     | 2 weeks   |
| 4     | Label & QR            | 1-2 weeks |

---

## 9. Key Milestones

- **H2 2026**: Warehouse move - Full inventory labeling
- **Future**: RFID + Coordinate-based location tracking

---

## Changelog

| Date       | Change                              | Author       |
| ---------- | ----------------------------------- | ------------ |
| 2026-01-17 | Initial draft                       | AI Assistant |
| 2026-01-18 | Complete planning with requirements | AI Assistant |
