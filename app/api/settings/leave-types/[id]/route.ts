import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  daysAllowed: z.number().int().min(0).optional(),
  isPaid: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user.role, "settings:edit"))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data = await prisma.leaveType.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ data });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user.role, "settings:edit"))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const inUse = await prisma.leaveRequest.count({ where: { leaveTypeId: id } });
  if (inUse > 0)
    return NextResponse.json({ error: "Cannot delete — leave type is in use" }, { status: 409 });

  await prisma.leaveType.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
