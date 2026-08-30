"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, Bell, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { useOpenSidebar } from "./DashboardShell";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { cn } from "@/lib/utils";

function getBreadcrumb(pathname: string): string {
  const segment = pathname.split("/").filter(Boolean)[0] ?? "dashboard";
  return segment
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const openSidebar = useOpenSidebar();
  const title = getBreadcrumb(pathname);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    async function poll() {
      try {
        const res = await fetch("/api/notifications/unread-count");
        const json = await res.json();
        setUnread(json.count ?? 0);
      } catch { /* noop */ }
    }
    poll();
    const id = setInterval(poll, 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <header
      className={cn(
        "h-[var(--header-height)] shrink-0 flex items-center gap-3 px-[var(--page-px)]",
        "bg-[var(--header-bg)] border-b border-[var(--header-border)]"
      )}
    >
      <button
        type="button"
        aria-label="Open menu"
        onClick={openSidebar}
        className="md:hidden h-8 w-8 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--interactive-secondary-hover)] cursor-pointer"
      >
        <Menu size={18} />
      </button>

      <h1 className="text-sm font-semibold text-[var(--text-primary)] flex-1">{title}</h1>

      <div className="flex items-center gap-1">
        <ThemeToggle />
        <button
          type="button"
          aria-label="Notifications"
          onClick={() => router.push("/notifications")}
          className="relative h-8 w-8 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--interactive-secondary-hover)] hover:text-[var(--text-primary)] cursor-pointer transition-colors duration-[var(--transition-fast)]"
        >
          <Bell size={16} />
          {unread > 0 && (
            <span className="absolute top-1 right-1 h-3.5 w-3.5 flex items-center justify-center rounded-full bg-[var(--color-danger-500)] text-white text-[9px] font-bold leading-none">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
        <button
          type="button"
          aria-label="Sign out"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="h-8 w-8 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--interactive-secondary-hover)] hover:text-[var(--color-danger-500)] cursor-pointer transition-colors duration-[var(--transition-fast)]"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
