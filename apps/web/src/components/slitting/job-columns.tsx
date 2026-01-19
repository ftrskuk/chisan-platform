"use client";

import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { DataTableColumnHeader } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { JobStatusBadge } from "./job-status-badge";
import type { SlittingJobWithRelations } from "@repo/shared";

import { isV2SlittingJob, formatItemLabel } from "@/lib/slitting-utils";
import { JobActions } from "./job-actions";

export function jobColumns(): ColumnDef<SlittingJobWithRelations>[] {
  return [
    {
      accessorKey: "sequenceNumber",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="#순서" />
      ),
      cell: ({ row }) => {
        const isV2 = isV2SlittingJob(row.original);
        return (
          <div className="flex items-center gap-2">
            <Link
              href={`/production/slitting/jobs/${row.original.id}`}
              className="font-mono text-sm text-primary hover:underline"
            >
              #{row.original.sequenceNumber}
            </Link>
            {isV2 && (
              <Badge variant="outline" className="text-xs px-1.5 py-0">
                V2
              </Badge>
            )}
          </div>
        );
      },
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
        const job = row.original;

        if (isV2SlittingJob(job)) {
          const registeredRolls = job.jobRolls?.length ?? 0;
          const completedRolls =
            job.jobRolls?.filter((r) => r.status === "completed").length ?? 0;

          return (
            <div className="flex flex-col text-sm">
              <span className="font-medium">{formatItemLabel(job.item)}</span>
              <span className="text-muted-foreground text-xs">
                {job.parentWidthMm}mm | 롤 {completedRolls}/{registeredRolls}/
                {job.plannedRollCount}
              </span>
            </div>
          );
        }

        const stock = job.parentStock;
        return (
          <div className="flex flex-col text-sm">
            <span className="font-medium">{formatItemLabel(stock?.item)}</span>
            <span className="text-muted-foreground text-xs">
              {stock?.item?.brand?.name ?? "-"} |{" "}
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
