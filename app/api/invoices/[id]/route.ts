import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { calculateInvoiceTotals } from "@/services/invoice.service";
import { prisma } from "@/lib/prisma";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/audit";
import type { UserRole } from "@prisma/client";
import { z } from "zod";

const updateSchema = z.object({
  clientId: z.string().optional(),
  projectId: z.string().optional().nullable(),
  issueDate: z.string().optional(),
  dueDate: z.string().optional(),
  currency: z.string().optional(),
  items: z.array(z.object({
    id: z.string().optional(),
    description: z.string().min(1),
    quantity: z.number().positive(),
    unitPrice: z.number().min(0),
    service: z.string().optional().nullable(),
    sortOrder: z.number().optional(),
  })).optional(),
  discountType: z.string().optional().nullable(),
  discountValue: z.number().min(0).optional(),
  taxRate: z.number().min(0).max(100).optional(),
  paymentTerms: z.number().min(0).optional(),
  paymentLink: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  internalNotes: z.string().optional().nullable(),
  status: z.enum(["DRAFT", "SENT", "PARTIALLY_PAID", "PAID", "OVERDUE", "CANCELLED"]).optional(),
});

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = session.user.role as UserRole;
  if (!hasPermission(role, "invoices:view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const invoice = await prisma.invoice.findFirst({
    where: { id, deletedAt: null },
    include: {
      client: { select: { id: true, companyName: true, contactPerson: true, email: true, address: true, country: true, currency: true } },
      items: { orderBy: { sortOrder: "asc" } },
      payments: { orderBy: { paymentDate: "desc" }, where: { deletedAt: null } },
    },
  });

  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: invoice });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = session.user.role as UserRole;
  if (!hasPermission(role, "invoices:edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const existing = await prisma.invoice.findFirst({ where: { id, deletedAt: null } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.status === "PAID") return NextResponse.json({ error: "Cannot edit a paid invoice" }, { status: 400 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { items, ...rest } = parsed.data;

  let totalsUpdate: Record<string, number> = {};
  if (items) {
    const { subtotal, discountAmount, taxAmount, total } = calculateInvoiceTotals({
      items,
      discountType: (rest.discountType ?? existing.discountType) as "percentage" | "fixed" | null,
      discountValue: rest.discountValue ?? Number(existing.discountValue),
      taxRate: rest.taxRate ?? Number(existing.taxRate),
    });
    const amountPaid = Number(existing.amountPaid);
    totalsUpdate = { subtotal, discountAmount, taxAmount, total, balanceDue: Math.max(0, total - amountPaid) };
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (items) {
      await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });
      await tx.invoiceItem.createMany({
        data: items.map((item, i) => ({
          invoiceId: id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.quantity * item.unitPrice,
          service: item.service as never,
          sortOrder: item.sortOrder ?? i,
        })),
      });
    }

    return tx.invoice.update({
      where: { id },
      data: {
        ...(rest.clientId && { clientId: rest.clientId }),
        ...(rest.projectId !== undefined && { projectId: rest.projectId }),
        ...(rest.issueDate && { issueDate: new Date(rest.issueDate) }),
        ...(rest.dueDate && { dueDate: new Date(rest.dueDate) }),
        ...(rest.currency && { currency: rest.currency }),
        ...(rest.discountType !== undefined && { discountType: rest.discountType }),
        ...(rest.discountValue !== undefined && { discountValue: rest.discountValue }),
        ...(rest.taxRate !== undefined && { taxRate: rest.taxRate }),
        ...(rest.paymentTerms !== undefined && { paymentTerms: rest.paymentTerms }),
        ...(rest.paymentLink !== undefined && { paymentLink: rest.paymentLink }),
        ...(rest.notes !== undefined && { notes: rest.notes }),
        ...(rest.internalNotes !== undefined && { internalNotes: rest.internalNotes }),
        ...(rest.status && { status: rest.status }),
        ...totalsUpdate,
      },
      include: { client: { select: { companyName: true } }, items: { orderBy: { sortOrder: "asc" } } },
    });
  });

  await createAuditLog({
    performedById: session.user.id,
    action: AUDIT_ACTIONS.UPDATE,
    entity: "Invoice",
    entityId: id,
    description: `Updated invoice ${existing.invoiceNumber}`,
  });

  return NextResponse.json({ data: updated });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = session.user.role as UserRole;
  if (!hasPermission(role, "invoices:delete")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const existing = await prisma.invoice.findFirst({ where: { id, deletedAt: null } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.status === "PAID") return NextResponse.json({ error: "Cannot delete a paid invoice" }, { status: 400 });

  await prisma.invoice.update({ where: { id }, data: { deletedAt: new Date() } });

  await createAuditLog({
    performedById: session.user.id,
    action: AUDIT_ACTIONS.DELETE,
    entity: "Invoice",
    entityId: id,
    description: `Deleted invoice ${existing.invoiceNumber}`,
  });

  return NextResponse.json({ data: { success: true } });
}
