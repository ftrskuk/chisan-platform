# Getting Started

This document guides you on how to configure the local environment and start the project for CHISAN Platform development.

---

## 1. Prerequisites

The following tools must be installed before starting development.

- **Node.js**: v20.x (LTS) or higher
- **pnpm**: v9.x or higher (Package Manager)
- **Docker**: Docker Desktop or OrbStack for Supabase local development environment
- **Git**: Source code version control

---

## 2. Project Setup

### 2.1 Clone Repository

First, clone the project repository locally.

```bash
git clone https://github.com/your-org/chisan-platform.git
cd chisan-platform
```

### 2.2 Install Dependencies

Install dependencies for the entire monorepo using pnpm.

```bash
pnpm install
```

### 2.3 Environment Variable Setup

Create environment variable files required for each application and package. Refer to the `.env.example` files in the root directory.

```bash
# Root directory
cp .env.example .env

# Backend (NestJS)
cp apps/api/.env.example apps/api/.env

# Frontend (Next.js)
cp apps/web/.env.local.example apps/web/.env.local
```

---

## 3. Local Development Environment Setup

### 3.1 Start Supabase Locally

CHISAN Platform uses Supabase for database and authentication. Run the following command after checking if Docker is running.

```bash
# Start Supabase services
npx supabase start
```

This command launches all necessary services such as PostgreSQL, Auth, Storage, Realtime locally. When execution is complete, the local dashboard address and API keys are output.

### 3.2 Database Migration

Apply the latest database schema to the local DB.

```bash
npx supabase db reset
```

This command initializes the DB and applies all migrations and seed data.

---

## 4. Running Development Server

You can run all applications simultaneously or select specific apps using Turborepo.

### 4.1 Run All (Recommended)

Run backend, frontend, and shared packages all in watch mode.

```bash
pnpm dev
```

### 4.2 Run Specific Application Only

Use the `--filter` flag to run only specific apps.

```bash
# Run frontend (web) only
pnpm dev --filter web

# Run backend (api) only
pnpm dev --filter api
```

---

## 5. Understanding Project Structure

The monorepo structure is composed as follows.

```text
chisan-platform/
├── apps/
│   ├── api/          # NestJS backend (Business Logic, API)
│   └── web/          # Next.js frontend (User Interface)
├── packages/
│   └── shared/       # Shared types, Zod schemas, utility functions
├── supabase/         # Supabase config, migrations, seed data
├── docs/             # Project documentation
├── package.json      # Workspace settings
└── turbo.json        # Turborepo settings
```

### 5.1 apps/api (NestJS)

- `src/modules`: Domain-specific modules (import, inventory, production, etc.)
- `src/common`: Global guards, interceptors, filters
- `test`: Integration tests and E2E tests

### 5.2 apps/web (Next.js)

- `src/app`: App Router based page composition
- `src/components`: UI components (shadcn/ui based)
- `src/hooks`: Custom React hooks

---

## 6. Key Commands

| Command               | Description                                     |
| :-------------------- | :---------------------------------------------- |
| `pnpm dev`            | Run development server for all apps (Turborepo) |
| `pnpm build`          | Build all packages and apps                     |
| `pnpm test`           | Run entire unit tests using Vitest              |
| `pnpm lint`           | ESLint and Prettier check                       |
| `pnpm typecheck`      | TypeScript type check                           |
| `pnpm supabase start` | Start local Supabase services                   |
| `pnpm supabase stop`  | Stop local Supabase services                    |

---

## 7. Troubleshooting

### 7.1 pnpm Dependency Conflict

If installation errors occur due to `pnpm-lock.yaml` file:

```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### 7.2 Supabase Port Conflict

If port 5432 (PostgreSQL) or 8000 (API Gateway) is already in use by another service, modify the port number in the `supabase/config.toml` file.

### 7.3 Environment Variables Not Applied

Changes to `.env` files require restarting the development server to take effect.

### 7.4 Turborepo Cache Clear

When build results are strange or issues are suspected due to cache:

```bash
rm -rf .turbo
```

---

## 8. Next Steps

- Read [Coding Standards](./coding-standards.md) document to understand development rules.
- Understand the system structure through [Architecture Overview](../02-architecture/overview.md).
