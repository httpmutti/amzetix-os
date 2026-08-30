import { prisma } from "@/lib/prisma";
import type { AttendanceStatus } from "@prisma/client";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/audit";
import { startOfDay } from "date-fns";

export async function checkIn(employeeId: string, notes?: string, location?: string, overrideTime?: Date) {
  const today = startOfDay(new Date());

  const existing = await prisma.attendance.findUnique({
    where: { employeeId_date: { employeeId, date: today } },
  });

  if (existing?.checkIn) {
    throw new Error("Already checked in today");
  }

  const now = overrideTime ?? new Date();
  // Determine if late (assume 9:00 AM as start time — configurable via settings)
  const workStart = new Date(today);
  workStart.setHours(9, 0, 0, 0);
  const lateMinutes = now > workStart ? Math.floor((now.getTime() - workStart.getTime()) / 60000) : 0;
  const status: AttendanceStatus = lateMinutes > 15 ? "LATE" : "PRESENT";

  if (existing) {
    return prisma.attendance.update({
      where: { id: existing.id },
      data: { checkIn: now, lateMinutes, status, notes, location },
    });
  }

  return prisma.attendance.create({
    data: {
      employeeId,
      date: today,
      checkIn: now,
      lateMinutes,
      status,
      notes,
      location,
    },
  });
}

export async function checkOut(employeeId: string, overrideTime?: Date) {
  const today = startOfDay(new Date());

  const attendance = await prisma.attendance.findUnique({
    where: { employeeId_date: { employeeId, date: today } },
  });

  if (!attendance?.checkIn) throw new Error("Not checked in today");
  if (attendance.checkOut) throw new Error("Already checked out today");

  const now = overrideTime ?? new Date();
  const totalMinutes = Math.floor(
    (now.getTime() - attendance.checkIn.getTime()) / 60000
  );

  // Overtime if > 8 hours (480 minutes)
  const overtimeMin = Math.max(0, totalMinutes - 480);

  return prisma.attendance.update({
    where: { id: attendance.id },
    data: { checkOut: now, totalMinutes, overtimeMin },
  });
}

export async function getTodayAttendance(employeeId: string) {
  const today = startOfDay(new Date());
  return prisma.attendance.findUnique({
    where: { employeeId_date: { employeeId, date: today } },
  });
}

export interface AttendanceFilters {
  employeeId?: string;
  from?: Date;
  to?: Date;
  status?: AttendanceStatus;
  page?: number;
  limit?: number;
}

export async function listAttendance(filters: AttendanceFilters = {}) {
  const { employeeId, from, to, status, page = 1, limit = 50 } = filters;

  const where = {
    ...(employeeId && { employeeId }),
    ...(status && { status }),
    ...(from && to && { date: { gte: from, lte: to } }),
  };

  const [records, total] = await Promise.all([
    prisma.attendance.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { date: "desc" },
      include: {
        employee: {
          include: { user: { select: { name: true, image: true } } },
        },
      },
    }),
    prisma.attendance.count({ where }),
  ]);

  return { records, total, pages: Math.ceil(total / limit), page };
}

export async function correctAttendance(
  attendanceId: string,
  data: Partial<{
    checkIn: Date;
    checkOut: Date;
    status: AttendanceStatus;
    notes: string;
  }>,
  correctedById: string
) {
  const old = await prisma.attendance.findUniqueOrThrow({ where: { id: attendanceId } });

  const updated = await prisma.attendance.update({
    where: { id: attendanceId },
    data: {
      ...data,
      correctedBy: correctedById,
      correctedAt: new Date(),
    },
    include: { employee: { include: { user: { select: { name: true } } } } },
  });

  await createAuditLog({
    performedById: correctedById,
    action: AUDIT_ACTIONS.UPDATE,
    entity: "Attendance",
    entityId: attendanceId,
    oldValues: { status: old.status, checkIn: old.checkIn, checkOut: old.checkOut },
    newValues: data,
    description: `Corrected attendance for ${updated.employee.user.name} on ${old.date.toDateString()}`,
  });

  return updated;
}

export async function getMonthlyAttendanceSummary(employeeId: string, month: number, year: number) {
  const from = new Date(year, month - 1, 1);
  const to = new Date(year, month, 0);

  const records = await prisma.attendance.findMany({
    where: { employeeId, date: { gte: from, lte: to } },
  });

  const present = records.filter((r) => ["PRESENT", "LATE", "WORK_FROM_HOME", "HALF_DAY"].includes(r.status)).length;
  const late = records.filter((r) => r.status === "LATE").length;
  const absent = records.filter((r) => r.status === "ABSENT").length;
  const wfh = records.filter((r) => r.status === "WORK_FROM_HOME").length;
  const onLeave = records.filter((r) => ["PAID_LEAVE", "UNPAID_LEAVE"].includes(r.status)).length;
  const totalMinutes = records.reduce((s, r) => s + (r.totalMinutes ?? 0), 0);
  const totalOvertime = records.reduce((s, r) => s + (r.overtimeMin ?? 0), 0);
  const totalLateMinutes = records.reduce((s, r) => s + (r.lateMinutes ?? 0), 0);

  return { present, late, absent, wfh, onLeave, totalMinutes, totalOvertime, totalLateMinutes, records };
}
