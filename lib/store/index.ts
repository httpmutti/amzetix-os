export { createEntityStore } from "./createStore";
export type { FetchStatus, SliceState, SliceActions, Slice } from "./createStore";

export { useDashboardStore } from "./dashboard.store";
export type { DashboardData } from "./dashboard.store";

export { useCRMStore } from "./crm.store";
export type { CRMData, Lead } from "./crm.store";

export { useClientsStore } from "./clients.store";
export type { ClientsData, ClientSummary } from "./clients.store";

export { useProjectsStore } from "./projects.store";
export type { ProjectsData, ProjectSummary } from "./projects.store";

export { useTasksStore } from "./tasks.store";
export type { TasksData, TaskSummary } from "./tasks.store";

export { useInvoicesStore } from "./invoices.store";
export type { Invoice } from "./invoices.store";

export { useExpensesStore } from "./expenses.store";
export type { Expense } from "./expenses.store";

export { usePaymentsStore } from "./payments.store";
export type { Payment } from "./payments.store";

export { useTeamStore } from "./team.store";
export type { Employee } from "./team.store";

export { useLeaveStore } from "./leave.store";
export type { LeaveType, LeaveBalance, LeaveRequest } from "./leave.store";

export { usePayrollStore } from "./payroll.store";
export type { PayrollRun } from "./payroll.store";

export { useRevenueStore } from "./revenue.store";
export type { RevenueData, RevenueSummary, MonthlyStat, CategoryStat, Withdrawal } from "./revenue.store";

export { useNotificationsStore } from "./notifications.store";
export type { AppNotification } from "./notifications.store";

export { useDocumentsStore } from "./documents.store";
export type { DocFile } from "./documents.store";

export { useTimeStore } from "./time.store";
export type { TimeEntry } from "./time.store";
