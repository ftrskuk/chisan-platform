"use client";

import { cn } from "@/lib/utils";
import type { JobStatus } from "@repo/shared";

interface JobStatusBadgeProps {
  status: JobStatus;
  className?: string;
}

const statusConfig: Record<JobStatus, { label: string; dotColor: string }> = {
  pending: { label: "대기", dotColor: "bg-gray-400" },
  ready: { label: "준비완료", dotColor: "bg-blue-500" },
  in_progress: { label: "작업중", dotColor: "bg-yellow-500" },
  completed: { label: "완료", dotColor: "bg-emerald-500" },
  approved: { label: "승인완료", dotColor: "bg-purple-500" },
};

export function JobStatusBadge({ status, className }: JobStatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className={cn("h-1.5 w-1.5 rounded-full", config.dotColor)} />
      <span className="text-sm font-medium text-foreground">
        {config.label}
      </span>
    </div>
  );
}
