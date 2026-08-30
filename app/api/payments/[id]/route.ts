import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/audit";
import type { UserRole } from "@prisma/client";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = session.user.role as UserRole;
  if (!hasPermission(role, "payments:view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const payment = await prisma.payment.findFirst({
    where: { id, deletedAt: null },
    include: {
      client: { select: { id: true, companyName: true } },
      invoice: { select: { id: true, invoiceNumber: true } },
    },
  });
  if (!payment) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: payment });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = session.user.role as UserRole;
  if (!hasPermission(role, "payments:delete")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const payment = await prisma.payment.findFirst({ where: { id, deletedAt: null } });
  if (!payment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Reverse the invoice balance on deletion
  await prisma.$transaction(async (tx) => {
    await tx.payment.update({ where: { id }, data: { deletedAt: new Date() } });

    const invoice = await tx.invoice.findUnique({ where: { id: payment.invoiceId } });
    if (invoice) {
      const newAmountPaid = Math.max(0, Number(invoice.amountPaid) - Number(payment.amount));
      const newBalance = Number(invoice.total) - newAmountPaid;
      const newStatus = newAmountPaid <= 0 ? "SENT" : "PARTIALLY_PAID";
      await tx.invoice.update({
        where: { id: payment.invoiceId },
        data: { amountPaid: newAmountPaid, balanceDue: newBalance, status: newStatus, paidAt: null },
      });
    }
  });

  await createAuditLog({
    performedById: session.user.id,
    action: AUDIT_ACTIONS.DELETE,
    entity: "Payment",
    entityId: id,
    description: `Deleted payment ${payment.paymentNumber}`,
  });

  return NextResponse.json({ data: { success: true } });
}
