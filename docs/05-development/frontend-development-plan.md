# Frontend Development Plan - CHISAN Platform

> Comprehensive implementation guide for Master Data Management UI and foundational components

**Version**: 1.0  
**Created**: 2026-01-14  
**Status**: Draft

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State Analysis](#2-current-state-analysis)
3. [Phase Breakdown](#3-phase-breakdown)
4. [Phase 1: Foundation Setup](#4-phase-1-foundation-setup)
5. [Phase 2: Reusable Components](#5-phase-2-reusable-components)
6. [Phase 3: Master Data Pages](#6-phase-3-master-data-pages)
7. [Phase 4: Enhancement & Polish](#7-phase-4-enhancement--polish)
8. [File Structure](#8-file-structure)
9. [Implementation Details](#9-implementation-details)
10. [Effort Estimation](#10-effort-estimation)
11. [Dependencies & Risks](#11-dependencies--risks)

---

## 1. Executive Summary

### Goal

Transform the CHISAN Platform frontend from a basic scaffold with settings pages into a fully functional Master Data Management system with reusable components, proper state management, and form handling.

### Key Deliverables

- **shadcn/ui Component Library** - Professional UI components
- **TanStack Query Integration** - Server state management with caching
- **React Hook Form + Zod** - Type-safe form handling
- **Master Data Pages** - Warehouses, Partners, Items management
- **Updated Navigation** - Complete sidebar with all modules

### Tech Stack Additions

| Package                        | Version | Purpose                 |
| ------------------------------ | ------- | ----------------------- |
| @tanstack/react-query          | ^5.x    | Server state management |
| @tanstack/react-query-devtools | ^5.x    | Development debugging   |
| react-hook-form                | ^7.x    | Form state management   |
| @hookform/resolvers            | ^3.x    | Zod integration         |
| shadcn/ui components           | latest  | UI component library    |

---

## 2. Current State Analysis

### What Exists

#### Frontend Structure

```
apps/web/src/
├── app/
│   ├── (dashboard)/
│   │   ├── dashboard/page.tsx      # Placeholder cards
│   │   ├── layout.tsx              # Auth + Sidebar + Header
│   │   └── settings/
│   │       ├── users/page.tsx      # COMPLETE - User management
│   │       ├── audit-logs/page.tsx # COMPLETE - Audit logs
│   │       └── system/page.tsx     # COMPLETE - Settings
│   ├── login/page.tsx              # Google OAuth
│   └── auth/callback/route.ts      # OAuth callback
├── components/layout/
│   ├── header.tsx                  # User info, logout
│   └── sidebar.tsx                 # Navigation (4 items only)
└── lib/
    ├── api/client.ts               # API client with auth
    ├── supabase/                   # Supabase clients
    └── utils.ts                    # cn() utility
```

#### Current Patterns (from existing pages)

- **Data Fetching**: Raw `useEffect` + `useState` (no caching)
- **Forms**: Manual state management (no form library)
- **UI Components**: Inline Tailwind (no component library)
- **Tables**: Custom inline tables (no DataTable)
- **Modals**: No modal implementation yet

#### Available Resources

- **@repo/shared**: Types + Zod schemas for all entities
- **API Endpoints**: All Master Data CRUD endpoints ready
- **CSS Variables**: shadcn-compatible theme already in globals.css
- **Tailwind v4**: Configured with PostCSS

### What's Missing

1. shadcn/ui components (Button, Input, Table, Dialog, Form, etc.)
2. TanStack Query for data fetching
3. React Hook Form for form handling
4. Master Data pages (Warehouses, Partners, Items)
5. Expanded sidebar navigation

---

## 3. Phase Breakdown

```
Phase 1: Foundation Setup        (2 days)
    ↓
Phase 2: Reusable Components     (3 days)
    ↓
Phase 3: Master Data Pages       (7 days)
    ↓
Phase 4: Enhancement & Polish    (2 days)
```

| Phase | Name                 | Duration | Dependencies |
| ----- | -------------------- | -------- | ------------ |
| 1     | Foundation Setup     | 2 days   | None         |
| 2     | Reusable Components  | 3 days   | Phase 1      |
| 3     | Master Data Pages    | 7 days   | Phase 2      |
| 4     | Enhancement & Polish | 2 days   | Phase 3      |

**Total Estimated Duration: 14 days**

---

## 4. Phase 1: Foundation Setup

### 4.1 Install shadcn/ui

**Effort**: S (2-4 hours)

```bash
# Initialize shadcn/ui (uses existing Tailwind v4 config)
pnpm dlx shadcn@latest init

# Configuration choices:
# - Style: New York (recommended for enterprise)
# - Base color: Slate
# - CSS variables: Yes (already have them)
# - React Server Components: Yes
# - Components path: src/components/ui
# - Utils path: src/lib/utils (already exists)
```

**Note**: shadcn/ui fully supports Tailwind CSS v4 as of late 2024. The CSS variables in `globals.css` are already compatible.

### 4.2 Install Core shadcn Components

**Effort**: S (1-2 hours)

```bash
# Essential components for Master Data pages
pnpm dlx shadcn@latest add button input label select checkbox switch textarea
pnpm dlx shadcn@latest add dialog sheet table form toast sonner
pnpm dlx shadcn@latest add dropdown-menu badge card skeleton separator tabs
pnpm dlx shadcn@latest add alert alert-dialog command popover
```

### 4.3 Install TanStack Query

**Effort**: M (4-6 hours)

```bash
pnpm add @tanstack/react-query @tanstack/react-query-devtools --filter @repo/web
```

**Provider Setup** (`src/providers/query-provider.tsx`):

```typescript
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

**Update Root Layout** (`src/app/layout.tsx`):

```typescript
import { QueryProvider } from "@/providers/query-provider";
import { Toaster } from "@/components/ui/sonner";

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        <QueryProvider>
          {children}
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}
```

### 4.4 Install React Hook Form

**Effort**: S (1-2 hours)

```bash
pnpm add react-hook-form @hookform/resolvers --filter @repo/web
```

### 4.5 Phase 1 Deliverables Checklist

- [ ] shadcn/ui initialized with New York style
- [ ] All essential components installed
- [ ] TanStack Query provider configured
- [ ] React Hook Form installed
- [ ] Toaster component added to layout
- [ ] DevTools visible in development

---

## 5. Phase 2: Reusable Components

### 5.1 DataTable Component

**Effort**: L (8-12 hours)

A reusable data table with sorting, filtering, and pagination.

**Location**: `src/components/data-table/`

**Files**:

```
data-table/
├── data-table.tsx           # Main table component
├── data-table-pagination.tsx # Pagination controls
├── data-table-column-header.tsx # Sortable headers
├── data-table-toolbar.tsx   # Search + filters
├── data-table-faceted-filter.tsx # Multi-select filters
├── data-table-row-actions.tsx # Row action dropdown
└── index.ts                 # Barrel export
```

**Features**:

- Generic `<DataTable<T>>` component
- Column definitions with TanStack Table
- Built-in pagination (client-side)
- Sortable columns
- Filterable columns
- Row selection (optional)
- Row actions dropdown
- Empty state
- Loading skeleton

**Props Interface**:

```typescript
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  searchKey?: string;
  searchPlaceholder?: string;
  filterableColumns?: FilterableColumn[];
  onRowClick?: (row: TData) => void;
  pageSize?: number;
}
```

### 5.2 FormSheet Component

**Effort**: M (4-6 hours)

Slide-out panel for create/edit forms.

**Location**: `src/components/form-sheet.tsx`

**Features**:

- Configurable title (Create/Edit mode)
- Form content slot
- Loading state during submission
- Close on success
- Responsive width

**Props Interface**:

```typescript
interface FormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  side?: "left" | "right";
}
```

### 5.3 ConfirmDialog Component

**Effort**: S (2-3 hours)

Confirmation dialog for destructive actions.

**Location**: `src/components/confirm-dialog.tsx`

**Features**:

- Customizable title and message
- Destructive/Default variants
- Loading state for async actions
- Keyboard accessible

### 5.4 StatusBadge Component

**Effort**: S (1-2 hours)

Consistent status badges across the app.

**Location**: `src/components/status-badge.tsx`

**Variants**:

- `active` / `inactive` - For isActive fields
- `supplier` / `customer` / `both` - For partner types
- `roll` / `sheet` - For item forms
- Custom variant support

### 5.5 PageHeader Component

**Effort**: S (1-2 hours)

Consistent page headers with title, description, and actions.

**Location**: `src/components/page-header.tsx`

**Props**:

```typescript
interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode; // e.g., "Create" button
}
```

### 5.6 API Hooks Layer

**Effort**: M (4-6 hours)

TanStack Query hooks for all API endpoints.

**Location**: `src/hooks/api/`

**Files**:

```
hooks/api/
├── use-warehouses.ts    # Warehouse CRUD hooks
├── use-partners.ts      # Partner CRUD hooks
├── use-brands.ts        # Brand hooks
├── use-items.ts         # Item CRUD hooks
├── use-paper-types.ts   # Paper type hooks
└── index.ts             # Barrel export
```

**Example Hook Structure** (`use-warehouses.ts`):

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  Warehouse,
  WarehouseWithLocations,
  CreateWarehouseInput,
} from "@repo/shared";

const QUERY_KEY = ["warehouses"];

export function useWarehouses() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => api.get<Warehouse[]>("/api/v1/warehouses"),
  });
}

export function useWarehouse(id: string) {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: () => api.get<WarehouseWithLocations>(`/api/v1/warehouses/${id}`),
    enabled: !!id,
  });
}

export function useCreateWarehouse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateWarehouseInput) =>
      api.post<Warehouse>("/api/v1/warehouses", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useUpdateWarehouse(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<CreateWarehouseInput>) =>
      api.patch<Warehouse>(`/api/v1/warehouses/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useDeleteWarehouse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/warehouses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
```

### 5.7 Phase 2 Deliverables Checklist

- [ ] DataTable component with all features
- [ ] FormSheet component
- [ ] ConfirmDialog component
- [ ] StatusBadge component
- [ ] PageHeader component
- [ ] API hooks for all entities
- [ ] Components documented with examples

---

## 6. Phase 3: Master Data Pages

### 6.1 Update Sidebar Navigation

**Effort**: S (1-2 hours)

**Updated Navigation Structure**:

```typescript
const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "대시보드",
    icon: <HomeIcon />,
  },
  // NEW: Master Data Section
  {
    section: "기준정보",
    items: [
      {
        href: "/master/warehouses",
        label: "창고 관리",
        icon: <WarehouseIcon />,
      },
      {
        href: "/master/partners",
        label: "거래처 관리",
        icon: <UsersIcon />,
      },
      {
        href: "/master/items",
        label: "품목 관리",
        icon: <PackageIcon />,
      },
    ],
  },
  // Existing Settings Section
  {
    section: "설정",
    items: [
      { href: "/settings/users", label: "사용자 관리", icon: <UsersIcon />, roles: ["admin"] },
      { href: "/settings/audit-logs", label: "감사 로그", icon: <LogIcon />, roles: ["admin"] },
      { href: "/settings/system", label: "시스템 설정", icon: <SettingsIcon />, roles: ["admin"] },
    ],
  },
];
```

### 6.2 Warehouses Page (`/master/warehouses`)

**Effort**: L (8-12 hours)

**Route**: `app/(dashboard)/master/warehouses/page.tsx`

#### Features

- List all warehouses in DataTable
- Create warehouse (Sheet form)
- Edit warehouse (Sheet form)
- Delete warehouse (Confirm dialog)
- View/manage locations per warehouse (expandable row or sub-page)
- Default warehouse indicator
- Active/Inactive status toggle

#### Components Needed

- `WarehousesPage` - Main page component
- `WarehouseForm` - Create/Edit form
- `WarehouseColumns` - Column definitions
- `LocationsTable` - Nested table for locations
- `LocationForm` - Create/Edit location form

#### Table Columns

| Column  | Type     | Features                       |
| ------- | -------- | ------------------------------ |
| Code    | Text     | Sortable                       |
| Name    | Text     | Sortable, Searchable           |
| City    | Text     | Filterable                     |
| Contact | Text     | -                              |
| Status  | Badge    | Filterable (Active/Inactive)   |
| Default | Badge    | -                              |
| Actions | Dropdown | Edit, Manage Locations, Delete |

#### Form Fields (Warehouse)

| Field        | Type     | Validation            | Required |
| ------------ | -------- | --------------------- | -------- |
| code         | Input    | 1-20 chars, uppercase | Yes      |
| name         | Input    | 1-100 chars           | Yes      |
| address      | Textarea | max 200 chars         | No       |
| city         | Input    | max 50 chars          | No       |
| postalCode   | Input    | max 20 chars          | No       |
| contactName  | Input    | max 50 chars          | No       |
| contactPhone | Input    | max 30 chars          | No       |
| isDefault    | Switch   | boolean               | No       |
| notes        | Textarea | max 500 chars         | No       |

#### Form Fields (Location)

| Field    | Type     | Validation            | Required |
| -------- | -------- | --------------------- | -------- |
| code     | Input    | 1-20 chars, uppercase | Yes      |
| name     | Input    | max 100 chars         | No       |
| type     | Select   | LocationType enum     | No       |
| parentId | Select   | UUID (from locations) | No       |
| notes    | Textarea | max 500 chars         | No       |

#### API Endpoints Used

- `GET /api/v1/warehouses` - List warehouses
- `GET /api/v1/warehouses/:id` - Get warehouse with locations
- `POST /api/v1/warehouses` - Create warehouse
- `PATCH /api/v1/warehouses/:id` - Update warehouse
- `DELETE /api/v1/warehouses/:id` - Delete warehouse
- `POST /api/v1/warehouses/:id/locations` - Create location
- `PATCH /api/v1/locations/:id` - Update location

### 6.3 Partners Page (`/master/partners`)

**Effort**: L (10-14 hours)

**Route**: `app/(dashboard)/master/partners/page.tsx`

#### Features

- List all partners in DataTable
- Filter by partner type (Supplier/Customer/Both)
- Create partner (Sheet form with conditional fields)
- Edit partner
- Delete partner (soft delete)
- Manage brands per supplier (expandable or sub-table)
- Country filter

#### Components Needed

- `PartnersPage` - Main page component
- `PartnerForm` - Create/Edit form with conditional sections
- `PartnerColumns` - Column definitions
- `BrandsTable` - Nested table for brands
- `BrandForm` - Create/Edit brand form

#### Table Columns

| Column       | Type     | Features                            |
| ------------ | -------- | ----------------------------------- |
| Partner Code | Text     | Sortable                            |
| Name         | Text     | Sortable, Searchable                |
| Type         | Badge    | Filterable (Supplier/Customer/Both) |
| Country      | Text     | Filterable                          |
| Contact      | Text     | -                                   |
| Status       | Badge    | Filterable                          |
| Brands       | Count    | Click to expand                     |
| Actions      | Dropdown | Edit, Manage Brands, Delete         |

#### Form Fields (Partner)

| Field                | Type     | Validation            | Required | Condition            |
| -------------------- | -------- | --------------------- | -------- | -------------------- |
| partnerCode          | Input    | 1-20 chars, uppercase | Yes      | -                    |
| name                 | Input    | 1-100 chars           | Yes      | -                    |
| nameLocal            | Input    | max 100 chars         | No       | -                    |
| partnerType          | Select   | PartnerType enum      | Yes      | -                    |
| countryCode          | Select   | 2 chars (ISO)         | Yes      | -                    |
| address              | Textarea | max 200 chars         | No       | -                    |
| city                 | Input    | max 50 chars          | No       | -                    |
| contactName          | Input    | max 50 chars          | No       | -                    |
| contactEmail         | Input    | email format          | No       | -                    |
| contactPhone         | Input    | max 30 chars          | No       | -                    |
| **Supplier Fields**  |          |                       |          | type = supplier/both |
| supplierCurrency     | Select   | 3 chars (ISO)         | No       | Supplier             |
| supplierPaymentTerms | Input    | max 50 chars          | No       | Supplier             |
| leadTimeDays         | Input    | 0-365                 | No       | Supplier             |
| **Customer Fields**  |          |                       |          | type = customer/both |
| customerCurrency     | Select   | 3 chars (ISO)         | No       | Customer             |
| customerPaymentTerms | Input    | max 50 chars          | No       | Customer             |
| creditLimit          | Input    | number >= 0           | No       | Customer             |
| notes                | Textarea | max 500 chars         | No       | -                    |

#### Form Fields (Brand)

| Field       | Type     | Validation            | Required |
| ----------- | -------- | --------------------- | -------- |
| code        | Input    | 1-20 chars, uppercase | Yes      |
| name        | Input    | 1-100 chars           | Yes      |
| description | Textarea | max 500 chars         | No       |

#### API Endpoints Used

- `GET /api/v1/partners` - List all partners
- `GET /api/v1/partners/suppliers` - List suppliers
- `GET /api/v1/partners/customers` - List customers
- `GET /api/v1/partners/:id` - Get partner details
- `POST /api/v1/partners` - Create partner
- `PATCH /api/v1/partners/:id` - Update partner
- `DELETE /api/v1/partners/:id` - Delete partner
- `GET /api/v1/partners/:id/brands` - Get partner's brands
- `POST /api/v1/partners/:id/brands` - Create brand
- `PATCH /api/v1/brands/:id` - Update brand

### 6.4 Items Page (`/master/items`)

**Effort**: XL (14-20 hours)

**Route**: `app/(dashboard)/master/items/page.tsx`

This is the most complex page due to:

- Multiple filter dimensions
- Conditional fields based on form (roll/sheet)
- Related data (paper types, brands)
- Advanced search capabilities

#### Features

- List all items in DataTable
- Multi-dimensional filtering (Paper Type, Brand, Form, Grammage range)
- Text search across display name
- Create item with conditional fields
- Edit item
- Delete item (soft delete)
- Paper Types management (separate tab or sub-page)

#### Components Needed

- `ItemsPage` - Main page with tabs
- `ItemsTable` - Items DataTable with filters
- `ItemForm` - Create/Edit form with conditional sections
- `ItemColumns` - Column definitions
- `PaperTypesTable` - Paper types management
- `PaperTypeForm` - Create/Edit paper type
- `ItemFilters` - Advanced filter panel

#### Table Columns (Items)

| Column       | Type     | Features                |
| ------------ | -------- | ----------------------- |
| Item Code    | Text     | Sortable                |
| Display Name | Text     | Sortable, Searchable    |
| Paper Type   | Text     | Filterable              |
| Brand        | Text     | Filterable              |
| Grammage     | Number   | Sortable, Range Filter  |
| Width        | Number   | Sortable                |
| Form         | Badge    | Filterable (Roll/Sheet) |
| Status       | Badge    | Filterable              |
| Actions      | Dropdown | Edit, Delete            |

#### Table Columns (Paper Types)

| Column     | Type     | Features |
| ---------- | -------- | -------- |
| Code       | Text     | Sortable |
| Name (EN)  | Text     | Sortable |
| Name (KO)  | Text     | -        |
| Sort Order | Number   | Sortable |
| Status     | Badge    | -        |
| Actions    | Dropdown | Edit     |

#### Form Fields (Item)

| Field            | Type     | Validation    | Required    | Condition    |
| ---------------- | -------- | ------------- | ----------- | ------------ |
| displayName      | Input    | 1-200 chars   | Yes         | -            |
| paperTypeId      | Select   | UUID          | Yes         | -            |
| brandId          | Select   | UUID          | No          | -            |
| grammage         | Input    | 30-500        | Yes         | -            |
| form             | Select   | roll/sheet    | Yes         | -            |
| **Roll Fields**  |          |               |             | form = roll  |
| widthMm          | Input    | 50-2500       | Yes (roll)  | Roll         |
| coreDiameterInch | Input    | 1-12          | No          | Roll         |
| **Sheet Fields** |          |               |             | form = sheet |
| widthMm          | Input    | 50-2500       | Yes (sheet) | Sheet        |
| lengthMm         | Input    | 50-2500       | Yes (sheet) | Sheet        |
| sheetsPerReam    | Input    | 1-1000        | No          | Sheet        |
| **Common**       |          |               |             |              |
| unitOfMeasure    | Select   | kg/ea/etc     | No          | -            |
| notes            | Textarea | max 500 chars | No          | -            |

#### Form Fields (Paper Type)

| Field       | Type     | Validation            | Required |
| ----------- | -------- | --------------------- | -------- |
| code        | Input    | 1-10 chars, uppercase | Yes      |
| nameEn      | Input    | 1-50 chars            | Yes      |
| nameKo      | Input    | max 50 chars          | No       |
| description | Textarea | max 200 chars         | No       |
| sortOrder   | Input    | number >= 0           | No       |

#### API Endpoints Used

- `GET /api/v1/items` - List items with query params
- `GET /api/v1/items/:id` - Get item with relations
- `POST /api/v1/items` - Create item
- `PATCH /api/v1/items/:id` - Update item
- `DELETE /api/v1/items/:id` - Delete item
- `GET /api/v1/paper-types` - List paper types
- `POST /api/v1/paper-types` - Create paper type
- `PATCH /api/v1/paper-types/:id` - Update paper type
- `GET /api/v1/brands` - List all brands (for select)

### 6.5 Phase 3 Deliverables Checklist

- [ ] Updated sidebar with Master Data section
- [ ] Warehouses page with CRUD
- [ ] Location management per warehouse
- [ ] Partners page with CRUD
- [ ] Brand management per partner
- [ ] Items page with CRUD
- [ ] Paper Types management
- [ ] All forms validated with Zod schemas
- [ ] Toast notifications for success/error
- [ ] Loading states and skeletons
- [ ] Empty states for all tables

---

## 7. Phase 4: Enhancement & Polish

### 7.1 Optimistic Updates

**Effort**: M (4-6 hours)

Implement optimistic updates for better UX:

- Immediate UI updates before server confirmation
- Rollback on error
- Apply to toggle operations (active/inactive)

### 7.2 Error Handling

**Effort**: S (2-4 hours)

- Global error boundary
- API error display with toast
- Form validation error display
- Network error handling

### 7.3 Loading & Empty States

**Effort**: S (2-3 hours)

- Skeleton loaders for tables
- Empty state illustrations
- Loading spinners for buttons

### 7.4 Keyboard Navigation

**Effort**: S (2-3 hours)

- Keyboard shortcuts for common actions
- Focus management in modals
- Accessible form navigation

### 7.5 Responsive Design

**Effort**: M (4-6 hours)

- Mobile-friendly DataTable (card view on small screens)
- Responsive form layouts
- Collapsible sidebar on mobile

### 7.6 Phase 4 Deliverables Checklist

- [ ] Optimistic updates implemented
- [ ] Error boundary configured
- [ ] Toast notifications for all actions
- [ ] Skeleton loaders
- [ ] Empty states
- [ ] Keyboard navigation
- [ ] Responsive design tested

---

## 8. File Structure

### Proposed Final Structure

```
apps/web/src/
├── app/
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── master/
│   │   │   ├── warehouses/
│   │   │   │   └── page.tsx
│   │   │   ├── partners/
│   │   │   │   └── page.tsx
│   │   │   └── items/
│   │   │       └── page.tsx
│   │   ├── settings/
│   │   │   ├── users/
│   │   │   ├── audit-logs/
│   │   │   └── system/
│   │   └── layout.tsx
│   ├── login/
│   ├── auth/
│   └── layout.tsx
│
├── components/
│   ├── ui/                    # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── table.tsx
│   │   ├── dialog.tsx
│   │   ├── sheet.tsx
│   │   ├── form.tsx
│   │   └── ...
│   │
│   ├── data-table/            # Reusable DataTable
│   │   ├── data-table.tsx
│   │   ├── data-table-pagination.tsx
│   │   ├── data-table-column-header.tsx
│   │   ├── data-table-toolbar.tsx
│   │   └── index.ts
│   │
│   ├── layout/                # Layout components
│   │   ├── sidebar.tsx
│   │   ├── header.tsx
│   │   └── page-header.tsx
│   │
│   ├── warehouses/            # Warehouse feature components
│   │   ├── warehouse-form.tsx
│   │   ├── warehouse-columns.tsx
│   │   ├── locations-table.tsx
│   │   └── location-form.tsx
│   │
│   ├── partners/              # Partner feature components
│   │   ├── partner-form.tsx
│   │   ├── partner-columns.tsx
│   │   ├── brands-table.tsx
│   │   └── brand-form.tsx
│   │
│   ├── items/                 # Item feature components
│   │   ├── item-form.tsx
│   │   ├── item-columns.tsx
│   │   ├── item-filters.tsx
│   │   ├── paper-types-table.tsx
│   │   └── paper-type-form.tsx
│   │
│   ├── form-sheet.tsx         # Reusable form sheet
│   ├── confirm-dialog.tsx     # Reusable confirm dialog
│   └── status-badge.tsx       # Reusable status badge
│
├── hooks/
│   ├── api/                   # TanStack Query hooks
│   │   ├── use-warehouses.ts
│   │   ├── use-partners.ts
│   │   ├── use-brands.ts
│   │   ├── use-items.ts
│   │   ├── use-paper-types.ts
│   │   └── index.ts
│   │
│   └── use-debounce.ts        # Utility hooks
│
├── providers/
│   └── query-provider.tsx     # TanStack Query provider
│
├── lib/
│   ├── api/
│   │   └── client.ts
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   └── utils.ts
│
└── types/
    └── table.ts               # Table-specific types
```

---

## 9. Implementation Details

### 9.1 Form Integration Pattern

```typescript
// components/warehouses/warehouse-form.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createWarehouseSchema, type CreateWarehouseInput } from "@repo/shared";
import { useCreateWarehouse, useUpdateWarehouse } from "@/hooks/api";
import { toast } from "sonner";

interface WarehouseFormProps {
  warehouse?: Warehouse;
  onSuccess: () => void;
}

export function WarehouseForm({ warehouse, onSuccess }: WarehouseFormProps) {
  const isEditing = !!warehouse;

  const form = useForm<CreateWarehouseInput>({
    resolver: zodResolver(createWarehouseSchema),
    defaultValues: warehouse ?? {
      code: "",
      name: "",
      isDefault: false,
    },
  });

  const createMutation = useCreateWarehouse();
  const updateMutation = useUpdateWarehouse(warehouse?.id ?? "");

  const onSubmit = async (data: CreateWarehouseInput) => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync(data);
        toast.success("창고가 수정되었습니다.");
      } else {
        await createMutation.mutateAsync(data);
        toast.success("창고가 생성되었습니다.");
      }
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "오류가 발생했습니다.");
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>창고 코드 *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="WH-001" disabled={isEditing} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* ... more fields */}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "저장 중..." : isEditing ? "수정" : "생성"}
        </Button>
      </form>
    </Form>
  );
}
```

### 9.2 DataTable Integration Pattern

```typescript
// app/(dashboard)/master/warehouses/page.tsx
"use client";

