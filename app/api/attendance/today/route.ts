import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTodayAttendance } from "@/services/attendance.service";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const employee = await prisma.employee.findUnique({ where: { userId: session.user.id } });
    if (!employee) return NextResponse.json(null);

    const record = await getTodayAttendance(employee.id);
    return NextResponse.json({ data: record ?? null });
  } catch {
    return NextResponse.json({ data: null });
  }
}
