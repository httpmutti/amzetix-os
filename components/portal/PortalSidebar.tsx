"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, LogOut, LayoutDashboard, FolderOpen, FileText } from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";
import { Avatar } from "@/components/ui/avatar";

const navItems = [
  { href: "/portal",          label: "Overview",  icon: LayoutDashboard, exact: true },
  { href: "/portal/projects", label: "Projects",  icon: FolderOpen,      exact: false },
  { href: "/portal/invoices", label: "Invoices",  icon: FileText,        exact: false },
];

interface Props {
  open?: boolean;
  onClose?: () => void;
  userName: string;
  userEmail: string;
  userImage?: string | null;
  companyName: string;
}

export function PortalSidebar({ open = false, onClose, userName, userEmail, userImage, companyName }: Props) {
  const pathname = usePathname();

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
        <Logo size="md" href="/portal" />
        <button
          type="button"
          aria-label="Close menu"
          onClick={onClose}
          className="md:hidden p-1.5 rounded-[var(--radius-md)] text-[var(--text-secondary)] cursor-pointer hover:bg-[var(--sidebar-item-hover-bg)]"
        >
          <X size={16} />
        </button>
      </div>

      {/* Client name label */}
      <div className="px-[var(--space-4)] py-3 border-b border-[var(--sidebar-border)]">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--sidebar-section-text)]">Client Portal</p>
        <p className="text-xs font-medium text-[var(--text-primary)] truncate mt-0.5">{companyName}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overscroll-contain px-2 py-3">
        <ul className="space-y-0.5">
          {navItems.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-2.5 px-2.5 py-2 rounded-[var(--radius-md)] text-sm transition-colors duration-[var(--transition-fast)]",
                    active
                      ? "bg-[var(--sidebar-item-active-bg)] text-[var(--sidebar-item-active-text)] font-medium"
                      : "text-[var(--sidebar-item-text)] hover:bg-[var(--sidebar-item-hover-bg)] hover:text-[var(--text-primary)]"
                  )}
                >
                  <Icon size={15} />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
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
