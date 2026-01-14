# 코딩 표준 (Coding Standards)

CHISAN Platform 프로젝트의 일관된 코드 품질과 협업 효율성을 위한 코딩 가이드라인입니다. 모든 기여자는 이 규칙을 준수해야 합니다.

---

## 1. TypeScript 규칙

### 1.1 Strict Mode 준수
`tsconfig.json`의 `strict: true` 옵션은 필수입니다. 타입 체크를 우회하지 마세요.

### 1.2 `any` 사용 금지
- `any` 타입 사용은 원칙적으로 금지합니다.
- 타입을 알 수 없는 경우 `unknown`을 사용하고, 타입 가드(Type Guard)를 통해 타입을 좁혀서 사용하세요.

### 1.3 타입 정의 위치
- 특정 컴포넌트나 함수에서만 사용되는 타입: 해당 파일 내부에 정의
- 여러 곳에서 공유되는 타입: `packages/shared` 또는 해당 모듈의 `types.ts`에 정의
- API 요청/응답 스키마: `packages/shared` 내의 Zod 스키마로 정의

---

## 2. 명명 규칙 (Naming Conventions)

### 2.1 파일 및 디렉토리
- **파일명**: `kebab-case.ts` (예: `user-profile.tsx`, `auth-service.ts`)
- **디렉토리**: `kebab-case`

### 2.2 코드 내 식별자
- **컴포넌트 (React)**: `PascalCase` (예: `DashboardHeader`)
- **함수/변수**: `camelCase` (예: `getUserData`, `isLoaded`)
- **인터페이스/타입**: `PascalCase` (예: `UserRecord`, `TableProps`)
- **상수**: `UPPER_SNAKE_CASE` (예: `MAX_RETRY_COUNT`)
- **DB 테이블/컬럼**: `snake_case` (예: `user_profiles`, `created_at`)

---

## 3. NestJS 백엔드 규칙

### 3.1 모듈 구조
기능 단위로 모듈을 분리하며, 각 모듈은 다음과 같은 폴더 구조를 가집니다.
```text
src/modules/user/
├── user.module.ts
├── user.controller.ts
├── user.service.ts
├── user.repository.ts
├── dto/             # 요청/응답 객체 정의
└── entities/        # DB 엔티티 정의 (TypeORM 또는 Prisma)
```

### 3.2 Controller, Service, Repository 패턴
- **Controller**: HTTP 요청 처리 및 입력값 검증 (Zod Pipe 활용)
- **Service**: 비즈니스 로직 수행. 다른 서비스나 레포지토리 호출
- **Repository**: 데이터베이스 직접 접근 로직 담당

### 3.3 DTO 검증 (Zod)
`packages/shared`에 정의된 Zod 스키마를 사용하여 요청 데이터를 검증합니다.

```typescript
// backend code example
@Post()
@UsePipes(new ZodValidationPipe(createUserSchema))
async create(@Body() createUserDto: CreateUserDto) {
  return this.userService.create(createUserDto);
}
```

---

## 4. Next.js 프론트엔드 규칙

### 4.1 Server vs Client Components
- **기본 전략**: 모든 컴포넌트는 우선 **Server Component**로 작성합니다.
- **Client Component 사용 기준**:
  - `useState`, `useEffect`, `useContext` 등 훅 사용 시
  - 이벤트 리스너(onClick, onChange 등) 등록 시
  - 브라우저 API(window, localStorage 등) 사용 시
  - 파일 최상단에 `'use client'` 지시어를 명시합니다.

### 4.2 API 호출 패턴
- Server Component: `fetch`를 직접 사용하여 데이터를 가져옵니다 (Next.js 캐싱 활용).
- Client Component: `React Query` (TanStack Query)를 사용하여 상태 관리 및 캐싱을 처리합니다.

---

## 5. 컴포넌트 작성 규칙

### 5.1 Props 인터페이스 정의
모든 컴포넌트의 Props는 명시적으로 타입을 정의합니다.

```tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  isLoading?: boolean;
}

export function Button({ variant = 'primary', isLoading, children, ...props }: ButtonProps) {
  return (
    <button className={cn('btn', variant)} {...props}>
      {isLoading ? <Spinner /> : children}
    </button>
  );
}
```

### 5.2 Tailwind CSS 클래스 순서
가독성을 위해 다음 순서로 클래스를 배치합니다. (Prettier 플러그인 사용 권장)
1. Layout (position, z-index, display, flex, grid)
2. Box Model (width, height, margin, padding)
3. Typography (font, text-align, color)
4. Visual (background, border, shadow)
5. Misc (cursor, transition, hover/focus states)

---

## 6. Git 규칙

### 6.1 브랜치 전략
- `main`: 상시 배포 가능한 안정적인 브랜치
- `develop`: 개발 중심 브랜치
- `feature/기능명`: 새로운 기능 개발
- `bugfix/버그명`: 버그 수정
- `hotfix/긴급수정`: 운영 환경 긴급 수정

### 6.2 Commit Message 형식 (Conventional Commits)
형식: `<type>(<scope>): <subject>`

- `feat`: 새로운 기능 추가
- `fix`: 버그 수정
- `docs`: 문서 수정
- `style`: 코드 포맷팅, 세미콜론 누락 등 (코드 변경 없음)
- `refactor`: 코드 리팩토링
- `test`: 테스트 추가 및 수정
- `chore`: 빌드 업무 수정, 패키지 매니저 설정 등

예시: `feat(api): 입고 지시서 생성 API 구현`

---

## 7. 테스트 규칙

### 7.1 단위 테스트 (Unit Test)
- 순수 함수나 작은 컴포넌트 단위를 테스트합니다.
- 파일 위치: 테스트할 파일과 동일한 위치에 `filename.spec.ts` 또는 `filename.test.tsx`로 생성합니다.
- 도구: Vitest

### 7.2 통합 테스트 (Integration Test)
- 모듈 간의 협력을 테스트합니다. (예: Controller -> Service -> DB)
- `apps/api/test` 또는 `apps/web/test` 폴더 내에 구성합니다.

---

## 8. 코드 리뷰 체크리스트

PR 승인 전 다음 항목을 반드시 확인합니다.
- [ ] TypeScript 타입 정의에 `any`가 없는가?
- [ ] 비즈니스 로직이 Service 레이어에 적절히 분리되었는가?
- [ ] 에러 처리가 적절히 되어 있는가? (Try-Catch, Error Boundary 등)
- [ ] 새로운 기능에 대한 테스트 코드가 작성되었는가?
- [ ] 민감한 정보(API Key 등)가 코드에 포함되지 않았는가?
- [ ] 접근성(A11y) 기준을 준수하는가? (aria-label 등)
- [ ] 불필요한 콘솔 로그가 제거되었는가?
