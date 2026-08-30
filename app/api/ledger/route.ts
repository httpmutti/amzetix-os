import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { listLoans, createLoan } from "@/services/ledger.service";
import type { UserRole } from "@prisma/client";
import { z } from "zod";

const createSchema = z.object({
  source: z.string().min(1),
  principal: z.number().positive(),
  currency: z.string().optional(),
  interestRate: z.number().min(0).optional(),
  startDate: z.string().min(1),
  dueDate: z.string().optional(),
  purpose: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = session.user.role as UserRole;
  if (!hasPermission(role, "revenue:view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const data = await listLoans();
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = session.user.role as UserRole;
  if (!hasPermission(role, "expenses:create")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });

  const { startDate, dueDate, ...rest } = parsed.data;
  const loan = await createLoan(
    { ...rest, startDate: new Date(startDate), dueDate: dueDate ? new Date(dueDate) : undefined },
    session.user.id
  );
  return NextResponse.json(loan, { status: 201 });
}
