# CHISAN Platform

> 지산페이퍼 통합 비즈니스 플랫폼 - 수입, 재고, 생산 관리 시스템

## Overview

**CHISAN Platform**은 지산페이퍼의 핵심 비즈니스 프로세스(수입 → 재고 → 생산 → 유통)를 통합 관리하는 ERP 시스템입니다.

### Company

- **회사명**: 지산페이퍼 (CHISAN Paper)
- **사업**: 종이 수입, 창고 관리, 유통, 슬리팅(절단) 가공
- **제품**: 롤 페이퍼 80%, 시트 20%

## Status

🚧 **초기 셋업 단계** - Turborepo 모노레포 구조 구축 중

## Tech Stack

| Category | Technology |
|----------|------------|
| **Backend** | NestJS 11 |
| **Frontend** | Next.js 15 (App Router) |
| **Database** | Supabase PostgreSQL |
| **Auth** | Supabase Auth (Google OAuth) |
| **Storage** | Cloudflare R2 |
| **Monorepo** | Turborepo + pnpm |
| **Testing** | Vitest, Playwright |
| **UI** | shadcn/ui, Tailwind CSS v4 |

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

| Module | Description | Phase | Status |
|--------|-------------|-------|--------|
| **inventory** | 재고관리 WMS | Phase 1 | Not Started |
| **import** | 수입/발주 관리 | Phase 1 | Not Started |
| **production** | 슬리팅 생산관리 | Phase 1 | Not Started |
| **tds** | 기술자료(TDS) 관리 | Phase 2 | Not Started |

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

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in development mode |
| `pnpm build` | Build all apps for production |
| `pnpm test` | Run tests |
| `pnpm lint` | Run linter |
| `pnpm dev --filter api` | Start only backend |
| `pnpm dev --filter web` | Start only frontend |

## Documentation

전체 문서는 [`docs/`](./docs/index.md) 디렉토리에서 확인하세요.

### Quick Links

| Document | Description |
|----------|-------------|
| [Documentation Index](./docs/index.md) | 문서 네비게이션 |
| [Business Context](./docs/01-overview/business-context.md) | 사업 배경 및 도메인 |
| [Architecture Overview](./docs/02-architecture/overview.md) | 기술 아키텍처 |
| [Getting Started](./docs/05-development/getting-started.md) | 개발환경 셋업 |
| [Coding Standards](./docs/05-development/coding-standards.md) | 코딩 컨벤션 |
| [Domain Glossary](./docs/references/domain-glossary.md) | 도메인 용어집 |

### For AI Agents

AI 에이전트는 [`agent.md`](./agent.md) 파일을 먼저 읽어주세요.

## Development Methodology

이 프로젝트는 **EvoDev** (Feature-Driven Development with Feature Map) 방법론을 따릅니다.

- Feature Map (DAG)으로 기능 간 의존성 모델링
- 반복적 개발 사이클
- Business → Design → Implementation 계층적 컨텍스트

자세한 내용: [`docs/04-feature-map/overview.md`](./docs/04-feature-map/overview.md)

## Contributing

1. Feature Map에서 작업할 Feature 확인
2. 의존성 Feature 완료 여부 확인
3. `feature/{feature-id}` 브랜치 생성
4. 구현 및 테스트
5. PR 생성

### Commit Convention

```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
refactor: 코드 리팩토링
test: 테스트 추가/수정
chore: 빌드, 설정 변경
```

## License

Private - CHISAN Paper Co., Ltd.
