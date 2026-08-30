import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { addMonths, addQuarters, addYears } from "date-fns";
import type { UserRole } from "@prisma/client";

function advanceDate(date: Date, frequency: string): Date {
  switch (frequency) {
    case "MONTHLY":    return addMonths(date, 1);
    case "QUARTERLY":  return addQuarters(date, 1);
    case "YEARLY":     return addYears(date, 1);
    default:           return addMonths(date, 1);
  }
}

async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.invoice.count();
  return `INV-${year}-${String(count + 1).padStart(4, "0")}`;
}

export async function POST() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user.role as UserRole, "invoices:create"))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = await prisma.recurringInvoice.findMany({
    where: {
      isActive: true,
      nextDate: { lte: today },
      OR: [{ endDate: null }, { endDate: { gte: today } }],
    },
  });

  const created: string[] = [];

  for (const rec of due) {
    const invoiceNumber = await generateInvoiceNumber();
    const dueDate = new Date(rec.nextDate);
    dueDate.setDate(dueDate.getDate() + rec.paymentTerms);

    await prisma.$transaction([
      prisma.invoice.create({
        data: {
          invoiceNumber,
          clientId: rec.clientId,
          recurringId: rec.id,
          issueDate: rec.nextDate,
          dueDate,
          currency: rec.currency,
          subtotal: rec.amount,
          taxRate: 0,
          taxAmount: 0,
          discountAmount: 0,
          discountValue: 0,
          total: rec.amount,
          amountPaid: 0,
          balanceDue: rec.amount,
          status: "DRAFT",
          notes: rec.notes ?? undefined,
          items: {
            create: [{
              description: rec.description ?? `${rec.service ?? "Service"} — ${invoiceNumber}`,
              quantity: 1,
              unitPrice: rec.amount,
              amount: rec.amount,
              sortOrder: 0,
            }],
          },
        },
      }),
      prisma.recurringInvoice.update({
        where: { id: rec.id },
        data: { nextDate: advanceDate(rec.nextDate, rec.frequency) },
      }),
    ]);

    created.push(invoiceNumber);
  }

  return NextResponse.json({ data: { generated: created.length, invoices: created } });
}
