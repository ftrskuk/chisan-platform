# 데이터 접근 경계 (Data Access Boundaries)

이 문서는 CHISAN Platform에서 데이터 접근 패턴과 보안 경계를 정의합니다.
Supabase(직접 접근)와 NestJS API를 언제, 어떻게 사용해야 하는지에 대한 명확한 규칙을 제공합니다.

## 1. 핵심 원칙 (Core Principles)

### 1.1 읽기/쓰기 분리 원칙

| 작업 유형 | 접근 방식 | 근거 |
|----------|----------|------|
| **READ** | Supabase 직접 접근 허용 (RLS 적용) | 성능 최적화, 실시간 기능 활용 |
| **WRITE** | NestJS API 경유 필수 | 감사 로그, 비즈니스 규칙, 트랜잭션 무결성 |

> **원칙**: 모든 쓰기 작업(INSERT, UPDATE, DELETE)은 반드시 NestJS API를 경유해야 합니다.
> Client SDK를 통한 직접 쓰기는 금지됩니다.

### 1.2 쓰기 작업의 API 경유가 필수인 이유

1. **감사 추적 (Audit Trail)**: 모든 중요 변경사항에 대한 이력 기록
2. **비즈니스 규칙 검증**: 상태 전이, 수량 검증 등 도메인 로직 일원화
3. **트랜잭션 안전성**: 다중 테이블 업데이트의 원자성 보장
4. **디버깅 용이성**: API 로그를 통한 문제 추적

---

## 2. 접근 패턴 의사결정 트리 (Decision Tree)

