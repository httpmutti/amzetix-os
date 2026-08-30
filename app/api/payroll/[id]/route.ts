import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { getPayrollRun, calculateEmployeePayroll } from "@/services/payroll.service";
import { prisma } from "@/lib/prisma";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/audit";
import { z } from "zod";
import type { UserRole } from "@prisma/client";

// PATCH body: update one employee's adjustments and recalculate
const patchSchema = z.object({
  employeeId: z.string().min(1),
  allowances: z.number().min(0).optional(),
  bonuses: z.number().min(0).optional(),
  overtimeHours: z.number().min(0).optional(),
  overtimeRate: z.number().min(0).optional(),
  advances: z.number().min(0).optional(),
  taxDeductions: z.number().min(0).optional(),
  otherDeductions: z.number().min(0).optional(),
  notes: z.string().optional(),
});

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  void req;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = session.user.role as UserRole;
  if (!hasPermission(role, "payroll:view_all")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const payroll = await getPayrollRun(id);
  if (!payroll) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ data: payroll });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = session.user.role as UserRole;
  if (!hasPermission(role, "payroll:edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const payroll = await prisma.payroll.findUnique({ where: { id } });
  if (!payroll) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (payroll.status === "APPROVED" || payroll.status === "PAID") {
    return NextResponse.json({ error: "Cannot edit an approved or paid payroll" }, { status: 400 });
  }

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { employeeId, ...overrides } = parsed.data;

  const calc = await calculateEmployeePayroll(employeeId, payroll.month, payroll.year, {
    allowances: overrides.allowances,
    bonuses: overrides.bonuses,
    overtimeHours: overrides.overtimeHours,
    overtimeRate: overrides.overtimeRate,
    advances: overrides.advances,
    taxDeductions: overrides.taxDeductions,
    otherDeductions: overrides.otherDeductions,
  });

  const updated = await prisma.payrollEmployee.update({
    where: { payrollId_employeeId: { payrollId: id, employeeId } },
    data: {
      allowances: calc.allowances,
      bonuses: calc.bonuses,
      overtime: calc.overtime,
      grossSalary: calc.grossSalary,
      deductions: calc.deductions,
      unpaidLeave: calc.unpaidLeave,
      absentDeduction: calc.absentDeduction,
      hoursDeduction: calc.hoursDeduction,
      weeklyShortfalls: calc.weeklyShortfalls,
      advances: calc.advances,
      taxDeductions: calc.taxDeductions,
      otherDeductions: calc.otherDeductions,
      netSalary: calc.netSalary,
      overtimeHours: calc.overtimeHours,
      notes: overrides.notes,
    },
  });

  await createAuditLog({
    performedById: session.user.id,
    action: AUDIT_ACTIONS.UPDATE,
    entity: "PayrollEmployee",
    entityId: updated.id,
    description: `Updated payroll adjustment for employee ${employeeId}`,
  });

  return NextResponse.json({ data: updated });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  void req;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = session.user.role as UserRole;
  if (!hasPermission(role, "payroll:create")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const payroll = await prisma.payroll.findUnique({ where: { id } });
  if (!payroll) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (payroll.status === "PAID") return NextResponse.json({ error: "Cannot delete a paid payroll" }, { status: 400 });

  await prisma.payroll.delete({ where: { id } });
  await createAuditLog({
    performedById: session.user.id,
    action: AUDIT_ACTIONS.DELETE,
    entity: "Payroll",
    entityId: id,
    description: `Deleted payroll run ${payroll.month}/${payroll.year}`,
  });

  return NextResponse.json({ data: { success: true } });
}
