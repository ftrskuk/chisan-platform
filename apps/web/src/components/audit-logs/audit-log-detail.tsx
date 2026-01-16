"use client";

import { StatusBadge } from "@/components/status-badge";
import type { AuditLog, AuditCategory } from "@repo/shared";

const categoryVariantMap: Record<
  AuditCategory,
  "auth" | "user" | "inventory" | "import" | "production" | "settings"
> = {
  auth: "auth",
  user: "user",
  inventory: "inventory",
  import: "import",
  production: "production",
  settings: "settings",
};

interface AuditLogDetailProps {
  log: AuditLog;
}

export function AuditLogDetail({ log }: AuditLogDetailProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            일시
          </label>
          <p className="mt-1 text-sm">
            {new Date(log.createdAt).toLocaleString("ko-KR")}
          </p>
        </div>
        <div>
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            카테고리
          </label>
          <div className="mt-1">
            <StatusBadge variant={categoryVariantMap[log.category]} />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            액션
          </label>
          <p className="mt-1 text-sm font-medium">{log.action}</p>
        </div>
        <div>
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            사용자
          </label>
          <p className="mt-1 text-sm">{log.actorEmail}</p>
        </div>
      </div>

      {log.targetTable && (
        <div>
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            대상 테이블
          </label>
          <p className="mt-1 text-sm">{log.targetTable}</p>
        </div>
      )}

      {log.targetId && (
        <div>
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            대상 ID
          </label>
          <p className="mt-1 text-sm font-mono">{log.targetId}</p>
        </div>
      )}

      {log.changes && Object.keys(log.changes).length > 0 && (
        <div>
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            변경 내용
          </label>
          <pre className="mt-2 overflow-auto rounded-md bg-slate-50 p-3 text-xs">
            {JSON.stringify(log.changes, null, 2)}
          </pre>
        </div>
      )}

      {log.metadata && Object.keys(log.metadata).length > 0 && (
        <div>
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            메타데이터
          </label>
          <pre className="mt-2 overflow-auto rounded-md bg-slate-50 p-3 text-xs">
            {JSON.stringify(log.metadata, null, 2)}
          </pre>
        </div>
      )}

      {log.ipAddress && (
        <div>
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            IP 주소
          </label>
          <p className="mt-1 text-sm font-mono">{log.ipAddress}</p>
        </div>
      )}

      <div>
        <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          로그 ID
        </label>
        <p className="mt-1 text-sm font-mono text-muted-foreground">{log.id}</p>
      </div>
    </div>
  );
}
