"use client";

import { cn } from "@/lib/utils";
import type { OrderStatus } from "@repo/shared";

interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

const statusConfig: Record<OrderStatus, { label: string; dotColor: string }> = {
  pending: {
    label: "대기중",
    dotColor: "bg-gray-400",
  },
  field_processing: {
    label: "현장처리중",
    dotColor: "bg-blue-500",
  },
  awaiting_approval: {
    label: "승인대기",
    dotColor: "bg-yellow-500",
  },
  approved: {
    label: "승인완료",
    dotColor: "bg-emerald-500",
  },
  rejected: {
    label: "반려",
    dotColor: "bg-red-500",
  },
  cancelled: {
    label: "취소됨",
    dotColor: "bg-gray-400",
  },
};

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
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
