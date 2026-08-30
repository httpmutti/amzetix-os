"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onValueChange: (v: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function Select({ value, onValueChange, options, placeholder = "Select…", disabled, className }: SelectProps) {
  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectPrimitive.Trigger
        className={cn(
          "group flex h-9 w-full items-center justify-between gap-2 rounded-[var(--radius-md)] border border-[var(--input-border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)]",
          "hover:border-[var(--input-border-hover)] focus:outline-none focus:border-[var(--input-border-focus)] focus:ring-1 focus:ring-[var(--input-border-focus)]",
          "disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
          className
        )}
      >
        <SelectPrimitive.Value placeholder={<span className="text-[var(--text-placeholder)]">{placeholder}</span>} />
        <SelectPrimitive.Icon>
          <ChevronDown size={14} className="text-[var(--text-secondary)] shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={4}
          className={cn(
            "z-50 min-w-[var(--radix-select-trigger-width)] overflow-hidden",
            "rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-card)] shadow-[var(--shadow-lg)]",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[side=bottom]:slide-in-from-top-2"
          )}
        >
          <SelectPrimitive.Viewport className="p-1">
            {options.map((opt) => (
              <SelectPrimitive.Item
                key={opt.value}
                value={opt.value}
                className={cn(
                  "flex cursor-pointer select-none items-center gap-2 rounded-[var(--radius-md)] px-2.5 py-1.5 text-sm text-[var(--text-primary)] outline-none",
                  "data-[highlighted]:bg-[var(--interactive-secondary-hover)]",
                  "data-[state=checked]:text-[var(--text-brand)] data-[state=checked]:font-medium"
                )}
              >
                <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator className="ml-auto">
                  <Check size={12} />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
