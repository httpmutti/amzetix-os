import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "xs" | "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-medium rounded-[var(--radius-md)] transition-colors duration-[var(--transition-fast)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--surface-page)]";

const variants: Record<Variant, string> = {
  primary:
    "bg-[var(--interactive-primary)] text-[var(--text-inverse)] hover:bg-[var(--interactive-primary-hover)]",
  secondary:
    "bg-[var(--color-neutral-100)] text-[var(--text-primary)] hover:bg-[var(--color-neutral-200)]",
  ghost:
    "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--interactive-secondary-hover)] hover:text-[var(--text-primary)]",
  danger:
    "bg-[var(--color-danger-500)] text-white hover:bg-[var(--color-danger-700)]",
  outline:
    "border border-[var(--border-default)] bg-transparent text-[var(--text-primary)] hover:bg-[var(--interactive-secondary-hover)]",
};

const sizes: Record<Size, string> = {
  xs: "h-7 px-2.5 text-xs",
  sm: "h-8 px-3 text-sm",
  md: "h-9 px-4 text-sm",
  lg: "h-10 px-5 text-base",
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading = false, icon, children, className, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {loading ? (
        <Loader2 size={14} className="animate-spin" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  )
);
Button.displayName = "Button";
