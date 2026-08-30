import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { listAttendance } from "@/services/attendance.service";
import type { UserRole } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user.role as UserRole, "attendance:view_own")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const canViewAll = hasPermission(session.user.role as UserRole, "attendance:view_all");

  // Non-admins only see own records
  let employeeId = searchParams.get("employeeId") ?? undefined;
  if (!canViewAll) {
    const { prisma } = await import("@/lib/prisma");
    const emp = await prisma.employee.findUnique({ where: { userId: session.user.id }, select: { id: true } });
    employeeId = emp?.id;
  }

  const from = searchParams.get("from") ? new Date(searchParams.get("from")!) : undefined;
  const to = searchParams.get("to") ? new Date(searchParams.get("to")!) : undefined;

  const result = await listAttendance({
    employeeId,
    from,
    to,
    status: searchParams.get("status") as never ?? undefined,
    page: parseInt(searchParams.get("page") ?? "1"),
    limit: parseInt(searchParams.get("limit") ?? "50"),
  });

  return NextResponse.json({ data: result.records, meta: { total: result.total, pages: result.pages } });
}
