import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { getTaskById, updateTask, deleteTask } from "@/services/task.service";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { z } from "zod";
import type { UserRole, TaskStatus, TaskPriority } from "@prisma/client";

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  projectId: z.string().nullable().optional(),
  assigneeId: z.string().nullable().optional(),
  priority: z.enum(["LOW","MEDIUM","HIGH","URGENT"]).optional(),
  status: z.enum(["BACKLOG","TODO","IN_PROGRESS","IN_REVIEW","CLIENT_REVIEW","COMPLETED","BLOCKED"]).optional(),
  dueDate: z.string().nullable().optional(),
  estimatedHours: z.coerce.number().nullable().optional(),
  tags: z.array(z.string()).optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user.role as UserRole, "tasks:view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const task = await getTaskById(id);
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ data: task });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user.role as UserRole, "tasks:edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });

  const prevTask = await getTaskById(id);
  const { dueDate, ...rest } = parsed.data;
  const task = await updateTask(
    id,
    {
      ...rest,
      priority: rest.priority as TaskPriority | undefined,
      status: rest.status as TaskStatus | undefined,
      dueDate: dueDate === null ? null : dueDate ? new Date(dueDate) : undefined,
    },
    session.user.id!
  );

  // Notify new assignee when assignment changes
  const newAssigneeId = rest.assigneeId;
  if (newAssigneeId && newAssigneeId !== prevTask?.assigneeId) {
    const employee = await prisma.employee.findUnique({
      where: { id: newAssigneeId },
      select: { userId: true, firstName: true, lastName: true },
    });
    if (employee?.userId && employee.userId !== session.user.id) {
      await createNotification({
        userId: employee.userId,
        type: "TASK_ASSIGNED",
        title: "Task assigned to you",
        message: `You have been assigned task: ${task.title}`,
        link: `/tasks`,
      });
    }
  }

  return NextResponse.json({ data: task });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user.role as UserRole, "tasks:delete")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await deleteTask(id, session.user.id!);

  return NextResponse.json({ success: true });
}
