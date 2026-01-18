"use client";

import { cn } from "@/lib/utils";
import type { MachineStatus } from "@repo/shared";

interface MachineStatusBadgeProps {
  status: MachineStatus;
  className?: string;
}

const statusConfig: Record<MachineStatus, { label: string; dotColor: string }> =
  {
    idle: { label: "대기", dotColor: "bg-gray-400" },
    running: { label: "가동중", dotColor: "bg-emerald-500" },
    maintenance: { label: "정비중", dotColor: "bg-orange-500" },
  };

export function MachineStatusBadge({
  status,
  className,
}: MachineStatusBadgeProps) {
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
