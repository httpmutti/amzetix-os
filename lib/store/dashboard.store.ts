import { createEntityStore } from "./createStore";

export interface DashboardData {
  company: {
    name: string;
    currency: string;
  };
  financial: {
    cashCollected: number;
    outstanding: number;
    overdue: number;
    netProfit: number;
    profitMargin: number;
    totalInvoiced: number;
    totalExpenses: number;
    payrollExpenses: number;
  };
  clients: {
    active: number;
    total: number;
    newClients: number;
    lost: number;
  };
  tasks: {
    total: number;
    inProgress: number;
    inReview: number;
    completed: number;
    overdue: number;
    urgent: number;
  };
  timeTracking: {
    activeNow: number;
    todayMinutes: number;
    activeEntries: {
      id: string;
      employee: {
        id: string;
        firstName: string;
        lastName: string;
        profileImage: string | null;
      };
      description: string;
      startTime: string;
      projectName: string | null;
      taskTitle: string | null;
    }[];
  };
  team: {
    totalEmployees: number;
    present: number;
    late: number;
    absent: number;
    onLeave: number;
    pendingLeaves: number;
    attendancePct: number;
  };
  recentInvoices: {
    id: string;
    invoiceNumber: string;
    clientName: string;
    total: number;
    balanceDue: number;
    status: string;
    dueDate: string;
    currency: string;
  }[];
  recentTasks: {
    id: string;
    taskId: string;
    title: string;
    status: string;
    priority: string;
    dueDate: string | null;
    assigneeName: string;
    projectName: string | null;
  }[];
  chart: {
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
  }[];
  activity: {
    id: string;
    action: string;
    entity: string;
    description: string;
    createdAt: string;
    performedBy: { name: string | null; image: string | null } | null;
  }[];
}

export const useDashboardStore = createEntityStore<DashboardData>("/api/dashboard");
