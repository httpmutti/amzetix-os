import { prisma } from "@/lib/prisma";

export interface TimeFilters {
  employeeId?: string;
  projectId?: string;
  taskId?: string;
  from?: Date;
  to?: Date;
  limit?: number;
}

const timeInclude = {
  project: { select: { id: true, projectId: true, name: true } },
  task: { select: { id: true, taskId: true, title: true } },
  employee: { select: { id: true, firstName: true, lastName: true } },
} as const;

export async function listTimeEntries(filters: TimeFilters = {}) {
  const { employeeId, projectId, taskId, from, to, limit = 200 } = filters;

  return prisma.timeEntry.findMany({
    where: {
      ...(employeeId ? { employeeId } : {}),
      ...(projectId ? { projectId } : {}),
      ...(taskId ? { taskId } : {}),
      ...(from ? { startTime: { gte: from } } : {}),
      ...(to ? { startTime: { lte: to } } : {}),
    },
    orderBy: { startTime: "desc" },
    take: limit,
    include: timeInclude,
  });
}

export async function getActiveEntry(employeeId: string) {
  return prisma.timeEntry.findFirst({
    where: { employeeId, endTime: null },
    include: timeInclude,
  });
}

export async function startTimer(employeeId: string, projectId?: string, taskId?: string, description?: string) {
  // Stop any running entry first
  const running = await getActiveEntry(employeeId);
  if (running) {
    const now = new Date();
    const duration = Math.round((now.getTime() - running.startTime.getTime()) / 60000);
    await prisma.timeEntry.update({
      where: { id: running.id },
      data: { endTime: now, duration },
    });
  }

  return prisma.timeEntry.create({
    data: {
      employeeId,
      projectId: projectId || null,
      taskId: taskId || null,
      description: description || null,
      startTime: new Date(),
      isManual: false,
    },
    include: timeInclude,
  });
}

export async function stopTimer(employeeId: string) {
  const running = await getActiveEntry(employeeId);
  if (!running) return null;

  const now = new Date();
  const duration = Math.round((now.getTime() - running.startTime.getTime()) / 60000);

  return prisma.timeEntry.update({
    where: { id: running.id },
    data: { endTime: now, duration },
    include: timeInclude,
  });
}

export async function createManualEntry(data: {
  employeeId: string;
  projectId?: string;
  taskId?: string;
  description?: string;
  startTime: Date;
  endTime: Date;
}) {
  const duration = Math.round((data.endTime.getTime() - data.startTime.getTime()) / 60000);

  return prisma.timeEntry.create({
    data: {
      employeeId: data.employeeId,
      projectId: data.projectId || null,
      taskId: data.taskId || null,
      description: data.description || null,
      startTime: data.startTime,
      endTime: data.endTime,
      duration,
      isManual: true,
    },
    include: timeInclude,
  });
}

export async function updateTimeEntry(
  id: string,
  data: { description?: string; projectId?: string | null; taskId?: string | null; startTime?: Date; endTime?: Date }
) {
  const entry = await prisma.timeEntry.findUnique({ where: { id } });
  const start = data.startTime ?? entry?.startTime ?? new Date();
  const end = data.endTime ?? entry?.endTime;
  const duration = end ? Math.round((end.getTime() - start.getTime()) / 60000) : entry?.duration;

  return prisma.timeEntry.update({
    where: { id },
    data: { ...data, duration },
    include: timeInclude,
  });
}

export async function deleteTimeEntry(id: string) {
  return prisma.timeEntry.delete({ where: { id } });
}

export async function getAllActiveEntries() {
  return prisma.timeEntry.findMany({
    where: { endTime: null },
    include: {
      employee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profileImage: true,
          position: true,
        },
      },
      project: { select: { id: true, name: true } },
      task: { select: { id: true, title: true } },
    },
    orderBy: { startTime: "asc" },
  });
}

