"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { AuditLog, AuditCategory } from "@repo/shared";

const CATEGORY_LABELS: Record<AuditCategory, string> = {
  auth: "인증",
  user: "사용자",
  inventory: "재고",
  import: "수입",
  production: "생산",
  settings: "설정",
};

interface AuditLogsResponse {
  data: AuditLog[];
  total: number;
  limit: number;
  offset: number;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    category: "",
    from: "",
    to: "",
  });
  const [pagination, setPagination] = useState({
    offset: 0,
    limit: 20,
    total: 0,
  });

  useEffect(() => {
    const doFetch = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (filters.category) params.set("category", filters.category);
        if (filters.from) params.set("from", filters.from);
        if (filters.to) params.set("to", filters.to);
        params.set("limit", pagination.limit.toString());
        params.set("offset", pagination.offset.toString());

        const response = await api.get<AuditLogsResponse>(
          `/api/v1/audit-logs?${params.toString()}`,
        );
        setLogs(response.data);
        setPagination((prev) => ({ ...prev, total: response.total }));
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch audit logs",
        );
      } finally {
        setLoading(false);
      }
    };
    doFetch();
  }, [
    filters.category,
    filters.from,
    filters.to,
    pagination.offset,
    pagination.limit,
  ]);

  const handlePrevPage = () => {
    setPagination((prev) => ({
      ...prev,
      offset: Math.max(0, prev.offset - prev.limit),
    }));
  };

  const handleNextPage = () => {
    setPagination((prev) => ({
      ...prev,
      offset: prev.offset + prev.limit,
    }));
  };

  const categories: AuditCategory[] = [
    "auth",
    "user",
    "inventory",
    "import",
    "production",
    "settings",
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">감사 로그</h1>
        <p className="mt-1 text-sm text-gray-500">
          시스템의 모든 주요 활동 기록을 확인합니다.
        </p>
      </div>

      <div className="flex flex-wrap gap-4 rounded-lg border border-gray-200 bg-white p-4">
        <div>
          <label className="block text-xs font-medium text-gray-700">
            카테고리
          </label>
          <select
            value={filters.category}
            onChange={(e) => {
              setFilters((prev) => ({ ...prev, category: e.target.value }));
              setPagination((prev) => ({ ...prev, offset: 0 }));
            }}
            className="mt-1 block w-40 rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">전체</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_LABELS[cat]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700">
            시작일
          </label>
          <input
            type="datetime-local"
            value={filters.from}
            onChange={(e) => {
              setFilters((prev) => ({ ...prev, from: e.target.value }));
              setPagination((prev) => ({ ...prev, offset: 0 }));
            }}
            className="mt-1 block rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700">
            종료일
          </label>
          <input
            type="datetime-local"
            value={filters.to}
            onChange={(e) => {
              setFilters((prev) => ({ ...prev, to: e.target.value }));
              setPagination((prev) => ({ ...prev, offset: 0 }));
            }}
            className="mt-1 block rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="flex items-end">
          <button
            onClick={() => {
              setFilters({ category: "", from: "", to: "" });
              setPagination((prev) => ({ ...prev, offset: 0 }));
            }}
            className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            초기화
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">로딩 중...</div>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    일시
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    카테고리
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    액션
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    사용자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    대상
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {logs.map((log) => (
                  <AuditLogRow key={log.id} log={log} />
                ))}
              </tbody>
            </table>

            {logs.length === 0 && (
              <div className="py-12 text-center text-gray-500">
                감사 로그가 없습니다.
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              총 {pagination.total}개 중 {pagination.offset + 1} -{" "}
              {Math.min(pagination.offset + pagination.limit, pagination.total)}
              개
            </p>
            <div className="flex gap-2">
              <button
                onClick={handlePrevPage}
                disabled={pagination.offset === 0}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                이전
              </button>
              <button
                onClick={handleNextPage}
                disabled={
                  pagination.offset + pagination.limit >= pagination.total
                }
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                다음
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function AuditLogRow({ log }: { log: AuditLog }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr
        className="cursor-pointer hover:bg-gray-50"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
          {new Date(log.createdAt).toLocaleString("ko-KR")}
        </td>
        <td className="whitespace-nowrap px-6 py-4">
          <span
            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
              log.category === "auth"
                ? "bg-purple-100 text-purple-800"
                : log.category === "user"
                  ? "bg-blue-100 text-blue-800"
                  : log.category === "settings"
                    ? "bg-gray-100 text-gray-800"
                    : "bg-green-100 text-green-800"
            }`}
          >
            {CATEGORY_LABELS[log.category as AuditCategory] ?? log.category}
          </span>
        </td>
        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
          {log.action}
        </td>
        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
          {log.actorEmail}
        </td>
        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
          {log.targetTable ? `${log.targetTable}` : "-"}
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={5} className="bg-gray-50 px-6 py-4">
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-gray-700">ID:</span>{" "}
                <span className="text-gray-500">{log.id}</span>
              </div>
              {log.targetId && (
                <div>
                  <span className="font-medium text-gray-700">대상 ID:</span>{" "}
                  <span className="text-gray-500">{log.targetId}</span>
                </div>
              )}
              {log.changes && (
                <div>
                  <span className="font-medium text-gray-700">변경 내용:</span>
                  <pre className="mt-1 overflow-auto rounded bg-gray-100 p-2 text-xs">
                    {JSON.stringify(log.changes, null, 2)}
                  </pre>
                </div>
              )}
              {log.metadata && (
                <div>
                  <span className="font-medium text-gray-700">메타데이터:</span>
                  <pre className="mt-1 overflow-auto rounded bg-gray-100 p-2 text-xs">
                    {JSON.stringify(log.metadata, null, 2)}
                  </pre>
                </div>
              )}
              {log.ipAddress && (
                <div>
                  <span className="font-medium text-gray-700">IP 주소:</span>{" "}
                  <span className="text-gray-500">{log.ipAddress}</span>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
