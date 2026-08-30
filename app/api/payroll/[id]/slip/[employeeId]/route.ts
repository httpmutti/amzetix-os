import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; employeeId: string }> }
) {
  void req;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = session.user.role as UserRole;
  if (!hasPermission(role, "payroll:view_all")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, employeeId } = await params;

  const payroll = await prisma.payroll.findUnique({ where: { id } });
  if (!payroll) return NextResponse.json({ error: "Payroll not found" }, { status: 404 });

  const item = await prisma.payrollEmployee.findUnique({
    where: { payrollId_employeeId: { payrollId: id, employeeId } },
    include: {
      employee: {
        include: {
          user: { select: { name: true, email: true } },
          department: { select: { name: true } },
        },
      },
    },
  });

  if (!item) return NextResponse.json({ error: "Employee not found in payroll" }, { status: 404 });

  return NextResponse.json({
    data: {
      payroll: { month: payroll.month, year: payroll.year, status: payroll.status, paidAt: payroll.paidAt },
      item,
    },
  });
}
