# CHISAN Platform - AI Agent Guidelines

> Context document for AI agents working on this project

## Agent Behavior Rules

| Rule              | Description                                           |
| ----------------- | ----------------------------------------------------- |
| **Language**      | All responses MUST be in English                      |
| **Code Comments** | Business logic comments may be in Korean              |
| **Documentation** | Follow existing document language (Korean or English) |

## Project Overview

**CHISAN Platform** is the integrated business platform for CHISAN Paper.

- **Company**: CHISAN Paper
- **Business**: Paper import, warehouse management, distribution, slitting (cutting) processing
- **Products**: Roll paper 80%, Sheet 20%
- **Users**: 6 internal staff → 20 (within 2 years)

## Architecture

### Tech Stack

| Layer    | Technology                   |
| -------- | ---------------------------- |
| Backend  | NestJS 11                    |
| Frontend | Next.js 15 (App Router)      |
| Database | Supabase PostgreSQL          |
| Auth     | Supabase Auth (Google OAuth) |
| Storage  | Cloudflare R2                |
| Monorepo | Turborepo + pnpm             |
| Testing  | Vitest, Playwright           |
| UI       | shadcn/ui, Tailwind CSS v4   |

### Monorepo Structure

```
chisan-platform/
├── apps/
│   ├── api/              # NestJS backend
│   │   ├── src/
│   │   │   ├── core/     # Database, Auth, Config modules
│   │   │   ├── modules/  # Feature modules (inventory, import, production)
│   │   │   └── main.ts
│   │   └── nest-cli.json
│   └── web/              # Next.js frontend
│       ├── app/          # App Router pages
│       ├── components/   # UI components
│       └── lib/          # Utilities
├── packages/
│   └── shared/           # Shared types, validators (Zod)
│       ├── types/
│       └── validators/
├── docs/                 # Documentation (you are here)
├── turbo.json
└── pnpm-workspace.yaml
```

### Module Priority (Development Order)

1. **Phase 1 - CORE**:
   - `inventory` - Inventory Management WMS (Highest Priority)
   - `import` - Import/Order Management
   - `production` - Slitting Production Management

2. **Phase 2**:
   - `tds` - Technical Data Sheet (TDS) Management

3. **Future**:
   - `approval` - Approval System
   - `sales` - Sales/Order Management
   - `wiki` - Internal Wiki
   - `analytics` - Analytics/Reporting

## Domain Context

### Key Domain Terms

| Korean | English     | Description                                        |
| ------ | ----------- | -------------------------------------------------- |
| 원지   | Parent Roll | Large roll before slitting                         |
| 슬리팅 | Slitting    | Process of cutting parent rolls into smaller rolls |
| 입고   | Stock-In    | Inventory incoming                                 |
| 출고   | Stock-Out   | Inventory outgoing                                 |
| 발주   | Order/PO    | Purchase Order                                     |
| 거래처 | Partner     | Supplier or Customer                               |
| 평량   | Grammage    | Paper weight (g/m²)                                |
| 지폭   | Width       | Roll/Sheet width (mm)                              |
| 지름   | Diameter    | Roll diameter (mm)                                 |

### Business Flow

```
[Importer] → Order(PO) → Shipment → Arrival/Customs → Stock-In
                                                      ↓
                                              [Warehouse - Parent Roll Inventory]
                                                      ↓
                                            Production Order
                                                      ↓
                                              Stock-Out → Slitting → Stock-In
                                                      ↓
                                          [Warehouse - Slitting Roll/Sheet Inventory]
                                                      ↓
                                              Stock-Out → [Customer]
```

## Development Methodology

### EvoDev (Feature-Driven Development)

This project follows the **EvoDev** methodology:

1. **Feature Map (DAG)**: Model dependencies between Features as a DAG
2. **Feature Specification**: Define Business/UI/Data flow for each Feature
3. **Iterative Development**: Iterative development in DAG topology order
4. **Multi-layer Context**: Hierarchical context of Business → Design → Implementation

### Feature ID Convention

```
{MODULE}-F{NUMBER}-{SHORT_NAME}

Example:
- INV-F001-WAREHOUSE_MGMT
- IMP-F002-ORDER_MGMT
- PROD-F003-SLITTING_JOB
```

## Coding Guidelines

### Must Follow

1. **TypeScript Strict Mode**: No `any` allowed
2. **Zod Validation**: All API inputs validated with Zod schemas
3. **Korean Comments**: Business logic comments allowed in Korean
4. **English Code**: Variable names, function names, type names in English
5. **Conventional Commits**: `feat:`, `fix:`, `docs:`, `refactor:`, etc.

### File Naming

| Type      | Convention        | Example                     |
| --------- | ----------------- | --------------------------- |
| Component | PascalCase        | `InventoryTable.tsx`        |
| Utility   | kebab-case        | `date-utils.ts`             |
| Type      | kebab-case        | `inventory.types.ts`        |
| Test      | `.test.ts` suffix | `inventory.service.test.ts` |

### Database Naming

- Tables: `snake_case`, plural (`inventory_items`)
- Columns: `snake_case` (`created_at`, `item_name`)
- Foreign Keys: `{table}_id` (`warehouse_id`)

## Key Documentation

Documents you must read before working:

| Priority | Document               | Path                                             |
| -------- | ---------------------- | ------------------------------------------------ |
| HIGH     | Architecture Overview  | `docs/02-architecture/overview.md`               |
| HIGH     | Data Access Boundaries | `docs/02-architecture/data-access-boundaries.md` |
| HIGH     | State Transitions      | `docs/02-architecture/state-transitions.md`      |
| HIGH     | Feature Map Overview   | `docs/04-feature-map/overview.md`                |
| HIGH     | Domain Glossary        | `docs/references/domain-glossary.md`             |
| MEDIUM   | Operations             | `docs/02-architecture/operations.md`             |
| MEDIUM   | Coding Standards       | `docs/05-development/coding-standards.md`        |
| MEDIUM   | Module Docs            | `docs/03-modules/{module}.md`                    |

## Common Tasks

### Adding a New Feature

1. Check the Feature in Feature Map (`docs/04-feature-map/`)
2. Check if dependency Features are completed
3. Implement Backend API (`apps/api/src/modules/`)
4. Implement Frontend UI (`apps/web/app/`)
5. Write and run tests

### Adding a New Module

1. Copy `docs/03-modules/_template.md`
2. Write module documentation
3. Add Features to Feature Map
4. Create Backend module: `apps/api/src/modules/{module}/`
5. Create Frontend route: `apps/web/app/(dashboard)/{module}/`

### Database Migration

```bash
# Using Supabase CLI
pnpm supabase migration new {migration_name}
pnpm supabase db push
```

## Project Status

| Phase | Module                    | Status      |
| ----- | ------------------------- | ----------- |
| 1     | Foundation (Auth, Config) | Not Started |
| 1     | Inventory                 | Not Started |
| 1     | Import                    | Not Started |
| 1     | Production                | Not Started |
| 2     | TDS                       | Not Started |

**Current Focus**: Setting up Turborepo monorepo structure, then starting Phase 1

## Questions?

If you cannot find the answer in the documents:

1. Search `docs/` directory
2. Check terms in `docs/references/domain-glossary.md`
3. Check business context in `docs/01-overview/business-context.md`
