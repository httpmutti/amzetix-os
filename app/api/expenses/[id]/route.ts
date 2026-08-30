import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/audit";
import type { UserRole, ExpenseCategory } from "@prisma/client";
import { z } from "zod";

const updateSchema = z.object({
  date: z.string().optional(),
  vendor: z.string().optional().nullable(),
  description: z.string().min(1).optional(),
  category: z.string().optional(),
  amount: z.number().positive().optional(),
  currency: z.string().optional(),
  method: z.string().optional().nullable(),
  clientId: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
  receiptUrl: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "PAID"]).optional(),
});

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = session.user.role as UserRole;
  if (!hasPermission(role, "expenses:view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const expense = await prisma.expense.findFirst({
    where: { id, deletedAt: null },
    include: {
      client: { select: { id: true, companyName: true } },
    },
  });
  if (!expense) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: expense });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = session.user.role as UserRole;
  if (!hasPermission(role, "expenses:edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const existing = await prisma.expense.findFirst({ where: { id, deletedAt: null } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const updated = await prisma.expense.update({
    where: { id },
    data: {
      ...(parsed.data.date && { date: new Date(parsed.data.date) }),
      ...(parsed.data.vendor !== undefined && { vendor: parsed.data.vendor }),
      ...(parsed.data.description && { description: parsed.data.description }),
      ...(parsed.data.category && { category: parsed.data.category as ExpenseCategory }),
      ...(parsed.data.amount !== undefined && { amount: parsed.data.amount }),
      ...(parsed.data.currency && { currency: parsed.data.currency }),
      ...(parsed.data.method !== undefined && { method: parsed.data.method as never }),
      ...(parsed.data.clientId !== undefined && { clientId: parsed.data.clientId }),
      ...(parsed.data.projectId !== undefined && { projectId: parsed.data.projectId }),
      ...(parsed.data.receiptUrl !== undefined && { receiptUrl: parsed.data.receiptUrl }),
      ...(parsed.data.notes !== undefined && { notes: parsed.data.notes }),
      ...(parsed.data.status && { status: parsed.data.status }),
    },
  });

  await createAuditLog({
    performedById: session.user.id,
    action: AUDIT_ACTIONS.UPDATE,
    entity: "Expense",
    entityId: id,
    description: `Updated expense ${existing.expenseId}`,
  });

  return NextResponse.json({ data: updated });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = session.user.role as UserRole;
  if (!hasPermission(role, "expenses:delete")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const existing = await prisma.expense.findFirst({ where: { id, deletedAt: null } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.expense.update({ where: { id }, data: { deletedAt: new Date() } });

  await createAuditLog({
    performedById: session.user.id,
    action: AUDIT_ACTIONS.DELETE,
    entity: "Expense",
    entityId: id,
    description: `Deleted expense ${existing.expenseId}`,
  });

  return NextResponse.json({ data: { success: true } });
}
