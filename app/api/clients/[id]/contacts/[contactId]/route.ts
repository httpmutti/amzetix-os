import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { UserRole } from "@prisma/client";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  position: z.string().optional(),
  isPrimary: z.boolean().optional(),
  notes: z.string().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; contactId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user.role as UserRole, "contacts:edit")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, contactId } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.isPrimary) {
    await prisma.clientContact.updateMany({ where: { clientId: id }, data: { isPrimary: false } });
  }

  const contact = await prisma.clientContact.update({
    where: { id: contactId },
    data: parsed.data,
  });

  return NextResponse.json({ data: contact });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ contactId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user.role as UserRole, "contacts:delete")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { contactId } = await params;
  await prisma.clientContact.delete({ where: { id: contactId } });

  return NextResponse.json({ data: null });
}
