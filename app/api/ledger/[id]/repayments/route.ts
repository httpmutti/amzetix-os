import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { addRepayment, deleteRepayment } from "@/services/ledger.service";
import type { UserRole, PaymentMethod } from "@prisma/client";
import { z } from "zod";

const repaySchema = z.object({
  amount: z.number().positive(),
  paidAt: z.string().min(1),
  method: z.string().optional(),
  referenceId: z.string().optional(),
  note: z.string().optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = session.user.role as UserRole;
  if (!hasPermission(role, "expenses:create")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const parsed = repaySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const { paidAt, method, ...rest } = parsed.data;
  const repayment = await addRepayment(
    id,
    { ...rest, paidAt: new Date(paidAt), method: method as PaymentMethod | undefined },
    session.user.id
  );
  return NextResponse.json(repayment, { status: 201 });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = session.user.role as UserRole;
  if (!hasPermission(role, "expenses:delete")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await params; // consume params (id = loan id)
  const { searchParams } = new URL(req.url);
  const repaymentId = searchParams.get("repaymentId");
  if (!repaymentId) return NextResponse.json({ error: "repaymentId required" }, { status: 400 });

  await deleteRepayment(repaymentId, session.user.id);
  return NextResponse.json({ success: true });
}
