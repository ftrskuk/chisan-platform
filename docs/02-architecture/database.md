# 데이터베이스 설계 (Database Design)

CHISAN Platform은 Supabase에서 제공하는 PostgreSQL을 핵심 저장소로 사용하며, 데이터 무결성과 보안을 최우선으로 설계합니다.

## 1. Supabase PostgreSQL 설정

-   **Extensions**: `pg_stat_statements`, `pgcrypto`, `uuid-ossp` 등 필요한 확장 기능을 활성화하여 사용합니다.
-   **Realtime**: 특정 테이블(예: `inventory_status`)에 대해 Realtime 기능을 활성화하여 실시간 업데이트를 지원합니다.

## 2. 스키마 설계 원칙 (Schema Design Principles)

1.  **UUID 사용**: 모든 기본 키(Primary Key)는 `uuid` 타입을 사용하며, 기본값으로 `gen_random_uuid()`를 사용합니다.
2.  **외래 키 제약 조건**: 모든 관계는 물리적인 Foreign Key로 연결하여 데이터 무결성을 보장합니다.
3.  **정규화**: 중복 데이터를 최소화하기 위해 3차 정규형(3NF) 이상을 지향하되, 조회 성능이 중요한 경우 제한적으로 비정규화를 허용합니다.
4.  **타임스탬프**: 모든 테이블은 `created_at`, `updated_at`, `deleted_at` (Soft Delete용) 필드를 포함합니다.

## 3. Row Level Security (RLS) 패턴

보안 강화를 위해 데이터베이스 레벨에서 접근 제어를 수행합니다.

-   **Public Access**: 비인증 사용자는 어떠한 데이터도 읽거나 쓸 수 없습니다.
-   **Authenticated Access**: 인증된 사용자만 자신의 권한(Role)에 맞는 데이터를 조회/수정할 수 있습니다.
-   **Service Role**: 백엔드 서버(NestJS)는 `service_role` 키를 사용하여 RLS를 우회하고 복잡한 시스템 로직을 수행합니다.

### 예시 RLS 정책

```sql
-- 사용자가 소속된 회사의 데이터만 조회 가능하도록 제한
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view inventory of their organization"
ON inventory FOR SELECT
USING (auth.uid() IN (
  SELECT user_id FROM organization_members WHERE org_id = inventory.org_id
));
```

## 4. 마이그레이션 전략 (Migration Strategy)

-   **Supabase CLI**: 로컬 개발 환경에서 마이그레이션 파일을 생성하고 테스트한 후, 스테이징 및 운영 환경에 배포합니다.
-   **Prisma (Optional)**: 백엔드에서 ORM으로 Prisma를 사용하는 경우, `prisma migrate` 명령어를 통해 스키마 변경 사항을 관리할 수 있습니다.

## 5. 명명 규칙 (Naming Conventions)

-   **Tables**: Snake Case, 복수형 (예: `parent_rolls`, `stock_items`).
-   **Columns**: Snake Case (예: `item_code`, `warehouse_id`).
-   **Indexes**: `idx_{table_name}_{column_name}`.
-   **Foreign Keys**: `fk_{table_name}_{column_name}`.

## 6. 공통 패턴 (Common Patterns)

### 6.1 Soft Delete
데이터를 물리적으로 삭제하지 않고 `deleted_at` 컬럼에 타임스탬프를 기록하여 논리적으로 삭제 처리합니다.

### 6.2 Audit Logs
중요 테이블의 변경 이력을 추적하기 위해 별도의 `audit_logs` 테이블 또는 데이터베이스 트리거(Trigger)를 사용합니다.

```sql
CREATE TRIGGER tr_audit_inventory
AFTER UPDATE ON inventory
FOR EACH ROW EXECUTE FUNCTION log_inventory_changes();
```

## 7. 인벤토리 모듈 예시 스키마 (Example Schema)

지산페이퍼의 핵심 도메인인 '원지(Parent Roll)' 관리를 위한 스키마 예시입니다.

```sql
CREATE TABLE parent_rolls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roll_number TEXT UNIQUE NOT NULL, -- 바코드 번호
  item_code TEXT NOT NULL,
  grammage INTEGER NOT NULL,       -- 평량 (g/m²)
  width INTEGER NOT NULL,          -- 지폭 (mm)
  diameter INTEGER,                -- 지름 (mm)
  initial_weight DECIMAL NOT NULL, -- 입고 시 중량 (kg)
  current_weight DECIMAL NOT NULL, -- 현재 잔여 중량 (kg)
  warehouse_id UUID REFERENCES warehouses(id),
  supplier_id UUID REFERENCES partners(id),
  status TEXT DEFAULT 'available', -- available, in_use, consumed, damaged
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);
```

## 8. 관계 및 계층 구조 (Relationship & Hierarchy)

지산페이퍼 도메인의 핵심인 '부모-자식' 관계를 처리하는 방식입니다.

-   **Parent-Child Tracking**: 원지(Parent Roll)에서 슬리팅 가공을 통해 생성된 결과물들은 `parent_id`를 통해 원본을 참조합니다. 이를 통해 품질 문제 발생 시 역추적(Traceability)이 가능합니다.
-   **Recursive Queries**: PostgreSQL의 `WITH RECURSIVE` 쿼리를 사용하여 여러 단계의 가공 과정을 거친 제품의 이력을 효율적으로 조회합니다.

### 이력 추적 테이블 (Slitting Logs)

```sql
CREATE TABLE slitting_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_roll_id UUID REFERENCES parent_rolls(id),
  operator_id UUID,
  machine_id TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  yield_percentage DECIMAL, -- 수율
  notes TEXT
);
```

## 9. 성능 최적화 (Performance Optimization)

-   **Indexing Strategy**: 
    -   `roll_number`, `item_code` 등 빈번한 검색 조건에 B-Tree 인덱스 적용.
    -   `status`와 같이 카디널리티가 낮은 컬럼에는 부분 인덱스(Partial Index) 고려.
-   **JSONB 활용**: 데이터 구조가 가변적인 설정값이나 외부 시스템 연동 로그 등은 `JSONB` 타입을 사용하여 유연성을 확보하되, 필요한 경우 GIN 인덱스를 추가합니다.
-   **Materialized Views**: 복잡한 월간 통계나 대시보드용 데이터는 구체화된 뷰(Materialized View)를 사용하여 조회 성능을 극대화하고 주기적으로 갱신합니다.

## 10. 백업 및 복구 (Backup & Recovery)

-   **Point-in-Time Recovery (PITR)**: Supabase의 PITR 기능을 활성화하여 특정 시점의 데이터로 정밀하게 복구할 수 있는 체계를 갖춥니다.
-   **Automated Backups**: 매일 정해진 시간에 전체 데이터베이스 백업을 수행하고 별도의 안전한 저장소(Cloudflare R2 등)에 아카이빙합니다.

## 11. 데이터 보안 및 규정 준수 (Data Security)

-   **Encryption at Rest**: 모든 데이터는 디스크 저장 시 AES-256 방식으로 암호화됩니다.
-   **Encryption in Transit**: 클라이언트와 데이터베이스 간의 모든 통신은 SSL/TLS 1.3을 통해 암호화됩니다.
-   **Sensitive Data**: 개인정보나 중요 비즈니스 정보가 포함된 컬럼은 별도의 암호화 로직을 거쳐 저장하거나 접근 권한을 엄격히 제한합니다.
