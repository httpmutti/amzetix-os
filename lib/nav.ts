import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  TrendingUp,
  Building2,
  Briefcase,
  CheckSquare,
  Clock,
  Users,
  UserCheck,
  Calendar,
  DollarSign,
  FileText,
  CreditCard,
  Receipt,
  BarChart3,
  FolderOpen,
  Bell,
  ClipboardList,
  Settings,
  BookOpen,
} from "lucide-react";
import type { UserRole } from "@prisma/client";
import { hasPermission } from "@/lib/permissions";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  permission?: Parameters<typeof hasPermission>[1];
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const ALL_NAV_SECTIONS: NavSection[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, permission: "dashboard:view" },
    ],
  },
  {
    title: "Sales & CRM",
    items: [
      // { label: "CRM / Leads", href: "/crm", icon: TrendingUp, permission: "crm:view" },
      { label: "Clients", href: "/clients", icon: Building2, permission: "clients:view" },
    ],
  },
  {
    title: "Work",
    items: [
      // { label: "Projects", href: "/projects", icon: Briefcase, permission: "projects:view" },
      { label: "Tasks", href: "/tasks", icon: CheckSquare, permission: "tasks:view" },
      { label: "Time Tracking", href: "/time", icon: Clock, permission: "time:track" },
    ],
  },
  {
    title: "Team",
    items: [
      { label: "Employees", href: "/team", icon: Users, permission: "team:view" },
      { label: "Attendance", href: "/attendance", icon: UserCheck, permission: "attendance:view_own" },
      { label: "Leave", href: "/leave", icon: Calendar, permission: "leave:view_own" },
      { label: "Payroll", href: "/payroll", icon: DollarSign, permission: "payroll:view_own" },
    ],
  },
  {
    title: "Finance",
    items: [
      { label: "Invoices", href: "/invoices", icon: FileText, permission: "invoices:view" },
      { label: "Payments", href: "/payments", icon: CreditCard, permission: "payments:view" },
      { label: "Expenses", href: "/expenses", icon: Receipt, permission: "expenses:view" },
      { label: "Revenue", href: "/revenue", icon: TrendingUp, permission: "revenue:view" },
      { label: "Ledger Book", href: "/ledger", icon: BookOpen, permission: "revenue:view" },
    ],
  },
  {
    title: "Insights",
    items: [
      { label: "Reports", href: "/reports", icon: BarChart3, permission: "reports:view" },
      { label: "Documents", href: "/documents", icon: FolderOpen, permission: "documents:view" },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Notifications", href: "/notifications", icon: Bell, permission: "notifications:view" },
      { label: "Audit Logs", href: "/audit-logs", icon: ClipboardList, permission: "audit:view" },
      { label: "Settings", href: "/settings", icon: Settings, permission: "settings:view" },
    ],
  },
];

export function getNavSections(role: UserRole): NavSection[] {
  return ALL_NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter(
      (item) => !item.permission || hasPermission(role, item.permission)
    ),
  })).filter((s) => s.items.length > 0);
}
