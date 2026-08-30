import { prisma } from "@/lib/prisma";
import type { ProjectStatus, ProjectPriority } from "@prisma/client";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/audit";

async function generateProjectId(): Promise<string> {
  const count = await prisma.project.count();
  return `PRJ-${String(count + 1).padStart(3, "0")}`;
}

export interface ProjectFilters {
  status?: ProjectStatus;
  clientId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export async function listProjects(filters: ProjectFilters = {}) {
  const { status, clientId, search, page = 1, limit = 50 } = filters;
  const skip = (page - 1) * limit;

  const where = {
    deletedAt: null,
    ...(status ? { status } : {}),
    ...(clientId ? { clientId } : {}),
    ...(search
      ? { OR: [{ name: { contains: search, mode: "insensitive" as const } }] }
      : {}),
  };

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { id: true, companyName: true } },
        _count: { select: { tasks: true, members: true, timeEntries: true } },
        tasks: {
          where: { deletedAt: null },
          select: { status: true },
        },
      },
    }),
    prisma.project.count({ where }),
  ]);

  return { projects, total, pages: Math.ceil(total / limit), page };
}

export async function getProjectById(id: string) {
  return prisma.project.findFirst({
    where: { id, deletedAt: null },
    include: {
      client: { select: { id: true, companyName: true } },
      tasks: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        include: {
          assignee: { select: { id: true, firstName: true, lastName: true } },
          checklists: { select: { done: true } },
          _count: { select: { checklists: true, comments: true } },
        },
      },
      members: {
        include: {
          employee: {
            select: { id: true, firstName: true, lastName: true, position: true, profileImage: true },
          },
        },
      },
      timeEntries: {
        orderBy: { startTime: "desc" },
        take: 50,
        include: {
          employee: { select: { id: true, firstName: true, lastName: true } },
          task: { select: { id: true, title: true } },
        },
      },
    },
  });
}

export async function createProject(
  data: {
    name: string;
    clientId?: string;
    service?: string;
    description?: string;
    startDate?: Date;
    dueDate?: Date;
    status?: ProjectStatus;
    priority?: ProjectPriority;
    budget?: number;
    currency?: string;
    estimatedHours?: number;
    projectManagerId?: string;
  },
  performedById: string
) {
  const projectId = await generateProjectId();

  const project = await prisma.project.create({
    data: {
      projectId,
      name: data.name,
      clientId: data.clientId || null,
      service: data.service as never || null,
      description: data.description,
      startDate: data.startDate,
      dueDate: data.dueDate,
      status: data.status ?? "PLANNED",
      priority: data.priority ?? "MEDIUM",
      budget: data.budget,
      currency: data.currency ?? "USD",
      estimatedHours: data.estimatedHours,
      projectManagerId: data.projectManagerId,
    },
  });

  await createAuditLog({
    performedById,
    action: AUDIT_ACTIONS.CREATE,
    entity: "Project",
    entityId: project.id,
    newValues: { name: project.name, projectId: project.projectId },
    description: `Created project ${project.projectId}: ${project.name}`,
  });

  return project;
}

export async function updateProject(
  id: string,
  data: Partial<{
    name: string;
    clientId: string | null;
    description: string;
    startDate: Date | null;
    dueDate: Date | null;
    status: ProjectStatus;
    priority: ProjectPriority;
    budget: number | null;
    currency: string;
    estimatedHours: number | null;
    projectManagerId: string | null;
  }>,
  performedById: string
) {
  const project = await prisma.project.update({
    where: { id },
    data: {
      ...data,
      updatedAt: new Date(),
    },
  });

  await createAuditLog({
    performedById,
    action: AUDIT_ACTIONS.UPDATE,
    entity: "Project",
    entityId: project.id,
    description: `Updated project ${project.projectId}`,
  });

  return project;
}

export async function deleteProject(id: string, performedById: string) {
  const project = await prisma.project.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await createAuditLog({
    performedById,
    action: AUDIT_ACTIONS.DELETE,
    entity: "Project",
    entityId: project.id,
    description: `Deleted project ${project.projectId}`,
  });
}

export async function addProjectMember(projectId: string, employeeId: string, role?: string) {
  return prisma.projectMember.create({
    data: { projectId, employeeId, role },
    include: {
      employee: { select: { id: true, firstName: true, lastName: true, position: true } },
    },
  });
}

export async function removeProjectMember(projectId: string, memberId: string) {
  return prisma.projectMember.delete({ where: { id: memberId } });
}
