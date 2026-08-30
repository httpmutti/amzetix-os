import { cn } from "@/lib/utils";

export type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "active"
  | "draft"
  | "pending"
  | "sent"
  | "paid"
  | "overdue"
  | "won"
  | "lost"
  | "cancelled"
  | "in-progress"
  | "on-hold"
  | "archived";

const variantStyles: Record<BadgeVariant, string> = {
  default:     "bg-[var(--color-neutral-100)] text-[var(--text-secondary)]",
  success:     "bg-[var(--color-success-50)] text-[var(--color-success-700)]",
  warning:     "bg-[var(--color-warning-50)] text-[var(--color-warning-700)]",
  danger:      "bg-[var(--color-danger-50)] text-[var(--color-danger-700)]",
  info:        "bg-[var(--color-info-50)] text-[var(--color-info-700)]",
  active:      "bg-[var(--status-active-bg)] text-[var(--status-active-fg)]",
  draft:       "bg-[var(--status-draft-bg)] text-[var(--status-draft-fg)]",
  pending:     "bg-[var(--status-pending-bg)] text-[var(--status-pending-fg)]",
  sent:        "bg-[var(--status-sent-bg)] text-[var(--status-sent-fg)]",
  paid:        "bg-[var(--status-paid-bg)] text-[var(--status-paid-fg)]",
  overdue:     "bg-[var(--status-overdue-bg)] text-[var(--status-overdue-fg)]",
  won:         "bg-[var(--status-won-bg)] text-[var(--status-won-fg)]",
  lost:        "bg-[var(--status-lost-bg)] text-[var(--status-lost-fg)]",
  cancelled:   "bg-[var(--status-cancelled-bg)] text-[var(--status-cancelled-fg)]",
  "in-progress": "bg-[var(--status-in-progress-bg)] text-[var(--status-in-progress-fg)]",
  "on-hold":   "bg-[var(--status-on-hold-bg)] text-[var(--status-on-hold-fg)]",
  archived:    "bg-[var(--status-archived-bg)] text-[var(--status-archived-fg)]",
};

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;
}

export function Badge({ variant = "default", dot = false, children, className, ...props }: BadgeProps) {
  const dotColor: Record<BadgeVariant, string> = {
    default:    "bg-[var(--color-neutral-400)]",
    success:    "bg-[var(--color-success-500)]",
    warning:    "bg-[var(--color-warning-500)]",
    danger:     "bg-[var(--color-danger-500)]",
    info:       "bg-[var(--color-info-500)]",
    active:     "bg-[var(--status-active-dot)]",
    draft:      "bg-[var(--status-draft-dot)]",
    pending:    "bg-[var(--status-pending-dot)]",
    sent:       "bg-[var(--status-sent-dot)]",
    paid:       "bg-[var(--status-paid-dot)]",
    overdue:    "bg-[var(--status-overdue-dot)]",
    won:        "bg-[var(--status-won-dot)]",
    lost:       "bg-[var(--status-lost-dot)]",
    cancelled:  "bg-[var(--status-cancelled-dot)]",
    "in-progress": "bg-[var(--status-in-progress-dot)]",
    "on-hold":  "bg-[var(--status-on-hold-dot)]",
    archived:   "bg-[var(--status-archived-dot)]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[var(--radius-full)] text-xs font-medium",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {dot && (
        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColor[variant])} />
      )}
      {children}
    </span>
  );
}
