"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ page, totalPages, total, pageSize, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  // Build page window: always show first, last, current ±1, and ellipsis
  const pages: (number | "…")[] = [];
  const addPage = (n: number) => {
    if (!pages.includes(n)) pages.push(n);
  };

  addPage(1);
  if (page > 3) pages.push("…");
  for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) addPage(i);
  if (page < totalPages - 2) pages.push("…");
  if (totalPages > 1) addPage(totalPages);

  const btn = (
    keyId: string,
    label: React.ReactNode,
    target: number,
    disabled: boolean,
    active = false
  ) => (
    <button
      key={keyId}
      type="button"
      disabled={disabled}
      onClick={() => !disabled && onPageChange(target)}
      className={cn(
        "flex h-8 min-w-[32px] cursor-pointer items-center justify-center rounded-[var(--radius-md)] px-2 text-sm font-medium transition-colors select-none",
        active
          ? "bg-[var(--interactive-primary)] text-[var(--text-on-primary)]"
          : "text-[var(--text-secondary)] hover:bg-[var(--interactive-secondary-hover)] hover:text-[var(--text-primary)]",
        disabled && "opacity-40 cursor-not-allowed pointer-events-none"
      )}
    >
      {label}
    </button>
  );

  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-3 pt-3", className)}>
      <p className="text-xs text-[var(--text-secondary)]">
        Showing <span className="font-medium text-[var(--text-primary)]">{from}–{to}</span> of{" "}
        <span className="font-medium text-[var(--text-primary)]">{total}</span> results
      </p>

      <div className="flex items-center gap-0.5">
        {btn("first", <ChevronsLeft size={13} />, 1, page === 1)}
        {btn("prev", <ChevronLeft size={13} />, page - 1, page === 1)}

        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`ellipsis-${i}`} className="flex h-8 w-8 items-center justify-center text-sm text-[var(--text-tertiary)]">…</span>
          ) : (
            btn(`page-${p}`, p, p as number, false, p === page)
          )
        )}

        {btn("next", <ChevronRight size={13} />, page + 1, page === totalPages)}
        {btn("last", <ChevronsRight size={13} />, totalPages, page === totalPages)}
      </div>
    </div>
  );
}
