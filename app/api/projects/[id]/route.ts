import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { getProjectById, updateProject, deleteProject } from "@/services/project.service";
import { z } from "zod";
import type { UserRole, ProjectStatus, ProjectPriority } from "@prisma/client";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  clientId: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  status: z.enum(["PLANNED","ACTIVE","ON_HOLD","IN_REVIEW","CLIENT_REVIEW","COMPLETED","CANCELLED"]).optional(),
  priority: z.enum(["LOW","MEDIUM","HIGH","URGENT"]).optional(),
  budget: z.coerce.number().nullable().optional(),
  currency: z.string().optional(),
  estimatedHours: z.coerce.number().nullable().optional(),
  projectManagerId: z.string().nullable().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user.role as UserRole, "projects:view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const project = await getProjectById(id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ data: project });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user.role as UserRole, "projects:edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });

  const { startDate, dueDate, description, ...rest } = parsed.data;
  const project = await updateProject(
    id,
    {
      ...rest,
      status: rest.status as ProjectStatus | undefined,
      priority: rest.priority as ProjectPriority | undefined,
      description: description ?? undefined,
      startDate: startDate === null ? null : startDate ? new Date(startDate) : undefined,
      dueDate: dueDate === null ? null : dueDate ? new Date(dueDate) : undefined,
    },
    session.user.id!
  );

  return NextResponse.json({ data: project });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user.role as UserRole, "projects:delete")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await deleteProject(id, session.user.id!);

  return NextResponse.json({ success: true });
}
