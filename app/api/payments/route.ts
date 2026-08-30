import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { recordPayment } from "@/services/invoice.service";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";
import { z } from "zod";

const createSchema = z.object({
  clientId: z.string().min(1),
  invoiceId: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().optional(),
  paymentDate: z.string().min(1),
  method: z.string().min(1),
  referenceId: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = session.user.role as UserRole;
  if (!hasPermission(role, "payments:view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId") ?? undefined;
  const invoiceId = searchParams.get("invoiceId") ?? undefined;
  const page = Number(searchParams.get("page") ?? 1);
  const limit = Number(searchParams.get("limit") ?? 25);

  const where = {
    deletedAt: null,
    ...(clientId && { clientId }),
    ...(invoiceId && { invoiceId }),
  };

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { paymentDate: "desc" },
      include: {
        client: { select: { id: true, companyName: true } },
        invoice: { select: { id: true, invoiceNumber: true } },
      },
    }),
    prisma.payment.count({ where }),
  ]);

  return NextResponse.json({ data: payments, meta: { total, pages: Math.ceil(total / limit), page } });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = session.user.role as UserRole;
  if (!hasPermission(role, "payments:create")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  try {
    const result = await recordPayment(
      { ...parsed.data, paymentDate: new Date(parsed.data.paymentDate) },
      session.user.id
    );
    return NextResponse.json({ data: result.payment }, { status: 201 });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed to record payment" }, { status: 500 });
  }
}