import { useState } from "react";
import { useWarehouses, useDeleteWarehouse } from "@/hooks/api";
import { DataTable } from "@/components/data-table";
import { warehouseColumns } from "@/components/warehouses/warehouse-columns";
import { WarehouseForm } from "@/components/warehouses/warehouse-form";
import { FormSheet } from "@/components/form-sheet";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import type { Warehouse } from "@repo/shared";

export default function WarehousesPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Warehouse | null>(null);

  const { data: warehouses, isLoading } = useWarehouses();
  const deleteMutation = useDeleteWarehouse();

  const handleEdit = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success("창고가 삭제되었습니다.");
      setDeleteTarget(null);
    } catch (error) {
      toast.error("삭제 중 오류가 발생했습니다.");
    }
  };

  const handleFormSuccess = () => {
    setFormOpen(false);
    setEditingWarehouse(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="창고 관리"
        description="창고 및 로케이션을 관리합니다."
        action={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            창고 추가
          </Button>
        }
      />

      <DataTable
        columns={warehouseColumns({ onEdit: handleEdit, onDelete: setDeleteTarget })}
        data={warehouses ?? []}
        isLoading={isLoading}
        searchKey="name"
        searchPlaceholder="창고명 검색..."
      />

      <FormSheet
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingWarehouse(null);
        }}
        title={editingWarehouse ? "창고 수정" : "새 창고 추가"}
      >
        <WarehouseForm
          warehouse={editingWarehouse}
          onSuccess={handleFormSuccess}
        />
      </FormSheet>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="창고 삭제"
        description={`"${deleteTarget?.name}" 창고를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
        variant="destructive"
      />
    </div>
  );
}
```

### 9.3 Column Definition Pattern

```typescript
// components/warehouses/warehouse-columns.tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTableRowActions } from "@/components/data-table/data-table-row-actions";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import type { Warehouse } from "@repo/shared";

interface ColumnActions {
  onEdit: (warehouse: Warehouse) => void;
  onDelete: (warehouse: Warehouse) => void;
}

export function warehouseColumns({ onEdit, onDelete }: ColumnActions): ColumnDef<Warehouse>[] {
  return [
    {
      accessorKey: "code",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="코드" />
      ),
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="창고명" />
      ),
    },
    {
      accessorKey: "city",
      header: "도시",
    },
    {
      accessorKey: "contactName",
      header: "담당자",
    },
    {
      accessorKey: "isActive",
      header: "상태",
      cell: ({ row }) => (
        <StatusBadge variant={row.original.isActive ? "active" : "inactive"} />
      ),
    },
    {
      accessorKey: "isDefault",
      header: "기본",
      cell: ({ row }) =>
        row.original.isDefault ? (
          <Badge variant="secondary">기본</Badge>
        ) : null,
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DataTableRowActions
          actions={[
            { label: "수정", onClick: () => onEdit(row.original) },
            { label: "삭제", onClick: () => onDelete(row.original), variant: "destructive" },
          ]}
        />
      ),
    },
  ];
}
```

---

## 10. Effort Estimation

### T-Shirt Sizing Guide

- **S** (Small): 1-4 hours
- **M** (Medium): 4-8 hours
- **L** (Large): 8-16 hours
- **XL** (Extra Large): 16-24 hours

### Detailed Estimates

| Phase       | Task                    | Size | Hours      |
| ----------- | ----------------------- | ---- | ---------- |
| **Phase 1** |                         |      | **8-12h**  |
|             | shadcn/ui init          | S    | 2-4h       |
|             | Install components      | S    | 1-2h       |
|             | TanStack Query setup    | M    | 4-6h       |
|             | React Hook Form install | S    | 1-2h       |
| **Phase 2** |                         |      | **22-34h** |
|             | DataTable component     | L    | 8-12h      |
|             | FormSheet component     | M    | 4-6h       |
|             | ConfirmDialog           | S    | 2-3h       |
|             | StatusBadge             | S    | 1-2h       |
|             | PageHeader              | S    | 1-2h       |
|             | API Hooks               | M    | 4-6h       |
| **Phase 3** |                         |      | **34-50h** |
|             | Sidebar update          | S    | 1-2h       |
|             | Warehouses page         | L    | 8-12h      |
|             | Partners page           | L    | 10-14h     |
|             | Items page              | XL   | 14-20h     |
| **Phase 4** |                         |      | **14-22h** |
|             | Optimistic updates      | M    | 4-6h       |
|             | Error handling          | S    | 2-4h       |
|             | Loading/Empty states    | S    | 2-3h       |
|             | Keyboard navigation     | S    | 2-3h       |
|             | Responsive design       | M    | 4-6h       |

### Summary

| Phase     | Total Hours | Days (8h/day)  |
| --------- | ----------- | -------------- |
| Phase 1   | 8-12h       | 1-1.5 days     |
| Phase 2   | 22-34h      | 3-4 days       |
| Phase 3   | 34-50h      | 4-6 days       |
| Phase 4   | 14-22h      | 2-3 days       |
| **Total** | **78-118h** | **10-15 days** |

---

## 11. Dependencies & Risks

### Technical Dependencies

| Dependency                   | Risk   | Mitigation                      |
| ---------------------------- | ------ | ------------------------------- |
| shadcn/ui + Tailwind v4      | Low    | Well-documented, widely used    |
| TanStack Query v5 + React 19 | Low    | Stable release, good docs       |
| React Hook Form + Zod        | Low    | Mature libraries                |
| Backend API stability        | Medium | API is complete, may need fixes |

### Potential Risks

1. **Tailwind v4 Compatibility**
   - Risk: Some shadcn components may need tweaks
   - Mitigation: CSS variables already configured, test each component

2. **Complex Form Validation**
   - Risk: Conditional validation (partner/item types)
   - Mitigation: Zod schemas already handle this

3. **Performance with Large Datasets**
   - Risk: DataTable with many rows
   - Mitigation: Implement pagination, consider virtualization later

4. **State Synchronization**
   - Risk: Cache invalidation issues
   - Mitigation: Use TanStack Query's invalidateQueries properly

### Quality Checkpoints

- [ ] All forms validate correctly
- [ ] All tables sort and filter properly
- [ ] All CRUD operations work
- [ ] Toast notifications appear
- [ ] Loading states display
- [ ] Error states handle gracefully
- [ ] Mobile layout works
- [ ] Accessibility tested

---

## Appendix A: Korean Labels Reference

### Common Labels

| English  | Korean      |
| -------- | ----------- |
| Create   | 생성        |
| Edit     | 수정        |
| Delete   | 삭제        |
| Save     | 저장        |
| Cancel   | 취소        |
| Search   | 검색        |
| Filter   | 필터        |
| Loading  | 로딩 중     |
| No data  | 데이터 없음 |
| Actions  | 작업        |
| Status   | 상태        |
| Active   | 활성        |
| Inactive | 비활성      |
| Required | 필수        |
| Optional | 선택        |

### Module Labels

| English         | Korean      |
| --------------- | ----------- |
| Master Data     | 기준정보    |
| Warehouses      | 창고 관리   |
| Partners        | 거래처 관리 |
| Items           | 품목 관리   |
| Settings        | 설정        |
| Users           | 사용자 관리 |
| Audit Logs      | 감사 로그   |
| System Settings | 시스템 설정 |

### Entity Labels

| English    | Korean   |
| ---------- | -------- |
| Warehouse  | 창고     |
| Location   | 로케이션 |
| Partner    | 거래처   |
| Supplier   | 공급업체 |
| Customer   | 고객     |
| Brand      | 브랜드   |
| Item       | 품목     |
| Paper Type | 지종     |
| Grammage   | 평량     |
| Width      | 폭       |
| Roll       | 롤       |
| Sheet      | 시트     |

---

## Appendix B: Quick Start Commands

```bash
# Phase 1: Foundation
cd apps/web
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add button input label select dialog sheet table form toast sonner
pnpm add @tanstack/react-query @tanstack/react-query-devtools
pnpm add react-hook-form @hookform/resolvers

# Verify installation
pnpm dev

# Check for TypeScript errors
pnpm check-types
```

---

_End of Frontend Development Plan_
