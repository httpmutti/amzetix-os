"use client";

import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { useOpenPortalSidebar } from "./PortalShell";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const PAGE_TITLES: Record<string, string> = {
  "/portal":           "Overview",
  "/portal/projects":  "Projects",
  "/portal/invoices":  "Invoices",
};

function getTitle(pathname: string): string {
  if (pathname === "/portal") return "Overview";
  if (pathname.startsWith("/portal/projects/") && pathname !== "/portal/projects") return "Project Detail";
  if (pathname.startsWith("/portal/invoices/") && pathname !== "/portal/invoices") return "Invoice Detail";
  return PAGE_TITLES[pathname] ?? "Portal";
}

export function PortalHeader() {
  const pathname = usePathname();
  const openSidebar = useOpenPortalSidebar();

  return (
    <header className="h-[var(--header-height)] shrink-0 flex items-center gap-3 px-[var(--page-px)] bg-[var(--header-bg)] border-b border-[var(--header-border)]">
      <button
        type="button"
        aria-label="Open menu"
        onClick={openSidebar}
        className="md:hidden h-8 w-8 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--interactive-secondary-hover)] cursor-pointer"
      >
        <Menu size={18} />
      </button>
      <h1 className="text-sm font-semibold flex-1 text-[var(--text-primary)]">{getTitle(pathname)}</h1>
      <ThemeToggle />
    </header>
  );
}
