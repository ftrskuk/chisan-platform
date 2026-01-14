# 프런트엔드 아키텍처 (Frontend Architecture)

CHISAN Platform의 프런트엔드는 Next.js 15+ 프레임워크와 React 19의 최신 기능을 활용하여 구축됩니다.

## 1. App Router 구조 (App Router Structure)

Next.js의 App Router를 기반으로 하며, 기능 단위의 레이아웃과 데이터 중심의 페이지 설계를 지향합니다.

```text
apps/web/app/
├── (auth)/             # 인증 관련 그룹 (login, signup)
├── (dashboard)/        # 대시보드 메인 레이아웃 그룹
│   ├── inventory/      # 재고 관리 모듈
│   ├── import/         # 수입 관리 모듈
│   ├── production/     # 생산 관리 모듈
│   └── layout.tsx      # 사이드바, 헤더 포함 공통 레이아웃
├── api/                # Route Handlers (필요 시)
└── layout.tsx          # Root layout (Provider, Global CSS)
```

## 2. Server vs Client Components 전략

-   **Server Components (Default)**: 데이터 페칭, 검색 엔진 최적화(SEO), 초기 렌더링에 우선적으로 사용합니다. 백엔드 API와의 직접적인 통신을 수행합니다.
-   **Client Components**: 사용자 인터랙션(클릭, 입력), 상태 관리, 브라우저 API 사용이 필요한 경우에만 사용합니다. 파일 최상단에 `'use client'` 지시어를 명시합니다.

| 구분 | 사용 사례 |
| :--- | :--- |
| **Server** | 목록 조회, 상세 페이지 데이터 로드, 정적 텍스트 렌더링 |
| **Client** | 폼 제출, 모달/팝업 제어, 대시보드 차트 인터랙션, 상태 기반 필터링 |

## 3. 상태 관리 접근 방식 (State Management)

-   **Server State**: `React Query` (또는 SWR)를 사용하여 서버 데이터 캐싱, 동기화, 리프레시를 관리합니다.
-   **Global UI State**: 전역적인 UI 상태(테마, 사이드바 개폐 등)는 `Zustand`를 사용하여 가볍게 관리합니다.
-   **Local State**: 컴포넌트 내부의 간단한 상태는 `useState`, `useReducer`를 사용합니다.

## 4. API 연동 패턴 (API Integration)

`fetch` API를 래핑한 커스텀 유틸리티 또는 SDK를 사용합니다.

```typescript
// apps/web/lib/api-client.ts
export const apiClient = async <T>(path: string, options?: RequestInit): Promise<T> => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) throw new Error('API Error');
  return res.json();
};
```

## 5. UI 컴포넌트 라이브러리 (UI Library)

-   **Core**: **Tailwind CSS v4**를 사용하여 유틸리티 퍼스트 스타일링을 수행합니다.
-   **Components**: **shadcn/ui**를 기반으로 하여 접근성(Accessibility)이 보장된 커스텀 컴포넌트를 구성합니다.
-   **Icons**: `lucide-react`를 표준 아이콘 라이브러리로 사용합니다.

## 6. 폼 핸들링 (Form Handling)

`react-hook-form`과 `Zod`를 결합하여 강력한 타입 안정성과 유효성 검사를 제공합니다.

```typescript
// apps/web/components/inventory/stock-in-form.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateStockInSchema } from '@chisan/shared'; // Shared package 사용

export function StockInForm() {
  const form = useForm({
    resolver: zodResolver(CreateStockInSchema),
  });

  const onSubmit = (data) => {
    // API 호출
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* shadcn/ui components */}
    </form>
  );
}
```

## 7. 인증 흐름 (Authentication Flow)

1.  **Login**: 사용자가 로그인 폼 제출 -> Supabase Auth SDK 호출.
2.  **Session**: Supabase가 관리하는 세션(Cookie)을 통해 인증 상태 유지.
3.  **Middleware**: `middleware.ts`에서 세션을 확인하여 보호된 경로(Dashboard 등)에 대한 접근을 제어합니다.
4.  **Header**: Backend API 호출 시 세션 토큰을 Authorization 헤더에 포함시킵니다.

## 8. 파일 구조 컨벤션 (File Structure Conventions)

-   `components/`: 재사용 가능한 UI 컴포넌트.
-   `hooks/`: 커스텀 리액트 훅.
-   `lib/`: 외부 라이브러리 설정 및 유틸리티.
-   `services/`: 도메인별 API 호출 로직.
-   `types/`: 프런트엔드 전용 타입 정의.

## 9. 반응형 디자인 및 테마 (Responsive Design & Theme)

-   **Mobile First**: 모든 UI는 모바일 환경을 우선적으로 고려하여 설계됩니다 (현장 작업자 대응).
-   **Dark Mode**: `next-themes`를 사용하여 시스템 설정 또는 수동 선택에 따른 다크 모드를 지원합니다.
-   **CSS Variables**: Tailwind v4의 새로운 기능을 활용하여 테마 컬러 및 디자인 토큰을 관리합니다.
