import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { getMonthlyAttendanceSummary } from "@/services/attendance.service";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user.role as UserRole, "attendance:view_own")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const month = parseInt(searchParams.get("month") ?? String(new Date().getMonth() + 1));
  const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()));
  const canViewAll = hasPermission(session.user.role as UserRole, "attendance:view_all");

  let employeeId = searchParams.get("employeeId") ?? undefined;
  if (!canViewAll || !employeeId) {
    const emp = await prisma.employee.findUnique({ where: { userId: session.user.id }, select: { id: true } });
    if (!emp) return NextResponse.json({ error: "Employee record not found" }, { status: 404 });
    employeeId = emp.id;
  }

  const summary = await getMonthlyAttendanceSummary(employeeId, month, year);
  return NextResponse.json({ data: summary });
}
