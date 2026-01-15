# Data Access Boundaries

This document defines data access patterns and security boundaries in the CHISAN Platform.
It provides clear rules on when and how to use Supabase (direct access) and NestJS API.

## 1. Core Principles

### 1.1 Read/Write Separation Principles

| Operation Type | Access Method                                | Rationale                                                  |
| -------------- | -------------------------------------------- | ---------------------------------------------------------- |
| **READ**       | Supabase Direct Access Allowed (RLS Applied) | Performance optimization, utilization of realtime features |
| **WRITE**      | Must go through NestJS API                   | Audit logs, business rules, transaction integrity          |

> **Principle**: All write operations (INSERT, UPDATE, DELETE) MUST go through the NestJS API.
> Direct writing through Client SDK is prohibited.

### 1.2 Why API is Mandatory for Write Operations

1. **Audit Trail**: Record history for all critical changes
2. **Business Rule Validation**: Unify domain logic such as state transitions, quantity validation
3. **Transaction Safety**: Guarantee atomicity of multi-table updates
4. **Debugging Ease**: Issue tracking via API logs

---

## 2. Access Pattern Decision Tree

```
┌─────────────────────────────────────────────────────────────────┐
│                    Data Access Decision Tree                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Is it a READ operation?                                         │
│  ├─ YES → Is real-time update needed?                            │
│  │        ├─ YES → Supabase Client SDK (Realtime + RLS)          │
│  │        └─ NO  → Is SSR suitable? (Initial loading, SEO)       │
│  │                 ├─ YES → Supabase SSR (Server Component)      │
│  │                 └─ NO  → Supabase Client SDK (RLS)            │
│  │                                                               │
│  └─ NO (WRITE operation) → NestJS API Mandatory                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Data Access Matrix by Table

### 3.1 Foundation Tables

| Table        |  Client Read  | Client Write | Backend Read | Backend Write | Realtime | Note                                  |
| ------------ | :-----------: | :----------: | :----------: | :-----------: | :------: | ------------------------------------- |
| `users`      | O (Self only) |      X       |      O       |       O       |    X     | Profile view limited to self via RLS  |
| `user_roles` | O (Self only) |      X       |      O       |       O       |    X     | Role assignment is Admin API only     |
| `settings`   |       O       |      X       |      O       |       O       |    X     | Singleton, only admin can modify      |
| `audit_logs` |       X       |      X       |      O       |   O (Auto)    |    X     | System only, client access prohibited |

### 3.2 Inventory Tables

| Table             | Client Read | Client Write | Backend Read | Backend Write | Realtime | Note                       |
| ----------------- | :---------: | :----------: | :----------: | :-----------: | :------: | -------------------------- |
| `warehouses`      |      O      |      X       |      O       |       O       |    X     | Master Data                |
| `locations`       |      O      |      X       |      O       |       O       |    X     | Master Data                |
| `items`           |      O      |      X       |      O       |       O       |    X     | Master Data                |
| `stocks`          |      O      |      X       |      O       |       O       |    O     | Real-time Inventory Status |
| `stock_movements` |      O      |      X       |      O       |       O       |    X     | Append-only History        |

### 3.3 Import Tables

| Table                | Client Read | Client Write | Backend Read | Backend Write | Realtime | Note                          |
| -------------------- | :---------: | :----------: | :----------: | :-----------: | :------: | ----------------------------- |
| `partners`           |      O      |      X       |      O       |       O       |    X     | Master Data                   |
| `import_orders`      |      O      |      X       |      O       |       O       |    X     | State transition via API only |
| `import_order_items` |      O      |      X       |      O       |       O       |    X     | Order Item Details            |
| `shipments`          |      O      |      X       |      O       |       O       |    O     | ETD/ETA Real-time Tracking    |
| `import_costs`       |      O      |      X       |      O       |       O       |    X     | Financial Data                |

### 3.4 Production Tables

| Table                | Client Read | Client Write | Backend Read | Backend Write | Realtime | Note                 |
| -------------------- | :---------: | :----------: | :----------: | :-----------: | :------: | -------------------- |
| `production_orders`  |      O      |      X       |      O       |       O       |    O     | Field Visibility     |
| `slitting_jobs`      |      O      |      X       |      O       |       O       |    O     | Job Monitoring       |
| `production_inputs`  |      O      |      X       |      O       |       O       |    X     | Raw Material History |
| `production_outputs` |      O      |      X       |      O       |       O       |    X     | Product History      |
| `machines`           |      O      |      X       |      O       |       O       |    X     | Master Data          |

**Legend:**

- O = Allowed under RLS
- X = Blocked (No policy or explicit denial)
- O (Auto) = Recorded only by system triggers

---

## 4. Role Definitions

### 4.1 Phase 1 Role Structure

In Phase 1, we maintain a simple 3-level role structure.

| Role        | Code      | Description                           | Key Permissions                                          |
| ----------- | --------- | ------------------------------------- | -------------------------------------------------------- |
| **Admin**   | `admin`   | Entire system management              | Access all features, manage users/roles, view audit logs |
| **Manager** | `manager` | Departmental operation responsibility | Modify master data, view reports, approve work           |
| **Worker**  | `worker`  | Field work                            | Process stock-in/out, record production, query inventory |

### 4.2 Role Expansion Principles

> Role subdivision (Warehouse Manager, Production Manager, etc.) is introduced when permission conflicts occur in actual operation.
> Excessive role separation in the early stages increases development complexity and permission management costs.

---

## 5. Audit Log Policy

### 5.1 Audit Target Classification

| Category                  | Audit Required | Examples                                                |
| ------------------------- | :------------: | ------------------------------------------------------- |
| **Inventory Qty Change**  |       O        | Stock-in, stock-out, adjustment, movement               |
| **Financial Data Change** |       O        | Import costs, unit price, settlement info               |
| **State Transition**      |       O        | Order status, shipment status, production status change |
| **Master Data Modify**    |    Optional    | Item name, warehouse description, etc. non-core fields  |
| **Read Operation**        |       X        | Pure read operations                                    |

### 5.2 Audit Log Schema

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Actor Info
  actor_id UUID NOT NULL,           -- Performer user_id
  actor_role TEXT NOT NULL,         -- Role at time of action

  -- Target Info
  target_table TEXT NOT NULL,       -- Target table name
  target_id UUID NOT NULL,          -- Target record ID

  -- Changes
  action TEXT NOT NULL,             -- INSERT, UPDATE, DELETE, STATUS_CHANGE
  changes JSONB,                    -- { field: { old: x, new: y } }

  -- Context
  ip_address INET,
  user_agent TEXT,
  request_id UUID,                  -- For API request tracking

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_audit_logs_target ON audit_logs(target_table, target_id);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
```

