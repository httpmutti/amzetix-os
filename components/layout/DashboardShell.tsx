"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { cn } from "@/lib/utils";
import type { UserRole } from "@prisma/client";
import { useDashboardStore } from "@/lib/store/dashboard.store";
import { useCRMStore } from "@/lib/store/crm.store";
import { useClientsStore } from "@/lib/store/clients.store";
import { useProjectsStore } from "@/lib/store/projects.store";
import { useTasksStore } from "@/lib/store/tasks.store";
import { useInvoicesStore } from "@/lib/store/invoices.store";
import { useExpensesStore } from "@/lib/store/expenses.store";
import { usePaymentsStore } from "@/lib/store/payments.store";
import { useTeamStore } from "@/lib/store/team.store";
import { usePayrollStore } from "@/lib/store/payroll.store";
import { useNotificationsStore } from "@/lib/store/notifications.store";
import { useDocumentsStore } from "@/lib/store/documents.store";
import { useTimeStore } from "@/lib/store/time.store";
import { useLeaveStore } from "@/lib/store/leave.store";

const OpenSidebarCtx = createContext<() => void>(() => {});
export const useOpenSidebar = () => useContext(OpenSidebarCtx);

interface DashboardShellProps {
  children: React.ReactNode;
  role: UserRole;
  userName: string;
  userEmail: string;
  userImage?: string | null;
}

export function DashboardShell({ children, role, userName, userEmail, userImage }: DashboardShellProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Prefetch all stores in parallel so switching tabs shows data instantly
  const fetchDashboard = useDashboardStore((s) => s.fetch);
  const fetchCRM = useCRMStore((s) => s.fetch);
  const fetchClients = useClientsStore((s) => s.fetch);
  const fetchProjects = useProjectsStore((s) => s.fetch);
  const fetchTasks = useTasksStore((s) => s.fetch);
  const fetchInvoices = useInvoicesStore((s) => s.fetch);
  const fetchExpenses = useExpensesStore((s) => s.fetch);
  const fetchPayments = usePaymentsStore((s) => s.fetch);
  const fetchTeam = useTeamStore((s) => s.fetch);
  const fetchPayroll = usePayrollStore((s) => s.fetch);
  const fetchNotifications = useNotificationsStore((s) => s.fetch);
  const fetchDocuments = useDocumentsStore((s) => s.fetch);
  const fetchTime = useTimeStore((s) => s.fetch);
  const fetchLeave = useLeaveStore((s) => s.fetch);

  useEffect(() => {
    fetchDashboard();
    fetchCRM();
    fetchClients();
    fetchProjects();
    fetchTasks();
    fetchInvoices();
    fetchExpenses();
    fetchPayments();
    fetchTeam();
    fetchPayroll();
    fetchNotifications();
    fetchDocuments();
    fetchTime();
    fetchLeave();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setSidebarOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <OpenSidebarCtx.Provider value={() => setSidebarOpen(true)}>
      <div className="flex h-dvh overflow-hidden">
        {sidebarOpen && (
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-40 bg-[var(--surface-overlay)] md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          role={role}
          userName={userName}
          userEmail={userEmail}
          userImage={userImage}
        />

        <main className={cn("min-w-0 flex-1 bg-[var(--surface-page)] overflow-y-auto")}>
          {children}
        </main>
      </div>
    </OpenSidebarCtx.Provider>
  );
}
