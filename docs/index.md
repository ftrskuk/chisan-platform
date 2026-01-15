# CHISAN Platform Documentation

> CHISAN Paper Integrated Business Platform - Import, Inventory, Production Management System

## Quick Navigation

### 1. Overview

| Document                                              | Description                                       |
| ----------------------------------------------------- | ------------------------------------------------- |
| [Business Context](./01-overview/business-context.md) | Business background, domain description, glossary |
| [Vision & Scope](./01-overview/vision-and-scope.md)   | Project vision, goals, scope definition           |
| [Tech Decisions](./01-overview/tech-decisions.md)     | Architecture Decision Records (ADR)               |

### 2. Architecture

| Document                                                              | Description                                               |
| --------------------------------------------------------------------- | --------------------------------------------------------- |
| [Architecture Overview](./02-architecture/overview.md)                | Hybrid architecture structure                             |
| [Backend (NestJS)](./02-architecture/backend.md)                      | NestJS backend design                                     |
| [Frontend (Next.js)](./02-architecture/frontend.md)                   | Next.js frontend design                                   |
| [Database](./02-architecture/database.md)                             | Supabase PostgreSQL schema principles                     |
| [Data Access Boundaries](./02-architecture/data-access-boundaries.md) | Data access boundaries, RLS policies, API vs Direct rules |
| [State Transitions](./02-architecture/state-transitions.md)           | Core entity state machine definitions                     |
| [Operations](./02-architecture/operations.md)                         | Environment management, backup/restore, DR, monitoring    |

### 3. Modules

| Document                                     | Description                     | Phase   |
| -------------------------------------------- | ------------------------------- | ------- |
| [Module Template](./03-modules/_template.md) | Module documentation template   | -       |
| [Inventory](./03-modules/inventory.md)       | WMS Inventory Management System | Phase 1 |
| [Import](./03-modules/import.md)             | Import/Order Management         | Phase 1 |
| [Production](./03-modules/production.md)     | Slitting Production Management  | Phase 1 |

### 4. Feature Map (EvoDev)

| Document                                                        | Description                                         |
| --------------------------------------------------------------- | --------------------------------------------------- |
| [Feature Map Overview](./04-feature-map/overview.md)            | EvoDev methodology, Feature Map overview            |
| [Phase 1: Foundation](./04-feature-map/phase-1-foundation.md)   | Phase 1 detailed feature specifications             |
| [Foundation Specification](./04-feature-map/foundation-spec.md) | Foundation details (Roles, Permissions, Audit Logs) |

### 5. Development

| Document                                                 | Description                         |
| -------------------------------------------------------- | ----------------------------------- |
| [Getting Started](./05-development/getting-started.md)   | Development environment setup guide |
| [Coding Standards](./05-development/coding-standards.md) | Coding conventions and rules        |

### References

| Document                                           | Description                      |
| -------------------------------------------------- | -------------------------------- |
| [Domain Glossary](./references/domain-glossary.md) | Domain Glossary (Korean/English) |
| [EvoDev Paper](./references/evodev-paper.pdf)      | EvoDev methodology paper         |

---

## Document Status

| Section         | Status   | Last Updated |
| --------------- | -------- | ------------ |
| 01-overview     | Complete | 2026-01-14   |
| 02-architecture | Complete | 2026-01-14   |
| 03-modules      | Complete | 2026-01-14   |
| 04-feature-map  | Complete | 2026-01-14   |
| 05-development  | Complete | 2026-01-14   |
| references      | Complete | 2026-01-14   |

## Reading Order

Recommended reading order for new team members:

1. **Day 1**: Business Context → Vision & Scope → Domain Glossary
2. **Day 2**: Architecture Overview → Tech Decisions
3. **Day 3**: Getting Started → Coding Standards
4. **Day 4**: Feature Map Overview → Phase 1 Foundation
5. **Day 5+**: Module Documentation (Inventory / Import / Production)

## Contributing

Please follow these rules when modifying documents:

1. Technical terms in English, explanations in English
2. Use Mermaid diagrams
3. Update `Last Updated` date when changing
4. Add link to this index.md when adding new documents
