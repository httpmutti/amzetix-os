import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ensureLeaveBalances } from "@/services/leave.service";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()));

  let employeeId = searchParams.get("employeeId") ?? undefined;
  if (!employeeId) {
    const emp = await prisma.employee.findUnique({ where: { userId: session.user.id }, select: { id: true } });
    if (!emp) return NextResponse.json({ data: [] });
    employeeId = emp.id;
  }

  const balances = await ensureLeaveBalances(employeeId, year);
  return NextResponse.json({ data: balances });
}
