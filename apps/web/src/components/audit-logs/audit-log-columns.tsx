"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/data-table";
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

export const auditLogColumns: ColumnDef<AuditLog>[] = [
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="일시" />
    ),
    cell: ({ row }) => (
      <span className="text-sm whitespace-nowrap">
        {new Date(row.original.createdAt).toLocaleString("ko-KR")}
      </span>
    ),
  },
  {
    accessorKey: "category",
    header: "카테고리",
    cell: ({ row }) => (
      <StatusBadge variant={categoryVariantMap[row.original.category]} />
    ),
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "action",
    header: "액션",
    cell: ({ row }) => (
      <span className="text-sm font-medium">{row.original.action}</span>
    ),
  },
  {
    accessorKey: "actorEmail",
    header: "사용자",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.actorEmail}
      </span>
    ),
  },
  {
    accessorKey: "targetTable",
    header: "대상",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.targetTable ?? "-"}
      </span>
    ),
  },
];
