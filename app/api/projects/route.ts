import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { listProjects, createProject } from "@/services/project.service";
import { z } from "zod";
import type { UserRole, ProjectStatus, ProjectPriority } from "@prisma/client";

const createSchema = z.object({
  name: z.string().min(1, "Name required"),
  clientId: z.string().optional(),
  service: z.string().optional(),
  description: z.string().optional(),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  status: z.enum(["PLANNED","ACTIVE","ON_HOLD","IN_REVIEW","CLIENT_REVIEW","COMPLETED","CANCELLED"]).optional(),
  priority: z.enum(["LOW","MEDIUM","HIGH","URGENT"]).optional(),
  budget: z.coerce.number().optional(),
  currency: z.string().optional(),
  estimatedHours: z.coerce.number().optional(),
  projectManagerId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role as UserRole;
  if (!hasPermission(role, "projects:view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const result = await listProjects({
    status: (searchParams.get("status") as ProjectStatus) || undefined,
    clientId: searchParams.get("clientId") || undefined,
    search: searchParams.get("search") || undefined,
    page: parseInt(searchParams.get("page") ?? "1"),
    limit: parseInt(searchParams.get("limit") ?? "50"),
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role as UserRole;
  if (!hasPermission(role, "projects:create")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });

  const { startDate, dueDate, budget, estimatedHours, ...rest } = parsed.data;

  const project = await createProject(
    {
      ...rest,
      status: rest.status as ProjectStatus | undefined,
      priority: rest.priority as ProjectPriority | undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      budget,
      estimatedHours,
    },
    session.user.id!
  );

  return NextResponse.json({ data: project }, { status: 201 });
}
