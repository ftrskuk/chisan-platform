import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { AuditLog, AuditCategory } from "@repo/shared";

const AUDIT_LOGS_KEY = ["audit-logs"];

interface AuditLogsQueryParams {
  category?: AuditCategory;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

interface AuditLogsResponse {
  data: AuditLog[];
  total: number;
  limit: number;
  offset: number;
}

function buildQueryString(params: AuditLogsQueryParams): string {
  const searchParams = new URLSearchParams();
  if (params.category) searchParams.set("category", params.category);
  if (params.from) searchParams.set("from", params.from);
  if (params.to) searchParams.set("to", params.to);
  if (params.limit) searchParams.set("limit", params.limit.toString());
  if (params.offset) searchParams.set("offset", params.offset.toString());
  const qs = searchParams.toString();
  return qs ? `?${qs}` : "";
}

export function useAuditLogs(params: AuditLogsQueryParams = {}) {
  return useQuery({
    queryKey: [...AUDIT_LOGS_KEY, params],
    queryFn: () =>
      api.get<AuditLogsResponse>(
        `/api/v1/audit-logs${buildQueryString(params)}`,
      ),
  });
}
