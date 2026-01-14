# CHISAN Platform - AI Agent Guidelines

> AI 에이전트가 이 프로젝트에서 작업할 때 참고해야 할 컨텍스트 문서

## Project Overview

**CHISAN Platform**은 지산페이퍼의 통합 비즈니스 플랫폼입니다.

- **회사**: 지산페이퍼 (CHISAN Paper)
- **사업**: 종이 수입, 창고 관리, 유통, 슬리팅(절단) 가공
- **제품**: 롤 페이퍼 80%, 시트 20%
- **사용자**: 내부 직원 6명 → 20명 (2년 내)

## Architecture

### Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | NestJS 11 |
| Frontend | Next.js 15 (App Router) |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth (Google OAuth) |
| Storage | Cloudflare R2 |
| Monorepo | Turborepo + pnpm |
| Testing | Vitest, Playwright |
| UI | shadcn/ui, Tailwind CSS v4 |

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
   - `inventory` - 재고관리 WMS (최우선)
   - `import` - 수입/발주 관리
   - `production` - 슬리팅 생산관리

2. **Phase 2**:
   - `tds` - 기술자료(TDS) 관리

3. **Future**:
   - `approval` - 결재 시스템
   - `sales` - 영업/수주 관리
   - `wiki` - 사내 위키
   - `analytics` - 분석/리포트

## Domain Context

### Key Domain Terms

| Korean | English | Description |
|--------|---------|-------------|
| 원지 | Parent Roll | 슬리팅 전 대형 롤 |
| 슬리팅 | Slitting | 원지를 소형 롤로 절단하는 공정 |
| 입고 | Stock-In | 재고 입고 |
| 출고 | Stock-Out | 재고 출고 |
| 발주 | Order/PO | 구매 주문 |
| 거래처 | Partner | 공급업체 또는 고객 |
| 평량 | Grammage | 종이 무게 (g/m²) |
| 지폭 | Width | 롤/시트 폭 (mm) |
| 지름 | Diameter | 롤 직경 (mm) |

### Business Flow

```
[수입사] → 발주(PO) → 선적(Shipment) → 입항/통관 → 입고(Stock-In)
                                                      ↓
                                              [창고 - 원지 재고]
                                                      ↓
                                            생산지시(Production Order)
                                                      ↓
                                              출고 → 슬리팅 → 입고
                                                      ↓
                                          [창고 - 슬리팅 롤/시트 재고]
                                                      ↓
                                              출고 → [고객사]
```

## Development Methodology

### EvoDev (Feature-Driven Development)

이 프로젝트는 **EvoDev** 방법론을 따릅니다:

1. **Feature Map (DAG)**: Feature 간 의존성을 DAG로 모델링
2. **Feature Specification**: 각 Feature에 대해 Business/UI/Data flow 정의
3. **Iterative Development**: DAG topology 순서로 반복 개발
4. **Multi-layer Context**: Business → Design → Implementation 계층적 컨텍스트

### Feature ID Convention

```
{MODULE}-F{NUMBER}-{SHORT_NAME}

예시:
- INV-F001-WAREHOUSE_MGMT
- IMP-F002-ORDER_MGMT
- PROD-F003-SLITTING_JOB
```

## Coding Guidelines

### Must Follow

1. **TypeScript Strict Mode**: `any` 사용 금지
2. **Zod Validation**: 모든 API 입력은 Zod 스키마로 검증
3. **Korean Comments**: 비즈니스 로직 주석은 한국어 허용
4. **English Code**: 변수명, 함수명, 타입명은 영어
5. **Conventional Commits**: `feat:`, `fix:`, `docs:`, `refactor:` 등

### File Naming

| Type | Convention | Example |
|------|------------|---------|
| Component | PascalCase | `InventoryTable.tsx` |
| Utility | kebab-case | `date-utils.ts` |
| Type | kebab-case | `inventory.types.ts` |
| Test | `.test.ts` suffix | `inventory.service.test.ts` |

### Database Naming

- Tables: `snake_case`, plural (`inventory_items`)
- Columns: `snake_case` (`created_at`, `item_name`)
- Foreign Keys: `{table}_id` (`warehouse_id`)

## Key Documentation

작업 전 반드시 읽어야 할 문서:

| Priority | Document | Path |
|----------|----------|------|
| HIGH | Architecture Overview | `docs/02-architecture/overview.md` |
| HIGH | Feature Map Overview | `docs/04-feature-map/overview.md` |
| HIGH | Domain Glossary | `docs/references/domain-glossary.md` |
| MEDIUM | Coding Standards | `docs/05-development/coding-standards.md` |
| MEDIUM | Module Docs | `docs/03-modules/{module}.md` |

## Common Tasks

### Adding a New Feature

1. Feature Map에서 해당 Feature 확인 (`docs/04-feature-map/`)
2. 의존성 Feature가 완료되었는지 확인
3. Backend API 구현 (`apps/api/src/modules/`)
4. Frontend UI 구현 (`apps/web/app/`)
5. 테스트 작성 및 실행

### Adding a New Module

1. `docs/03-modules/_template.md` 복사
2. 모듈 문서 작성
3. Feature Map에 Feature들 추가
4. Backend 모듈 생성: `apps/api/src/modules/{module}/`
5. Frontend 라우트 생성: `apps/web/app/(dashboard)/{module}/`

### Database Migration

```bash
# Supabase CLI 사용
pnpm supabase migration new {migration_name}
pnpm supabase db push
```

## Project Status

| Phase | Module | Status |
|-------|--------|--------|
| 1 | Foundation (Auth, Config) | Not Started |
| 1 | Inventory | Not Started |
| 1 | Import | Not Started |
| 1 | Production | Not Started |
| 2 | TDS | Not Started |

**Current Focus**: Turborepo monorepo 구조 셋업 후 Phase 1 시작 예정

## Questions?

문서에서 답을 찾을 수 없는 경우:

1. `docs/` 디렉토리 검색
2. `docs/references/domain-glossary.md` 용어 확인
3. `docs/01-overview/business-context.md` 비즈니스 맥락 확인
