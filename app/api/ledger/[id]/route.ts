import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { getLoan, updateLoan, deleteLoan } from "@/services/ledger.service";
import type { UserRole, LoanStatus } from "@prisma/client";
import { z } from "zod";

const updateSchema = z.object({
  source: z.string().min(1).optional(),
  principal: z.number().positive().optional(),
  interestRate: z.number().min(0).optional(),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  purpose: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["ACTIVE", "FULLY_REPAID", "ON_HOLD", "DEFAULTED"]).optional(),
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = session.user.role as UserRole;
  if (!hasPermission(role, "revenue:view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const loan = await getLoan(id);
  return NextResponse.json(loan);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = session.user.role as UserRole;
  if (!hasPermission(role, "expenses:edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const { startDate, dueDate, ...rest } = parsed.data;
  const loan = await updateLoan(
    id,
    {
      ...rest,
      status: rest.status as LoanStatus | undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      dueDate: dueDate ? new Date(dueDate) : undefined,
    },
    session.user.id
  );
  return NextResponse.json(loan);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = session.user.role as UserRole;
  if (!hasPermission(role, "expenses:delete")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await deleteLoan(id, session.user.id);
  return NextResponse.json({ success: true });
}