```
┌─────────────────────────────────────────────────────────────────┐
│                    데이터 접근 의사결정 트리                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  READ 작업인가?                                                   │
│  ├─ YES → 실시간 업데이트가 필요한가?                              │
│  │        ├─ YES → Supabase Client SDK (Realtime + RLS)          │
│  │        └─ NO  → SSR이 적합한가? (초기 로딩, SEO)                │
│  │                 ├─ YES → Supabase SSR (Server Component)      │
│  │                 └─ NO  → Supabase Client SDK (RLS)            │
│  │                                                               │
│  └─ NO (WRITE 작업) → NestJS API 필수                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. 테이블별 접근 매트릭스 (Data Access Matrix)

### 3.1 Foundation 테이블

| 테이블 | Client Read | Client Write | Backend Read | Backend Write | Realtime | 비고 |
|--------|:-----------:|:------------:|:------------:|:-------------:|:--------:|------|
| `users` | O (본인만) | X | O | O | X | 프로필 조회는 RLS로 본인 제한 |
| `user_roles` | O (본인만) | X | O | O | X | 역할 할당은 Admin API 전용 |
| `settings` | O | X | O | O | X | 싱글톤, 관리자만 수정 |
| `audit_logs` | X | X | O | O (자동) | X | 시스템 전용, 클라이언트 접근 불가 |

### 3.2 Inventory 테이블

| 테이블 | Client Read | Client Write | Backend Read | Backend Write | Realtime | 비고 |
|--------|:-----------:|:------------:|:------------:|:-------------:|:--------:|------|
| `warehouses` | O | X | O | O | X | 마스터 데이터 |
| `locations` | O | X | O | O | X | 마스터 데이터 |
| `items` | O | X | O | O | X | 마스터 데이터 |
| `stocks` | O | X | O | O | O | 실시간 재고 현황 |
| `stock_movements` | O | X | O | O | X | Append-only 이력 |

### 3.3 Import 테이블

| 테이블 | Client Read | Client Write | Backend Read | Backend Write | Realtime | 비고 |
|--------|:-----------:|:------------:|:------------:|:-------------:|:--------:|------|
| `partners` | O | X | O | O | X | 마스터 데이터 |
| `import_orders` | O | X | O | O | X | 상태 전이는 API 전용 |
| `import_order_items` | O | X | O | O | X | 발주 품목 상세 |
| `shipments` | O | X | O | O | O | ETD/ETA 실시간 추적 |
| `import_costs` | O | X | O | O | X | 재무 데이터 |

### 3.4 Production 테이블

| 테이블 | Client Read | Client Write | Backend Read | Backend Write | Realtime | 비고 |
|--------|:-----------:|:------------:|:------------:|:-------------:|:--------:|------|
| `production_orders` | O | X | O | O | O | 현장 가시성 |
| `slitting_jobs` | O | X | O | O | O | 작업 모니터링 |
| `production_inputs` | O | X | O | O | X | 원자재 이력 |
| `production_outputs` | O | X | O | O | X | 생산물 이력 |
| `machines` | O | X | O | O | X | 마스터 데이터 |

**범례:**
- O = RLS 적용하에 허용
- X = 차단 (정책 없음 또는 명시적 거부)
- O (자동) = 시스템 트리거에 의해서만 기록

---

## 4. 역할 정의 (Role Definitions)

### 4.1 Phase 1 역할 구조

Phase 1에서는 단순한 3단계 역할 구조를 유지합니다.

| 역할 | 코드 | 설명 | 주요 권한 |
|------|------|------|----------|
| **관리자** | `admin` | 시스템 전체 관리 | 모든 기능 접근, 사용자/역할 관리, 감사 로그 조회 |
| **매니저** | `manager` | 부서별 운영 책임 | 마스터 데이터 수정, 보고서 조회, 작업 승인 |
| **작업자** | `worker` | 현장 실무 담당 | 입출고 처리, 생산 기록, 재고 조회 |

### 4.2 역할 확장 원칙

> 역할 세분화(Warehouse Manager, Production Manager 등)는 실제 운영에서 권한 충돌이 발생할 때 도입합니다.
> 초기 과도한 역할 분리는 개발 복잡도를 높이고 권한 관리 비용을 증가시킵니다.

---

## 5. 감사 로그 정책 (Audit Log Policy)

### 5.1 감사 대상 분류

| 분류 | 감사 필수 | 예시 |
|------|:--------:|------|
| **재고 수량 변경** | O | 입고, 출고, 재고 조정, 이동 |
| **재무 데이터 변경** | O | 수입 비용, 단가, 정산 정보 |
| **상태 전이** | O | 발주 상태, 선적 상태, 생산 상태 변경 |
| **마스터 데이터 수정** | 선택 | 품목명, 창고 설명 등 비핵심 필드 |
| **조회 작업** | X | 순수 읽기 작업 |

### 5.2 감사 로그 스키마

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 행위자 정보
  actor_id UUID NOT NULL,           -- 수행자 user_id
  actor_role TEXT NOT NULL,         -- 수행 시점의 역할
  
  -- 대상 정보
  target_table TEXT NOT NULL,       -- 대상 테이블명
  target_id UUID NOT NULL,          -- 대상 레코드 ID
  
  -- 변경 내용
  action TEXT NOT NULL,             -- INSERT, UPDATE, DELETE, STATUS_CHANGE
  changes JSONB,                    -- { field: { old: x, new: y } }
  
  -- 컨텍스트
  ip_address INET,
  user_agent TEXT,
  request_id UUID,                  -- API 요청 추적용
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_audit_logs_target ON audit_logs(target_table, target_id);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
```

### 5.3 감사 로그 접근 제한

```sql
-- RLS: 감사 로그는 admin 역할만 조회 가능
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_read_audit" ON audit_logs
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 클라이언트 쓰기 완전 차단 (백엔드 service_role만 가능)
-- INSERT/UPDATE/DELETE 정책 없음 = 차단
```

---

## 6. RLS 정책 전략 (Row Level Security Strategy)

### 6.1 기본 원칙: Default Deny

모든 테이블은 RLS 활성화 후 명시적 정책만 허용합니다.

```sql
-- 모든 테이블에 적용
ALTER TABLE {table_name} ENABLE ROW LEVEL SECURITY;
-- 정책이 없으면 모든 접근이 차단됨
```

### 6.2 표준 정책 패턴

