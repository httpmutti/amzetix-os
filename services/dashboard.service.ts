import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, format } from "date-fns";

export interface DateRange {
  from: Date;
  to: Date;
}

export function getDateRange(period: string): DateRange {
  const now = new Date();
  switch (period) {
    case "today":
      return { from: new Date(now.setHours(0, 0, 0, 0)), to: new Date() };
    case "this_week": {
      const day = now.getDay();
      const from = new Date(now);
      from.setDate(now.getDate() - day);
      from.setHours(0, 0, 0, 0);
      return { from, to: new Date() };
    }
    case "this_month":
      return { from: startOfMonth(now), to: endOfMonth(now) };
    case "last_month": {
      const last = subMonths(now, 1);
      return { from: startOfMonth(last), to: endOfMonth(last) };
    }
    case "this_quarter": {
      const q = Math.floor(now.getMonth() / 3);
      const from = new Date(now.getFullYear(), q * 3, 1);
      const to = new Date(now.getFullYear(), q * 3 + 3, 0, 23, 59, 59);
      return { from, to };
    }
    case "this_year":
      return { from: startOfYear(now), to: endOfYear(now) };
    default:
      return { from: startOfMonth(now), to: endOfMonth(now) };
  }
}

// ─── Company Info ──────────────────────────────────────────────────

export async function getCompanyInfo() {
  const rows = await prisma.companySetting.findMany({
    where: { key: { in: ["company.name", "company.currency"] } },
  });
  let name = "Amzetix";
  let currency = "USD";
  for (const r of rows) {
    if (r.key === "company.name" && typeof r.value === "string") name = r.value;
    if (r.key === "company.currency" && typeof r.value === "string") currency = r.value;
  }
  return { name, currency };
}

// ─── Financial KPIs ──────────────────────────────────────────────

export async function getFinancialKPIs(range: DateRange) {
  const [invoicesAll, payments, expenses] = await Promise.all([
    prisma.invoice.findMany({
      where: {
        deletedAt: null,
        issueDate: { gte: range.from, lte: range.to },
      },
      select: {
        total: true,
        amountPaid: true,
        balanceDue: true,
        status: true,
        dueDate: true,
      },
    }),
    prisma.payment.findMany({
      where: {
        deletedAt: null,
        paymentDate: { gte: range.from, lte: range.to },
      },
      select: { amount: true },
    }),
    prisma.expense.findMany({
      where: {
        deletedAt: null,
        date: { gte: range.from, lte: range.to },
        status: { not: "REJECTED" },
      },
      select: { amount: true, category: true },
    }),
  ]);

  const totalInvoiced = invoicesAll.reduce((s, i) => s + Number(i.total), 0);
  const cashCollected = payments.reduce((s, p) => s + Number(p.amount), 0);
  const outstanding = invoicesAll
    .filter((i) => ["SENT", "PARTIALLY_PAID"].includes(i.status))
    .reduce((s, i) => s + Number(i.balanceDue), 0);
  const overdue = invoicesAll
    .filter((i) => i.status === "OVERDUE" || (["SENT", "PARTIALLY_PAID"].includes(i.status) && new Date(i.dueDate) < new Date()))
    .reduce((s, i) => s + Number(i.balanceDue), 0);
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const payrollExpenses = expenses
    .filter((e) => e.category === "SALARIES")
    .reduce((s, e) => s + Number(e.amount), 0);
  const netProfit = cashCollected - totalExpenses;
  const profitMargin = cashCollected > 0 ? (netProfit / cashCollected) * 100 : 0;

  return {
    totalInvoiced,
    cashCollected,
    outstanding,
    overdue,
    totalExpenses,
    payrollExpenses,
    netProfit,
    profitMargin,
  };
}

// ─── Client KPIs ─────────────────────────────────────────────────

export async function getClientKPIs(range: DateRange) {
  const [total, active, newClients, lost] = await Promise.all([
    prisma.client.count({ where: { deletedAt: null } }),
    prisma.client.count({ where: { deletedAt: null, status: "ACTIVE" } }),
    prisma.client.count({
      where: { deletedAt: null, createdAt: { gte: range.from, lte: range.to } },
    }),
    prisma.client.count({ where: { deletedAt: null, status: "LOST" } }),
  ]);
  return { total, active, newClients, lost };
}

// ─── Task KPIs ───────────────────────────────────────────────────

export async function getTaskKPIs() {
  const now = new Date();
  const tasks = await prisma.task.findMany({
    where: { deletedAt: null },
    select: { status: true, priority: true, dueDate: true },
  });

  const total = tasks.filter((t) => t.status !== "COMPLETED").length;
  const inProgress = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const inReview = tasks.filter((t) => ["IN_REVIEW", "CLIENT_REVIEW"].includes(t.status)).length;
  const completed = tasks.filter((t) => t.status === "COMPLETED").length;
  const overdue = tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== "COMPLETED"
  ).length;
  const urgent = tasks.filter((t) => t.priority === "URGENT" && t.status !== "COMPLETED").length;

  return { total, inProgress, inReview, completed, overdue, urgent };
}

// ─── Time Tracking KPIs ──────────────────────────────────────────

