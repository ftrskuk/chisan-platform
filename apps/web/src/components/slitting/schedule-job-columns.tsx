"use client";

import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { DataTableColumnHeader } from "@/components/data-table";
import { JobStatusBadge } from "./job-status-badge";
import { JobActions } from "./job-actions";
import type { SlittingJobWithRelations } from "@repo/shared";

export function scheduleJobColumns(): ColumnDef<SlittingJobWithRelations>[] {
  return [
    {
      accessorKey: "sequenceNumber",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="#순서" />
      ),
      cell: ({ row }) => (
        <Link
          href={`/production/slitting/jobs/${row.original.id}`}
          className="font-mono text-sm text-primary hover:underline"
        >
          #{row.original.sequenceNumber}
        </Link>
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
    },
    {
      accessorKey: "startedAt",
      header: "시작시간",
      cell: ({ row }) => (
        <span className="text-sm whitespace-nowrap">
          {row.original.startedAt
            ? new Date(row.original.startedAt).toLocaleTimeString("ko-KR", {
                hour: "2-digit",
                minute: "2-digit",
              })
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
            ? new Date(row.original.completedAt).toLocaleTimeString("ko-KR", {
                hour: "2-digit",
                minute: "2-digit",
              })
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