### 5.3 Audit Log Access Restriction

```sql
-- RLS: Audit logs visible only to admin role
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_read_audit" ON audit_logs
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Client write completely blocked (Backend service_role only)
-- No INSERT/UPDATE/DELETE policies = Blocked
```

---

## 6. RLS Policy Strategy

### 6.1 Basic Principle: Default Deny

Allow only explicit policies after enabling RLS for all tables.

```sql
-- Apply to all tables
ALTER TABLE {table_name} ENABLE ROW LEVEL SECURITY;
-- All access blocked if no policy exists
```

### 6.2 Standard Policy Patterns

**Pattern A: Authenticated User Full Read (Master Data)**

```sql
CREATE POLICY "authenticated_read" ON warehouses
FOR SELECT TO authenticated
USING (true);
```

**Pattern B: Self Data Only (User Profile)**

```sql
CREATE POLICY "own_profile_read" ON users
FOR SELECT TO authenticated
USING (id = auth.uid());
```

**Pattern C: Role Based Access (Audit Logs)**

```sql
CREATE POLICY "admin_only_read" ON audit_logs
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);
```

### 6.3 Multi-tenant Preparation (Dormant Capability)

Currently, it is a single company (CHISAN Paper) deployment, so `org_id` filter is not enforced.
However, we prepare the following for future expansion:

1. **Schema Prep**: Reserve `org_id` column in major tables (nullable, use default)
2. **Policy Structure**: Separate policies into functions to easily add org_id conditions later
3. **JWT Claims**: Reserve organization identification structure via `app_metadata.org_id`

```sql
-- Pattern to activate in future (commented out for now)
-- CREATE POLICY "org_isolation" ON stocks
-- FOR SELECT TO authenticated
-- USING (
--   org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
-- );
```

---

## 7. NestJS Implementation Patterns (Backend Implementation)

### 7.1 Request-Scoped Supabase Client

```typescript
// libs/supabase/supabase.service.ts
import { Injectable, Scope, Inject } from "@nestjs/common";
import { REQUEST } from "@nestjs/core";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Request } from "express";

@Injectable({ scope: Scope.REQUEST })
export class SupabaseService {
  private userClient: SupabaseClient;
  private serviceClient: SupabaseClient;

  constructor(@Inject(REQUEST) private request: Request) {
    const jwt = this.extractJwt();

    // User context client (RLS applied)
    this.userClient = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
      {
        global: {
          headers: jwt ? { Authorization: `Bearer ${jwt}` } : {},
        },
      },
    );

    // Service role client (RLS bypassed)
    this.serviceClient = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
  }

  /**
   * User context client - Used for general data access
   * RLS policies applied, returns only data suitable for user permissions
   */
  getClient(): SupabaseClient {
    return this.userClient;
  }

  /**
   * Service role client - Used only for system tasks
   * Caution: Bypasses RLS, so use restrictedly for audit logs, background jobs, etc.
   */
  getServiceClient(): SupabaseClient {
    return this.serviceClient;
  }

  private extractJwt(): string | null {
    const authHeader = this.request.headers.authorization;
    return authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  }
}
```