export async function getWeeklyHours() {
  // Mon–Sat of current week
  const now = new Date();
  const day = now.getDay(); // 0 = Sun
  const diffToMon = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMon);
  monday.setHours(0, 0, 0, 0);
  const saturday = new Date(monday);
  saturday.setDate(monday.getDate() + 5);
  saturday.setHours(23, 59, 59, 999);

  const entries = await prisma.timeEntry.findMany({
    where: {
      startTime: { gte: monday, lte: saturday },
      endTime: { not: null },
    },
    include: {
      employee: {
        select: { id: true, firstName: true, lastName: true, profileImage: true, position: true },
      },
    },
  });

  // Aggregate minutes per employee
  const map: Record<string, { employee: (typeof entries)[0]["employee"]; totalMinutes: number }> = {};
  for (const e of entries) {
    const empId = e.employeeId;
    if (!map[empId]) map[empId] = { employee: e.employee, totalMinutes: 0 };
    map[empId].totalMinutes += e.duration ?? 0;
  }

  // Also include active (running) entries
  const active = await prisma.timeEntry.findMany({
    where: { startTime: { gte: monday }, endTime: null },
    include: {
      employee: {
        select: { id: true, firstName: true, lastName: true, profileImage: true, position: true },
      },
    },
  });
  for (const e of active) {
    const liveMin = Math.floor((Date.now() - e.startTime.getTime()) / 60000);
    if (!map[e.employeeId]) map[e.employeeId] = { employee: e.employee, totalMinutes: 0 };
    map[e.employeeId].totalMinutes += liveMin;
  }

  return {
    weekStart: monday.toISOString(),
    weekEnd: saturday.toISOString(),
    summary: Object.values(map).map(({ employee, totalMinutes }) => ({
      employee,
      totalMinutes,
      totalHours: Math.round((totalMinutes / 60) * 10) / 10,
      shortfall: Math.max(0, 45 * 60 - totalMinutes), // minutes below 45h
      meetsTarget: totalMinutes >= 45 * 60,
    })),
  };
}

export async function getMonthlyHours() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  // Count elapsed working days (Mon–Sat, no Sunday)
  let elapsedWorkingDays = 0;
  const cursor = new Date(monthStart);
  while (cursor <= todayEnd) {
    if (cursor.getDay() !== 0) elapsedWorkingDays++;
    cursor.setDate(cursor.getDate() + 1);
  }

  const entries = await prisma.timeEntry.findMany({
    where: { startTime: { gte: monthStart, lte: todayEnd }, endTime: { not: null } },
    include: {
      employee: {
        select: { id: true, firstName: true, lastName: true, profileImage: true, position: true },
      },
    },
  });

  type EmpRow = { employee: (typeof entries)[0]["employee"]; totalMinutes: number };
  const map: Record<string, EmpRow> = {};
  for (const e of entries) {
    if (!map[e.employeeId]) map[e.employeeId] = { employee: e.employee, totalMinutes: 0 };
    map[e.employeeId].totalMinutes += e.duration ?? 0;
  }

  // Include running entries
  const active = await prisma.timeEntry.findMany({
    where: { startTime: { gte: monthStart }, endTime: null },
    include: {
      employee: {
        select: { id: true, firstName: true, lastName: true, profileImage: true, position: true },
      },
    },
  });
  for (const e of active) {
    const liveMin = Math.floor((Date.now() - e.startTime.getTime()) / 60000);
    if (!map[e.employeeId]) map[e.employeeId] = { employee: e.employee, totalMinutes: 0 };
    map[e.employeeId].totalMinutes += liveMin;
  }

  const targetMinutes = elapsedWorkingDays * 7.5 * 60; // 7.5 h per working day

  return {
    month: monthStart.toISOString(),
    elapsedWorkingDays,
    targetMinutes,
    summary: Object.values(map).map(({ employee, totalMinutes }) => ({
      employee,
      totalMinutes,
      totalHours: Math.round((totalMinutes / 60) * 10) / 10,
      shortfall: Math.max(0, targetMinutes - totalMinutes),
      meetsTarget: totalMinutes >= targetMinutes,
    })),
  };
}

export async function adminStartTimer(
  employeeId: string,
  startTime: Date,
  options: { projectId?: string; taskId?: string; description?: string }
) {
  // Stop any running entry first
  const running = await getActiveEntry(employeeId);
  if (running) {
    const now = new Date();
    const duration = Math.round((now.getTime() - running.startTime.getTime()) / 60000);
    await prisma.timeEntry.update({ where: { id: running.id }, data: { endTime: now, duration } });
  }

  return prisma.timeEntry.create({
    data: {
      employeeId,
      projectId: options.projectId || null,
      taskId: options.taskId || null,
      description: options.description || null,
      startTime,
      isManual: true,
    },
    include: timeInclude,
  });
}

export async function adminStopTimer(employeeId: string, endTime?: Date) {
  if (!endTime) return stopTimer(employeeId);

  const running = await getActiveEntry(employeeId);
  if (!running) return null;

  const duration = Math.round((endTime.getTime() - running.startTime.getTime()) / 60000);

  return prisma.timeEntry.update({
    where: { id: running.id },
    data: { endTime, duration },
    include: timeInclude,
  });
}
