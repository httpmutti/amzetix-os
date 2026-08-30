"use client";

import { forwardRef, useCallback } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface NumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  value?: number | string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  step?: number;
  className?: string;
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  ({ className, step = 1, min, max, value, onChange, ...props }, ref) => {
    const adjust = useCallback(
      (delta: number) => {
        const current = parseFloat(String(value ?? 0)) || 0;
        const next = current + delta;
        const minN = min !== undefined ? parseFloat(String(min)) : undefined;
        const maxN = max !== undefined ? parseFloat(String(max)) : undefined;
        if (minN !== undefined && !isNaN(minN) && next < minN) return;
        if (maxN !== undefined && !isNaN(maxN) && next > maxN) return;
        const event = {
          target: { value: String(next) },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange?.(event);
      },
      [value, step, min, max, onChange]
    );

    return (
      <div className="relative w-full">
        <input
          ref={ref}
          type="number"
          value={value}
          onChange={onChange}
          min={min}
          max={max}
          step={step}
          {...props}
          className={cn(
            "flex h-9 w-full rounded-[var(--radius-md)] border border-[var(--input-border)] bg-[var(--input-bg)]",
            "px-3 pr-7 text-sm text-[var(--text-primary)] transition-colors",
            "hover:border-[var(--input-border-hover)]",
            "focus:outline-none focus:border-[var(--input-border-focus)] focus:ring-1 focus:ring-[var(--input-border-focus)]",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            className
          )}
        />
        {/* Custom spinner buttons */}
        <div className="absolute right-0 top-0 flex h-full flex-col border-l border-[var(--input-border)]">
          <button
            type="button"
            tabIndex={-1}
            onClick={() => adjust(step)}
            className="flex flex-1 cursor-pointer items-center justify-center px-1.5 text-[var(--text-secondary)] hover:bg-[var(--interactive-secondary-hover)] hover:text-[var(--text-primary)] transition-colors rounded-tr-[var(--radius-md)]"
          >
            <ChevronUp size={10} />
          </button>
          <div className="border-t border-[var(--input-border)]" />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => adjust(-step)}
            className="flex flex-1 cursor-pointer items-center justify-center px-1.5 text-[var(--text-secondary)] hover:bg-[var(--interactive-secondary-hover)] hover:text-[var(--text-primary)] transition-colors rounded-br-[var(--radius-md)]"
          >
            <ChevronDown size={10} />
          </button>
        </div>
      </div>
    );
  }
);
NumberInput.displayName = "NumberInput";
