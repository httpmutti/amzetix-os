import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/audit";
import { createNotificationForMany } from "@/lib/notifications";
import { sendInvoiceEmail } from "@/lib/email";
import type { UserRole } from "@prisma/client";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = session.user.role as UserRole;
  if (!hasPermission(role, "invoices:send")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const invoice = await prisma.invoice.findFirst({
    where: { id, deletedAt: null },
    include: {
      client: { select: { companyName: true, email: true } },
      items: { select: { description: true, quantity: true, unitPrice: true, amount: true } },
    },
  });
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (invoice.status === "PAID") return NextResponse.json({ error: "Invoice is already paid" }, { status: 400 });
  if (invoice.status === "CANCELLED") return NextResponse.json({ error: "Invoice is cancelled" }, { status: 400 });

  const updated = await prisma.invoice.update({
    where: { id },
    data: { status: "SENT", sentAt: new Date() },
  });

  await createAuditLog({
    performedById: session.user.id,
    action: AUDIT_ACTIONS.SEND,
    entity: "Invoice",
    entityId: id,
    description: `Sent invoice ${invoice.invoiceNumber} to ${invoice.client.companyName}`,
  });

  // Notify client portal users
  const clientUsers = await prisma.clientUser.findMany({
    where: { clientId: invoice.clientId },
    select: { userId: true },
  });
  if (clientUsers.length > 0) {
    await createNotificationForMany(
      clientUsers.map(cu => cu.userId),
      {
        type: "INVOICE_CREATED",
        title: "New invoice received",
        message: `Invoice ${invoice.invoiceNumber} has been sent to you.`,
        link: `/portal/invoices/${id}`,
      }
    );
  }

  // Send email to client (fire-and-forget — email failure must not block the API response)
  if (invoice.client.email) {
    const companyName = process.env.COMPANY_NAME ?? "Amzetix -OS";
    const portalUrl = `${process.env.NEXTAUTH_URL ?? ""}/portal/invoices/${id}`;
    sendInvoiceEmail(
      {
        companyName,
        clientName: invoice.client.companyName,
        invoiceNumber: invoice.invoiceNumber,
        issueDate: invoice.issueDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
        dueDate: invoice.dueDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
        total: Number(invoice.total).toFixed(2),
        currency: invoice.currency,
        portalUrl,
        paymentLink: invoice.paymentLink ?? undefined,
        items: invoice.items.map((item) => ({
          description: item.description,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice).toFixed(2),
          total: Number(item.amount).toFixed(2),
        })),
      },
      invoice.client.email,
    ).catch((err) => console.error("[email] invoice send failed:", err));
  }

  return NextResponse.json({ data: updated });
}
