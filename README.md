# CHISAN Platform

> CHISAN Paper Integrated Business Platform - Import, Inventory, Production Management System

## Overview

**CHISAN Platform** is an ERP system that integrates and manages CHISAN Paper's core business processes (Import → Inventory → Production → Distribution).

### Company

- **Company Name**: CHISAN Paper
- **Business**: Paper import, warehouse management, distribution, slitting (cutting) processing
- **Products**: Roll paper 80%, Sheet 20%

## Status

🚧 **Initial Setup Phase** - Building Turborepo monorepo structure

## Tech Stack

| Category     | Technology                   |
| ------------ | ---------------------------- |
| **Backend**  | NestJS 11                    |
| **Frontend** | Next.js 15 (App Router)      |
| **Database** | Supabase PostgreSQL          |
| **Auth**     | Supabase Auth (Google OAuth) |
| **Storage**  | Cloudflare R2                |
| **Monorepo** | Turborepo + pnpm             |
| **Testing**  | Vitest, Playwright           |
| **UI**       | shadcn/ui, Tailwind CSS v4   |

## Project Structure

```
chisan-platform/
├── apps/
│   ├── api/          # NestJS backend
│   └── web/          # Next.js frontend
├── packages/
│   └── shared/       # Shared types, validators
├── docs/             # Documentation
│   ├── 01-overview/      # Business context, vision
│   ├── 02-architecture/  # Technical architecture
│   ├── 03-modules/       # Module specifications
│   ├── 04-feature-map/   # EvoDev feature maps
│   ├── 05-development/   # Developer guides
│   └── references/       # Glossary, papers
├── turbo.json
└── pnpm-workspace.yaml
```

## Modules

| Module         | Description                           | Phase   | Status      |
| -------------- | ------------------------------------- | ------- | ----------- |
| **inventory**  | Inventory Management WMS              | Phase 1 | Not Started |
| **import**     | Import/Order Management               | Phase 1 | Not Started |
| **production** | Slitting Production Management        | Phase 1 | Not Started |
| **tds**        | Technical Data Sheet (TDS) Management | Phase 2 | Not Started |

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker (optional, for local Supabase)

### Installation

```bash
# Clone repository
git clone https://github.com/your-org/chisan-platform.git
cd chisan-platform

# Install dependencies
pnpm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your credentials

# Start development server
pnpm dev
```

### Commands

| Command                 | Description                        |
| ----------------------- | ---------------------------------- |
| `pnpm dev`              | Start all apps in development mode |
| `pnpm build`            | Build all apps for production      |
| `pnpm test`             | Run tests                          |
| `pnpm lint`             | Run linter                         |
| `pnpm dev --filter api` | Start only backend                 |
| `pnpm dev --filter web` | Start only frontend                |

## Documentation

Check the full documentation in the [`docs/`](./docs/index.md) directory.

### Quick Links

| Document                                                      | Description                    |
| ------------------------------------------------------------- | ------------------------------ |
| [Documentation Index](./docs/index.md)                        | Documentation Navigation       |
| [Business Context](./docs/01-overview/business-context.md)    | Business Background and Domain |
| [Architecture Overview](./docs/02-architecture/overview.md)   | Technical Architecture         |
| [Getting Started](./docs/05-development/getting-started.md)   | Environment Setup              |
| [Coding Standards](./docs/05-development/coding-standards.md) | Coding Conventions             |
| [Domain Glossary](./docs/references/domain-glossary.md)       | Domain Glossary                |

### For AI Agents

AI agents should read the [`agent.md`](./agent.md) file first.

## Development Methodology

This project follows the **EvoDev** (Feature-Driven Development with Feature Map) methodology.

- Modeling dependencies between functions with Feature Map (DAG)
- Iterative development cycle
- Hierarchical context of Business → Design → Implementation

Details: [`docs/04-feature-map/overview.md`](./docs/04-feature-map/overview.md)

## Contributing

1. Check the Feature to work on in Feature Map
2. Check if dependency Features are completed
3. Create `feature/{feature-id}` branch
4. Implement and test
5. Create PR

### Commit Convention

```
feat: Add new feature
fix: Fix bug
docs: Update documentation
refactor: Refactor code
test: Add/Update tests
chore: Build, config changes
```

## License

Private - CHISAN Paper Co., Ltd.
