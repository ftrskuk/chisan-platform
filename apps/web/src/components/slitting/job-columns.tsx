"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/data-table";
import { JobStatusBadge } from "./job-status-badge";
import type { SlittingJobWithRelations } from "@repo/shared";

import { JobActions } from "./job-actions";

export function jobColumns(): ColumnDef<SlittingJobWithRelations>[] {
  return [
    {
      accessorKey: "sequenceNumber",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="#순서" />
      ),
      cell: ({ row }) => (
        <span className="font-mono text-sm">
          #{row.original.sequenceNumber}
        </span>
      ),
    },
    {
      accessorKey: "schedule.scheduleNumber",
      header: "일정번호",
      cell: ({ row }) => (
        <span className="font-mono text-sm">
          {row.original.schedule.scheduleNumber}
        </span>
      ),
    },
    {
      accessorKey: "machine.name",
      header: "기계",
      cell: ({ row }) => (
        <span className="text-sm font-medium">{row.original.machine.name}</span>
      ),
    },
    {
      id: "parentStock",
      header: "원지정보",
      cell: ({ row }) => {
        const stock = row.original.parentStock;
        const item = stock?.item;
        return (
          <div className="flex flex-col text-sm">
            <span className="font-medium">
              {item?.paperType.nameKo ?? item?.paperType.nameEn ?? "-"}{" "}
              {item?.grammage ? `${item.grammage}g` : ""}
            </span>
            <span className="text-muted-foreground text-xs">
              {item?.brand?.name ?? "-"} |{" "}
              {stock?.widthMm ? `${stock.widthMm}mm` : "-"}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "operator.displayName",
      header: "작업자",
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.operator?.displayName ?? "-"}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "상태",
      cell: ({ row }) => <JobStatusBadge status={row.original.status} />,
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: "startedAt",
      header: "시작시간",
      cell: ({ row }) => (
        <span className="text-sm whitespace-nowrap">
          {row.original.startedAt
            ? new Date(row.original.startedAt).toLocaleString("ko-KR")
            : "-"}
        </span>
      ),
    },
    {
      accessorKey: "completedAt",
      header: "완료시간",
      cell: ({ row }) => (
        <span className="text-sm whitespace-nowrap">
          {row.original.completedAt
            ? new Date(row.original.completedAt).toLocaleString("ko-KR")
            : "-"}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => <JobActions job={row.original} />,
    },
  ];
}
