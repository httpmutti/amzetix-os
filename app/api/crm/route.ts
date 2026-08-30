import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { listLeads, createLead } from "@/services/lead.service";
import { z } from "zod";
import type { UserRole, LeadStatus, Service } from "@prisma/client";

const createLeadSchema = z.object({
  name: z.string().min(1, "Name required"),
  company: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  country: z.string().optional(),
  website: z.string().optional(),
  service: z.string().optional(),
  estimatedValue: z.number().optional(),
  currency: z.string().optional(),
  source: z.string().optional(),
  status: z.string().optional(),
  notes: z.string().optional(),
  nextFollowUp: z.string().datetime().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user.role as UserRole, "crm:view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const result = await listLeads({
    status: (searchParams.get("status") as LeadStatus) || undefined,
    service: (searchParams.get("service") as Service) || undefined,
    search: searchParams.get("search") || undefined,
    page: parseInt(searchParams.get("page") ?? "1"),
    limit: parseInt(searchParams.get("limit") ?? "100"),
    sortBy: searchParams.get("sortBy") || "createdAt",
    sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "desc",
  });

  return NextResponse.json({ data: result });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user.role as UserRole, "crm:create")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createLeadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
  }

  const lead = await createLead(
    {
      ...parsed.data,
      service: parsed.data.service as Service | undefined,
      status: parsed.data.status as LeadStatus | undefined,
      nextFollowUp: parsed.data.nextFollowUp ? new Date(parsed.data.nextFollowUp) : undefined,
    },
    session.user.id
  );

  return NextResponse.json({ data: lead }, { status: 201 });
}