**패턴 A: 인증된 사용자 전체 읽기 허용 (마스터 데이터)**
```sql
CREATE POLICY "authenticated_read" ON warehouses
FOR SELECT TO authenticated
USING (true);
```

**패턴 B: 본인 데이터만 조회 (사용자 프로필)**
```sql
CREATE POLICY "own_profile_read" ON users
FOR SELECT TO authenticated
USING (id = auth.uid());
```

**패턴 C: 역할 기반 접근 (감사 로그)**
```sql
CREATE POLICY "admin_only_read" ON audit_logs
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);
```

### 6.3 Multi-tenant 준비 (Dormant Capability)

현재는 단일 회사(지산페이퍼) 배포이므로 `org_id` 필터를 강제하지 않습니다.
그러나 향후 확장을 위해 다음을 준비합니다:

1. **스키마 준비**: 주요 테이블에 `org_id` 컬럼 예약 (nullable, 기본값 사용)
2. **정책 구조화**: 정책을 함수로 분리하여 나중에 org_id 조건 추가 용이하게 설계
3. **JWT 클레임**: `app_metadata.org_id`를 통한 조직 식별 구조 예약

```sql
-- 향후 활성화할 패턴 (현재는 주석 처리)
-- CREATE POLICY "org_isolation" ON stocks
-- FOR SELECT TO authenticated
-- USING (
--   org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
-- );
```

---

## 7. NestJS 구현 패턴 (Backend Implementation)

### 7.1 Request-Scoped Supabase Client

```typescript
// libs/supabase/supabase.service.ts
import { Injectable, Scope, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Request } from 'express';

@Injectable({ scope: Scope.REQUEST })
export class SupabaseService {
  private userClient: SupabaseClient;
  private serviceClient: SupabaseClient;

  constructor(@Inject(REQUEST) private request: Request) {
    const jwt = this.extractJwt();

    // 사용자 컨텍스트 클라이언트 (RLS 적용)
    this.userClient = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
      {
        global: {
          headers: jwt ? { Authorization: `Bearer ${jwt}` } : {},
        },
      },
    );

    // 서비스 역할 클라이언트 (RLS 우회)
    this.serviceClient = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
  }

  /**
   * 사용자 컨텍스트 클라이언트 - 일반적인 데이터 접근에 사용
   * RLS 정책이 적용되어 사용자 권한에 맞는 데이터만 반환
   */
  getClient(): SupabaseClient {
    return this.userClient;
  }

  /**
   * 서비스 역할 클라이언트 - 시스템 작업에만 사용
   * 주의: RLS를 우회하므로 감사 로그, 백그라운드 작업 등에만 제한적 사용
   */
  getServiceClient(): SupabaseClient {
    return this.serviceClient;
  }

  private extractJwt(): string | null {
    const authHeader = this.request.headers.authorization;
    return authHeader?.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : null;
  }
}
```

### 7.2 클라이언트 사용 가이드라인

| 클라이언트 | 사용 상황 | 예시 |
|-----------|----------|------|
| `getClient()` | 사용자 대면 작업 | 재고 조회, 발주 생성 |
| `getServiceClient()` | 시스템 작업 | 감사 로그 기록, 백그라운드 잡, 관리자 작업 |

### 7.3 감사 로그 인터셉터

```typescript
// common/interceptors/audit-log.interceptor.ts
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private supabase: SupabaseService) {}

  async intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();
    const { method, path, body, user } = request;

    // 쓰기 작업만 감사
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle().pipe(
        tap(async (response) => {
          await this.supabase.getServiceClient()
            .from('audit_logs')
            .insert({
              actor_id: user.id,
              actor_role: user.role,
              target_table: this.extractTable(path),
              target_id: response?.id || body?.id,
              action: this.mapMethod(method),
              changes: body,
              request_id: request.id,
            });
        }),
      );
    }
    return next.handle();
  }
}
```

---

## 8. Frontend 접근 패턴 (Frontend Implementation)

### 8.1 Server Component (SSR 읽기)

