import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { listInvoices, createInvoice } from "@/services/invoice.service";
import type { UserRole, InvoiceStatus } from "@prisma/client";
import { z } from "zod";

const createSchema = z.object({
  clientId: z.string().min(1),
  projectId: z.string().optional(),
  issueDate: z.string().optional(),
  dueDate: z.string().min(1),
  currency: z.string().default("USD"),
  items: z.array(z.object({
    description: z.string().min(1),
    quantity: z.number().positive(),
    unitPrice: z.number().min(0),
    service: z.string().optional(),
    sortOrder: z.number().optional(),
  })).min(1, "At least one line item required"),
  discountType: z.enum(["percentage", "fixed"]).optional(),
  discountValue: z.number().min(0).optional(),
  taxRate: z.number().min(0).max(100).optional(),
  paymentTerms: z.number().min(0).optional(),
  paymentLink: z.string().url().optional().or(z.literal("")),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = session.user.role as UserRole;
  if (!hasPermission(role, "invoices:view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as InvoiceStatus | null;
  const clientId = searchParams.get("clientId") ?? undefined;
  const search = searchParams.get("search") ?? undefined;
  const page = Number(searchParams.get("page") ?? 1);
  const limit = Number(searchParams.get("limit") ?? 25);

  const result = await listInvoices({
    status: status ?? undefined,
    clientId,
    search,
    page,
    limit,
  });

  return NextResponse.json({
    data: result.invoices,
    meta: { total: result.total, pages: result.pages, page: result.page },
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = session.user.role as UserRole;
  if (!hasPermission(role, "invoices:create")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  try {
    const invoice = await createInvoice(
      {
        ...parsed.data,
        issueDate: parsed.data.issueDate ? new Date(parsed.data.issueDate) : undefined,
        dueDate: new Date(parsed.data.dueDate),
        discountType: parsed.data.discountType as "percentage" | "fixed" | undefined,
      },
      session.user.id
    );
    return NextResponse.json({ data: invoice }, { status: 201 });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed to create invoice" }, { status: 500 });
  }
}
