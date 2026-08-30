"use client";

import Link from "next/link";
import { UserCheck, Clock, CheckSquare, FileText, Receipt, Users } from "lucide-react";

const actions = [
  {
    href: "/attendance",
    icon: UserCheck,
    label: "Log Attendance",
    description: "Mark attendance or view status",
    color: "var(--status-active-fg)",
    bg: "var(--status-active-bg)",
  },
  {
    href: "/time",
    icon: Clock,
    label: "Time Tracking",
    description: "Monitor live timers & hours",
    color: "var(--color-info-600)",
    bg: "var(--color-info-50)",
  },
  {
    href: "/tasks",
    icon: CheckSquare,
    label: "Task Board",
    description: "Manage workflow & assignments",
    color: "var(--interactive-primary)",
    bg: "var(--interactive-primary-bg)",
  },
  {
    href: "/invoices/new",
    icon: FileText,
    label: "New Invoice",
    description: "Create & send client invoice",
    color: "var(--status-sent-fg)",
    bg: "var(--status-sent-bg)",
  },
  {
    href: "/expenses",
    icon: Receipt,
    label: "Add Expense",
    description: "Record operating expenses",
    color: "var(--color-warning-600)",
    bg: "var(--color-warning-50)",
  },
  {
    href: "/team",
    icon: Users,
    label: "Employees",
    description: "Team directory & profiles",
    color: "var(--text-secondary)",
    bg: "var(--sidebar-item-active-bg)",
  },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {actions.map(({ href, icon: Icon, label, description, color, bg }) => (
        <Link
          key={href}
          href={href}
          className="group flex flex-col justify-between p-3.5 rounded-[var(--radius-lg)] border border-[var(--border-default)] transition-all duration-[var(--transition-fast)] hover:border-[var(--border-strong)] hover:bg-[var(--interactive-secondary-hover)] bg-[var(--surface-card)]"
        >
          <div className="flex items-center justify-between mb-2">
            <span
              className="h-8 w-8 flex items-center justify-center rounded-[var(--radius-md)] shrink-0 transition-transform group-hover:scale-105"
              style={{ background: bg, color: color }}
            >
              <Icon size={16} />
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold text-[var(--text-primary)] group-hover:text-[var(--interactive-primary)] transition-colors">
              {label}
            </p>
            <p className="text-[11px] text-[var(--text-tertiary)] truncate mt-0.5">{description}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
