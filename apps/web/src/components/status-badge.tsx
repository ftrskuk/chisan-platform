"use client";

import { cn } from "@/lib/utils";

type StatusVariant =
  | "active"
  | "inactive"
  | "supplier"
  | "customer"
  | "both"
  | "roll"
  | "sheet";

interface StatusBadgeProps {
  variant: StatusVariant;
  className?: string;
}

const variantConfig: Record<
  StatusVariant,
  { label: string; dotColor: string }
> = {
  active: {
    label: "활성",
    dotColor: "bg-emerald-500",
  },
  inactive: {
    label: "비활성",
    dotColor: "bg-gray-400",
  },
  supplier: {
    label: "공급업체",
    dotColor: "bg-blue-500",
  },
  customer: {
    label: "고객",
    dotColor: "bg-purple-500",
  },
  both: {
    label: "공급/고객",
    dotColor: "bg-indigo-500",
  },
  roll: {
    label: "롤",
    dotColor: "bg-orange-500",
  },
  sheet: {
    label: "시트",
    dotColor: "bg-teal-500",
  },
};

export function StatusBadge({ variant, className }: StatusBadgeProps) {
  const config = variantConfig[variant];

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className={cn("h-1.5 w-1.5 rounded-full", config.dotColor)} />
      <span className="text-sm font-medium text-foreground">
        {config.label}
      </span>
    </div>
  );
}
