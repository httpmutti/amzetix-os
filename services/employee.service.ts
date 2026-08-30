import { prisma } from "@/lib/prisma";
import type { EmployeeStatus, EmploymentType, UserRole } from "@prisma/client";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/audit";

async function generateEmployeeId(): Promise<string> {
  const count = await prisma.employee.count();
  return `EMP-${String(count + 1).padStart(3, "0")}`;
}

export interface EmployeeFilters {
  status?: EmployeeStatus;
  departmentId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export async function listEmployees(filters: EmployeeFilters = {}) {
  const { status, departmentId, search, page = 1, limit = 50 } = filters;
  const skip = (page - 1) * limit;

  const where = {
    deletedAt: null,
    ...(status ? { status } : {}),
    ...(departmentId ? { departmentId } : {}),
    ...(search
      ? {
          OR: [
            { firstName: { contains: search, mode: "insensitive" as const } },
            { lastName: { contains: search, mode: "insensitive" as const } },
            { position: { contains: search, mode: "insensitive" as const } },
            { employeeId: { contains: search, mode: "insensitive" as const } },
            { user: { email: { contains: search, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const [employees, total] = await Promise.all([
    prisma.employee.findMany({
      where,
      skip,
      take: limit,
      orderBy: { firstName: "asc" },
      include: {
        department: { select: { id: true, name: true } },
        user: { select: { id: true, email: true, name: true, role: true } },
        _count: { select: { tasks: true, leaveRequests: true } },
      },
    }),
    prisma.employee.count({ where }),
  ]);

  return { employees, total, pages: Math.ceil(total / limit), page };
}

export async function getEmployeeById(id: string) {
  return prisma.employee.findFirst({
    where: { id, deletedAt: null },
    include: {
      department: { select: { id: true, name: true } },
      manager: { select: { id: true, firstName: true, lastName: true, position: true } },
      user: { select: { id: true, email: true, name: true, role: true } },
      salaryHistory: { orderBy: { effectiveDate: "desc" }, take: 10 },
      leaveBalances: { include: { leaveType: true } },
      _count: { select: { tasks: true, leaveRequests: true, timeEntries: true, projectMembers: true } },
    },
  });
}

export async function createEmployee(
  data: {
    userId: string;
    firstName: string;
    lastName: string;
    phone?: string;
    position?: string;
    departmentId?: string;
    managerId?: string;
    joiningDate?: Date;
    employmentType?: EmploymentType;
    baseSalary?: number;
    currency?: string;
    workingHours?: number;
    address?: string;
    notes?: string;
    emergencyContact?: { name: string; phone: string; relation: string };
  },
  performedById: string
) {
  const employeeId = await generateEmployeeId();

  const employee = await prisma.employee.create({
    data: {
      employeeId,
      userId: data.userId,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      position: data.position,
      departmentId: data.departmentId || null,
      managerId: data.managerId || null,
      joiningDate: data.joiningDate,
      employmentType: data.employmentType ?? "FULL_TIME",
      baseSalary: data.baseSalary ?? 0,
      currency: data.currency ?? "USD",
      workingHours: data.workingHours ?? 8,
      address: data.address,
      notes: data.notes,
      emergencyContact: data.emergencyContact ?? undefined,
    },
  });

  if (data.baseSalary) {
    await prisma.salaryHistory.create({
      data: {
        employeeId: employee.id,
        baseSalary: data.baseSalary,
        currency: data.currency ?? "USD",
        effectiveDate: data.joiningDate ?? new Date(),
        changedBy: performedById,
        notes: "Initial salary",
      },
    });
  }

  await createAuditLog({
    performedById,
    action: AUDIT_ACTIONS.CREATE,
    entity: "Employee",
    entityId: employee.id,
    newValues: { employeeId: employee.employeeId, name: `${employee.firstName} ${employee.lastName}` },
    description: `Created employee ${employee.employeeId}: ${employee.firstName} ${employee.lastName}`,
  });

  return employee;
}

export async function updateEmployee(
  id: string,
  data: Partial<{
    firstName: string;
    lastName: string;
    phone: string;
    position: string;
    departmentId: string | null;
    managerId: string | null;
    joiningDate: Date | null;
    employmentType: EmploymentType;
    baseSalary: number;
    currency: string;
    workingHours: number;
    status: EmployeeStatus;
    address: string;
    notes: string;
    emergencyContact: { name: string; phone: string; relation: string };
    profileImage: string;
  }>,
  performedById: string
) {
  const old = await prisma.employee.findUniqueOrThrow({ where: { id } });

  const { baseSalary, ...rest } = data;

  const employee = await prisma.employee.update({
    where: { id },
    data: { ...rest, ...(baseSalary !== undefined ? { baseSalary } : {}), updatedAt: new Date() },
  });

  // Record salary change if salary changed
  if (baseSalary !== undefined && Number(baseSalary) !== Number(old.baseSalary)) {
    await prisma.salaryHistory.create({
      data: {
        employeeId: id,
        baseSalary,
        currency: data.currency ?? old.currency,
        effectiveDate: new Date(),
        changedBy: performedById,
      },
    });
  }

  await createAuditLog({
    performedById,
    action: AUDIT_ACTIONS.UPDATE,
    entity: "Employee",
    entityId: id,
    description: `Updated employee ${old.employeeId}`,
  });

  return employee;
}

export async function deleteEmployee(id: string, performedById: string) {
  const employee = await prisma.employee.update({
    where: { id },
    data: { deletedAt: new Date(), status: "TERMINATED" },
  });

  await createAuditLog({
    performedById,
    action: AUDIT_ACTIONS.DELETE,
    entity: "Employee",
    entityId: id,
    description: `Terminated employee ${employee.employeeId}`,
  });
}

export async function listDepartments() {
  return prisma.department.findMany({ orderBy: { name: "asc" } });
}
