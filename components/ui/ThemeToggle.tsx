"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

export function ThemeToggle({ withLabel = false }: { withLabel?: boolean }) {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  if (withLabel) {
    return (
      <button
        type="button"
        onClick={toggle}
        className="flex items-center gap-2.5 px-2.5 py-2.5 rounded-[var(--radius-md)] text-sm text-[var(--sidebar-item-text)] cursor-pointer hover:bg-[var(--sidebar-item-hover-bg)] hover:text-[var(--text-primary)] transition-colors duration-[var(--transition-fast)] w-full"
      >
        {isDark ? <Sun size={15} /> : <Moon size={15} />}
        {isDark ? "Light mode" : "Dark mode"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)]",
        "text-[var(--text-secondary)] cursor-pointer",
        "hover:bg-[var(--interactive-secondary-hover)] hover:text-[var(--text-primary)]",
        "transition-colors duration-[var(--transition-fast)]"
      )}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
