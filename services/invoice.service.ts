import { prisma } from "@/lib/prisma";
import type { InvoiceStatus } from "@prisma/client";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";

// ─── Invoice number generation ────────────────────────────────────

async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.invoice.count();
  return `INV-${year}-${String(count + 1).padStart(4, "0")}`;
}

// ─── Invoice calculations (always server-side) ────────────────────

export function calculateInvoiceTotals(params: {
  items: { quantity: number; unitPrice: number }[];
  discountType?: "percentage" | "fixed" | null;
  discountValue?: number;
  taxRate?: number;
}) {
  const subtotal = params.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  let discountAmount = 0;
  if (params.discountType === "percentage") {
    discountAmount = (subtotal * (params.discountValue ?? 0)) / 100;
  } else if (params.discountType === "fixed") {
    discountAmount = params.discountValue ?? 0;
  }

  const afterDiscount = subtotal - discountAmount;
  const taxAmount = (afterDiscount * (params.taxRate ?? 0)) / 100;
  const total = afterDiscount + taxAmount;

  return { subtotal, discountAmount, taxAmount, total };
}

export interface CreateInvoiceInput {
  clientId: string;
  projectId?: string;
  issueDate?: Date;
  dueDate: Date;
  currency?: string;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    service?: string;
    sortOrder?: number;
  }[];
  discountType?: "percentage" | "fixed";
  discountValue?: number;
  taxRate?: number;
  paymentTerms?: number;
  paymentLink?: string;
  notes?: string;
  internalNotes?: string;
  recurringId?: string;
}

export async function createInvoice(input: CreateInvoiceInput, performedById: string) {
  const invoiceNumber = await generateInvoiceNumber();

  const { subtotal, discountAmount, taxAmount, total } = calculateInvoiceTotals({
    items: input.items,
    discountType: input.discountType,
    discountValue: input.discountValue,
    taxRate: input.taxRate,
  });

  const invoice = await prisma.$transaction(async (tx) => {
    const inv = await tx.invoice.create({
      data: {
        invoiceNumber,
        clientId: input.clientId,
        projectId: input.projectId,
        issueDate: input.issueDate ?? new Date(),
        dueDate: input.dueDate,
        currency: input.currency ?? "PKR",
        subtotal,
        discountType: input.discountType,
        discountValue: input.discountValue ?? 0,
        discountAmount,
        taxRate: input.taxRate ?? 0,
        taxAmount,
        total,
        balanceDue: total,
        paymentTerms: input.paymentTerms ?? 30,
        paymentLink: input.paymentLink,
        notes: input.notes,
        internalNotes: input.internalNotes,
        recurringId: input.recurringId,
        status: "DRAFT",
        items: {
          create: input.items.map((item, i) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.quantity * item.unitPrice,
            service: item.service as never,
            sortOrder: item.sortOrder ?? i,
          })),
        },
      },
      include: { items: true, client: { select: { companyName: true } } },
    });
    return inv;
  });

  await createAuditLog({
    performedById,
    action: AUDIT_ACTIONS.CREATE,
    entity: "Invoice",
    entityId: invoice.id,
    newValues: { invoiceNumber, total, clientId: input.clientId },
    description: `Created invoice ${invoiceNumber} for ${invoice.client.companyName} — $${total.toFixed(2)}`,
  });

  return invoice;
}

// ─── Record a payment and update invoice status ───────────────────

export interface RecordPaymentInput {
  clientId: string;
  invoiceId: string;
  amount: number;
  currency?: string;
  paymentDate: Date;
  method: string;
  referenceId?: string;
  notes?: string;
}

async function generatePaymentNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.payment.count();
  return `PAY-${year}-${String(count + 1).padStart(4, "0")}`;
}

export async function recordPayment(input: RecordPaymentInput, performedById: string) {
  const paymentNumber = await generatePaymentNumber();

  const result = await prisma.$transaction(async (tx) => {
    // Validate invoice belongs to client and is payable
    const invoice = await tx.invoice.findFirst({
      where: { id: input.invoiceId, clientId: input.clientId, deletedAt: null },
    });
    if (!invoice) throw new Error("Invoice not found");
    if (["PAID", "CANCELLED"].includes(invoice.status)) {
      throw new Error("Invoice is already paid or cancelled");
    }

    const paymentAmount = Math.min(input.amount, Number(invoice.balanceDue));

    // Create payment
    const payment = await tx.payment.create({
      data: {
        paymentNumber,
        clientId: input.clientId,
        invoiceId: input.invoiceId,
        amount: paymentAmount,
        currency: input.currency ?? invoice.currency,
        paymentDate: input.paymentDate,
        method: input.method as never,
        referenceId: input.referenceId,
        notes: input.notes,
      },
    });

    // Update invoice
    const newAmountPaid = Number(invoice.amountPaid) + paymentAmount;
    const newBalance = Number(invoice.total) - newAmountPaid;

    let newStatus: InvoiceStatus;
    if (newBalance <= 0) {
      newStatus = "PAID";
    } else if (newAmountPaid > 0) {
      newStatus = "PARTIALLY_PAID";
    } else {
      newStatus = invoice.status as InvoiceStatus;
    }

    await tx.invoice.update({
      where: { id: input.invoiceId },
      data: {
        amountPaid: newAmountPaid,
        balanceDue: Math.max(0, newBalance),
        status: newStatus,
        paidAt: newStatus === "PAID" ? new Date() : null,
      },
    });

    return { payment, newStatus, newBalance };
  });

  await createAuditLog({
    performedById,
    action: AUDIT_ACTIONS.PAYMENT_RECORDED,
    entity: "Invoice",
    entityId: input.invoiceId,
    newValues: { amount: input.amount, status: result.newStatus },
    description: `Payment of $${input.amount} recorded. Balance: $${result.newBalance.toFixed(2)}. Status: ${result.newStatus}`,
  });

  return result;
}

// ─── Update overdue statuses (run via cron/scheduler) ────────────

export async function markOverdueInvoices() {
  const now = new Date();
  const { count } = await prisma.invoice.updateMany({
    where: {
      deletedAt: null,
      status: { in: ["SENT", "PARTIALLY_PAID"] },
      dueDate: { lt: now },
    },
    data: { status: "OVERDUE" },
  });
  return count;
}

// ─── List invoices ────────────────────────────────────────────────

export interface InvoiceFilters {
  status?: InvoiceStatus;
  clientId?: string;
  search?: string;
  page?: number;
  limit?: number;
  from?: Date;
  to?: Date;
}

export async function listInvoices(filters: InvoiceFilters = {}) {
  const { status, clientId, search, page = 1, limit = 20, from, to } = filters;

  const where = {
    deletedAt: null,
    ...(status && { status }),
    ...(clientId && { clientId }),
    ...(from && to && { issueDate: { gte: from, lte: to } }),
    ...(search && {
      OR: [
        { invoiceNumber: { contains: search, mode: "insensitive" as const } },
        { client: { companyName: { contains: search, mode: "insensitive" as const } } },
      ],
    }),
  };

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { issueDate: "desc" },
      include: {
        client: { select: { id: true, companyName: true } },
        _count: { select: { items: true, payments: true } },
      },
    }),
    prisma.invoice.count({ where }),
  ]);

  return { invoices, total, pages: Math.ceil(total / limit), page };
}
