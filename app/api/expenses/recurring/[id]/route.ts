import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { UserRole, ExpenseCategory } from "@prisma/client";

const updateSchema = z.object({
  vendor: z.string().optional().nullable(),
  description: z.string().min(1).optional(),
  category: z.string().optional(),
  amount: z.number().positive().optional(),
  currency: z.string().optional(),
  frequency: z.enum(["MONTHLY", "QUARTERLY", "YEARLY", "CUSTOM"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  notes: z.string().optional().nullable(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = session.user.role as UserRole;
  if (!hasPermission(role, "expenses:create")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { startDate, endDate, category, ...rest } = parsed.data;
  const updated = await prisma.recurringExpense.update({
    where: { id },
    data: {
      ...rest,
      ...(category ? { category: category as ExpenseCategory } : {}),
      ...(startDate ? { startDate: new Date(startDate) } : {}),
      ...(endDate !== undefined ? { endDate: endDate ? new Date(endDate) : null } : {}),
    },
  });

  return NextResponse.json({ data: updated });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  void req;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = session.user.role as UserRole;
  if (!hasPermission(role, "expenses:create")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await prisma.recurringExpense.delete({ where: { id } });
  return NextResponse.json({ data: { success: true } });
}
