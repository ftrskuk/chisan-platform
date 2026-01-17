# Stock In/Out Workflow Redesign Plan

> **Created**: 2026-01-17
> **Status**: Planning Required

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

## 3. Questions to Answer Before Design

### Business Questions

| #   | Question                                 | Answer |
| --- | ---------------------------------------- | ------ |
| 1   | Does stock-in need approval too?         |        |
| 2   | What happens when rejected?              |        |
| 3   | Is emergency/immediate stock-out needed? |        |
| 4   | Can partial quantity be processed?       |        |
| 5   | Can requester approve their own order?   |        |
| 6   | Can approval skip field processing step? |        |
| 7   | Different workflow per reason type?      |        |

### Role Questions

| #   | Question                     | Answer |
| --- | ---------------------------- | ------ |
| 1   | Who can create orders?       |        |
| 2   | Who can do field processing? |        |
| 3   | Who can approve?             |        |
| 4   | Do we need new roles?        |        |

### Technical Questions

| #   | Question                              | Answer |
| --- | ------------------------------------- | ------ |
| 1   | Keep existing stocks/stock_movements? |        |
| 2   | Need notification system?             |        |
| 3   | Need mobile support for field?        |        |

---

## 4. Next Steps

1. Answer questions in Section 3
2. Design workflow based on answers
3. Design data model
4. Design API
5. Implement

---

## Changelog

| Date       | Change        | Author       |
| ---------- | ------------- | ------------ |
| 2026-01-17 | Initial draft | AI Assistant |
