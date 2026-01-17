"use client";

import { cn } from "@/lib/utils";

type StatusVariant =
  | "active"
  | "inactive"
  | "supplier"
  | "customer"
  | "both"
  | "roll"
  | "sheet"
  | "admin"
  | "manager"
  | "worker"
  | "auth"
  | "user"
  | "inventory"
  | "master_data"
  | "import"
  | "production"
  | "settings"
  | "parent"
  | "slitted"
  | "available"
  | "reserved"
  | "quarantine"
  | "disposed";

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
  admin: {
    label: "관리자",
    dotColor: "bg-red-500",
  },
  manager: {
    label: "매니저",
    dotColor: "bg-blue-500",
  },
  worker: {
    label: "작업자",
    dotColor: "bg-slate-500",
  },
  auth: {
    label: "인증",
    dotColor: "bg-purple-500",
  },
  user: {
    label: "사용자",
    dotColor: "bg-blue-500",
  },
  inventory: {
    label: "재고",
    dotColor: "bg-emerald-500",
  },
  master_data: {
    label: "마스터",
    dotColor: "bg-indigo-500",
  },
  import: {
    label: "수입",
    dotColor: "bg-amber-500",
  },
  production: {
    label: "생산",
    dotColor: "bg-orange-500",
  },
  settings: {
    label: "설정",
    dotColor: "bg-slate-500",
  },
  parent: {
    label: "원지",
    dotColor: "bg-blue-600",
  },
  slitted: {
    label: "슬리팅",
    dotColor: "bg-cyan-500",
  },
  available: {
    label: "가용",
    dotColor: "bg-emerald-500",
  },
  reserved: {
    label: "예약",
    dotColor: "bg-amber-500",
  },
  quarantine: {
    label: "격리",
    dotColor: "bg-red-500",
  },
  disposed: {
    label: "폐기",
    dotColor: "bg-gray-500",
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
