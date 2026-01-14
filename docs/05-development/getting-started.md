# 시작하기 (Getting Started)

이 문서는 CHISAN Platform 개발을 위해 로컬 환경을 구성하고 프로젝트를 시작하는 방법을 안내합니다.

---

## 1. 필수 요구사항 (Prerequisites)

개발을 시작하기 전에 다음 도구들이 설치되어 있어야 합니다.

- **Node.js**: v20.x (LTS) 이상
- **pnpm**: v9.x 이상 (패키지 매니저)
- **Docker**: Supabase 로컬 개발 환경 구성을 위한 Docker Desktop 또는 OrbStack
- **Git**: 소스 코드 버전 관리

---

## 2. 프로젝트 설정 (Project Setup)

### 2.1 저장소 클론
먼저 프로젝트 저장소를 로컬로 클론합니다.

```bash
git clone https://github.com/your-org/chisan-platform.git
cd chisan-platform
```

### 2.2 의존성 설치
pnpm을 사용하여 모노레포 전체의 의존성을 설치합니다.

```bash
pnpm install
```

### 2.3 환경 변수 설정
각 애플리케이션 및 패키지에 필요한 환경 변수 파일을 생성합니다. 루트 디렉토리에 있는 `.env.example` 파일들을 참고하세요.

```bash
# 루트 디렉토리
cp .env.example .env

# Backend (NestJS)
cp apps/api/.env.example apps/api/.env

# Frontend (Next.js)
cp apps/web/.env.local.example apps/web/.env.local
```

---

## 3. 로컬 개발 환경 구성 (Local Development)

### 3.1 Supabase 로컬 실행
CHISAN Platform은 데이터베이스 및 인증을 위해 Supabase를 사용합니다. Docker가 실행 중인지 확인한 후 다음 명령어를 실행합니다.

```bash
# Supabase 서비스 시작
npx supabase start
```

이 명령어는 로컬에 PostgreSQL, Auth, Storage, Realtime 등 필요한 모든 서비스를 띄웁니다. 실행이 완료되면 로컬 대시보드 주소와 API 키들이 출력됩니다.

### 3.2 데이터베이스 마이그레이션
최신 데이터베이스 스키마를 로컬 DB에 적용합니다.

```bash
npx supabase db reset
```
이 명령어는 DB를 초기화하고 모든 마이그레이션과 시드(Seed) 데이터를 적용합니다.

---

## 4. 개발 서버 실행 (Running Development Server)

Turborepo를 사용하여 모든 애플리케이션을 동시에 실행하거나 특정 앱만 선택해서 실행할 수 있습니다.

### 4.1 전체 실행 (추천)
백엔드, 프론트엔드, 공유 패키지를 모두 감시(watch) 모드로 실행합니다.

```bash
pnpm dev
```

### 4.2 특정 애플리케이션만 실행
특정 앱만 실행하려면 `--filter` 플래그를 사용합니다.

```bash
# 프론트엔드(web)만 실행
pnpm dev --filter web

# 백엔드(api)만 실행
pnpm dev --filter api
```

---

## 5. 프로젝트 구조 이해 (Project Structure)

모노레포 구조는 다음과 같이 구성되어 있습니다.

```text
chisan-platform/
├── apps/
│   ├── api/          # NestJS 백엔드 (비즈니스 로직, API)
│   └── web/          # Next.js 프론트엔드 (사용자 인터페이스)
├── packages/
│   └── shared/       # 공유 타입, Zod 스키마, 유틸리티 함수
├── supabase/         # Supabase 설정, 마이그레이션, 시드 데이터
├── docs/             # 프로젝트 문서
├── package.json      # 워크스페이스 설정
└── turbo.json        # Turborepo 설정
```

### 5.1 apps/api (NestJS)
- `src/modules`: 도메인별 모듈 (import, inventory, production 등)
- `src/common`: 전역 가드, 인터셉터, 필터
- `test`: 통합 테스트 및 E2E 테스트

### 5.2 apps/web (Next.js)
- `src/app`: App Router 기반 페이지 구성
- `src/components`: UI 컴포넌트 (shadcn/ui 기반)
- `src/hooks`: 커스텀 리액트 훅

---

## 6. 주요 명령어 (Key Commands)

| 명령어 | 설명 |
| :--- | :--- |
| `pnpm dev` | 모든 앱의 개발 서버 실행 (Turborepo) |
| `pnpm build` | 모든 패키지 및 앱 빌드 |
| `pnpm test` | Vitest를 사용한 전체 유닛 테스트 실행 |
| `pnpm lint` | ESLint 및 Prettier 검사 |
| `pnpm typecheck` | TypeScript 타입 검사 |
| `pnpm supabase start` | 로컬 Supabase 서비스 시작 |
| `pnpm supabase stop` | 로컬 Supabase 서비스 중지 |

---

## 7. 문제 해결 (Troubleshooting)

### 7.1 pnpm 의존성 충돌
`pnpm-lock.yaml` 파일로 인해 설치 오류가 발생하는 경우:
```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### 7.2 Supabase 포트 충돌
이미 5432(PostgreSQL) 또는 8000(API Gateway) 포트를 다른 서비스가 사용 중인 경우, `supabase/config.toml` 파일에서 포트 번호를 수정하세요.

### 7.3 환경 변수 미적용
`.env` 파일을 수정한 후에는 개발 서버를 재시작해야 변경 사항이 반영됩니다.

### 7.4 Turborepo 캐시 초기화
빌드 결과가 이상하거나 캐시로 인해 문제가 발생한다고 판단될 때:
```bash
rm -rf .turbo
```

---

## 8. 다음 단계
- [코딩 표준 (Coding Standards)](./coding-standards.md) 문서를 읽고 개발 규칙을 숙지하세요.
- [아키텍처 개요](../02-architecture/overview.md)를 통해 시스템의 구조를 파악하세요.
