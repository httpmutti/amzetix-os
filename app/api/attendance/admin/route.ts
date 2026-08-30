import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { checkIn, checkOut, getTodayAttendance } from "@/services/attendance.service";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { UserRole } from "@prisma/client";
import { startOfDay } from "date-fns";

// GET: today's attendance for all employees (for admin panel)
export async function GET(req: Request) {
  void req;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user.role as UserRole, "attendance:view_all")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const today = startOfDay(new Date());

  const employees = await prisma.employee.findMany({
    where: { status: "ACTIVE", deletedAt: null },
    select: {
      id: true, firstName: true, lastName: true, position: true, profileImage: true,
      attendances: {
        where: { date: today },
        take: 1,
      },
    },
    orderBy: { firstName: "asc" },
  });

  const data = employees.map(emp => ({
    employee: {
      id: emp.id,
      firstName: emp.firstName,
      lastName: emp.lastName,
      position: emp.position,
      profileImage: emp.profileImage,
    },
    today: emp.attendances[0] ?? null,
  }));

  return NextResponse.json({ data });
}

const actionSchema = z.object({
  employeeId: z.string().min(1),
  action: z.enum(["check-in", "check-out"]),
  manualTime: z.string().optional(), // "HH:mm" format
  notes: z.string().optional(),
});

// POST: admin clocks an employee in or out
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user.role as UserRole, "attendance:view_all")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const { employeeId, action, manualTime, notes } = parsed.data;

  // Verify employee exists
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

  // Build override datetime from HH:mm if provided
  let overrideTime: Date | undefined;
  if (manualTime) {
    const [hh, mm] = manualTime.split(":").map(Number);
    const t = new Date();
    t.setHours(hh, mm, 0, 0);
    overrideTime = t;
  }

  try {
    let record;
    if (action === "check-in") {
      record = await checkIn(employeeId, notes ?? "Clocked in by admin", undefined, overrideTime);
    } else {
      // Check if employee is checked in
      const existing = await getTodayAttendance(employeeId);
      if (!existing?.checkIn) return NextResponse.json({ error: "Employee has not checked in today" }, { status: 400 });
      record = await checkOut(employeeId, overrideTime);
    }
    return NextResponse.json({ data: record });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Action failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
