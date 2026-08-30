import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { createClient, listClients } from "@/services/client.service";
import { z } from "zod";
import type { UserRole, ClientStatus } from "@prisma/client";

const createClientSchema = z.object({
  companyName: z.string().min(2, "Company name required"),
  contactPerson: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  billingEmail: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  country: z.string().optional(),
  address: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  taxId: z.string().optional(),
  paymentTerms: z.number().int().positive().optional(),
  currency: z.string().length(3).optional(),
  status: z.enum(["LEAD", "ONBOARDING", "ACTIVE", "PAUSED", "COMPLETED", "LOST"]).optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role as UserRole;
  if (!hasPermission(role, "clients:view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const result = await listClients({
    status: (searchParams.get("status") as ClientStatus) || undefined,
    search: searchParams.get("search") || undefined,
    page: parseInt(searchParams.get("page") ?? "1"),
    limit: parseInt(searchParams.get("limit") ?? "20"),
    sortBy: searchParams.get("sortBy") || "createdAt",
    sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "desc",
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role as UserRole;
  if (!hasPermission(role, "clients:create")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createClientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
  }

  const client = await createClient(parsed.data, session.user.id);
  return NextResponse.json(client, { status: 201 });
}
