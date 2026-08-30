import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { getLeaveRequestById, cancelLeaveRequest } from "@/services/leave.service";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user.role as UserRole, "leave:view_own")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const request = await getLeaveRequestById(id);
  if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: request });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const emp = await prisma.employee.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!emp) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

  try {
    await cancelLeaveRequest(id, emp.id);
    return NextResponse.json({ data: null });
  } catch {
    return NextResponse.json({ error: "Cannot cancel this request" }, { status: 400 });
  }
}
