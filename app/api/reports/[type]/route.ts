import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

const REPORT_TYPES = ["revenue", "expense", "payroll", "attendance", "project-profitability", "client-activity"] as const;
type ReportType = typeof REPORT_TYPES[number];

export async function GET(req: Request, { params }: { params: Promise<{ type: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = session.user.role as UserRole;
  if (!hasPermission(role, "reports:view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { type } = await params;
  if (!REPORT_TYPES.includes(type as ReportType)) {
    return NextResponse.json({ error: "Unknown report type" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const yearParam = searchParams.get("year");
  const year = yearParam ? Number(yearParam) : new Date().getFullYear();
  const from = new Date(year, 0, 1);
  const to = new Date(year, 11, 31, 23, 59, 59);

  const isFinancial = hasPermission(role, "reports:view_financial");

  switch (type as ReportType) {
    case "revenue": {
      if (!isFinancial) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      const invoices = await prisma.invoice.findMany({
        where: { status: "PAID", deletedAt: null, paidAt: { gte: from, lte: to } },
        include: { client: { select: { companyName: true } } },
        orderBy: { paidAt: "asc" },
      });
      const rows = invoices.map(inv => ({
        invoiceNumber: inv.invoiceNumber,
        client: inv.client.companyName,
        month: inv.paidAt ? new Date(inv.paidAt).toLocaleString("default", { month: "short", year: "numeric" }) : "—",
        total: Number(inv.total),
        currency: inv.currency,
        paidAt: inv.paidAt?.toISOString().slice(0, 10) ?? "—",
      }));
      const total = rows.reduce((s, r) => s + r.total, 0);
      return NextResponse.json({ data: { rows, summary: { total, count: rows.length } } });
    }

    case "expense": {
      if (!isFinancial) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      const expenses = await prisma.expense.findMany({
        where: { deletedAt: null, date: { gte: from, lte: to } },
        orderBy: { date: "asc" },
      });
      const rows = expenses.map(e => ({
        expenseId: e.expenseId,
        date: e.date.toISOString().slice(0, 10),
        vendor: e.vendor ?? "—",
        description: e.description,
        category: e.category,
        amount: Number(e.amount),
        currency: e.currency,
      }));
      const total = rows.reduce((s, r) => s + r.amount, 0);
      // by category
      const byCategory: Record<string, number> = {};
      for (const r of rows) byCategory[r.category] = (byCategory[r.category] ?? 0) + r.amount;
      return NextResponse.json({ data: { rows, summary: { total, count: rows.length, byCategory } } });
    }

    case "payroll": {
      if (!isFinancial) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      const runs = await prisma.payroll.findMany({
        where: { year },
        include: {
          _count: { select: { items: true } },
          items: { select: { netSalary: true, grossSalary: true } },
        },
        orderBy: { month: "asc" },
      });
      const rows = runs.map(r => ({
        month: r.month,
        year: r.year,
        status: r.status,
        employees: r._count.items,
        grossTotal: r.items.reduce((s, i) => s + Number(i.grossSalary), 0),
        netTotal: r.items.reduce((s, i) => s + Number(i.netSalary), 0),
        paidAt: r.paidAt?.toISOString().slice(0, 10) ?? null,
      }));
      const ytdGross = rows.reduce((s, r) => s + r.grossTotal, 0);
      const ytdNet = rows.reduce((s, r) => s + r.netTotal, 0);
      return NextResponse.json({ data: { rows, summary: { ytdGross, ytdNet } } });
    }

    case "attendance": {
      const employees = await prisma.employee.findMany({
        where: { status: "ACTIVE", deletedAt: null },
        select: { id: true, firstName: true, lastName: true, position: true },
        orderBy: { firstName: "asc" },
      });
      const rows = await Promise.all(employees.map(async (emp) => {
        const agg = await prisma.attendance.groupBy({
          by: ["status"],
          where: { employeeId: emp.id, date: { gte: from, lte: to } },
          _count: { status: true },
        });
        const counts: Record<string, number> = {};
        for (const a of agg) counts[a.status] = a._count.status;
        return {
          employee: `${emp.firstName} ${emp.lastName}`,
          position: emp.position ?? "—",
          present: counts["PRESENT"] ?? 0,
          halfDay: counts["HALF_DAY"] ?? 0,
          absent: counts["ABSENT"] ?? 0,
          total: Object.values(counts).reduce((s, v) => s + v, 0),
        };
      }));
      return NextResponse.json({ data: { rows, summary: { employees: rows.length } } });
    }

    case "project-profitability": {
      if (!isFinancial) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      const projects = await prisma.project.findMany({
        where: { deletedAt: null },
        select: {
          id: true, projectId: true, name: true, status: true,
          client: { select: { companyName: true } },
          _count: { select: { tasks: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      const rows = await Promise.all(projects.map(async (p) => {
        const [revenueAgg, timeAgg, expenseAgg] = await Promise.all([
          prisma.invoice.aggregate({ where: { projectId: p.id, status: "PAID", deletedAt: null }, _sum: { total: true } }),
          prisma.timeEntry.aggregate({ where: { projectId: p.id }, _sum: { duration: true } }),
          prisma.expense.aggregate({ where: { deletedAt: null }, _sum: { amount: true } }),
        ]);
        const revenue = Number(revenueAgg._sum.total ?? 0);
        const hoursLogged = Math.round((timeAgg._sum?.duration ?? 0) / 60);
        const expenses = Number(expenseAgg._sum.amount ?? 0);
        return {
          projectId: p.projectId,
          name: p.name,
          client: p.client?.companyName ?? "—",
          status: p.status,
          revenue,
          hoursLogged,
          expenses,
          profit: revenue - expenses,
        };
      }));
      return NextResponse.json({ data: { rows, summary: { projects: rows.length } } });
    }

    case "client-activity": {
      const clients = await prisma.client.findMany({
        where: { deletedAt: null },
        select: {
          id: true, clientId: true, companyName: true, status: true,
          projects: { select: { name: true, status: true, updatedAt: true }, orderBy: { updatedAt: "desc" }, take: 1 },
          invoices: {
            where: { deletedAt: null },
            select: { invoiceNumber: true, status: true, dueDate: true, balanceDue: true, currency: true },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
        orderBy: { companyName: "asc" },
      });
      const rows = clients.map(c => {
        const lastProject = c.projects[0];
        const lastInvoice = c.invoices[0];
        return {
          clientId: c.clientId,
          company: c.companyName,
          status: c.status,
          lastProject: lastProject?.name ?? "—",
          lastProjectStatus: lastProject?.status ?? "—",
          lastInvoice: lastInvoice?.invoiceNumber ?? "—",
          invoiceStatus: lastInvoice?.status ?? "—",
          outstandingBalance: lastInvoice ? Number(lastInvoice.balanceDue) : 0,
          currency: lastInvoice?.currency ?? "USD",
        };
      });
      const totalOutstanding = rows.reduce((s, r) => s + r.outstandingBalance, 0);
      return NextResponse.json({ data: { rows, summary: { clients: rows.length, totalOutstanding } } });
    }
  }
}
