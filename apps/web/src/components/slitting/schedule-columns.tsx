"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/data-table";
import { ScheduleStatusBadge } from "./schedule-status-badge";
import type { SlittingScheduleWithStats } from "@repo/shared";

export function scheduleColumns(): ColumnDef<SlittingScheduleWithStats>[] {
  return [
    {
      accessorKey: "scheduleNumber",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="일정번호" />
      ),
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.scheduleNumber}</span>
      ),
    },
    {
      accessorKey: "scheduledDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="예정일" />
      ),
      cell: ({ row }) => (
        <span className="text-sm whitespace-nowrap">
          {row.original.scheduledDate
            ? new Date(row.original.scheduledDate).toLocaleDateString("ko-KR")
            : "-"}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "상태",
      cell: ({ row }) => <ScheduleStatusBadge status={row.original.status} />,
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: "totalJobs",
      header: "총작업",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.totalJobs}</span>
      ),
    },
    {
      accessorKey: "pendingJobs",
      header: "대기",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.pendingJobs}</span>
      ),
    },
    {
      accessorKey: "completedJobs",
      header: "완료",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.completedJobs}</span>
      ),
    },
    {
      accessorKey: "approvedJobs",
      header: "승인",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.approvedJobs}</span>
      ),
    },
    {
      accessorKey: "createdByName",
      header: "생성자",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.createdByName ?? "-"}</span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="생성일시" />
      ),
      cell: ({ row }) => (
        <span className="text-sm whitespace-nowrap">
          {new Date(row.original.createdAt).toLocaleString("ko-KR")}
        </span>
      ),
    },
  ];
}
