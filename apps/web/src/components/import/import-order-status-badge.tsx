"use client";

import { cn } from "@/lib/utils";
import type { ImportOrderStatus } from "@repo/shared";

interface ImportOrderStatusBadgeProps {
  status: ImportOrderStatus;
  className?: string;
}

const statusConfig: Record<
  ImportOrderStatus,
  { label: string; dotColor: string }
> = {
  draft: {
    label: "초안",
    dotColor: "bg-gray-400",
  },
  confirmed: {
    label: "확정",
    dotColor: "bg-blue-500",
  },
  partially_shipped: {
    label: "부분선적",
    dotColor: "bg-indigo-500",
  },
  shipped: {
    label: "선적완료",
    dotColor: "bg-purple-500",
  },
  arrived: {
    label: "도착",
    dotColor: "bg-cyan-500",
  },
  customs_clearing: {
    label: "통관중",
    dotColor: "bg-yellow-500",
  },
  cleared: {
    label: "통관완료",
    dotColor: "bg-lime-500",
  },
  completed: {
    label: "완료",
    dotColor: "bg-emerald-500",
  },
  cancelled: {
    label: "취소",
    dotColor: "bg-red-500",
  },
};

export function ImportOrderStatusBadge({
  status,
  className,
}: ImportOrderStatusBadgeProps) {
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
