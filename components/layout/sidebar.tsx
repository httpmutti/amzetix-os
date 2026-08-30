"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";
import { Avatar } from "@/components/ui/avatar";
import { getNavSections } from "@/lib/nav";
import type { UserRole } from "@prisma/client";

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
  role: UserRole;
  userName: string;
  userEmail: string;
  userImage?: string | null;
}

export function Sidebar({ open = false, onClose, role, userName, userEmail, userImage }: SidebarProps) {
  const pathname = usePathname();
  const navSections = getNavSections(role);

  return (
    <aside
      className={cn(
        "flex flex-col h-full w-[var(--sidebar-width)] max-w-[85vw] bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)] shrink-0",
        "fixed inset-y-0 left-0 z-50 transition-transform duration-200 ease-out md:static md:translate-x-0 md:z-auto",
        open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}
    >
      {/* Brand */}
      <div className="px-[var(--space-4)] h-[var(--header-height)] border-b border-[var(--sidebar-border)] flex items-center justify-between gap-2 shrink-0">
        <Logo size="md" />
        <button
          type="button"
          aria-label="Close menu"
          onClick={onClose}
          className="md:hidden p-1.5 rounded-[var(--radius-md)] text-[var(--text-secondary)] cursor-pointer hover:bg-[var(--sidebar-item-hover-bg)]"
        >
          <X size={16} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overscroll-contain px-2 py-3 space-y-4">
        {navSections.map((section) => (
          <div key={section.title}>
            <p className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--sidebar-section-text)]">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-2.5 px-2.5 py-2 rounded-[var(--radius-md)] text-sm transition-colors duration-[var(--transition-fast)]",
                        active
                          ? "bg-[var(--sidebar-item-active-bg)] text-[var(--sidebar-item-active-text)] font-medium"
                          : "text-[var(--sidebar-item-text)] hover:bg-[var(--sidebar-item-hover-bg)] hover:text-[var(--text-primary)]"
                      )}
                    >
                      <Icon size={15} />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-[var(--sidebar-border)] px-3 py-2 shrink-0">
        <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-[var(--radius-md)]">
          <Avatar name={userName} src={userImage} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[var(--text-primary)] truncate">{userName}</p>
            <p className="text-xs text-[var(--text-tertiary)] truncate">{userEmail}</p>
          </div>
          <button
            type="button"
            aria-label="Sign out"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="shrink-0 h-7 w-7 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--sidebar-item-hover-bg)] hover:text-[var(--color-danger-500)] transition-colors cursor-pointer"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
