# Architecture Decision Records (ADR)

This document records key technical decisions made during the development of the CHISAN Paper platform. All decisions prioritized the speed of delivering business value, scalability, and maintenance costs.

## ADR-001: Adopting Hybrid Architecture (NestJS + Next.js)

### Context

While it is possible to build the entire system using only the full-stack framework Next.js, this platform involves complex business logic (slitting processing yield calculation, transaction processing between multiple warehouses, complex import cost allocation, etc.) beyond simple CRUD. Considering the possibility of providing mobile app-specific APIs or system integration (API) with external logistics partners in the future, a dedicated backend server is needed to fully protect and reuse business logic.

### Decision

We adopt a hybrid architecture that separates **NestJS (Backend)**, which acts as the center of business logic and API server, and **Next.js (Frontend)**, which handles user interface and dashboard functions.

### Consequences

- **Pros**: Responsibilities of backend and frontend are clearly separated. Complex logic can be systematically structured through NestJS's dependency injection (DI) and module system, and the best user experience can be provided using Next.js's App Router and Server Components.
- **Cons**: Initial setup effort increases as two server projects need to be managed and deployed separately. However, this is mitigated through a monorepo (ADR-002).

### Status

**Accepted**

---

## ADR-002: Introduction of Turborepo-based Monorepo

### Context

NestJS backend and Next.js frontend must share the same data models (Entity), API request/response formats (DTO), and utility functions (date calculation, paper size conversion, etc.). Managing these in multi-repositories leads to frequent code copying and high probability of runtime errors due to type definition mismatches.

### Decision

We establish a monorepo structure managing backend, frontend, and shared libraries in a single repository using **Turborepo** and **pnpm workspace**.

### Consequences

- **Pros**: We guarantee 100% type safety between frontend and backend by defining internal packages like `@chisan/api-types` and `@chisan/ui-shared`. Concurrent changes in frontend/backend can be managed in a single PR. Build time is reduced through Turborepo's caching function.
- **Cons**: The team requires a learning curve for monorepo tools (pnpm, Turborepo).

### Status

**Accepted**

---

## ADR-003: Selection of Supabase (PostgreSQL) Infrastructure

### Context

Real-time inventory status is crucial for CHISAN Paper, and relationships between data (Parent Roll - Child Roll) must be strictly defined. Also, since there is no infrastructure management personnel during the initial build, server operation overhead must be minimized.

### Decision

We use **Supabase**, which provides Auth, Realtime, and Storage integration based on the powerful relational database **PostgreSQL**, as the main data platform.

### Consequences

- **Pros**: We can implement secure data access through Row Level Security (RLS) while maintaining the power of SQL. Warehouse staff's stock-in processing is immediately reflected on office staff's dashboards through real-time subscription functions.
- **Cons**: There is a concern about platform dependency, but since standard PostgreSQL is used, migration to a self-hosted DB is possible in the worst case.

### Status

**Accepted**

---

## ADR-004: Building Media Storage via Cloudflare R2

### Context

We need to store various unstructured data such as product photos, order PDFs, and TDS specifications. AWS S3 is the industry standard, but data transfer (Egress) costs can be burdensome.

### Decision

We use **Cloudflare R2** as object storage, which provides an API perfectly compatible with S3 while offering free data transfer.

### Consequences

- **Pros**: Cost relative to storage capacity is very low, and files can be accessed quickly from anywhere in the world by integrating with Cloudflare CDN. Development productivity is high as existing S3 SDKs can be used as is.
- **Cons**: It is simpler than AWS's complex IAM settings, but there may be differences in fine-grained access control settings.

### Status

**Accepted**

---

## ADR-005: Adoption of EvoDev Methodology and FDD/TDD

### Context

Since development proceeds without a dedicated planner or detailed specifications, a system is needed to visualize business requirements and guarantee the quality of developed functions. In particular, errors in precise logic such as paper weight/length calculations lead to financial losses.

### Decision

We define business functions with a Feature Map (DAG) according to the **EvoDev (Evolutionary Development)** methodology and practice **TDD (Test Driven Development)** for core logic. Development units follow **FDD (Feature Driven Development)**.

### Consequences

- **Pros**: We can receive feedback quickly by incrementally developing functions with high business value. The existence of test codes provides psychological safety during refactoring or function changes.
- **Cons**: Effort increases in the early stages of development due to test code writing and Feature Map design.

### Status

**Accepted**

---

## ADR-006: Google OAuth 2.0 Based Authentication System

### Context

We need to simplify account management for internal staff and strengthen security. Access should be possible with a work Google account without a separate sign-up process.

### Decision

We adopt **Google OAuth 2.0** as the only login method by integrating with Supabase Auth.

### Consequences

- **Pros**: The burden of password management disappears, and Google Workspace's security policies (2FA, etc.) can be utilized as is. System access is blocked just by suspending the Google account when an employee leaves.
- **Cons**: System login becomes impossible during Google service outages.

### Status

**Accepted**

---

## ADR-007: Establishing Vitest Based Test Framework

### Context

We need to perform backend (NestJS) and frontend (Next.js) tests quickly and efficiently in a monorepo environment.

### Decision

We adopt **Vitest**, a high-performance test runner in the Vite ecosystem, as the company-wide test framework.

### Consequences

- **Pros**: It provides significantly faster execution speed compared to Jest and can simplify complex TypeScript and ESM settings by sharing Vite settings.
- **Cons**: Initial setup work is required to migrate NestJS's default test settings (Jest) to Vitest.

### Status

**Accepted**
