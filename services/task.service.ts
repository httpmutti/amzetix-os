import { prisma } from "@/lib/prisma";
import type { TaskStatus, TaskPriority, TaskVisibility } from "@prisma/client";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/audit";

async function generateTaskId(): Promise<string> {
  const count = await prisma.task.count();
  return `TSK-${String(count + 1).padStart(3, "0")}`;
}

export interface TaskFilters {
  projectId?: string;
  assigneeId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  myEmployeeId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export async function listTasks(filters: TaskFilters = {}) {
  const { projectId, assigneeId, status, priority, myEmployeeId, search, page = 1, limit = 100 } = filters;
  const skip = (page - 1) * limit;

  const where = {
    deletedAt: null,
    ...(projectId ? { projectId } : {}),
    ...(assigneeId ? { assigneeId } : {}),
    ...(myEmployeeId ? { assigneeId: myEmployeeId } : {}),
    ...(status ? { status } : {}),
    ...(priority ? { priority } : {}),
    ...(search ? { title: { contains: search, mode: "insensitive" as const } } : {}),
  };

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      include: {
        project: { select: { id: true, projectId: true, name: true } },
        assignee: { select: { id: true, firstName: true, lastName: true, profileImage: true } },
        _count: { select: { checklists: true, comments: true, attachments: true } },
        checklists: { select: { done: true } },
      },
    }),
    prisma.task.count({ where }),
  ]);

  return { tasks, total, pages: Math.ceil(total / limit), page };
}

export async function getTaskById(id: string) {
  return prisma.task.findFirst({
    where: { id, deletedAt: null },
    include: {
      project: { select: { id: true, projectId: true, name: true } },
      assignee: { select: { id: true, firstName: true, lastName: true, profileImage: true } },
      creator: { select: { id: true, firstName: true, lastName: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { user: { select: { id: true, name: true, image: true } } },
      },
      checklists: { orderBy: { sortOrder: "asc" } },
      attachments: { orderBy: { createdAt: "desc" } },
    },
  });
}

export async function createTask(
  data: {
    title: string;
    description?: string;
    projectId?: string;
    assigneeId?: string;
    creatorId?: string;
    priority?: TaskPriority;
    status?: TaskStatus;
    visibility?: TaskVisibility;
    dueDate?: Date;
    estimatedHours?: number;
    tags?: string[];
  },
  performedById: string
) {
  const taskId = await generateTaskId();

  const task = await prisma.task.create({
    data: {
      taskId,
      title: data.title,
      description: data.description,
      projectId: data.projectId || null,
      assigneeId: data.assigneeId || null,
      creatorId: data.creatorId || null,
      priority: data.priority ?? "MEDIUM",
      status: data.status ?? "TODO",
      visibility: data.visibility ?? "INTERNAL",
      dueDate: data.dueDate,
      estimatedHours: data.estimatedHours,
      tags: data.tags ?? [],
    },
  });

  await createAuditLog({
    performedById,
    action: AUDIT_ACTIONS.CREATE,
    entity: "Task",
    entityId: task.id,
    newValues: { title: task.title, taskId: task.taskId },
    description: `Created task ${task.taskId}: ${task.title}`,
  });

  return task;
}

export async function updateTask(
  id: string,
  data: Partial<{
    title: string;
    description: string | null;
    projectId: string | null;
    assigneeId: string | null;
    priority: TaskPriority;
    status: TaskStatus;
    visibility: TaskVisibility;
    dueDate: Date | null;
    estimatedHours: number | null;
    completedDate: Date | null;
    tags: string[];
  }>,
  performedById: string
) {
  const updateData = { ...data } as Record<string, unknown>;
  if (data.status === "COMPLETED" && !data.completedDate) {
    updateData.completedDate = new Date();
  }

  const task = await prisma.task.update({
    where: { id },
    data: { ...updateData, updatedAt: new Date() },
  });

  await createAuditLog({
    performedById,
    action: AUDIT_ACTIONS.UPDATE,
    entity: "Task",
    entityId: task.id,
    description: `Updated task ${task.taskId}`,
  });

  return task;
}

export async function deleteTask(id: string, performedById: string) {
  const task = await prisma.task.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await createAuditLog({
    performedById,
    action: AUDIT_ACTIONS.DELETE,
    entity: "Task",
    entityId: task.id,
    description: `Deleted task ${task.taskId}`,
  });
}

export async function addTaskComment(taskId: string, userId: string, content: string) {
  return prisma.taskComment.create({
    data: { taskId, userId, content },
    include: { user: { select: { id: true, name: true, image: true } } },
  });
}

export async function toggleChecklist(checklistId: string, done: boolean) {
  return prisma.taskChecklist.update({ where: { id: checklistId }, data: { done } });
}

export async function addChecklist(taskId: string, label: string, sortOrder = 0) {
  return prisma.taskChecklist.create({ data: { taskId, label, sortOrder } });
}
