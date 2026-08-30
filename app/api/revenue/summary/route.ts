import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = session.user.role as UserRole;
  if (!hasPermission(role, "revenue:view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const yearParam = searchParams.get("year");
  const year = yearParam ? Number(yearParam) : new Date().getFullYear();

  const from = new Date(year, 0, 1);
  const to = new Date(year, 11, 31, 23, 59, 59);

  // Revenue: sum of paid invoices
  const revenueAgg = await prisma.invoice.aggregate({
    where: { status: "PAID", deletedAt: null, paidAt: { gte: from, lte: to } },
    _sum: { total: true },
  });
  const totalRevenue = Number(revenueAgg._sum.total ?? 0);

  // Expenses: sum of approved/paid expenses
  const expenseAgg = await prisma.expense.aggregate({
    where: { deletedAt: null, date: { gte: from, lte: to } },
    _sum: { amount: true },
  });
  const totalExpenses = Number(expenseAgg._sum.amount ?? 0);

  // Payroll: sum of net salaries for PAID payroll runs in the year
  const payrollRuns = await prisma.payroll.findMany({
    where: { year, status: "PAID" },
    select: { id: true },
  });
  const payrollIds = payrollRuns.map((r) => r.id);
  const payrollAgg = payrollIds.length > 0
    ? await prisma.payrollEmployee.aggregate({
        where: { payrollId: { in: payrollIds } },
        _sum: { netSalary: true },
      })
    : { _sum: { netSalary: 0 } };
  const totalPayroll = Number(payrollAgg._sum.netSalary ?? 0);

  // Owner withdrawals
  const withdrawalAgg = await prisma.ownerWithdrawal.aggregate({
    where: { date: { gte: from, lte: to } },
    _sum: { amount: true },
  });
  const totalWithdrawals = Number(withdrawalAgg._sum.amount ?? 0);

  const totalCosts = totalExpenses + totalPayroll;
  const netProfit = totalRevenue - totalCosts;

  // Monthly trend — revenue vs costs for each month
  const monthly: { month: number; revenue: number; expenses: number; payroll: number }[] = [];
  for (let m = 1; m <= 12; m++) {
    const mFrom = new Date(year, m - 1, 1);
    const mTo = new Date(year, m, 0, 23, 59, 59);

    const [mRev, mExp, mPayRun] = await Promise.all([
      prisma.invoice.aggregate({
        where: { status: "PAID", deletedAt: null, paidAt: { gte: mFrom, lte: mTo } },
        _sum: { total: true },
      }),
      prisma.expense.aggregate({
        where: { deletedAt: null, date: { gte: mFrom, lte: mTo } },
        _sum: { amount: true },
      }),
      prisma.payroll.findMany({
        where: { year, month: m, status: "PAID" },
        select: { id: true },
      }),
    ]);

    const mPayrollIds = mPayRun.map((r) => r.id);
    const mPayrollAgg = mPayrollIds.length > 0
      ? await prisma.payrollEmployee.aggregate({
          where: { payrollId: { in: mPayrollIds } },
          _sum: { netSalary: true },
        })
      : { _sum: { netSalary: 0 } };

    monthly.push({
      month: m,
      revenue: Number(mRev._sum.total ?? 0),
      expenses: Number(mExp._sum.amount ?? 0),
      payroll: Number(mPayrollAgg._sum.netSalary ?? 0),
    });
  }

  // Expense breakdown by category (full year)
  const expenseByCategory = await prisma.expense.groupBy({
    by: ["category"],
    where: { deletedAt: null, date: { gte: from, lte: to } },
    _sum: { amount: true },
    orderBy: { _sum: { amount: "desc" } },
  });

  // Owner withdrawals list
  const withdrawals = await prisma.ownerWithdrawal.findMany({
    where: { date: { gte: from, lte: to } },
    orderBy: { date: "desc" },
  });

  return NextResponse.json({
    data: {
      year,
      summary: { totalRevenue, totalExpenses, totalPayroll, totalCosts, netProfit, totalWithdrawals },
      monthly,
      expenseByCategory: expenseByCategory.map((e) => ({
        category: e.category,
        total: Number(e._sum.amount ?? 0),
      })),
      withdrawals,
    },
  });
}
