import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: { value: string; positive: boolean };
  className?: string;
}

export function Stat({ label, value, icon: Icon, trend, className }: StatProps) {
  return (
    <div
      className={cn(
        "bg-[var(--surface-card)] border border-[var(--border-default)] rounded-[var(--radius-lg)] shadow-[var(--shadow-xs)] p-[var(--card-pad)]",
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
          {label}
        </p>
        {Icon && (
          <div className="h-7 w-7 flex items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-neutral-100)]">
            <Icon size={14} className="text-[var(--text-secondary)]" />
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-[var(--text-primary)] font-variant-numeric tabular-nums">
        {value}
      </p>
      {trend && (
        <p className={cn("mt-1 text-xs font-medium", trend.positive ? "text-[var(--color-success-600)]" : "text-[var(--text-danger)]")}>
          {trend.value}
        </p>
      )}
    </div>
  );
}
