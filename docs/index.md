# CHISAN Platform Documentation

> 지산페이퍼 통합 비즈니스 플랫폼 - 수입, 재고, 생산 관리 시스템

## Quick Navigation

### 1. Overview (개요)

| Document | Description |
|----------|-------------|
| [Business Context](./01-overview/business-context.md) | 사업 배경, 도메인 설명, 용어집 |
| [Vision & Scope](./01-overview/vision-and-scope.md) | 프로젝트 비전, 목표, 범위 정의 |
| [Tech Decisions](./01-overview/tech-decisions.md) | 기술 결정 기록 (ADR) |

### 2. Architecture (아키텍처)

| Document | Description |
|----------|-------------|
| [Architecture Overview](./02-architecture/overview.md) | Hybrid 아키텍처 전체 구조 |
| [Backend (NestJS)](./02-architecture/backend.md) | NestJS 백엔드 설계 |
| [Frontend (Next.js)](./02-architecture/frontend.md) | Next.js 프론트엔드 설계 |
| [Database](./02-architecture/database.md) | Supabase PostgreSQL 스키마 원칙 |

### 3. Modules (모듈)

| Document | Description | Phase |
|----------|-------------|-------|
| [Module Template](./03-modules/_template.md) | 모듈 문서 작성 템플릿 | - |
| [Inventory (재고관리)](./03-modules/inventory.md) | WMS 재고관리 시스템 | Phase 1 |
| [Import (수입관리)](./03-modules/import.md) | 수입/발주 관리 | Phase 1 |
| [Production (생산관리)](./03-modules/production.md) | 슬리팅 생산관리 | Phase 1 |

### 4. Feature Map (EvoDev)

| Document | Description |
|----------|-------------|
| [Feature Map Overview](./04-feature-map/overview.md) | EvoDev 방법론, Feature Map 개요 |
| [Phase 1: Foundation](./04-feature-map/phase-1-foundation.md) | Phase 1 상세 Feature 명세 |

### 5. Development (개발 가이드)

| Document | Description |
|----------|-------------|
| [Getting Started](./05-development/getting-started.md) | 개발환경 셋업 가이드 |
| [Coding Standards](./05-development/coding-standards.md) | 코딩 컨벤션 및 규칙 |

### References (참고 자료)

| Document | Description |
|----------|-------------|
| [Domain Glossary](./references/domain-glossary.md) | 도메인 용어집 (한/영) |
| [EvoDev Paper](./references/evodev-paper.pdf) | EvoDev 방법론 논문 |

---

## Document Status

| Section | Status | Last Updated |
|---------|--------|--------------|
| 01-overview | Complete | 2026-01-14 |
| 02-architecture | Complete | 2026-01-14 |
| 03-modules | Complete | 2026-01-14 |
| 04-feature-map | Complete | 2026-01-14 |
| 05-development | Complete | 2026-01-14 |
| references | Complete | 2026-01-14 |

## Reading Order (권장 순서)

새로 합류한 팀원을 위한 권장 문서 읽기 순서:

1. **Day 1**: Business Context → Vision & Scope → Domain Glossary
2. **Day 2**: Architecture Overview → Tech Decisions
3. **Day 3**: Getting Started → Coding Standards
4. **Day 4**: Feature Map Overview → Phase 1 Foundation
5. **Day 5+**: 담당 모듈 문서 (Inventory / Import / Production)

## Contributing

문서 수정 시 다음 규칙을 따라주세요:

1. 기술 용어는 영어로, 설명은 한국어로 작성
2. Mermaid 다이어그램 활용 권장
3. 변경 시 `Last Updated` 날짜 업데이트
4. 새 문서 추가 시 이 index.md에도 링크 추가
