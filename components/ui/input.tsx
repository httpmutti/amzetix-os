import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => (
    <input
      ref={ref}
      data-focus-border
      className={cn(
        "w-full h-9 px-3 text-sm rounded-[var(--radius-md)]",
        "bg-[var(--surface-input)] text-[var(--text-primary)]",
        "border transition-colors duration-[var(--transition-fast)]",
        "placeholder:text-[var(--text-tertiary)]",
        "focus:outline-none",
        error
          ? "border-[var(--color-danger-500)] focus:border-[var(--color-danger-500)] focus:ring-1 focus:ring-[var(--color-danger-500)]"
          : "border-[var(--border-input)] focus:border-[var(--border-focus)] focus:ring-1 focus:ring-[var(--border-focus)]",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export function InputLabel({ children, className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("block text-sm font-medium text-[var(--text-primary)] mb-1.5", className)}
      {...props}
    >
      {children}
    </label>
  );
}

export function InputError({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("mt-1 text-xs text-[var(--text-danger)]", className)}>{children}</p>
  );
}
