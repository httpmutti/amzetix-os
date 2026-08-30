import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { listExpenses, createExpense } from "@/services/expense.service";
import type { UserRole, ExpenseCategory } from "@prisma/client";
import { z } from "zod";

const createSchema = z.object({
  date: z.string().min(1),
  vendor: z.string().optional(),
  description: z.string().min(1),
  category: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().default("USD"),
  method: z.string().optional(),
  clientId: z.string().optional(),
  projectId: z.string().optional(),
  receiptUrl: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = session.user.role as UserRole;
  if (!hasPermission(role, "expenses:view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") as ExpenseCategory | null;
  const clientId = searchParams.get("clientId") ?? undefined;
  const search = searchParams.get("search") ?? undefined;
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const page = Number(searchParams.get("page") ?? 1);
  const limit = Number(searchParams.get("limit") ?? 25);

  const result = await listExpenses({
    category: category ?? undefined,
    clientId,
    search,
    from: from ? new Date(from) : undefined,
    to: to ? new Date(to) : undefined,
    page,
    limit,
  });

  return NextResponse.json({
    data: result.expenses,
    meta: { total: result.total, pages: result.pages, page: result.page, totalAmount: result.totalAmount },
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = session.user.role as UserRole;
  if (!hasPermission(role, "expenses:create")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  try {
    const expense = await createExpense(
      {
        ...parsed.data,
        date: new Date(parsed.data.date),
        category: parsed.data.category as ExpenseCategory,
        method: parsed.data.method as never,
      },
      session.user.id
    );
    return NextResponse.json({ data: expense }, { status: 201 });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed to create expense" }, { status: 500 });
  }
}
