# Stock In/Out Workflow Redesign Plan

> **Purpose**: Upgrade from simple stock-in/out to approval-based workflow
> **Created**: 2026-01-17
> **Status**: Planning Required

## 1. Current System Analysis

### 1.1 Current Flow (AS-IS)

```
Current Stock-In:
  User → [Stock-In Button] → Immediate inventory increase

Current Stock-Out:
  User → [Stock-Out Button] → Immediate inventory decrease
```

**Problems:**

- No approval process
- No separation between field work and system entry
- No order/request concept
- Hard to track who requested and who processed

### 1.2 Currently Implemented

| Item             | File Location                                             | Description                |
| ---------------- | --------------------------------------------------------- | -------------------------- |
| Stock-In API     | `apps/api/src/modules/stocks/stocks.service.ts`           | stockIn(), bulkStockIn()   |
| Stock-Out API    | Same                                                      | stockOut(), bulkStockOut() |
| Stock-In RPC     | `supabase/migrations/00014_create_bulk_stock_in_rpc.sql`  | Concurrency safe           |
| Stock-Out RPC    | `supabase/migrations/00015_create_bulk_stock_out_rpc.sql` | Concurrency safe           |
| Stock Table      | stocks                                                    | Current inventory state    |
| Movement History | stock_movements                                           | In/out records             |

### 1.3 Current Data Model

```
stocks (inventory)
├── id, item_id, location_id
├── quantity, weight_kg, width_mm
├── condition (parent/slitted)
├── status (available/reserved/quarantine/disposed)
├── batch_number (SI-YYYYMMDD-NNN)
└── other metadata

stock_movements (movement history)
├── stock_id, movement_type (in/out/adjustment/move)
├── quantity_change, weight_change_kg
├── quantity_before/after, weight_before/after
├── reason, reference_type, reference_id
└── performed_by, created_at
```

---

## 2. Desired System (TO-BE)

### 2.1 Requested Flow from Business Owner

```
1. Office Team: Create order (stock-out request)
      ↓
2. Field Team: Complete actual stock-out work, mark as "processed"
      ↓
3. Office Team: Review and "approve"
      ↓
4. System: Deduct inventory
```

### 2.2 Detailed Workflow (Expected)

```
[Stock-Out Process]

┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Create Order│ ──▶ │Field Process│ ──▶ │  Approval   │ ──▶ │Apply to Inv │
│  (Office)   │     │  (Field)    │     │  (Office)   │     │  (System)   │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
     │                    │                    │                    │
     ▼                    ▼                    ▼                    ▼
  Status: draft       Status: processing  Status: pending     Status: completed
  Inventory: no change Inventory: no change Inventory: no change Inventory: deducted


[Stock-In Process - Needs Discussion]

External (Import):  PO → Shipment → Arrival → Inspection → Approval → Inventory
Internal (Production): Work Order → Slitting → Inspection → Approval → Inventory
```

---

## 3. Decisions Required

### 3.1 Business Questions

| #   | Question                      | Options                                               | Answer |
| --- | ----------------------------- | ----------------------------------------------------- | ------ |
| 1   | Does stock-in need approval?  | A) Yes / B) No / C) Case by case                      |        |
| 2   | When order rejected?          | A) Cancel order / B) Revise and resubmit / C) Both    |        |
| 3   | Emergency stock-out?          | A) Always need approval / B) Admin can do immediately |        |
| 4   | Partial fulfillment?          | A) Can ship 7 of 10 ordered / B) Full quantity only   |        |
| 5   | Can requester = approver?     | A) Yes / B) Must be different person                  |        |
| 6   | Skip field processing?        | A) Allowed / B) Must go through field                 |        |
| 7   | Different workflow by reason? | A) Same for all / B) Different per reason type        |        |

### 3.2 Role Definition

| Role         | Current | Add? | Permissions                 |
| ------------ | ------- | ---- | --------------------------- |
| admin        | ✅      | -    | All permissions             |
| manager      | ✅      | -    | Stock processing, approval? |
| viewer       | ✅      | -    | View only                   |
| field_worker | ❌      | ?    | Field processing only       |
| approver     | ❌      | ?    | Approval only               |

### 3.3 Technical Decisions

| #   | Question                              | Options                                              |
| --- | ------------------------------------- | ---------------------------------------------------- |
| 1   | Keep existing stocks/stock_movements? | A) Keep and add orders / B) Full redesign            |
| 2   | Order table structure                 | A) Single table / B) orders + order_items            |
| 3   | State management                      | A) Simple status column / B) State machine + history |
| 4   | Notification system                   | A) None / B) Email / C) In-app / D) Slack            |

---

## 4. Proposed Data Model (Draft)

```sql
-- Stock-out orders
stock_out_orders (
  id UUID PRIMARY KEY,
  order_number VARCHAR(20),        -- SO-YYYYMMDD-NNN
  status order_status,             -- draft, submitted, processing, pending_approval, approved, rejected, cancelled

  -- Request info
  reason_type stock_out_reason,    -- sale, production, adjustment, disposal, transfer
  reason TEXT,
  requested_by UUID,               -- Requester
  requested_at TIMESTAMPTZ,

  -- Field processing info
  processed_by UUID,               -- Field processor
  processed_at TIMESTAMPTZ,
  processing_notes TEXT,

  -- Approval info
  approved_by UUID,                -- Approver
  approved_at TIMESTAMPTZ,
  approval_notes TEXT,

  -- Meta
  created_at, updated_at
)

-- Stock-out order items
stock_out_order_items (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES stock_out_orders,
  stock_id UUID REFERENCES stocks,

  -- Requested quantity
  requested_quantity INTEGER,
  requested_weight_kg DECIMAL,

  -- Actual processed quantity (entered by field)
  actual_quantity INTEGER,
  actual_weight_kg DECIMAL,

  notes TEXT
)

-- Order status history
stock_out_order_history (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES stock_out_orders,
  from_status order_status,
  to_status order_status,
  changed_by UUID,
  changed_at TIMESTAMPTZ,
  notes TEXT
)
```

