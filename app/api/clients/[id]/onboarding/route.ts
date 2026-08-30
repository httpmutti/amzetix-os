import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { UserRole } from "@prisma/client";

const updateSchema = z.object({
  contractSigned: z.boolean().optional(),
  billingInfoReceived: z.boolean().optional(),
  initialInvoiceCreated: z.boolean().optional(),
  initialPaymentReceived: z.boolean().optional(),
  websiteAccessReceived: z.boolean().optional(),
  hostingAccessReceived: z.boolean().optional(),
  domainAccessReceived: z.boolean().optional(),
  analyticsAccessReceived: z.boolean().optional(),
  searchConsoleAccess: z.boolean().optional(),
  socialMediaAccess: z.boolean().optional(),
  brandAssetsReceived: z.boolean().optional(),
  requirementsGathered: z.boolean().optional(),
  projectScopeDefined: z.boolean().optional(),
  teamAssigned: z.boolean().optional(),
  projectCreated: z.boolean().optional(),
  commChannelCreated: z.boolean().optional(),
  customItems: z.array(z.object({ label: z.string(), done: z.boolean() })).optional(),
  notes: z.string().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user.role as UserRole, "clients:view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const onboarding = await prisma.clientOnboarding.findUnique({ where: { clientId: id } });

  return NextResponse.json({ data: onboarding });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user.role as UserRole, "clients:edit")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
  }

  const onboarding = await prisma.clientOnboarding.upsert({
    where: { clientId: id },
    update: { ...parsed.data, customItems: parsed.data.customItems as object[] | undefined },
    create: { clientId: id, ...parsed.data, customItems: parsed.data.customItems as object[] | undefined ?? [] },
  });

  return NextResponse.json({ data: onboarding });
}
