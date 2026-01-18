"use client";

import { cn } from "@/lib/utils";
import type { ScheduleStatus } from "@repo/shared";

interface ScheduleStatusBadgeProps {
  status: ScheduleStatus;
  className?: string;
}

const statusConfig: Record<
  ScheduleStatus,
  { label: string; dotColor: string }
> = {
  draft: { label: "초안", dotColor: "bg-gray-400" },
  published: { label: "배포됨", dotColor: "bg-blue-500" },
  in_progress: { label: "진행중", dotColor: "bg-yellow-500" },
  completed: { label: "완료", dotColor: "bg-emerald-500" },
};

export function ScheduleStatusBadge({
  status,
  className,
}: ScheduleStatusBadgeProps) {
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
