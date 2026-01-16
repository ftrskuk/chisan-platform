import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, CheckCircle } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    direction: "up" | "down" | "neutral";
  };
  className?: string;
}

export function MetricCard({
  label,
  value,
  icon,
  trend,
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-slate-300 hover:shadow-md",
        className,
      )}
    >
      <div className="flex items-center justify-between space-y-0 pb-2">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <div className="h-5 w-5 text-slate-400 [&>svg]:h-full [&>svg]:w-full">
          {icon}
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <div className="text-2xl font-bold tracking-tight text-slate-900">
          {value}
        </div>
        {trend && (
          <div
            className={cn("flex items-center gap-1.5 text-xs font-medium", {
              "text-emerald-600": trend.direction === "up",
              "text-red-600": trend.direction === "down",
              "text-slate-500": trend.direction === "neutral",
            })}
          >
            {trend.direction === "up" && <TrendingUp className="h-3.5 w-3.5" />}
            {trend.direction === "down" && (
              <TrendingDown className="h-3.5 w-3.5" />
            )}
            {trend.direction === "neutral" && (
              <CheckCircle className="h-3.5 w-3.5" />
            )}
            <span>{trend.value}</span>
          </div>
        )}
      </div>
    </div>
  );
}
