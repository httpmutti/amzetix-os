import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { listTasks, createTask } from "@/services/task.service";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { UserRole, TaskStatus, TaskPriority } from "@prisma/client";

const createSchema = z.object({
  title: z.string().min(1, "Title required"),
  description: z.string().optional(),
  projectId: z.string().optional(),
  assigneeId: z.string().optional(),
  priority: z.enum(["LOW","MEDIUM","HIGH","URGENT"]).optional(),
  status: z.enum(["BACKLOG","TODO","IN_PROGRESS","IN_REVIEW","CLIENT_REVIEW","COMPLETED","BLOCKED"]).optional(),
  visibility: z.enum(["INTERNAL","CLIENT"]).optional(),
  dueDate: z.string().optional(),
  estimatedHours: z.coerce.number().optional(),
  tags: z.array(z.string()).optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role as UserRole;
  if (!hasPermission(role, "tasks:view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const myOnly = searchParams.get("my") === "true";

  let myEmployeeId: string | undefined;
  if (myOnly) {
    const emp = await prisma.employee.findFirst({ where: { userId: session.user.id! } });
    myEmployeeId = emp?.id;
  }

  const result = await listTasks({
    projectId: searchParams.get("projectId") || undefined,
    assigneeId: searchParams.get("assigneeId") || undefined,
    status: (searchParams.get("status") as TaskStatus) || undefined,
    priority: (searchParams.get("priority") as TaskPriority) || undefined,
    myEmployeeId,
    search: searchParams.get("search") || undefined,
    page: parseInt(searchParams.get("page") ?? "1"),
    limit: parseInt(searchParams.get("limit") ?? "100"),
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role as UserRole;
  if (!hasPermission(role, "tasks:create")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });

  const emp = await prisma.employee.findFirst({ where: { userId: session.user.id! } });
  const { dueDate, ...rest } = parsed.data;

  const task = await createTask(
    {
      ...rest,
      priority: rest.priority as TaskPriority | undefined,
      status: rest.status as TaskStatus | undefined,
      visibility: rest.visibility as import("@prisma/client").TaskVisibility | undefined,
      creatorId: emp?.id,
      dueDate: dueDate ? new Date(dueDate) : undefined,
    },
    session.user.id!
  );

  return NextResponse.json({ data: task }, { status: 201 });
}
