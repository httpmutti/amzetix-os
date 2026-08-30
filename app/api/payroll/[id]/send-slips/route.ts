import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { sendPayslipEmail } from "@/lib/email";
import type { UserRole } from "@prisma/client";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user.role as UserRole, "payroll:view_all"))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const payroll = await prisma.payroll.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          employee: {
            include: {
              user: { select: { email: true, name: true } },
              department: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  if (!payroll) return NextResponse.json({ error: "Payroll not found" }, { status: 404 });

  const companyName = process.env.COMPANY_NAME ?? "Amzetix -OS";
  const monthName = MONTHS[(payroll.month - 1)] ?? String(payroll.month);
  const paidAt = payroll.paidAt
    ? payroll.paidAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : undefined;

  const fmt = (n: unknown) => Number(n).toFixed(2);

  const results = await Promise.allSettled(
    payroll.items
      .filter((item) => item.employee.user?.email)
      .map((item) =>
        sendPayslipEmail(
          {
            companyName,
            employeeName: `${item.employee.firstName} ${item.employee.lastName}`,
            employeeId: item.employee.employeeId,
            position: item.employee.position ?? undefined,
            department: item.employee.department?.name ?? undefined,
            month: monthName,
            year: payroll.year,
            basicSalary: fmt(item.baseSalary),
            allowances: fmt(item.allowances),
            bonuses: fmt(item.bonuses),
            overtimePay: fmt(item.overtime),
            grossPay: fmt(item.grossSalary),
            taxDeductions: fmt(item.taxDeductions),
            otherDeductions: fmt(item.otherDeductions),
            advances: fmt(item.advances),
            netPay: fmt(item.netSalary),
            currency: item.currency,
            paidAt,
          },
          item.employee.user!.email!,
        )
      )
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  return NextResponse.json({ data: { sent, failed, total: payroll.items.length } });
}
