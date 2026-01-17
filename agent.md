# CHISAN Platform - AI Agent Guidelines

> Context document for AI agents working on this project
> **Last Updated**: 2026-01-17

## Quick Start for AI Agents

```
1. Read this file first
2. Check docs/04-feature-map/ for feature dependencies
3. Use LSP tools and grep for code exploration
```

## Project Overview

**CHISAN Platform** is an ERP system for CHISAN Paper company.

| Item     | Value                                           |
| -------- | ----------------------------------------------- |
| Business | Paper import, warehouse, distribution, slitting |
| Products | Roll paper 80%, Sheet 20%                       |
| Users    | 6 staff → 20 (within 2 years)                   |

## Tech Stack

| Layer    | Technology                   |
| -------- | ---------------------------- |
| Backend  | NestJS 11                    |
| Frontend | Next.js 15 (App Router)      |
| Database | Supabase PostgreSQL          |
| Auth     | Supabase Auth (Google OAuth) |
| Monorepo | Turborepo + pnpm             |
| UI       | shadcn/ui, Tailwind CSS v4   |

## Project Structure

```
chisan-platform/
├── apps/
│   ├── api/                 # NestJS backend
│   │   └── src/modules/     # Feature modules
│   └── web/                 # Next.js frontend
│       ├── app/(dashboard)/ # Protected pages
│       └── components/      # UI components
├── packages/
│   └── shared/              # Shared types & Zod schemas
│       ├── types/
│       └── schemas/
└── supabase/
    └── migrations/          # DB migrations (00001~00016)
```

## Current Implementation Status

### Completed Features

| Feature ID | Name           | Description                                                 |
| ---------- | -------------- | ----------------------------------------------------------- |
| AUTH       | Authentication | Google OAuth, JWT, Role-based access                        |
| INV-F001   | Master Data    | Warehouses, Locations, Partners, Brands, Items, Paper Types |
| INV-F002   | Stock Inquiry  | Stock list with search/filter                               |
| INV-F003   | Stock-In       | Single & bulk stock-in with atomic RPC                      |
| INV-F004   | Stock-Out      | Single & bulk stock-out with atomic RPC                     |

### Database Tables

| Table           | Description                                    |
| --------------- | ---------------------------------------------- |
| users           | User accounts (synced from Supabase Auth)      |
| user_roles      | User role assignments (admin, manager, viewer) |
| audit_logs      | All system audit trails                        |
| settings        | System settings (key-value)                    |
| warehouses      | Warehouse master                               |
| locations       | Warehouse locations (zones, racks)             |
| partners        | Suppliers & customers                          |
| brands          | Product brands (belongs to partner)            |
| paper_types     | Paper type master (Art, Ivory, etc.)           |
| items           | Product items (paper specifications)           |
| stocks          | Inventory records                              |
| stock_movements | Inventory movement history                     |

### API Endpoints (all under `/api/v1/`)

| Module      | Endpoints                                                           |
| ----------- | ------------------------------------------------------------------- |
| stocks      | GET /, GET /:id, POST /in, POST /in/bulk, POST /out, POST /out/bulk |
| warehouses  | CRUD + GET /:id/locations, POST /:id/locations                      |
| partners    | CRUD + GET /suppliers, GET /customers, GET /:id/brands              |
| brands      | GET /, PATCH /:id                                                   |
| items       | CRUD                                                                |
| paper-types | GET /, POST, PATCH /:id                                             |
| users       | GET /, GET /:id, PATCH /:id, roles management                       |
| settings    | GET /, GET /:category, PATCH /:category/:key                        |

## Domain Terms

| Korean | English     | Description                             |
| ------ | ----------- | --------------------------------------- |
| 원지   | Parent Roll | Large roll before slitting              |
| 슬리팅 | Slitting    | Cutting parent rolls into smaller rolls |
| 입고   | Stock-In    | Inventory incoming                      |
| 출고   | Stock-Out   | Inventory outgoing                      |
| 평량   | Grammage    | Paper weight (g/m²)                     |
| 지폭   | Width       | Roll/Sheet width (mm)                   |

## Coding Rules

| Rule       | Description                                         |
| ---------- | --------------------------------------------------- |
| TypeScript | Strict mode, no `any`                               |
| Validation | All API inputs use Zod schemas in `packages/shared` |
| DB Naming  | snake_case (tables plural, columns singular)        |
| Commits    | Conventional commits: `feat:`, `fix:`, `refactor:`  |
| Comments   | Korean allowed for business logic only              |

## RPC Functions (Supabase)

| Function                            | Description                              |
| ----------------------------------- | ---------------------------------------- |
| bulk_stock_in(items, performed_by)  | Atomic bulk stock-in with advisory lock  |
| bulk_stock_out(items, performed_by) | Atomic bulk stock-out with advisory lock |
| generate_batch_number()             | Generate SI-YYYYMMDD-NNN                 |
| generate_stock_out_number()         | Generate SO-YYYYMMDD-NNN                 |

## Key Patterns

### Stock Operations

- Single operations route through bulk RPC for consistency
- Advisory locks prevent race conditions
- All movements recorded in stock_movements table
- Audit logs for all operations

### Frontend

- DataTable component for all list views
- FormSheet for create/edit forms
- React Query for server state
- Zod + react-hook-form for validation

## Planned Features (Not Started)

| Feature           | Description                                        |
| ----------------- | -------------------------------------------------- |
| Approval Workflow | Order → Field Processing → Approval → Stock Change |
| Import Management | Purchase orders, shipment tracking                 |
| Production        | Slitting job management                            |
| TDS               | Technical Data Sheet management                    |

## Quick Commands

```bash
pnpm dev              # Start all apps
pnpm build            # Build all
pnpm dev --filter api # Backend only
pnpm dev --filter web # Frontend only
npx supabase db push  # Apply migrations
```
