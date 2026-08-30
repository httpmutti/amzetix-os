import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/audit";
import { sendPayslipEmail } from "@/lib/email";
import type { UserRole } from "@prisma/client";

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  void req;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = session.user.role as UserRole;
  if (!hasPermission(role, "payroll:approve")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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
  if (!payroll) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (payroll.status === "PAID") return NextResponse.json({ error: "Already paid" }, { status: 400 });
  if (payroll.status !== "APPROVED") {
    return NextResponse.json({ error: "Payroll must be approved before marking as paid" }, { status: 400 });
  }

  const paidAt = new Date();

  const updated = await prisma.payroll.update({
    where: { id },
    data: { status: "PAID", paidAt },
  });

  await createAuditLog({
    performedById: session.user.id,
    action: AUDIT_ACTIONS.STATUS_CHANGE,
    entity: "Payroll",
    entityId: id,
    newValues: { status: "PAID" },
    description: `Marked payroll ${payroll.month}/${payroll.year} as paid`,
  });

  // Send payslip email to every employee — fire and forget, don't block the response
  const monthName = MONTH_NAMES[payroll.month - 1];
  const companyName = process.env.COMPANY_NAME ?? "Amzetix";

  void Promise.allSettled(
    payroll.items.map(async (item) => {
      const to = item.employee.user.email;
      if (!to) return;
      try {
        await sendPayslipEmail(
          {
            companyName,
            employeeName: `${item.employee.firstName} ${item.employee.lastName}`,
            employeeId: item.employee.employeeId,
            position: item.employee.position ?? undefined,
            department: item.employee.department?.name ?? undefined,
            month: monthName,
            year: payroll.year,
            basicSalary: Number(item.baseSalary).toFixed(2),
            allowances: Number(item.allowances).toFixed(2),
            bonuses: Number(item.bonuses).toFixed(2),
            overtimePay: Number(item.overtime).toFixed(2),
            grossPay: Number(item.grossSalary).toFixed(2),
            taxDeductions: Number(item.taxDeductions).toFixed(2),
            otherDeductions: Number(item.otherDeductions).toFixed(2),
            advances: Number(item.advances).toFixed(2),
            netPay: Number(item.netSalary).toFixed(2),
            currency: item.currency,
            paidAt: paidAt.toLocaleDateString("en", { day: "numeric", month: "long", year: "numeric" }),
          },
          to
        );
        // Mark payslip as sent on the item
        await prisma.payrollEmployee.update({
          where: { id: item.id },
          data: { payslipSentAt: new Date(), paidAt, status: "PAID" },
        });
      } catch {
        // Log but don't fail — salary was still marked paid
      }
    })
  );

  return NextResponse.json({ data: updated });
}
