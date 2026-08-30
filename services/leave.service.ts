import { prisma } from "@/lib/prisma";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/audit";
import { differenceInCalendarDays, startOfDay } from "date-fns";

export interface LeaveFilters {
  employeeId?: string;
  status?: string;
  leaveTypeId?: string;
  year?: number;
  page?: number;
  limit?: number;
}

export async function listLeaveRequests(filters: LeaveFilters = {}) {
  const { employeeId, status, leaveTypeId, year, page = 1, limit = 50 } = filters;

  const where: Record<string, unknown> = {
    ...(employeeId && { employeeId }),
    ...(status && { status }),
    ...(leaveTypeId && { leaveTypeId }),
    ...(year && {
      startDate: { gte: new Date(year, 0, 1) },
      endDate: { lte: new Date(year, 11, 31) },
    }),
  };

  const [requests, total] = await Promise.all([
    prisma.leaveRequest.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, position: true, profileImage: true } },
        leaveType: true,
      },
    }),
    prisma.leaveRequest.count({ where }),
  ]);

  return { requests, total, pages: Math.ceil(total / limit), page };
}

export async function getLeaveRequestById(id: string) {
  return prisma.leaveRequest.findUnique({
    where: { id },
    include: {
      employee: { select: { id: true, firstName: true, lastName: true, position: true } },
      leaveType: true,
    },
  });
}

export async function createLeaveRequest(
  data: {
    employeeId: string;
    leaveTypeId: string;
    startDate: Date;
    endDate: Date;
    reason?: string;
  }
) {
  const days = differenceInCalendarDays(
    startOfDay(data.endDate),
    startOfDay(data.startDate)
  ) + 1;

  const request = await prisma.leaveRequest.create({
    data: {
      employeeId: data.employeeId,
      leaveTypeId: data.leaveTypeId,
      startDate: startOfDay(data.startDate),
      endDate: startOfDay(data.endDate),
      days,
      reason: data.reason,
      status: "PENDING",
    },
    include: { employee: true, leaveType: true },
  });

  return request;
}

export async function approveLeaveRequest(id: string, approvedById: string) {
  const request = await prisma.leaveRequest.update({
    where: { id },
    data: { status: "APPROVED", approvedById, approvedAt: new Date() },
    include: { employee: true, leaveType: true },
  });

  // Deduct from leave balance
  const year = new Date(request.startDate).getFullYear();
  await prisma.leaveBalance.updateMany({
    where: { employeeId: request.employeeId, leaveTypeId: request.leaveTypeId, year },
    data: { used: { increment: request.days }, remaining: { decrement: request.days } },
  });

  await createAuditLog({
    performedById: approvedById,
    action: AUDIT_ACTIONS.APPROVE,
    entity: "LeaveRequest",
    entityId: id,
    description: `Approved leave request for ${request.employee.firstName} ${request.employee.lastName}`,
  });

  return request;
}

export async function rejectLeaveRequest(id: string, rejectedById: string, note?: string) {
  const request = await prisma.leaveRequest.update({
    where: { id },
    data: { status: "REJECTED", rejectedAt: new Date(), rejectionNote: note },
    include: { employee: true, leaveType: true },
  });

  await createAuditLog({
    performedById: rejectedById,
    action: AUDIT_ACTIONS.REJECT,
    entity: "LeaveRequest",
    entityId: id,
    description: `Rejected leave request for ${request.employee.firstName} ${request.employee.lastName}`,
  });

  return request;
}

export async function cancelLeaveRequest(id: string, employeeId: string) {
  return prisma.leaveRequest.update({
    where: { id, employeeId, status: "PENDING" },
    data: { status: "CANCELLED" },
  });
}

export async function listLeaveTypes() {
  return prisma.leaveType.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
}

export async function createLeaveType(data: {
  name: string;
  description?: string;
  daysAllowed: number;
  isPaid?: boolean;
}) {
  return prisma.leaveType.create({ data: { ...data, isPaid: data.isPaid ?? true } });
}

export async function getLeaveBalances(employeeId: string, year: number) {
  return prisma.leaveBalance.findMany({
    where: { employeeId, year },
    include: { leaveType: true },
  });
}

export async function ensureLeaveBalances(employeeId: string, year: number) {
  const types = await prisma.leaveType.findMany({ where: { isActive: true } });
  for (const type of types) {
    await prisma.leaveBalance.upsert({
      where: { employeeId_leaveTypeId_year: { employeeId, leaveTypeId: type.id, year } },
      update: {},
      create: {
        employeeId,
        leaveTypeId: type.id,
        year,
        allocated: type.daysAllowed,
        used: 0,
        remaining: type.daysAllowed,
      },
    });
  }
  return getLeaveBalances(employeeId, year);
}
