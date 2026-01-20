"use client";

import { cn } from "@/lib/utils";
import type { ShipmentStatus } from "@repo/shared";

interface ShipmentStatusBadgeProps {
  status: ShipmentStatus;
  className?: string;
}

const statusConfig: Record<
  ShipmentStatus,
  { label: string; dotColor: string }
> = {
  pending: {
    label: "대기",
    dotColor: "bg-gray-400",
  },
  departed: {
    label: "출항",
    dotColor: "bg-blue-500",
  },
  in_transit: {
    label: "운송중",
    dotColor: "bg-indigo-500",
  },
  arrived: {
    label: "도착",
    dotColor: "bg-cyan-500",
  },
  customs_hold: {
    label: "통관보류",
    dotColor: "bg-yellow-500",
  },
  customs_cleared: {
    label: "통관완료",
    dotColor: "bg-lime-500",
  },
  delivered: {
    label: "입고완료",
    dotColor: "bg-emerald-500",
  },
  cancelled: {
    label: "취소",
    dotColor: "bg-red-500",
  },
};

export function ShipmentStatusBadge({
  status,
  className,
}: ShipmentStatusBadgeProps) {
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
