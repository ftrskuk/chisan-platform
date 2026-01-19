"use client";

import { cn } from "@/lib/utils";
import type { JobRollStatus } from "@repo/shared";

interface JobRollStatusBadgeProps {
  status: JobRollStatus;
  className?: string;
}

const statusConfig: Record<JobRollStatus, { label: string; dotColor: string }> =
  {
    registered: { label: "등록됨", dotColor: "bg-gray-400" },
    in_progress: { label: "진행중", dotColor: "bg-blue-500" },
    completed: { label: "완료", dotColor: "bg-emerald-500" },
    cancelled: { label: "취소됨", dotColor: "bg-red-500" },
  };

export function JobRollStatusBadge({
  status,
  className,
}: JobRollStatusBadgeProps) {
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
