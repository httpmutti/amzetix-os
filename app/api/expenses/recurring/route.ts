import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { UserRole, ExpenseCategory } from "@prisma/client";

const createSchema = z.object({
  vendor: z.string().optional(),
  description: z.string().min(1),
  category: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().default("PKR"),
  frequency: z.enum(["MONTHLY", "QUARTERLY", "YEARLY", "CUSTOM"]).default("MONTHLY"),
  startDate: z.string().min(1),
  endDate: z.string().optional().nullable(),
  notes: z.string().optional(),
});

export async function GET(req: Request) {
  void req;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = session.user.role as UserRole;
  if (!hasPermission(role, "expenses:view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const subs = await prisma.recurringExpense.findMany({
    orderBy: { nextDate: "asc" },
  });
  return NextResponse.json({ data: subs });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = session.user.role as UserRole;
  if (!hasPermission(role, "expenses:create")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { startDate, endDate, ...rest } = parsed.data;
  const start = new Date(startDate);

  // Calculate next date based on frequency
  const next = new Date(start);
  const today = new Date();
  if (next < today) {
    // advance until next date is in the future
    while (next < today) {
      if (rest.frequency === "MONTHLY") next.setMonth(next.getMonth() + 1);
      else if (rest.frequency === "QUARTERLY") next.setMonth(next.getMonth() + 3);
      else if (rest.frequency === "YEARLY") next.setFullYear(next.getFullYear() + 1);
      else break;
    }
  }

  const sub = await prisma.recurringExpense.create({
    data: {
      ...rest,
      category: rest.category as ExpenseCategory,
      startDate: start,
      endDate: endDate ? new Date(endDate) : null,
      nextDate: next,
    },
  });

  return NextResponse.json({ data: sub }, { status: 201 });
}