```typescript
// app/inventory/stocks/page.tsx
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export default async function StocksPage() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: () => cookieStore }
  );

  const { data: stocks } = await supabase
    .from('stocks')
    .select(`
      *,
      items (*),
      locations (*, warehouses (*))
    `)
    .order('updated_at', { ascending: false });

  return <StockTable initialData={stocks} />;
}
```

### 8.2 Client Component (Realtime 구독)

```typescript
// components/stock-realtime.tsx
'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { Stock } from '@/types';

export function StockRealtimeUpdates({ 
  initialData 
}: { 
  initialData: Stock[] 
}) {
  const [stocks, setStocks] = useState(initialData);
  const supabase = createBrowserClient(/* ... */);

  useEffect(() => {
    const channel = supabase
      .channel('stocks-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'stocks' },
        (payload) => {
          // 변경 사항 반영
          setStocks(current => 
            updateStockList(current, payload)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return <StockList stocks={stocks} />;
}
```

### 8.3 쓰기 작업 (API 경유 필수)

```typescript
// lib/api/inventory.ts
export async function createStockIn(data: StockInDto) {
  const response = await fetch('/api/v1/inventory/inbound', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Auth header는 middleware에서 자동 첨부
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new ApiError(response);
  }

  return response.json();
}

// 절대 금지: 클라이언트에서 직접 쓰기
// supabase.from('stocks').insert(...)  // 이렇게 하면 안됨!
```

---

## 9. Realtime 활성화 테이블 (Realtime Configuration)

### 9.1 Realtime 대상 테이블

| 테이블 | Realtime | 사용 목적 |
|--------|:--------:|----------|
| `stocks` | O | 재고 현황판 실시간 갱신 |
| `shipments` | O | 선적 추적 보드 실시간 상태 |
| `production_orders` | O | 생산 현황 모니터링 |
| `slitting_jobs` | O | 작업 진행 상태 실시간 표시 |

### 9.2 Realtime 제외 테이블

- **마스터 데이터**: `warehouses`, `locations`, `items`, `partners`, `machines`
- **재무 데이터**: `import_costs`
- **이력 데이터**: `stock_movements`, `production_inputs`, `production_outputs`, `audit_logs`

### 9.3 활성화 방법 (Supabase Dashboard 또는 SQL)

```sql
-- Supabase에서 Realtime Publication 설정
ALTER PUBLICATION supabase_realtime ADD TABLE stocks;
ALTER PUBLICATION supabase_realtime ADD TABLE shipments;
ALTER PUBLICATION supabase_realtime ADD TABLE production_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE slitting_jobs;
```

---

## 10. 보안 체크리스트 (Security Checklist)

배포 전 필수 확인 사항:

### 10.1 RLS 설정
- [ ] 모든 테이블에 `ENABLE ROW LEVEL SECURITY` 적용
- [ ] 모든 테이블에 적절한 SELECT 정책 정의
- [ ] `audit_logs` 테이블 클라이언트 쓰기 차단 확인

### 10.2 환경 변수
- [ ] `SUPABASE_SERVICE_ROLE_KEY`가 프론트엔드에 노출되지 않음
- [ ] `NEXT_PUBLIC_*` 변수에 민감 정보 없음

### 10.3 API 보안
- [ ] 모든 쓰기 엔드포인트에 `@UseGuards(JwtAuthGuard)` 적용
- [ ] 역할 기반 접근 제어(`@Roles()`) 적용

### 10.4 테스트
- [ ] 각 역할(admin, manager, worker)별 RLS 정책 테스트
- [ ] 클라이언트 직접 쓰기 시도 시 차단 확인
- [ ] 감사 로그 정상 기록 확인

---

## 부록: 정책 소유권 및 관리

### 정책 소유권
- **담당**: Backend 개발팀
- **위치**: `supabase/migrations/` (버전 관리)
- **리뷰**: RLS 정책 변경 시 필수 코드 리뷰

### 정책 변경 프로세스
1. 로컬에서 마이그레이션 파일 생성
2. 테스트 환경에서 정책 검증
3. PR 생성 및 보안 관점 리뷰
4. 스테이징 배포 및 QA
5. 프로덕션 배포
