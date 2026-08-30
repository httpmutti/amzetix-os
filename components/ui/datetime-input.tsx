"use client";

import { forwardRef } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface DateTimeInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export const DateTimeInput = forwardRef<HTMLInputElement, DateTimeInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <input
          ref={ref}
          type="datetime-local"
          {...props}
          className={cn(
            "flex h-9 w-full appearance-none rounded-[var(--radius-md)] border border-[var(--input-border)] bg-[var(--input-bg)]",
            "px-3 pr-8 text-sm text-[var(--text-primary)] transition-colors",
            "hover:border-[var(--input-border-hover)]",
            "focus:outline-none focus:border-[var(--input-border-focus)] focus:ring-1 focus:ring-[var(--input-border-focus)]",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "cursor-pointer",
            className
          )}
        />
        <Clock
          size={14}
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"
        />
      </div>
    );
  }
);
DateTimeInput.displayName = "DateTimeInput";
