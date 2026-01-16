"use client";

import { useState } from "react";

import { useAuditLogs } from "@/hooks/api";
import { DataTable } from "@/components/data-table";
import { auditLogColumns, AuditLogDetail } from "@/components/audit-logs";
import { FormSheet } from "@/components/form-sheet";
import { PageHeader } from "@/components/layout";
import type { AuditLog, AuditCategory } from "@repo/shared";

const CATEGORY_OPTIONS: { label: string; value: AuditCategory }[] = [
  { label: "인증", value: "auth" },
  { label: "사용자", value: "user" },
  { label: "재고", value: "inventory" },
  { label: "수입", value: "import" },
  { label: "생산", value: "production" },
  { label: "설정", value: "settings" },
];

const DEFAULT_PAGE_SIZE = 100;

export default function AuditLogsPage() {
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [pagination] = useState({
    limit: DEFAULT_PAGE_SIZE,
    offset: 0,
  });

  const { data: response, isLoading } = useAuditLogs(pagination);
  const logs = response?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="감사 로그"
        description="시스템의 모든 주요 활동 기록을 확인합니다."
      />

      <DataTable
        columns={auditLogColumns}
        data={logs}
        isLoading={isLoading}
        searchKey="actorEmail"
        searchPlaceholder="사용자 이메일 검색..."
        filterableColumns={[
          {
            id: "category",
            title: "카테고리",
            options: CATEGORY_OPTIONS,
          },
        ]}
        onRowClick={(log) => setSelectedLog(log)}
      />

      <FormSheet
        open={!!selectedLog}
        onOpenChange={(open) => !open && setSelectedLog(null)}
        title="로그 상세"
        description="감사 로그의 상세 정보를 확인합니다."
      >
        {selectedLog && <AuditLogDetail log={selectedLog} />}
      </FormSheet>
    </div>
  );
}
