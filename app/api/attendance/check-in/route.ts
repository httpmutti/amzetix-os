import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkIn } from "@/services/attendance.service";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const employee = await prisma.employee.findUnique({ where: { userId: session.user.id } });
    if (!employee) return NextResponse.json({ error: "Employee record not found" }, { status: 404 });

    const record = await checkIn(employee.id);
    return NextResponse.json({ data: record });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Check-in failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
