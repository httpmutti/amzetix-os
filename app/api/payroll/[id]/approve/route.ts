import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/audit";
import type { UserRole } from "@prisma/client";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  void req;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = session.user.role as UserRole;
  if (!hasPermission(role, "payroll:approve")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const payroll = await prisma.payroll.findUnique({ where: { id } });
  if (!payroll) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (payroll.status === "APPROVED" || payroll.status === "PAID") {
    return NextResponse.json({ error: "Payroll is already approved or paid" }, { status: 400 });
  }

  const updated = await prisma.payroll.update({
    where: { id },
    data: { status: "APPROVED", approvedBy: session.user.id, approvedAt: new Date() },
  });

  await createAuditLog({
    performedById: session.user.id,
    action: AUDIT_ACTIONS.APPROVE,
    entity: "Payroll",
    entityId: id,
    description: `Approved payroll run ${payroll.month}/${payroll.year}`,
  });

  return NextResponse.json({ data: updated });
}
