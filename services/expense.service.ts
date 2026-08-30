import { prisma } from "@/lib/prisma";
import type { ExpenseCategory, ExpenseStatus, PaymentMethod } from "@prisma/client";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/audit";

async function generateExpenseId(): Promise<string> {
  const count = await prisma.expense.count();
  return `EXP-${String(count + 1).padStart(4, "0")}`;
}

export interface CreateExpenseInput {
  date: Date;
  vendor?: string;
  description: string;
  category: ExpenseCategory;
  amount: number;
  currency?: string;
  method?: PaymentMethod;
  clientId?: string;
  projectId?: string;
  employeeId?: string;
  receiptUrl?: string;
  notes?: string;
  status?: ExpenseStatus;
}

export async function createExpense(input: CreateExpenseInput, performedById: string) {
  const expenseId = await generateExpenseId();

  const expense = await prisma.expense.create({
    data: {
      expenseId,
      date: input.date,
      vendor: input.vendor,
      description: input.description,
      category: input.category,
      amount: input.amount,
      currency: input.currency ?? "USD",
      method: input.method,
      clientId: input.clientId,
      projectId: input.projectId,
      employeeId: input.employeeId,
      receiptUrl: input.receiptUrl,
      notes: input.notes,
      status: input.status ?? "APPROVED",
    },
  });

  await createAuditLog({
    performedById,
    action: AUDIT_ACTIONS.CREATE,
    entity: "Expense",
    entityId: expense.id,
    description: `Created expense: ${expense.description} — $${expense.amount}`,
  });

  return expense;
}

export interface ExpenseFilters {
  category?: ExpenseCategory;
  clientId?: string;
  projectId?: string;
  from?: Date;
  to?: Date;
  search?: string;
  page?: number;
  limit?: number;
}

export async function listExpenses(filters: ExpenseFilters = {}) {
  const { category, clientId, projectId, from, to, search, page = 1, limit = 20 } = filters;

  const where = {
    deletedAt: null,
    ...(category && { category }),
    ...(clientId && { clientId }),
    ...(projectId && { projectId }),
    ...(from && to && { date: { gte: from, lte: to } }),
    ...(search && {
      OR: [
        { description: { contains: search, mode: "insensitive" as const } },
        { vendor: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [expenses, total, aggregate] = await Promise.all([
    prisma.expense.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { date: "desc" },
      include: {
        client: { select: { id: true, companyName: true } },
      },
    }),
    prisma.expense.count({ where }),
    prisma.expense.aggregate({ _sum: { amount: true }, where }),
  ]);

  return {
    expenses,
    total,
    totalAmount: Number(aggregate._sum.amount ?? 0),
    pages: Math.ceil(total / limit),
    page,
  };
}

export async function getExpenseByCategory(from: Date, to: Date) {
  const expenses = await prisma.expense.groupBy({
    by: ["category"],
    _sum: { amount: true },
    _count: true,
    where: {
      deletedAt: null,
      date: { gte: from, lte: to },
      status: { not: "REJECTED" },
    },
    orderBy: { _sum: { amount: "desc" } },
  });

  return expenses.map((e) => ({
    category: e.category,
    total: Number(e._sum.amount ?? 0),
    count: e._count,
  }));
}

// ─── Revenue calculations ─────────────────────────────────────────

export async function getRevenueStats(from: Date, to: Date) {
  const [invoiced, collected, byService] = await Promise.all([
    // Invoiced: sum of all non-cancelled invoices in period
    prisma.invoice.aggregate({
      _sum: { total: true },
      where: {
        deletedAt: null,
        issueDate: { gte: from, lte: to },
        status: { not: "CANCELLED" },
      },
    }),
    // Collected: sum of payments in period
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { deletedAt: null, paymentDate: { gte: from, lte: to } },
    }),
    // By service: join through invoice items
    prisma.invoiceItem.groupBy({
      by: ["service"],
      _sum: { amount: true },
      where: {
        invoice: {
          deletedAt: null,
          issueDate: { gte: from, lte: to },
          status: { not: "CANCELLED" },
        },
      },
    }),
  ]);

  const outstanding = await prisma.invoice.aggregate({
    _sum: { balanceDue: true },
    where: {
      deletedAt: null,
      status: { in: ["SENT", "PARTIALLY_PAID", "OVERDUE"] },
    },
  });

  const overdue = await prisma.invoice.aggregate({
    _sum: { balanceDue: true },
    where: {
      deletedAt: null,
      status: "OVERDUE",
    },
  });

  return {
    invoiced: Number(invoiced._sum.total ?? 0),
    collected: Number(collected._sum.amount ?? 0),
    outstanding: Number(outstanding._sum.balanceDue ?? 0),
    overdue: Number(overdue._sum.balanceDue ?? 0),
    byService: byService.map((s) => ({
      service: s.service ?? "OTHER",
      total: Number(s._sum.amount ?? 0),
    })),
  };
}