export async function getTimeTrackingKPIs() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [activeEntries, todayCompletedEntries] = await Promise.all([
    prisma.timeEntry.findMany({
      where: { endTime: null },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, profileImage: true } },
        project: { select: { id: true, name: true } },
        task: { select: { id: true, title: true } },
      },
      orderBy: { startTime: "desc" },
    }),
    prisma.timeEntry.findMany({
      where: { startTime: { gte: today }, endTime: { not: null } },
      select: { duration: true },
    }),
  ]);

  const activeNow = activeEntries.length;
  let todayMinutes = todayCompletedEntries.reduce((acc, curr) => acc + (curr.duration || 0), 0);
  for (const entry of activeEntries) {
    if (new Date(entry.startTime) >= today) {
      const liveMin = Math.floor((Date.now() - new Date(entry.startTime).getTime()) / 60000);
      todayMinutes += liveMin;
    }
  }

  return {
    activeNow,
    todayMinutes,
    activeEntries: activeEntries.slice(0, 6).map((e) => ({
      id: e.id,
      employee: e.employee,
      description: e.description ?? e.task?.title ?? e.project?.name ?? "Clocked in",
      startTime: e.startTime.toISOString(),
      projectName: e.project?.name ?? null,
      taskTitle: e.task?.title ?? null,
    })),
  };
}

// ─── Team / Attendance / HR KPIs ───────────────────────────────────

export async function getTeamKPIs() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalEmployees, todayAttendance, pendingLeaves] = await Promise.all([
    prisma.employee.count({ where: { deletedAt: null, status: "ACTIVE" } }),
    prisma.attendance.findMany({
      where: { date: today },
      select: { status: true },
    }),
    prisma.leaveRequest.count({
      where: { status: "PENDING" },
    }),
  ]);

  const present = todayAttendance.filter((a) =>
    ["PRESENT", "LATE", "WORK_FROM_HOME", "HALF_DAY"].includes(a.status)
  ).length;
  const late = todayAttendance.filter((a) => a.status === "LATE").length;
  const absent = todayAttendance.filter((a) => a.status === "ABSENT").length;
  const onLeave = todayAttendance.filter((a) =>
    ["PAID_LEAVE", "UNPAID_LEAVE"].includes(a.status)
  ).length;
  const attendancePct = totalEmployees > 0 ? Math.round((present / totalEmployees) * 100) : 0;

  return { totalEmployees, present, late, absent, onLeave, pendingLeaves, attendancePct };
}

// ─── Recent Invoices ──────────────────────────────────────────────

export async function getRecentInvoices(limit = 5) {
  const invoices = await prisma.invoice.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      invoiceNumber: true,
      client: { select: { id: true, companyName: true } },
      total: true,
      balanceDue: true,
      status: true,
      dueDate: true,
      currency: true,
    },
  });

  return invoices.map((inv) => ({
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    clientName: inv.client.companyName,
    total: Number(inv.total),
    balanceDue: Number(inv.balanceDue),
    status: inv.status,
    dueDate: inv.dueDate.toISOString(),
    currency: inv.currency,
  }));
}

// ─── Recent Priority Tasks ────────────────────────────────────────

export async function getRecentTasks(limit = 5) {
  const tasks = await prisma.task.findMany({
    where: { deletedAt: null, status: { not: "COMPLETED" } },
    orderBy: [
      { priority: "desc" },
      { dueDate: "asc" },
      { createdAt: "desc" },
    ],
    take: limit,
    select: {
      id: true,
      taskId: true,
      title: true,
      status: true,
      priority: true,
      dueDate: true,
      assignee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profileImage: true,
        },
      },
      project: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return tasks.map((t) => ({
    id: t.id,
    taskId: t.taskId,
    title: t.title,
    status: t.status,
    priority: t.priority,
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    assigneeName: t.assignee ? `${t.assignee.firstName} ${t.assignee.lastName}` : "Unassigned",
    projectName: t.project?.name ?? null,
  }));
}

// ─── Revenue chart (monthly) ─────────────────────────────────────

export async function getMonthlyRevenueChart(months = 12) {
  const now = new Date();
  const result: { month: string; revenue: number; expenses: number; profit: number }[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const date = subMonths(now, i);
    const from = startOfMonth(date);
    const to = endOfMonth(date);

    const [payments, expenses] = await Promise.all([
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { deletedAt: null, paymentDate: { gte: from, lte: to } },
      }),
      prisma.expense.aggregate({
        _sum: { amount: true },
        where: { deletedAt: null, date: { gte: from, lte: to }, status: { not: "REJECTED" } },
      }),
    ]);

    const revenue = Number(payments._sum.amount ?? 0);
    const exp = Number(expenses._sum.amount ?? 0);
    result.push({
      month: format(date, "MMM yy"),
      revenue,
      expenses: exp,
      profit: revenue - exp,
    });
  }

  return result;
}

// ─── Recent activity ─────────────────────────────────────────────

export async function getRecentActivity(limit = 10) {
  return prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      action: true,
      entity: true,
      entityId: true,
      description: true,
      createdAt: true,
      performedBy: { select: { name: true, image: true } },
    },
  });
}