---

## 5. Expected UI Screens

### 5.1 Order List (Office Team)

```
┌─────────────────────────────────────────────────────────────────┐
│ Stock-Out Orders                                  [+ New Order] │
├─────────────────────────────────────────────────────────────────┤
│ [All] [Pending] [Processing] [Awaiting Approval] [Done] [Rejected]│
├─────────────────────────────────────────────────────────────────┤
│ Order #     │ Reason │ Items │ Requester│ Status    │ Date     │
│ SO-0117-001 │ Sale   │ 3     │ Kim      │ Pending   │ 01-17    │
│ SO-0117-002 │ Prod   │ 1     │ Lee      │ Processing│ 01-17    │
│ SO-0116-005 │ Sale   │ 2     │ Kim      │ Completed │ 01-16    │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Field Processing Screen (Field Team)

```
┌─────────────────────────────────────────────────────────────────┐
│ Process Order - SO-0117-001                                     │
├─────────────────────────────────────────────────────────────────┤
│ Request Info                                                    │
│ ├─ Requester: Kim (Office)                                      │
│ ├─ Reason: Sale                                                 │
│ └─ Requested: 2026-01-17 10:30                                  │
├─────────────────────────────────────────────────────────────────┤
│ Items to Process                                                │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ Item          │ Requested│ Actual   │ Location│ Status  │   │
│ │ Art Paper 100g│ 5        │ [5    ]  │ A-01-01 │ ✓ Done  │   │
│ │ Ivory 80g     │ 3        │ [3    ]  │ B-02-03 │ ✓ Done  │   │
│ │ Bond 120g     │ 2        │ [    ]   │ A-03-02 │ ○ Pending│   │
│ └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│ Notes: [____________________________]                           │
│                                                                 │
│                              [Submit as Processed]              │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 Approval Screen (Office Team)

```
┌─────────────────────────────────────────────────────────────────┐
│ Approval Request - SO-0117-001                                  │
├─────────────────────────────────────────────────────────────────┤
│ Request Info                    │ Processing Info               │
│ ├─ Requester: Kim              │ ├─ Processor: Park            │
│ ├─ Reason: Sale                │ ├─ Processed: 01-17 14:20     │
│ └─ Requested: 01-17 10:30      │ └─ Notes: Completed normally  │
├─────────────────────────────────────────────────────────────────┤
│ Item Comparison                                                 │
│ │ Item          │ Requested│ Actual│ Diff │                    │
│ │ Art Paper 100g│ 5        │ 5     │ -    │                    │
│ │ Ivory 80g     │ 3        │ 3     │ -    │                    │
│ │ Bond 120g     │ 2        │ 2     │ -    │                    │
├─────────────────────────────────────────────────────────────────┤
│ Approval Notes: [____________________________]                  │
│                                                                 │
│                    [Reject]                    [Approve]        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Migration Strategy

### 6.1 Existing Data Handling

If stocks and stock_movements have existing data:

- **Option A**: Keep existing data, apply new system to new records only
- **Option B**: Convert existing data to "approved" orders

### 6.2 Phased Implementation

```
Phase 1: Foundation
├── Design and create orders tables
├── Define order state machine
└── Basic CRUD API

Phase 2: Stock-Out Workflow
├── Order creation (Office)
├── Field processing (Field)
├── Approval/Rejection (Office)
└── Inventory update (System)

Phase 3: Stock-In Workflow (if needed)
├── Determine stock-in order structure
└── Stock-in approval process

Phase 4: Enhancement
├── Notification system
├── Dashboard/Reports
└── Mobile support (for field)
```

---

## 7. Next Session TODO

1. **Get answers to business questions** (Section 3.1)
2. **Finalize role definitions** (Section 3.2)
3. **Finalize data model**
4. **Design state machine**
5. **Design API**
6. **Start implementation**

---

## 8. Reference: Real Business Scenarios

### Scenario 1: Regular Sales Stock-Out

```
1. Sales team receives customer order
2. Office: Create stock-out order (customer, items, quantity)
3. Field: Check order → Pick items from warehouse → Enter actual qty → Mark processed
4. Office: Compare requested vs actual → Approve if OK
5. System: Deduct inventory, generate shipping document
6. Field: Load items → Ship
```

### Scenario 2: Production Input Stock-Out

```
1. Production team: Issue slitting work order
2. Office: Create parent roll stock-out order
3. Field: Pick parent roll, move to slitting machine → Mark processed
4. Office: Approve
5. System: Deduct parent roll inventory
6. (Later) Slitting complete → Finished goods stock-in process
```

### Scenario 3: Emergency Stock-Out (Needs Discussion)

```
When urgent stock-out is needed, what to do?
- Option A: Still need approval (approve quickly)
- Option B: Admin can do immediately (post-approval)
- Option C: Separate emergency process
```

---

## Changelog

| Date       | Change        | Author       |
| ---------- | ------------- | ------------ |
| 2026-01-17 | Initial draft | AI Assistant |