### 7.2 Client Usage Guidelines

| Client               | Usage Scenario    | Example                                         |
| -------------------- | ----------------- | ----------------------------------------------- |
| `getClient()`        | User-facing tasks | Query inventory, create order                   |
| `getServiceClient()` | System tasks      | Record audit logs, background jobs, admin tasks |

### 7.3 Audit Log Interceptor

```typescript
// common/interceptors/audit-log.interceptor.ts
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private supabase: SupabaseService) {}

  async intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();
    const { method, path, body, user } = request;

    // Audit only write operations
    if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
      return next.handle().pipe(
        tap(async (response) => {
          await this.supabase
            .getServiceClient()
            .from("audit_logs")
            .insert({
              actor_id: user.id,
              actor_role: user.role,
              target_table: this.extractTable(path),
              target_id: response?.id || body?.id,
              action: this.mapMethod(method),
              changes: body,
              request_id: request.id,
            });
        }),
      );
    }
    return next.handle();
  }
}
```

---

## 8. Frontend Access Patterns (Frontend Implementation)

### 8.1 Server Component (SSR Read)

```typescript
// app/inventory/stocks/page.tsx
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export default async function StocksPage() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: () => cookieStore }
  );

  const { data: stocks } = await supabase
    .from('stocks')
    .select(`
      *,
      items (*),
      locations (*, warehouses (*))
    `)
    .order('updated_at', { ascending: false });

  return <StockTable initialData={stocks} />;
}
```

### 8.2 Client Component (Realtime Subscription)

```typescript
// components/stock-realtime.tsx
'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { Stock } from '@/types';

export function StockRealtimeUpdates({
  initialData
}: {
  initialData: Stock[]
}) {
  const [stocks, setStocks] = useState(initialData);
  const supabase = createBrowserClient(/* ... */);

  useEffect(() => {
    const channel = supabase
      .channel('stocks-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'stocks' },
        (payload) => {
          // Reflect changes
          setStocks(current =>
            updateStockList(current, payload)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return <StockList stocks={stocks} />;
}
```

### 8.3 Write Operation (API Mandatory)

```typescript
// lib/api/inventory.ts
export async function createStockIn(data: StockInDto) {
  const response = await fetch("/api/v1/inventory/inbound", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Auth header attached automatically in middleware
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new ApiError(response);
  }

  return response.json();
}

// ABSOLUTELY PROHIBITED: Direct write from client
// supabase.from('stocks').insert(...)  // DO NOT DO THIS!
```

---

## 9. Realtime Configuration

### 9.1 Realtime Target Tables

| Table               | Realtime | Purpose                                     |
| ------------------- | :------: | ------------------------------------------- |
| `stocks`            |    O     | Real-time update of inventory dashboard     |
| `shipments`         |    O     | Real-time status of shipment tracking board |
| `production_orders` |    O     | Production status monitoring                |
| `slitting_jobs`     |    O     | Real-time display of job progress           |

### 9.2 Realtime Excluded Tables

- **Master Data**: `warehouses`, `locations`, `items`, `partners`, `machines`
- **Financial Data**: `import_costs`
- **History Data**: `stock_movements`, `production_inputs`, `production_outputs`, `audit_logs`

### 9.3 Activation Method (Supabase Dashboard or SQL)

```sql
-- Realtime Publication settings in Supabase
ALTER PUBLICATION supabase_realtime ADD TABLE stocks;
ALTER PUBLICATION supabase_realtime ADD TABLE shipments;
ALTER PUBLICATION supabase_realtime ADD TABLE production_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE slitting_jobs;
```

---

## 10. Security Checklist

Mandatory checks before deployment:

### 10.1 RLS Settings

- [ ] Apply `ENABLE ROW LEVEL SECURITY` to all tables
- [ ] Define appropriate SELECT policies for all tables
- [ ] Verify `audit_logs` table blocks client writes

### 10.2 Environment Variables

- [ ] `SUPABASE_SERVICE_ROLE_KEY` is not exposed to frontend
- [ ] No sensitive info in `NEXT_PUBLIC_*` variables

### 10.3 API Security

- [ ] Apply `@UseGuards(JwtAuthGuard)` to all write endpoints
- [ ] Apply role-based access control (`@Roles()`)

### 10.4 Testing

- [ ] Test RLS policies for each role (admin, manager, worker)
- [ ] Verify blocking when attempting client direct write
- [ ] Verify audit log recording

---

## Appendix: Policy Ownership & Management

### Policy Ownership

- **Responsible**: Backend Development Team
- **Location**: `supabase/migrations/` (Version Control)
- **Review**: Mandatory code review when RLS policy changes

### Policy Change Process

1. Create migration file locally
2. Verify policy in test environment
3. Create PR and review from security perspective
4. Staging deployment and QA
5. Production deployment
