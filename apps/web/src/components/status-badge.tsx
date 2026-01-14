"use client";

import { Badge } from "@/components/ui/badge";
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
  { label: string; className: string }
> = {
  active: {
    label: "활성",
    className: "bg-green-100 text-green-800 hover:bg-green-100",
  },
  inactive: {
    label: "비활성",
    className: "bg-gray-100 text-gray-800 hover:bg-gray-100",
  },
  supplier: {
    label: "공급업체",
    className: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  },
  customer: {
    label: "고객",
    className: "bg-purple-100 text-purple-800 hover:bg-purple-100",
  },
  both: {
    label: "공급/고객",
    className: "bg-indigo-100 text-indigo-800 hover:bg-indigo-100",
  },
  roll: {
    label: "롤",
    className: "bg-orange-100 text-orange-800 hover:bg-orange-100",
  },
  sheet: {
    label: "시트",
    className: "bg-teal-100 text-teal-800 hover:bg-teal-100",
  },
};

export function StatusBadge({ variant, className }: StatusBadgeProps) {
  const config = variantConfig[variant];

  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
